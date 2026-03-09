/*
╔══════════════════════════════════════════════════════════════════════════════╗
║   📊 ALL TRADES MARKETFLOW - VERSION ULTIMATE                               ║
║   ✅ TradeDetailPanel intégré (slide depuis la droite)                      ║
║   ✅ Mini chart entry→exit, métriques, psycho, notes                        ║
║   ✅ Table redesign avec row color coding subtil                             ║
║   ✅ 6 stats cards (+ Profit Factor + Max DD)                               ║
║   ✅ Filtres avancés : Session, Bias, Date range                            ║
║   ✅ Bulk actions premium                                                    ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { useTradingContext } from '../context/TradingContext';

// ══════════════════════════════════════════════════════════════════════════════
// 🎨 PALETTE MARKETFLOW
// ══════════════════════════════════════════════════════════════════════════════
const C = {
  bgPage:  '#0F1420',
  bgCard:  '#161D2E',
  bgDeep:  '#0D1117',
  bgHigh:  '#1C2540',
  bgHov:   '#1F2B42',
  bgGlass: 'rgba(22,29,46,0.85)',

  cyan:       '#00D4FF',
  cyanGlow:   'rgba(0,212,255,0.35)',
  teal:       '#00C9A7',
  green:      '#00E676',
  greenDim:   '#10B981',
  greenGlow:  'rgba(0,230,118,0.35)',
  danger:     '#FF4757',
  dangerDim:  '#EF4444',
  dangerGlow: 'rgba(255,71,87,0.35)',
  warn:       '#FFB300',
  purple:     '#A78BFA',
  blue:       '#5B7BF6',

  t1: '#E8EEFF',
  t2: '#8B9BB4',
  t3: '#3D4F6B',
  t4: '#64748B',

  brd:       '#1E2D45',
  brdSoft:   '#243454',
  brdBright: '#334155',

  grad:       'linear-gradient(135deg, #00D4FF, #00E676)',
  gradBlue:   'linear-gradient(135deg, #5B7BF6, #4C6EF5)',
  gradDanger: 'linear-gradient(135deg, #FF4757, #EF4444)',
  gradWarn:   'linear-gradient(135deg, #FFB300, #F59E0B)',
  gradPurple: 'linear-gradient(135deg, #A78BFA, #8B5CF6)',
};

// ══════════════════════════════════════════════════════════════════════════════
// 📐 COLONNES
// ══════════════════════════════════════════════════════════════════════════════
const DEFAULT_COLUMNS = [
  { key: 'select',     label: '',         visible: true,  locked: true,  sortable: false, width: 40  },
  { key: 'date',       label: 'Date',     visible: true,  sortable: true, width: 120 },
  { key: 'symbol',     label: 'Symbole',  visible: true,  sortable: true, width: 140 },
  { key: 'type',       label: 'Type',     visible: true,  sortable: true, width: 80  },
  { key: 'session',    label: 'Session',  visible: true,  sortable: true, width: 100 },
  { key: 'bias',       label: 'Bias',     visible: true,  sortable: true, width: 100 },
  { key: 'news',       label: 'News',     visible: true,  sortable: true, width: 90  },
  { key: 'entry',      label: 'Entry',    visible: true,  sortable: true, width: 100 },
  { key: 'exit',       label: 'Exit',     visible: true,  sortable: true, width: 100 },
  { key: 'tpPercent',  label: 'TP%',      visible: true,  sortable: true, width: 90  },
  { key: 'rr',         label: 'RR',       visible: true,  sortable: true, width: 80  },
  { key: 'setup',      label: 'Setup',    visible: true,  sortable: true, width: 120 },
  { key: 'psychology', label: 'Psycho',   visible: true,  sortable: true, width: 80  },
  { key: 'pnl',        label: 'P&L',      visible: true,  sortable: true, width: 100, important: true },
];

// ══════════════════════════════════════════════════════════════════════════════
// 🎬 ANIMATIONS
// ══════════════════════════════════════════════════════════════════════════════
const fadeInUp = {
  hidden:  { opacity: 0, y: 20, scale: 0.97 },
  visible: (i = 0) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.04, duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  })
};

// ══════════════════════════════════════════════════════════════════════════════
// 🔧 UTILITAIRES
// ══════════════════════════════════════════════════════════════════════════════
const fmt = (n, d = 2) => {
  const num = parseFloat(n);
  if (isNaN(num)) return '—';
  return num.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
};

const fmtPnl = (n, showSign = true) => {
  const num = parseFloat(n);
  if (isNaN(num)) return '—';
  const abs = Math.abs(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (!showSign) return `$${abs}`;
  return num >= 0 ? `+$${abs}` : `-$${abs}`;
};

const exportToCSV = (data, filename = 'trades.csv') => {
  if (!data?.length) { toast.error('Aucune donnée à exporter'); return; }
  try {
    const headers = Object.keys(data[0]);
    const rows = data.map(row =>
      headers.map(h => {
        const v = row[h];
        if (v == null) return '';
        const s = String(v);
        return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(',')
    );
    const blob = new Blob(['\uFEFF' + [headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Export CSV réussi ! (${data.length} trades)`);
  } catch (e) { toast.error('Erreur export CSV'); }
};

const filterTrades = (trades, filters) => trades.filter(t => {
  if (filters.search) {
    const q = filters.search.toLowerCase();
    if (!t.symbol?.toLowerCase().includes(q) &&
        !t.type?.toLowerCase().includes(q) &&
        !t.setup?.toLowerCase().includes(q) &&
        !t.notes?.toLowerCase().includes(q)) return false;
  }
  if (filters.result && filters.result !== 'all') {
    const win = t.win === true || parseFloat(t.pnl) > 0;
    if (filters.result === 'wins'   && !win)              return false;
    if (filters.result === 'losses' && win)               return false;
    if (filters.result === 'long'   && t.type !== 'Long') return false;
    if (filters.result === 'short'  && t.type !== 'Short')return false;
  }
  if (filters.symbol  && filters.symbol  !== 'all' && t.symbol  !== filters.symbol)  return false;
  if (filters.session && filters.session !== 'all' && t.session !== filters.session) return false;
  if (filters.bias    && filters.bias    !== 'all' && t.bias    !== filters.bias)    return false;
  if (filters.dateFrom && t.date < filters.dateFrom) return false;
  if (filters.dateTo   && t.date > filters.dateTo)   return false;
  return true;
});

const sortTrades = (trades, key, dir) => {
  if (!key) return trades;
  return [...trades].sort((a, b) => {
    let av = a[key], bv = b[key];
    if (key === 'tpPercent')  { av = parseFloat(a.metrics?.tpPercent || 0); bv = parseFloat(b.metrics?.tpPercent || 0); }
    else if (key === 'rr')    { av = parseFloat(a.metrics?.rrReel  || 0); bv = parseFloat(b.metrics?.rrReel  || 0); }
    else if (['pnl','entry','exit'].includes(key)) { av = parseFloat(av) || 0; bv = parseFloat(bv) || 0; }
    else if (key === 'date')  { av = new Date(av).getTime(); bv = new Date(bv).getTime(); }
    else if (key === 'psychology') { av = a.psychologyScore || 0; bv = b.psychologyScore || 0; }
    if (av < bv) return dir === 'asc' ? -1 : 1;
    if (av > bv) return dir === 'asc' ?  1 : -1;
    return 0;
  });
};

const calcStats = (trades) => {
  if (!trades?.length) return { total:0, wins:0, losses:0, winRate:0, totalPnL:0, avgRR:0, pf:0, maxDD:0 };
  const wins   = trades.filter(t => t.win === true || parseFloat(t.pnl||0) > 0);
  const totalPnL = trades.reduce((s,t) => s + parseFloat(t.pnl||0), 0);
  const rrs    = trades.map(t => parseFloat(t.metrics?.rrReel||0)).filter(r => r > 0);
  const avgRR  = rrs.length ? (rrs.reduce((s,r) => s+r,0)/rrs.length).toFixed(2) : 0;
  const grossW = wins.reduce((s,t) => s+parseFloat(t.pnl||0),0);
  const grossL = Math.abs(trades.filter(t=>!wins.includes(t)).reduce((s,t)=>s+parseFloat(t.pnl||0),0));
  const pf     = grossL > 0 ? (grossW/grossL).toFixed(2) : grossW > 0 ? '∞' : '0.00';
  let peak=0, eq=0, dd=0;
  [...trades].sort((a,b)=>(a.date||'').localeCompare(b.date||'')).forEach(t=>{
    eq += parseFloat(t.pnl||0);
    if(eq>peak) peak=eq;
    const d = peak>0 ? ((peak-eq)/peak)*100 : 0;
    if(d>dd) dd=d;
  });
  return { total:trades.length, wins:wins.length, losses:trades.length-wins.length,
           winRate:trades.length?(wins.length/trades.length)*100:0, totalPnL, avgRR, pf, maxDD:dd };
};

// ══════════════════════════════════════════════════════════════════════════════
// 🧩 UI ATOMS
// ══════════════════════════════════════════════════════════════════════════════

const Tag = ({ label, color, bg }) => (
  <span style={{
    display:'inline-flex', alignItems:'center',
    padding:'3px 9px', borderRadius:5,
    fontSize:11, fontWeight:700, whiteSpace:'nowrap',
    color, backgroundColor: bg,
    border:`1px solid ${color}30`,
  }}>{label}</span>
);

const GlassBtn = ({ children, onClick, variant='default', icon, disabled, loading, size='md', fullWidth }) => {
  const [ripples, setRipples] = useState([]);
  const V = {
    default: { bg:C.bgGlass, border:C.brd, color:C.t2, shadow:'none' },
    primary: { bg:C.grad, border:'transparent', color:C.bgDeep, shadow:`0 6px 24px ${C.cyanGlow}` },
    danger:  { bg:'rgba(255,71,87,0.1)', border:C.danger, color:C.danger, shadow:'none' },
    ghost:   { bg:'transparent', border:'transparent', color:C.t2, shadow:'none' },
    cyan:    { bg:'rgba(0,212,255,0.08)', border:C.cyan, color:C.cyan, shadow:'none' },
  };
  const S = { sm:{padding:'6px 12px',fontSize:11}, md:{padding:'9px 16px',fontSize:12}, lg:{padding:'12px 20px',fontSize:13} };
  const v = V[variant]||V.default;
  const s = S[size]||S.md;

  const addRipple = (e) => {
    if (disabled||loading) return;
    const r = e.currentTarget.getBoundingClientRect();
    const rpl = { x:e.clientX-r.left, y:e.clientY-r.top, id:Date.now() };
    setRipples(p=>[...p,rpl]);
    setTimeout(()=>setRipples(p=>p.filter(x=>x.id!==rpl.id)),800);
    onClick?.(e);
  };

  return (
    <motion.button onClick={addRipple} disabled={disabled||loading}
      whileHover={!disabled&&!loading?{scale:1.02,y:-1}:{}}
      whileTap={!disabled&&!loading?{scale:0.97}:{}}
      style={{
        position:'relative', display:'inline-flex', alignItems:'center',
        justifyContent:'center', gap:7, ...s, borderRadius:8,
        background:v.bg, border:`1px solid ${v.border}`, color:v.color,
        fontWeight:600, cursor:disabled||loading?'not-allowed':'pointer',
        opacity:disabled?0.5:1, backdropFilter:'blur(10px)',
        boxShadow:v.shadow, overflow:'hidden',
        transition:'all 0.25s cubic-bezier(0.4,0,0.2,1)',
        fontFamily:'inherit', width:fullWidth?'100%':'auto',
      }}
    >
      <AnimatePresence>
        {ripples.map(rpl=>(
          <motion.span key={rpl.id}
            initial={{scale:0,opacity:0.5}} animate={{scale:5,opacity:0}}
            exit={{opacity:0}} transition={{duration:0.7}}
            style={{
              position:'absolute', left:rpl.x, top:rpl.y,
              width:20, height:20, borderRadius:'50%',
              backgroundColor: variant==='primary'?'rgba(255,255,255,0.35)':C.cyan,
              pointerEvents:'none', transform:'translate(-50%,-50%)',
            }}
          />
        ))}
      </AnimatePresence>
      {variant==='primary'&&(
        <motion.div animate={{backgroundPosition:['200% 0','-200% 0']}}
          transition={{duration:6,repeat:Infinity,ease:'linear'}}
          style={{
            position:'absolute',inset:0,
            background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)',
            backgroundSize:'200% 100%',pointerEvents:'none',
          }}
        />
      )}
      {loading&&(
        <motion.div animate={{rotate:360}} transition={{duration:1,repeat:Infinity,ease:'linear'}}
          style={{width:14,height:14,border:`2px solid ${variant==='primary'?C.bgDeep:C.cyan}`,
            borderTopColor:'transparent',borderRadius:'50%'}}
        />
      )}
      {!loading&&icon&&<span style={{fontSize:14,lineHeight:1}}>{icon}</span>}
      {children}
    </motion.button>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// 📊 STAT CARD (6 cards)
// ══════════════════════════════════════════════════════════════════════════════
const StatCard = ({ label, value, color, icon, sub, index }) => {
  const [hov, setHov] = useState(false);
  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible" custom={index}
      whileHover={{ scale:1.03, y:-5 }}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        backgroundColor:C.bgCard,
        border:`1px solid ${hov?C.brdBright:C.brd}`,
        borderRadius:11, padding:'14px 16px',
        position:'relative', overflow:'hidden', cursor:'default',
        boxShadow: hov ? `0 12px 36px rgba(0,0,0,0.4), 0 0 0 1px ${color}30` : '0 2px 8px rgba(0,0,0,0.2)',
        transition:'all 0.25s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      <motion.div animate={{opacity:hov?1:0}} style={{
        position:'absolute',inset:0,
        background:`linear-gradient(135deg,${color}18,transparent)`,
        pointerEvents:'none',
      }}/>
      <div style={{position:'relative',zIndex:1}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
          <span style={{color:C.t3,fontSize:9,fontWeight:700,letterSpacing:'1.2px',textTransform:'uppercase'}}>{label}</span>
          {icon&&<span style={{fontSize:17}}>{icon}</span>}
        </div>
        <div style={{
          fontSize:22,fontWeight:900,color,fontFamily:'monospace',lineHeight:1,
          textShadow: hov ? `0 0 20px ${color}60` : 'none',
          transition:'text-shadow 0.3s',
        }}>{value}</div>
        {sub&&<div style={{fontSize:10,color:C.t3,marginTop:5}}>{sub}</div>}
      </div>
      {hov&&(
        <motion.div initial={{opacity:0,scale:0.8}} animate={{opacity:1,scale:1}}
          style={{
            position:'absolute',bottom:-8,left:'50%',transform:'translateX(-50%)',
            width:'80%',height:5,background:color,
            borderRadius:'0 0 8px 8px',filter:'blur(8px)',pointerEvents:'none',
          }}
        />
      )}
    </motion.div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// 🔍 FILTER BAR AVANCÉE
// ══════════════════════════════════════════════════════════════════════════════
const FilterBar = ({ filters, setFilters, trades, onReset }) => {
  const [expanded, setExpanded] = useState(false);
  const symbols  = useMemo(()=>[...new Set(trades.map(t=>t.symbol).filter(Boolean))].sort(),[trades]);
  const sessions = ['NY','London','Asia'];
  const biases   = ['Bullish','Bearish','Neutral'];
  const activeCount = [
    filters.search, filters.result!=='all'&&filters.result,
    filters.symbol!=='all'&&filters.symbol, filters.session!=='all'&&filters.session,
    filters.bias!=='all'&&filters.bias, filters.dateFrom, filters.dateTo,
  ].filter(Boolean).length;

  const iStyle = {
    padding:'7px 11px', borderRadius:7, border:`1px solid ${C.brd}`,
    backgroundColor:C.bgDeep, color:C.t1, fontSize:12, outline:'none',
    fontFamily:'inherit', cursor:'pointer',
  };

  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible"
      style={{backgroundColor:C.bgCard,border:`1px solid ${C.brd}`,borderRadius:10,padding:'10px 13px',marginBottom:10}}
    >
      {/* Row 1 - Base filters */}
      <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
        <input type="text" placeholder="🔍  Symbole, setup, notes..."
          value={filters.search||''} onChange={e=>setFilters({...filters,search:e.target.value})}
          style={{...iStyle,flex:'1 1 180px'}}
        />
        <select value={filters.result||'all'} onChange={e=>setFilters({...filters,result:e.target.value})} style={iStyle}>
          <option value="all">Tous</option>
          <option value="wins">✅ Gagnants</option>
          <option value="losses">❌ Perdants</option>
          <option value="long">↗ Long</option>
          <option value="short">↘ Short</option>
        </select>
        {symbols.length>0&&(
          <select value={filters.symbol||'all'} onChange={e=>setFilters({...filters,symbol:e.target.value})} style={iStyle}>
            <option value="all">Tous symboles</option>
            {symbols.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        )}
        <GlassBtn size="sm" variant="ghost" icon={expanded?'▲':'▼'}
          onClick={()=>setExpanded(p=>!p)}
        >
          Avancé {activeCount>0&&<span style={{
            background:C.cyan,color:C.bgDeep,borderRadius:'50%',
            width:16,height:16,fontSize:9,fontWeight:900,
            display:'inline-flex',alignItems:'center',justifyContent:'center',
          }}>{activeCount}</span>}
        </GlassBtn>
        {activeCount>0&&(
          <GlassBtn size="sm" variant="danger" icon="✕" onClick={onReset}>Reset</GlassBtn>
        )}
      </div>

      {/* Row 2 - Advanced filters */}
      <AnimatePresence>
        {expanded&&(
          <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}}
            exit={{height:0,opacity:0}} transition={{duration:0.3}}
            style={{overflow:'hidden'}}
          >
            <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:10,paddingTop:10,borderTop:`1px solid ${C.brd}`}}>
              <select value={filters.session||'all'} onChange={e=>setFilters({...filters,session:e.target.value})} style={iStyle}>
                <option value="all">🌍 Toutes sessions</option>
                {sessions.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
              <select value={filters.bias||'all'} onChange={e=>setFilters({...filters,bias:e.target.value})} style={iStyle}>
                <option value="all">⚖️ Tous biais</option>
                {biases.map(b=><option key={b} value={b}>{b}</option>)}
              </select>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <span style={{fontSize:11,color:C.t3,fontWeight:600}}>Du</span>
                <input type="date" value={filters.dateFrom||''} onChange={e=>setFilters({...filters,dateFrom:e.target.value})} style={{...iStyle,cursor:'text'}}/>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <span style={{fontSize:11,color:C.t3,fontWeight:600}}>Au</span>
                <input type="date" value={filters.dateTo||''} onChange={e=>setFilters({...filters,dateTo:e.target.value})} style={{...iStyle,cursor:'text'}}/>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// 📋 TRADE ROW
// ══════════════════════════════════════════════════════════════════════════════
const TradeRow = React.memo(({ trade, isSelected, onSelect, onClickDetail, onDoubleClickEdit, cols, cumulativePnl }) => {
  const [hov, setHov] = useState(false);
  const pnl    = parseFloat(trade.pnl||0);
  const isWin  = pnl >= 0;
  const rowBg  = isSelected
    ? 'rgba(0,212,255,0.06)'
    : hov
      ? C.bgHov
      : isWin
        ? 'rgba(0,230,118,0.025)'
        : 'rgba(255,71,87,0.025)';

  const cell = (key) => {
    switch(key) {
      case 'date':
        return (
          <div>
            <div style={{color:C.t1,fontSize:12,fontWeight:600}}>{trade.date?.substring(0,10)||'N/A'}</div>
            <div style={{color:C.t3,fontSize:10}}>{trade.time||''}</div>
          </div>
        );
      case 'symbol':
        return (
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{
              width:30,height:30,borderRadius:7,background:C.grad,
              display:'flex',alignItems:'center',justifyContent:'center',
              fontSize:10,fontWeight:900,color:C.bgDeep,flexShrink:0,
            }}>{trade.symbol?.substring(0,2)||'??'}</div>
            <div>
              <div style={{color:C.t1,fontSize:12,fontWeight:700}}>{trade.symbol||'N/A'}</div>
              <div style={{color:C.t3,fontSize:10}}>{trade.marketType||''}</div>
            </div>
          </div>
        );
      case 'type':
        return <Tag label={trade.type==='Long'?'↗ Long':'↘ Short'}
          color={trade.type==='Long'?C.green:C.danger}
          bg={trade.type==='Long'?'rgba(0,230,118,0.1)':'rgba(255,71,87,0.1)'}/>;
      case 'session':
        return <Tag label={trade.session||'—'} color={C.cyan} bg="rgba(0,212,255,0.08)"/>;
      case 'bias':
        return <Tag label={trade.bias||'—'}
          color={trade.bias==='Bullish'?C.green:trade.bias==='Bearish'?C.danger:C.t2}
          bg={trade.bias==='Bullish'?'rgba(0,230,118,0.08)':trade.bias==='Bearish'?'rgba(255,71,87,0.08)':'rgba(255,255,255,0.04)'}/>;
      case 'news':
        return <Tag label={trade.newsImpact||'—'}
          color={trade.newsImpact==='High'?C.danger:trade.newsImpact==='Medium'?C.warn:C.teal}
          bg={trade.newsImpact==='High'?'rgba(255,71,87,0.1)':trade.newsImpact==='Medium'?'rgba(255,179,0,0.1)':'rgba(0,201,167,0.1)'}/>;
      case 'entry':
        return <span style={{color:C.t1,fontSize:12,fontFamily:'monospace'}}>{parseFloat(trade.entry||0).toFixed(5)}</span>;
      case 'exit':
        return <span style={{color:C.t1,fontSize:12,fontFamily:'monospace'}}>{parseFloat(trade.exit||0).toFixed(5)}</span>;
      case 'tpPercent': {
        const v = parseFloat(trade.metrics?.tpPercent||0);
        return <Tag label={`${v>=0?'+':''}${v.toFixed(1)}%`}
          color={v>=0?C.green:C.danger} bg={v>=0?'rgba(0,230,118,0.1)':'rgba(255,71,87,0.1)'}/>;
      }
      case 'rr':
        return <Tag label={`1:${trade.metrics?.rrReel||0}`} color={C.teal} bg="rgba(0,201,167,0.1)"/>;
      case 'setup':
        return trade.setup ? <Tag label={trade.setup} color={C.purple} bg="rgba(167,139,250,0.1)"/> : <span style={{color:C.t3}}>—</span>;
      case 'psychology': {
        const s = trade.psychologyScore;
        if (s==null) return <span style={{color:C.t3}}>—</span>;
        return <Tag label={s}
          color={s>=80?C.green:s>=60?C.warn:C.danger}
          bg={s>=80?'rgba(0,230,118,0.08)':s>=60?'rgba(255,179,0,0.08)':'rgba(255,71,87,0.08)'}/>;
      }
      case 'pnl':
        return (
          <div>
            <div style={{color:isWin?C.green:C.danger,fontSize:13,fontWeight:800,fontFamily:'monospace'}}>
              {fmtPnl(pnl)}
            </div>
            {cumulativePnl!=null&&(
              <div style={{color:cumulativePnl>=0?C.greenDim:C.dangerDim,fontSize:9,fontWeight:600,marginTop:1}}>
                Cumul: {fmtPnl(cumulativePnl)}
              </div>
            )}
          </div>
        );
      default:
        return <span style={{color:C.t3,fontSize:11}}>—</span>;
    }
  };

  return (
    <motion.tr
      initial={{opacity:0,y:6}} animate={{opacity:1,y:0}}
      exit={{opacity:0,y:-6}} transition={{duration:0.15}}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      onClick={onClickDetail}
      onDoubleClick={()=>onDoubleClickEdit(trade)}
      style={{
        backgroundColor: rowBg,
        borderLeft:`2px solid ${isSelected?C.cyan:isWin?'rgba(0,230,118,0.15)':'rgba(255,71,87,0.15)'}`,
        cursor:'pointer', transition:'all 0.12s ease',
      }}
    >
      {cols.map(col=>(
        <td key={col.key}
          onClick={col.key==='select'?(e)=>{e.stopPropagation();onSelect(trade.id);}:undefined}
          style={{padding:'10px 14px',whiteSpace:'nowrap',borderBottom:`1px solid ${C.brd}`,verticalAlign:'middle'}}
        >
          {col.key==='select'
            ? <input type="checkbox" checked={isSelected} onChange={()=>onSelect(trade.id)}
                onClick={e=>e.stopPropagation()}
                style={{cursor:'pointer',accentColor:C.cyan,width:14,height:14}}/>
            : cell(col.key)
          }
        </td>
      ))}
    </motion.tr>
  );
});
TradeRow.displayName = 'TradeRow';

