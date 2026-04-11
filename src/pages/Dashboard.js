import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine, PieChart, Pie,
  RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts';
import { useTradingContext } from '../context/TradingContext';

const DashboardDataCtx = React.createContext(null);
const useDashData = () => React.useContext(DashboardDataCtx) || {};

// --- DESIGN SYSTEM -----------------------------------------------------------
const C = {
  bg:'#030508', bgCard:'#0C1422', bgHigh:'#111B2E',
  cyan:'#06E6FF', teal:'#00F5D4', green:'#00FF88', blue:'#4D7CFF',
  purple:'#B06EFF', pink:'#FF4DC4', gold:'#FFD700', danger:'#FF3D57',
  warn:'#FFB31A', orange:'#FF6B35',
  t0:'#FFFFFF', t1:'#E8EEFF', t2:'#7A90B8', t3:'#334566', t4:'#1A2440',
  brd:'#162034', brdHi:'#1E2E48',
  gradCyan:'linear-gradient(135deg,#06E6FF,#00FF88)',
};

const DASHBOARD_ANIMATIONS = `
  @keyframes mfDashboardFloatA {
    0%,100% { transform: translate3d(0,0,0) scale(1); opacity: 0.32; }
    50% { transform: translate3d(52px,28px,0) scale(1.08); opacity: 0.42; }
  }
  @keyframes mfDashboardFloatB {
    0%,100% { transform: translate3d(0,0,0) scale(1); opacity: 0.18; }
    50% { transform: translate3d(-46px,-26px,0) scale(1.05); opacity: 0.28; }
  }
  @keyframes mfDashboardScan {
    0% { transform: translateX(-120%); opacity: 0; }
    12% { opacity: 1; }
    68% { opacity: 1; }
    100% { transform: translateX(120%); opacity: 0; }
  }
`;

// --- PRIMITIVES ---------------------------------------------------------------
const Card = ({ children, style={}, glow=null, hover=false, custom=0, onClick }) => (
  <motion.div
    variants={{hidden:{opacity:0,y:16},visible:(i)=>({opacity:1,y:0,transition:{delay:i*0.05,duration:0.5,ease:[0.16,1,0.3,1]}})}}
    initial="hidden" animate="visible" custom={custom}
    whileHover={hover?{y:-2,boxShadow:`0 8px 50px ${glow||C.cyan}15`}:{}}
    onClick={onClick}
    style={{
      background:'linear-gradient(152deg,rgba(12,20,34,0.96),rgba(7,12,24,0.98))',
      borderRadius:20, border:`1px solid ${glow?glow+'26':C.brd}`,
      boxShadow:'0 18px 48px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.05)',
      backdropFilter:'blur(18px)',
      position:'relative', overflow:'hidden', cursor:onClick?'pointer':'default',
      ...style
    }}
  >
    {glow && <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${glow}65,transparent)`,pointerEvents:'none'}}/>}
    <div style={{position:'absolute',inset:0,background:'linear-gradient(135deg,rgba(255,255,255,0.05),transparent 22%,transparent 70%,rgba(255,255,255,0.02))',pointerEvents:'none'}}/>
    <div style={{position:'relative',zIndex:1,height:'100%'}}>{children}</div>
  </motion.div>
);

const SectionTitle = ({ children, color=C.cyan }) => (
  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
    <div style={{width:3,height:14,background:color,borderRadius:999,flexShrink:0,boxShadow:`0 0 12px ${color}66`}}/>
    <span style={{fontSize:12,fontWeight:900,color:C.t1,letterSpacing:'0.01em'}}>{children}</span>
  </div>
);

const Badge = ({ children, color }) => (
  <span style={{fontSize:8.5,fontWeight:800,padding:'2px 7px',borderRadius:4,color,background:`${color}18`,border:`1px solid ${color}30`,textTransform:'uppercase',letterSpacing:'0.5px',whiteSpace:'nowrap'}}>{children}</span>
);

const Delta = ({ value, suffix='%', invert=false }) => {
  const pos = invert ? value <= 0 : value >= 0;
  return (
    <span style={{fontSize:9,fontWeight:700,padding:'1px 6px',borderRadius:4,color:pos?C.green:C.danger,background:pos?`${C.green}15`:`${C.danger}15`,border:`1px solid ${pos?C.green:C.danger}25`}}>
      {pos?'+':'-'} {Math.abs(value)}{suffix}
    </span>
  );
};

const ChartTip = ({ active, payload, label, prefix='$' }) => {
  if (!active||!payload?.length) return null;
  const v = payload[0]?.value;
  return (
    <div style={{background:C.bgHigh,border:`1px solid ${C.brdHi}`,borderRadius:10,padding:'8px 12px',fontSize:11,boxShadow:'0 8px 28px rgba(0,0,0,0.8)'}}>
      <div style={{color:C.t3,fontSize:8.5,marginBottom:3}}>{label}</div>
      <div style={{color:v>=0?C.green:C.danger,fontWeight:900,fontFamily:'monospace'}}>
        {v>=0?'+':''}{prefix}{typeof v==='number'?v.toLocaleString():v}
      </div>
    </div>
  );
};

const Empty = ({ label }) => (
  <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'28px 0',gap:8}}>
    <div style={{width:54,height:54,borderRadius:18,border:`1px solid ${C.cyan}26`,background:'linear-gradient(135deg,rgba(6,230,255,0.12),rgba(0,255,136,0.05))'}}/>
    <span style={{fontSize:10,color:C.t3}}>{label||'No trades recorded'}</span>
  </div>
);

function getLiveSnapshot(stats, trades) {
  const recent = stats?.recentTrades?.[0];
  if (recent) {
    return {
      label: 'Desk Feed',
      pair: recent.pair || 'Unknown',
      dir: recent.dir || 'Long',
      pnl: recent.pnl || 0,
      rr: typeof recent.rr === 'number' ? recent.rr : null,
      session: recent.session || 'Session not tagged',
      meta: recent.date || 'Latest execution',
    };
  }

  const raw = trades?.[0];
  if (!raw) return null;

  const pnl = Number(raw.profit_loss ?? raw.pnl ?? 0) || 0;
  return {
    label: 'Latest Execution',
    pair: raw.symbol || raw.pair || 'Unknown',
    dir: raw.direction || raw.type || raw.dir || 'Long',
    pnl,
    rr: typeof raw.metrics?.rrReel === 'number' ? raw.metrics.rrReel : null,
    session: raw.session || 'Session not tagged',
    meta: raw.open_date?.split('T')[0] || raw.date || 'Journal synced',
  };
}

function buildJournalInsight(stats, trades) {
  if (!trades?.length) {
    return {
      strength: 'The dashboard is ready, but the journal still needs a live sample.',
      improve: 'Import your first trades and keep the psychology fields clean from the start.',
      tags: [
        { label: 'Data baseline', ok: false },
        { label: 'Setup naming', ok: false },
        { label: 'Process logging', ok: false },
      ],
    };
  }

  if ((stats?.streakLoss || 0) >= 3) {
    return {
      strength: 'You have enough data to detect the pressure points before they become expensive.',
      improve: 'Pause aggressive sizing and trade only the clearest A setups until the streak resets.',
      tags: [
        { label: 'Risk cut', ok: true },
        { label: 'Patience', ok: false },
        { label: 'Revenge control', ok: false },
      ],
    };
  }

  if ((stats?.profitFactor || 0) >= 1.5 && (stats?.winRate || 0) >= 50) {
    return {
      strength: 'Your edge is showing a healthy balance between win rate and payout.',
      improve: 'Stay boring: same setup labels, same risk, same review rhythm after each session.',
      tags: [
        { label: 'Discipline', ok: true },
        { label: 'Consistency', ok: true },
        { label: 'Overtrading', ok: false },
      ],
    };
  }

  return {
    strength: 'The journal is giving enough signal to guide the next decision with clarity.',
    improve: 'Focus on trade quality, cleaner notes and tighter confirmation before entry.',
    tags: [
      { label: 'Execution', ok: true },
      { label: 'Review depth', ok: false },
      { label: 'Selectivity', ok: false },
    ],
  };
}

function getRankBenchmarks(score, tradeCount = 0) {
  const countryTotal = 1247;
  const worldTotal = 68420;
  const maturity = Math.min(1, tradeCount / 120);
  const countryRatio = Math.max(0.02, Math.min(0.94, 0.9 - (score / 100) * 0.68 - maturity * 0.08));
  const worldRatio = Math.max(0.015, Math.min(0.97, 0.94 - (score / 100) * 0.74 - maturity * 0.05));

  return {
    countryTotal,
    worldTotal,
    countryRank: Math.max(1, Math.min(countryTotal, Math.round(countryTotal * countryRatio))),
    worldRank: Math.max(1, Math.min(worldTotal, Math.round(worldTotal * worldRatio))),
  };
}

function money(value = 0, signed = false) {
  const amount = Number(value) || 0;
  const abs = Math.abs(amount).toLocaleString();

  if (signed) {
    if (amount > 0) return `+$${abs}`;
    if (amount < 0) return `-$${abs}`;
  }

  return `$${abs}`;
}

// --- KPI STRIP ----------------------------------------------------------------
const KpiStrip = () => {
  const { stats } = useDashData();
  const items = [
    { label:'P&L Total',     value: stats.pnl >= 0 ? `+$${stats.pnl.toLocaleString()}` : `-$${Math.abs(stats.pnl).toLocaleString()}`, delta: stats.pnlPct, sub:`$${stats.expectancy}/trade`,   color:C.green,  icon:'??' },
    { label:'Win Rate',      value:`${stats.winRate}%`,  delta: null, sub:`${stats.wins}W / ${stats.losses}L / ${stats.breakevens}BE`, color:C.cyan,   icon:'??' },
    { label:'Profit Factor', value: stats.profitFactor || '—', delta: null, sub:`Avg W $${stats.avgWin}`, color:C.teal, icon:'??' },
    { label:'Max Drawdown',  value:`${Math.abs(stats.maxDrawdown)}%`, delta: stats.maxDrawdown !== 0 ? stats.maxDrawdown : null, sub:'Since the beginning', color:C.danger, icon:'??', invert:true },
    { label:'Expectancy',    value:`$${stats.expectancy}`, delta: null, sub:'Per trade',                  color:C.gold,   icon:'??' },
  ];
  return (
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10,marginBottom:18}}>
      {items.map((k,i) => (
        <Card key={k.label} custom={i} glow={k.color} hover style={{padding:'16px 16px',minHeight:92}}>
          <div style={{position:'absolute',top:-20,right:-12,width:60,height:60,borderRadius:'50%',background:`radial-gradient(circle,${k.color}20,transparent 70%)`,filter:'blur(10px)',pointerEvents:'none'}}/>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
            <span style={{fontSize:7.5,fontWeight:800,color:C.t3,letterSpacing:'1.2px',textTransform:'uppercase',lineHeight:1.4}}>{k.label}</span>
            <span style={{width:28,height:2,borderRadius:999,background:k.color,boxShadow:`0 0 12px ${k.color}55`}}/>
          </div>
          <div style={{fontSize:20,fontWeight:900,fontFamily:'monospace',color:k.color,lineHeight:1,marginBottom:5,textShadow:`0 0 18px ${k.color}30`}}>
            {k.value}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:5,flexWrap:'wrap'}}>
            <span style={{fontSize:8,color:C.t2}}>{k.sub}</span>
            {k.delta !== null && k.delta !== undefined && <Delta value={k.delta} invert={k.invert}/>}
          </div>
          <motion.div animate={{opacity:[0.3,0.7,0.3]}} transition={{duration:2.5,repeat:Infinity,delay:i*0.2}}
            style={{position:'absolute',bottom:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${k.color}50,transparent)`}}/>
        </Card>
      ))}
    </div>
  );
};

