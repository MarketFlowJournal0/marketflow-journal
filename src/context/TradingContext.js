import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const TradingContext = createContext(null);
const REQUEST_TIMEOUT_MS = 12000;
const IMPORT_BACKGROUND_TIMEOUT_MS = 1800;
const IMPORT_BACKGROUND_CONCURRENCY = 6;
const ACTIVE_ACCOUNT_STORAGE_KEY = 'mf_active_account_v1';
const AUTO_BACKUP_STORAGE_PREFIX = 'mfj_journal_autobackup_v2_';
const LOCAL_TRADE_PREFIX = 'local-trade-';

export function TradingProvider({ children }) {
  const { session, user } = useAuth();
  const [trades,  setTrades]  = useState([]);
  const [loading, setLoading] = useState(true);
  const importSyncQueueRef = useRef(Promise.resolve());
  const [activeAccount, setActiveAccountState] = useState(() => {
    try {
      return window.localStorage.getItem(ACTIVE_ACCOUNT_STORAGE_KEY) || 'all';
    } catch {
      return 'all';
    }
  });
  const activeUserId = session?.user?.id || user?.id || null;

  const getActiveUserId = useCallback(async () => {
    if (activeUserId) return activeUserId;
    const { data } = await runSupabaseRequest(
      () => supabase.auth.getSession(),
      5000,
      'Checking your session took too long.',
    );
    return data?.session?.user?.id || null;
  }, [activeUserId]);

  const persistTradePayload = useCallback(async (
    payload,
    timeoutMessage = 'Saving the trade took too long.',
    fallbackMessage = 'A trade row could not be saved.',
    options = {},
  ) => {
    const shouldReturnRow = options?.returning !== false;
    const timeoutMs = Number.isFinite(options?.timeoutMs) ? options.timeoutMs : REQUEST_TIMEOUT_MS;
    try {
      const { data, error } = await runSupabaseRequest(
        (signal) => {
          let query = supabase
            .from('trades')
            .insert([payload]);

          if (shouldReturnRow) {
            query = query.select().single();
          }

          return query.abortSignal(signal);
        },
        timeoutMs,
        timeoutMessage,
      );

      if (error) {
        return {
          data: null,
          error,
          message: formatSupabaseError(error, fallbackMessage),
        };
      }

      return {
        data,
        error: null,
        message: '',
      };
    } catch (error) {
      return {
        data: null,
        error,
        message: formatSupabaseError(error, fallbackMessage),
      };
    }
  }, []);

  const fetchTrades = useCallback(async ({ preserveOnError = true } = {}) => {
    try {
      const userId = await getActiveUserId();
      if (!userId) { setTrades([]); setLoading(false); return []; }
      const { data, error } = await runSupabaseRequest(
        (signal) => supabase
          .from('trades')
          .select('*')
          .eq('user_id', userId)
          .order('open_date', { ascending: false })
          .abortSignal(signal),
        REQUEST_TIMEOUT_MS,
        'Fetching trades timed out.',
      );
      if (error) {
        console.error('fetchTrades error:', error.message, error.details);
        const recoveredTrades = readAutoBackupTrades(userId);
        if (recoveredTrades.length) {
          setTrades(recoveredTrades);
          return recoveredTrades;
        }
        if (!preserveOnError) setTrades([]);
        return [];
      }
      const normalized = (data || []).map(normalizeTradeRecord);
      const merged = mergeOptimisticTrades(normalized, readAutoBackupTrades(userId));
      setTrades(merged);
      return merged;
    } catch(error) {
      console.error('fetchTrades exception:', error);
      const fallbackTrades = activeUserId ? readAutoBackupTrades(activeUserId) : [];
      if (fallbackTrades.length) {
        setTrades(fallbackTrades);
        return fallbackTrades;
      }
      if (!preserveOnError) setTrades([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [activeUserId, getActiveUserId]);

  useEffect(() => {
    if (!activeUserId) {
      setTrades([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 5000);
    fetchTrades({ preserveOnError: false }).finally(() => clearTimeout(t));
  }, [activeUserId, fetchTrades]);

  // ── addTrade — maps all fields to Supabase columns ──────
  const addTrade = useCallback(async (tradeData) => {
    try {
      const userId = await getActiveUserId();
      if (!userId) return null;

      const payload = buildTradePayload(tradeData, userId);

      const { data, error } = await persistTradePayload(
        payload,
        'Saving the trade took too long.',
        'The trade could not be saved.',
      );

      if (error) {
        console.error('addTrade error:', error.message, error.details);
        const localTrade = createImportedTradePreview(payload, Date.now(), { localOnly: true, syncState: 'local-pending' });
        setTrades(prev => mergeOptimisticTrades(prev, [localTrade]));
        return localTrade;
      }
      if (data) {
        const normalized = normalizeTradeRecord(data);
        setTrades(prev => [normalized, ...prev]);
        return normalized;
      }
      return null;
    } catch (err) {
      console.error('addTrade exception:', err);
      const fallbackTrade = createImportedTradePreview(buildTradePayload(tradeData, activeUserId || user?.id || 'local-user'), Date.now(), { localOnly: true, syncState: 'local-pending' });
      setTrades(prev => mergeOptimisticTrades(prev, [fallbackTrade]));
      return fallbackTrade;
    }
  }, [activeUserId, getActiveUserId, persistTradePayload, user?.id]);

  const syncImportedTradesInBackground = useCallback(async (preparedTrades = [], userId) => {
    if (!Array.isArray(preparedTrades) || !preparedTrades.length || !userId) return;

    const markAsLocalVault = (optimisticTrade) => {
      if (!optimisticTrade?.id) return;
      setTrades((current) => current.map((trade) => {
        if (trade.id !== optimisticTrade.id) return trade;
        return normalizeTradeRecord({
          ...trade,
          localOnly: true,
          syncState: 'local-vault',
        });
      }));
    };

    const persistPreparedTrade = async (preparedTrade) => {
      const primaryResult = await persistTradePayload(
        preparedTrade.payload,
        'Cloud sync took too long for one trade.',
        'A trade row could not be synced to the cloud.',
        { timeoutMs: IMPORT_BACKGROUND_TIMEOUT_MS },
      );

      if (!primaryResult?.error && primaryResult?.data) {
        return normalizeTradeRecord(primaryResult.data);
      }

      if (shouldTryLegacyTradeInsert(primaryResult?.message) && preparedTrade.legacyPayload) {
        const legacyResult = await persistTradePayload(
          preparedTrade.legacyPayload,
          'Cloud sync took too long for one trade.',
          primaryResult?.message || 'A trade row could not be synced to the cloud.',
          { timeoutMs: IMPORT_BACKGROUND_TIMEOUT_MS },
        );

        if (!legacyResult?.error && legacyResult?.data) {
          return normalizeTradeRecord(legacyResult.data);
        }
      }

      return null;
    };

    for (let index = 0; index < preparedTrades.length; index += IMPORT_BACKGROUND_CONCURRENCY) {
      const chunk = preparedTrades.slice(index, index + IMPORT_BACKGROUND_CONCURRENCY);
      const results = await Promise.allSettled(chunk.map((preparedTrade) => persistPreparedTrade(preparedTrade)));
      const syncedTrades = [];

      results.forEach((result, resultIndex) => {
        const preparedTrade = chunk[resultIndex];
        if (result.status === 'fulfilled' && result.value) {
          syncedTrades.push(result.value);
          return;
        }
        markAsLocalVault(preparedTrade.optimisticTrade);
      });

      if (syncedTrades.length) {
        setTrades((current) => mergeOptimisticTrades(current, syncedTrades));
      }
    }

    void fetchTrades().catch((error) => {
      console.error('background import refresh error:', error);
    });
  }, [fetchTrades, persistTradePayload]);

  const queueImportSync = useCallback((preparedTrades = [], userId) => {
    importSyncQueueRef.current = importSyncQueueRef.current
      .catch(() => null)
      .then(() => syncImportedTradesInBackground(preparedTrades, userId))
      .catch((error) => {
        console.error('background import sync error:', error);
      });
  }, [syncImportedTradesInBackground]);

  const importTrades = useCallback(async (tradeRows = [], options = {}) => {
    try {
      const onProgress = typeof options?.onProgress === 'function' ? options.onProgress : null;
      const rows = Array.isArray(tradeRows) ? tradeRows.filter(Boolean).map(sanitizeImportedTradeInput) : [];
      if (!rows.length) return { imported: 0, skipped: 0, trades: [] };

      const userId = await getActiveUserId();
      if (!userId) {
        return {
          imported: 0,
          skipped: rows.length,
          trades: [],
          error: 'No active session found. Sign in again before importing trades.',
        };
      }

      const reportProgress = (stage = 'importing') => {
        onProgress?.({
          stage,
          total: rows.length,
          processed: 0,
          imported: 0,
          skipped: 0,
        });
      };

      reportProgress('starting');

      const preparedTrades = rows.map((tradeData, index) => {
        const payload = buildTradePayload(tradeData, userId);
        const optimisticTrade = createImportedTradePreview(payload, index, {
          localOnly: true,
          syncState: 'syncing',
        });

        return {
          index,
          payload,
          legacyPayload: buildLegacyTradePayload(tradeData, userId),
          optimisticTrade,
        };
      }).filter((preparedTrade) => String(preparedTrade.optimisticTrade?.symbol || '').trim());

      const imported = preparedTrades.length;
      const skipped = Math.max(0, rows.length - imported);
      const optimisticTrades = preparedTrades.map((preparedTrade) => preparedTrade.optimisticTrade);

      if (!optimisticTrades.length) {
        reportProgress('done');
        return {
          imported: 0,
          skipped: rows.length,
          trades: [],
          error: 'No valid trade could be prepared from this file.',
        };
      }

      setTrades((current) => mergeOptimisticTrades(current, optimisticTrades));

      reportProgress('hydrating');
      onProgress?.({
        stage: 'done',
        total: rows.length,
        processed: rows.length,
        imported,
        skipped,
      });

      queueImportSync(preparedTrades, userId);

      return {
        imported,
        skipped,
        trades: optimisticTrades,
        error: null,
        notice: 'Trades are live now. Cloud sync continues in the background.',
      };
    } catch (err) {
      console.error('importTrades exception:', err);
      throw err;
    }
  }, [getActiveUserId, queueImportSync]);

  const updateTrade = useCallback(async (id, updates) => {
    const currentTrade = trades.find(t => t.id === id);
    if (isLocalTrade(currentTrade)) {
      const normalized = normalizeTradeRecord({ ...currentTrade, ...updates, id, localOnly: true, syncState: 'local-pending' });
      setTrades(prev => prev.map(t => t.id === id ? normalized : t));
      return normalized;
    }
    const payload = mapTradeUpdates({ ...currentTrade, ...updates });
    const { data, error } = await supabase
      .from('trades').update(payload).eq('id', id).select().single();
    if (!error && data) {
      const normalized = normalizeTradeRecord(data);
      setTrades(prev => prev.map(t => t.id === id ? normalized : t));
      return normalized;
    }
    if (error) console.error('updateTrade error:', error.message, error.details);
    return null;
  }, [trades]);

  const deleteTrade = useCallback(async (id) => {
    const currentTrade = trades.find(t => t.id === id);
    if (isLocalTrade(currentTrade)) {
      setTrades(prev => prev.filter(t => t.id !== id));
      return true;
    }
    const { error } = await supabase.from('trades').delete().eq('id', id);
    if (!error) setTrades(prev => prev.filter(t => t.id !== id));
    return !error;
  }, [trades]);

  const accountOptions = useMemo(() => buildAccountOptions(trades), [trades]);
  const scopedTrades = useMemo(() => filterTradesByAccount(trades, activeAccount), [trades, activeAccount]);

  useEffect(() => {
    try {
      window.localStorage.setItem(ACTIVE_ACCOUNT_STORAGE_KEY, activeAccount || 'all');
    } catch {}
  }, [activeAccount]);

  useEffect(() => {
    if (!activeUserId) return;
    try {
      const snapshot = {
        version: 2,
        savedAt: new Date().toISOString(),
        activeAccount,
        accounts: accountOptions,
        trades,
      };
      window.localStorage.setItem(`${AUTO_BACKUP_STORAGE_PREFIX}${activeUserId}`, JSON.stringify(snapshot));
    } catch {}
  }, [accountOptions, activeAccount, activeUserId, trades]);

  useEffect(() => {
    if (activeAccount === 'all') return;
    if (!accountOptions.some((account) => account.id === activeAccount)) {
      setActiveAccountState('all');
    }
  }, [activeAccount, accountOptions]);

  const setActiveAccount = useCallback((accountId) => {
    setActiveAccountState(accountId || 'all');
  }, []);

  const deleteAllTrades = useCallback(async () => {
    try {
      const userId = await getActiveUserId();
      if (!userId) {
        return { success: false, deleted: 0, error: 'No active session found.' };
      }

      const deletedCount = trades.length;
      const { error } = await runSupabaseRequest(
        (signal) => supabase
          .from('trades')
          .delete()
          .eq('user_id', userId)
          .abortSignal(signal),
        REQUEST_TIMEOUT_MS,
        'Deleting trades timed out.',
      );

      if (error) {
        return { success: false, deleted: 0, error: formatSupabaseError(error, 'All trades could not be deleted.') };
      }

      setTrades([]);
      setActiveAccountState('all');
      return { success: true, deleted: deletedCount, error: null };
    } catch (error) {
      console.error('deleteAllTrades error:', error);
      return { success: false, deleted: 0, error: formatSupabaseError(error, 'All trades could not be deleted.') };
    }
  }, [getActiveUserId, trades.length]);

  const downloadBackup = useCallback(({ columns = [], scope = 'all' } = {}) => {
    const backupTrades = scope === 'active' ? scopedTrades : trades;
    const snapshot = {
      version: 1,
      exportedAt: new Date().toISOString(),
      scope,
      activeAccount,
      accounts: accountOptions,
      columns,
      trades: backupTrades,
    };
    downloadJsonFile(snapshot, `marketflow-backup-${new Date().toISOString().slice(0, 10)}.json`);
    return snapshot;
  }, [accountOptions, activeAccount, scopedTrades, trades]);

  const stats = useMemo(() => {
    if (!scopedTrades.length) return emptyStats();
    const closed = scopedTrades.filter(t => t.status === 'TP' || t.status === 'SL' || t.status === 'BE');
    const wins   = closed.filter(t => (t.profit_loss || 0) > 0);
    const losses = closed.filter(t => (t.profit_loss || 0) < 0);
    const bes    = closed.filter(t => (t.profit_loss || 0) === 0);
    const pnl    = closed.reduce((a, t) => a + (t.profit_loss || 0), 0);
    const winRate = closed.length ? (wins.length / closed.length) * 100 : 0;
    const avgWin  = wins.length   ? wins.reduce((a,t)=>a+(t.profit_loss||0),0)  / wins.length  : 0;
    const avgLoss = losses.length ? Math.abs(losses.reduce((a,t)=>a+(t.profit_loss||0),0) / losses.length) : 0;
    const pf      = avgLoss > 0   ? (avgWin * wins.length) / (avgLoss * losses.length) : 0;
    const best    = Math.max(...closed.map(t => t.profit_loss || 0));
    const worst   = Math.min(...closed.map(t => t.profit_loss || 0));

    const sorted  = [...closed].sort((a,b) => new Date(a.open_date)-new Date(b.open_date));
    let running = 0;
    const equity = sorted.map(t => {
      running += (t.profit_loss || 0);
      return { d: fmtDate(t.open_date), v: Math.round(running) };
    });

    const byDay = {};
    sorted.forEach(t => {
      const d = t.open_date?.split('T')[0] || '';
      if (!byDay[d]) byDay[d] = 0;
      byDay[d] += (t.profit_loss || 0);
    });
    const dailyPnl = Object.entries(byDay).slice(-7).map(([d, v]) => ({
      d: new Date(d).toLocaleDateString('en-US',{weekday:'short'}),
      v: Math.round(v), w: v >= 0
    }));

    const sessionMap = {};
    closed.forEach(t => {
      const s = t.session || 'Other';
      if (!sessionMap[s]) sessionMap[s] = { s, tp:0, sl:0, be:0, pnl:0 };
      const pnlT = t.profit_loss || 0;
      if (pnlT > 0) sessionMap[s].tp++;
      else if (pnlT < 0) sessionMap[s].sl++;
      else sessionMap[s].be++;
      sessionMap[s].pnl += pnlT;
    });
    const sessionData = Object.values(sessionMap).sort((a,b)=>b.pnl-a.pnl);

    const pairMap = {};
    const COLORS = ['#14C9E5','#00D2B8','#D7B36A','#B06EFF','#FF4DC4','#4D7CFF'];
    closed.forEach(t => {
      const p = t.symbol || 'Other';
      if (!pairMap[p]) pairMap[p] = { p, n:0, wins:0, pnl:0 };
      pairMap[p].n++;
      if ((t.profit_loss||0) > 0) pairMap[p].wins++;
      pairMap[p].pnl += (t.profit_loss||0);
    });
    const pairData = Object.values(pairMap)
      .sort((a,b)=>b.pnl-a.pnl).slice(0,6)
      .map((p,i) => ({ ...p, wr: Math.round((p.wins/p.n)*100), col: COLORS[i] }));

    const longs  = closed.filter(t => t.direction === 'Long');
    const shorts = closed.filter(t => t.direction === 'Short');
    const total  = closed.length || 1;
    const biaisData = [
      { name:'Bullish', value:Math.round((longs.length/total)*100),  color:'#00D2B8', pnl: fmt(longs.reduce((a,t)=>a+(t.profit_loss||0),0)) },
      { name:'Bearish', value:Math.round((shorts.length/total)*100), color:'#FF3D57', pnl: fmt(shorts.reduce((a,t)=>a+(t.profit_loss||0),0)) },
    ].filter(b=>b.value>0);

    let peak = 0, dd = 0, runDd = 0;
    sorted.forEach(t => {
      runDd += (t.profit_loss||0);
      if (runDd > peak) peak = runDd;
      const cur = peak > 0 ? ((runDd-peak)/peak)*100 : 0;
      if (cur < dd) dd = cur;
    });

    let wStreak = 0, lStreak = 0, curW = 0, curL = 0;
    sorted.forEach(t => {
      if ((t.profit_loss||0) > 0) { curW++; curL=0; }
      else { curL++; curW=0; }
      if (curW > wStreak) wStreak = curW;
      if (curL > lStreak) lStreak = curL;
    });

    const heatmap = ['Mon','Tue','Wed','Thu','Fri'].map(day => {
      const h = {};
      ['8h','10h','12h','14h','16h'].forEach(hr => { h[hr] = 0; });
      return { day, h };
    });
    closed.forEach(t => {
      const d = new Date(t.open_date);
      const dayIdx = (d.getDay() + 6) % 7;
      if (dayIdx < 5) {
        const hr = d.getHours();
        const hrKey = hr < 9 ? '8h' : hr < 11 ? '10h' : hr < 13 ? '12h' : hr < 15 ? '14h' : '16h';
        heatmap[dayIdx].h[hrKey] = (heatmap[dayIdx].h[hrKey] || 0) + (t.profit_loss || 0);
      }
    });

    const radarData = [
      { m:'Win Rate',   v: Math.min(100, Math.round(winRate)) },
      { m:'Profit F.',  v: Math.min(100, Math.round(pf * 25)) },
      { m:'Risk/Rew.',  v: avgLoss > 0 ? Math.min(100, Math.round((avgWin/avgLoss)*30)) : 0 },
      { m:'Sharpe',     v: Math.min(100, Math.round(Math.abs(pnl / (avgLoss||1)) * 5)) },
      { m:'Discipline', v: Math.min(100, Math.round((1 - lStreak/10)*100)) },
      { m:'Consistency',v: closed.length >= 10 ? Math.min(100, Math.round(winRate)) : Math.round(closed.length * 10) },
    ];

    return {
      pnl:        Math.round(pnl),
      pnlPct:     Math.round((pnl/10000)*100*10)/10,
      winRate:    Math.round(winRate*10)/10,
      profitFactor: Math.round(pf*100)/100,
      avgRR:      avgLoss > 0 ? `1:${Math.round((avgWin/avgLoss)*10)/10}` : '—',
      sharpe:     0,
      maxDrawdown: Math.round(dd*10)/10,
      expectancy:  Math.round(pnl / (closed.length||1)),
      totalTrades: closed.length,
      wins:        wins.length,
      losses:      losses.length,
      breakevens:  bes.length,
      avgWin:      Math.round(avgWin),
      avgLoss:     Math.round(avgLoss),
      streakWin:   wStreak,
      streakLoss:  lStreak,
      bestTrade:   Math.round(best),
      worstTrade:  Math.round(worst),
      equityData:  equity,
      dailyPnl,
      sessionData,
      pairData,
      biaisData,
      radarData,
      heatmap,
      recentTrades: scopedTrades.slice(0, 6).map(t => ({
        id:      t.id,
        pair:    t.symbol,
        dir:     t.direction || 'Long',
        res:     t.status || 'TP',
        rr:      avgLoss > 0 ? Math.round(((t.profit_loss||0)/avgLoss)*10)/10 : 0,
        pnl:     Math.round(t.profit_loss || 0),
        date:    t.open_date?.split('T')[0] || '',
        session: t.session || '—',
      })),
    };
  }, [scopedTrades]);

  return (
    <TradingContext.Provider value={{
      trades: scopedTrades,
      allTrades: trades,
      loading,
      stats,
      activeAccount,
      setActiveAccount,
      accountOptions,
      addTrade,
      importTrades,
      updateTrade,
      deleteTrade,
      deleteAllTrades,
      downloadBackup,
      fetchTrades,
    }}>
      {children}
    </TradingContext.Provider>
  );
}

export function useTradingContext() {
  return useContext(TradingContext) || {
    trades: [],
    allTrades: [],
    loading: false,
    stats: emptyStats(),
    activeAccount: 'all',
    setActiveAccount: () => null,
    accountOptions: [{ id: 'all', label: 'All Accounts', count: 0, pnl: 0 }],
    addTrade: () => null,
    importTrades: async () => ({ imported: 0, skipped: 0, trades: [] }),
    updateTrade: () => null,
    deleteTrade: () => null,
    deleteAllTrades: async () => ({ success: false, deleted: 0 }),
    downloadBackup: () => null,
    fetchTrades: async () => [],
  };
}

export function useTrades() {
  return useTradingContext();
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function emptyStats() {
  return {
    pnl:0, pnlPct:0, winRate:0, profitFactor:0, avgRR:'—', sharpe:0,
    maxDrawdown:0, expectancy:0, totalTrades:0, wins:0, losses:0, breakevens:0,
    avgWin:0, avgLoss:0, streakWin:0, streakLoss:0, bestTrade:0, worstTrade:0,
    equityData:[], dailyPnl:[], sessionData:[], pairData:[], biaisData:[],
    radarData:[], heatmap:[], recentTrades:[],
  };
}

function calcPnl(t) {
  const entry = Number(t.entry_price ?? t.entry ?? 0);
  const tp    = Number(t.exit_price  ?? t.exit  ?? t.tp ?? 0);
  const sl    = Number(t.stop_loss   ?? t.sl    ?? 0);
  const size  = Number(t.quantity    ?? t.size  ?? t.lots ?? 0);
  if (!entry || !size) return 0;
  const target = tp || sl;
  const dir    = t.direction || t.type || t.dir || 'Long';
  const diff   = dir === 'Long' ? target - entry : entry - target;
  return Math.round(diff * size * 100000 * 100) / 100;
}

function buildTradePayload(tradeData = {}, userId) {
  const normalizedTrade = sanitizeImportedTradeInput(tradeData);
  const pnl = resolveProfitLoss(tradeData);

  const symbol = normalizedTrade.symbol || normalizedTrade.pair || '';
  const direction = normalizeTradeDirection(normalizedTrade.direction || normalizedTrade.type || normalizedTrade.dir || 'Long');
  const entryPrice = nullableDatabaseNumber(normalizedTrade.entry_price ?? normalizedTrade.entry ?? normalizedTrade.open_price ?? normalizedTrade.openPrice);
  const exitPrice  = nullableDatabaseNumber(normalizedTrade.exit_price  ?? normalizedTrade.exit ?? normalizedTrade.close_price ?? normalizedTrade.closePrice);
  const stopLoss   = nullableDatabaseNumber(normalizedTrade.stop_loss   ?? normalizedTrade.sl ?? normalizedTrade.stopLoss);
  const qty        = nullableDatabaseNumber(normalizedTrade.quantity ?? normalizedTrade.size ?? normalizedTrade.lots ?? normalizedTrade.volume);
  const lots       = nullableDatabaseNumber(normalizedTrade.lots ?? normalizedTrade.size ?? normalizedTrade.quantity ?? normalizedTrade.volume);
  const psychologyScore = nullableDatabaseNumber(normalizedTrade.psychologyScore ?? normalizedTrade.psychology_score ?? normalizedTrade.disciplineScore ?? normalizedTrade.discipline_score);
  const commission = nullableDatabaseNumber(normalizedTrade.commission ?? normalizedTrade.comm);
  const swap = nullableDatabaseNumber(normalizedTrade.swap ?? normalizedTrade.overnight);
  const openDate   = normalizedTrade.open_date || normalizedTrade.date || new Date().toISOString().split('T')[0];
  const extra = normalizeJournalExtra(normalizedTrade.extra, {
    account: normalizedTrade.account,
    accountName: normalizedTrade.account_name,
    accountNumber: normalizedTrade.account_number,
    exchange: normalizedTrade.exchange,
    broker: normalizedTrade.broker,
    rrActual: normalizedTrade.rrActual ?? normalizedTrade.rr_actual ?? normalizedTrade.rr ?? normalizedTrade.metrics?.rrReel,
    result: normalizedTrade.result,
    screenshots: normalizedTrade.screenshots,
  });

  return {
    user_id:            userId,
    symbol,
    direction,
    entry_price:        entryPrice,
    exit_price:         exitPrice,
    stop_loss:          stopLoss,
    quantity:           qty,
    profit_loss:        pnl,
    status:             pnl > 0 ? 'TP' : pnl < 0 ? 'SL' : 'BE',
    open_date:          openDate,
    notes:              normalizedTrade.notes || normalizedTrade.comment || '',
    session:            normalizedTrade.session || detectSession(),
    emotion_before:     normalizedTrade.emotion_before || normalizedTrade.emotionBefore || '',
    emotion_during:     normalizedTrade.emotion_during || normalizedTrade.emotionDuring || '',
    emotion_after:      normalizedTrade.emotion_after || normalizedTrade.emotionAfter || '',
    psychological_tags: normalizedTrade.psychological_tags || normalizedTrade.tags || null,
    bias:               normalizedTrade.bias || null,
    setup:              normalizedTrade.setup || null,
    news_impact:        normalizedTrade.newsImpact || normalizedTrade.news_impact || null,
    psychology_score:   psychologyScore,
    break_even:         normalizeOptionalFlag(normalizedTrade.breakEven ?? normalizedTrade.break_even),
    trailing_stop:      normalizeOptionalFlag(normalizedTrade.trailingStop ?? normalizedTrade.trailing_stop),
    lots,
    commission,
    swap,
    market_type:        normalizedTrade.marketType || normalizedTrade.market_type || null,
    time:               normalizedTrade.time || null,
    extra:              Object.keys(extra).length ? extra : null,
  };
}

function buildLegacyTradePayload(tradeData = {}, userId) {
  const normalizedTrade = sanitizeImportedTradeInput(tradeData);
  const openTime = combineDateAndTimeToIso(normalizedTrade.open_date || normalizedTrade.date, normalizedTrade.time);
  const extra = normalizeJournalExtra(normalizedTrade.extra, {
    account: normalizedTrade.account,
    accountName: normalizedTrade.account_name,
    accountNumber: normalizedTrade.account_number,
    exchange: normalizedTrade.exchange,
    broker: normalizedTrade.broker,
    rrActual: normalizedTrade.rrActual ?? normalizedTrade.rr_actual ?? normalizedTrade.rr ?? normalizedTrade.metrics?.rrReel,
    result: normalizedTrade.result,
    screenshots: normalizedTrade.screenshots,
  });

  if (normalizedTrade.session) extra.session = normalizedTrade.session;
  if (normalizedTrade.bias) extra.bias = normalizedTrade.bias;
  if (normalizedTrade.setup) extra.setup = normalizedTrade.setup;
  if (normalizedTrade.marketType || normalizedTrade.market_type) extra.market_type = normalizedTrade.marketType || normalizedTrade.market_type;
  if (normalizedTrade.newsImpact || normalizedTrade.news_impact) extra.news_impact = normalizedTrade.newsImpact || normalizedTrade.news_impact;
  if (normalizedTrade.psychologyScore ?? normalizedTrade.psychology_score) extra.psychology_score = normalizedTrade.psychologyScore ?? normalizedTrade.psychology_score;

  return {
    user_id: userId,
    symbol: normalizedTrade.symbol || normalizedTrade.pair || '',
    direction: normalizeTradeDirection(normalizedTrade.direction || normalizedTrade.type || normalizedTrade.dir || 'Long').toLowerCase() === 'short' ? 'sell' : 'buy',
    volume: nullableDatabaseNumber(normalizedTrade.quantity ?? normalizedTrade.size ?? normalizedTrade.lots ?? normalizedTrade.volume),
    open_price: nullableDatabaseNumber(normalizedTrade.entry_price ?? normalizedTrade.entry ?? normalizedTrade.open_price ?? normalizedTrade.openPrice),
    close_price: nullableDatabaseNumber(normalizedTrade.exit_price ?? normalizedTrade.exit ?? normalizedTrade.close_price ?? normalizedTrade.closePrice),
    open_time: openTime,
    close_time: openTime,
    profit: resolveProfitLoss(normalizedTrade),
    commission: nullableDatabaseNumber(normalizedTrade.commission ?? normalizedTrade.comm),
    swap: nullableDatabaseNumber(normalizedTrade.swap ?? normalizedTrade.overnight),
    stop_loss: nullableDatabaseNumber(normalizedTrade.stop_loss ?? normalizedTrade.sl ?? normalizedTrade.stopLoss),
    take_profit: nullableDatabaseNumber(normalizedTrade.take_profit ?? normalizedTrade.tp ?? normalizedTrade.takeProfit),
    comment: normalizedTrade.notes || normalizedTrade.comment || null,
    extra: Object.keys(extra).length ? extra : null,
  };
}

function normalizeTradeRecord(trade = {}) {
  const pnl = finiteNumber(trade.profit_loss ?? trade.profit ?? trade.pnl ?? 0);
  const openDate = normalizeImportDateValue(trade.open_date || trade.date || trade.entryDate || trade.createdAt || trade.open_time || trade.openTime || '');
  const direction = normalizeTradeDirection(trade.direction || trade.type || trade.dir || trade.side || 'Long');
  const entry = nullableNumber(trade.entry_price ?? trade.entry ?? trade.open_price ?? trade.openPrice);
  const exit = nullableNumber(trade.exit_price ?? trade.exit ?? trade.close_price ?? trade.closePrice);
  const stopLoss = nullableNumber(trade.stop_loss ?? trade.sl ?? trade.stopLoss);
  const takeProfit = nullableNumber(trade.take_profit ?? trade.tp ?? trade.takeProfit);
  const quantity = nullableNumber(trade.quantity ?? trade.size ?? trade.lots ?? trade.volume);
  const newsImpact = trade.news_impact || trade.newsImpact || '';
  const psychologyScore = trade.psychology_score ?? trade.psychologyScore ?? null;
  const breakEven = trade.break_even ?? trade.breakEven ?? null;
  const trailingStop = trade.trailing_stop ?? trade.trailingStop ?? null;
  const marketType = trade.market_type || trade.marketType || '';
  const extra = trade.extra && typeof trade.extra === 'object' ? trade.extra : {};
  const account = trade.account || trade.account_name || extra.account || extra.account_name || extra.account_number || '';
  const exchange = trade.exchange || trade.broker || extra.exchange || extra.broker || '';
  const accountMeta = getTradeAccountMeta({ ...trade, extra, account, exchange });
  const risk = entry && stopLoss ? Math.abs(entry - stopLoss) : 0;
  const reward = entry && exit ? Math.abs(exit - entry) : 0;
  const importedRR = nullableNumber(
    trade.metrics?.rrReel
    ?? trade.rrActual
    ?? trade.rr_actual
    ?? trade.rr
    ?? extra.rr_actual
    ?? extra.rrActual
    ?? extra.rr
  );
  const rr = importedRR ?? (risk > 0 ? reward / risk : 0);

  return {
    ...trade,
    symbol: trade.symbol || trade.pair || '',
    pair: trade.pair || trade.symbol || '',
    direction,
    type: direction,
    dir: direction,
    profit_loss: pnl,
    pnl,
    status: trade.status || (pnl > 0 ? 'TP' : pnl < 0 ? 'SL' : 'BE'),
    open_date: openDate,
    date: openDate,
    entry_price: entry,
    entry,
    exit_price: exit,
    exit,
    stop_loss: stopLoss,
    sl: stopLoss,
    take_profit: takeProfit,
    tp: takeProfit,
    quantity,
    size: quantity,
    lots: trade.lots ?? trade.volume ?? quantity,
    market_type: marketType,
    marketType,
    news_impact: newsImpact,
    newsImpact,
    psychology_score: psychologyScore,
    psychologyScore,
    break_even: breakEven,
    breakEven,
    trailing_stop: trailingStop,
    trailingStop,
    account,
    exchange,
    broker: exchange,
    accountKey: accountMeta.id,
    accountLabel: accountMeta.label,
    localOnly: Boolean(trade.localOnly) || isLocalTrade(trade),
    syncState: trade.syncState || (isLocalTrade(trade) ? 'local-pending' : 'synced'),
    durationMinutes: trade.duration_minutes ?? trade.durationMinutes ?? null,
    time: normalizeImportTimeValue(trade.time || trade.open_time || trade.openTime || ''),
    notes: trade.notes || trade.comment || '',
    emotionBefore: trade.emotion_before || trade.emotionBefore || '',
    emotionDuring: trade.emotion_during || trade.emotionDuring || '',
    emotionAfter: trade.emotion_after || trade.emotionAfter || '',
    extra,
    metrics: {
      ...(trade.metrics || {}),
      rrReel: rr > 0 ? rr : 0,
    },
  };
}

function mapTradeUpdates(tradeData = {}) {
  const pnl = resolveProfitLoss(tradeData);
  const extra = normalizeJournalExtra(tradeData.extra, {
    account: tradeData.account,
    accountName: tradeData.account_name,
    accountNumber: tradeData.account_number,
    exchange: tradeData.exchange,
    broker: tradeData.broker,
    rrActual: tradeData.rrActual ?? tradeData.rr_actual ?? tradeData.rr ?? tradeData.metrics?.rrReel,
    result: tradeData.result,
    screenshots: tradeData.screenshots,
  });

  const payload = {
    symbol:            tradeData.symbol || tradeData.pair || '',
    direction:         normalizeTradeDirection(tradeData.direction || tradeData.type || tradeData.dir || tradeData.side || 'Long'),
    entry_price:       nullableDatabaseNumber(tradeData.entry_price ?? tradeData.entry ?? tradeData.open_price ?? tradeData.openPrice),
    exit_price:        nullableDatabaseNumber(tradeData.exit_price ?? tradeData.exit ?? tradeData.close_price ?? tradeData.closePrice),
    stop_loss:         nullableDatabaseNumber(tradeData.stop_loss ?? tradeData.sl ?? tradeData.stopLoss),
    quantity:          nullableDatabaseNumber(tradeData.quantity ?? tradeData.size ?? tradeData.lots ?? tradeData.volume),
    profit_loss:       pnl,
    status:            pnl > 0 ? 'TP' : pnl < 0 ? 'SL' : 'BE',
    open_date:         tradeData.open_date || tradeData.date || new Date().toISOString().split('T')[0],
    notes:             tradeData.notes || tradeData.comment || '',
    session:           tradeData.session || detectSession(),
    emotion_before:    tradeData.emotion_before || '',
    emotion_during:    tradeData.emotion_during || '',
    emotion_after:     tradeData.emotion_after || '',
    psychological_tags: tradeData.psychological_tags || tradeData.tags || null,
    bias:              tradeData.bias || null,
    setup:             tradeData.setup || null,
    news_impact:       tradeData.newsImpact || tradeData.news_impact || null,
    psychology_score:  nullableDatabaseNumber(tradeData.psychologyScore ?? tradeData.psychology_score),
    break_even:        normalizeOptionalFlag(tradeData.breakEven ?? tradeData.break_even),
    trailing_stop:     normalizeOptionalFlag(tradeData.trailingStop ?? tradeData.trailing_stop),
    lots:              nullableDatabaseNumber(tradeData.lots ?? tradeData.size ?? tradeData.quantity ?? tradeData.volume),
    commission:        nullableDatabaseNumber(tradeData.commission ?? tradeData.comm),
    swap:              nullableDatabaseNumber(tradeData.swap ?? tradeData.overnight),
    market_type:       tradeData.marketType || tradeData.market_type || null,
    time:              tradeData.time || null,
    extra:             Object.keys(extra).length ? extra : null,
  };

  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
}

function sanitizeImportedTradeInput(tradeData = {}) {
  const normalizedDate = normalizeImportDateValue(
    tradeData.open_date
    || tradeData.date
    || tradeData.open_time
    || tradeData.openTime
    || tradeData.createdAt
    || tradeData.created_at
  );
  const normalizedTime = normalizeImportTimeValue(tradeData.time || tradeData.open_time || tradeData.openTime);
  const extra = tradeData.extra && typeof tradeData.extra === 'object'
    ? normalizeJournalExtra(tradeData.extra)
    : null;

  return {
    ...tradeData,
    symbol: normalizeImportText(tradeData.symbol || tradeData.pair || tradeData.instrument || tradeData.ticker)?.toUpperCase() || '',
    pair: normalizeImportText(tradeData.pair || tradeData.symbol || tradeData.instrument || tradeData.ticker)?.toUpperCase() || '',
    direction: normalizeTradeDirection(tradeData.direction || tradeData.type || tradeData.dir || tradeData.side),
    type: normalizeTradeDirection(tradeData.type || tradeData.direction || tradeData.dir || tradeData.side),
    date: normalizedDate,
    open_date: normalizedDate,
    time: normalizedTime,
    entry: nullableDatabaseNumber(tradeData.entry_price ?? tradeData.entry ?? tradeData.open_price ?? tradeData.openPrice),
    exit: nullableDatabaseNumber(tradeData.exit_price ?? tradeData.exit ?? tradeData.close_price ?? tradeData.closePrice),
    sl: nullableDatabaseNumber(tradeData.stop_loss ?? tradeData.sl ?? tradeData.stopLoss),
    tp: nullableDatabaseNumber(tradeData.take_profit ?? tradeData.tp ?? tradeData.takeProfit),
    pnl: resolveProfitLoss(tradeData),
    size: nullableDatabaseNumber(tradeData.quantity ?? tradeData.size ?? tradeData.lots ?? tradeData.volume),
    lots: nullableDatabaseNumber(tradeData.lots ?? tradeData.size ?? tradeData.quantity ?? tradeData.volume),
    session: normalizeImportText(tradeData.session),
    bias: normalizeImportText(tradeData.bias),
    setup: normalizeImportText(tradeData.setup || tradeData.strategy || tradeData.playbook),
    notes: normalizeImportText(tradeData.notes || tradeData.comment || tradeData.note || tradeData.description),
    newsImpact: normalizeImportText(tradeData.newsImpact || tradeData.news_impact),
    psychologyScore: nullableDatabaseNumber(tradeData.psychologyScore ?? tradeData.psychology_score ?? tradeData.disciplineScore ?? tradeData.discipline_score),
    marketType: normalizeImportText(tradeData.marketType || tradeData.market_type),
    commission: nullableDatabaseNumber(tradeData.commission ?? tradeData.comm),
    swap: nullableDatabaseNumber(tradeData.swap ?? tradeData.overnight),
    extra,
  };
}

function normalizeTradeDirection(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return 'Long';
  if (['short', 'sell', 'bear', 'bearish', '1'].includes(normalized)) return 'Short';
  if (['buy', 'long', 'bull', 'bullish', '0'].includes(normalized)) return 'Long';
  return normalized[0].toUpperCase() + normalized.slice(1);
}

function normalizeImportText(value) {
  if (value == null) return '';
  const text = String(value).trim();
  if (!text || ['—', '-', 'n/a', 'null', 'undefined'].includes(text.toLowerCase())) return '';
  return text;
}

function normalizeImportDateValue(value) {
  if (!value) return '';
  const parsed = value instanceof Date ? new Date(value) : new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  if (/^\d{4}\/\d{2}\/\d{2}/.test(text)) return text.replace(/\//g, '-').slice(0, 10);
  return '';
}

function normalizeImportTimeValue(value) {
  if (!value) return '';
  const text = String(value).trim();
  const match = text.match(/(\d{1,2}):(\d{2})/);
  if (match) return `${match[1].padStart(2, '0')}:${match[2]}`;
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return `${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')}`;
  }
  return '';
}

function combineDateAndTimeToIso(dateValue, timeValue) {
  const date = normalizeImportDateValue(dateValue);
  if (!date) return null;
  const time = normalizeImportTimeValue(timeValue) || '00:00';
  const iso = new Date(`${date}T${time}:00`);
  return Number.isNaN(iso.getTime()) ? null : iso.toISOString();
}

function shouldTryLegacyTradeInsert(message = '') {
  const text = String(message || '').toLowerCase();
  return text.includes('column')
    || text.includes('schema')
    || text.includes('record')
    || text.includes('open_price')
    || text.includes('profit_loss')
    || text.includes('entry_price')
    || text.includes('could not find');
}

function nullableNumber(value) {
  if (value === '' || value == null) return null;
  const number = Number(value);
  return Number.isFinite(number) && number !== 0 ? number : null;
}

function nullableDatabaseNumber(value) {
  if (value === '' || value == null) return null;
  if (typeof value === 'string' && !value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeOptionalFlag(value) {
  if (value === '' || value == null) return null;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return null;
  if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) return true;
  if (['false', '0', 'no', 'n', 'off'].includes(normalized)) return false;
  return null;
}

function resolveProfitLoss(tradeData = {}) {
  const directPnl = nullableDatabaseNumber(tradeData.pnl);
  if (directPnl != null) return directPnl;

  const existingPnl = nullableDatabaseNumber(tradeData.profit_loss);
  if (existingPnl != null) return existingPnl;

  const legacyPnl = nullableDatabaseNumber(tradeData.profit ?? tradeData.gross_profit);
  if (legacyPnl != null) return legacyPnl;

  return calcPnl(tradeData);
}

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function detectSession() {
  const h = new Date().getUTCHours();
  if (h >= 22 || h < 7)  return 'Asia';
  if (h >= 7  && h < 12) return 'London';
  if (h >= 12 && h < 21) return 'NY';
  return 'NY';
}

function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-US',{month:'short',day:'numeric'});
}

function fmt(n) {
  return (n >= 0 ? '+' : '') + '$' + Math.abs(Math.round(n)).toLocaleString();
}

function formatSupabaseError(error, fallback = 'A trade row could not be saved.') {
  if (!error) return fallback;
  const message = [error.message, error.details, error.hint].filter(Boolean).join(' - ').trim();
  return message || fallback;
}

function isTimeoutLike(message = '') {
  const text = String(message || '').toLowerCase();
  return text.includes('timed out')
    || text.includes('timeout')
    || text.includes('abort')
    || text.includes('networkerror')
    || text.includes('failed to fetch');
}

function createImportedTradePreview(payload = {}, index = 0, options = {}) {
  const localOnly = Boolean(options?.localOnly);
  return normalizeTradeRecord({
    id: localOnly ? `${LOCAL_TRADE_PREFIX}${Date.now()}-${index}` : `import-${Date.now()}-${index}`,
    created_at: new Date().toISOString(),
    localOnly,
    syncState: options?.syncState || (localOnly ? 'local-pending' : 'synced'),
    ...payload,
  });
}

function mergeOptimisticTrades(currentTrades = [], optimisticTrades = []) {
  if (!optimisticTrades.length) return currentTrades;
  const merged = new Map();

  [...(optimisticTrades || []), ...(currentTrades || [])].forEach((trade) => {
    const normalized = normalizeTradeRecord(trade);
    const idKey = String(normalized.id || '');
    const signatureKey = tradeSignature(normalized);
    const key = signatureKey || idKey;
    if (!key) return;
    if (!merged.has(key)) {
      merged.set(key, normalized);
      return;
    }

    const existing = merged.get(key);
    if (isLocalTrade(existing) && !isLocalTrade(normalized)) {
      merged.set(key, normalized);
    }
  });

  return Array.from(merged.values()).sort((left, right) => {
    const leftTime = new Date(left.open_date || left.date || left.created_at || 0).getTime();
    const rightTime = new Date(right.open_date || right.date || right.created_at || 0).getTime();
    return rightTime - leftTime;
  });
}

function isLocalTrade(trade = {}) {
  return Boolean(trade?.localOnly) || String(trade?.id || '').startsWith(LOCAL_TRADE_PREFIX);
}

function tradeSignature(trade = {}) {
  return [
    trade.symbol || trade.pair || '',
    trade.direction || trade.type || '',
    normalizeImportDateValue(trade.open_date || trade.date || ''),
    normalizeImportTimeValue(trade.time || ''),
    nullableDatabaseNumber(trade.entry_price ?? trade.entry ?? trade.open_price ?? trade.openPrice) ?? '',
    nullableDatabaseNumber(trade.exit_price ?? trade.exit ?? trade.close_price ?? trade.closePrice) ?? '',
    nullableDatabaseNumber(trade.profit_loss ?? trade.pnl ?? trade.profit) ?? '',
  ].join('|');
}

function readAutoBackupTrades(userId) {
  if (!userId || typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(`${AUTO_BACKUP_STORAGE_PREFIX}${userId}`);
    if (!raw) return [];
    const snapshot = JSON.parse(raw);
    return Array.isArray(snapshot?.trades) ? snapshot.trades.map(normalizeTradeRecord) : [];
  } catch {
    return [];
  }
}

function normalizeJournalExtra(extra = {}, fallback = {}) {
  const next = extra && typeof extra === 'object' ? { ...extra } : {};
  if (fallback.account) next.account = fallback.account;
  if (fallback.accountName) next.account_name = fallback.accountName;
  if (fallback.accountNumber) next.account_number = fallback.accountNumber;
  if (fallback.exchange || fallback.broker) next.exchange = fallback.exchange || fallback.broker;
  if (fallback.rrActual != null && fallback.rrActual !== '') next.rr_actual = fallback.rrActual;
  if (fallback.result) next.result = fallback.result;
  if (fallback.screenshots) next.screenshots = fallback.screenshots;
  return Object.fromEntries(Object.entries(next).filter(([, value]) => value != null && value !== ''));
}

function normalizeAccountId(value = '') {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'manual';
}

function getTradeAccountMeta(trade = {}) {
  const label = String(
    trade.account
    || trade.account_name
    || trade.extra?.account
    || trade.extra?.account_name
    || trade.extra?.account_number
    || trade.account_number
    || trade.exchange
    || trade.broker
    || trade.extra?.exchange
    || trade.extra?.broker
    || 'Main journal'
  ).trim() || 'Main journal';

  return {
    id: `account:${normalizeAccountId(label)}`,
    label,
  };
}

function filterTradesByAccount(trades = [], activeAccount = 'all') {
  if (!activeAccount || activeAccount === 'all') return trades;
  return (trades || []).filter((trade) => getTradeAccountMeta(trade).id === activeAccount);
}

function buildAccountOptions(trades = []) {
  const scoped = Array.isArray(trades) ? trades : [];
  const items = scoped.reduce((map, trade) => {
    const account = getTradeAccountMeta(trade);
    if (!map.has(account.id)) {
      map.set(account.id, { id: account.id, label: account.label, count: 0, pnl: 0 });
    }
    const current = map.get(account.id);
    current.count += 1;
    current.pnl += finiteNumber(trade.profit_loss ?? trade.pnl ?? 0);
    return map;
  }, new Map());

  return [
    {
      id: 'all',
      label: 'All Accounts',
      count: scoped.length,
      pnl: scoped.reduce((sum, trade) => sum + finiteNumber(trade.profit_loss ?? trade.pnl ?? 0), 0),
    },
    ...Array.from(items.values()).sort((left, right) => right.count - left.count || left.label.localeCompare(right.label)),
  ];
}

function downloadJsonFile(payload, filename = 'marketflow-backup.json') {
  if (typeof window === 'undefined' || !payload) return;
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

async function runSupabaseRequest(requestFactory, timeoutMs = REQUEST_TIMEOUT_MS, timeoutMessage = 'The request timed out.') {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  let settled = false;
  let timeoutRejectTimer = null;
  const timer = setTimeout(() => {
    if (settled) return;
    controller?.abort();
  }, timeoutMs);
  const timeoutPromise = new Promise((_, reject) => {
    timeoutRejectTimer = setTimeout(() => {
      if (settled) return;
      reject(new Error(timeoutMessage));
    }, timeoutMs + 40);
  });

  try {
    const requestPromise = Promise.resolve().then(() => requestFactory(controller?.signal));
    const response = await Promise.race([requestPromise, timeoutPromise]);
    settled = true;
    return response;
  } catch (error) {
    settled = true;
    if (error?.name === 'AbortError') {
      throw new Error(timeoutMessage);
    }
    throw error;
  } finally {
    clearTimeout(timer);
    clearTimeout(timeoutRejectTimer);
  }
}