// ══════════════════════════════════════════════════════════════════════════════
// 📑 PAGINATION
// ══════════════════════════════════════════════════════════════════════════════
const Pagination = ({ page, total, perPage, onPage, onPerPage }) => {
  const totalPages = Math.ceil(total/perPage)||1;
  return (
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12,marginTop:16}}>
      <div style={{fontSize:12,color:C.t3}}>
        {((page-1)*perPage)+1}–{Math.min(page*perPage,total)} sur <span style={{color:C.cyan,fontWeight:700}}>{total}</span> trades
      </div>
      <div style={{display:'flex',gap:6,alignItems:'center'}}>
        <motion.button whileHover={{scale:1.1}} onClick={()=>onPage(page-1)} disabled={page===1}
          style={{width:32,height:32,borderRadius:6,border:`1px solid ${C.brd}`,
            backgroundColor:C.bgDeep,color:page===1?C.t3:C.t1,cursor:page===1?'not-allowed':'pointer',opacity:page===1?0.4:1}}>◀</motion.button>
        <span style={{fontSize:12,color:C.t1,padding:'0 12px'}}>Page {page} / {totalPages}</span>
        <motion.button whileHover={{scale:1.1}} onClick={()=>onPage(page+1)} disabled={page===totalPages}
          style={{width:32,height:32,borderRadius:6,border:`1px solid ${C.brd}`,
            backgroundColor:C.bgDeep,color:page===totalPages?C.t3:C.t1,cursor:page===totalPages?'not-allowed':'pointer',opacity:page===totalPages?0.4:1}}>▶</motion.button>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <span style={{fontSize:12,color:C.t3}}>Par page:</span>
        <select value={perPage} onChange={e=>onPerPage(Number(e.target.value))}
          style={{padding:'6px 10px',borderRadius:6,border:`1px solid ${C.brd}`,
            backgroundColor:C.bgDeep,color:C.t1,fontSize:12,cursor:'pointer',outline:'none',fontFamily:'inherit'}}>
          {[10,25,50,100].map(n=><option key={n} value={n}>{n}</option>)}
        </select>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// 🎯 TRADE DETAIL PANEL (slide depuis la droite)
