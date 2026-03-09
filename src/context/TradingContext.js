import React, { createContext, useContext, useState, useEffect } from 'react';

const TradingContext = createContext();

export const useTradingContext = () => {
  const context = useContext(TradingContext);
  if (!context) {
    throw new Error('useTradingContext must be used within TradingProvider');
  }
  return context;
};

// 🔹 CLÉS LOCALSTORAGE
const STORAGE_KEYS = {
  TRADES: 'marketflow_trades',
  CONFLUENCES: 'marketflow_confluences',
  VERSION: 'marketflow_version',
  LAST_SAVE: 'marketflow_last_save',
};

const CURRENT_VERSION = '1.0.0';

// 🔹 FONCTIONS UTILITAIRES LOCALSTORAGE
const saveToLocalStorage = (key, data) => {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(key, serialized);
    localStorage.setItem(STORAGE_KEYS.LAST_SAVE, new Date().toISOString());
    console.log(`✅ Saved to localStorage: ${key}`, data.length || 'object');
    return true;
  } catch (error) {
    console.error('❌ Error saving to localStorage:', error);
    if (error.name === 'QuotaExceededError') {
      alert('Storage limit exceeded. Please export and clear old trades.');
    }
    return false;
  }
};

const loadFromLocalStorage = (key, defaultValue = null) => {
  try {
    const serialized = localStorage.getItem(key);
    if (serialized === null) {
      console.log(`📂 No data found in localStorage for: ${key}`);
      return defaultValue;
    }
    const data = JSON.parse(serialized);
    console.log(`✅ Loaded from localStorage: ${key}`, data.length || 'object');
    return data;
  } catch (error) {
    console.error('❌ Error loading from localStorage:', error);
    return defaultValue;
  }
};

const clearLocalStorage = () => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    console.log('🗑️ LocalStorage cleared');
    return true;
  } catch (error) {
    console.error('❌ Error clearing localStorage:', error);
    return false;
  }
};

