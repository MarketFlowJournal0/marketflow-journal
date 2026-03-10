import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine, PieChart, Pie, RadarChart,
  Radar, PolarGrid, PolarAngleAxis
} from 'recharts';
import { useTrades } from '../context/TradingContext';

// ─────────────────────────────────────────────
// DESIGN SYSTEM
// ─────────────────────────────────────────────
const C = {
  bg:        '#0B0F1A',
  bgCard:    '#0E1525',
  bgHigh:    '#131D30',
  bgGlass:   'rgba(14,21,37,0.92)',
  cyan:      '#06E6FF',
  teal:      '#00F5D4',
  green:     '#00FF88',
  blue:      '#4D7CFF',
  purple:    '#B06EFF',
  pink:      '#FF4DC4',
  gold:      '#FFD700',
  danger:    '#FF3D57',
  warn:      '#FFB31A',
  orange:    '#FF6B35',
  t0:        '#FFFFFF',
  t1:        '#E8EEFF',
  t2:        '#7A90B8',
  t3:        '#334566',
  t4:        '#1A2440',
  brd:       '#162034',
  brdHi:     '#1E2E48',
  gradCyan:  'linear-gradient(135deg,#06E6FF,#00FF88)',
  gradPurple:'linear-gradient(135deg,#B06EFF,#4D7CFF)',
  gradWarm:  'linear-gradient(135deg,#FFD700,#FF6B35)',
  gradDanger:'linear-gradient(135deg,#FF3D57,#B06EFF)',
};

// ─────────────────────────────────────────────
// MOCK DATA (replace with TradingContext)
// ─────────────────────────────────────────────
const MOCK_STATS = {
  pnl: 16590, pnlPct: 8.2, winRate: 76.5, profitFactor: 21.74,
  avgRR: '1:1.6', sharpe: 10.89, maxDrawdown: -31.6, expectancy: 976,
  totalTrades: 47, wins: 36, losses: 8, breakevens: 3,
  avgWin: 580, avgLoss: 280, streakWin: 7, streakLoss: 2,
  bestTrade: 4500, worstTrade: -280,
};

const EQUITY_DATA = [
  {d:'Jan',v:1000},{d:'Fév',v:2800},{d:'Mar',v:2400},{d:'Avr',v:4200},{d:'Mai',v:3800},
  {d:'Juin',v:5600},{d:'Juil',v:6100},{d:'Août',v:8900},{d:'Sep',v:8200},{d:'Oct',v:10800},
  {d:'Nov',v:13200},{d:'Déc',v:11800},{d:'Jan',v:14600},{d:'Fév',v:16590},
];

const DAILY_PNL = [
  {d:'Lun',v:380,w:true},{d:'Mar',v:-120,w:false},{d:'Mer',v:0,w:false},{d:'Jeu',v:4500,w:true},
  {d:'Ven',v:380,w:true},{d:'Lun',v:-280,w:false},{d:'Mar',v:0,w:false},
];

const RECENT_TRADES = [
  {id:1,pair:'EURUSD',dir:'Long', res:'TP',rr:1.8,pnl:380,  date:'2024-01-22',session:'Londres', sl:'75px'},
  {id:2,pair:'GBPUSD',dir:'Long', res:'SL',rr:-1, pnl:-128, date:'2024-01-23',session:'Londres', sl:'62px'},
  {id:3,pair:'US30',  dir:'Long', res:'TP',rr:3.2,pnl:4500, date:'2024-01-24',session:'New-York',sl:'140px'},
  {id:4,pair:'AAPL',  dir:'Long', res:'TP',rr:1.5,pnl:380,  date:'2024-01-25',session:'New-York',sl:'72px'},
  {id:5,pair:'ETHUSD',dir:'Short',res:'SL',rr:-1, pnl:-200, date:'2024-01-26',session:'Asie',    sl:'88px'},
  {id:6,pair:'EURUSD',dir:'Short',res:'TP',rr:2.1,pnl:620,  date:'2024-01-27',session:'Londres', sl:'95px'},
];

const SESSION_DATA = [
  {s:'Londres',   tp:18, sl:3, be:2, pnl:8400},
  {s:'New-York',  tp:11, sl:3, be:1, pnl:6200},
  {s:'Asie',      tp:4,  sl:1, be:0, pnl:1400},
  {s:'Hors Sess.', tp:3, sl:1, be:0, pnl:590},
];

const PAIR_DATA = [
  {p:'EURUSD', n:24, wr:79, pnl:9200, col:C.cyan},
  {p:'GBPUSD', n:9,  wr:67, pnl:3100, col:C.teal},
  {p:'US30',   n:6,  wr:83, pnl:2800, col:C.gold},
  {p:'AAPL',   n:5,  wr:80, pnl:980,  col:C.purple},
  {p:'ETHUSD', n:3,  wr:33, pnl:-280, col:C.danger},
];

const RADAR_DATA = [
  {m:'Win Rate',  v:77},{m:'Profit F.',v:100},{m:'Risk/Rew.', v:53},
  {m:'Sharpe',    v:100},{m:'Discipline',v:65},{m:'Constance', v:100},
];

const BIAIS_DATA = [
  {name:'Bullish',value:71,color:C.green,  pnl:'+$13,580'},
  {name:'Bearish',value:25,color:C.danger, pnl:'+$3,010'},
  {name:'Neutre', value:4, color:C.warn,   pnl:'+$80'},
];

const WEEK_HEATMAP = [
  {day:'Lun',h:{ '8h':2,'10h':8,'12h':0,'14h':1,'16h':3}},
  {day:'Mar',h:{'8h':5,'10h':12,'12h':-3,'14h':4,'16h':0}},
  {day:'Mer',h:{'8h':0,'10h':7,'12h':4,'14h':2,'16h':6}},
  {day:'Jeu',h:{'8h':9,'10h':45,'12h':0,'14h':3,'16h':8}},
  {day:'Ven',h:{'8h':4,'10h':6,'12h':3,'14h':0,'16h':2}},
];
const HOURS = ['8h','10h','12h','14h','16h'];