// ══════════════════════════════════════════════════════════════════════════════

/** Mini progress bar */
const PBar = ({ label, value, max=100, color }) => (
  <div style={{marginBottom:10}}>
    <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
      <span style={{fontSize:10,color:C.t3,fontWeight:600}}>{label}</span>
      <span style={{fontSize:10,fontWeight:800,color}}>{value}</span>
    </div>
    <div style={{height:4,borderRadius:2,backgroundColor:C.bgDeep,overflow:'hidden'}}>
      <motion.div initial={{width:0}} animate={{width:`${Math.min(100,(value/max)*100)}%`}}
        transition={{duration:0.8,ease:[0.22,1,0.36,1]}}
        style={{height:'100%',borderRadius:2,background:color,boxShadow:`0 0 8px ${color}50`}}/>
    </div>
  </div>
);

/** Section titre avec ligne */
const SecTitle = ({ icon, title, color=C.cyan }) => (
  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12,marginTop:4}}>
    <span style={{fontSize:13}}>{icon}</span>
    <span style={{fontSize:10,fontWeight:800,color:C.t3,letterSpacing:'1.5px',textTransform:'uppercase'}}>{title}</span>
    <div style={{flex:1,height:1,background:`linear-gradient(90deg,${color}40,transparent)`}}/>
  </div>
);

/** Ligne métrique label / valeur */
const MRow = ({ label, value, color, sub, icon }) => (
  <div style={{
    display:'flex',justifyContent:'space-between',alignItems:'center',
    padding:'9px 0',borderBottom:`1px solid ${C.brd}`,
  }}>
    <div style={{display:'flex',alignItems:'center',gap:7}}>
      {icon&&<span style={{fontSize:13,opacity:0.8}}>{icon}</span>}
      <div>
        <div style={{fontSize:10,color:C.t3,fontWeight:600,letterSpacing:'0.4px'}}>{label}</div>
        {sub&&<div style={{fontSize:9,color:C.t4,marginTop:1}}>{sub}</div>}
      </div>
    </div>
    <div style={{fontSize:13,fontWeight:800,color:color||C.t1,fontFamily:'monospace'}}>{value}</div>
  </div>
);