export const TradingProvider = ({ children }) => {
  // 🔹 CHARGER LES DONNÉES AU DÉMARRAGE
  const [trades, setTrades] = useState(() => {
    const saved = loadFromLocalStorage(STORAGE_KEYS.TRADES, []);
    console.log('🚀 Initializing trades from localStorage:', saved.length, 'trades');
    return saved;
  });

  const [confluences, setConfluences] = useState(() => {
    const defaultConfluences = [
      { id: 'fvg', name: 'FVG', category: 'structure', trades: [], stats: {} },
      { id: 'orderblock', name: 'Order Block', category: 'structure', trades: [], stats: {} },
      { id: 'smt', name: 'SMT', category: 'liquidity', trades: [], stats: {} },
      { id: 'cisd', name: 'CISD', category: 'momentum', trades: [], stats: {} },
      { id: 'breakout', name: 'Breakout', category: 'structure', trades: [], stats: {} },
      { id: 'reversal', name: 'Reversal', category: 'structure', trades: [], stats: {} },
      { id: 'liquidity', name: 'Liquidity Sweep', category: 'liquidity', trades: [], stats: {} },
      { id: 'bos', name: 'Break of Structure', category: 'structure', trades: [], stats: {} },
      { id: 'volumespike', name: 'Volume Spike', category: 'momentum', trades: [], stats: {} },
      { id: 'momentum', name: 'Momentum', category: 'momentum', trades: [], stats: {} },
    ];
    const saved = loadFromLocalStorage(STORAGE_KEYS.CONFLUENCES, defaultConfluences);
    return saved;
  });

  const [setups, setSetups] = useState([]);
  const [globalStats, setGlobalStats] = useState({});
  const [psychologyStats, setPsychologyStats] = useState({});
  const [advancedAnalytics, setAdvancedAnalytics] = useState({});

  // 🔹 SAUVEGARDER AUTOMATIQUEMENT À CHAQUE CHANGEMENT
  useEffect(() => {
    if (trades.length > 0) {
      saveToLocalStorage(STORAGE_KEYS.TRADES, trades);
      saveToLocalStorage(STORAGE_KEYS.VERSION, CURRENT_VERSION);
    }
  }, [trades]);

  useEffect(() => {
    if (confluences.length > 0) {
      saveToLocalStorage(STORAGE_KEYS.CONFLUENCES, confluences);
    }
  }, [confluences]);

  // 🔹 DÉTECTER LA SESSION AUTOMATIQUEMENT
  const detectSession = (time, symbol) => {
    const hour = parseInt(time?.split(':')[0] || 9);
    
    if (hour >= 13 && hour < 17) return 'Overlap';
    if (hour >= 8 && hour < 17) return 'London';
    if (hour >= 13 && hour < 22) return 'New York';
    if (hour >= 0 && hour < 9) return 'Asian';
    
    return 'Unknown';
  };

  // 🔹 DÉTECTER LE BIAS AUTOMATIQUEMENT
  const detectBias = (trade) => {
    const entry = parseFloat(trade.entry);
    const exit = parseFloat(trade.exit);
    
    if (trade.type === 'Long' && exit > entry) return 'Bullish';
    if (trade.type === 'Short' && exit < entry) return 'Bearish';
    if (trade.type === 'Long' && exit < entry) return 'Bearish';
    if (trade.type === 'Short' && exit > entry) return 'Bullish';
    
    return 'Neutral';
  };

  // 🔹 DÉTECTER L'IMPACT NEWS
  const detectNewsImpact = async (date, symbol) => {
    const dayOfWeek = new Date(date).getDay();
    
    if (dayOfWeek === 5) return 'High';
    if (dayOfWeek === 1) return 'Medium';
    
    return 'Low';
  };

  // 🔹 CALCULER LE PSYCHOLOGY SCORE
  const calculatePsychologyScore = (psychology) => {
    let score = 100;
    
    if (psychology.emotions.includes('FOMO')) score -= 30;
    if (psychology.emotions.includes('Revenge Trading')) score -= 40;
    if (psychology.emotions.includes('Impulsive')) score -= 25;
    if (psychology.emotions.includes('Undisciplined')) score -= 35;
    if (psychology.emotions.includes('Lack of Confidence')) score -= 20;
    if (psychology.emotions.includes('Overconfident')) score -= 30;
    
    if (psychology.emotions.includes('Disciplined')) score = 100;
    if (psychology.emotions.includes('Calm')) score = Math.max(score, 80);
    if (psychology.emotions.includes('Confident')) score = Math.max(score, 85);
    
    return Math.max(0, Math.min(100, score));
  };

  // 🔹 DÉTECTER LE TYPE DE MARCHÉ
  const detectMarketType = (symbol) => {
    const sym = symbol.toUpperCase();
    
    if (/^[A-Z]{6}$/.test(sym) || sym.includes('USD') || sym.includes('EUR') || sym.includes('GBP')) {
      return 'Forex';
    }
    
    if (sym.includes('BTC') || sym.includes('ETH') || sym.includes('SOL') || sym.includes('USDT')) {
      return 'Crypto';
    }
    
    if (sym.includes('US30') || sym.includes('NAS100') || sym.includes('SPX') || sym.includes('DAX')) {
      return 'Indices';
    }
    
    return 'Stocks';
  };

  // 🔹 CALCULER LES MÉTRIQUES EN %
  const calculatePercentages = (trade) => {
    const entry = parseFloat(trade.entry);
    const exit = parseFloat(trade.exit);
    const stopLoss = parseFloat(trade.stopLoss || entry * 0.98);
    
    const tpPercent = ((exit - entry) / entry) * 100;
    const slPercent = Math.abs(((stopLoss - entry) / entry) * 100);
    const rr = slPercent > 0 ? Math.abs(tpPercent / slPercent) : 0;
    const riskPercent = trade.riskPercent || 1;
    
    let pips = 0;
    if (trade.marketType === 'Forex') {
      pips = Math.abs((exit - entry) * 10000);
    }
    
    return {
      tpPercent: tpPercent.toFixed(2),
      slPercent: slPercent.toFixed(2),
      rrPrevu: rr.toFixed(2),
      rrReel: rr.toFixed(2),
      riskPercent,
      pips: pips.toFixed(1),
      resultatPercent: tpPercent.toFixed(2),
    };
  };

  // 🔹 DÉTECTER LES CONFLUENCES
  const detectConfluences = (trade) => {
    const detectedConfluences = [];
    const notes = (trade.notes || '').toLowerCase();
    const setup = (trade.setup || '').toLowerCase();
    const combined = notes + ' ' + setup;
    
    const patterns = {
      'fvg': ['fvg', 'fair value gap', 'imbalance', 'gap'],
      'orderblock': ['order block', 'ob', 'orderblock', 'block'],
      'smt': ['smt', 'smart money', 'divergence'],
      'cisd': ['cisd', 'change in state', 'delivery'],
      'breakout': ['breakout', 'break out', 'break', 'new high', 'new low'],
      'reversal': ['reversal', 'reverse', 'rejection', 'bounce'],
      'bos': ['bos', 'break of structure', 'structure break'],
      'liquidity': ['liquidity', 'sweep', 'raid', 'hunt'],
      'volumespike': ['volume', 'high volume', 'spike'],
      'momentum': ['momentum', 'strong move', 'impulse'],
    };
    
    Object.keys(patterns).forEach(confluence => {
      const keywords = patterns[confluence];
      const found = keywords.some(keyword => combined.includes(keyword));
      if (found) {
        detectedConfluences.push(confluence);
      }
    });
    
    if (detectedConfluences.length === 0) {
      detectedConfluences.push('technical');
    }
    
    return detectedConfluences;
  };

  // 🔹 ANALYSER LA PSYCHOLOGIE
  const analyzePsychology = (trade, allTrades) => {
    const psychology = {
      emotions: [],
      discipline: 100,
      issues: [],
    };
    
    const metrics = trade.metrics || {};
    const notes = (trade.notes || '').toLowerCase();
    
    if (notes.includes('fomo') || notes.includes('peur de rater') || notes.includes('fear of missing')) {
      psychology.emotions.push('FOMO');
      psychology.discipline -= 30;
      psychology.issues.push('Entry was likely rushed due to FOMO');
    }
    
    if (notes.includes('impulsif') || notes.includes('impulse') || notes.includes('sans plan')) {
      psychology.emotions.push('Impulsive');
      psychology.discipline -= 25;
      psychology.issues.push('Trade taken without proper plan');
    }
    
    if (notes.includes('sl déplacé') || notes.includes('moved sl') || notes.includes('changed stop')) {
      psychology.emotions.push('Undisciplined');
      psychology.discipline -= 35;
      psychology.issues.push('Stop loss was moved - lack of discipline');
    }
    
    if (metrics.tpPercent && parseFloat(metrics.tpPercent) < 0.5) {
      psychology.emotions.push('Lack of Confidence');
      psychology.discipline -= 20;
      psychology.issues.push('Exit was too early - lack of confidence in setup');
    }
    
    if (trade.riskPercent && trade.riskPercent > 2) {
      psychology.emotions.push('Overconfident');
      psychology.discipline -= 30;
      psychology.issues.push(`Risk too high: ${trade.riskPercent}% (recommended: 1-2%)`);
    }
    
    const prevTrade = allTrades[allTrades.indexOf(trade) - 1];
    if (prevTrade && prevTrade.pnl < 0) {
      const timeDiff = new Date(trade.date) - new Date(prevTrade.date);
      const minutesDiff = timeDiff / (1000 * 60);
      
      if (minutesDiff < 30) {
        psychology.emotions.push('Revenge Trading');
        psychology.discipline -= 40;
        psychology.issues.push('Trade taken too quickly after a loss - possible revenge trading');
      }
    }
    
    if (notes.includes('plan respecté') || notes.includes('followed plan') || notes.includes('disciplined')) {
      psychology.emotions.push('Disciplined');
      psychology.discipline = 100;
      psychology.issues = [];
    }
    
    if (psychology.emotions.length === 0) {
      psychology.emotions.push('Neutral');
      psychology.discipline = 80;
    }
    
    return psychology;
  };

  // 🔹 AJOUTER UN TRADE
  const addTrade = async (trade) => {
    const marketType = detectMarketType(trade.symbol);
    const session = detectSession(trade.time, trade.symbol);
    const bias = detectBias(trade);
    const newsImpact = await detectNewsImpact(trade.date, trade.symbol);
    
    const metrics = calculatePercentages({ ...trade, marketType });
    const detectedConfluences = detectConfluences(trade);
    const psychology = analyzePsychology(trade, trades);
    const psychologyScore = calculatePsychologyScore(psychology);
    
    const enrichedTrade = {
      ...trade,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      marketType,
      session,
      bias,
      newsImpact,
      metrics,
      confluences: detectedConfluences,
      psychology,
      psychologyScore,
      disciplineScore: psychology.discipline,
      win: parseFloat(trade.pnl || 0) >= 0,
      createdAt: new Date().toISOString(),
    };
    
    console.log('✅ Adding enriched trade:', enrichedTrade.symbol, enrichedTrade.id);
    
    setTrades(prevTrades => {
      const newTrades = [enrichedTrade, ...prevTrades];
      // La sauvegarde se fait automatiquement via useEffect
      return newTrades;
    });
    
    detectedConfluences.forEach(confId => {
      setConfluences(prevConfluences => {
        const exists = prevConfluences.find(c => c.id === confId);
        if (!exists) {
          return [...prevConfluences, {
            id: confId,
            name: confId.charAt(0).toUpperCase() + confId.slice(1),
            category: 'custom',
            trades: [],
            stats: {}
          }];
        }
        return prevConfluences;
      });
    });
    
    return enrichedTrade;
  };

  // 🔹 SUPPRIMER UN TRADE
  const deleteTrade = (tradeId) => {
    console.log('🗑️ Deleting trade:', tradeId);
    setTrades(prevTrades => {
      const newTrades = prevTrades.filter(t => t.id !== tradeId);
      // La sauvegarde se fait automatiquement via useEffect
      return newTrades;
    });
  };

  // 🔹 MODIFIER UN TRADE
  const updateTrade = async (tradeId, updates) => {
    console.log('✏️ Updating trade:', tradeId);
    
    setTrades(prevTrades => {
      const newTrades = prevTrades.map(t => {
        if (t.id === tradeId) {
          const updated = { ...t, ...updates };
          
          const marketType = detectMarketType(updated.symbol);
          const session = detectSession(updated.time, updated.symbol);
          const bias = detectBias(updated);
          
          updated.marketType = marketType;
          updated.session = session;
          updated.bias = bias;
          updated.metrics = calculatePercentages(updated);
          updated.confluences = detectConfluences(updated);
          updated.psychology = analyzePsychology(updated, prevTrades);
          updated.psychologyScore = calculatePsychologyScore(updated.psychology);
          updated.disciplineScore = updated.psychology.discipline;
          updated.win = parseFloat(updated.pnl || 0) >= 0;
          
          return updated;
        }
        return t;
      });
      
      // La sauvegarde se fait automatiquement via useEffect
      return newTrades;
    });
  };

  // 🔹 CALCULER LES STATS AVANCÉES
  const calculateAdvancedStats = (tradesToAnalyze) => {
    if (!tradesToAnalyze || tradesToAnalyze.length === 0) {
      setAdvancedAnalytics({});
      return;
    }

    const confluenceStats = {};
    
    confluences.forEach(conf => {
      const confTrades = tradesToAnalyze.filter(t => 
        t.confluences && t.confluences.includes(conf.id)
      );
      
      if (confTrades.length > 0) {
        const wins = confTrades.filter(t => t.win);
        const losses = confTrades.filter(t => !t.win);
        
        const totalWinAmount = wins.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
        const totalLossAmount = Math.abs(losses.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0));
        
        const avgRR = confTrades.reduce((sum, t) => sum + parseFloat(t.metrics?.rrReel || 0), 0) / confTrades.length;
        const avgReturn = confTrades.reduce((sum, t) => sum + parseFloat(t.metrics?.resultatPercent || 0), 0) / confTrades.length;
        
        const expectancy = (wins.length / confTrades.length) * (totalWinAmount / (wins.length || 1)) - 
                          (losses.length / confTrades.length) * (totalLossAmount / (losses.length || 1));
        
        const profitFactor = totalLossAmount > 0 ? (totalWinAmount / totalLossAmount) : 0;
        
        const drawdowns = [];
        let peak = 0;
        let cumulative = 0;
        confTrades.forEach(t => {
          cumulative += parseFloat(t.pnl || 0);
          if (cumulative > peak) peak = cumulative;
          const drawdown = ((peak - cumulative) / peak) * 100;
          drawdowns.push(drawdown);
        });
        
        const maxDrawdown = Math.max(...drawdowns, 0);
        const avgDrawdown = drawdowns.reduce((sum, d) => sum + d, 0) / drawdowns.length;
        
        const winRate = (wins.length / confTrades.length) * 100;
        
        const performanceScore = (
          (winRate * 0.3) + 
          (avgRR * 10 * 0.3) + 
          (expectancy * 0.2) + 
          ((100 - maxDrawdown) * 0.2)
        );
        
        const disciplineRate = confTrades.filter(t => t.psychologyScore >= 80).length / confTrades.length * 100;
        const fiabiliteScore = (
          (winRate * 0.4) +
          (disciplineRate * 0.3) +
          ((100 - maxDrawdown) * 0.3)
        );
        
        confluenceStats[conf.id] = {
          totalTrades: confTrades.length,
          wins: wins.length,
          losses: losses.length,
          winRate: winRate.toFixed(1),
          avgRR: avgRR.toFixed(2),
          avgReturn: avgReturn.toFixed(2),
          expectancy: expectancy.toFixed(2),
          profitFactor: profitFactor.toFixed(2),
          maxDrawdown: maxDrawdown.toFixed(2),
          avgDrawdown: avgDrawdown.toFixed(2),
          totalPnL: (totalWinAmount - totalLossAmount).toFixed(2),
          performanceScore: performanceScore.toFixed(1),
          fiabiliteScore: fiabiliteScore.toFixed(1),
        };
      }
    });

    const setupMap = {};
    tradesToAnalyze.forEach(trade => {
      if (trade.confluences && trade.confluences.length > 1) {
        const setupKey = trade.confluences.sort().join('-');
        if (!setupMap[setupKey]) {
          setupMap[setupKey] = {
            id: setupKey,
            confluences: trade.confluences,
            trades: [],
          };
        }
        setupMap[setupKey].trades.push(trade);
      }
    });

    const setupStats = Object.values(setupMap).map(setup => {
      const wins = setup.trades.filter(t => t.win).length;
      const totalTrades = setup.trades.length;
      const winRate = (wins / totalTrades) * 100;
      const avgRR = setup.trades.reduce((sum, t) => sum + parseFloat(t.metrics?.rrReel || 0), 0) / totalTrades;
      const avgReturn = setup.trades.reduce((sum, t) => sum + parseFloat(t.metrics?.resultatPercent || 0), 0) / totalTrades;
      const avgPsycho = setup.trades.reduce((sum, t) => sum + parseFloat(t.psychologyScore || 0), 0) / totalTrades;
      
      return {
        ...setup,
        totalTrades,
        wins,
        losses: totalTrades - wins,
        winRate: winRate.toFixed(1),
        avgRR: avgRR.toFixed(2),
        avgReturn: avgReturn.toFixed(2),
        consistencyScore: winRate.toFixed(1),
        psychologicalStabilityScore: avgPsycho.toFixed(1),
      };
    });

    setSetups(setupStats);
    setAdvancedAnalytics({
      confluenceStats,
      setupStats,
      bestConfluence: Object.entries(confluenceStats).sort((a, b) => 
        parseFloat(b[1].performanceScore) - parseFloat(a[1].performanceScore)
      )[0],
      worstConfluence: Object.entries(confluenceStats).sort((a, b) => 
        parseFloat(a[1].performanceScore) - parseFloat(b[1].performanceScore)
      )[0],
      bestSetup: setupStats.sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate))[0],
    });
  };

  // 🔹 CALCULER TOUTES LES STATISTIQUES
  const calculateAllStats = (tradesToAnalyze) => {
    if (!tradesToAnalyze || tradesToAnalyze.length === 0) {
      setGlobalStats({
        totalTrades: 0,
        wins: 0,
        losses: 0,
        winRate: '0',
        totalPnL: '0.00',
        avgPnL: '0.00',
        avgRR: '0.00',
        confluenceStats: {},
      });
      setPsychologyStats({});
      calculateAdvancedStats([]);
      return;
    }
    
    const totalTrades = tradesToAnalyze.length;
    const wins = tradesToAnalyze.filter(t => t.win).length;
    const losses = totalTrades - wins;
    const winRate = ((wins / totalTrades) * 100).toFixed(1);
    
    const totalPnL = tradesToAnalyze.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
    const avgPnL = (totalPnL / totalTrades).toFixed(2);
    
    const avgRR = (tradesToAnalyze.reduce((sum, t) => 
      sum + parseFloat(t.metrics?.rrReel || 0), 0) / totalTrades).toFixed(2);
    
    const psychoTrades = {
      fomo: tradesToAnalyze.filter(t => t.psychology?.emotions.includes('FOMO')),
      disciplined: tradesToAnalyze.filter(t => t.psychology?.emotions.includes('Disciplined')),
      impulsive: tradesToAnalyze.filter(t => t.psychology?.emotions.includes('Impulsive')),
      revenge: tradesToAnalyze.filter(t => t.psychology?.emotions.includes('Revenge Trading')),
    };
    
    const psychoStats = {};
    Object.keys(psychoTrades).forEach(emotion => {
      const emotionTrades = psychoTrades[emotion];
      if (emotionTrades.length > 0) {
        const emotionWins = emotionTrades.filter(t => t.win).length;
        psychoStats[emotion] = {
          count: emotionTrades.length,
          percentage: ((emotionTrades.length / totalTrades) * 100).toFixed(1),
          winRate: ((emotionWins / emotionTrades.length) * 100).toFixed(1),
          avgPnL: (emotionTrades.reduce((sum, t) => 
            sum + parseFloat(t.pnl || 0), 0) / emotionTrades.length).toFixed(2),
        };
      }
    });
    
    setGlobalStats({
      totalTrades,
      wins,
      losses,
      winRate,
      totalPnL: totalPnL.toFixed(2),
      avgPnL,
      avgRR,
    });
    
    setPsychologyStats(psychoStats);
    calculateAdvancedStats(tradesToAnalyze);
  };

  useEffect(() => {
    console.log('📊 Trades updated, count:', trades.length);
    calculateAllStats(trades);
  }, [trades]);

  const value = {
    trades,
    confluences,
    setups,
    globalStats,
    psychologyStats,
    advancedAnalytics,
    addTrade,
    deleteTrade,
    updateTrade,
    detectMarketType,
    calculatePercentages,
    detectConfluences,
    analyzePsychology,
    // 🔹 NOUVELLES FONCTIONS POUR GÉRER LE STORAGE
    clearAllData: () => {
      setTrades([]);
      setConfluences([]);
      clearLocalStorage();
    },
    exportBackup: () => {
      return {
        trades,
        confluences,
        version: CURRENT_VERSION,
        exportDate: new Date().toISOString(),
      };
    },
    importBackup: (backup) => {
      if (backup.trades) setTrades(backup.trades);
      if (backup.confluences) setConfluences(backup.confluences);
    },
  };

  return (
    <TradingContext.Provider value={value}>
      {children}
    </TradingContext.Provider>
  );
};