// --- EQUITY CHART -------------------------------------------------------------
const EquityPanel = () => {
  const { stats } = useDashData();
  const data = stats.equityData || [];
  const [range, setRange] = useState('All');
  const pnl = stats.pnl || 0;
  const pnlPct = stats.pnlPct || 0;
  return (
    <Card custom={7} glow={C.green} hover={false} style={{padding:'22px 22px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
        <div>
          <SectionTitle color={C.green} icon="??">Equity Curve</SectionTitle>
          <div style={{display:'flex',alignItems:'baseline',gap:10,marginTop:-6,marginBottom:12}}>
            <span style={{fontSize:30,fontWeight:900,fontFamily:'monospace',color:pnl>=0?C.green:C.danger,textShadow:`0 0 24px ${pnl>=0?C.green:C.danger}40`}}>
              {pnl>=0?'+':''}{pnl>=0?'$'+pnl.toLocaleString():'-$'+Math.abs(pnl).toLocaleString()}
            </span>
            {pnlPct !== 0 && <Delta value={pnlPct} suffix="%"/>}
            <span style={{fontSize:9,color:C.t3}}>since the beginning</span>
          </div>
        </div>
        <div style={{display:'flex',gap:3}}>
          {['1M','3M','6M','1Y','All'].map(r => (
            <button key={r} onClick={()=>setRange(r)} style={{padding:'5px 10px',borderRadius:6,border:`1px solid ${range===r?C.green:C.brd}`,background:range===r?`${C.green}18`:'transparent',color:range===r?C.green:C.t3,fontSize:9,fontWeight:700,cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s'}}>
              {r}
            </button>
          ))}
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
        {[
          {l:'Max DD',  v:`${Math.abs(stats.maxDrawdown)}%`, c:C.danger},
          {l:'Best',v:`+$${stats.bestTrade?.toLocaleString()||0}`,c:C.green},
          {l:'Worst',    v:`-$${Math.abs(stats.worstTrade||0).toLocaleString()}`,c:C.danger},
          {l:'Trades',  v:`${stats.wins||0}W/${stats.losses||0}L`,c:C.cyan},
        ].map(x=>(
          <div key={x.l} style={{padding:'8px 12px',borderRadius:10,background:'rgba(255,255,255,0.03)',border:`1px solid ${C.brd}`,textAlign:'center'}}>
            <div style={{fontSize:7.5,color:C.t3,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:3}}>{x.l}</div>
            <div style={{fontSize:13,fontWeight:900,fontFamily:'monospace',color:x.c}}>{x.v}</div>
          </div>
        ))}
      </div>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{top:4,right:4,bottom:0,left:0}}>
            <defs>
              <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.green} stopOpacity={0.35}/>
                <stop offset="100%" stopColor={C.green} stopOpacity={0.01}/>
              </linearGradient>
              <linearGradient id="el" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={C.cyan}/><stop offset="60%" stopColor={C.green}/><stop offset="100%" stopColor={C.teal}/>
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="4 4" vertical={false}/>
            <XAxis dataKey="d" tick={{fill:C.t3,fontSize:7.5}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fill:C.t3,fontSize:7}} axisLine={false} tickLine={false} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} width={36}/>
            <Tooltip content={<ChartTip/>}/>
            <Area type="monotone" dataKey="v" stroke="url(#el)" strokeWidth={2.5} fill="url(#eg)" dot={false} activeDot={{r:5,fill:C.green,stroke:'#fff',strokeWidth:2}}/>
          </AreaChart>
        </ResponsiveContainer>
      ) : <Empty label="Add trades to see the equity curve"/>}
    </Card>
  );
};