/** Mini chart simulé entry→exit */
const MiniChart = ({ trade }) => {
  const pnl   = parseFloat(trade?.pnl||0);
  const isWin = pnl >= 0;
  const color = isWin ? C.green : C.danger;
  const entry = parseFloat(trade?.entry||0);
  const exit  = parseFloat(trade?.exit||0);

  const data = useMemo(()=>{
    if(!entry||!exit) return [];
    const pts=14, diff=exit-entry;
    return Array.from({length:pts},(_,i)=>{
      const t=i/(pts-1);
      const noise = i>0&&i<pts-1 ? Math.sin(i*1.6)*Math.abs(diff)*0.12 : 0;
      return { i, price: entry+diff*t+noise };
    });
  },[entry,exit]);

  if(!entry||!exit) return null;

  return (
    <div style={{padding:'14px',borderRadius:10,backgroundColor:C.bgDeep,border:`1px solid ${C.brd}`,marginBottom:16}}>
      <div style={{fontSize:10,color:C.t3,fontWeight:700,letterSpacing:'0.8px',marginBottom:10}}>TRADE PATH</div>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
        <div>
          <div style={{fontSize:8,color:C.t3,fontWeight:700}}>ENTRY</div>
          <div style={{fontSize:12,fontWeight:800,color:C.cyan,fontFamily:'monospace'}}>{entry.toFixed(5)}</div>
        </div>
        {trade?.sl&&parseFloat(trade.sl)>0&&(
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:8,color:C.t3,fontWeight:700}}>SL</div>
            <div style={{fontSize:11,fontWeight:700,color:C.danger,fontFamily:'monospace'}}>{parseFloat(trade.sl).toFixed(5)}</div>
          </div>
        )}
        {trade?.tp&&parseFloat(trade.tp)>0&&(
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:8,color:C.t3,fontWeight:700}}>TP</div>
            <div style={{fontSize:11,fontWeight:700,color:C.green,fontFamily:'monospace'}}>{parseFloat(trade.tp).toFixed(5)}</div>
          </div>
        )}
        <div style={{textAlign:'right'}}>
          <div style={{fontSize:8,color:C.t3,fontWeight:700}}>EXIT</div>
          <div style={{fontSize:12,fontWeight:800,color,fontFamily:'monospace'}}>{exit.toFixed(5)}</div>
        </div>
      </div>
      <div style={{height:70}}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{top:4,right:0,bottom:0,left:0}}>
            <defs>
              <linearGradient id={`cg_${trade?.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={color} stopOpacity={0.28}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="price" stroke={color} strokeWidth={2}
              fill={`url(#cg_${trade?.id})`} dot={false}
              activeDot={{r:4,fill:color,stroke:C.bgDeep,strokeWidth:2}}/>
            <Tooltip contentStyle={{backgroundColor:C.bgCard,border:`1px solid ${C.brd}`,borderRadius:6,fontSize:10,color:C.t1}}
              formatter={v=>[v?.toFixed(5),'Prix']} labelFormatter={()=>''}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {/* P&L strip */}
      <motion.div initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} transition={{delay:0.35}}
        style={{
          marginTop:10,padding:'8px 12px',borderRadius:7,
          background:`linear-gradient(135deg,${color}12,${color}04)`,
          border:`1px solid ${color}28`,
          display:'flex',justifyContent:'space-between',alignItems:'center',
        }}
      >
        <span style={{fontSize:10,color:C.t3,fontWeight:600}}>Résultat net</span>
        <span style={{fontSize:18,fontWeight:900,color,fontFamily:'monospace',textShadow:`0 0 20px ${color}60`}}>
          {fmtPnl(pnl)}
        </span>
      </motion.div>
    </div>
  );
};

/** Score psycho visuel */
const PsychoCard = ({ score }) => {
  const s     = parseInt(score)||0;
  const color = s>=80?C.green:s>=60?C.warn:C.danger;
  const label = s>=80?'Excellent':s>=60?'Correct':'Difficile';
  const emoji = s>=80?'🧠':s>=60?'😐':'😰';
  return (
    <div style={{
      padding:'12px 14px',borderRadius:10,
      background:`linear-gradient(135deg,${color}10,transparent)`,
      border:`1px solid ${color}28`,marginBottom:12,
    }}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:18}}>{emoji}</span>
          <div>
            <div style={{fontSize:10,color:C.t3,fontWeight:600}}>Score Psychologique</div>
            <div style={{fontSize:11,color,fontWeight:700}}>{label}</div>
          </div>
        </div>
        <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:'spring',delay:0.3}}
          style={{fontSize:26,fontWeight:900,color,fontFamily:'monospace'}}>{s}</motion.div>
      </div>
      <div style={{height:5,borderRadius:3,backgroundColor:C.bgDeep,overflow:'hidden'}}>
        <motion.div initial={{width:0}} animate={{width:`${s}%`}}
          transition={{duration:0.9,ease:[0.22,1,0.36,1],delay:0.2}}
          style={{height:'100%',borderRadius:3,background:`linear-gradient(90deg,${color},${color}88)`,boxShadow:`0 0 10px ${color}60`}}/>
      </div>
    </div>
  );
};