// ─────────────────────────────────────────────
// REUSABLE PRIMITIVES
// ─────────────────────────────────────────────
const Card = ({ children, style = {}, glow = null, hover = false, custom = 0, onClick }) => (
  <motion.div
    variants={{ hidden:{opacity:0,y:16}, visible:(i)=>({opacity:1,y:0,transition:{delay:i*0.05,duration:0.5,ease:[0.16,1,0.3,1]}}) }}
    initial="hidden" animate="visible" custom={custom}
    whileHover={hover ? { y:-2, boxShadow:`0 8px 50px ${glow||C.cyan}15` } : {}}
    onClick={onClick}
    style={{
      background:'linear-gradient(145deg,rgba(14,21,37,0.95),rgba(11,16,28,0.98))',
      borderRadius:16, border:`1px solid ${glow ? glow+'22' : C.brd}`,
      boxShadow:`0 2px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)`,
      position:'relative', overflow:'hidden',
      cursor: onClick ? 'pointer' : 'default',
      ...style
    }}
  >
    {glow && <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${glow}55,transparent)`,pointerEvents:'none'}}/>}
    <div style={{position:'relative',zIndex:1,height:'100%'}}>{children}</div>
  </motion.div>
);

const SectionTitle = ({ children, color = C.cyan, icon }) => (
  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
    {icon && <span style={{fontSize:13,filter:`drop-shadow(0 0 6px ${color})`}}>{icon}</span>}
    <div style={{width:2,height:13,background:color,borderRadius:2,flexShrink:0}}/>
    <span style={{fontSize:11.5,fontWeight:800,color:C.t1,letterSpacing:'-0.2px'}}>{children}</span>
  </div>
);

const Badge = ({ children, color }) => (
  <span style={{
    fontSize:8.5, fontWeight:800, padding:'2px 7px', borderRadius:4,
    color, background:`${color}18`, border:`1px solid ${color}30`,
    textTransform:'uppercase', letterSpacing:'0.5px', whiteSpace:'nowrap',
  }}>{children}</span>
);

const Delta = ({ value, suffix = '%', invert = false }) => {
  const pos = invert ? value < 0 : value >= 0;
  return (
    <span style={{
      fontSize:9, fontWeight:700, padding:'1px 6px', borderRadius:4,
      color: pos ? C.green : C.danger,
      background: pos ? `${C.green}15` : `${C.danger}15`,
      border: `1px solid ${pos ? C.green : C.danger}25`,
    }}>
      {pos ? '▲' : '▼'} {Math.abs(value)}{suffix}
    </span>
  );
};

// Custom tooltip
const ChartTip = ({ active, payload, label, prefix='$', fmt }) => {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value;
  return (
    <div style={{background:C.bgHigh,border:`1px solid ${C.brdHi}`,borderRadius:10,padding:'8px 12px',fontSize:11,boxShadow:'0 8px 28px rgba(0,0,0,0.8)'}}>
      <div style={{color:C.t3,fontSize:8.5,marginBottom:3}}>{label}</div>
      <div style={{color: v>=0?C.green:C.danger, fontWeight:900, fontFamily:'monospace'}}>
        {v>=0?'+':''}{prefix}{typeof v==='number'?v.toLocaleString():v}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// KPI STRIP
// ─────────────────────────────────────────────
const KPI_ITEMS = [
  { label:'P&L Total',      value:'+$16 590', delta:8.2,  sub:'$371/trade',     color:C.green,  icon:'💰' },
  { label:'Win Rate',       value:'76.5%',    delta:2.8,  sub:'36W · 8L · 3BE', color:C.cyan,   icon:'🎯' },
  { label:'Profit Factor',  value:'21.74',    delta:7.5,  sub:'Avg W $116',     color:C.teal,   icon:'⚖️' },
  { label:'Avg R:R',        value:'1:1.6',    delta:0.0,  sub:'Objectif x1.2',  color:C.blue,   icon:'📐' },
  { label:'Sharpe',         value:'10.89',    delta:null, sub:'Annualisé',      color:C.purple, icon:'📏' },
  { label:'Max Drawdown',   value:'-31.6%',   delta:-1.9, sub:'Recovery ×1.4',  color:C.danger, icon:'⚠️', invert:true },
  { label:'Expectancy',     value:'$976',     delta:-1.8, sub:'Par trade',      color:C.gold,   icon:'🧮' },
];

const KpiStrip = () => (
  <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:8, marginBottom:14 }}>
    {KPI_ITEMS.map((k, i) => (
      <Card key={k.label} custom={i} glow={k.color} hover style={{padding:'13px 14px',minHeight:82}}>
        <div style={{position:'absolute',top:-20,right:-12,width:60,height:60,borderRadius:'50%',background:`radial-gradient(circle,${k.color}20,transparent 70%)`,filter:'blur(10px)',pointerEvents:'none'}}/>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:5}}>
          <span style={{fontSize:7,fontWeight:800,color:C.t3,letterSpacing:'1.2px',textTransform:'uppercase',lineHeight:1.4}}>{k.label}</span>
          <span style={{fontSize:14,filter:`drop-shadow(0 0 5px ${k.color})`}}>{k.icon}</span>
        </div>
        <div style={{fontSize:19,fontWeight:900,fontFamily:'monospace',color:k.color,lineHeight:1,marginBottom:4,textShadow:`0 0 18px ${k.color}30`}}>
          {k.value}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:5,flexWrap:'wrap'}}>
          <span style={{fontSize:7.5,color:C.t2}}>{k.sub}</span>
          {k.delta !== null && <Delta value={k.delta} invert={k.invert}/>}
        </div>
        <motion.div animate={{opacity:[0.3,0.7,0.3]}} transition={{duration:2.5,repeat:Infinity,delay:i*0.2}}
          style={{position:'absolute',bottom:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${k.color}50,transparent)`}}/>
      </Card>
    ))}
  </div>
);