// --- DAILY P&L ----------------------------------------------------------------
const DailyPnl = () => {
  const { stats } = useDashData();
  const data = stats.dailyPnl || [];
  const bestDay = data.length ? data.reduce((a,b) => b.v > a.v ? b : a, data[0]) : null;
  return (
    <Card custom={8} glow={C.cyan} hover={false} style={{padding:'20px 20px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <SectionTitle color={C.cyan} icon="??">Daily Performance</SectionTitle>
        {bestDay && (
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <Badge color={bestDay.v>=0?C.green:C.danger}>{bestDay.d} {bestDay.v>=0?'+':''}{bestDay.v}$</Badge>
          </div>
        )}
      </div>
      {data.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={data} margin={{top:4,right:4,bottom:0,left:0}}>
              <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="4 4" vertical={false}/>
              <XAxis dataKey="d" tick={{fill:C.t3,fontSize:8}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:C.t3,fontSize:7}} axisLine={false} tickLine={false} tickFormatter={v=>`$${v}`} width={36}/>
              <Tooltip content={<ChartTip prefix="$"/>}/>
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.12)"/>
              <Bar dataKey="v" radius={[4,4,0,0]} maxBarSize={36}>
                {data.map((d,i)=><Cell key={i} fill={d.v>0?C.green:d.v<0?C.danger:C.warn} opacity={0.85}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{display:'grid',gridTemplateColumns:`repeat(${data.length},1fr)`,gap:4,marginTop:10}}>
            {data.map((d,i)=>(
              <div key={i} style={{textAlign:'center',padding:'5px 0',borderRadius:7,background:'rgba(255,255,255,0.025)'}}>
                <div style={{fontSize:7.5,color:C.t3,marginBottom:2}}>{d.d}</div>
                <div style={{fontSize:9,fontWeight:900,fontFamily:'monospace',color:d.v>0?C.green:d.v<0?C.danger:C.t3}}>
                  {d.v>0?'+':''}${Math.abs(d.v)}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : <Empty label="No trades this week"/>}
    </Card>
  );
};

// --- PERFORMANCE SCORE --------------------------------------------------------
const PerformanceScore = () => {
  const { stats } = useDashData();
  const radar = stats.radarData || [];
  const score = calcRegularityScore_from_stats(stats);
  const bars = [
    {l:'Win Rate',  v:Math.min(100,Math.round(stats.winRate||0)),   c:C.green},
    {l:'Profit F.', v:Math.min(100,Math.round((stats.profitFactor||0)*25)), c:C.cyan},
    {l:'Trades',    v:Math.min(100,Math.round((stats.totalTrades||0)*3)),   c:C.purple},
    {l:'Consistency', v:Math.min(100,Math.round(stats.winRate||0)),            c:C.teal},
    {l:'Discipline',v:Math.min(100,100-Math.round((stats.streakLoss||0)*10)),c:C.warn},
    {l:'Activity',  v:Math.min(100,Math.round((stats.totalTrades||0)*5)),   c:C.blue},
  ];
  return (
    <Card custom={9} glow={C.purple} hover={false} style={{padding:'20px 20px'}}>
      <SectionTitle color={C.purple} icon="?">Performance Score</SectionTitle>
      <div style={{display:'flex',alignItems:'center',gap:18}}>
        <div style={{position:'relative',flexShrink:0,width:76,height:76}}>
          <svg width="76" height="76" viewBox="0 0 76 76">
            <circle cx="38" cy="38" r="32" fill="none" stroke="rgba(176,110,255,0.12)" strokeWidth="6"/>
            <circle cx="38" cy="38" r="32" fill="none" stroke="url(#sg)" strokeWidth="6"
              strokeDasharray={`${2*Math.PI*32*(score/100)} ${2*Math.PI*32*(1-score/100)}`}
              strokeLinecap="round" transform="rotate(-90 38 38)"/>
            <defs><linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="0%"><stop stopColor={C.cyan}/><stop offset="1" stopColor={C.purple}/></linearGradient></defs>
          </svg>
          <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
            <span style={{fontSize:21,fontWeight:900,color:C.t0,lineHeight:1}}>{score}</span>
            <span style={{fontSize:7,color:C.t3,fontWeight:700,letterSpacing:'0.5px'}}>SCORE</span>
          </div>
        </div>
        <div style={{flex:1,display:'flex',flexDirection:'column',gap:6}}>
          {bars.map(x=>(
            <div key={x.l} style={{display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:8,color:C.t3,width:58,flexShrink:0}}>{x.l}</span>
              <div style={{flex:1,height:4,borderRadius:2,background:'rgba(255,255,255,0.05)',overflow:'hidden'}}>
                <motion.div initial={{width:0}} animate={{width:`${x.v}%`}} transition={{duration:1,delay:0.3}}
                  style={{height:'100%',background:`linear-gradient(90deg,${x.c}66,${x.c})`,borderRadius:2}}/>
              </div>
              <span style={{fontSize:8,fontWeight:800,color:x.c,width:24,textAlign:'right',fontFamily:'monospace'}}>{x.v}</span>
            </div>
          ))}
        </div>
      </div>
      {radar.length > 0 && (
        <div style={{marginTop:14}}>
          <ResponsiveContainer width="100%" height={150}>
            <RadarChart data={radar} cx="50%" cy="50%" outerRadius="58%">
              <PolarGrid stroke="rgba(255,255,255,0.07)" gridType="polygon"/>
              <PolarAngleAxis dataKey="m" tick={{fill:C.t3,fontSize:7.5}}/>
              <Radar dataKey="v" stroke={C.purple} strokeWidth={1.5} fill={C.purple} fillOpacity={0.18}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};

// --- BIAIS --------------------------------------------------------------------
const BiaisPanel = () => {
  const { stats } = useDashData();
  const data = stats.biaisData || [];
  const dominant = data.length ? data.reduce((a,b)=>b.value>a.value?b:a, data[0]) : null;
  return (
    <Card custom={10} glow={C.teal} hover={false} style={{padding:'20px 20px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
        <SectionTitle color={C.teal} icon="??">Bias Analysis</SectionTitle>
        <Badge color={C.cyan}>{stats.totalTrades||0} trades</Badge>
      </div>
      {data.length > 0 ? (
        <>
          <div style={{display:'flex',gap:18,alignItems:'center',marginBottom:14}}>
            <div style={{position:'relative',flexShrink:0}}>
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie data={data} cx="50%" cy="50%" innerRadius={34} outerRadius={54}
                    dataKey="value" startAngle={90} endAngle={-270} stroke="none" paddingAngle={2}>
                    {data.map((d,i)=><Cell key={i} fill={d.color}/>)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {dominant && (
                <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
                  <span style={{fontSize:9,fontWeight:900,color:dominant.color}}>{dominant.name}</span>
                  <span style={{fontSize:7.5,color:C.t3}}>{dominant.value}%</span>
                </div>
              )}
            </div>
            <div style={{flex:1,display:'flex',flexDirection:'column',gap:7}}>
              {data.map((d,i)=>(
                <div key={i}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <div style={{width:8,height:8,borderRadius:2,background:d.color}}/>
                      <span style={{fontSize:10,fontWeight:700,color:C.t1}}>{d.name}</span>
                    </div>
                    <div style={{display:'flex',gap:10}}>
                      <span style={{fontSize:9.5,fontWeight:800,color:d.color,fontFamily:'monospace'}}>{d.value}%</span>
                      <span style={{fontSize:9.5,color:d.pnl?.startsWith('+')?C.green:C.danger,fontFamily:'monospace'}}>{d.pnl}</span>
                    </div>
                  </div>
                  <div style={{height:3.5,borderRadius:2,background:'rgba(255,255,255,0.05)',overflow:'hidden'}}>
                    <motion.div initial={{width:0}} animate={{width:`${d.value}%`}} transition={{duration:0.9,delay:i*0.15}}
                      style={{height:'100%',background:d.color,borderRadius:2}}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,padding:'12px',borderRadius:12,background:'rgba(255,255,255,0.025)',border:`1px solid ${C.brd}`}}>
            {[
              {l:'P&L Bull.',v:data.find(d=>d.name==='Bullish')?.pnl||'$0',c:C.green},
              {l:'P&L Bear.',v:data.find(d=>d.name==='Bearish')?.pnl||'$0',c:C.danger},
              {l:'Dominant', v:dominant?`${dominant.name}`:'-',c:dominant?.color||C.t3},
            ].map((x,i)=>(
              <div key={i} style={{textAlign:'center'}}>
                <div style={{fontSize:7.5,color:C.t3,marginBottom:3}}>{x.l}</div>
                <div style={{fontSize:12,fontWeight:900,color:x.c,fontFamily:'monospace'}}>{x.v}</div>
              </div>
            ))}
          </div>
        </>
      ) : <Empty label="No trades to analyze biases"/>}
    </Card>
  );
};

// --- RENTABILITE GAUGE --------------------------------------------------------
const RentabiliteGauge = () => {
  const { stats } = useDashData();
  const pct = stats.winRate || 0;
  const angle = (pct / 100) * 180 - 90;
  const color = pct >= 60 ? C.green : pct >= 45 ? C.warn : C.danger;
  return (
    <Card custom={11} glow={C.orange} hover={false} style={{padding:'20px 20px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
        <SectionTitle color={C.orange} icon="??">Profitability</SectionTitle>
        <Badge color={C.cyan}>{stats.totalTrades||0} trades</Badge>
      </div>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',paddingTop:6}}>
        <svg width="210" height="118" viewBox="0 0 210 118">
          <defs>
            <linearGradient id="gg" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={C.danger}/><stop offset="40%" stopColor={C.warn}/>
              <stop offset="70%" stopColor={C.teal}/><stop offset="100%" stopColor={C.green}/>
            </linearGradient>
          </defs>
          <path d="M 20 100 A 80 80 0 0 1 190 100" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="14" strokeLinecap="round"/>
          <path d="M 20 100 A 80 80 0 0 1 190 100" fill="none" stroke="url(#gg)" strokeWidth="14" strokeLinecap="round"
            strokeDasharray={`${pct/100*251} 251`}/>
          <g transform={`rotate(${angle},105,100)`}>
            <line x1="105" y1="100" x2="105" y2="30" stroke={C.t0} strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="105" cy="100" r="5" fill={C.t0}/>
          </g>
          <text x="16" y="115" fontSize="8" fill={C.t3} textAnchor="middle">0%</text>
          <text x="105" y="28" fontSize="8" fill={C.t3} textAnchor="middle">50%</text>
          <text x="194" y="115" fontSize="8" fill={C.t3} textAnchor="middle">100%</text>
        </svg>
        <div style={{marginTop:-10,textAlign:'center'}}>
          <div style={{fontSize:34,fontWeight:900,fontFamily:'monospace',color,lineHeight:1,textShadow:`0 0 28px ${color}50`}}>{pct}%</div>
          <div style={{fontSize:9.5,color:C.t3,letterSpacing:'2px',textTransform:'uppercase',marginTop:4}}>Win Rate</div>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginTop:14}}>
        {[
          {l:'Total',   v:stats.totalTrades||0},
          {l:'Wins',    v:stats.wins||0,    c:C.green},
          {l:'Losses',  v:stats.losses||0,  c:C.danger},
        ].map((x,i)=>(
          <div key={i} style={{textAlign:'center',padding:'6px 0',borderRadius:10,background:'rgba(255,255,255,0.03)',border:`1px solid ${C.brd}`}}>
            <div style={{fontSize:7.5,color:C.t3,marginBottom:2,textTransform:'uppercase',letterSpacing:'0.5px'}}>{x.l}</div>
            <div style={{fontSize:14,fontWeight:900,color:x.c||C.t1,fontFamily:'monospace'}}>{x.v}</div>
          </div>
        ))}
      </div>
    </Card>
  );
};

// --- RECENT TRADES ------------------------------------------------------------
const RecentTrades = () => {
  const { stats } = useDashData();
  const trades = stats.recentTrades || [];
  const [filter, setFilter] = useState('All');
  const filtered = filter === 'All' ? trades : trades.filter(t => t.res === filter);
  const weekPnl = trades.reduce((a,t)=>a+(t.pnl||0),0);
  const weekWr  = trades.length ? Math.round(trades.filter(t=>t.pnl>0).length/trades.length*100) : 0;
  return (
    <Card custom={12} glow={C.blue} hover={false} style={{padding:'20px 20px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <SectionTitle color={C.blue} icon="??">Recent Trades</SectionTitle>
        <div style={{display:'flex',gap:4,alignItems:'center'}}>
          <div style={{display:'flex',gap:3}}>
            {['All','TP','SL','BE'].map(f=>(
              <button key={f} onClick={()=>setFilter(f)} style={{padding:'4px 9px',borderRadius:5,border:`1px solid ${filter===f?C.blue:C.brd}`,background:filter===f?`${C.blue}20`:'transparent',color:filter===f?C.blue:C.t3,fontSize:9,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>
      {trades.length > 0 && (
        <div style={{display:'flex',gap:10,marginBottom:14}}>
          <div style={{padding:'5px 12px',borderRadius:8,background:`${weekPnl>=0?C.green:C.danger}12`,border:`1px solid ${weekPnl>=0?C.green:C.danger}25`,display:'flex',gap:8,alignItems:'center'}}>
            <span style={{fontSize:8.5,color:C.t3}}>Recent P&L</span>
            <span style={{fontSize:11,fontWeight:900,color:weekPnl>=0?C.green:C.danger,fontFamily:'monospace'}}>{weekPnl>=0?'+':''}{weekPnl>=0?'$'+weekPnl.toLocaleString():'-$'+Math.abs(weekPnl).toLocaleString()}</span>
          </div>
          <div style={{padding:'5px 12px',borderRadius:8,background:`${C.cyan}12`,border:`1px solid ${C.cyan}25`,display:'flex',gap:8,alignItems:'center'}}>
            <span style={{fontSize:8.5,color:C.t3}}>Win rate</span>
            <span style={{fontSize:11,fontWeight:900,color:C.cyan,fontFamily:'monospace'}}>{weekWr}%</span>
          </div>
        </div>
      )}
      {filtered.length > 0 ? (
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          {filtered.map((t,i)=>{
            const rc = t.res==='TP'?C.green:t.res==='SL'?C.danger:C.warn;
            return (
              <motion.div key={t.id||i} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:i*0.05}}
                style={{display:'grid',gridTemplateColumns:'36px 1fr 1fr 1fr 1fr 1fr',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:10,background:i%2===0?'rgba(255,255,255,0.018)':'rgba(255,255,255,0.010)',border:'1px solid rgba(255,255,255,0.035)',cursor:'pointer'}}
                whileHover={{background:'rgba(77,124,255,0.06)',borderColor:'rgba(77,124,255,0.18)'}}>
                <div style={{width:36,height:24,borderRadius:6,background:`${rc}15`,border:`1px solid ${rc}28`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <span style={{fontSize:7,fontWeight:900,color:rc}}>{t.pair?.slice(0,3)}</span>
                </div>
                <div>
                  <div style={{fontSize:10.5,fontWeight:800,color:C.t1}}>{t.pair}</div>
                  <div style={{fontSize:8,color:t.dir==='Long'?C.green:C.danger,fontWeight:700}}>{t.dir}</div>
                </div>
                <div style={{textAlign:'center'}}>
                  <div style={{display:'inline-block',padding:'2px 7px',borderRadius:5,background:`${rc}18`,border:`1px solid ${rc}30`,fontSize:8.5,fontWeight:800,color:rc}}>{t.res}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:10,fontWeight:900,fontFamily:'monospace',color:t.rr>=0?C.green:C.danger}}>{t.rr>=0?'+':''}{t.rr}R</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:10,fontWeight:900,fontFamily:'monospace',color:t.pnl>=0?C.green:C.danger}}>{t.pnl>=0?'+':''}{t.pnl}$</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:8,color:C.purple}}>{t.session}</div>
                  <div style={{fontSize:7.5,color:C.t3}}>{t.date?.slice(5)}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : <Empty label={filter==='All'?"No trades recorded":`No ${filter} trades`}/>}
    </Card>
  );
};

// --- SESSIONS -----------------------------------------------------------------
const SessionPanel = () => {
  const { stats } = useDashData();
  const data = stats.sessionData || [];
  if (!data.length) return (
    <Card custom={13} glow={C.purple} hover={false} style={{padding:'20px 20px'}}>
      <SectionTitle color={C.purple} icon="??">Sessions</SectionTitle>
      <Empty/>
    </Card>
  );
  const maxPnl = Math.max(...data.map(x=>x.pnl),1);
  return (
    <Card custom={13} glow={C.purple} hover={false} style={{padding:'20px 20px'}}>
      <SectionTitle color={C.purple} icon="??">Sessions</SectionTitle>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {data.map((s,i)=>{
          const total = s.tp+s.sl+s.be;
          const wr = total ? Math.round(s.tp/total*100) : 0;
          const pct = s.pnl/maxPnl*100;
          return (
            <div key={i} style={{padding:'10px 12px',borderRadius:12,background:'rgba(255,255,255,0.025)',border:`1px solid ${C.brd}`,position:'relative',overflow:'hidden'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                <span style={{fontSize:10.5,fontWeight:800,color:C.t1}}>{s.s}</span>
                <div style={{display:'flex',gap:10,alignItems:'center'}}>
                  <span style={{fontSize:9,fontWeight:800,fontFamily:'monospace',color:s.pnl>=0?C.green:C.danger}}>{s.pnl>=0?'+':'-'}${Math.abs(Math.round(s.pnl)).toLocaleString()}</span>
                  <span style={{fontSize:8.5,fontWeight:800,color:wr>=65?C.green:wr>=50?C.warn:C.danger,fontFamily:'monospace'}}>{wr}%</span>
                  <span style={{fontSize:8,color:C.t3}}>{s.tp}W·{s.sl}L·{s.be}BE</span>
                </div>
              </div>
              <div style={{height:3.5,borderRadius:2,background:'rgba(255,255,255,0.05)',overflow:'hidden'}}>
                <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:0.8,delay:0.2+i*0.1}}
                  style={{height:'100%',background:`linear-gradient(90deg,${C.purple}88,${C.purple})`,borderRadius:2}}/>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

// --- PAIRS --------------------------------------------------------------------
const PairPanel = () => {
  const { stats } = useDashData();
  const data = stats.pairData || [];
  return (
    <Card custom={14} glow={C.gold} hover={false} style={{padding:'20px 20px'}}>
      <SectionTitle color={C.gold} icon="??">By Pair</SectionTitle>
      {data.length > 0 ? (
        <div style={{display:'flex',flexDirection:'column',gap:5}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 36px 46px 64px',gap:10,padding:'0 10px 8px',borderBottom:`1px solid ${C.brd}`}}>
            {['Pair','#','WR','P&L'].map(h=><span key={h} style={{fontSize:7.5,fontWeight:800,color:C.t3,textTransform:'uppercase',letterSpacing:'0.5px',textAlign:'right'}}>{h}</span>)}
          </div>
          {data.map((p,i)=>(
            <motion.div key={i} initial={{opacity:0,x:8}} animate={{opacity:1,x:0}} transition={{delay:0.1+i*0.06}}
              style={{display:'grid',gridTemplateColumns:'1fr 36px 46px 64px',gap:10,padding:'8px 10px',borderRadius:10,background:'rgba(255,255,255,0.02)',alignItems:'center',cursor:'pointer'}}
              whileHover={{background:'rgba(255,215,0,0.05)'}}>
              <div style={{display:'flex',alignItems:'center',gap:7}}>
                <div style={{width:7,height:7,borderRadius:'50%',background:p.col,boxShadow:`0 0 5px ${p.col}`,flexShrink:0}}/>
                <span style={{fontSize:11,fontWeight:800,color:C.t1}}>{p.p}</span>
              </div>
              <span style={{fontSize:9.5,color:C.t2,fontFamily:'monospace',textAlign:'right'}}>{p.n}</span>
              <span style={{fontSize:9.5,fontWeight:800,fontFamily:'monospace',color:p.wr>=65?C.green:p.wr>=50?C.warn:C.danger,textAlign:'right'}}>{p.wr}%</span>
              <span style={{fontSize:10.5,fontWeight:900,fontFamily:'monospace',color:p.pnl>=0?C.green:C.danger,textAlign:'right'}}>
                {p.pnl>=0?'+':''}{p.pnl>=0?'$'+Math.round(p.pnl).toLocaleString():'-$'+Math.abs(Math.round(p.pnl)).toLocaleString()}
              </span>
            </motion.div>
          ))}
        </div>
      ) : <Empty/>}
    </Card>
  );
};

// --- HEATMAP ------------------------------------------------------------------
const TimeHeatmap = () => {
  const { stats } = useDashData();
  const data  = stats.heatmap || [];
  const HOURS = ['8h','10h','12h','14h','16h'];
  const maxV  = Math.max(...data.flatMap(w=>Object.values(w.h).map(Math.abs)),1);
  return (
    <Card custom={15} glow={C.teal} hover={false} style={{padding:'20px 20px'}}>
      <SectionTitle color={C.teal} icon="???">Hour × Day Heatmap</SectionTitle>
      {data.length > 0 ? (
        <div style={{overflowX:'auto'}}>
          <table style={{borderCollapse:'separate',borderSpacing:4,minWidth:'100%'}}>
            <thead>
              <tr>
                <th style={{width:48}}/>
                {HOURS.map(h=><th key={h} style={{fontSize:8,fontWeight:700,color:C.t3,textAlign:'center',padding:'0 2px 6px'}}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.map((row,ri)=>(
                <tr key={ri}>
                  <td style={{fontSize:9,fontWeight:700,color:C.t2,paddingRight:8,textAlign:'right'}}>{row.day}</td>
                  {HOURS.map(h=>{
                    const v = row.h[h]||0;
                    const intensity = Math.min(0.8,Math.abs(v)/maxV*0.8);
                    const bg = v>0?`rgba(0,255,136,${intensity*0.65})`:v<0?`rgba(255,61,87,${intensity*0.55})`:'rgba(255,255,255,0.03)';
                    const tc = v>0?C.green:v<0?C.danger:C.t4;
                    return (
                      <td key={h} style={{padding:3}}>
                        <motion.div whileHover={{scale:1.15}} style={{width:42,height:38,borderRadius:8,background:bg,border:`1px solid ${v!==0?'rgba(255,255,255,0.07)':C.brd}`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
                          {v!==0 ? (
                            <>
                              <div style={{fontSize:9,fontWeight:900,fontFamily:'monospace',color:tc,lineHeight:1}}>{v>0?'+':''}${Math.abs(Math.round(v))}</div>
                            </>
                          ) : <div style={{width:5,height:1,background:'rgba(255,255,255,0.06)'}}/>}
                        </motion.div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <Empty label="No hourly data"/>}
    </Card>
  );
};

// --- LIVE TICKER -------------------------------------------------------------
const LiveTicker = () => {
  const { stats, trades } = useDashData();
  const [visible, setVisible] = useState(true);
  const snapshot = getLiveSnapshot(stats, trades);
  const hasRr = typeof snapshot?.rr === 'number' && Number.isFinite(snapshot.rr);
  if (!visible) return null;
  return (
    <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} transition={{duration:0.4}}
      style={{marginBottom:12,padding:'12px 18px',borderRadius:14,background:'linear-gradient(90deg,rgba(0,255,136,0.07),rgba(6,230,255,0.05),rgba(255,255,255,0.02))',border:`1px solid ${C.green}25`,display:'flex',alignItems:'center',justifyContent:'space-between',gap:14,boxShadow:'0 16px 40px rgba(0,0,0,0.18)'}}>
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <motion.div animate={{opacity:[1,0.3,1]}} transition={{duration:1.2,repeat:Infinity}}
          style={{width:8,height:8,borderRadius:'50%',background:C.green,boxShadow:`0 0 8px ${C.green}`,flexShrink:0}}/>
        <span style={{fontSize:10,fontWeight:800,color:C.green,textTransform:'uppercase',letterSpacing:'0.08em'}}>{snapshot?.label || 'Journal Status'}</span>
        <div style={{width:1,height:16,background:C.brd}}/>
        <span style={{fontSize:10,color:C.t2}}>
          {snapshot ? `${snapshot.pair} / ${snapshot.dir} / ${snapshot.meta}` : 'Import trades to unlock the live execution feed'}
        </span>
        <span style={{fontSize:11,fontWeight:900,color:snapshot ? (snapshot.pnl >= 0 ? C.green : C.danger) : C.cyan,fontFamily:'monospace'}}>
          {snapshot ? money(snapshot.pnl, true) : 'Ready'}
        </span>
        {hasRr && <Badge color={C.cyan}>{snapshot.rr >= 0 ? '+' : '-'}{Math.abs(snapshot.rr)}R</Badge>}
      </div>
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        <span style={{fontSize:8.5,color:C.t3}}>{snapshot ? snapshot.session : 'Your modules are active and waiting for real journal data.'}</span>
        <button onClick={()=>setVisible(false)} style={{background:'transparent',border:'none',color:C.t3,cursor:'pointer',fontSize:14,lineHeight:1}}>×</button>
      </div>
    </motion.div>
  );
};

// --- GOALS --------------------------------------------------------------------
const GoalProgress = () => {
  const { stats } = useDashData();
  const goals = [
    {l:'Monthly goal',  cur:stats.pnl||0,        target:10000, c:C.cyan,   prefix:'$'},
    {l:'Target Win Rate',    cur:stats.winRate||0,     target:70,    c:C.green,  suffix:'%'},
    {l:'Trades this month',    cur:stats.totalTrades||0, target:20,    c:C.purple},
    {l:'Max Drawdown',      cur:Math.abs(stats.maxDrawdown||0), target:20, c:C.danger, invert:true, suffix:'%'},
  ];
  return (
    <Card custom={16} glow={C.cyan} hover={false} style={{padding:'20px 20px'}}>
      <SectionTitle color={C.cyan} icon="??">Monthly Goals</SectionTitle>
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        {goals.map((g,i)=>{
          const pct = Math.min(100,(g.cur/g.target)*100);
          const ok = g.invert ? g.cur <= g.target : pct >= 100;
          const c = ok ? C.green : pct >= 70 ? g.c : C.warn;
          const display = g.suffix==='%' ? `${g.cur}%` : g.prefix==='$' ? (g.cur>=0?`+$${g.cur.toLocaleString()}`:`-$${Math.abs(g.cur).toLocaleString()}`) : g.cur;
          const target  = g.suffix==='%' ? `${g.target}%` : `$${g.target.toLocaleString()}`;
          return (
            <div key={i}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                <span style={{fontSize:10,fontWeight:700,color:C.t1}}>{g.l}</span>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <span style={{fontSize:9.5,fontFamily:'monospace',color:c,fontWeight:800}}>{display}</span>
                  <span style={{fontSize:8,color:C.t3}}>/ {target}</span>
                  {ok && <span style={{fontSize:9,color:C.green,fontWeight:800}}>OK</span>}
                </div>
              </div>
              <div style={{height:6,borderRadius:3,background:'rgba(255,255,255,0.05)',overflow:'hidden'}}>
                <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:0.9,delay:0.15+i*0.1}}
                  style={{height:'100%',borderRadius:3,background:`linear-gradient(90deg,${c}66,${c})`}}/>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

// --- JOURNAL NOTE -------------------------------------------------------------
const JournalNote = () => {
  const { stats, trades } = useDashData();
  const note = buildJournalInsight(stats, trades);
  return (
    <Card custom={17} glow={C.warn} hover={false} style={{padding:'20px 20px'}}>
      <SectionTitle color={C.warn} icon="??">Today's Note</SectionTitle>
      <div style={{fontSize:10,color:C.t2,lineHeight:1.75,background:'rgba(255,255,255,0.02)',borderRadius:12,padding:'12px 14px',border:`1px solid ${C.brd}`,marginBottom:12,minHeight:88}}>
        <span style={{color:C.gold,fontWeight:700}}>Strengths :</span> {note.strength}
        <br/><span style={{color:C.danger,fontWeight:700}}>To improve :</span> {note.improve}
      </div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        {note.tags.map((t,i)=>(
          <span key={i} style={{padding:'4px 9px',borderRadius:6,fontSize:8.5,fontWeight:700,background:t.ok?`${C.green}12`:`${C.danger}12`,border:`1px solid ${t.ok?C.green:C.danger}25`,color:t.ok?C.green:C.danger}}>
            {t.label}
          </span>
        ))}
      </div>
    </Card>
  );
};

// --- MARKETFLOW RANK ----------------------------------------------------------
const MF_RANKS = [
  { rank:'Iron',        min:0,   max:19,  color:'#8B7355', icon:'??', desc:'Beginner' },
  { rank:'Bronze',      min:20,  max:39,  color:'#CD7F32', icon:'??', desc:'Progressing' },
  { rank:'Silver',      min:40,  max:59,  color:'#C0C0C0', icon:'??', desc:'Regular' },
  { rank:'Gold',        min:60,  max:74,  color:'#FFD700', icon:'??', desc:'Performing' },
  { rank:'Platinum',    min:75,  max:84,  color:'#00F5D4', icon:'??', desc:'Expert' },
  { rank:'Diamond',     min:85,  max:92,  color:'#06E6FF', icon:'??', desc:'Elite' },
  { rank:'Master',      min:93,  max:97,  color:'#B06EFF', icon:'??', desc:'Master Trader' },
  { rank:'Grandmaster', min:98,  max:100, color:'#FF4DC4', icon:'?', desc:'Legend' },
];

function getRank(score) {
  return MF_RANKS.find(r=>score>=r.min&&score<=r.max)||MF_RANKS[0];
}

function calcRegularityScore_from_stats(stats) {
  if (!stats || !stats.totalTrades) return 0;
  const wrScore  = Math.min(30, (stats.winRate||0) * 0.4);
  const pfScore  = Math.min(15, (stats.profitFactor||0) * 5);
  const actScore = Math.min(10, (stats.totalTrades||0) * 0.5);
  const ddScore  = Math.min(25, 25 - Math.abs(stats.maxDrawdown||0));
  const strScore = Math.min(20, 20 - (stats.streakLoss||0) * 3);
  return Math.max(0, Math.round(wrScore + pfScore + actScore + ddScore + strScore));
}

// --- Rank Modal --------------------------------------------------------------
function RankModal({ score, rank, tradeCount = 0, onClose }) {
  const { countryRank, worldRank, countryTotal, worldTotal } = getRankBenchmarks(score, tradeCount);

  return (
    <motion.div
      initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      style={{position:'fixed',inset:0,background:'rgba(2,4,10,0.85)',backdropFilter:'blur(12px)',zIndex:10000,display:'flex',alignItems:'center',justifyContent:'center'}}
      onClick={onClose}
    >
      <motion.div
        initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.9,opacity:0}}
        onClick={e=>e.stopPropagation()}
        style={{
          width:420, background:'linear-gradient(160deg,#0C1830 0%,#080F1E 50%,#060C18 100%)',
          border:`1px solid ${rank.color}30`, borderRadius:20, overflow:'hidden',
          boxShadow:`0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px ${rank.color}20`,
        }}
      >
        {/* Header glow */}
        <div style={{
          height:3, background:`linear-gradient(90deg,transparent,${rank.color},transparent)`,
          boxShadow:`0 0 20px ${rank.color}60`,
        }}/>
        <div style={{padding:'28px 28px 24px'}}>
          <div style={{textAlign:'center',marginBottom:24}}>
            <div style={{width:56,height:4,borderRadius:999,background:rank.color,boxShadow:`0 0 18px ${rank.color}80`,margin:'0 auto 18px'}}/>
            <div style={{fontSize:22,fontWeight:900,color:rank.color,letterSpacing:'0.04em',textTransform:'uppercase'}}>{rank.rank}</div>
            <div style={{fontSize:11,color:C.t2,marginTop:4}}>{rank.desc}</div>
          </div>

          {/* Score circle */}
          <div style={{display:'flex',justifyContent:'center',marginBottom:24}}>
            <div style={{position:'relative',width:90,height:90}}>
              <svg width="90" height="90" viewBox="0 0 90 90">
                <circle cx="45" cy="45" r="38" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5"/>
                <circle cx="45" cy="45" r="38" fill="none" stroke={rank.color} strokeWidth="5"
                  strokeDasharray={`${2*Math.PI*38*(score/100)} ${2*Math.PI*38*(1-score/100)}`}
                  strokeLinecap="round" transform="rotate(-90 45 45)"/>
              </svg>
              <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
                <span style={{fontSize:24,fontWeight:900,color:C.t0}}>{score}</span>
                <span style={{fontSize:8,color:C.t3,fontWeight:600}}>SCORE</span>
              </div>
            </div>
          </div>

          {/* Rankings */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:20}}>
            <div style={{
              padding:'14px', borderRadius:12, background:'rgba(255,255,255,0.03)',
              border:'1px solid rgba(255,255,255,0.06)', textAlign:'center',
            }}>
              <div style={{fontSize:20,fontWeight:900,color:C.cyan,fontFamily:'monospace'}}>#{countryRank.toLocaleString()}</div>
              <div style={{fontSize:8,color:C.t3,fontWeight:600,marginTop:4,textTransform:'uppercase',letterSpacing:'0.08em'}}>Country Rank</div>
              <div style={{fontSize:9,color:C.t2,marginTop:2}}>out of {countryTotal.toLocaleString()}</div>
              <div style={{marginTop:8,height:4,borderRadius:2,background:'rgba(255,255,255,0.05)',overflow:'hidden'}}>
                <div style={{height:'100%',width:`${(countryRank/countryTotal)*100}%`,background:`linear-gradient(90deg,${C.cyan},${C.green})`,borderRadius:2}}/>
              </div>
            </div>
            <div style={{
              padding:'14px', borderRadius:12, background:'rgba(255,255,255,0.03)',
              border:'1px solid rgba(255,255,255,0.06)', textAlign:'center',
            }}>
              <div style={{fontSize:20,fontWeight:900,color:C.purple,fontFamily:'monospace'}}>#{worldRank.toLocaleString()}</div>
              <div style={{fontSize:8,color:C.t3,fontWeight:600,marginTop:4,textTransform:'uppercase',letterSpacing:'0.08em'}}>World Rank</div>
              <div style={{fontSize:9,color:C.t2,marginTop:2}}>out of {worldTotal.toLocaleString()}</div>
              <div style={{marginTop:8,height:4,borderRadius:2,background:'rgba(255,255,255,0.05)',overflow:'hidden'}}>
                <div style={{height:'100%',width:`${(worldRank/worldTotal)*100}%`,background:`linear-gradient(90deg,${C.purple},${C.cyan})`,borderRadius:2}}/>
              </div>
            </div>
          </div>

          {/* Next rank progress */}
          {MF_RANKS[MF_RANKS.findIndex(r=>r.rank===rank.rank)+1] && (
            <div style={{padding:'12px 14px',borderRadius:10,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.04)'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                <span style={{fontSize:10,color:C.t2}}>Next: {MF_RANKS[MF_RANKS.findIndex(r=>r.rank===rank.rank)+1].rank}</span>
                <span style={{fontSize:10,color:C.t3}}>{Math.max(0,MF_RANKS[MF_RANKS.findIndex(r=>r.rank===rank.rank)+1].min-score)} pts</span>
              </div>
              <div style={{height:5,borderRadius:3,background:'rgba(255,255,255,0.06)',overflow:'hidden'}}>
                <div style={{height:'100%',width:`${((score-rank.min)/(rank.max-rank.min+1))*100}%`,background:`linear-gradient(90deg,${rank.color},${MF_RANKS[MF_RANKS.findIndex(r=>r.rank===rank.rank)+1].color})`,borderRadius:3,transition:'width 1s ease'}}/>
              </div>
            </div>
          )}
        </div>

        {/* Close */}
        <div style={{padding:'0 28px 20px'}}>
          <button onClick={onClose} style={{
            width:'100%',padding:'10px',borderRadius:10,border:`1px solid ${rank.color}30`,
            background:`${rank.color}08`,color:rank.color,fontWeight:700,fontSize:12,
            cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s',
          }}>Close</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// --- TRADING CALENDAR ---------------------------------------------------------
const TradingCalendar = () => {
  const { trades: allTrades, stats } = useDashData();
  const [currentMonth, setCurrentMonth] = useState(()=>new Date());
  const [rankModal, setRankModal] = useState(false);
  const year  = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DAYS   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const firstDay  = new Date(year, month, 1);
  const lastDay   = new Date(year, month+1, 0);
  const startPad  = (firstDay.getDay()+6)%7;
  const totalDays = lastDay.getDate();

  const tradesByDay = {};
  (allTrades||[]).forEach(t=>{
    const d = new Date(t.open_date||t.date||t.entryDate||t.createdAt);
    if (d.getFullYear()===year && d.getMonth()===month) {
      const key = d.getDate();
      if (!tradesByDay[key]) tradesByDay[key]=[];
      tradesByDay[key].push(t);
    }
  });

  const score = calcRegularityScore_from_stats(stats);
  const rank  = getRank(score);
  const nextRank = MF_RANKS[MF_RANKS.findIndex(r=>r.rank===rank.rank)+1];
  const monthTrades = Object.values(tradesByDay).flat();
  const monthPnl    = monthTrades.reduce((a,t)=>a+(t.profit_loss||0),0);
  const tradingDays = Object.keys(tradesByDay).length;

  return (
    <>
      <Card custom={18} glow={rank.color} hover={false} style={{padding:'22px 24px'}}>
        {/* Animated scan line */}
        <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${rank.color}50,transparent)`,pointerEvents:'none'}}/>
        <div style={{position:'absolute',top:'30%',left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${rank.color}10,transparent)`,pointerEvents:'none',animation:'scan 8s linear infinite'}}/>

        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18,flexWrap:'wrap',gap:14}}>
          <SectionTitle color={rank.color} icon="??">Trading Calendar</SectionTitle>
          <motion.div
            style={{display:'flex',alignItems:'center',gap:14,background:'rgba(255,255,255,0.03)',border:`1px solid ${rank.color}30`,borderRadius:14,padding:'10px 16px',cursor:'pointer'}}
            whileHover={{background:`${rank.color}08`,borderColor:`${rank.color}50`}}
            onClick={()=>setRankModal(true)}
          >
            <div style={{textAlign:'center'}}>
              <motion.div animate={{opacity:[0.7,1,0.7]}} transition={{duration:3,repeat:Infinity,repeatDelay:6}} style={{width:34,height:3,borderRadius:999,background:rank.color,boxShadow:`0 0 12px ${rank.color}80`,margin:'0 auto 10px'}}/>
              <div style={{fontSize:9.5,color:rank.color,fontWeight:800,letterSpacing:'0.06em',textTransform:'uppercase',marginTop:3}}>{rank.rank}</div>
            </div>
            <div>
              <div style={{display:'flex',alignItems:'baseline',gap:5}}>
                <span style={{fontSize:30,fontWeight:900,color:rank.color,lineHeight:1}}>{score}</span>
                <span style={{fontSize:13,color:C.t3}}>/100</span>
              </div>
              <div style={{fontSize:10.5,color:C.t2,marginTop:3}}>{rank.desc}</div>
              {nextRank && (
                <div style={{marginTop:8}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                    <span style={{fontSize:9.5,color:C.t3}}>Next {nextRank.rank}</span>
                    <span style={{fontSize:9.5,color:C.t3}}>{Math.max(0,nextRank.min-score)} pts</span>
                  </div>
                  <div style={{width:140,height:5,background:'rgba(255,255,255,0.06)',borderRadius:3,overflow:'hidden'}}>
                    <div style={{width:`${((score-rank.min)/(rank.max-rank.min+1))*100}%`,height:'100%',background:`linear-gradient(90deg,${rank.color},${nextRank.color})`,borderRadius:3,transition:'width 1s ease'}}/>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        <div style={{display:'flex',gap:18,marginBottom:18,flexWrap:'wrap'}}>
          {[
            {l:'Monthly P&L',    v:monthPnl>=0?`+$${Math.round(monthPnl).toLocaleString()}`:`-$${Math.abs(Math.round(monthPnl)).toLocaleString()}`, c:monthPnl>=0?C.green:C.danger},
            {l:'Trading days',   v:tradingDays,         c:C.cyan},
            {l:'Trades this month', v:monthTrades.length,  c:C.purple},
          ].map((s,i)=>(
            <div key={i} style={{background:'rgba(255,255,255,0.03)',borderRadius:10,padding:'10px 16px',border:`1px solid ${C.brd}`}}>
              <div style={{fontSize:9.5,color:C.t3,fontWeight:600,marginBottom:4,textTransform:'uppercase',letterSpacing:'0.05em'}}>{s.l}</div>
              <div style={{fontSize:18,fontWeight:800,color:s.c}}>{s.v}</div>
            </div>
          ))}
        </div>

        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
          <button onClick={()=>setCurrentMonth(new Date(year,month-1,1))} style={{background:'rgba(255,255,255,0.04)',border:`1px solid ${C.brd}`,borderRadius:10,color:C.t2,cursor:'pointer',padding:'6px 14px',fontSize:14}}>‹</button>
          <span style={{fontSize:15,fontWeight:700,color:C.t0}}>{MONTHS[month]} {year}</span>
          <button onClick={()=>setCurrentMonth(new Date(year,month+1,1))} style={{background:'rgba(255,255,255,0.04)',border:`1px solid ${C.brd}`,borderRadius:10,color:C.t2,cursor:'pointer',padding:'6px 14px',fontSize:14}}>›</button>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:5,marginBottom:8}}>
          {DAYS.map(d=><div key={d} style={{textAlign:'center',fontSize:9.5,color:C.t3,fontWeight:700,letterSpacing:'0.05em',textTransform:'uppercase',padding:'5px 0'}}>{d}</div>)}
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:5}}>
          {Array.from({length:startPad}).map((_,i)=><div key={`e${i}`}/>)}
          {Array.from({length:totalDays}).map((_,i)=>{
            const day = i+1;
            const dayTrades = tradesByDay[day]||[];
            const dayPnl = dayTrades.reduce((a,t)=>a+(t.profit_loss||0),0);
            const isToday = new Date().getDate()===day && new Date().getMonth()===month && new Date().getFullYear()===year;
            const hasData = dayTrades.length>0;
            const isWeekend = ((i+startPad)%7)>=5;
            let bg='rgba(255,255,255,0.02)', border=C.brd, pnlColor=C.t3;
            if (hasData) {
              if (dayPnl>0)      {bg=`${C.green}18`;  border=`${C.green}40`;  pnlColor=C.green;}
              else if (dayPnl<0) {bg=`${C.danger}15`; border=`${C.danger}35`; pnlColor=C.danger;}
              else               {bg=`${C.warn}10`;   border=`${C.warn}30`;   pnlColor=C.warn;}
            }
            if (isWeekend&&!hasData) bg='rgba(255,255,255,0.01)';
            return (
              <motion.div key={day} whileHover={hasData?{scale:1.04}:{}} style={{background:bg,border:`1px solid ${isToday?rank.color:border}`,borderRadius:10,padding:'7px 5px',minHeight:58,textAlign:'center',position:'relative',boxShadow:isToday?`0 0 12px ${rank.color}40`:'none',transition:'all 0.15s',cursor:hasData?'pointer':'default'}}>
                <div style={{fontSize:10.5,fontWeight:isToday?800:500,color:isToday?rank.color:isWeekend?C.t4:C.t2,marginBottom:4}}>{day}</div>
                {hasData&&(
                  <>
                    <div style={{fontSize:9.5,fontWeight:700,color:pnlColor}}>
                      {dayPnl>=0?'+':''}{Math.abs(dayPnl)>=1000?`${(dayPnl/1000).toFixed(1)}k`:Math.round(dayPnl)}$
                    </div>
                    <div style={{fontSize:8.5,color:C.t3,marginTop:2}}>{dayTrades.length}T</div>
                    <div style={{display:'flex',justifyContent:'center',gap:2.5,marginTop:4}}>
                      {dayTrades.slice(0,3).map((_,di)=>(
                        <div key={di} style={{width:4.5,height:4.5,borderRadius:'50%',background:dayPnl>0?C.green:C.danger,opacity:0.8}}/>
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            );
          })}
        </div>

        <div style={{display:'flex',gap:18,marginTop:16,flexWrap:'wrap'}}>
          {[{c:C.green,'l':'Profitable day'},{c:C.danger,l:'Losing day'},{c:C.warn,l:'Breakeven'},{c:C.t4,l:'No trades'}].map(({c,l})=>(
            <div key={l} style={{display:'flex',alignItems:'center',gap:6}}>
              <div style={{width:12,height:12,borderRadius:4,background:`${c}30`,border:`1px solid ${c}60`}}/>
              <span style={{fontSize:9.5,color:C.t3}}>{l}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Rank Modal */}
      <AnimatePresence>
        {rankModal && <RankModal score={score} rank={rank} tradeCount={stats.totalTrades || 0} onClose={()=>setRankModal(false)}/>}
      </AnimatePresence>
    </>
  );
};

// --- MAIN DASHBOARD -----------------------------------------------------------
export default function Dashboard() {
  const [greeting] = useState(()=>{
    const h = new Date().getHours();
    return h<12?'Good morning':h<18?'Good afternoon':'Good evening';
  });

  const ctx = useTradingContext();
  const stats  = ctx?.stats  || emptyStats();
  const trades = ctx?.trades || [];

  const dashData = { stats, trades };

  return (
    <DashboardDataCtx.Provider value={dashData}>
      <div style={{background:'var(--bg,#030508)',minHeight:'100%',width:'100%',fontFamily:"'SF Pro Display','Segoe UI',system-ui,sans-serif",color:'var(--t1,#E8EEFF)',position:'relative'}}>
        <style>{DASHBOARD_ANIMATIONS}</style>
        {/* BG ambiance */}
        <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:0}}>
          <div style={{position:'absolute',top:0,left:'18%',width:620,height:420,background:'radial-gradient(ellipse,rgba(6,230,255,0.12) 0%,transparent 70%)',filter:'blur(46px)',animation:'mfDashboardFloatA 14s ease-in-out infinite'}}/>
          <div style={{position:'absolute',bottom:0,right:'8%',width:560,height:360,background:'radial-gradient(ellipse,rgba(0,255,136,0.08) 0%,transparent 70%)',filter:'blur(46px)',animation:'mfDashboardFloatB 16s ease-in-out infinite'}}/>
          <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(77,124,255,0.008) 1px,transparent 1px),linear-gradient(90deg,rgba(77,124,255,0.008) 1px,transparent 1px)',backgroundSize:'52px 52px'}}/>
          <div style={{position:'absolute',inset:0,background:'linear-gradient(112deg,transparent 0%,rgba(6,230,255,0.06) 48%,transparent 56%)',transform:'translateX(-120%)',animation:'mfDashboardScan 10s linear infinite'}}/>
        </div>

        <div style={{position:'relative',zIndex:1,padding:'30px 30px 54px',width:'100%',boxSizing:'border-box'}}>

          {/* HEADER */}
          <motion.div initial={{opacity:0,y:-12}} animate={{opacity:1,y:0}} transition={{duration:0.45}}
            style={{marginBottom:20,display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:14}}>
            <div>
              <div style={{fontSize:10.5,color:C.cyan,fontWeight:800,letterSpacing:'0.18em',textTransform:'uppercase',marginBottom:8}}>Trading Command Center</div>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:6}}>
                <motion.div animate={{opacity:[0.6,1,0.6]}} transition={{duration:4,repeat:Infinity,repeatDelay:8}} style={{width:34,height:3,borderRadius:999,background:C.cyan,boxShadow:`0 0 14px ${C.cyan}80`}}/>
                <h1 style={{margin:0,fontSize:28,fontWeight:900,color:C.t0,letterSpacing:'-0.8px',lineHeight:1}}>
                  {greeting}, <span style={{background:C.gradCyan,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Trader</span>
                </h1>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:12,paddingLeft:2}}>
                <span style={{fontSize:10.5,color:C.t3}}>{(()=>{
                  const now=new Date();
                  const days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
                  const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
                  const startOfYear=new Date(now.getFullYear(),0,1);
                  const week=Math.ceil(((now-startOfYear)/86400000+startOfYear.getDay()+1)/7);
                  return `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()} / Week ${week}`;
                })()}</span>
                <div style={{width:4,height:4,borderRadius:'50%',background:C.t4}}/>
                <motion.div animate={{opacity:[1,0.4,1]}} transition={{duration:1.5,repeat:Infinity}} style={{display:'flex',alignItems:'center',gap:5}}>
                  <div style={{width:7,height:7,borderRadius:'50%',background:C.green,boxShadow:`0 0 6px ${C.green}`}}/>
                  <span style={{fontSize:10,color:C.green,fontWeight:700}}>{(()=>{
                    const h=new Date().getUTCHours();
                    if(h>=0&&h<7)  return 'Sydney / Session Active';
                    if(h>=2&&h<9)  return 'Tokyo / Session Active';
                    if(h>=7&&h<16) return 'London / Session Active';
                    if(h>=13&&h<22)return 'New York / Session Active';
                    return 'Market Closed';
                  })()}</span>
                </motion.div>
              </div>
            </div>
            <div style={{display:'flex',gap:10,alignItems:'center'}}>
              {/* Summary stats */}
              <div style={{padding:'10px 18px',borderRadius:14,background:'linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))',border:`1px solid ${C.brdHi || C.brd}`,display:'flex',gap:18,alignItems:'center',boxShadow:'0 16px 34px rgba(0,0,0,0.18)'}}>
                <div style={{textAlign:'center'}}>
                  <div style={{fontSize:8.5,color:C.t3,textTransform:'uppercase',letterSpacing:'0.5px'}}>Trades</div>
                  <div style={{fontSize:14,fontWeight:800,color:C.t1}}>{stats.totalTrades||0}</div>
                </div>
                <div style={{width:1,height:28,background:C.brd}}/>
                <div style={{textAlign:'center'}}>
                  <div style={{fontSize:8.5,color:C.t3,textTransform:'uppercase',letterSpacing:'0.5px'}}>P&L</div>
                  <div style={{fontSize:14,fontWeight:800,color:stats.pnl>=0?C.green:C.danger}}>
                    {stats.pnl>=0?'+':''}{stats.pnl>=0?'$'+stats.pnl.toLocaleString():'-$'+Math.abs(stats.pnl).toLocaleString()}
                  </div>
                </div>
                <div style={{width:1,height:28,background:C.brd}}/>
                <div style={{textAlign:'center'}}>
                  <div style={{fontSize:8.5,color:C.t3,textTransform:'uppercase',letterSpacing:'0.5px'}}>WR</div>
                  <div style={{fontSize:14,fontWeight:800,color:C.cyan}}>{stats.winRate||0}%</div>
                </div>
              </div>
            </div>
          </motion.div>

          <LiveTicker/>
          <KpiStrip/>

          <div style={{display:'grid',gridTemplateColumns:'2fr 1.1fr',gap:14,marginBottom:14}}>
            <EquityPanel/>
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <DailyPnl/>
              <GoalProgress/>
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1.2fr 1fr 1fr',gap:14,marginBottom:14}}>
            <PerformanceScore/>
            <BiaisPanel/>
            <RentabiliteGauge/>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:14,marginBottom:14}}>
            <RecentTrades/>
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <SessionPanel/>
              <PairPanel/>
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1.6fr 1fr',gap:14,marginBottom:14}}>
            <TimeHeatmap/>
            <JournalNote/>
          </div>

          <div style={{marginBottom:14}}>
            <TradingCalendar/>
          </div>

        </div>
      </div>
    </DashboardDataCtx.Provider>
  );
}

function emptyStats() {
  return {
    pnl:0, pnlPct:0, winRate:0, profitFactor:0, avgRR:'—', sharpe:0,
    maxDrawdown:0, expectancy:0, totalTrades:0, wins:0, losses:0, breakevens:0,
    avgWin:0, avgLoss:0, streakWin:0, streakLoss:0, bestTrade:0, worstTrade:0,
    equityData:[], dailyPnl:[], sessionData:[], pairData:[], biaisData:[],
    radarData:[], heatmap:[], recentTrades:[],
  };
}