/** Panel principal */
const TradeDetailPanel = ({ trade, onClose, onEdit, onDelete }) => {
  const panelRef = useRef(null);

  useEffect(()=>{
    const fn = e => { if(e.key==='Escape') onClose?.(); };
    window.addEventListener('keydown',fn);
    return ()=>window.removeEventListener('keydown',fn);
  },[onClose]);

  useEffect(()=>{ if(panelRef.current) panelRef.current.scrollTop=0; },[trade?.id]);

  if(!trade) return null;

  const pnl    = parseFloat(trade.pnl||0);
  const isWin  = pnl>=0;
  const pColor = isWin?C.green:C.danger;
  const pGlow  = isWin?C.greenGlow:C.dangerGlow;
  const rr     = trade.metrics?.rrReel||'0';
  const tpPct  = trade.metrics?.tpPercent||'0';
  const typeC  = trade.type==='Long'?C.green:C.danger;
  const biasC  = trade.bias==='Bullish'?C.green:trade.bias==='Bearish'?C.danger:C.t2;
  const newsC  = trade.newsImpact==='High'?C.danger:trade.newsImpact==='Medium'?C.warn:C.teal;
  const sessE  = {NY:'🗽',London:'🎡',Asia:'🏯'}[trade.session]||'🌍';

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div key="bd" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
        transition={{duration:0.22}} onClick={onClose}
        style={{position:'fixed',inset:0,backgroundColor:'rgba(7,10,20,0.6)',backdropFilter:'blur(3px)',zIndex:200}}
      />

      {/* Panel */}
      <motion.div key="pnl"
        initial={{x:'100%',opacity:0.6}} animate={{x:0,opacity:1}}
        exit={{x:'100%',opacity:0}}
        transition={{type:'spring',stiffness:300,damping:34,mass:0.85}}
        style={{
          position:'fixed',top:0,right:0,bottom:0,width:420,
          backgroundColor:C.bgCard,
          borderLeft:`1px solid ${C.brdSoft}`,
          zIndex:201,display:'flex',flexDirection:'column',
          boxShadow:`-20px 0 70px rgba(0,0,0,0.55)`,
          fontFamily:'system-ui,-apple-system,sans-serif',
        }}
      >
        {/* Ambient glow */}
        <div style={{
          position:'absolute',top:-100,right:-100,width:320,height:320,
          borderRadius:'50%',background:`radial-gradient(circle,${pColor}18,transparent 70%)`,
          pointerEvents:'none',zIndex:0,
        }}/>

        {/* ─── HEADER ─── */}
        <div style={{
          position:'relative',zIndex:1,
          padding:'18px 18px 14px',
          borderBottom:`1px solid ${C.brd}`,
          background:`linear-gradient(180deg,${C.bgHigh},${C.bgCard})`,
          flexShrink:0,
        }}>
          {/* Symbol row */}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <motion.div initial={{scale:0.5,opacity:0}} animate={{scale:1,opacity:1}}
                transition={{type:'spring',delay:0.08}}
                style={{
                  width:46,height:46,borderRadius:12,background:C.grad,
                  display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:13,fontWeight:900,color:C.bgDeep,
                  boxShadow:`0 4px 18px ${C.cyanGlow}`,flexShrink:0,
                }}>
                {trade.symbol?.substring(0,2)||'??'}
              </motion.div>
              <div>
                <motion.div initial={{x:-8,opacity:0}} animate={{x:0,opacity:1}} transition={{delay:0.1}}
                  style={{fontSize:19,fontWeight:900,color:C.t1,letterSpacing:'-0.5px',lineHeight:1.1}}>
                  {trade.symbol||'—'}
                </motion.div>
                <motion.div initial={{x:-8,opacity:0}} animate={{x:0,opacity:1}} transition={{delay:0.14}}
                  style={{fontSize:11,color:C.t3,marginTop:2}}>
                  {trade.date?.substring(0,10)||'—'} · {trade.time||'—'}
                </motion.div>
              </div>
            </div>
            <motion.button onClick={onClose}
              whileHover={{scale:1.15,rotate:90}} whileTap={{scale:0.88}}
              style={{
                width:30,height:30,borderRadius:7,border:`1px solid ${C.brd}`,
                backgroundColor:C.bgDeep,color:C.t3,cursor:'pointer',fontSize:14,
                display:'flex',alignItems:'center',justifyContent:'center',
                transition:'all 0.18s',
              }}>✕</motion.button>
          </div>

          {/* Tags */}
          <motion.div initial={{y:5,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:0.17}}
            style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:12}}>
            <Tag label={trade.type==='Long'?'↗ Long':'↘ Short'} color={typeC} bg={`${typeC}14`}/>
            <Tag label={`${sessE} ${trade.session||'—'}`} color={C.cyan} bg="rgba(0,212,255,0.08)"/>
            {trade.bias&&<Tag label={trade.bias} color={biasC} bg={`${biasC}12`}/>}
            {trade.newsImpact&&<Tag label={`📰 ${trade.newsImpact}`} color={newsC} bg={`${newsC}12`}/>}
            {trade.setup&&<Tag label={trade.setup} color={C.purple} bg="rgba(167,139,250,0.1)"/>}
          </motion.div>

          {/* P&L Hero */}
          <motion.div initial={{scale:0.88,opacity:0}} animate={{scale:1,opacity:1}}
            transition={{type:'spring',delay:0.16,stiffness:180}}
            style={{
              padding:'12px 14px',borderRadius:10,
              background:`linear-gradient(135deg,${pColor}14,${pColor}04)`,
              border:`1px solid ${pColor}28`,
              display:'flex',justifyContent:'space-between',alignItems:'center',
            }}>
            <div>
              <div style={{fontSize:9,color:C.t3,fontWeight:700,letterSpacing:'1px',marginBottom:4}}>RÉSULTAT NET</div>
              <div style={{
                fontSize:30,fontWeight:900,color:pColor,fontFamily:'monospace',
                letterSpacing:'-0.5px',textShadow:`0 0 28px ${pGlow}`,
              }}>{fmtPnl(pnl)}</div>
            </div>
            <div style={{textAlign:'right'}}>
              <motion.div animate={{scale:[1,1.1,1]}} transition={{duration:2.5,repeat:Infinity}}
                style={{fontSize:32,filter:`drop-shadow(0 4px 10px ${pGlow})`}}>
                {isWin?'✅':'❌'}
              </motion.div>
              <div style={{fontSize:10,color:C.t3,marginTop:4}}>
                RR: <span style={{color:C.teal,fontWeight:800}}>1:{rr}</span>
              </div>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div initial={{y:5,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:0.24}}
            style={{display:'flex',gap:7,marginTop:11}}>
            <GlassBtn variant="primary" icon="✏️" size="sm" onClick={()=>onEdit?.(trade)}>Modifier</GlassBtn>
            <GlassBtn variant="danger"  icon="🗑️" size="sm" onClick={()=>{
              if(window.confirm('Supprimer ce trade ?')) onDelete?.(trade.id);
            }}>Supprimer</GlassBtn>
            <div style={{flex:1}}/>
            <GlassBtn variant="ghost" icon="📋" size="sm" onClick={()=>{
              navigator.clipboard?.writeText(JSON.stringify(trade,null,2));
              toast.success('Copié !');
            }}/>
          </motion.div>
        </div>

        {/* ─── BODY SCROLLABLE ─── */}
        <div ref={panelRef} style={{
          flex:1,overflowY:'auto',overflowX:'hidden',padding:'18px',
          scrollbarWidth:'thin',scrollbarColor:`${C.brd} transparent`,
        }}>
          {/* Chart */}
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.2}}>
            <MiniChart trade={trade}/>
          </motion.div>

          {/* Métriques */}
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.24}}>
            <SecTitle icon="📊" title="Métriques" color={C.cyan}/>
            <div style={{backgroundColor:C.bgDeep,borderRadius:10,padding:'2px 14px',border:`1px solid ${C.brd}`,marginBottom:16}}>
              <MRow label="P&L Net"       value={fmtPnl(pnl)}  color={pColor} icon="💰"/>
              <MRow label="Risk / Reward" value={`1 : ${rr}`}
                color={parseFloat(rr)>=2?C.green:parseFloat(rr)>=1?C.warn:C.danger}
                sub="Réel atteint" icon="⚖️"/>
              <MRow label="TP Atteint"    value={`${tpPct}%`}
                color={parseFloat(tpPct)>=100?C.green:parseFloat(tpPct)>=50?C.warn:C.danger}
                sub="% de l'objectif" icon="🎯"/>
              <MRow label="Prix d'entrée" value={fmt(trade.entry,5)} icon="📍"/>
              <MRow label="Prix de sortie" value={fmt(trade.exit,5)} icon="🏁"/>
              {trade.sl&&parseFloat(trade.sl)>0&&<MRow label="Stop Loss" value={fmt(trade.sl,5)} color={C.danger} icon="🛑"/>}
              {trade.tp&&parseFloat(trade.tp)>0&&<MRow label="Take Profit" value={fmt(trade.tp,5)} color={C.green} icon="✨"/>}
            </div>
          </motion.div>

          {/* Contexte */}
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.28}}>
            <SecTitle icon="🌍" title="Contexte" color={C.blue}/>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:16}}>
              {[
                {label:'Session',value:trade.session||'—',icon:sessE,color:C.cyan},
                {label:'Bias',value:trade.bias||'—',icon:trade.bias==='Bullish'?'🐂':trade.bias==='Bearish'?'🐻':'⚖️',color:biasC},
                {label:'News',value:trade.newsImpact||'—',icon:'📰',color:newsC},
                {label:'Setup',value:trade.setup||'—',icon:'🎯',color:C.purple},
                {label:'Type',value:trade.type||'—',icon:trade.type==='Long'?'↗':'↘',color:typeC},
                {label:'Date',value:trade.date?.substring(0,10)||'—',icon:'📅',color:C.t2},
              ].map(({label,value,icon,color})=>(
                <div key={label} style={{padding:'10px 11px',borderRadius:8,backgroundColor:C.bgDeep,border:`1px solid ${C.brd}`}}>
                  <div style={{fontSize:8,color:C.t3,fontWeight:700,letterSpacing:'0.8px',marginBottom:5,textTransform:'uppercase'}}>
                    {icon} {label}
                  </div>
                  <div style={{fontSize:12,fontWeight:800,color}}>{value}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Psychologie */}
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.32}}>
            <SecTitle icon="🧠" title="Psychologie" color={C.purple}/>
            <PsychoCard score={trade.psychologyScore}/>
            <PBar label="Discipline" value={trade.psychologyScore>=80?90:trade.psychologyScore>=60?65:40} color={C.purple}/>
            <PBar label="Gestion émotions" value={parseInt(trade.psychologyScore)||0} color={C.blue}/>
            <PBar label="Confiance" value={Math.min(100,(parseInt(trade.psychologyScore)||0)+10)} color={C.cyan}/>
            <div style={{marginBottom:16}}/>
          </motion.div>

          {/* Notes */}
          {trade.notes&&(
            <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.36}}>
              <SecTitle icon="📝" title="Notes" color={C.warn}/>
              <div style={{
                padding:'13px 15px',borderRadius:10,backgroundColor:C.bgDeep,
                border:`1px solid ${C.brd}`,borderLeft:`3px solid ${C.warn}40`,
                fontSize:12,color:C.t2,lineHeight:1.75,fontStyle:'italic',
                marginBottom:16,whiteSpace:'pre-wrap',
              }}>
                <span style={{fontSize:15,marginRight:5,opacity:0.4}}>"</span>
                {trade.notes}
                <span style={{fontSize:15,marginLeft:5,opacity:0.4}}>"</span>
              </div>
            </motion.div>
          )}

          {/* Meta */}
          <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.42}}
            style={{padding:'9px 13px',borderRadius:8,backgroundColor:C.bgDeep,border:`1px solid ${C.brd}`,marginBottom:8}}>
            <div style={{fontSize:9,color:C.t3,fontFamily:'monospace',wordBreak:'break-all'}}>ID: {trade.id||'—'}</div>
            {trade.lastModified&&<div style={{fontSize:9,color:C.t3,marginTop:2}}>
              Modifié: {new Date(trade.lastModified).toLocaleString('fr-FR')}
            </div>}
          </motion.div>

          <div style={{height:20}}/>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// 📥 MODAL MÉTHODE D'AJOUT