// ─────────────────────────────────────────────
// EQUITY CHART
// ─────────────────────────────────────────────
const EquityPanel = () => {
  const [range, setRange] = useState('1A');
  const last = EQUITY_DATA[EQUITY_DATA.length-1].v;
  const first = EQUITY_DATA[0].v;
  const gain = last - first;
  const gainPct = ((gain/first)*100).toFixed(1);
  return (
    <Card custom={7} glow={C.green} hover={false} style={{padding:'20px 20px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
        <div>
          <SectionTitle color={C.green} icon="📈">Equity Curve</SectionTitle>
          <div style={{display:'flex',alignItems:'baseline',gap:10,marginTop:-6,marginBottom:10}}>
            <span style={{fontSize:28,fontWeight:900,fontFamily:'monospace',color:C.green,textShadow:`0 0 24px ${C.green}40`}}>
              +$16,590
            </span>
            <Delta value={gainPct} suffix="%"/>
            <span style={{fontSize:9,color:C.t3}}>depuis le début</span>
          </div>
        </div>
        <div style={{display:'flex',gap:3}}>
          {['1M','3M','6M','1A','Tout'].map(r => (
            <button key={r} onClick={()=>setRange(r)} style={{padding:'4px 9px',borderRadius:6,border:`1px solid ${range===r?C.green:C.brd}`,background:range===r?`${C.green}18`:'transparent',color:range===r?C.green:C.t3,fontSize:9,fontWeight:700,cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s'}}>
              {r}
            </button>
          ))}
        </div>
      </div>
      {/* Mini stats row */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:14}}>
        {[
          {l:'Max DD',v:'-31.6%',c:C.danger},
          {l:'Meilleur',v:'+$4,500',c:C.green},
          {l:'Pire',v:'-$280',c:C.danger},
          {l:'Trades',v:'1/1',c:C.cyan},
        ].map(x=>(
          <div key={x.l} style={{padding:'6px 10px',borderRadius:8,background:'rgba(255,255,255,0.03)',border:`1px solid ${C.brd}`,textAlign:'center'}}>
            <div style={{fontSize:7,color:C.t3,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:2}}>{x.l}</div>
            <div style={{fontSize:12,fontWeight:900,fontFamily:'monospace',color:x.c}}>{x.v}</div>
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={EQUITY_DATA} margin={{top:4,right:4,bottom:0,left:0}}>
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
          <Area type="monotone" dataKey="v" stroke="url(#el)" strokeWidth={2.5} fill="url(#eg)" dot={false}
            activeDot={{r:5,fill:C.green,stroke:'#fff',strokeWidth:2}}/>
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
};

// ─────────────────────────────────────────────
// DAILY P&L BAR
// ─────────────────────────────────────────────
const DailyPnl = () => (
  <Card custom={8} glow={C.cyan} hover={false} style={{padding:'18px 18px'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
      <SectionTitle color={C.cyan} icon="📅">Performance par jour</SectionTitle>
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        <Badge color={C.green}>Sun +$16590</Badge>
        <Badge color={C.warn}>Mon $0</Badge>
      </div>
    </div>
    <ResponsiveContainer width="100%" height={130}>
      <BarChart data={DAILY_PNL} margin={{top:4,right:4,bottom:0,left:0}}>
        <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="4 4" vertical={false}/>
        <XAxis dataKey="d" tick={{fill:C.t3,fontSize:8}} axisLine={false} tickLine={false}/>
        <YAxis tick={{fill:C.t3,fontSize:7}} axisLine={false} tickLine={false} tickFormatter={v=>`$${v}`} width={36}/>
        <Tooltip content={<ChartTip prefix="$"/>}/>
        <ReferenceLine y={0} stroke="rgba(255,255,255,0.12)"/>
        <Bar dataKey="v" radius={[4,4,0,0]} maxBarSize={36}>
          {DAILY_PNL.map((d,i)=><Cell key={i} fill={d.v>0?C.green:d.v<0?C.danger:C.warn} opacity={0.85}/>)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
    {/* Day values row */}
    <div style={{display:'grid',gridTemplateColumns:`repeat(${DAILY_PNL.length},1fr)`,gap:3,marginTop:8}}>
      {DAILY_PNL.map((d,i)=>(
        <div key={i} style={{textAlign:'center',padding:'4px 0',borderRadius:6,background:'rgba(255,255,255,0.025)'}}>
          <div style={{fontSize:7,color:C.t3,marginBottom:1}}>{d.d}</div>
          <div style={{fontSize:8.5,fontWeight:900,fontFamily:'monospace',color:d.v>0?C.green:d.v<0?C.danger:C.t3}}>
            {d.v>0?'+':''}${Math.abs(d.v)}
          </div>
        </div>
      ))}
    </div>
  </Card>
);

// ─────────────────────────────────────────────
// PERFORMANCE SCORE RADAR
// ─────────────────────────────────────────────
const PerformanceScore = () => (
  <Card custom={9} glow={C.purple} hover={false} style={{padding:'18px 18px'}}>
    <SectionTitle color={C.purple} icon="⚡">Performance Score</SectionTitle>
    <div style={{display:'flex',alignItems:'center',gap:16}}>
      {/* Score circle */}
      <div style={{position:'relative',flexShrink:0,width:70,height:70}}>
        <svg width="70" height="70" viewBox="0 0 70 70">
          <circle cx="35" cy="35" r="30" fill="none" stroke="rgba(176,110,255,0.12)" strokeWidth="6"/>
          <circle cx="35" cy="35" r="30" fill="none" stroke="url(#sg)" strokeWidth="6"
            strokeDasharray={`${2*Math.PI*30*0.68} ${2*Math.PI*30*(1-0.68)}`}
            strokeLinecap="round" transform="rotate(-90 35 35)"/>
          <defs><linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="0%"><stop stopColor={C.cyan}/><stop offset="1" stopColor={C.purple}/></linearGradient></defs>
        </svg>
        <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
          <span style={{fontSize:19,fontWeight:900,color:C.t0,lineHeight:1}}>68</span>
          <span style={{fontSize:6.5,color:C.t3,fontWeight:700,letterSpacing:'0.5px'}}>SCORE</span>
        </div>
      </div>
      {/* Bars */}
      <div style={{flex:1,display:'flex',flexDirection:'column',gap:5}}>
        {[
          {l:'Win Rate',v:77,c:C.green},
          {l:'Profit F.',v:100,c:C.cyan},
          {l:'Risk/Rew.',v:53,c:C.purple},
          {l:'Sharpe',v:100,c:C.teal},
          {l:'Discipline',v:65,c:C.warn},
          {l:'Constance',v:100,c:C.blue},
        ].map(x=>(
          <div key={x.l} style={{display:'flex',alignItems:'center',gap:7}}>
            <span style={{fontSize:7.5,color:C.t3,width:52,flexShrink:0}}>{x.l}</span>
            <div style={{flex:1,height:3,borderRadius:2,background:'rgba(255,255,255,0.05)',overflow:'hidden'}}>
              <motion.div initial={{width:0}} animate={{width:`${x.v}%`}} transition={{duration:1,delay:0.3,ease:[0.16,1,0.3,1]}}
                style={{height:'100%',background:`linear-gradient(90deg,${x.c}66,${x.c})`,borderRadius:2}}/>
            </div>
            <span style={{fontSize:7.5,fontWeight:800,color:x.c,width:22,textAlign:'right',fontFamily:'monospace'}}>{x.v}</span>
          </div>
        ))}
      </div>
    </div>
    <div style={{marginTop:12}}>
      <ResponsiveContainer width="100%" height={140}>
        <RadarChart data={RADAR_DATA} cx="50%" cy="50%" outerRadius="58%">
          <PolarGrid stroke="rgba(255,255,255,0.07)" gridType="polygon"/>
          <PolarAngleAxis dataKey="m" tick={{fill:C.t3,fontSize:7.5}}/>
          <Radar dataKey="v" stroke={C.purple} strokeWidth={1.5} fill={C.purple} fillOpacity={0.18}/>
        </RadarChart>
      </ResponsiveContainer>
    </div>
  </Card>
);

// ─────────────────────────────────────────────
// BIAIS ANALYSIS
// ─────────────────────────────────────────────
const BiaisPanel = () => {
  const total = BIAIS_DATA.reduce((s,d)=>s+d.value,0);
  return (
    <Card custom={10} glow={C.teal} hover={false} style={{padding:'18px 18px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
        <SectionTitle color={C.teal} icon="🧭">Analyse des Biais</SectionTitle>
        <Badge color={C.cyan}>17 annotés</Badge>
      </div>
      {/* Donut */}
      <div style={{display:'flex',gap:16,alignItems:'center',marginBottom:12}}>
        <div style={{position:'relative',flexShrink:0}}>
          <ResponsiveContainer width={110} height={110}>
            <PieChart>
              <Pie data={BIAIS_DATA} cx="50%" cy="50%" innerRadius={32} outerRadius={50}
                dataKey="value" startAngle={90} endAngle={-270} stroke="none" paddingAngle={2}>
                {BIAIS_DATA.map((d,i)=><Cell key={i} fill={d.color}/>)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
            <span style={{fontSize:8.5,fontWeight:900,color:C.green}}>Bull</span>
            <span style={{fontSize:7,color:C.t3}}>71%</span>
          </div>
        </div>
        <div style={{flex:1,display:'flex',flexDirection:'column',gap:6}}>
          {BIAIS_DATA.map((d,i)=>(
            <div key={i}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                <div style={{display:'flex',alignItems:'center',gap:5}}>
                  <div style={{width:7,height:7,borderRadius:2,background:d.color}}/>
                  <span style={{fontSize:9.5,fontWeight:700,color:C.t1}}>{d.name}</span>
                </div>
                <div style={{display:'flex',gap:8}}>
                  <span style={{fontSize:9,fontWeight:800,color:d.color,fontFamily:'monospace'}}>{d.value}%</span>
                  <span style={{fontSize:9,color:d.pnl.startsWith('+')?C.green:C.danger,fontFamily:'monospace'}}>{d.pnl}</span>
                </div>
              </div>
              <div style={{height:3,borderRadius:2,background:'rgba(255,255,255,0.05)',overflow:'hidden'}}>
                <motion.div initial={{width:0}} animate={{width:`${d.value}%`}} transition={{duration:0.9,delay:i*0.15}}
                  style={{height:'100%',background:d.color,borderRadius:2}}/>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Bottom stats */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,padding:'10px',borderRadius:10,background:'rgba(255,255,255,0.025)',border:`1px solid ${C.brd}`}}>
        {[
          {l:'P&L Bull.',v:'+$13,580',c:C.green},
          {l:'P&L Bear.',v:'+$3,010',c:C.danger},
          {l:'Biais dom.',v:'🐂 Bull',c:C.green},
        ].map((x,i)=>(
          <div key={i} style={{textAlign:'center'}}>
            <div style={{fontSize:7,color:C.t3,marginBottom:2}}>{x.l}</div>
            <div style={{fontSize:11,fontWeight:900,color:x.c,fontFamily:'monospace'}}>{x.v}</div>
          </div>
        ))}
      </div>
    </Card>
  );
};

// ─────────────────────────────────────────────
// RENTABILITE GAUGE
// ─────────────────────────────────────────────
const RentabiliteGauge = () => {
  const pct = 76.5;
  const angle = (pct / 100) * 180 - 90; // -90 to +90
  return (
    <Card custom={11} glow={C.orange} hover={false} style={{padding:'18px 18px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
        <SectionTitle color={C.orange} icon="🔥">Rentabilité</SectionTitle>
        <Badge color={C.cyan}>1h 24m avg</Badge>
      </div>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',paddingTop:4}}>
        {/* Gauge SVG */}
        <svg width="200" height="110" viewBox="0 0 200 110">
          <defs>
            <linearGradient id="gg" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={C.danger}/><stop offset="40%" stopColor={C.warn}/>
              <stop offset="70%" stopColor={C.teal}/><stop offset="100%" stopColor={C.green}/>
            </linearGradient>
          </defs>
          {/* Track */}
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="14" strokeLinecap="round"/>
          {/* Filled */}
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#gg)" strokeWidth="14" strokeLinecap="round"
            strokeDasharray={`${pct/100*251} 251`}/>
          {/* Needle */}
          <g transform={`rotate(${angle},100,100)`}>
            <line x1="100" y1="100" x2="100" y2="30" stroke={C.t0} strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="100" cy="100" r="5" fill={C.t0}/>
          </g>
          {/* Labels */}
          <text x="16" y="115" fontSize="8" fill={C.t3} textAnchor="middle">0%</text>
          <text x="100" y="28" fontSize="8" fill={C.t3} textAnchor="middle">50%</text>
          <text x="184" y="115" fontSize="8" fill={C.t3} textAnchor="middle">100%</text>
        </svg>
        <div style={{marginTop:-8,textAlign:'center'}}>
          <div style={{fontSize:32,fontWeight:900,fontFamily:'monospace',color:C.green,lineHeight:1,textShadow:`0 0 28px ${C.green}50`}}>76.5%</div>
          <div style={{fontSize:9,color:C.t3,letterSpacing:'2px',textTransform:'uppercase',marginTop:3}}>Win Rate</div>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,marginTop:12}}>
        {[{l:'Total',v:'47'},{l:'Wins',v:'36',c:C.green},{l:'Losses',v:'8',c:C.danger}].map((x,i)=>(
          <div key={i} style={{textAlign:'center',padding:'5px 0',borderRadius:8,background:'rgba(255,255,255,0.03)',border:`1px solid ${C.brd}`}}>
            <div style={{fontSize:7,color:C.t3,marginBottom:1,textTransform:'uppercase',letterSpacing:'0.5px'}}>{x.l}</div>
            <div style={{fontSize:13,fontWeight:900,color:x.c||C.t1,fontFamily:'monospace'}}>{x.v}</div>
          </div>
        ))}
      </div>
    </Card>
  );
};

// ─────────────────────────────────────────────
// RECENT TRADES
// ─────────────────────────────────────────────
const RecentTrades = () => {
  const [filter, setFilter] = useState('All');
  const filtered = filter === 'All' ? RECENT_TRADES : RECENT_TRADES.filter(t => t.res === filter);
  return (
    <Card custom={12} glow={C.blue} hover={false} style={{padding:'18px 18px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <SectionTitle color={C.blue} icon="📋">Recent Trades</SectionTitle>
        <div style={{display:'flex',gap:4,alignItems:'center'}}>
          <div style={{display:'flex',gap:3}}>
            {['All','TP','SL'].map(f=>(
              <button key={f} onClick={()=>setFilter(f)} style={{padding:'3px 8px',borderRadius:5,border:`1px solid ${filter===f?C.blue:C.brd}`,background:filter===f?`${C.blue}20`:'transparent',color:filter===f?C.blue:C.t3,fontSize:8.5,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                {f}
              </button>
            ))}
          </div>
          <button style={{padding:'3px 9px',borderRadius:5,border:`1px solid ${C.brd}`,background:'transparent',color:C.t3,fontSize:8,cursor:'pointer',fontFamily:'inherit'}}>
            Tout voir →
          </button>
        </div>
      </div>
      {/* Stats mini-row */}
      <div style={{display:'flex',gap:8,marginBottom:12}}>
        <div style={{padding:'4px 10px',borderRadius:7,background:`${C.green}12`,border:`1px solid ${C.green}25`,display:'flex',gap:6,alignItems:'center'}}>
          <span style={{fontSize:8,color:C.t3}}>P&L semaine</span>
          <span style={{fontSize:10,fontWeight:900,color:C.green,fontFamily:'monospace'}}>+$5,000</span>
        </div>
        <div style={{padding:'4px 10px',borderRadius:7,background:`${C.cyan}12`,border:`1px solid ${C.cyan}25`,display:'flex',gap:6,alignItems:'center'}}>
          <span style={{fontSize:8,color:C.t3}}>Win rate</span>
          <span style={{fontSize:10,fontWeight:900,color:C.cyan,fontFamily:'monospace'}}>88%</span>
        </div>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:3}}>
        {filtered.map((t,i)=>{
          const rc = t.res==='TP'?C.green:t.res==='SL'?C.danger:C.warn;
          return(
            <motion.div key={t.id} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:i*0.05}}
              style={{display:'grid',gridTemplateColumns:'32px 1fr 1fr 1fr 1fr 1fr',alignItems:'center',
                gap:8,padding:'8px 10px',borderRadius:9,
                background:i%2===0?'rgba(255,255,255,0.018)':'rgba(255,255,255,0.010)',
                border:'1px solid rgba(255,255,255,0.035)',transition:'all 0.12s',cursor:'pointer'}}
              whileHover={{background:'rgba(77,124,255,0.06)',borderColor:'rgba(77,124,255,0.18)'}}>
              {/* Pair badge */}
              <div style={{width:32,height:22,borderRadius:5,background:`${rc}15`,border:`1px solid ${rc}28`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <span style={{fontSize:6.5,fontWeight:900,color:rc}}>
                  {t.pair.slice(0,3)}
                </span>
              </div>
              <div>
                <div style={{fontSize:10,fontWeight:800,color:C.t1}}>{t.pair}</div>
                <div style={{fontSize:7.5,color:t.dir==='Long'?C.green:C.danger,fontWeight:700}}>{t.dir==='Long'?'▲':'▼'} {t.dir}</div>
              </div>
              <div style={{textAlign:'center'}}>
                <div style={{display:'inline-block',padding:'1px 6px',borderRadius:4,background:`${rc}18`,border:`1px solid ${rc}30`,fontSize:8,fontWeight:800,color:rc}}>{t.res}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:9.5,fontWeight:900,fontFamily:'monospace',color:t.rr>0?C.green:C.danger}}>{t.rr>0?'+':''}{t.rr}R</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:9.5,fontWeight:900,fontFamily:'monospace',color:t.pnl>0?C.green:C.danger}}>{t.pnl>0?'+':''}{t.pnl}$</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:7.5,color:C.purple}}>{t.session}</div>
                <div style={{fontSize:7,color:C.t3}}>{t.date.slice(5)}</div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
};

// ─────────────────────────────────────────────
// SESSION BREAKDOWN
// ─────────────────────────────────────────────
const SessionPanel = () => (
  <Card custom={13} glow={C.purple} hover={false} style={{padding:'18px 18px'}}>
    <SectionTitle color={C.purple} icon="🌍">Sessions</SectionTitle>
    <div style={{display:'flex',flexDirection:'column',gap:6}}>
      {SESSION_DATA.map((s,i)=>{
        const wr = Math.round(s.tp/(s.tp+s.sl+s.be)*100);
        const maxPnl = Math.max(...SESSION_DATA.map(x=>x.pnl));
        const pct = s.pnl/maxPnl*100;
        return (
          <div key={i} style={{padding:'9px 11px',borderRadius:10,background:'rgba(255,255,255,0.025)',border:`1px solid ${C.brd}`,position:'relative',overflow:'hidden'}}>
            <motion.div animate={{opacity:[0.04,0.08,0.04]}} transition={{duration:3,repeat:Infinity,delay:i*0.4}}
              style={{position:'absolute',inset:0,background:`linear-gradient(90deg,${C.purple}10,transparent)`}}/>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5,position:'relative'}}>
              <span style={{fontSize:10,fontWeight:800,color:C.t1}}>{s.s}</span>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <span style={{fontSize:8.5,fontWeight:800,fontFamily:'monospace',color:C.green}}>+${s.pnl.toLocaleString()}</span>
                <span style={{fontSize:8,fontWeight:800,color:wr>=65?C.green:wr>=50?C.warn:C.danger,fontFamily:'monospace'}}>{wr}%</span>
                <span style={{fontSize:7.5,color:C.t3}}>{s.tp}W·{s.sl}L·{s.be}BE</span>
              </div>
            </div>
            <div style={{height:3,borderRadius:2,background:'rgba(255,255,255,0.05)',overflow:'hidden'}}>
              <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:0.8,delay:0.2+i*0.1}}
                style={{height:'100%',background:`linear-gradient(90deg,${C.purple}88,${C.purple})`,borderRadius:2}}/>
            </div>
          </div>
        );
      })}
    </div>
  </Card>
);

// ─────────────────────────────────────────────
// PAIR BREAKDOWN
// ─────────────────────────────────────────────
const PairPanel = () => (
  <Card custom={14} glow={C.gold} hover={false} style={{padding:'18px 18px'}}>
    <SectionTitle color={C.gold} icon="💱">Par Paire</SectionTitle>
    <div style={{display:'flex',flexDirection:'column',gap:4}}>
      {/* Header */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 32px 42px 60px',gap:8,padding:'0 8px 6px',borderBottom:`1px solid ${C.brd}`}}>
        {['Paire','#','WR','P&L'].map(h=><span key={h} style={{fontSize:7,fontWeight:800,color:C.t3,textTransform:'uppercase',letterSpacing:'0.5px',textAlign:'right'}}>{h}</span>)}
      </div>
      {PAIR_DATA.map((p,i)=>(
        <motion.div key={i} initial={{opacity:0,x:8}} animate={{opacity:1,x:0}} transition={{delay:0.1+i*0.06}}
          style={{display:'grid',gridTemplateColumns:'1fr 32px 42px 60px',gap:8,padding:'7px 8px',borderRadius:8,
            background:'rgba(255,255,255,0.02)',alignItems:'center',cursor:'pointer',transition:'all 0.12s'}}
          whileHover={{background:'rgba(255,215,0,0.05)',borderColor:`${C.gold}20`}}>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:p.col,boxShadow:`0 0 5px ${p.col}`,flexShrink:0}}/>
            <span style={{fontSize:10.5,fontWeight:800,color:C.t1}}>{p.p}</span>
          </div>
          <span style={{fontSize:9,color:C.t2,fontFamily:'monospace',textAlign:'right'}}>{p.n}</span>
          <span style={{fontSize:9,fontWeight:800,fontFamily:'monospace',color:p.wr>=65?C.green:p.wr>=50?C.warn:C.danger,textAlign:'right'}}>{p.wr}%</span>
          <span style={{fontSize:10,fontWeight:900,fontFamily:'monospace',color:p.pnl>=0?C.green:C.danger,textAlign:'right'}}>
            {p.pnl>=0?'+':''}{p.pnl>=0?'$'+p.pnl.toLocaleString():'-$'+Math.abs(p.pnl)}
          </span>
        </motion.div>
      ))}
    </div>
  </Card>
);

// ─────────────────────────────────────────────
// HEATMAP Heure × Jour
// ─────────────────────────────────────────────
const TimeHeatmap = () => {
  const maxV = Math.max(...WEEK_HEATMAP.flatMap(w=>Object.values(w.h).map(Math.abs)),1);
  return (
    <Card custom={15} glow={C.teal} hover={false} style={{padding:'18px 18px'}}>
      <SectionTitle color={C.teal} icon="🌡️">Heatmap Heure × Jour</SectionTitle>
      <div style={{overflowX:'auto'}}>
        <table style={{borderCollapse:'separate',borderSpacing:3,minWidth:'100%'}}>
          <thead>
            <tr>
              <th style={{width:44}}/>
              {HOURS.map(h=><th key={h} style={{fontSize:7.5,fontWeight:700,color:C.t3,textAlign:'center',padding:'0 2px 5px',whiteSpace:'nowrap'}}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {WEEK_HEATMAP.map((row,ri)=>(
              <tr key={ri}>
                <td style={{fontSize:8.5,fontWeight:700,color:C.t2,paddingRight:6,textAlign:'right'}}>{row.day}</td>
                {HOURS.map(h=>{
                  const v = row.h[h]||0;
                  const intensity = Math.min(0.8,Math.abs(v)/maxV*0.8);
                  const bg = v>0?`rgba(0,255,136,${intensity*0.65})`:v<0?`rgba(255,61,87,${intensity*0.55})`:'rgba(255,255,255,0.03)';
                  const tc = v>0?C.green:v<0?C.danger:C.t4;
                  return(
                    <td key={h} style={{padding:2}}>
                      <motion.div whileHover={{scale:1.15}} style={{width:38,height:34,borderRadius:7,background:bg,border:`1px solid ${v!==0?'rgba(255,255,255,0.07)':C.brd}`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
                        {v!==0?(<>
                          <div style={{fontSize:8.5,fontWeight:900,fontFamily:'monospace',color:tc,lineHeight:1}}>{v>0?'+':''}${Math.abs(v)*100}</div>
                          <div style={{fontSize:6,color:C.t3,marginTop:1}}>{v>0?'+':''}{v}R</div>
                        </>):<div style={{width:5,height:1,background:'rgba(255,255,255,0.06)'}}/>}
                      </motion.div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

// ─────────────────────────────────────────────
// OPEN TRADE TICKER (top alert bar)
// ─────────────────────────────────────────────
const LiveTicker = () => {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} transition={{duration:0.4}}
      style={{
        marginBottom:10,padding:'8px 16px',borderRadius:10,
        background:'linear-gradient(90deg,rgba(0,255,136,0.06),rgba(6,230,255,0.04))',
        border:`1px solid ${C.green}25`,
        display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,
      }}>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <motion.div animate={{opacity:[1,0.3,1]}} transition={{duration:1.2,repeat:Infinity}}
          style={{width:7,height:7,borderRadius:'50%',background:C.green,boxShadow:`0 0 8px ${C.green}`,flexShrink:0}}/>
        <span style={{fontSize:9.5,fontWeight:700,color:C.green}}>1 Trade actif</span>
        <div style={{width:1,height:14,background:C.brd}}/>
        <span style={{fontSize:9.5,color:C.t2}}>EURUSD · Long · Entré à</span>
        <span style={{fontSize:9.5,fontWeight:800,color:C.cyan,fontFamily:'monospace'}}>1.08320</span>
        <span style={{fontSize:9.5,color:C.t2}}>· P&L flottant</span>
        <span style={{fontSize:10,fontWeight:900,color:C.green,fontFamily:'monospace'}}>+$142</span>
        <Badge color={C.cyan}>+0.8R</Badge>
      </div>
      <div style={{display:'flex',gap:6,alignItems:'center'}}>
        <span style={{fontSize:8,color:C.t3}}>SL: 1.08180 · TP: 1.08680 · RR cible: 1:2.4</span>
        <button onClick={()=>setVisible(false)} style={{background:'transparent',border:'none',color:C.t3,cursor:'pointer',fontSize:14,lineHeight:1}}>×</button>
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────
// QUICK ACTIONS
// ─────────────────────────────────────────────
const QuickActions = () => (
  <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap'}}>
    {[
      {l:'+ Nouveau Trade',    c:C.green,  bg:`${C.green}15`,  bd:`${C.green}35`,   icon:'➕'},
      {l:'Importer Excel',    c:C.cyan,   bg:`${C.cyan}12`,   bd:`${C.cyan}30`,    icon:'📥'},
      {l:'Rapport PDF',       c:C.purple, bg:`${C.purple}12`, bd:`${C.purple}28`,  icon:'📄'},
      {l:'Objectifs du mois', c:C.gold,   bg:`${C.gold}12`,   bd:`${C.gold}25`,    icon:'🎯'},
    ].map((a,i)=>(
      <motion.button key={i} whileHover={{scale:1.03,y:-1}} whileTap={{scale:0.97}}
        style={{display:'flex',alignItems:'center',gap:7,padding:'8px 14px',borderRadius:9,border:`1px solid ${a.bd}`,background:a.bg,color:a.c,fontSize:10,fontWeight:700,cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s'}}>
        <span style={{fontSize:13}}>{a.icon}</span>{a.l}
      </motion.button>
    ))}
  </div>
);

// ─────────────────────────────────────────────
// GOAL PROGRESS
// ─────────────────────────────────────────────
const GoalProgress = () => {
  const goals = [
    {l:'Objectif mensuel',  cur:8400,  target:10000, c:C.cyan},
    {l:'Win Rate cible',    cur:76.5,  target:70,    c:C.green, suffix:'%'},
    {l:'Max trades/sem.',   cur:7,     target:10,    c:C.purple},
    {l:'Drawdown max',      cur:31.6,  target:20,    c:C.danger, invert:true, suffix:'%'},
  ];
  return (
    <Card custom={16} glow={C.cyan} hover={false} style={{padding:'18px 18px'}}>
      <SectionTitle color={C.cyan} icon="🏆">Objectifs du Mois</SectionTitle>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {goals.map((g,i)=>{
          const pct = Math.min(100, (g.cur/g.target)*100);
          const ok = g.invert ? g.cur <= g.target : pct >= 100;
          const c = ok ? C.green : pct >= 70 ? g.c : C.warn;
          return (
            <div key={i}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                <span style={{fontSize:9.5,fontWeight:700,color:C.t1}}>{g.l}</span>
                <div style={{display:'flex',gap:6,alignItems:'center'}}>
                  <span style={{fontSize:9,fontFamily:'monospace',color:c,fontWeight:800}}>
                    {g.suffix==='%'?g.cur+'%':g.prefix==='$'?'$'+g.cur.toLocaleString():g.cur}
                  </span>
                  <span style={{fontSize:7.5,color:C.t3}}>/ {g.suffix==='%'?g.target+'%':'$'+g.target.toLocaleString()}</span>
                  {ok && <span style={{fontSize:10}}>✅</span>}
                </div>
              </div>
              <div style={{height:5,borderRadius:3,background:'rgba(255,255,255,0.05)',overflow:'hidden'}}>
                <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:0.9,delay:0.15+i*0.1,ease:[0.16,1,0.3,1]}}
                  style={{height:'100%',borderRadius:3,background:`linear-gradient(90deg,${c}66,${c})`}}/>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

// ─────────────────────────────────────────────
// JOURNAL NOTES
// ─────────────────────────────────────────────
const JournalNote = () => (
  <Card custom={17} glow={C.warn} hover={false} style={{padding:'18px 18px'}}>
    <SectionTitle color={C.warn} icon="📝">Note du jour</SectionTitle>
    <div style={{fontSize:9.5,color:C.t2,lineHeight:1.75,background:'rgba(255,255,255,0.02)',borderRadius:10,padding:'10px 12px',border:`1px solid ${C.brd}`,marginBottom:10,minHeight:64}}>
      <span style={{color:C.gold,fontWeight:700}}>Points forts :</span> Excellente lecture du contexte London open. EURUSD reaction propre sur le RB 1H.
      <br/><span style={{color:C.danger,fontWeight:700}}>À améliorer :</span> Attendre confirmation après CISD avant d'entrer — 2 faux signaux cette semaine.
    </div>
    <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
      {['Discipline ✓','Patience ✓','FOMO ✗','Overtrading ✗'].map((t,i)=>(
        <span key={i} style={{padding:'3px 8px',borderRadius:5,fontSize:8,fontWeight:700,
          background:t.includes('✓')?`${C.green}12`:`${C.danger}12`,
          border:`1px solid ${t.includes('✓')?C.green:C.danger}25`,
          color:t.includes('✓')?C.green:C.danger}}>
          {t}
        </span>
      ))}
    </div>
  </Card>
);

// ─────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────
export default function Dashboard() {
  const [greeting] = useState(() => {
    const h = new Date().getHours();
    return h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir';
  });

  return (
    <div style={{
      background:'var(--bg, #0B0F1A)',
      minHeight:'100%',
      width:'100%',
      fontFamily:"'SF Pro Display','Segoe UI',system-ui,sans-serif",
      color:'var(--t1, #E8EEFF)',
      position:'relative',
    }}>
      {/* BG ambiance */}
      <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:0}}>
        <div style={{position:'absolute',top:0,left:'20%',width:600,height:400,background:'radial-gradient(ellipse,rgba(77,124,255,0.06) 0%,transparent 70%)',filter:'blur(40px)'}}/>
        <div style={{position:'absolute',bottom:0,right:'10%',width:500,height:350,background:'radial-gradient(ellipse,rgba(0,255,136,0.04) 0%,transparent 70%)',filter:'blur(40px)'}}/>
        <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(77,124,255,0.008) 1px,transparent 1px),linear-gradient(90deg,rgba(77,124,255,0.008) 1px,transparent 1px)',backgroundSize:'52px 52px'}}/>
      </div>

      <div style={{position:'relative',zIndex:1,padding:'22px 24px 40px',width:'100%',boxSizing:'border-box'}}>

        {/* ── HEADER ── */}
        <motion.div initial={{opacity:0,y:-12}} animate={{opacity:1,y:0}} transition={{duration:0.45}}
          style={{marginBottom:16,display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
              <motion.div animate={{rotate:[0,5,-5,0]}} transition={{duration:4,repeat:Infinity,repeatDelay:8}}
                style={{fontSize:22}}>👋</motion.div>
              <h1 style={{margin:0,fontSize:20,fontWeight:900,color:C.t0,letterSpacing:'-0.5px'}}>
                {greeting}, <span style={{background:C.gradCyan,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Trader</span>
              </h1>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:10,paddingLeft:2}}>
              <span style={{fontSize:10,color:C.t3}}>Lundi 22 Janvier 2024 · Semaine 4</span>
              <div style={{width:4,height:4,borderRadius:'50%',background:C.t4}}/>
              <motion.div animate={{opacity:[1,0.4,1]}} transition={{duration:1.5,repeat:Infinity}}
                style={{display:'flex',alignItems:'center',gap:4}}>
                <div style={{width:6,height:6,borderRadius:'50%',background:C.green,boxShadow:`0 0 6px ${C.green}`}}/>
                <span style={{fontSize:9.5,color:C.green,fontWeight:700}}>London Open · Session Active</span>
              </motion.div>
            </div>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <div style={{padding:'6px 12px',borderRadius:8,background:'rgba(255,255,255,0.04)',border:`1px solid ${C.brd}`,display:'flex',gap:8,alignItems:'center'}}>
              <span style={{fontSize:9,color:C.t3}}>Compte</span>
              <select style={{background:'transparent',border:'none',color:C.cyan,fontSize:10,fontWeight:700,outline:'none',cursor:'pointer',fontFamily:'inherit'}}>
                <option>Live — $48,590</option>
                <option>Demo — $10,000</option>
              </select>
            </div>
            <motion.div animate={{scale:[1,1.04,1]}} transition={{duration:2,repeat:Infinity}}
              style={{padding:'7px 14px',borderRadius:9,background:`${C.green}18`,border:`1px solid ${C.green}35`,fontSize:10,fontWeight:800,color:C.green,cursor:'pointer'}}>
              ➕ Ajouter trade
            </motion.div>
          </div>
        </motion.div>

        {/* ── LIVE TICKER ── */}
        <LiveTicker/>

        {/* ── QUICK ACTIONS ── */}
        <QuickActions/>

        {/* ── KPI STRIP ── */}
        <KpiStrip/>

        {/* ── ROW 2: Equity (large) + Daily PnL ── */}
        <div style={{display:'grid',gridTemplateColumns:'2fr 1.1fr',gap:12,marginBottom:12}}>
          <EquityPanel/>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <DailyPnl/>
            <GoalProgress/>
          </div>
        </div>

        {/* ── ROW 3: Score + Biais + Rentabilité ── */}
        <div style={{display:'grid',gridTemplateColumns:'1.2fr 1fr 1fr',gap:12,marginBottom:12}}>
          <PerformanceScore/>
          <BiaisPanel/>
          <RentabiliteGauge/>
        </div>

        {/* ── ROW 4: Trades + (Session + Pairs) ── */}
        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:12,marginBottom:12}}>
          <RecentTrades/>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <SessionPanel/>
            <PairPanel/>
          </div>
        </div>

        {/* ── ROW 5: Heatmap + Journal ── */}
        <div style={{display:'grid',gridTemplateColumns:'1.6fr 1fr',gap:12}}>
          <TimeHeatmap/>
          <JournalNote/>
        </div>

      </div>
    </div>
  );
}