/*
╔══════════════════════════════════════════════════════════════════════════════╗
║   📊 ALL TRADES MARKETFLOW - VERSION ULTIMATE                               ║
║   ✅ TradeDetailPanel intégré (slide depuis la droite)                      ║
║   ✅ Mini chart entry→exit, métriques, psycho, notes                        ║
║   ✅ Table redesign avec row color coding subtil                             ║
║   ✅ 6 stats cards (+ Profit Factor + Max DD)                               ║
║   ✅ Filtres avancés : Session, Bias, Date range                            ║
║   ✅ Bulk actions premium                                                    ║
║   ✅ ImportModal UNIVERSEL v4 — détection intelligente 3 passes             ║
║      · Par nom (200+ alias)                                                 ║
║      · Par contenu des cellules (buy/sell→type, NY/London→session…)        ║
║      · Anti-doublons automatique                                            ║
║      · Badges confiance ✓ Auto / ~ Deviné / ? Manuel                       ║
║      · Onglets filtre + résumé mapping live                                 ║
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
// 📊 STAT CARD
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
      <motion.div animate={{opacity:hov?1:0}} style={{position:'absolute',inset:0,background:`linear-gradient(135deg,${color}18,transparent)`,pointerEvents:'none'}}/>
      <div style={{position:'relative',zIndex:1}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
          <span style={{color:C.t3,fontSize:9,fontWeight:700,letterSpacing:'1.2px',textTransform:'uppercase'}}>{label}</span>
          {icon&&<span style={{fontSize:17}}>{icon}</span>}
        </div>
        <div style={{fontSize:22,fontWeight:900,color,fontFamily:'monospace',lineHeight:1,textShadow:hov?`0 0 20px ${color}60`:'none',transition:'text-shadow 0.3s'}}>{value}</div>
        {sub&&<div style={{fontSize:10,color:C.t3,marginTop:5}}>{sub}</div>}
      </div>
      {hov&&(
        <motion.div initial={{opacity:0,scale:0.8}} animate={{opacity:1,scale:1}}
          style={{position:'absolute',bottom:-8,left:'50%',transform:'translateX(-50%)',width:'80%',height:5,background:color,borderRadius:'0 0 8px 8px',filter:'blur(8px)',pointerEvents:'none'}}
        />
      )}
    </motion.div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// 🔍 FILTER BAR
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
        <GlassBtn size="sm" variant="ghost" icon={expanded?'▲':'▼'} onClick={()=>setExpanded(p=>!p)}>
          Avancé {activeCount>0&&<span style={{background:C.cyan,color:C.bgDeep,borderRadius:'50%',width:16,height:16,fontSize:9,fontWeight:900,display:'inline-flex',alignItems:'center',justifyContent:'center'}}>{activeCount}</span>}
        </GlassBtn>
        {activeCount>0&&(<GlassBtn size="sm" variant="danger" icon="✕" onClick={onReset}>Reset</GlassBtn>)}
      </div>
      <AnimatePresence>
        {expanded&&(
          <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} transition={{duration:0.3}} style={{overflow:'hidden'}}>
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
  const pnl   = parseFloat(trade.pnl||0);
  const isWin = pnl >= 0;
  const rowBg = isSelected ? 'rgba(0,212,255,0.06)' : hov ? C.bgHov : isWin ? 'rgba(0,230,118,0.025)' : 'rgba(255,71,87,0.025)';
  const cell = (key) => {
    switch(key) {
      case 'date': return (<div><div style={{color:C.t1,fontSize:12,fontWeight:600}}>{trade.date?.substring(0,10)||'N/A'}</div><div style={{color:C.t3,fontSize:10}}>{trade.time||''}</div></div>);
      case 'symbol': return (<div style={{display:'flex',alignItems:'center',gap:8}}><div style={{width:30,height:30,borderRadius:7,background:C.grad,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:900,color:C.bgDeep,flexShrink:0}}>{trade.symbol?.substring(0,2)||'??'}</div><div><div style={{color:C.t1,fontSize:12,fontWeight:700}}>{trade.symbol||'N/A'}</div><div style={{color:C.t3,fontSize:10}}>{trade.marketType||''}</div></div></div>);
      case 'type': return <Tag label={trade.type==='Long'?'↗ Long':'↘ Short'} color={trade.type==='Long'?C.green:C.danger} bg={trade.type==='Long'?'rgba(0,230,118,0.1)':'rgba(255,71,87,0.1)'}/>;
      case 'session': return <Tag label={trade.session||'—'} color={C.cyan} bg="rgba(0,212,255,0.08)"/>;
      case 'bias': return <Tag label={trade.bias||'—'} color={trade.bias==='Bullish'?C.green:trade.bias==='Bearish'?C.danger:C.t2} bg={trade.bias==='Bullish'?'rgba(0,230,118,0.08)':trade.bias==='Bearish'?'rgba(255,71,87,0.08)':'rgba(255,255,255,0.04)'}/>;
      case 'news': return <Tag label={trade.newsImpact||'—'} color={trade.newsImpact==='High'?C.danger:trade.newsImpact==='Medium'?C.warn:C.teal} bg={trade.newsImpact==='High'?'rgba(255,71,87,0.1)':trade.newsImpact==='Medium'?'rgba(255,179,0,0.1)':'rgba(0,201,167,0.1)'}/>;
      case 'entry': return <span style={{color:C.t1,fontSize:12,fontFamily:'monospace'}}>{parseFloat(trade.entry||0).toFixed(5)}</span>;
      case 'exit': return <span style={{color:C.t1,fontSize:12,fontFamily:'monospace'}}>{parseFloat(trade.exit||0).toFixed(5)}</span>;
      case 'tpPercent': { const v=parseFloat(trade.metrics?.tpPercent||0); return <Tag label={`${v>=0?'+':''}${v.toFixed(1)}%`} color={v>=0?C.green:C.danger} bg={v>=0?'rgba(0,230,118,0.1)':'rgba(255,71,87,0.1)'}/>; }
      case 'rr': return <Tag label={`1:${trade.metrics?.rrReel||0}`} color={C.teal} bg="rgba(0,201,167,0.1)"/>;
      case 'setup': return trade.setup ? <Tag label={trade.setup} color={C.purple} bg="rgba(167,139,250,0.1)"/> : <span style={{color:C.t3}}>—</span>;
      case 'psychology': { const s=trade.psychologyScore; if(s==null) return <span style={{color:C.t3}}>—</span>; return <Tag label={s} color={s>=80?C.green:s>=60?C.warn:C.danger} bg={s>=80?'rgba(0,230,118,0.08)':s>=60?'rgba(255,179,0,0.08)':'rgba(255,71,87,0.08)'}/>; }
      case 'pnl': return (<div><div style={{color:isWin?C.green:C.danger,fontSize:13,fontWeight:800,fontFamily:'monospace'}}>{fmtPnl(pnl)}</div>{cumulativePnl!=null&&(<div style={{color:cumulativePnl>=0?C.greenDim:C.dangerDim,fontSize:9,fontWeight:600,marginTop:1}}>Cumul: {fmtPnl(cumulativePnl)}</div>)}</div>);
      default: return <span style={{color:C.t3,fontSize:11}}>—</span>;
    }
  };
  return (
    <motion.tr
      initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}} transition={{duration:0.15}}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      onClick={onClickDetail} onDoubleClick={()=>onDoubleClickEdit(trade)}
      style={{backgroundColor:rowBg,borderLeft:`2px solid ${isSelected?C.cyan:isWin?'rgba(0,230,118,0.15)':'rgba(255,71,87,0.15)'}`,cursor:'pointer',transition:'all 0.12s ease'}}
    >
      {cols.map(col=>(
        <td key={col.key} onClick={col.key==='select'?(e)=>{e.stopPropagation();onSelect(trade.id);}:undefined}
          style={{padding:'10px 14px',whiteSpace:'nowrap',borderBottom:`1px solid ${C.brd}`,verticalAlign:'middle'}}>
          {col.key==='select'
            ? <input type="checkbox" checked={isSelected} onChange={()=>onSelect(trade.id)} onClick={e=>e.stopPropagation()} style={{cursor:'pointer',accentColor:C.cyan,width:14,height:14}}/>
            : cell(col.key)}
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
      <div style={{fontSize:12,color:C.t3}}>{((page-1)*perPage)+1}–{Math.min(page*perPage,total)} sur <span style={{color:C.cyan,fontWeight:700}}>{total}</span> trades</div>
      <div style={{display:'flex',gap:6,alignItems:'center'}}>
        <motion.button whileHover={{scale:1.1}} onClick={()=>onPage(page-1)} disabled={page===1} style={{width:32,height:32,borderRadius:6,border:`1px solid ${C.brd}`,backgroundColor:C.bgDeep,color:page===1?C.t3:C.t1,cursor:page===1?'not-allowed':'pointer',opacity:page===1?0.4:1}}>◀</motion.button>
        <span style={{fontSize:12,color:C.t1,padding:'0 12px'}}>Page {page} / {totalPages}</span>
        <motion.button whileHover={{scale:1.1}} onClick={()=>onPage(page+1)} disabled={page===totalPages} style={{width:32,height:32,borderRadius:6,border:`1px solid ${C.brd}`,backgroundColor:C.bgDeep,color:page===totalPages?C.t3:C.t1,cursor:page===totalPages?'not-allowed':'pointer',opacity:page===totalPages?0.4:1}}>▶</motion.button>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <span style={{fontSize:12,color:C.t3}}>Par page:</span>
        <select value={perPage} onChange={e=>onPerPage(Number(e.target.value))} style={{padding:'6px 10px',borderRadius:6,border:`1px solid ${C.brd}`,backgroundColor:C.bgDeep,color:C.t1,fontSize:12,cursor:'pointer',outline:'none',fontFamily:'inherit'}}>
          {[10,25,50,100].map(n=><option key={n} value={n}>{n}</option>)}
        </select>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// 🎯 TRADE DETAIL PANEL
// ══════════════════════════════════════════════════════════════════════════════
const PBar = ({ label, value, max=100, color }) => (
  <div style={{marginBottom:10}}>
    <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
      <span style={{fontSize:10,color:C.t3,fontWeight:600}}>{label}</span>
      <span style={{fontSize:10,fontWeight:800,color}}>{value}</span>
    </div>
    <div style={{height:4,borderRadius:2,backgroundColor:C.bgDeep,overflow:'hidden'}}>
      <motion.div initial={{width:0}} animate={{width:`${Math.min(100,(value/max)*100)}%`}} transition={{duration:0.8,ease:[0.22,1,0.36,1]}} style={{height:'100%',borderRadius:2,background:color,boxShadow:`0 0 8px ${color}50`}}/>
    </div>
  </div>
);

const SecTitle = ({ icon, title, color=C.cyan }) => (
  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12,marginTop:4}}>
    <span style={{fontSize:13}}>{icon}</span>
    <span style={{fontSize:10,fontWeight:800,color:C.t3,letterSpacing:'1.5px',textTransform:'uppercase'}}>{title}</span>
    <div style={{flex:1,height:1,background:`linear-gradient(90deg,${color}40,transparent)`}}/>
  </div>
);

const MRow = ({ label, value, color, sub, icon }) => (
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 0',borderBottom:`1px solid ${C.brd}`}}>
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

const MiniChart = ({ trade }) => {
  const pnl   = parseFloat(trade?.pnl||0);
  const isWin = pnl >= 0;
  const color = isWin ? C.green : C.danger;
  const entry = parseFloat(trade?.entry||0);
  const exit  = parseFloat(trade?.exit||0);
  const data  = useMemo(()=>{
    if(!entry||!exit) return [];
    const pts=14, diff=exit-entry;
    return Array.from({length:pts},(_,i)=>{ const t=i/(pts-1); const noise=i>0&&i<pts-1?Math.sin(i*1.6)*Math.abs(diff)*0.12:0; return {i,price:entry+diff*t+noise}; });
  },[entry,exit]);
  if(!entry||!exit) return null;
  return (
    <div style={{padding:'14px',borderRadius:10,backgroundColor:C.bgDeep,border:`1px solid ${C.brd}`,marginBottom:16}}>
      <div style={{fontSize:10,color:C.t3,fontWeight:700,letterSpacing:'0.8px',marginBottom:10}}>TRADE PATH</div>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
        <div><div style={{fontSize:8,color:C.t3,fontWeight:700}}>ENTRY</div><div style={{fontSize:12,fontWeight:800,color:C.cyan,fontFamily:'monospace'}}>{entry.toFixed(5)}</div></div>
        {trade?.sl&&parseFloat(trade.sl)>0&&(<div style={{textAlign:'center'}}><div style={{fontSize:8,color:C.t3,fontWeight:700}}>SL</div><div style={{fontSize:11,fontWeight:700,color:C.danger,fontFamily:'monospace'}}>{parseFloat(trade.sl).toFixed(5)}</div></div>)}
        {trade?.tp&&parseFloat(trade.tp)>0&&(<div style={{textAlign:'center'}}><div style={{fontSize:8,color:C.t3,fontWeight:700}}>TP</div><div style={{fontSize:11,fontWeight:700,color:C.green,fontFamily:'monospace'}}>{parseFloat(trade.tp).toFixed(5)}</div></div>)}
        <div style={{textAlign:'right'}}><div style={{fontSize:8,color:C.t3,fontWeight:700}}>EXIT</div><div style={{fontSize:12,fontWeight:800,color,fontFamily:'monospace'}}>{exit.toFixed(5)}</div></div>
      </div>
      <div style={{height:70}}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{top:4,right:0,bottom:0,left:0}}>
            <defs>
              <linearGradient id={`cg_${trade?.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.28}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="price" stroke={color} strokeWidth={2} fill={`url(#cg_${trade?.id})`} dot={false} activeDot={{r:4,fill:color,stroke:C.bgDeep,strokeWidth:2}}/>
            <Tooltip contentStyle={{backgroundColor:C.bgCard,border:`1px solid ${C.brd}`,borderRadius:6,fontSize:10,color:C.t1}} formatter={v=>[v?.toFixed(5),'Prix']} labelFormatter={()=>''}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <motion.div initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} transition={{delay:0.35}} style={{marginTop:10,padding:'8px 12px',borderRadius:7,background:`linear-gradient(135deg,${color}12,${color}04)`,border:`1px solid ${color}28`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{fontSize:10,color:C.t3,fontWeight:600}}>Résultat net</span>
        <span style={{fontSize:18,fontWeight:900,color,fontFamily:'monospace',textShadow:`0 0 20px ${color}60`}}>{fmtPnl(pnl)}</span>
      </motion.div>
    </div>
  );
};

const PsychoCard = ({ score }) => {
  const s     = parseInt(score)||0;
  const color = s>=80?C.green:s>=60?C.warn:C.danger;
  const label = s>=80?'Excellent':s>=60?'Correct':'Difficile';
  const emoji = s>=80?'🧠':s>=60?'😐':'😰';
  return (
    <div style={{padding:'12px 14px',borderRadius:10,background:`linear-gradient(135deg,${color}10,transparent)`,border:`1px solid ${color}28`,marginBottom:12}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:18}}>{emoji}</span>
          <div>
            <div style={{fontSize:10,color:C.t3,fontWeight:600}}>Score Psychologique</div>
            <div style={{fontSize:11,color,fontWeight:700}}>{label}</div>
          </div>
        </div>
        <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:'spring',delay:0.3}} style={{fontSize:26,fontWeight:900,color,fontFamily:'monospace'}}>{s}</motion.div>
      </div>
      <div style={{height:5,borderRadius:3,backgroundColor:C.bgDeep,overflow:'hidden'}}>
        <motion.div initial={{width:0}} animate={{width:`${s}%`}} transition={{duration:0.9,ease:[0.22,1,0.36,1],delay:0.2}} style={{height:'100%',borderRadius:3,background:`linear-gradient(90deg,${color},${color}88)`,boxShadow:`0 0 10px ${color}60`}}/>
      </div>
    </div>
  );
};

const TradeDetailPanel = ({ trade, onClose, onEdit, onDelete }) => {
  const panelRef = useRef(null);
  useEffect(()=>{ const fn=e=>{if(e.key==='Escape')onClose?.();}; window.addEventListener('keydown',fn); return()=>window.removeEventListener('keydown',fn); },[onClose]);
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
      <motion.div key="bd" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.22}} onClick={onClose} style={{position:'fixed',inset:0,backgroundColor:'rgba(7,10,20,0.6)',backdropFilter:'blur(3px)',zIndex:200}}/>
      <motion.div key="pnl" initial={{x:'100%',opacity:0.6}} animate={{x:0,opacity:1}} exit={{x:'100%',opacity:0}} transition={{type:'spring',stiffness:300,damping:34,mass:0.85}}
        style={{position:'fixed',top:0,right:0,bottom:0,width:420,backgroundColor:C.bgCard,borderLeft:`1px solid ${C.brdSoft}`,zIndex:201,display:'flex',flexDirection:'column',boxShadow:`-20px 0 70px rgba(0,0,0,0.55)`,fontFamily:'system-ui,-apple-system,sans-serif'}}>
        <div style={{position:'absolute',top:-100,right:-100,width:320,height:320,borderRadius:'50%',background:`radial-gradient(circle,${pColor}18,transparent 70%)`,pointerEvents:'none',zIndex:0}}/>
        <div style={{position:'relative',zIndex:1,padding:'18px 18px 14px',borderBottom:`1px solid ${C.brd}`,background:`linear-gradient(180deg,${C.bgHigh},${C.bgCard})`,flexShrink:0}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <motion.div initial={{scale:0.5,opacity:0}} animate={{scale:1,opacity:1}} transition={{type:'spring',delay:0.08}} style={{width:46,height:46,borderRadius:12,background:C.grad,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:900,color:C.bgDeep,boxShadow:`0 4px 18px ${C.cyanGlow}`,flexShrink:0}}>
                {trade.symbol?.substring(0,2)||'??'}
              </motion.div>
              <div>
                <motion.div initial={{x:-8,opacity:0}} animate={{x:0,opacity:1}} transition={{delay:0.1}} style={{fontSize:19,fontWeight:900,color:C.t1,letterSpacing:'-0.5px',lineHeight:1.1}}>{trade.symbol||'—'}</motion.div>
                <motion.div initial={{x:-8,opacity:0}} animate={{x:0,opacity:1}} transition={{delay:0.14}} style={{fontSize:11,color:C.t3,marginTop:2}}>{trade.date?.substring(0,10)||'—'} · {trade.time||'—'}</motion.div>
              </div>
            </div>
            <motion.button onClick={onClose} whileHover={{scale:1.15,rotate:90}} whileTap={{scale:0.88}} style={{width:30,height:30,borderRadius:7,border:`1px solid ${C.brd}`,backgroundColor:C.bgDeep,color:C.t3,cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.18s'}}>✕</motion.button>
          </div>
          <motion.div initial={{y:5,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:0.17}} style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:12}}>
            <Tag label={trade.type==='Long'?'↗ Long':'↘ Short'} color={typeC} bg={`${typeC}14`}/>
            <Tag label={`${sessE} ${trade.session||'—'}`} color={C.cyan} bg="rgba(0,212,255,0.08)"/>
            {trade.bias&&<Tag label={trade.bias} color={biasC} bg={`${biasC}12`}/>}
            {trade.newsImpact&&<Tag label={`📰 ${trade.newsImpact}`} color={newsC} bg={`${newsC}12`}/>}
            {trade.setup&&<Tag label={trade.setup} color={C.purple} bg="rgba(167,139,250,0.1)"/>}
          </motion.div>
          <motion.div initial={{scale:0.88,opacity:0}} animate={{scale:1,opacity:1}} transition={{type:'spring',delay:0.16,stiffness:180}} style={{padding:'12px 14px',borderRadius:10,background:`linear-gradient(135deg,${pColor}14,${pColor}04)`,border:`1px solid ${pColor}28`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{fontSize:9,color:C.t3,fontWeight:700,letterSpacing:'1px',marginBottom:4}}>RÉSULTAT NET</div>
              <div style={{fontSize:30,fontWeight:900,color:pColor,fontFamily:'monospace',letterSpacing:'-0.5px',textShadow:`0 0 28px ${pGlow}`}}>{fmtPnl(pnl)}</div>
            </div>
            <div style={{textAlign:'right'}}>
              <motion.div animate={{scale:[1,1.1,1]}} transition={{duration:2.5,repeat:Infinity}} style={{fontSize:32,filter:`drop-shadow(0 4px 10px ${pGlow})`}}>{isWin?'✅':'❌'}</motion.div>
              <div style={{fontSize:10,color:C.t3,marginTop:4}}>RR: <span style={{color:C.teal,fontWeight:800}}>1:{rr}</span></div>
            </div>
          </motion.div>
          <motion.div initial={{y:5,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:0.24}} style={{display:'flex',gap:7,marginTop:11}}>
            <GlassBtn variant="primary" icon="✏️" size="sm" onClick={()=>onEdit?.(trade)}>Modifier</GlassBtn>
            <GlassBtn variant="danger" icon="🗑️" size="sm" onClick={()=>{if(window.confirm('Supprimer ce trade ?'))onDelete?.(trade.id);}}>Supprimer</GlassBtn>
            <div style={{flex:1}}/>
            <GlassBtn variant="ghost" icon="📋" size="sm" onClick={()=>{navigator.clipboard?.writeText(JSON.stringify(trade,null,2));toast.success('Copié !');}}/>
          </motion.div>
        </div>
        <div ref={panelRef} style={{flex:1,overflowY:'auto',overflowX:'hidden',padding:'18px',scrollbarWidth:'thin',scrollbarColor:`${C.brd} transparent`}}>
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.2}}><MiniChart trade={trade}/></motion.div>
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.24}}>
            <SecTitle icon="📊" title="Métriques" color={C.cyan}/>
            <div style={{backgroundColor:C.bgDeep,borderRadius:10,padding:'2px 14px',border:`1px solid ${C.brd}`,marginBottom:16}}>
              <MRow label="P&L Net" value={fmtPnl(pnl)} color={pColor} icon="💰"/>
              <MRow label="Risk / Reward" value={`1 : ${rr}`} color={parseFloat(rr)>=2?C.green:parseFloat(rr)>=1?C.warn:C.danger} sub="Réel atteint" icon="⚖️"/>
              <MRow label="TP Atteint" value={`${tpPct}%`} color={parseFloat(tpPct)>=100?C.green:parseFloat(tpPct)>=50?C.warn:C.danger} sub="% de l'objectif" icon="🎯"/>
              <MRow label="Prix d'entrée" value={fmt(trade.entry,5)} icon="📍"/>
              <MRow label="Prix de sortie" value={fmt(trade.exit,5)} icon="🏁"/>
              {trade.sl&&parseFloat(trade.sl)>0&&<MRow label="Stop Loss" value={fmt(trade.sl,5)} color={C.danger} icon="🛑"/>}
              {trade.tp&&parseFloat(trade.tp)>0&&<MRow label="Take Profit" value={fmt(trade.tp,5)} color={C.green} icon="✨"/>}
              {trade.breakEven&&<MRow label="Break Even" value={fmt(trade.breakEven,5)} color={C.teal} icon="⚡"/>}
              {trade.trailingStop&&<MRow label="Trailing Stop" value={fmt(trade.trailingStop,5)} color={C.warn} icon="🔄"/>}
              {trade.lots&&<MRow label="Volume / Lots" value={trade.lots} icon="📦"/>}
              {trade.commission!=null&&<MRow label="Commission" value={`$${parseFloat(trade.commission||0).toFixed(2)}`} color={C.warn} icon="💸"/>}
              {trade.swap!=null&&<MRow label="Swap" value={`$${parseFloat(trade.swap||0).toFixed(2)}`} color={C.warn} icon="🔁"/>}
            </div>
          </motion.div>
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
                  <div style={{fontSize:8,color:C.t3,fontWeight:700,letterSpacing:'0.8px',marginBottom:5,textTransform:'uppercase'}}>{icon} {label}</div>
                  <div style={{fontSize:12,fontWeight:800,color}}>{value}</div>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.32}}>
            <SecTitle icon="🧠" title="Psychologie" color={C.purple}/>
            <PsychoCard score={trade.psychologyScore}/>
            <PBar label="Discipline" value={trade.psychologyScore>=80?90:trade.psychologyScore>=60?65:40} color={C.purple}/>
            <PBar label="Gestion émotions" value={parseInt(trade.psychologyScore)||0} color={C.blue}/>
            <PBar label="Confiance" value={Math.min(100,(parseInt(trade.psychologyScore)||0)+10)} color={C.cyan}/>
            <div style={{marginBottom:16}}/>
          </motion.div>
          {trade.notes&&(
            <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.36}}>
              <SecTitle icon="📝" title="Notes" color={C.warn}/>
              <div style={{padding:'13px 15px',borderRadius:10,backgroundColor:C.bgDeep,border:`1px solid ${C.brd}`,borderLeft:`3px solid ${C.warn}40`,fontSize:12,color:C.t2,lineHeight:1.75,fontStyle:'italic',marginBottom:16,whiteSpace:'pre-wrap'}}>
                <span style={{fontSize:15,marginRight:5,opacity:0.4}}>"</span>{trade.notes}<span style={{fontSize:15,marginLeft:5,opacity:0.4}}>"</span>
              </div>
            </motion.div>
          )}
          {/* Données extra (colonnes CSV non mappées) */}
          {trade.extra&&Object.keys(trade.extra).length>0&&(
            <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.38}}>
              <SecTitle icon="📎" title="Données Extra" color={C.purple}/>
              <div style={{backgroundColor:C.bgDeep,borderRadius:10,padding:'2px 14px',border:`1px solid ${C.brd}`,marginBottom:16}}>
                {Object.entries(trade.extra).map(([k,v])=>(<MRow key={k} label={k} value={String(v)} icon="•"/>))}
              </div>
            </motion.div>
          )}
          <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.42}} style={{padding:'9px 13px',borderRadius:8,backgroundColor:C.bgDeep,border:`1px solid ${C.brd}`,marginBottom:8}}>
            <div style={{fontSize:9,color:C.t3,fontFamily:'monospace',wordBreak:'break-all'}}>ID: {trade.id||'—'}</div>
            {trade.lastModified&&<div style={{fontSize:9,color:C.t3,marginTop:2}}>Modifié: {new Date(trade.lastModified).toLocaleString('fr-FR')}</div>}
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
        style={{position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.7)',backdropFilter:'blur(4px)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
        <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.9,opacity:0}} onClick={e=>e.stopPropagation()}
          style={{backgroundColor:C.bgCard,borderRadius:16,border:`1px solid ${C.brd}`,maxWidth:600,width:'100%',overflow:'hidden'}}>
          <div style={{padding:'22px',borderBottom:`1px solid ${C.brd}`,textAlign:'center'}}>
            <h2 style={{margin:0,fontSize:22,fontWeight:800,background:C.grad,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Ajouter des Trades</h2>
            <p style={{margin:'6px 0 0',fontSize:12,color:C.t3}}>Choisissez votre méthode d'ajout</p>
          </div>
          <div style={{padding:'28px 22px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:18}}>
            {[
              {m:'auto',  icon:'📥', title:'Automatique', desc:'Importez depuis CSV, Excel ou n\'importe quel broker'},
              {m:'manual',icon:'✏️', title:'Manuel',      desc:'Remplissez le formulaire complet'},
            ].map(({m,icon,title,desc})=>(
              <motion.div key={m} whileHover={{scale:1.03,y:-4}} whileTap={{scale:0.97}} onClick={()=>{onSelectMethod(m);onClose();}}
                style={{padding:'28px 20px',borderRadius:11,border:`1px solid ${C.brd}`,backgroundColor:C.bgDeep,cursor:'pointer',textAlign:'center'}}>
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
// 📂 IMPORT MODAL UNIVERSEL v4
// ══════════════════════════════════════════════════════════════════════════════

// ── FIELD MAP EXHAUSTIF (200+ alias) ─────────────────────────────────────────
const FIELD_MAP = {
  // SYMBOL
  symbol:'symbol',symbole:'symbol',instrument:'symbol',asset:'symbol',pair:'symbol',
  ticker:'symbol',market:'symbol',currency:'symbol',currencypair:'symbol',
  tradingsymbol:'symbol',contract:'symbol',product:'symbol',securityname:'symbol',
  security:'symbol',underlying:'symbol',stocksymbol:'symbol',futuresymbol:'symbol',
  cryptopair:'symbol',base:'symbol',basecurrency:'symbol',tradepair:'symbol',
  // TYPE / DIRECTION
  type:'type',direction:'type',side:'type',ordertype:'type',buysell:'type',
  tradetype:'type',transactiontype:'type',longshort:'type',bs:'type',
  action:'type',cmd:'type',operation:'type',sens:'type',
  // ENTRY
  entry:'entry',entryprice:'entry',openprice:'entry',open:'entry',
  prixentree:'entry',openrate:'entry',entryrate:'entry',openlevel:'entry',
  startprice:'entry',avgentryprice:'entry',averageentry:'entry',fillprice:'entry',
  executionprice:'entry',buyprice:'entry',openingprice:'entry',initialprice:'entry',
  price:'entry',rate:'entry',
  // EXIT
  exit:'exit',exitprice:'exit',closeprice:'exit',close:'exit',
  prixsortie:'exit',closerate:'exit',exitrate:'exit',closelevel:'exit',
  endprice:'exit',avgexitprice:'exit',averageexit:'exit',sellprice:'exit',
  closingprice:'exit',coverprice:'exit',
  // PNL
  pnl:'pnl',pl:'pnl',profitloss:'pnl',profit:'pnl',gain:'pnl',
  result:'pnl',resultat:'pnl',netprofit:'pnl',grossprofit:'pnl',
  realizedpnl:'pnl',realizedpl:'pnl',netpl:'pnl',netgain:'pnl',
  tradepnl:'pnl',closedpnl:'pnl',closedpl:'pnl',
  returnamount:'pnl',gainloss:'pnl',profitandloss:'pnl',
  montant:'pnl',benefice:'pnl',gainperte:'pnl',
  // DATE
  date:'date',tradedate:'date',opendate:'date',entrydate:'date',
  opentime:'date',datetime:'date',closetime:'date',timestamp:'date',
  exitdate:'date',tradeday:'date',tradedatetime:'date',
  closedate:'date',settledate:'date',executiondate:'date',
  filldate:'date',jour:'date',dateouverture:'date',datefermeture:'date',
  // TIME
  time:'time',heure:'time',entrytime:'time',tradetime:'time',exittime:'time',executiontime:'time',
  // SESSION
  session:'session',marketsession:'session',tradesession:'session',
  sessiontype:'session',tradingsession:'session',periode:'session',
  // BIAS
  bias:'bias',sentiment:'bias',trend:'bias',markettend:'bias',
  marketbias:'bias',tradesentiment:'bias',marketsentiment:'bias',
  tendance:'bias',orientation:'bias',
  // STOP LOSS
  sl:'sl',stoploss:'sl',stop:'sl',stoplosslevel:'sl',stoplossvalue:'sl',
  slprice:'sl',stoplossprice:'sl',slevel:'sl',stopprice:'sl',
  initialstop:'sl',hardstop:'sl',riskprice:'sl',protectivestop:'sl',
  niveaustoploss:'sl',
  // TAKE PROFIT
  tp:'tp',takeprofit:'tp',target:'tp',profittarget:'tp',tpprice:'tp',
  takeprofitprice:'tp',tplevel:'tp',targetprice:'tp',objectif:'tp',
  niveautakeprofit:'tp',tp1:'tp',tp2:'tp',tp3:'tp',
  // BREAK EVEN
  be:'breakEven',breakeven:'breakEven',breakevenpoint:'breakEven',
  beprice:'breakEven',belevel:'breakEven',seuilrentabilite:'breakEven',
  pointmort:'breakEven',
  // TRAILING STOP
  trailingstop:'trailingStop',trailstop:'trailingStop',trailingsl:'trailingStop',
  dynamicstop:'trailingStop',tsl:'trailingStop',trailingstoploss:'trailingStop',
  // SETUP
  setup:'setup',strategy:'setup',strategie:'setup',pattern:'setup',
  setuptype:'setup',tradestyle:'setup',signal:'setup',tradesetup:'setup',
  entrysetup:'setup',catalyst:'setup',triggertype:'setup',entrytype:'setup',
  trademodel:'setup',playbook:'setup',confluences:'setup',model:'setup',
  // NOTES
  notes:'notes',note:'notes',comment:'notes',commentaire:'notes',
  remarks:'notes',description:'notes',tradecomment:'notes',
  commentary:'notes',annotation:'notes',observations:'notes',
  reflexion:'notes',lesson:'notes',journalentry:'notes',
  // NEWS
  news:'newsImpact',newsimpact:'newsImpact',impact:'newsImpact',
  newsevent:'newsImpact',newstier:'newsImpact',newstype:'newsImpact',
  // PSYCHO
  psychology:'psychologyScore',psychologyscore:'psychologyScore',
  psycho:'psychologyScore',mentalstate:'psychologyScore',
  emotionscore:'psychologyScore',mental:'psychologyScore',
  // LOTS
  lots:'lots',lot:'lots',volume:'lots',quantity:'lots',size:'lots',
  tradesize:'lots',positionsize:'lots',contracts:'lots',shares:'lots',
  units:'lots',qty:'lots',lotsize:'lots',qte:'lots',quantite:'lots',
  // COMMISSION
  commission:'commission',commissions:'commission',brokerage:'commission',
  tradecost:'commission',fee:'commission',fees:'commission',
  tradingfee:'commission',frais:'commission',courtage:'commission',
  // SWAP
  swap:'swap',overnight:'swap',overnightfee:'swap',rollover:'swap',
  financingcost:'swap',holdingcost:'swap',
  // RISK
  risk:'risk',riskamount:'risk',riskvalue:'risk',dollarsatrisk:'risk',
  // RR
  rr:'rrActual',rratio:'rrActual',riskreward:'rrActual',
  rrratio:'rrActual',rrreel:'rrActual',
  // MISC
  markettype:'marketType',assetclass:'marketType',assettype:'marketType',
  exchange:'exchange',broker:'broker',platform:'platform',
  account:'account',accountname:'account',accountnumber:'account',compte:'account',
  duration:'duration',tradeduration:'duration',holdtime:'duration',
  tags:'tags',tag:'tags',labels:'tags',
};

// ── CHAMPS CIBLES AVEC LABELS ─────────────────────────────────────────────────
const KNOWN_FIELDS = [
  { value:'symbol',         label:'📍 Symbole',           required:true },
  { value:'type',           label:'↕️ Type (Long/Short)'               },
  { value:'entry',          label:'📈 Prix Entrée'                     },
  { value:'exit',           label:'📉 Prix Sortie'                     },
  { value:'pnl',            label:'💰 P&L ($)',            required:true },
  { value:'date',           label:'📅 Date'                            },
  { value:'time',           label:'🕐 Heure'                           },
  { value:'session',        label:'🌍 Session'                         },
  { value:'bias',           label:'⚖️ Bias'                            },
  { value:'sl',             label:'🛑 Stop Loss'                       },
  { value:'tp',             label:'✨ Take Profit'                     },
  { value:'breakEven',      label:'⚡ Break Even'                      },
  { value:'trailingStop',   label:'🔄 Trailing Stop'                   },
  { value:'setup',          label:'🎯 Setup / Stratégie'               },
  { value:'notes',          label:'📝 Notes / Journal'                 },
  { value:'newsImpact',     label:'📰 News Impact'                     },
  { value:'psychologyScore',label:'🧠 Score Psycho'                    },
  { value:'lots',           label:'📦 Lots / Volume / Shares'          },
  { value:'commission',     label:'💸 Commission / Frais'              },
  { value:'swap',           label:'🔁 Swap / Overnight'                },
  { value:'risk',           label:'⚠️ Risque ($)'                      },
  { value:'rrActual',       label:'⚖️ RR Réel'                         },
  { value:'marketType',     label:'🏷️ Type de marché'                  },
  { value:'exchange',       label:'🏦 Exchange / Broker'               },
  { value:'account',        label:'👤 Compte'                          },
  { value:'duration',       label:'⏱️ Durée'                           },
  { value:'tags',           label:'🏷️ Tags'                            },
  { value:'_extra',         label:'📎 Garder comme extra'              },
  { value:'_ignore',        label:'✕ Ignorer cette colonne'            },
];

// ── HELPERS CSV ───────────────────────────────────────────────────────────────
const normalizeKey = (k) =>
  k.toString().trim().toLowerCase()
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');

const detectSeparator = (content) => {
  const line = content.split(/\r?\n/)[0];
  const seps = [',', ';', '\t', '|'];
  const counts = seps.map(s => line.split(s).length - 1);
  return seps[counts.indexOf(Math.max(...counts))];
};

const parseCSVLine = (line, sep) => {
  const vals = []; let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { if (inQ && line[i+1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
    else if (c === sep && !inQ) { vals.push(cur.trim().replace(/^["']|["']$/g,'').replace(/""/g,'"').trim()); cur = ''; }
    else cur += c;
  }
  vals.push(cur.trim().replace(/^["']|["']$/g,'').replace(/""/g,'"').trim());
  return vals;
};

// ── NORMALISATION DES VALEURS ─────────────────────────────────────────────────
const normalizeType = (raw) => {
  if (!raw) return 'Long';
  const r = raw.toString().toLowerCase().trim();
  if (['buy','long','b','1','bullish','achat','hausse','up','compra'].includes(r)) return 'Long';
  if (['sell','short','s','-1','bearish','vente','baisse','down','venta'].includes(r)) return 'Short';
  if (r.includes('buy') || r.includes('long') || r.includes('achat')) return 'Long';
  if (r.includes('sell') || r.includes('short') || r.includes('vente')) return 'Short';
  return 'Long';
};

const normalizeSession = (raw) => {
  if (!raw) return 'NY';
  const r = raw.toString().toLowerCase().trim();
  if (r.includes('new york') || r.includes('ny') || r.includes('us') || r.includes('american') || r.includes('nyse') || r.includes('nasdaq')) return 'NY';
  if (r.includes('london') || r.includes('ldn') || r.includes('europe') || r.includes('eu') || r.includes('lse') || r.includes('euro')) return 'London';
  if (r.includes('asia') || r.includes('tokyo') || r.includes('asian') || r.includes('japan') || r.includes('sydney') || r.includes('jp')) return 'Asia';
  return raw;
};

const normalizeBias = (raw) => {
  if (!raw) return 'Neutral';
  const r = raw.toString().toLowerCase().trim();
  if (r.includes('bull') || r.includes('long') || r.includes('haussier') || r.includes('hausse') || r.includes('up') || r === '1') return 'Bullish';
  if (r.includes('bear') || r.includes('short') || r.includes('baissier') || r.includes('baisse') || r.includes('down') || r === '-1') return 'Bearish';
  return 'Neutral';
};

const normalizeNews = (raw) => {
  if (!raw) return 'Low';
  const r = raw.toString().toLowerCase().trim();
  if (r.includes('high') || r.includes('fort') || r === '3' || r === 'red' || r === 'rouge') return 'High';
  if (r.includes('med') || r.includes('moyen') || r === '2' || r === 'orange' || r === 'yellow') return 'Medium';
  return 'Low';
};

const parseNum = (v) => {
  if (v == null || v === '') return null;
  let s = v.toString().trim().replace(/[$€£¥\s]/g, '').replace(/[^0-9.,\-+]/g, '');
  if (s.includes(',') && !s.includes('.')) s = s.replace(',', '.');
  else if (s.includes(',') && s.includes('.')) s = s.replace(/,/g, '');
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
};

const parseDate = (raw) => {
  if (!raw) return new Date().toISOString().split('T')[0];
  const s = raw.toString().trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10);
  const dmy = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2,'0')}-${dmy[1].padStart(2,'0')}`;
  const mdy = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
  if (mdy) { const y = mdy[3].length===2 ? '20'+mdy[3] : mdy[3]; return `${y}-${mdy[1].padStart(2,'0')}-${mdy[2].padStart(2,'0')}`; }
  if (/^\d{10,13}$/.test(s)) { const d = new Date(s.length===10 ? parseInt(s)*1000 : parseInt(s)); return d.toISOString().split('T')[0]; }
  try { const d = new Date(s); if (!isNaN(d)) return d.toISOString().split('T')[0]; } catch {}
  return new Date().toISOString().split('T')[0];
};

// ── DÉTECTION PAR CONTENU ─────────────────────────────────────────────────────
// Analyse les valeurs réelles d'une colonne pour deviner le champ si le nom ne matche pas
const guessFieldFromContent = (values) => {
  const samples = values.filter(v => v && v.toString().trim()).slice(0, 10);
  if (!samples.length) return null;
  // TYPE : buy/sell/long/short
  const typeVals = ['buy','sell','long','short','b','s','1','-1','achat','vente'];
  if (samples.filter(v => typeVals.includes(v.toString().toLowerCase().trim())).length >= samples.length * 0.6) return 'type';
  // SESSION
  const sessVals = ['ny','london','asia','new york','tokyo','sydney','european','american','asian'];
  if (samples.filter(v => sessVals.some(s => v.toString().toLowerCase().includes(s))).length >= samples.length * 0.5) return 'session';
  // BIAS
  const biasVals = ['bullish','bearish','neutral','haussier','baissier','neutre','bull','bear'];
  if (samples.filter(v => biasVals.some(b => v.toString().toLowerCase().includes(b))).length >= samples.length * 0.5) return 'bias';
  // NEWS
  const newsVals = ['high','medium','low','red','orange','green','rouge','jaune','vert','fort','moyen','faible'];
  if (samples.filter(v => newsVals.includes(v.toString().toLowerCase().trim())).length >= samples.length * 0.5) return 'newsImpact';
  // DATE
  if (samples.filter(v => /\d{2,4}[\-\/\.]\d{1,2}[\-\/\.]\d{2,4}/.test(v) || /^\d{10,13}$/.test(v)).length >= samples.length * 0.7) return 'date';
  // SYMBOL : lettres maj 2-10 chars
  if (samples.filter(v => /^[A-Z]{2,10}(\/[A-Z]{2,6})?$/.test(v.toString().toUpperCase().trim())).length >= samples.length * 0.6) return 'symbol';
  // NOMBRE avec signe → PNL
  const nums = samples.map(v => parseNum(v)).filter(n => n !== null);
  if (nums.length >= samples.length * 0.8) {
    const hasNeg = nums.some(n => n < 0);
    const hasPos = nums.some(n => n > 0);
    if (hasNeg && hasPos && Math.max(...nums.map(Math.abs)) < 100000) return 'pnl';
  }
  return null;
};

// ── SCORE DE CONFIANCE (0-100) ────────────────────────────────────────────────
const getMappingConfidence = (header, mappedField, sampleValues) => {
  if (mappedField === '_ignore') return 0;
  if (mappedField === '_extra')  return 25;
  const norm = normalizeKey(header);
  if (FIELD_MAP[norm] === mappedField) return 100; // Match exact par nom
  const partialKey = Object.keys(FIELD_MAP).find(k => (k.includes(norm) || norm.includes(k)) && k.length >= 3);
  if (partialKey && FIELD_MAP[partialKey] === mappedField) return 70;
  const guessed = guessFieldFromContent(sampleValues);
  if (guessed === mappedField) return 50;
  return 20;
};

// ── COMPOSANT IMPORT MODAL ────────────────────────────────────────────────────
const ImportModal = ({ isOpen, onClose, onImport }) => {
  const [step,         setStep]        = useState(1);
  const [file,         setFile]        = useState(null);
  const [drag,         setDrag]        = useState(false);
  const [parsing,      setParsing]     = useState(false);
  const [rawHeaders,   setRawHeaders]  = useState([]);
  const [previewRows,  setPreviewRows] = useState([]);
  const [mapping,      setMapping]     = useState({});
  const [confidence,   setConfidence]  = useState({});
  const [importing,    setImporting]   = useState(false);
  const [importResult, setImportResult]= useState(null);
  const [sep,          setSep]         = useState(',');
  const [allLines,     setAllLines]    = useState([]);
  const [filterConf,   setFilterConf]  = useState('all');
  const fileRef = useRef(null);

  const handleClose = () => {
    setStep(1); setFile(null); setDrag(false); setParsing(false);
    setRawHeaders([]); setPreviewRows([]); setMapping({}); setConfidence({});
    setImporting(false); setImportResult(null); setAllLines([]);
    setFilterConf('all'); onClose();
  };

  const handleFileLoad = (f) => {
    if (!f) return;
    setFile(f); setParsing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const bytes = new Uint8Array(e.target.result);
        let content;
        if (bytes[0]===0xEF && bytes[1]===0xBB && bytes[2]===0xBF)
          content = new TextDecoder('utf-8').decode(bytes.slice(3));
        else { try { content = new TextDecoder('utf-8').decode(bytes); } catch { content = new TextDecoder('iso-8859-1').decode(bytes); } }
        content = content.trim();

        const detectedSep = detectSeparator(content);
        setSep(detectedSep);
        const lines = content.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) { toast.error('Fichier trop court'); setParsing(false); return; }

        const headers = parseCSVLine(lines[0], detectedSep);
        const preview = lines.slice(1, 8).map(l => parseCSVLine(l, detectedSep));

        // ── PASSE 1 : match par nom dans FIELD_MAP ──
        const autoMap = {};
        headers.forEach(h => {
          const norm = normalizeKey(h);
          autoMap[h] = FIELD_MAP[norm] || null;
        });

        // ── PASSE 2 : pour les non-matchés, analyse le contenu ──
        headers.forEach((h, colIdx) => {
          if (!autoMap[h]) {
            const colValues = preview.map(row => row[colIdx] || '').filter(Boolean);
            const guessed = guessFieldFromContent(colValues);
            autoMap[h] = guessed || '_extra';
          }
        });

        // ── PASSE 3 : résoudre les doublons ──
        // Si 2 colonnes mappées sur le même champ, garder la plus probable
        const usedFields = {};
        headers.forEach(h => {
          const f = autoMap[h];
          if (!f || f === '_extra' || f === '_ignore') return;
          if (!usedFields[f]) {
            usedFields[f] = h;
          } else {
            // Doublon : comparer les scores de nom
            const normH = normalizeKey(h);
            const normExisting = normalizeKey(usedFields[f]);
            const scoreH = FIELD_MAP[normH] === f ? 100 : 50;
            const scoreE = FIELD_MAP[normExisting] === f ? 100 : 50;
            if (scoreH > scoreE) { autoMap[usedFields[f]] = '_extra'; usedFields[f] = h; }
            else { autoMap[h] = '_extra'; }
          }
        });

        // ── Calcul des scores de confiance ──
        const conf = {};
        headers.forEach((h, colIdx) => {
          const colValues = preview.map(row => row[colIdx] || '');
          conf[h] = getMappingConfidence(h, autoMap[h], colValues);
        });

        setRawHeaders(headers);
        setPreviewRows(preview.slice(0, 5));
        setMapping(autoMap);
        setConfidence(conf);
        setAllLines(lines.slice(1));
        setParsing(false);
        setStep(2);

        const highCount = Object.values(conf).filter(c => c >= 70).length;
        toast.success(`🤖 ${highCount}/${headers.length} colonnes détectées automatiquement`);
      } catch(err) { toast.error(`Erreur: ${err.message}`); setParsing(false); }
    };
    reader.readAsArrayBuffer(f);
  };

  const handleImport = () => {
    setImporting(true);
    setTimeout(() => {
      try {
        const results = []; const skipped = [];
        allLines.forEach((line, idx) => {
          if (!line.trim()) return;
          const vals = parseCSVLine(line, sep);
          const raw = {}; rawHeaders.forEach((h, i) => { raw[h] = (vals[i]||'').toString().trim(); });
          const mapped = {}; const extra = {};
          rawHeaders.forEach(h => {
            const target = mapping[h] || '_extra';
            const val = raw[h] || '';
            if (target === '_ignore') return;
            if (target === '_extra') { if (val) extra[h] = val; return; }
            if (!mapped[target] && val) mapped[target] = val;
          });
          if (!mapped.symbol) { skipped.push(idx + 2); return; }
          const entry   = parseNum(mapped.entry);
          const exit    = parseNum(mapped.exit);
          const pnlVal  = parseNum(mapped.pnl) ?? 0;
          const slVal   = parseNum(mapped.sl);
          const tpVal   = parseNum(mapped.tp);
          const beVal   = parseNum(mapped.breakEven);
          const tsVal   = parseNum(mapped.trailingStop);
          const lotsVal = parseNum(mapped.lots);
          const commVal = parseNum(mapped.commission);
          const swapVal = parseNum(mapped.swap);
          const riskVal = parseNum(mapped.risk);
          const rrVal   = parseNum(mapped.rrActual);
          const riskDist = slVal && entry ? Math.abs(entry - slVal) : 0;
          const reward   = entry && exit  ? Math.abs(exit - entry)  : 0;
          const rrCalc   = riskDist > 0 ? (reward/riskDist).toFixed(2) : rrVal?.toFixed(2) || '0';
          const tpPctCalc = tpVal && entry && Math.abs(tpVal-entry) > 0
            ? ((reward / Math.abs(tpVal-entry)) * 100).toFixed(1) : '0';
          results.push({
            id: `imp_${Date.now()}_${idx}_${Math.random().toString(36).slice(2,6)}`,
            symbol:         mapped.symbol.toUpperCase().trim().replace(/[^A-Z0-9\/\.\-_]/g,''),
            type:           normalizeType(mapped.type || mapped.side),
            entry:          entry || 0,
            exit:           exit  || 0,
            pnl:            pnlVal,
            date:           parseDate(mapped.date),
            time:           mapped.time || '00:00',
            session:        normalizeSession(mapped.session),
            bias:           normalizeBias(mapped.bias),
            newsImpact:     normalizeNews(mapped.newsImpact),
            setup:          mapped.setup    || '',
            notes:          mapped.notes    || '',
            sl:             slVal,
            tp:             tpVal,
            breakEven:      beVal,
            trailingStop:   tsVal,
            lots:           lotsVal,
            commission:     commVal,
            swap:           swapVal,
            risk:           riskVal,
            marketType:     mapped.marketType || '',
            exchange:       mapped.exchange   || '',
            account:        mapped.account    || '',
            duration:       mapped.duration   || '',
            tags:           mapped.tags       || '',
            psychologyScore: mapped.psychologyScore ? parseInt(mapped.psychologyScore) : 80,
            win:            pnlVal > 0,
            extra:          Object.keys(extra).length ? extra : undefined,
            metrics:        { rrReel: rrCalc, tpPercent: tpPctCalc },
          });
        });
        setImportResult({ count: results.length, ignored: skipped.length });
        if (!results.length) { toast.error('Aucun trade valide. Vérifiez que la colonne Symbole est mappée.'); setImporting(false); return; }
        onImport(results);
        toast.success(`🎉 ${results.length} trade(s) importé(s) !`);
        if (skipped.length > 0) toast(`⚠️ ${skipped.length} ligne(s) ignorée(s)`, { icon:'⚠️' });
        setImporting(false); setStep(3);
      } catch(err) { toast.error(`Erreur: ${err.message}`); setImporting(false); }
    }, 300);
  };

  if (!isOpen) return null;

  const iStyle = {
    padding:'6px 10px', borderRadius:6, border:`1px solid ${C.brd}`,
    backgroundColor:C.bgDeep, color:C.t1, fontSize:11, outline:'none',
    fontFamily:'inherit', cursor:'pointer', width:'100%',
  };

  const symbolMapped  = Object.values(mapping).includes('symbol');
  const highCount     = rawHeaders.filter(h => (confidence[h]??0) >= 70).length;
  const medCount      = rawHeaders.filter(h => { const c=confidence[h]??0; return c>=50&&c<70; }).length;
  const lowCount      = rawHeaders.filter(h => (confidence[h]??0) < 50 && mapping[h] !== '_ignore').length;
  const extraCount    = rawHeaders.filter(h => mapping[h]==='_extra').length;

  const confColor = (c) => c >= 70 ? C.green : c >= 50 ? C.warn : C.danger;
  const confLabel = (c) => c >= 70 ? '✓ Auto' : c >= 50 ? '~ Deviné' : '? Manuel';

  const filteredHeaders = rawHeaders.filter(h => {
    const c   = confidence[h] ?? 0;
    const cur = mapping[h] || '_extra';
    if (filterConf === 'high')     return c >= 70;
    if (filterConf === 'low')      return c < 70;
    if (filterConf === 'unmapped') return cur === '_extra';
    return true;
  });

  return (
    <AnimatePresence>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={handleClose}
        style={{position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.78)',backdropFilter:'blur(5px)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
        <motion.div
          initial={{scale:0.92,opacity:0,y:20}} animate={{scale:1,opacity:1,y:0}}
          exit={{scale:0.92,opacity:0,y:10}} transition={{type:'spring',stiffness:280,damping:28}}
          onClick={e=>e.stopPropagation()}
          style={{
            backgroundColor:C.bgCard, borderRadius:16, border:`1px solid ${C.brd}`,
            width:'100%', maxWidth: step===2 ? 980 : 560,
            maxHeight:'94vh', overflow:'hidden',
            display:'flex', flexDirection:'column',
            boxShadow:'0 40px 100px rgba(0,0,0,0.65)',
          }}>

          {/* ── HEADER ── */}
          <div style={{padding:'14px 22px',borderBottom:`1px solid ${C.brd}`,background:`linear-gradient(135deg,${C.bgHigh},${C.bgCard})`,display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
            <div>
              <h3 style={{margin:0,fontSize:15,fontWeight:800,color:C.t1}}>
                {step===1 && '📥 Import CSV Universel'}
                {step===2 && '🤖 Mapping automatique des colonnes'}
                {step===3 && '✅ Import terminé'}
              </h3>
              <p style={{margin:'2px 0 0',fontSize:10,color:C.t3}}>
                {step===1 && 'Détection intelligente · Compatible tous brokers, tous styles de trading'}
                {step===2 && `${rawHeaders.length} colonnes · ${highCount} auto-mappées · séparateur: "${sep==='\t'?'Tab':sep}"`}
                {step===3 && `${importResult?.count} trades importés avec succès`}
              </p>
            </div>
            {/* Stepper */}
            <div style={{display:'flex',alignItems:'center',gap:5}}>
              {[1,2,3].map(s=>(
                <React.Fragment key={s}>
                  <div style={{width:24,height:24,borderRadius:'50%',background:s===step?C.grad:s<step?C.greenDim:C.bgDeep,border:`1px solid ${s<=step?'transparent':C.brd}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:800,color:s<=step?C.bgDeep:C.t3,transition:'all 0.3s'}}>
                    {s<step?'✓':s}
                  </div>
                  {s<3&&<div style={{width:14,height:1,backgroundColor:s<step?C.greenDim:C.brd}}/>}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* ── STEP 1 : UPLOAD ── */}
          {step===1&&(
            <div style={{padding:'22px',flex:1,overflowY:'auto'}}>
              {/* Drop zone */}
              <div
                onDragEnter={e=>{e.preventDefault();setDrag(true);}}
                onDragLeave={e=>{e.preventDefault();setDrag(false);}}
                onDragOver={e=>{e.preventDefault();setDrag(true);}}
                onDrop={e=>{e.preventDefault();setDrag(false);if(e.dataTransfer.files[0])handleFileLoad(e.dataTransfer.files[0]);}}
                onClick={()=>fileRef.current?.click()}
                style={{border:`2px dashed ${drag?C.cyan:file?C.green:C.brd}`,borderRadius:12,padding:'38px 24px',textAlign:'center',backgroundColor:drag?'rgba(0,212,255,0.04)':file?'rgba(0,230,118,0.03)':C.bgDeep,cursor:'pointer',transition:'all 0.25s'}}>
                <input ref={fileRef} type="file" accept=".csv,.txt,.tsv" style={{display:'none'}} onChange={e=>e.target.files[0]&&handleFileLoad(e.target.files[0])}/>
                {parsing
                  ? <div style={{fontSize:13,color:C.cyan}}><motion.div animate={{rotate:360}} transition={{duration:1,repeat:Infinity,ease:'linear'}} style={{width:26,height:26,border:`3px solid ${C.cyan}`,borderTopColor:'transparent',borderRadius:'50%',margin:'0 auto 10px'}}/>Analyse intelligente en cours…</div>
                  : file
                    ? <><div style={{fontSize:38,marginBottom:8}}>✅</div><div style={{fontSize:13,fontWeight:700,color:C.green,marginBottom:3}}>{file.name}</div><div style={{fontSize:10,color:C.t3}}>{(file.size/1024).toFixed(1)} KB · Cliquez pour changer</div></>
                    : <><div style={{fontSize:48,marginBottom:12}}>📁</div><div style={{fontSize:13,fontWeight:600,color:C.t1,marginBottom:4}}>Glissez votre CSV ici</div><div style={{fontSize:10,color:C.t3}}>ou cliquez pour parcourir · .csv .txt .tsv</div></>
                }
              </div>

              {/* Détection 3 passes */}
              <div style={{marginTop:14,padding:'12px 14px',borderRadius:10,backgroundColor:'rgba(0,212,255,0.03)',border:`1px solid rgba(0,212,255,0.1)`}}>
                <div style={{fontSize:9,fontWeight:700,color:C.cyan,marginBottom:8,letterSpacing:'1px'}}>🤖 DÉTECTION INTELLIGENTE EN 3 PASSES</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
                  {[
                    {icon:'📛',title:'Par nom',desc:'200+ alias : sl/stoploss/stop, tp/target, be/breakeven, tsl/trailingstop, session, bias…'},
                    {icon:'🔬',title:'Par contenu',desc:'Analyse les valeurs : buy/sell→Type, NY/London→Session, bullish/bearish→Bias, dates→Date…'},
                    {icon:'🔁',title:'Anti-doublons',desc:'Si 2 colonnes matchent le même champ, garde la plus probable, l\'autre → extra'},
                  ].map(({icon,title,desc})=>(
                    <div key={title} style={{padding:'8px 10px',borderRadius:8,backgroundColor:C.bgDeep,border:`1px solid ${C.brd}`}}>
                      <div style={{fontSize:14,marginBottom:3}}>{icon}</div>
                      <div style={{fontSize:10,fontWeight:700,color:C.t1,marginBottom:2}}>{title}</div>
                      <div style={{fontSize:9,color:C.t4,lineHeight:1.5}}>{desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Brokers */}
              <div style={{marginTop:10,padding:'10px 13px',borderRadius:9,backgroundColor:'rgba(0,212,255,0.03)',border:`1px solid rgba(0,212,255,0.1)`}}>
                <div style={{fontSize:9,fontWeight:700,color:C.cyan,marginBottom:6}}>COMPATIBLE AVEC</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                  {['MT4','MT5','cTrader','TradingView','TradeZella','TraderSync','FTMO','TopStep','E8','The5%ers','Binance','Bybit','Kraken','OANDA','Forex.com','Interactive Brokers','ThinkOrSwim','NinjaTrader','Tradovate','Excel','Google Sheets','Notion','Airtable'].map(b=>(
                    <span key={b} style={{padding:'2px 7px',borderRadius:4,fontSize:9,fontWeight:600,color:C.t3,backgroundColor:C.bgDeep,border:`1px solid ${C.brd}`}}>{b}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2 : MAPPING INTELLIGENT ── */}
          {step===2&&(
            <div style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column'}}>

              {/* Barre stats + onglets filtre */}
              <div style={{padding:'10px 20px',borderBottom:`1px solid ${C.brd}`,flexShrink:0,backgroundColor:C.bgDeep}}>
                {/* Badges stats */}
                <div style={{display:'flex',gap:7,marginBottom:8,flexWrap:'wrap',alignItems:'center'}}>
                  <span style={{fontSize:10,color:C.t3,fontWeight:600}}>Résultat détection :</span>
                  {[
                    {label:`${highCount} auto`,color:C.green,bg:'rgba(0,230,118,0.1)'},
                    {label:`${medCount} devinées`,color:C.warn,bg:'rgba(255,179,0,0.1)'},
                    {label:`${lowCount} manuelles`,color:C.danger,bg:'rgba(255,71,87,0.1)'},
                    {label:`${extraCount} extra`,color:C.purple,bg:'rgba(167,139,250,0.1)'},
                  ].map(({label,color,bg})=>(
                    <span key={label} style={{fontSize:9,padding:'2px 8px',borderRadius:4,color,backgroundColor:bg,fontWeight:700}}>{label}</span>
                  ))}
                </div>
                {/* Onglets filtre */}
                <div style={{display:'flex',gap:4,alignItems:'center'}}>
                  {[
                    {k:'all',     label:`Toutes (${rawHeaders.length})`},
                    {k:'high',    label:`✓ Auto (${highCount})`},
                    {k:'low',     label:`? À vérifier (${medCount+lowCount})`},
                    {k:'unmapped',label:`+ Extra (${extraCount})`},
                  ].map(({k,label})=>(
                    <button key={k} onClick={()=>setFilterConf(k)} style={{padding:'4px 10px',borderRadius:6,border:`1px solid ${filterConf===k?C.cyan:C.brd}`,backgroundColor:filterConf===k?'rgba(0,212,255,0.1)':C.bgDeep,color:filterConf===k?C.cyan:C.t3,fontSize:10,fontWeight:filterConf===k?700:400,cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s'}}>{label}</button>
                  ))}
                  <div style={{flex:1}}/>
                  {/* Bouton reset mapping */}
                  <button onClick={()=>{
                    const re = {};
                    rawHeaders.forEach(h => { const norm = normalizeKey(h); re[h] = FIELD_MAP[norm] || '_extra'; });
                    setMapping(re);
                    toast.success('Mapping réinitialisé au détection automatique');
                  }} style={{padding:'4px 10px',borderRadius:6,border:`1px solid ${C.brd}`,backgroundColor:C.bgDeep,color:C.t3,fontSize:10,cursor:'pointer',fontFamily:'inherit'}}>↺ Reset auto</button>
                </div>
              </div>

              <div style={{flex:1,overflow:'auto',padding:'12px 20px'}}>
                {/* Aperçu preview */}
                <div style={{marginBottom:12,overflowX:'auto'}}>
                  <div style={{fontSize:9,fontWeight:700,color:C.t3,marginBottom:5,letterSpacing:'0.8px'}}>APERÇU DES DONNÉES (5 premières lignes)</div>
                  <table style={{borderCollapse:'collapse',minWidth:'max-content',fontSize:9}}>
                    <thead>
                      <tr>
                        {rawHeaders.map(h=>(
                          <th key={h} style={{padding:'4px 8px',backgroundColor:C.bgDeep,border:`1px solid ${C.brd}`,whiteSpace:'nowrap',color:C.cyan,fontWeight:700,maxWidth:100,overflow:'hidden',textOverflow:'ellipsis'}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row,ri)=>(
                        <tr key={ri} style={{backgroundColor:ri%2===0?'transparent':'rgba(255,255,255,0.01)'}}>
                          {rawHeaders.map((_,ci)=>(
                            <td key={ci} style={{padding:'3px 8px',border:`1px solid ${C.brd}20`,color:C.t2,whiteSpace:'nowrap',maxWidth:100,overflow:'hidden',textOverflow:'ellipsis'}}>{row[ci]||''}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Grille de mapping */}
                <div style={{fontSize:9,fontWeight:700,color:C.t3,marginBottom:8,letterSpacing:'0.8px'}}>
                  MAPPING — modifiez, ajoutez ou ignorez librement
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))',gap:7}}>
                  {filteredHeaders.map(h => {
                    const cur    = mapping[h] || '_extra';
                    const conf   = confidence[h] ?? 0;
                    const cc     = confColor(conf);
                    const cl     = confLabel(conf);
                    const isIgn  = cur === '_ignore';
                    const isReq  = ['symbol','pnl'].includes(cur);
                    const colIdx = rawHeaders.indexOf(h);
                    const sample = previewRows[0]?.[colIdx] || '';
                    return (
                      <motion.div key={h} initial={{opacity:0,y:4}} animate={{opacity:1,y:0}}
                        style={{
                          padding:'9px 11px', borderRadius:9,
                          backgroundColor: isIgn ? C.bgDeep+'60' : C.bgDeep,
                          border:`1px solid ${isReq ? `${C.cyan}60` : isIgn ? C.brd+'40' : `${cc}30`}`,
                          opacity: isIgn ? 0.4 : 1,
                          position:'relative',
                        }}>
                        {/* Badge confiance */}
                        <div style={{position:'absolute',top:6,right:8,fontSize:7,fontWeight:800,color:cc,letterSpacing:'0.3px'}}>{cl}</div>
                        {/* Nom colonne CSV */}
                        <div style={{fontSize:10,fontWeight:700,color:isIgn?C.t3:C.t1,marginBottom:4,paddingRight:50,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={h}>{h}</div>
                        {/* Select mapping */}
                        <select
                          value={cur}
                          onChange={e => {
                            const newVal = e.target.value;
                            // Si le champ cible est déjà pris → libérer l'autre colonne
                            const existing = rawHeaders.find(hh => hh !== h && mapping[hh] === newVal && newVal !== '_extra' && newVal !== '_ignore');
                            if (existing) {
                              setMapping(m => ({ ...m, [existing]:'_extra', [h]:newVal }));
                              toast(`"${existing}" libéré → extra`, { icon:'🔀', duration:2000 });
                            } else {
                              setMapping(m => ({ ...m, [h]:newVal }));
                            }
                          }}
                          style={{...iStyle, fontSize:10, borderColor:isReq?`${C.cyan}50`:isIgn?C.brd+'60':`${cc}25`, color:isIgn?C.t3:C.t1}}>
                          {KNOWN_FIELDS.map(f => (
                            <option key={f.value} value={f.value}>{f.label}{f.required?' *':''}</option>
                          ))}
                        </select>
                        {/* Valeur exemple */}
                        {sample && (
                          <div style={{fontSize:8,color:C.t4,fontFamily:'monospace',marginTop:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                            ex: {sample}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {/* Warning symbole manquant */}
                {!symbolMapped && (
                  <motion.div initial={{opacity:0}} animate={{opacity:1}}
                    style={{marginTop:12,padding:'10px 14px',borderRadius:8,backgroundColor:'rgba(255,71,87,0.06)',border:`1px solid ${C.danger}30`,fontSize:11,color:C.danger}}>
                    ⚠️ La colonne <strong>Symbole</strong> est obligatoire.
                    Trouvez la colonne contenant vos paires (ex: EURUSD, BTCUSDT…) et sélectionnez <em>📍 Symbole</em>.
                  </motion.div>
                )}

                {/* Résumé champs mappés */}
                <div style={{marginTop:12,padding:'10px 14px',borderRadius:8,backgroundColor:'rgba(0,212,255,0.03)',border:`1px solid rgba(0,212,255,0.1)`}}>
                  <div style={{fontSize:9,color:C.t3,fontWeight:700,marginBottom:6}}>CHAMPS MARKETFLOW MAPPÉS</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                    {KNOWN_FIELDS.filter(f=>f.value!=='_ignore'&&f.value!=='_extra').map(f=>{
                      const isMapped   = Object.values(mapping).includes(f.value);
                      const mappedFrom = rawHeaders.find(h => mapping[h] === f.value);
                      return (
                        <div key={f.value} style={{fontSize:8,padding:'3px 8px',borderRadius:5,backgroundColor:isMapped?`${C.green}12`:C.bgDeep,border:`1px solid ${isMapped?C.greenDim:C.brd}`,color:isMapped?C.green:C.t4,fontWeight:isMapped?700:400,display:'flex',alignItems:'center',gap:4}}>
                          {f.label.replace(/[📍↕️📈📉💰📅🕐🌍⚖️🛑✨⚡🔄🎯📝🧠📦💸🔁⚠️📰🏷️🏦👤⏱️📎]/g,'').trim()}
                          {isMapped && <span style={{color:C.teal,fontSize:7}}>← {mappedFrom}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3 : SUCCÈS ── */}
          {step===3&&(
            <div style={{padding:'40px 22px',textAlign:'center',flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
              <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:'spring',delay:0.1,stiffness:160}}>
                <div style={{fontSize:70,marginBottom:20}}>🎉</div>
              </motion.div>
              <h2 style={{margin:'0 0 8px',fontSize:24,fontWeight:900,background:C.grad,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Import réussi !</h2>
              <div style={{fontSize:14,color:C.t2,marginBottom:6}}>
                <span style={{color:C.green,fontWeight:800,fontSize:22}}>{importResult?.count}</span> trades importés
              </div>
              {importResult?.ignored>0&&<div style={{fontSize:12,color:C.warn,marginBottom:14}}>⚠️ {importResult.ignored} ligne(s) ignorée(s)</div>}
              <div style={{marginTop:24}}>
                <GlassBtn variant="primary" icon="✓" onClick={handleClose}>Fermer et voir les trades</GlassBtn>
              </div>
            </div>
          )}

          {/* ── FOOTER ── */}
          {step!==3&&(
            <div style={{padding:'12px 20px',borderTop:`1px solid ${C.brd}`,display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0,backgroundColor:C.bgDeep}}>
              <GlassBtn onClick={step===1?handleClose:()=>setStep(1)} icon={step===2?'←':undefined}>
                {step===1?'Annuler':'Retour'}
              </GlassBtn>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                {step===2&&<span style={{fontSize:11,color:C.t3}}>{allLines.length} lignes à importer</span>}
                {step===1&&file&&!parsing&&(
                  <GlassBtn variant="primary" onClick={()=>setStep(2)} icon="🤖">
                    Détecter automatiquement
                  </GlassBtn>
                )}
                {step===2&&(
                  <GlassBtn variant="primary" icon="📥" loading={importing} disabled={!symbolMapped} onClick={handleImport}>
                    Importer {allLines.length} trade(s)
                  </GlassBtn>
                )}
              </div>
            </div>
          )}
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
  const calcRR = d => { const [en,ex,sl]=[parseFloat(d.entry),parseFloat(d.exit),parseFloat(d.sl)]; if(!en||!ex||!sl||isNaN(en)||isNaN(ex)||isNaN(sl)) return '0.00'; const risk=Math.abs(en-sl),reward=Math.abs(ex-en); return risk>0?(reward/risk).toFixed(2):'0.00'; };
  const calcTPP = d => { const [en,ex,tp]=[parseFloat(d.entry),parseFloat(d.exit),parseFloat(d.tp)]; if(!en||!ex||!tp||isNaN(en)||isNaN(ex)||isNaN(tp)) return '0.0'; const target=Math.abs(tp-en); return target>0?((Math.abs(ex-en)/target)*100).toFixed(1):'0.0'; };
  const validate = () => { const errs={}; if(!form.symbol?.trim()) errs.symbol='Obligatoire'; if(!form.entry||isNaN(parseFloat(form.entry))) errs.entry='Prix invalide'; if(!form.exit||isNaN(parseFloat(form.exit))) errs.exit='Prix invalide'; if(!form.pnl||isNaN(parseFloat(form.pnl))) errs.pnl='Montant invalide'; setErrors(errs); return Object.keys(errs).length===0; };
  const handleSubmit = () => { if(!validate()){toast.error('Corrigez les erreurs');return;} setSaving(true); setTimeout(()=>{ onSave({...form,id:form.id||`manual_${Date.now()}_${Math.random().toString(36).slice(2,9)}`,win:parseFloat(form.pnl)>0,metrics:{rrReel:calcRR(form),tpPercent:calcTPP(form)},lastModified:new Date().toISOString()}); toast.success(isEdit?'✅ Trade modifié !':'✅ Trade ajouté !'); setSaving(false); setErrors({}); onClose(); },450); };
  if(!isOpen) return null;
  const iStyle = { width:'100%', padding:'8px 11px', borderRadius:7, border:`1px solid ${C.brd}`, backgroundColor:C.bgDeep, color:C.t1, fontSize:12, outline:'none', fontFamily:'inherit' };
  const lStyle = { display:'block', fontSize:10, fontWeight:600, color:C.t3, marginBottom:5 };
  const eStyle = { fontSize:10, color:C.danger, marginTop:3 };
  return (
    <AnimatePresence>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}
        style={{position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.75)',backdropFilter:'blur(4px)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:20,overflowY:'auto'}}>
        <motion.div initial={{scale:0.9}} animate={{scale:1}} exit={{scale:0.9}} onClick={e=>e.stopPropagation()}
          style={{backgroundColor:C.bgCard,borderRadius:16,border:`1px solid ${C.brd}`,maxWidth:680,width:'100%',maxHeight:'90vh',overflow:'hidden',display:'flex',flexDirection:'column'}}>
          <div style={{padding:'18px 22px',borderBottom:`1px solid ${C.brd}`,background:C.grad}}>
            <h3 style={{margin:0,fontSize:17,fontWeight:700,color:'#fff'}}>{isEdit?'✏️ Modifier le Trade':'✏️ Ajouter un Trade'}</h3>
          </div>
          <div style={{flex:1,overflowY:'auto',padding:'22px'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:15}}>
              {[
                {k:'date',l:'Date *',t:'date'},
                {k:'time',l:'Heure',t:'time'},
                {k:'symbol',l:'Symbole *',t:'text',ph:'EURUSD'},
                {k:'type',l:'Type',t:'select',opts:['Long','Short']},
                {k:'session',l:'Session',t:'select',opts:['NY','London','Asia']},
                {k:'bias',l:'Bias',t:'select',opts:['Bullish','Bearish','Neutral']},
                {k:'entry',l:'Entry *',t:'number',ph:'1.08500',step:'0.00001'},
                {k:'exit',l:'Exit *',t:'number',ph:'1.09000',step:'0.00001'},
                {k:'sl',l:'Stop Loss',t:'number',step:'0.00001'},
                {k:'tp',l:'Take Profit',t:'number',step:'0.00001'},
                {k:'pnl',l:'P&L ($) *',t:'number',ph:'150.00',step:'0.01'},
                {k:'setup',l:'Setup',t:'text',ph:'Breakout, Pullback...'},
                {k:'newsImpact',l:'News Impact',t:'select',opts:['High','Medium','Low']},
              ].map(({k,l,t,ph,step,opts})=>(
                <div key={k}>
                  <label style={{...lStyle,color:errors[k]?C.danger:C.t3}}>{l}</label>
                  {t==='select'
                    ? <select value={form[k]||''} onChange={e=>setForm({...form,[k]:e.target.value})} style={{...iStyle,border:`1px solid ${errors[k]?C.danger:C.brd}`,cursor:'pointer'}}>{opts.map(o=><option key={o} value={o}>{o}</option>)}</select>
                    : <input type={t} placeholder={ph} step={step} value={form[k]||''} onChange={e=>setForm({...form,[k]:k==='symbol'?e.target.value.toUpperCase():e.target.value})} style={{...iStyle,border:`1px solid ${errors[k]?C.danger:C.brd}`}}/>
                  }
                  {errors[k]&&<div style={eStyle}>{errors[k]}</div>}
                </div>
              ))}
              <div>
                <label style={lStyle}>Score Psycho: <span style={{color:form.psychologyScore>=80?C.green:form.psychologyScore>=60?C.warn:C.danger,fontWeight:800}}>{form.psychologyScore}</span></label>
                <input type="range" min="0" max="100" value={form.psychologyScore} onChange={e=>setForm({...form,psychologyScore:+e.target.value})} style={{...iStyle,padding:8,accentColor:C.cyan}}/>
              </div>
            </div>
            <div style={{marginTop:14}}>
              <label style={lStyle}>Notes</label>
              <textarea placeholder="Contexte, émotions, observations..." value={form.notes||''} onChange={e=>setForm({...form,notes:e.target.value})} rows={3} style={{...iStyle,resize:'vertical',minHeight:70}}/>
            </div>
            {form.entry&&form.exit&&form.sl&&(
              <div style={{marginTop:16,padding:14,borderRadius:9,backgroundColor:'rgba(0,212,255,0.05)',border:`1px solid rgba(0,212,255,0.18)`}}>
                <div style={{fontSize:10,fontWeight:700,color:C.cyan,marginBottom:8}}>📊 Calculs automatiques</div>
                <div style={{display:'flex',gap:28}}>
                  <div><div style={{fontSize:9,color:C.t3}}>Risk/Reward</div><div style={{fontSize:16,fontWeight:800,color:C.teal}}>1:{calcRR(form)}</div></div>
                  <div><div style={{fontSize:9,color:C.t3}}>TP atteint</div><div style={{fontSize:16,fontWeight:800,color:C.cyan}}>{calcTPP(form)}%</div></div>
                </div>
              </div>
            )}
          </div>
          <div style={{padding:'14px 22px',borderTop:`1px solid ${C.brd}`,display:'flex',gap:9,justifyContent:'flex-end'}}>
            <GlassBtn onClick={onClose}>Annuler</GlassBtn>
            <GlassBtn variant="primary" onClick={handleSubmit} loading={saving} icon="✓">{isEdit?'Sauvegarder':'Ajouter'}</GlassBtn>
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

  const [filters,  setFilters]  = useState({ search:'', result:'all', symbol:'all', session:'all', bias:'all', dateFrom:'', dateTo:'' });
  const [sort,     setSort]     = useState({ key:'date', dir:'desc' });
  const [selected, setSelected] = useState(new Set());
  const [cols,     setCols]     = useState(()=>{ try{const s=localStorage.getItem('mf_cols_v2');return s?JSON.parse(s):DEFAULT_COLUMNS;}catch{return DEFAULT_COLUMNS;} });
  const [page,     setPage]     = useState(1);
  const [perPage,  setPerPage]  = useState(25);

  const [modalAdd,    setModalAdd]    = useState(false);
  const [modalImport, setModalImport] = useState(false);
  const [modalForm,   setModalForm]   = useState(false);
  const [editTrade,   setEditTrade]   = useState(null);
  const [detailTrade, setDetailTrade] = useState(null);

  useEffect(()=>{ try{localStorage.setItem('mf_cols_v2',JSON.stringify(cols));}catch{} },[cols]);
  useEffect(()=>{ setPage(1); },[filters,sort]);

  const visibleCols = useMemo(()=>cols.filter(c=>c.visible),[cols]);
  const filtered    = useMemo(()=>filterTrades(trades,filters),[trades,filters]);
  const sorted      = useMemo(()=>sortTrades(filtered,sort.key,sort.dir),[filtered,sort]);
  const totalPages  = Math.max(1,Math.ceil(sorted.length/perPage));
  const paginated   = useMemo(()=>sorted.slice((page-1)*perPage,page*perPage),[sorted,page,perPage]);
  const cumulMap    = useMemo(()=>{ let running=0; const m={}; [...sorted].reverse().forEach(t=>{running+=parseFloat(t.pnl||0);m[t.id]=running;}); return m; },[sorted]);
  const stats       = useMemo(()=>calcStats(filtered),[filtered]);

  const handleSort           = useCallback(k=>{ setSort(p=>({key:k,dir:p.key===k&&p.dir==='asc'?'desc':'asc'})); },[]);
  const handleSelectAll      = useCallback(()=>{ setSelected(prev=>{const ids=new Set(paginated.map(t=>t.id));const allSel=paginated.every(t=>prev.has(t.id));if(allSel){const n=new Set(prev);ids.forEach(id=>n.delete(id));return n;}return new Set([...prev,...ids]);}); },[paginated]);
  const handleDeleteSelected = useCallback(()=>{ if(!selected.size)return; if(!window.confirm(`Supprimer ${selected.size} trade(s) ?`))return; const id=toast.loading('Suppression...'); setTimeout(()=>{selected.forEach(tid=>deleteTrade(tid));toast.dismiss(id);toast.success(`${selected.size} trade(s) supprimé(s) !`);setSelected(new Set());},350); },[selected,deleteTrade]);
  const handleMethodSelect   = useCallback(m=>{ if(m==='auto')setModalImport(true); else{setEditTrade(null);setModalForm(true);} },[]);
  const handleImport         = useCallback(t=>{ t.forEach(tr=>addTrade(tr)); },[addTrade]);
  const handleSave           = useCallback(t=>{ if(t.id&&trades.find(x=>x.id===t.id))updateTrade(t.id,t); else addTrade(t); setEditTrade(null); },[trades,updateTrade,addTrade]);
  const handleEdit           = useCallback(t=>{ setEditTrade(t); setModalForm(true); },[]);
  const handleReset          = useCallback(()=>{ setFilters({search:'',result:'all',symbol:'all',session:'all',bias:'all',dateFrom:'',dateTo:''});toast.success('Filtres réinitialisés'); },[]);

  return (
    <div style={{backgroundColor:C.bgPage,minHeight:'100vh',fontFamily:'system-ui,-apple-system,sans-serif',color:C.t1,padding:'24px'}}>

      {/* ── Header ── */}
      <motion.div variants={fadeInUp} initial="hidden" animate="visible"
        style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:22,flexWrap:'wrap',gap:10}}>
        <div>
          <h1 style={{margin:0,fontSize:26,fontWeight:900,background:C.grad,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',letterSpacing:'-0.5px'}}>All Trades</h1>
          <p style={{margin:'5px 0 0',color:C.t2,fontSize:12,fontWeight:500}}>Journal de trading · {trades.length} trades au total</p>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <GlassBtn icon="↓" onClick={()=>exportToCSV(filtered,`trades_${Date.now()}.csv`)}>Export CSV</GlassBtn>
          <GlassBtn variant="primary" icon="+" onClick={()=>setModalAdd(true)}>Ajouter</GlassBtn>
        </div>
      </motion.div>

      {/* ── 6 Stats Cards ── */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:11,marginBottom:18}}>
        <StatCard index={0} label="Total Trades"  value={stats.total}  color={C.cyan}  icon="📊" sub={`${stats.wins}W / ${stats.losses}L`}/>
        <StatCard index={1} label="Win Rate"      value={`${stats.winRate.toFixed(1)}%`} color={stats.winRate>=55?C.green:stats.winRate>=45?C.warn:C.danger} icon="🎯" sub={`${stats.wins} victoires`}/>
        <StatCard index={2} label="RR Moyen"      value={`1:${stats.avgRR}`} color={C.teal}  icon="⚖️" sub="Risk/Reward"/>
        <StatCard index={3} label="P&L Total"     value={fmtPnl(stats.totalPnL)} color={stats.totalPnL>=0?C.green:C.danger} icon="💰" sub={`${fmtPnl(stats.totalPnL/Math.max(1,stats.total))} / trade`}/>
        <StatCard index={4} label="Profit Factor" value={stats.pf} color={parseFloat(stats.pf)>=2?C.green:parseFloat(stats.pf)>=1.5?C.warn:C.danger} icon="📈" sub="Gross W / Gross L"/>
        <StatCard index={5} label="Max Drawdown"  value={`-${stats.maxDD.toFixed(1)}%`} color={C.danger} icon="⚠️" sub="Drawdown maximum"/>
      </div>

      {/* ── Filter Bar ── */}
      <FilterBar filters={filters} setFilters={setFilters} trades={trades} onReset={handleReset}/>

      {/* ── Bulk Actions ── */}
      <AnimatePresence>
        {selected.size>0&&(
          <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
            style={{backgroundColor:'rgba(0,212,255,0.05)',border:`1px solid rgba(0,212,255,0.18)`,borderRadius:9,padding:'9px 14px',marginBottom:10,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:18}}>✅</span>
              <span style={{color:C.cyan,fontSize:13,fontWeight:700}}>{selected.size} trade(s) sélectionné(s)</span>
            </div>
            <div style={{display:'flex',gap:8}}>
              <GlassBtn size="sm" variant="cyan" icon="↓" onClick={()=>exportToCSV(trades.filter(t=>selected.has(t.id)),`selection_${Date.now()}.csv`)}>Exporter sélection</GlassBtn>
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
            <h3 style={{color:C.t1,fontSize:18,fontWeight:700,marginBottom:8}}>{trades.length===0?'Aucun trade':'Aucun résultat'}</h3>
            <p style={{color:C.t2,fontSize:13,marginBottom:22}}>{trades.length===0?'Importez ou ajoutez votre premier trade':'Modifiez vos filtres'}</p>
            {trades.length===0&&<GlassBtn variant="primary" icon="+" onClick={()=>setModalAdd(true)}>Ajouter un trade</GlassBtn>}
          </div>
        ) : (
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{backgroundColor:C.bgDeep}}>
                  {visibleCols.map(col=>(
                    <th key={col.key} onClick={col.sortable?()=>handleSort(col.key):undefined}
                      style={{padding:'11px 14px',textAlign:'left',fontSize:9,fontWeight:700,letterSpacing:'1.2px',textTransform:'uppercase',color:sort.key===col.key?C.cyan:C.t3,cursor:col.sortable?'pointer':'default',borderBottom:`1px solid ${C.brd}`,whiteSpace:'nowrap',userSelect:'none',transition:'color 0.2s'}}>
                      {col.key==='select'
                        ? <input type="checkbox" checked={paginated.every(t=>selected.has(t.id))&&paginated.length>0} onChange={handleSelectAll} style={{cursor:'pointer',accentColor:C.cyan,width:14,height:14}}/>
                        : <span style={{display:'flex',alignItems:'center',gap:5}}>{col.label}{col.sortable&&<span style={{opacity:0.45,fontSize:9}}>{sort.key===col.key?sort.dir==='asc'?'↑':'↓':'⇅'}</span>}</span>
                      }
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {paginated.map(trade=>(
                    <TradeRow
                      key={trade.id} trade={trade} isSelected={selected.has(trade.id)}
                      onSelect={id=>{setSelected(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n;});}}
                      onClickDetail={()=>setDetailTrade(trade)}
                      onDoubleClickEdit={handleEdit}
                      cols={visibleCols} cumulativePnl={cumulMap[trade.id]}
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
        <Pagination page={page} total={filtered.length} perPage={perPage}
          onPage={p=>setPage(Math.max(1,Math.min(p,totalPages)))}
          onPerPage={n=>{setPerPage(n);setPage(1);}}
        />
      )}

      {/* ── Modals ── */}
      <AddMethodModal isOpen={modalAdd}    onClose={()=>setModalAdd(false)}    onSelectMethod={handleMethodSelect}/>
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