// ══════════════════════════════════════════════════════════════════════════════
const AddMethodModal = ({ isOpen, onClose, onSelectMethod }) => {
  if(!isOpen) return null;
  return (
    <AnimatePresence>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}
        style={{position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.7)',backdropFilter:'blur(4px)',
          zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
        <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.9,opacity:0}}
          onClick={e=>e.stopPropagation()}
          style={{backgroundColor:C.bgCard,borderRadius:16,border:`1px solid ${C.brd}`,maxWidth:600,width:'100%',overflow:'hidden'}}>
          <div style={{padding:'22px',borderBottom:`1px solid ${C.brd}`,textAlign:'center'}}>
            <h2 style={{margin:0,fontSize:22,fontWeight:800,background:C.grad,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
              Ajouter des Trades
            </h2>
            <p style={{margin:'6px 0 0',fontSize:12,color:C.t3}}>Choisissez votre méthode d'ajout</p>
          </div>
          <div style={{padding:'28px 22px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:18}}>
            {[
              {m:'auto',  icon:'📥', title:'Automatique', desc:'Importez depuis CSV, JSON ou Notion'},
              {m:'manual',icon:'✏️', title:'Manuel',      desc:'Remplissez le formulaire complet'},
            ].map(({m,icon,title,desc})=>(
              <motion.div key={m} whileHover={{scale:1.03,y:-4}} whileTap={{scale:0.97}}
                onClick={()=>{onSelectMethod(m);onClose();}}
                style={{padding:'28px 20px',borderRadius:11,border:`1px solid ${C.brd}`,
                  backgroundColor:C.bgDeep,cursor:'pointer',textAlign:'center'}}>
                <div style={{fontSize:52,marginBottom:12}}>{icon}</div>
                <h3 style={{margin:'0 0 7px',fontSize:16,fontWeight:700,color:C.t1}}>{title}</h3>
                <p style={{margin:0,fontSize:11,color:C.t3,lineHeight:1.6}}>{desc}</p>
              </motion.div>
            ))}
          </div>
          <div style={{padding:'14px 22px',borderTop:`1px solid ${C.brd}`,textAlign:'center'}}>
            <GlassBtn onClick={onClose}>Annuler</GlassBtn>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// 📂 IMPORT MODAL (CSV parser universel)
// ══════════════════════════════════════════════════════════════════════════════
const ImportModal = ({ isOpen, onClose, onImport }) => {
  const [file, setFile]       = useState(null);
  const [drag, setDrag]       = useState(false);
  const [loading, setLoading] = useState(false);
  const fileRef               = useRef(null);

  const detectSep = c => {
    const l = c.split(/\r?\n/)[0];
    const seps=[',',';','\t','|'];
    const counts=seps.map(s=>(l.match(new RegExp(`\\${s}`,'g'))||[]).length);
    return seps[counts.indexOf(Math.max(...counts))];
  };

  const cleanVal = v => {
    if(!v) return '';
    return v.toString().trim().replace(/^["']|["']$/g,'').replace(/""/g,'"').replace(/\s+/g,' ').trim();
  };

  const parseCSVLine = (line, sep=',') => {
    const vals=[]; let cur='', inQ=false;
    for(let i=0;i<line.length;i++){
      const c=line[i];
      if(c==='"'){ if(inQ&&line[i+1]==='"'){cur+='"';i++;}else inQ=!inQ; }
      else if(c===sep&&!inQ){ vals.push(cleanVal(cur)); cur=''; }
      else cur+=c;
    }
    vals.push(cleanVal(cur));
    return vals;
  };

  const mapCol = name => {
    const n=name.toString().trim().toLowerCase().replace(/[\u{1F300}-\u{1F9FF}]/gu,'').replace(/[^\w\s]/g,'').replace(/\s+/g,'');
    const m={
      symbol:'symbol',symbole:'symbol',instrument:'symbol',asset:'symbol',pair:'symbol',ticker:'symbol',
      type:'type',direction:'type',side:'type',
      entry:'entry',entryprice:'entry',open:'entry',prixentree:'entry',
      exit:'exit',exitprice:'exit',close:'exit',prixsortie:'exit',
      pnl:'pnl',pl:'pnl',profit:'pnl',gain:'pnl',result:'pnl',resultat:'pnl',
      date:'date',tradedate:'date',opendate:'date',entrydate:'date',
      time:'time',heure:'time',
      session:'session',market:'session',
      sl:'sl',stoploss:'sl',stop:'sl',
      tp:'tp',takeprofit:'tp',target:'tp',
      setup:'setup',strategy:'setup',strategie:'setup',pattern:'setup',
      notes:'notes',note:'notes',comment:'notes',commentaire:'notes',
      bias:'bias',sentiment:'bias',trend:'bias',
      news:'newsImpact',newsimpact:'newsImpact',impact:'newsImpact',
      psychology:'psychologyScore',psychologyscore:'psychologyScore',psycho:'psychologyScore',
    };
    return m[n]||name;
  };

  const handleImport = () => {
    if(!file){ toast.error('Sélectionnez un fichier CSV'); return; }
    setLoading(true);
    const reader=new FileReader();
    reader.onload=e=>{
      try{
        const bytes=new Uint8Array(e.target.result);
        let content;
        if(bytes[0]===0xEF&&bytes[1]===0xBB&&bytes[2]===0xBF) content=new TextDecoder('utf-8').decode(bytes.slice(3));
        else content=new TextDecoder('utf-8').decode(bytes);
        content=content.trim();
        const sep=detectSep(content);
        const lines=content.split(/\r?\n/).filter(l=>l.trim());
        if(lines.length<2){toast.error('Fichier trop court');setLoading(false);return;}
        const rawH=parseCSVLine(lines[0],sep);
        const mappedH=rawH.map(mapCol);
        const results=[], errors=[];
        for(let i=1;i<lines.length;i++){
          const vals=parseCSVLine(lines[i],sep);
          const raw={};
          rawH.forEach((h,idx)=>{raw[h]=vals[idx]||'';});
          const mapped={};
          Object.keys(raw).forEach(k=>{mapped[mapCol(k)]=raw[k];});
          if(!mapped.symbol||!mapped.entry||!mapped.exit||!mapped.pnl){
            errors.push(i+1); continue;
          }
          const entry=parseFloat(cleanVal(mapped.entry))||0;
          const exit=parseFloat(cleanVal(mapped.exit))||0;
          const sl=mapped.sl?parseFloat(cleanVal(mapped.sl)):null;
          const tp=mapped.tp?parseFloat(cleanVal(mapped.tp)):null;
          const risk=sl?Math.abs(entry-sl):0;
          const reward=Math.abs(exit-entry);
          results.push({
            id:`imp_${Date.now()}_${i}_${Math.random().toString(36).slice(2,7)}`,
            symbol:cleanVal(mapped.symbol).toUpperCase(),
            type:cleanVal(mapped.type)||'Long',
            entry, exit,
            pnl:parseFloat(cleanVal(mapped.pnl))||0,
            date:cleanVal(mapped.date)||new Date().toISOString().split('T')[0],
            time:cleanVal(mapped.time)||'00:00',
            session:cleanVal(mapped.session)||'NY',
            bias:cleanVal(mapped.bias)||'Neutral',
            newsImpact:cleanVal(mapped.newsImpact)||'Low',
            setup:cleanVal(mapped.setup)||'',
            notes:cleanVal(mapped.notes)||'',
            sl, tp,
            psychologyScore:mapped.psychologyScore?parseInt(cleanVal(mapped.psychologyScore)):80,
            win:parseFloat(cleanVal(mapped.pnl))>0,
            metrics:{
              rrReel:risk>0?(reward/risk).toFixed(2):'0',
              tpPercent:tp?Math.abs(tp-entry)>0?((reward/Math.abs(tp-entry))*100).toFixed(1):'0':'0',
            },
          });
        }
        if(!results.length){toast.error('Aucun trade valide');setLoading(false);return;}
        onImport(results);
        toast.success(`🎉 ${results.length} trades importés !`);
        if(errors.length) toast.error(`⚠️ ${errors.length} lignes ignorées`);
        setLoading(false); setFile(null); onClose();
      }catch(err){toast.error(`Erreur: ${err.message}`);setLoading(false);}
    };
    reader.readAsArrayBuffer(file);
  };

  if(!isOpen) return null;
  return (
    <AnimatePresence>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}
        style={{position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.7)',backdropFilter:'blur(4px)',
          zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
        <motion.div initial={{scale:0.9}} animate={{scale:1}} exit={{scale:0.9}} onClick={e=>e.stopPropagation()}
          style={{backgroundColor:C.bgCard,borderRadius:16,border:`1px solid ${C.brd}`,maxWidth:480,width:'100%'}}>
          <div style={{padding:'18px 22px',borderBottom:`1px solid ${C.brd}`}}>
            <h3 style={{margin:0,fontSize:16,fontWeight:700,color:C.t1}}>📥 Import CSV</h3>
          </div>
          <div style={{padding:'22px'}}>
            <div
              onDragEnter={e=>{e.preventDefault();setDrag(true);}}
              onDragLeave={e=>{e.preventDefault();setDrag(false);}}
              onDragOver={e=>{e.preventDefault();setDrag(true);}}
              onDrop={e=>{e.preventDefault();setDrag(false);if(e.dataTransfer.files[0])setFile(e.dataTransfer.files[0]);}}
              onClick={()=>fileRef.current?.click()}
              style={{
                border:`2px dashed ${drag?C.cyan:C.brd}`,borderRadius:11,padding:36,textAlign:'center',
                backgroundColor:drag?'rgba(0,212,255,0.05)':C.bgDeep,cursor:'pointer',transition:'all 0.25s',
              }}>
              <input ref={fileRef} type="file" accept=".csv" style={{display:'none'}}
                onChange={e=>e.target.files[0]&&setFile(e.target.files[0])}/>
              <div style={{fontSize:44,marginBottom:12}}>📁</div>
              {file
                ? <div style={{fontSize:13,fontWeight:600,color:C.cyan}}>{file.name} ({(file.size/1024).toFixed(1)} KB)</div>
                : <div style={{fontSize:13,color:C.t2}}>Glissez votre CSV ou cliquez</div>}
            </div>
            <div style={{marginTop:16,padding:12,borderRadius:8,backgroundColor:'rgba(0,212,255,0.05)',border:`1px solid rgba(0,212,255,0.15)`}}>
              <div style={{fontSize:10,fontWeight:700,color:C.cyan,marginBottom:6}}>Format attendu :</div>
              <div style={{fontSize:10,color:C.t3,fontFamily:'monospace',lineHeight:1.7}}>
                date,symbol,type,entry,exit,pnl,session,bias<br/>
                2024-01-15,EURUSD,Long,1.0850,1.0900,150,NY,Bullish
              </div>
            </div>
          </div>
          <div style={{padding:'14px 22px',borderTop:`1px solid ${C.brd}`,display:'flex',gap:9,justifyContent:'flex-end'}}>
            <GlassBtn onClick={onClose}>Annuler</GlassBtn>
            <GlassBtn variant="primary" onClick={handleImport} disabled={!file} loading={loading}>Importer</GlassBtn>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// ✏️ TRADE FORM MODAL (add / edit)
// ══════════════════════════════════════════════════════════════════════════════
const TradeFormModal = ({ isOpen, onClose, onSave, trade=null }) => {
  const isEdit = !!trade;
  const [form, setForm] = useState(trade||{
    date:new Date().toISOString().split('T')[0],
    time:new Date().toTimeString().slice(0,5),
    symbol:'', type:'Long', entry:'', exit:'',
    pnl:'', session:'NY', bias:'Bullish', newsImpact:'Low',
    sl:'', tp:'', setup:'', psychologyScore:80, notes:'',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(()=>{ if(trade){setForm(trade);setErrors({});} },[trade]);

  const calcRR = d => {
    const [en,ex,sl]=[parseFloat(d.entry),parseFloat(d.exit),parseFloat(d.sl)];
    if(!en||!ex||!sl||isNaN(en)||isNaN(ex)||isNaN(sl)) return '0.00';
    const risk=Math.abs(en-sl), reward=Math.abs(ex-en);
    return risk>0?(reward/risk).toFixed(2):'0.00';
  };
  const calcTPP = d => {
    const [en,ex,tp]=[parseFloat(d.entry),parseFloat(d.exit),parseFloat(d.tp)];
    if(!en||!ex||!tp||isNaN(en)||isNaN(ex)||isNaN(tp)) return '0.0';
    const target=Math.abs(tp-en);
    return target>0?((Math.abs(ex-en)/target)*100).toFixed(1):'0.0';
  };

  const validate = () => {
    const errs={};
    if(!form.symbol?.trim()) errs.symbol='Obligatoire';
    if(!form.entry||isNaN(parseFloat(form.entry))) errs.entry='Prix invalide';
    if(!form.exit||isNaN(parseFloat(form.exit)))   errs.exit='Prix invalide';
    if(!form.pnl||isNaN(parseFloat(form.pnl)))    errs.pnl='Montant invalide';
    setErrors(errs);
    return Object.keys(errs).length===0;
  };

  const handleSubmit = () => {
    if(!validate()){toast.error('Corrigez les erreurs');return;}
    setSaving(true);
    setTimeout(()=>{
      onSave({
        ...form,
        id:form.id||`manual_${Date.now()}_${Math.random().toString(36).slice(2,9)}`,
        win:parseFloat(form.pnl)>0,
        metrics:{ rrReel:calcRR(form), tpPercent:calcTPP(form) },
        lastModified:new Date().toISOString(),
      });
      toast.success(isEdit?'✅ Trade modifié !':'✅ Trade ajouté !');
      setSaving(false); setErrors({}); onClose();
    },450);
  };

  if(!isOpen) return null;

  const iStyle = {
    width:'100%', padding:'8px 11px', borderRadius:7,
    border:`1px solid ${C.brd}`, backgroundColor:C.bgDeep,
    color:C.t1, fontSize:12, outline:'none', fontFamily:'inherit',
  };
  const lStyle = { display:'block', fontSize:10, fontWeight:600, color:C.t3, marginBottom:5 };
  const eStyle = { fontSize:10, color:C.danger, marginTop:3 };

  return (
    <AnimatePresence>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}
        style={{position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.75)',backdropFilter:'blur(4px)',
          zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:20,overflowY:'auto'}}>
        <motion.div initial={{scale:0.9}} animate={{scale:1}} exit={{scale:0.9}} onClick={e=>e.stopPropagation()}
          style={{backgroundColor:C.bgCard,borderRadius:16,border:`1px solid ${C.brd}`,
            maxWidth:680,width:'100%',maxHeight:'90vh',overflow:'hidden',display:'flex',flexDirection:'column'}}>
          <div style={{padding:'18px 22px',borderBottom:`1px solid ${C.brd}`,background:C.grad}}>
            <h3 style={{margin:0,fontSize:17,fontWeight:700,color:'#fff'}}>
              {isEdit?'✏️ Modifier le Trade':'✏️ Ajouter un Trade'}
            </h3>
          </div>
          <div style={{flex:1,overflowY:'auto',padding:'22px'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:15}}>
              {[
                {k:'date',   l:'Date *',    t:'date'},
                {k:'time',   l:'Heure',     t:'time'},
                {k:'symbol', l:'Symbole *', t:'text',   ph:'EURUSD'},
                {k:'type',   l:'Type',      t:'select', opts:['Long','Short']},
                {k:'session',l:'Session',   t:'select', opts:['NY','London','Asia']},
                {k:'bias',   l:'Bias',      t:'select', opts:['Bullish','Bearish','Neutral']},
                {k:'entry',  l:'Entry *',   t:'number', ph:'1.08500', step:'0.00001'},
                {k:'exit',   l:'Exit *',    t:'number', ph:'1.09000', step:'0.00001'},
                {k:'sl',     l:'Stop Loss', t:'number', step:'0.00001'},
                {k:'tp',     l:'Take Profit',t:'number',step:'0.00001'},
                {k:'pnl',    l:'P&L ($) *', t:'number', ph:'150.00', step:'0.01'},
                {k:'setup',  l:'Setup',     t:'text',   ph:'Breakout, Pullback...'},
                {k:'newsImpact',l:'News Impact',t:'select',opts:['High','Medium','Low']},
              ].map(({k,l,t,ph,step,opts})=>(
                <div key={k}>
                  <label style={{...lStyle,color:errors[k]?C.danger:C.t3}}>{l}</label>
                  {t==='select'
                    ? <select value={form[k]||''} onChange={e=>setForm({...form,[k]:e.target.value})}
                        style={{...iStyle,border:`1px solid ${errors[k]?C.danger:C.brd}`,cursor:'pointer'}}>
                        {opts.map(o=><option key={o} value={o}>{o}</option>)}
                      </select>
                    : <input type={t} placeholder={ph} step={step} value={form[k]||''}
                        onChange={e=>setForm({...form,[k]:k==='symbol'?e.target.value.toUpperCase():e.target.value})}
                        style={{...iStyle,border:`1px solid ${errors[k]?C.danger:C.brd}`}}/>
                  }
                  {errors[k]&&<div style={eStyle}>{errors[k]}</div>}
                </div>
              ))}
              <div>
                <label style={lStyle}>Score Psycho: <span style={{color:form.psychologyScore>=80?C.green:form.psychologyScore>=60?C.warn:C.danger,fontWeight:800}}>{form.psychologyScore}</span></label>
                <input type="range" min="0" max="100" value={form.psychologyScore}
                  onChange={e=>setForm({...form,psychologyScore:+e.target.value})}
                  style={{...iStyle,padding:8,accentColor:C.cyan}}/>
              </div>
            </div>
            <div style={{marginTop:14}}>
              <label style={lStyle}>Notes</label>
              <textarea placeholder="Contexte, émotions, observations..." value={form.notes||''}
                onChange={e=>setForm({...form,notes:e.target.value})} rows={3}
                style={{...iStyle,resize:'vertical',minHeight:70}}/>
            </div>
            {form.entry&&form.exit&&form.sl&&(
              <div style={{marginTop:16,padding:14,borderRadius:9,backgroundColor:'rgba(0,212,255,0.05)',border:`1px solid rgba(0,212,255,0.18)`}}>
                <div style={{fontSize:10,fontWeight:700,color:C.cyan,marginBottom:8}}>📊 Calculs automatiques</div>
                <div style={{display:'flex',gap:28}}>
                  <div>
                    <div style={{fontSize:9,color:C.t3}}>Risk/Reward</div>
                    <div style={{fontSize:16,fontWeight:800,color:C.teal}}>1:{calcRR(form)}</div>
                  </div>
                  <div>
                    <div style={{fontSize:9,color:C.t3}}>TP atteint</div>
                    <div style={{fontSize:16,fontWeight:800,color:C.cyan}}>{calcTPP(form)}%</div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div style={{padding:'14px 22px',borderTop:`1px solid ${C.brd}`,display:'flex',gap:9,justifyContent:'flex-end'}}>
            <GlassBtn onClick={onClose}>Annuler</GlassBtn>
            <GlassBtn variant="primary" onClick={handleSubmit} loading={saving} icon="✓">
              {isEdit?'Sauvegarder':'Ajouter'}
            </GlassBtn>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// 🏠 COMPOSANT PRINCIPAL - AllTrades
// ══════════════════════════════════════════════════════════════════════════════
export default function AllTrades() {
  const { trades, deleteTrade, updateTrade, addTrade } = useTradingContext();

  const [filters, setFilters] = useState({ search:'', result:'all', symbol:'all', session:'all', bias:'all', dateFrom:'', dateTo:'' });
  const [sort,    setSort]    = useState({ key:'date', dir:'desc' });
  const [selected, setSelected] = useState(new Set());
  const [cols, setCols] = useState(()=>{
    try { const s=localStorage.getItem('mf_cols_v2'); return s?JSON.parse(s):DEFAULT_COLUMNS; } catch { return DEFAULT_COLUMNS; }
  });

  const [page,    setPage]    = useState(1);
  const [perPage, setPerPage] = useState(25);

  // Modals
  const [modalAdd,    setModalAdd]    = useState(false);
  const [modalImport, setModalImport] = useState(false);
  const [modalForm,   setModalForm]   = useState(false);
  const [editTrade,   setEditTrade]   = useState(null);

  // Detail panel
  const [detailTrade, setDetailTrade] = useState(null);

  useEffect(()=>{ try{localStorage.setItem('mf_cols_v2',JSON.stringify(cols));}catch{} },[cols]);
  useEffect(()=>{ setPage(1); },[filters,sort]);

  const visibleCols = useMemo(()=>cols.filter(c=>c.visible),[cols]);

  const filtered = useMemo(()=>filterTrades(trades,filters),[trades,filters]);
  const sorted   = useMemo(()=>sortTrades(filtered,sort.key,sort.dir),[filtered,sort]);
  const totalPages = Math.max(1,Math.ceil(sorted.length/perPage));
  const paginated  = useMemo(()=>sorted.slice((page-1)*perPage, page*perPage),[sorted,page,perPage]);

  // Cumulative PnL map
  const cumulMap = useMemo(()=>{
    let running=0;
    const m={};
    [...sorted].reverse().forEach(t=>{ running+=parseFloat(t.pnl||0); m[t.id]=running; });
    return m;
  },[sorted]);

  const stats = useMemo(()=>calcStats(filtered),[filtered]);

  const handleSort = useCallback(k=>{
    setSort(p=>({key:k, dir:p.key===k&&p.dir==='asc'?'desc':'asc'}));
  },[]);

  const handleSelectAll = useCallback(()=>{
    setSelected(prev=>{
      const ids=new Set(paginated.map(t=>t.id));
      const allSel=paginated.every(t=>prev.has(t.id));
      if(allSel){ const n=new Set(prev); ids.forEach(id=>n.delete(id)); return n; }
      return new Set([...prev,...ids]);
    });
  },[paginated]);

  const handleDeleteSelected = useCallback(()=>{
    if(!selected.size) return;
    if(!window.confirm(`Supprimer ${selected.size} trade(s) ?`)) return;
    const id=toast.loading('Suppression...');
    setTimeout(()=>{
      selected.forEach(tid=>deleteTrade(tid));
      toast.dismiss(id); toast.success(`${selected.size} trade(s) supprimé(s) !`);
      setSelected(new Set());
    },350);
  },[selected,deleteTrade]);

  const handleMethodSelect = useCallback(m=>{
    if(m==='auto') setModalImport(true);
    else { setEditTrade(null); setModalForm(true); }
  },[]);

  const handleImport = useCallback(t=>{t.forEach(tr=>addTrade(tr));},[addTrade]);

  const handleSave = useCallback(t=>{
    if(t.id&&trades.find(x=>x.id===t.id)) updateTrade(t.id,t);
    else addTrade(t);
    setEditTrade(null);
  },[trades,updateTrade,addTrade]);

  const handleEdit = useCallback(t=>{ setEditTrade(t); setModalForm(true); },[]);

  const handleReset = useCallback(()=>{
    setFilters({search:'',result:'all',symbol:'all',session:'all',bias:'all',dateFrom:'',dateTo:''});
    toast.success('Filtres réinitialisés');
  },[]);

  // ─── RENDER ───
  return (
    <div style={{ backgroundColor:C.bgPage, minHeight:'100vh', fontFamily:'system-ui,-apple-system,sans-serif', color:C.t1, padding:'24px' }}>

      {/* ── Header ── */}
      <motion.div variants={fadeInUp} initial="hidden" animate="visible"
        style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:22,flexWrap:'wrap',gap:10}}>
        <div>
          <h1 style={{margin:0,fontSize:26,fontWeight:900,background:C.grad,
            WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',letterSpacing:'-0.5px'}}>
            All Trades
          </h1>
          <p style={{margin:'5px 0 0',color:C.t2,fontSize:12,fontWeight:500}}>
            Journal de trading · {trades.length} trades au total
          </p>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <GlassBtn icon="↓" onClick={()=>exportToCSV(filtered,`trades_${Date.now()}.csv`)}>Export CSV</GlassBtn>
          <GlassBtn variant="primary" icon="+" onClick={()=>setModalAdd(true)}>Ajouter</GlassBtn>
        </div>
      </motion.div>

      {/* ── 6 Stats Cards ── */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:11,marginBottom:18}}>
        <StatCard index={0} label="Total Trades" value={stats.total}
          color={C.cyan}  icon="📊" sub={`${stats.wins}W / ${stats.losses}L`}/>
        <StatCard index={1} label="Win Rate"     value={`${stats.winRate.toFixed(1)}%`}
          color={stats.winRate>=55?C.green:stats.winRate>=45?C.warn:C.danger} icon="🎯"
          sub={`${stats.wins} victoires`}/>
        <StatCard index={2} label="RR Moyen"     value={`1:${stats.avgRR}`}
          color={C.teal}  icon="⚖️" sub="Risk/Reward"/>
        <StatCard index={3} label="P&L Total"    value={fmtPnl(stats.totalPnL)}
          color={stats.totalPnL>=0?C.green:C.danger} icon="💰"
          sub={`${fmtPnl(stats.totalPnL/Math.max(1,stats.total))} / trade`}/>
        <StatCard index={4} label="Profit Factor" value={stats.pf}
          color={parseFloat(stats.pf)>=2?C.green:parseFloat(stats.pf)>=1.5?C.warn:C.danger} icon="📈"
          sub="Gross W / Gross L"/>
        <StatCard index={5} label="Max Drawdown" value={`-${stats.maxDD.toFixed(1)}%`}
          color={C.danger} icon="⚠️" sub="Drawdown maximum"/>
      </div>

      {/* ── Filter Bar ── */}
      <FilterBar filters={filters} setFilters={setFilters} trades={trades} onReset={handleReset}/>

      {/* ── Bulk Actions ── */}
      <AnimatePresence>
        {selected.size>0&&(
          <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
            style={{
              backgroundColor:'rgba(0,212,255,0.05)',border:`1px solid rgba(0,212,255,0.18)`,
              borderRadius:9,padding:'9px 14px',marginBottom:10,
              display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10,
            }}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:18}}>✅</span>
              <span style={{color:C.cyan,fontSize:13,fontWeight:700}}>{selected.size} trade(s) sélectionné(s)</span>
            </div>
            <div style={{display:'flex',gap:8}}>
              <GlassBtn size="sm" variant="cyan" icon="↓"
                onClick={()=>exportToCSV(trades.filter(t=>selected.has(t.id)),`selection_${Date.now()}.csv`)}>
                Exporter sélection
              </GlassBtn>
              <GlassBtn size="sm" variant="danger" icon="🗑️" onClick={handleDeleteSelected}>Supprimer</GlassBtn>
              <GlassBtn size="sm" onClick={()=>setSelected(new Set())}>Désélectionner tout</GlassBtn>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Table ── */}
      <motion.div variants={fadeInUp} initial="hidden" animate="visible" custom={1}
        style={{backgroundColor:C.bgCard,border:`1px solid ${C.brd}`,borderRadius:11,overflow:'hidden'}}>

        {filtered.length===0 ? (
          <div style={{padding:'80px 20px',textAlign:'center'}}>
            <div style={{fontSize:52,marginBottom:16}}>📊</div>
            <h3 style={{color:C.t1,fontSize:18,fontWeight:700,marginBottom:8}}>
              {trades.length===0?'Aucun trade':'Aucun résultat'}
            </h3>
            <p style={{color:C.t2,fontSize:13,marginBottom:22}}>
              {trades.length===0?'Importez ou ajoutez votre premier trade':'Modifiez vos filtres'}
            </p>
            {trades.length===0&&<GlassBtn variant="primary" icon="+" onClick={()=>setModalAdd(true)}>Ajouter un trade</GlassBtn>}
          </div>
        ) : (
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{backgroundColor:C.bgDeep}}>
                  {visibleCols.map(col=>(
                    <th key={col.key}
                      onClick={col.sortable?()=>handleSort(col.key):undefined}
                      style={{
                        padding:'11px 14px', textAlign:'left', fontSize:9,
                        fontWeight:700, letterSpacing:'1.2px', textTransform:'uppercase',
                        color:sort.key===col.key?C.cyan:C.t3,
                        cursor:col.sortable?'pointer':'default',
                        borderBottom:`1px solid ${C.brd}`,
                        whiteSpace:'nowrap', userSelect:'none',
                        transition:'color 0.2s',
                      }}>
                      {col.key==='select'
                        ? <input type="checkbox"
                            checked={paginated.every(t=>selected.has(t.id))&&paginated.length>0}
                            onChange={handleSelectAll}
                            style={{cursor:'pointer',accentColor:C.cyan,width:14,height:14}}/>
                        : <span style={{display:'flex',alignItems:'center',gap:5}}>
                            {col.label}
                            {col.sortable&&<span style={{opacity:0.45,fontSize:9}}>
                              {sort.key===col.key?sort.dir==='asc'?'↑':'↓':'⇅'}
                            </span>}
                          </span>
                      }
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {paginated.map(trade=>(
                    <TradeRow
                      key={trade.id}
                      trade={trade}
                      isSelected={selected.has(trade.id)}
                      onSelect={id=>{
                        setSelected(prev=>{
                          const n=new Set(prev);
                          n.has(id)?n.delete(id):n.add(id);
                          return n;
                        });
                      }}
                      onClickDetail={()=>setDetailTrade(trade)}
                      onDoubleClickEdit={handleEdit}
                      cols={visibleCols}
                      cumulativePnl={cumulMap[trade.id]}
                    />
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* ── Pagination ── */}
      {filtered.length>0&&(
        <Pagination
          page={page} total={filtered.length} perPage={perPage}
          onPage={p=>setPage(Math.max(1,Math.min(p,totalPages)))}
          onPerPage={n=>{setPerPage(n);setPage(1);}}
        />
      )}

      {/* ── Modals ── */}
      <AddMethodModal isOpen={modalAdd}   onClose={()=>setModalAdd(false)}   onSelectMethod={handleMethodSelect}/>
      <ImportModal    isOpen={modalImport} onClose={()=>setModalImport(false)} onImport={handleImport}/>
      <TradeFormModal isOpen={modalForm}   onClose={()=>{setModalForm(false);setEditTrade(null);}} onSave={handleSave} trade={editTrade}/>

      {/* ── Trade Detail Panel ── */}
      <TradeDetailPanel
        trade={detailTrade}
        onClose={()=>setDetailTrade(null)}
        onEdit={t=>{ handleEdit(t); setDetailTrade(null); }}
        onDelete={id=>{ deleteTrade(id); setDetailTrade(null); toast.success('Trade supprimé'); }}
      />
    </div>
  );
}