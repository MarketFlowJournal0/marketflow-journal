import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine, PieChart, Pie,
  RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts';
import { useTradingContext } from '../context/TradingContext';

const DashboardDataCtx = React.createContext(null);
const useDashData = () => React.useContext(DashboardDataCtx) || {};

// ─── DESIGN SYSTEM ───────────────────────────────────────────────────────────
const C = {
  bg:'#0B0F1A', bgCard:'#0E1525', bgHigh:'#131D30',
  cyan:'#06E6FF', teal:'#00F5D4', green:'#00FF88', blue:'#4D7CFF',
  purple:'#B06EFF', pink:'#FF4DC4', gold:'#FFD700', danger:'#FF3D57',
  warn:'#FFB31A', orange:'#FF6B35',
  t0:'#FFFFFF', t1:'#E8EEFF', t2:'#7A90B8', t3:'#334566', t4:'#1A2440',
  brd:'#162034', brdHi:'#1E2E48',
  gradCyan:'linear-gradient(135deg,#06E6FF,#00FF88)',
};

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────
const Card = ({ children, style={}, glow=null, hover=false, custom=0, onClick }) => (
  <motion.div
    variants={{hidden:{opacity:0,y:16},visible:(i)=>({opacity:1,y:0,transition:{delay:i*0.05,duration:0.5,ease:[0.16,1,0.3,1]}})}}
    initial="hidden" animate="visible" custom={custom}
    whileHover={hover?{y:-2,boxShadow:`0 8px 50px ${glow||C.cyan}15`}:{}}
    onClick={onClick}
    style={{
      background:'linear-gradient(145deg,rgba(14,21,37,0.95),rgba(11,16,28,0.98))',
      borderRadius:16, border:`1px solid ${glow?glow+'22':C.brd}`,
      boxShadow:'0 2px 24px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.03)',
      position:'relative', overflow:'hidden', cursor:onClick?'pointer':'default',
      ...style
    }}
  >
    {glow && <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${glow}55,transparent)`,pointerEvents:'none'}}/>}
    <div style={{position:'relative',zIndex:1,height:'100%'}}>{children}</div>
  </motion.div>
);

const SectionTitle = ({ children, color=C.cyan, icon }) => (
  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
    {icon && <span style={{fontSize:13,filter:`drop-shadow(0 0 6px ${color})`}}>{icon}</span>}
    <div style={{width:2,height:13,background:color,borderRadius:2,flexShrink:0}}/>
    <span style={{fontSize:11.5,fontWeight:800,color:C.t1,letterSpacing:'-0.2px'}}>{children}</span>
  </div>
);

const Badge = ({ children, color }) => (
  <span style={{fontSize:8.5,fontWeight:800,padding:'2px 7px',borderRadius:4,color,background:`${color}18`,border:`1px solid ${color}30`,textTransform:'uppercase',letterSpacing:'0.5px',whiteSpace:'nowrap'}}>{children}</span>
);

const Delta = ({ value, suffix='%', invert=false }) => {
  const pos = invert ? value <= 0 : value >= 0;
  return (
    <span style={{fontSize:9,fontWeight:700,padding:'1px 6px',borderRadius:4,color:pos?C.green:C.danger,background:pos?`${C.green}15`:`${C.danger}15`,border:`1px solid ${pos?C.green:C.danger}25`}}>
      {pos?'▲':'▼'} {Math.abs(value)}{suffix}
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
    <span style={{fontSize:24,opacity:0.3}}>📭</span>
    <span style={{fontSize:10,color:C.t3}}>{label||'No trades recorded'}</span>
  </div>
);

// ─── KPI STRIP ────────────────────────────────────────────────────────────────
const KpiStrip = () => {
  const { stats } = useDashData();
  const items = [
    { label:'P&L Total',     value: stats.pnl >= 0 ? `+$${stats.pnl.toLocaleString()}` : `-$${Math.abs(stats.pnl).toLocaleString()}`, delta: stats.pnlPct, sub:`$${stats.expectancy}/trade`,   color:C.green,  icon:'💰' },
    { label:'Win Rate',      value:`${stats.winRate}%`,  delta: null, sub:`${stats.wins}W · ${stats.losses}L · ${stats.breakevens}BE`, color:C.cyan,   icon:'🎯' },
    { label:'Profit Factor', value: stats.profitFactor || '—', delta: null, sub:`Avg W $${stats.avgWin}`, color:C.teal, icon:'⚖️' },
    { label:'Avg R:R',       value: stats.avgRR,         delta: null, sub:'Average ratio',                  color:C.blue,   icon:'📐' },
    { label:'Sharpe',        value: stats.sharpe || '—', delta: null, sub:'Annualized',                    color:C.purple, icon:'📏' },
    { label:'Max Drawdown',  value:`${Math.abs(stats.maxDrawdown)}%`, delta: stats.maxDrawdown !== 0 ? stats.maxDrawdown : null, sub:'Since the beginning', color:C.danger, icon:'⚠️', invert:true },
    { label:'Expectancy',    value:`$${stats.expectancy}`, delta: null, sub:'Per trade',                  color:C.gold,   icon:'🧮' },
  ];
  return (
    <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:8,marginBottom:14}}>
      {items.map((k,i) => (
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
            {k.delta !== null && k.delta !== undefined && <Delta value={k.delta} invert={k.invert}/>}
          </div>
          <motion.div animate={{opacity:[0.3,0.7,0.3]}} transition={{duration:2.5,repeat:Infinity,delay:i*0.2}}
            style={{position:'absolute',bottom:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${k.color}50,transparent)`}}/>
        </Card>
      ))}
    </div>
  );
};

// ─── EQUITY CHART ─────────────────────────────────────────────────────────────
const EquityPanel = () => {
  const { stats } = useDashData();
  const data = stats.equityData || [];
  const [range, setRange] = useState('Tout');
  const pnl = stats.pnl || 0;
  const pnlPct = stats.pnlPct || 0;
  return (
    <Card custom={7} glow={C.green} hover={false} style={{padding:'20px 20px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
        <div>
          <SectionTitle color={C.green} icon="📈">Equity Curve</SectionTitle>
          <div style={{display:'flex',alignItems:'baseline',gap:10,marginTop:-6,marginBottom:10}}>
            <span style={{fontSize:28,fontWeight:900,fontFamily:'monospace',color:pnl>=0?C.green:C.danger,textShadow:`0 0 24px ${pnl>=0?C.green:C.danger}40`}}>
              {pnl>=0?'+':''}{pnl>=0?'$'+pnl.toLocaleString():'-$'+Math.abs(pnl).toLocaleString()}
            </span>
            {pnlPct !== 0 && <Delta value={pnlPct} suffix="%"/>}
            <span style={{fontSize:9,color:C.t3}}>since the beginning</span>
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
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:14}}>
        {[
          {l:'Max DD',  v:`${Math.abs(stats.maxDrawdown)}%`, c:C.danger},
          {l:'Best',v:`+$${stats.bestTrade?.toLocaleString()||0}`,c:C.green},
          {l:'Worst',    v:`-$${Math.abs(stats.worstTrade||0).toLocaleString()}`,c:C.danger},
          {l:'Trades',  v:`${stats.wins||0}W/${stats.losses||0}L`,c:C.cyan},
        ].map(x=>(
          <div key={x.l} style={{padding:'6px 10px',borderRadius:8,background:'rgba(255,255,255,0.03)',border:`1px solid ${C.brd}`,textAlign:'center'}}>
            <div style={{fontSize:7,color:C.t3,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:2}}>{x.l}</div>
            <div style={{fontSize:12,fontWeight:900,fontFamily:'monospace',color:x.c}}>{x.v}</div>
          </div>
        ))}
      </div>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={180}>
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

// ─── DAILY P&L ────────────────────────────────────────────────────────────────
const DailyPnl = () => {
  const { stats } = useDashData();
  const data = stats.dailyPnl || [];
  const bestDay = data.length ? data.reduce((a,b) => b.v > a.v ? b : a, data[0]) : null;
  return (
    <Card custom={8} glow={C.cyan} hover={false} style={{padding:'18px 18px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
        <SectionTitle color={C.cyan} icon="📅">Daily Performance</SectionTitle>
        {bestDay && (
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <Badge color={bestDay.v>=0?C.green:C.danger}>{bestDay.d} {bestDay.v>=0?'+':''}{bestDay.v}$</Badge>
          </div>
        )}
      </div>
      {data.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={130}>
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
          <div style={{display:'grid',gridTemplateColumns:`repeat(${data.length},1fr)`,gap:3,marginTop:8}}>
            {data.map((d,i)=>(
              <div key={i} style={{textAlign:'center',padding:'4px 0',borderRadius:6,background:'rgba(255,255,255,0.025)'}}>
                <div style={{fontSize:7,color:C.t3,marginBottom:1}}>{d.d}</div>
                <div style={{fontSize:8.5,fontWeight:900,fontFamily:'monospace',color:d.v>0?C.green:d.v<0?C.danger:C.t3}}>
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

// ─── PERFORMANCE SCORE ────────────────────────────────────────────────────────
const PerformanceScore = () => {
  const { stats } = useDashData();
  const radar = stats.radarData || [];
  const score = calcRegularityScore_from_stats(stats);
  const bars = [
    {l:'Win Rate',  v:Math.min(100,Math.round(stats.winRate||0)),   c:C.green},
    {l:'Profit F.', v:Math.min(100,Math.round((stats.profitFactor||0)*25)), c:C.cyan},
    {l:'Trades',    v:Math.min(100,Math.round((stats.totalTrades||0)*3)),   c:C.purple},
    {l:'Constance', v:Math.min(100,Math.round(stats.winRate||0)),            c:C.teal},
    {l:'Discipline',v:Math.min(100,100-Math.round((stats.streakLoss||0)*10)),c:C.warn},
    {l:'Activity',  v:Math.min(100,Math.round((stats.totalTrades||0)*5)),   c:C.blue},
  ];
  return (
    <Card custom={9} glow={C.purple} hover={false} style={{padding:'18px 18px'}}>
      <SectionTitle color={C.purple} icon="⚡">Performance Score</SectionTitle>
      <div style={{display:'flex',alignItems:'center',gap:16}}>
        <div style={{position:'relative',flexShrink:0,width:70,height:70}}>
          <svg width="70" height="70" viewBox="0 0 70 70">
            <circle cx="35" cy="35" r="30" fill="none" stroke="rgba(176,110,255,0.12)" strokeWidth="6"/>
            <circle cx="35" cy="35" r="30" fill="none" stroke="url(#sg)" strokeWidth="6"
              strokeDasharray={`${2*Math.PI*30*(score/100)} ${2*Math.PI*30*(1-score/100)}`}
              strokeLinecap="round" transform="rotate(-90 35 35)"/>
            <defs><linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="0%"><stop stopColor={C.cyan}/><stop offset="1" stopColor={C.purple}/></linearGradient></defs>
          </svg>
          <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
            <span style={{fontSize:19,fontWeight:900,color:C.t0,lineHeight:1}}>{score}</span>
            <span style={{fontSize:6.5,color:C.t3,fontWeight:700,letterSpacing:'0.5px'}}>SCORE</span>
          </div>
        </div>
        <div style={{flex:1,display:'flex',flexDirection:'column',gap:5}}>
          {bars.map(x=>(
            <div key={x.l} style={{display:'flex',alignItems:'center',gap:7}}>
              <span style={{fontSize:7.5,color:C.t3,width:52,flexShrink:0}}>{x.l}</span>
              <div style={{flex:1,height:3,borderRadius:2,background:'rgba(255,255,255,0.05)',overflow:'hidden'}}>
                <motion.div initial={{width:0}} animate={{width:`${x.v}%`}} transition={{duration:1,delay:0.3}}
                  style={{height:'100%',background:`linear-gradient(90deg,${x.c}66,${x.c})`,borderRadius:2}}/>
              </div>
              <span style={{fontSize:7.5,fontWeight:800,color:x.c,width:22,textAlign:'right',fontFamily:'monospace'}}>{x.v}</span>
            </div>
          ))}
        </div>
      </div>
      {radar.length > 0 && (
        <div style={{marginTop:12}}>
          <ResponsiveContainer width="100%" height={140}>
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

// ─── BIAIS ────────────────────────────────────────────────────────────────────
const BiaisPanel = () => {
  const { stats } = useDashData();
  const data = stats.biaisData || [];
  const dominant = data.length ? data.reduce((a,b)=>b.value>a.value?b:a, data[0]) : null;
  return (
    <Card custom={10} glow={C.teal} hover={false} style={{padding:'18px 18px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
        <SectionTitle color={C.teal} icon="🧭">Bias Analysis</SectionTitle>
        <Badge color={C.cyan}>{stats.totalTrades||0} trades</Badge>
      </div>
      {data.length > 0 ? (
        <>
          <div style={{display:'flex',gap:16,alignItems:'center',marginBottom:12}}>
            <div style={{position:'relative',flexShrink:0}}>
              <ResponsiveContainer width={110} height={110}>
                <PieChart>
                  <Pie data={data} cx="50%" cy="50%" innerRadius={32} outerRadius={50}
                    dataKey="value" startAngle={90} endAngle={-270} stroke="none" paddingAngle={2}>
                    {data.map((d,i)=><Cell key={i} fill={d.color}/>)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {dominant && (
                <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
                  <span style={{fontSize:8.5,fontWeight:900,color:dominant.color}}>{dominant.name}</span>
                  <span style={{fontSize:7,color:C.t3}}>{dominant.value}%</span>
                </div>
              )}
            </div>
            <div style={{flex:1,display:'flex',flexDirection:'column',gap:6}}>
              {data.map((d,i)=>(
                <div key={i}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                    <div style={{display:'flex',alignItems:'center',gap:5}}>
                      <div style={{width:7,height:7,borderRadius:2,background:d.color}}/>
                      <span style={{fontSize:9.5,fontWeight:700,color:C.t1}}>{d.name}</span>
                    </div>
                    <div style={{display:'flex',gap:8}}>
                      <span style={{fontSize:9,fontWeight:800,color:d.color,fontFamily:'monospace'}}>{d.value}%</span>
                      <span style={{fontSize:9,color:d.pnl?.startsWith('+')?C.green:C.danger,fontFamily:'monospace'}}>{d.pnl}</span>
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
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,padding:'10px',borderRadius:10,background:'rgba(255,255,255,0.025)',border:`1px solid ${C.brd}`}}>
            {[
              {l:'P&L Bull.',v:data.find(d=>d.name==='Bullish')?.pnl||'$0',c:C.green},
              {l:'P&L Bear.',v:data.find(d=>d.name==='Bearish')?.pnl||'$0',c:C.danger},
              {l:'Dominant', v:dominant?`${dominant.name}`:'-',c:dominant?.color||C.t3},
            ].map((x,i)=>(
              <div key={i} style={{textAlign:'center'}}>
                <div style={{fontSize:7,color:C.t3,marginBottom:2}}>{x.l}</div>
                <div style={{fontSize:11,fontWeight:900,color:x.c,fontFamily:'monospace'}}>{x.v}</div>
              </div>
            ))}
          </div>
        </>
      ) : <Empty label="No trades to analyze biases"/>}
    </Card>
  );
};

// ─── RENTABILITE GAUGE ────────────────────────────────────────────────────────
const RentabiliteGauge = () => {
  const { stats } = useDashData();
  const pct = stats.winRate || 0;
  const angle = (pct / 100) * 180 - 90;
  const color = pct >= 60 ? C.green : pct >= 45 ? C.warn : C.danger;
  return (
    <Card custom={11} glow={C.orange} hover={false} style={{padding:'18px 18px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
        <SectionTitle color={C.orange} icon="🔥">Profitability</SectionTitle>
        <Badge color={C.cyan}>{stats.totalTrades||0} trades</Badge>
      </div>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',paddingTop:4}}>
        <svg width="200" height="110" viewBox="0 0 200 110">
          <defs>
            <linearGradient id="gg" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={C.danger}/><stop offset="40%" stopColor={C.warn}/>
              <stop offset="70%" stopColor={C.teal}/><stop offset="100%" stopColor={C.green}/>
            </linearGradient>
          </defs>
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="14" strokeLinecap="round"/>
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#gg)" strokeWidth="14" strokeLinecap="round"
            strokeDasharray={`${pct/100*251} 251`}/>
          <g transform={`rotate(${angle},100,100)`}>
            <line x1="100" y1="100" x2="100" y2="30" stroke={C.t0} strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="100" cy="100" r="5" fill={C.t0}/>
          </g>
          <text x="16" y="115" fontSize="8" fill={C.t3} textAnchor="middle">0%</text>
          <text x="100" y="28" fontSize="8" fill={C.t3} textAnchor="middle">50%</text>
          <text x="184" y="115" fontSize="8" fill={C.t3} textAnchor="middle">100%</text>
        </svg>
        <div style={{marginTop:-8,textAlign:'center'}}>
          <div style={{fontSize:32,fontWeight:900,fontFamily:'monospace',color,lineHeight:1,textShadow:`0 0 28px ${color}50`}}>{pct}%</div>
          <div style={{fontSize:9,color:C.t3,letterSpacing:'2px',textTransform:'uppercase',marginTop:3}}>Win Rate</div>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,marginTop:12}}>
        {[
          {l:'Total',   v:stats.totalTrades||0},
          {l:'Wins',    v:stats.wins||0,    c:C.green},
          {l:'Losses',  v:stats.losses||0,  c:C.danger},
        ].map((x,i)=>(
          <div key={i} style={{textAlign:'center',padding:'5px 0',borderRadius:8,background:'rgba(255,255,255,0.03)',border:`1px solid ${C.brd}`}}>
            <div style={{fontSize:7,color:C.t3,marginBottom:1,textTransform:'uppercase',letterSpacing:'0.5px'}}>{x.l}</div>
            <div style={{fontSize:13,fontWeight:900,color:x.c||C.t1,fontFamily:'monospace'}}>{x.v}</div>
          </div>
        ))}
      </div>
    </Card>
  );
};

// ─── RECENT TRADES ────────────────────────────────────────────────────────────
const RecentTrades = () => {
  const { stats } = useDashData();
  const trades = stats.recentTrades || [];
  const [filter, setFilter] = useState('All');
  const filtered = filter === 'All' ? trades : trades.filter(t => t.res === filter);
  const weekPnl = trades.reduce((a,t)=>a+(t.pnl||0),0);
  const weekWr  = trades.length ? Math.round(trades.filter(t=>t.pnl>0).length/trades.length*100) : 0;
  return (
    <Card custom={12} glow={C.blue} hover={false} style={{padding:'18px 18px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <SectionTitle color={C.blue} icon="📋">Recent Trades</SectionTitle>
        <div style={{display:'flex',gap:4,alignItems:'center'}}>
          <div style={{display:'flex',gap:3}}>
            {['All','TP','SL','BE'].map(f=>(
              <button key={f} onClick={()=>setFilter(f)} style={{padding:'3px 8px',borderRadius:5,border:`1px solid ${filter===f?C.blue:C.brd}`,background:filter===f?`${C.blue}20`:'transparent',color:filter===f?C.blue:C.t3,fontSize:8.5,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>
      {trades.length > 0 && (
        <div style={{display:'flex',gap:8,marginBottom:12}}>
          <div style={{padding:'4px 10px',borderRadius:7,background:`${weekPnl>=0?C.green:C.danger}12`,border:`1px solid ${weekPnl>=0?C.green:C.danger}25`,display:'flex',gap:6,alignItems:'center'}}>
            <span style={{fontSize:8,color:C.t3}}>Recent P&L</span>
            <span style={{fontSize:10,fontWeight:900,color:weekPnl>=0?C.green:C.danger,fontFamily:'monospace'}}>{weekPnl>=0?'+':''}{weekPnl>=0?'$'+weekPnl.toLocaleString():'-$'+Math.abs(weekPnl).toLocaleString()}</span>
          </div>
          <div style={{padding:'4px 10px',borderRadius:7,background:`${C.cyan}12`,border:`1px solid ${C.cyan}25`,display:'flex',gap:6,alignItems:'center'}}>
            <span style={{fontSize:8,color:C.t3}}>Win rate</span>
            <span style={{fontSize:10,fontWeight:900,color:C.cyan,fontFamily:'monospace'}}>{weekWr}%</span>
          </div>
        </div>
      )}
      {filtered.length > 0 ? (
        <div style={{display:'flex',flexDirection:'column',gap:3}}>
          {filtered.map((t,i)=>{
            const rc = t.res==='TP'?C.green:t.res==='SL'?C.danger:C.warn;
            return (
              <motion.div key={t.id||i} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:i*0.05}}
                style={{display:'grid',gridTemplateColumns:'32px 1fr 1fr 1fr 1fr 1fr',alignItems:'center',gap:8,padding:'8px 10px',borderRadius:9,background:i%2===0?'rgba(255,255,255,0.018)':'rgba(255,255,255,0.010)',border:'1px solid rgba(255,255,255,0.035)',cursor:'pointer'}}
                whileHover={{background:'rgba(77,124,255,0.06)',borderColor:'rgba(77,124,255,0.18)'}}>
                <div style={{width:32,height:22,borderRadius:5,background:`${rc}15`,border:`1px solid ${rc}28`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <span style={{fontSize:6.5,fontWeight:900,color:rc}}>{t.pair?.slice(0,3)}</span>
                </div>
                <div>
                  <div style={{fontSize:10,fontWeight:800,color:C.t1}}>{t.pair}</div>
                  <div style={{fontSize:7.5,color:t.dir==='Long'?C.green:C.danger,fontWeight:700}}>{t.dir==='Long'?'▲':'▼'} {t.dir}</div>
                </div>
                <div style={{textAlign:'center'}}>
                  <div style={{display:'inline-block',padding:'1px 6px',borderRadius:4,background:`${rc}18`,border:`1px solid ${rc}30`,fontSize:8,fontWeight:800,color:rc}}>{t.res}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:9.5,fontWeight:900,fontFamily:'monospace',color:t.rr>=0?C.green:C.danger}}>{t.rr>=0?'+':''}{t.rr}R</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:9.5,fontWeight:900,fontFamily:'monospace',color:t.pnl>=0?C.green:C.danger}}>{t.pnl>=0?'+':''}{t.pnl}$</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:7.5,color:C.purple}}>{t.session}</div>
                  <div style={{fontSize:7,color:C.t3}}>{t.date?.slice(5)}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : <Empty label={filter==='All'?"No trades recorded":`Aucun trade ${filter}`}/>}
    </Card>
  );
};

// ─── SESSIONS ─────────────────────────────────────────────────────────────────
const SessionPanel = () => {
  const { stats } = useDashData();
  const data = stats.sessionData || [];
  if (!data.length) return (
    <Card custom={13} glow={C.purple} hover={false} style={{padding:'18px 18px'}}>
      <SectionTitle color={C.purple} icon="🌍">Sessions</SectionTitle>
      <Empty/>
    </Card>
  );
  const maxPnl = Math.max(...data.map(x=>x.pnl),1);
  return (
    <Card custom={13} glow={C.purple} hover={false} style={{padding:'18px 18px'}}>
      <SectionTitle color={C.purple} icon="🌍">Sessions</SectionTitle>
      <div style={{display:'flex',flexDirection:'column',gap:6}}>
        {data.map((s,i)=>{
          const total = s.tp+s.sl+s.be;
          const wr = total ? Math.round(s.tp/total*100) : 0;
          const pct = s.pnl/maxPnl*100;
          return (
            <div key={i} style={{padding:'9px 11px',borderRadius:10,background:'rgba(255,255,255,0.025)',border:`1px solid ${C.brd}`,position:'relative',overflow:'hidden'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                <span style={{fontSize:10,fontWeight:800,color:C.t1}}>{s.s}</span>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <span style={{fontSize:8.5,fontWeight:800,fontFamily:'monospace',color:s.pnl>=0?C.green:C.danger}}>{s.pnl>=0?'+':'-'}${Math.abs(Math.round(s.pnl)).toLocaleString()}</span>
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
};

// ─── PAIRS ────────────────────────────────────────────────────────────────────
const PairPanel = () => {
  const { stats } = useDashData();
  const data = stats.pairData || [];
  return (
    <Card custom={14} glow={C.gold} hover={false} style={{padding:'18px 18px'}}>
      <SectionTitle color={C.gold} icon="💱">By Pair</SectionTitle>
      {data.length > 0 ? (
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 32px 42px 60px',gap:8,padding:'0 8px 6px',borderBottom:`1px solid ${C.brd}`}}>
            {['Pair','#','WR','P&L'].map(h=><span key={h} style={{fontSize:7,fontWeight:800,color:C.t3,textTransform:'uppercase',letterSpacing:'0.5px',textAlign:'right'}}>{h}</span>)}
          </div>
          {data.map((p,i)=>(
            <motion.div key={i} initial={{opacity:0,x:8}} animate={{opacity:1,x:0}} transition={{delay:0.1+i*0.06}}
              style={{display:'grid',gridTemplateColumns:'1fr 32px 42px 60px',gap:8,padding:'7px 8px',borderRadius:8,background:'rgba(255,255,255,0.02)',alignItems:'center',cursor:'pointer'}}
              whileHover={{background:'rgba(255,215,0,0.05)'}}>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <div style={{width:6,height:6,borderRadius:'50%',background:p.col,boxShadow:`0 0 5px ${p.col}`,flexShrink:0}}/>
                <span style={{fontSize:10.5,fontWeight:800,color:C.t1}}>{p.p}</span>
              </div>
              <span style={{fontSize:9,color:C.t2,fontFamily:'monospace',textAlign:'right'}}>{p.n}</span>
              <span style={{fontSize:9,fontWeight:800,fontFamily:'monospace',color:p.wr>=65?C.green:p.wr>=50?C.warn:C.danger,textAlign:'right'}}>{p.wr}%</span>
              <span style={{fontSize:10,fontWeight:900,fontFamily:'monospace',color:p.pnl>=0?C.green:C.danger,textAlign:'right'}}>
                {p.pnl>=0?'+':''}{p.pnl>=0?'$'+Math.round(p.pnl).toLocaleString():'-$'+Math.abs(Math.round(p.pnl)).toLocaleString()}
              </span>
            </motion.div>
          ))}
        </div>
      ) : <Empty/>}
    </Card>
  );
};

// ─── HEATMAP ──────────────────────────────────────────────────────────────────
const TimeHeatmap = () => {
  const { stats } = useDashData();
  const data  = stats.heatmap || [];
  const HOURS = ['8h','10h','12h','14h','16h'];
  const maxV  = Math.max(...data.flatMap(w=>Object.values(w.h).map(Math.abs)),1);
  return (
    <Card custom={15} glow={C.teal} hover={false} style={{padding:'18px 18px'}}>
      <SectionTitle color={C.teal} icon="🌡️">Hour × Day Heatmap</SectionTitle>
      {data.length > 0 ? (
        <div style={{overflowX:'auto'}}>
          <table style={{borderCollapse:'separate',borderSpacing:3,minWidth:'100%'}}>
            <thead>
              <tr>
                <th style={{width:44}}/>
                {HOURS.map(h=><th key={h} style={{fontSize:7.5,fontWeight:700,color:C.t3,textAlign:'center',padding:'0 2px 5px'}}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.map((row,ri)=>(
                <tr key={ri}>
                  <td style={{fontSize:8.5,fontWeight:700,color:C.t2,paddingRight:6,textAlign:'right'}}>{row.day}</td>
                  {HOURS.map(h=>{
                    const v = row.h[h]||0;
                    const intensity = Math.min(0.8,Math.abs(v)/maxV*0.8);
                    const bg = v>0?`rgba(0,255,136,${intensity*0.65})`:v<0?`rgba(255,61,87,${intensity*0.55})`:'rgba(255,255,255,0.03)';
                    const tc = v>0?C.green:v<0?C.danger:C.t4;
                    return (
                      <td key={h} style={{padding:2}}>
                        <motion.div whileHover={{scale:1.15}} style={{width:38,height:34,borderRadius:7,background:bg,border:`1px solid ${v!==0?'rgba(255,255,255,0.07)':C.brd}`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
                          {v!==0 ? (
                            <>
                              <div style={{fontSize:8.5,fontWeight:900,fontFamily:'monospace',color:tc,lineHeight:1}}>{v>0?'+':''}${Math.abs(Math.round(v))}</div>
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

// ─── LIVE TICKER ─────────────────────────────────────────────────────────────
const LiveTicker = () => {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} transition={{duration:0.4}}
      style={{marginBottom:10,padding:'8px 16px',borderRadius:10,background:'linear-gradient(90deg,rgba(0,255,136,0.06),rgba(6,230,255,0.04))',border:`1px solid ${C.green}25`,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <motion.div animate={{opacity:[1,0.3,1]}} transition={{duration:1.2,repeat:Infinity}}
          style={{width:7,height:7,borderRadius:'50%',background:C.green,boxShadow:`0 0 8px ${C.green}`,flexShrink:0}}/>
        <span style={{fontSize:9.5,fontWeight:700,color:C.green}}>Live</span>
        <div style={{width:1,height:14,background:C.brd}}/>
        <span style={{fontSize:9.5,color:C.t2}}>EURUSD · Long · 1.08320</span>
        <span style={{fontSize:10,fontWeight:900,color:C.green,fontFamily:'monospace'}}>+$142</span>
        <Badge color={C.cyan}>+0.8R</Badge>
      </div>
      <div style={{display:'flex',gap:6,alignItems:'center'}}>
        <span style={{fontSize:8,color:C.t3}}>SL: 1.08180 · TP: 1.08680</span>
        <button onClick={()=>setVisible(false)} style={{background:'transparent',border:'none',color:C.t3,cursor:'pointer',fontSize:14,lineHeight:1}}>×</button>
      </div>
    </motion.div>
  );
};

// ─── GOALS ────────────────────────────────────────────────────────────────────
const GoalProgress = () => {
  const { stats } = useDashData();
  const goals = [
    {l:'Monthly goal',  cur:stats.pnl||0,        target:10000, c:C.cyan,   prefix:'$'},
    {l:'Target Win Rate',    cur:stats.winRate||0,     target:70,    c:C.green,  suffix:'%'},
    {l:'Trades this month',    cur:stats.totalTrades||0, target:20,    c:C.purple},
    {l:'Max Drawdown',      cur:Math.abs(stats.maxDrawdown||0), target:20, c:C.danger, invert:true, suffix:'%'},
  ];
  return (
    <Card custom={16} glow={C.cyan} hover={false} style={{padding:'18px 18px'}}>
      <SectionTitle color={C.cyan} icon="🏆">Monthly Goals</SectionTitle>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {goals.map((g,i)=>{
          const pct = Math.min(100,(g.cur/g.target)*100);
          const ok = g.invert ? g.cur <= g.target : pct >= 100;
          const c = ok ? C.green : pct >= 70 ? g.c : C.warn;
          const display = g.suffix==='%' ? `${g.cur}%` : g.prefix==='$' ? (g.cur>=0?`+$${g.cur.toLocaleString()}`:`-$${Math.abs(g.cur).toLocaleString()}`) : g.cur;
          const target  = g.suffix==='%' ? `${g.target}%` : `$${g.target.toLocaleString()}`;
          return (
            <div key={i}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                <span style={{fontSize:9.5,fontWeight:700,color:C.t1}}>{g.l}</span>
                <div style={{display:'flex',gap:6,alignItems:'center'}}>
                  <span style={{fontSize:9,fontFamily:'monospace',color:c,fontWeight:800}}>{display}</span>
                  <span style={{fontSize:7.5,color:C.t3}}>/ {target}</span>
                  {ok && <span style={{fontSize:10}}>✅</span>}
                </div>
              </div>
              <div style={{height:5,borderRadius:3,background:'rgba(255,255,255,0.05)',overflow:'hidden'}}>
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

// ─── JOURNAL NOTE ─────────────────────────────────────────────────────────────
const JournalNote = () => (
  <Card custom={17} glow={C.warn} hover={false} style={{padding:'18px 18px'}}>
    <SectionTitle color={C.warn} icon="📝">Today's Note</SectionTitle>
    <div style={{fontSize:9.5,color:C.t2,lineHeight:1.75,background:'rgba(255,255,255,0.02)',borderRadius:10,padding:'10px 12px',border:`1px solid ${C.brd}`,marginBottom:10,minHeight:64}}>
      <span style={{color:C.gold,fontWeight:700}}>Strengths :</span> Excellent reading of the London open context. Clean EURUSD reaction on the 1H RB.
      <br/><span style={{color:C.danger,fontWeight:700}}>To improve :</span> Wait for confirmation after CISD before entering.
    </div>
    <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
      {['Discipline ✓','Patience ✓','FOMO ✗','Overtrading ✗'].map((t,i)=>(
        <span key={i} style={{padding:'3px 8px',borderRadius:5,fontSize:8,fontWeight:700,background:t.includes('✓')?`${C.green}12`:`${C.danger}12`,border:`1px solid ${t.includes('✓')?C.green:C.danger}25`,color:t.includes('✓')?C.green:C.danger}}>
          {t}
        </span>
      ))}
    </div>
  </Card>
);

// ─── MARKETFLOW RANK ──────────────────────────────────────────────────────────
const MF_RANKS = [
  { rank:'Iron',        min:0,   max:19,  color:'#8B7355', icon:'🔩', desc:'Beginner' },
  { rank:'Bronze',      min:20,  max:39,  color:'#CD7F32', icon:'🥉', desc:'Progressing' },
  { rank:'Silver',      min:40,  max:59,  color:'#C0C0C0', icon:'🥈', desc:'Regular' },
  { rank:'Gold',        min:60,  max:74,  color:'#FFD700', icon:'🥇', desc:'Performing' },
  { rank:'Platinum',    min:75,  max:84,  color:'#00F5D4', icon:'💎', desc:'Expert' },
  { rank:'Diamond',     min:85,  max:92,  color:'#06E6FF', icon:'💠', desc:'Elite' },
  { rank:'Master',      min:93,  max:97,  color:'#B06EFF', icon:'👑', desc:'Master Trader' },
  { rank:'Grandmaster', min:98,  max:100, color:'#FF4DC4', icon:'⚡', desc:'Legend' },
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

// ─── TRADING CALENDAR ─────────────────────────────────────────────────────────
const TradingCalendar = () => {
  const { trades: allTrades, stats } = useDashData();
  const [currentMonth, setCurrentMonth] = useState(()=>new Date());
  const year  = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DAYS   = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
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
    <Card custom={18} glow={rank.color} hover={false} style={{padding:'20px 22px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16,flexWrap:'wrap',gap:12}}>
        <SectionTitle color={rank.color} icon="📅">Trading Calendar</SectionTitle>
        <div style={{display:'flex',alignItems:'center',gap:12,background:'rgba(255,255,255,0.03)',border:`1px solid ${rank.color}30`,borderRadius:12,padding:'8px 14px'}}>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:22}}>{rank.icon}</div>
            <div style={{fontSize:9,color:rank.color,fontWeight:800,letterSpacing:'0.06em',textTransform:'uppercase',marginTop:2}}>{rank.rank}</div>
          </div>
          <div>
            <div style={{display:'flex',alignItems:'baseline',gap:4}}>
              <span style={{fontSize:28,fontWeight:900,color:rank.color,lineHeight:1}}>{score}</span>
              <span style={{fontSize:12,color:C.t3}}>/100</span>
            </div>
            <div style={{fontSize:10,color:C.t2,marginTop:2}}>{rank.desc}</div>
            {nextRank && (
              <div style={{marginTop:6}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                  <span style={{fontSize:9,color:C.t3}}>→ {nextRank.rank}</span>
                  <span style={{fontSize:9,color:C.t3}}>{Math.max(0,nextRank.min-score)} pts</span>
                </div>
                <div style={{width:120,height:4,background:'rgba(255,255,255,0.06)',borderRadius:2,overflow:'hidden'}}>
                  <div style={{width:`${((score-rank.min)/(rank.max-rank.min+1))*100}%`,height:'100%',background:`linear-gradient(90deg,${rank.color},${nextRank.color})`,borderRadius:2,transition:'width 1s ease'}}/>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{display:'flex',gap:16,marginBottom:16,flexWrap:'wrap'}}>
        {[
          {l:'Monthly P&L',    v:monthPnl>=0?`+$${Math.round(monthPnl).toLocaleString()}`:`-$${Math.abs(Math.round(monthPnl)).toLocaleString()}`, c:monthPnl>=0?C.green:C.danger},
          {l:'Trading days',   v:tradingDays,         c:C.cyan},
          {l:'Trades this month', v:monthTrades.length,  c:C.purple},
        ].map((s,i)=>(
          <div key={i} style={{background:'rgba(255,255,255,0.03)',borderRadius:8,padding:'8px 14px',border:`1px solid ${C.brd}`}}>
            <div style={{fontSize:9,color:C.t3,fontWeight:600,marginBottom:3,textTransform:'uppercase',letterSpacing:'0.05em'}}>{s.l}</div>
            <div style={{fontSize:16,fontWeight:800,color:s.c}}>{s.v}</div>
          </div>
        ))}
      </div>

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <button onClick={()=>setCurrentMonth(new Date(year,month-1,1))} style={{background:'rgba(255,255,255,0.04)',border:`1px solid ${C.brd}`,borderRadius:8,color:C.t2,cursor:'pointer',padding:'5px 12px',fontSize:13}}>‹</button>
        <span style={{fontSize:14,fontWeight:700,color:C.t0}}>{MONTHS[month]} {year}</span>
        <button onClick={()=>setCurrentMonth(new Date(year,month+1,1))} style={{background:'rgba(255,255,255,0.04)',border:`1px solid ${C.brd}`,borderRadius:8,color:C.t2,cursor:'pointer',padding:'5px 12px',fontSize:13}}>›</button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4,marginBottom:6}}>
        {DAYS.map(d=><div key={d} style={{textAlign:'center',fontSize:9,color:C.t3,fontWeight:700,letterSpacing:'0.05em',textTransform:'uppercase',padding:'4px 0'}}>{d}</div>)}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4}}>
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
            <div key={day} style={{background:bg,border:`1px solid ${isToday?rank.color:border}`,borderRadius:8,padding:'6px 4px',minHeight:52,textAlign:'center',position:'relative',boxShadow:isToday?`0 0 8px ${rank.color}40`:'none',transition:'all 0.15s',cursor:hasData?'pointer':'default'}}>
              <div style={{fontSize:10,fontWeight:isToday?800:500,color:isToday?rank.color:isWeekend?C.t4:C.t2,marginBottom:3}}>{day}</div>
              {hasData&&(
                <>
                  <div style={{fontSize:9,fontWeight:700,color:pnlColor}}>
                    {dayPnl>=0?'+':''}{Math.abs(dayPnl)>=1000?`${(dayPnl/1000).toFixed(1)}k`:Math.round(dayPnl)}$
                  </div>
                  <div style={{fontSize:8,color:C.t3,marginTop:1}}>{dayTrades.length}T</div>
                  <div style={{display:'flex',justifyContent:'center',gap:2,marginTop:3}}>
                    {dayTrades.slice(0,3).map((_,di)=>(
                      <div key={di} style={{width:4,height:4,borderRadius:'50%',background:dayPnl>0?C.green:C.danger,opacity:0.8}}/>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div style={{display:'flex',gap:16,marginTop:14,flexWrap:'wrap'}}>
        {[{c:C.green,'l':'Profitable day'},{c:C.danger,l:'Losing day'},{c:C.warn,l:'Breakeven'},{c:C.t4,l:'No trades'}].map(({c,l})=>(
          <div key={l} style={{display:'flex',alignItems:'center',gap:5}}>
            <div style={{width:10,height:10,borderRadius:3,background:`${c}30`,border:`1px solid ${c}60`}}/>
            <span style={{fontSize:9,color:C.t3}}>{l}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
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
      <div style={{background:'var(--bg,#0B0F1A)',minHeight:'100%',width:'100%',fontFamily:"'SF Pro Display','Segoe UI',system-ui,sans-serif",color:'var(--t1,#E8EEFF)',position:'relative'}}>
        {/* BG ambiance */}
        <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:0}}>
          <div style={{position:'absolute',top:0,left:'20%',width:600,height:400,background:'radial-gradient(ellipse,rgba(77,124,255,0.06) 0%,transparent 70%)',filter:'blur(40px)'}}/>
          <div style={{position:'absolute',bottom:0,right:'10%',width:500,height:350,background:'radial-gradient(ellipse,rgba(0,255,136,0.04) 0%,transparent 70%)',filter:'blur(40px)'}}/>
          <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(77,124,255,0.008) 1px,transparent 1px),linear-gradient(90deg,rgba(77,124,255,0.008) 1px,transparent 1px)',backgroundSize:'52px 52px'}}/>
        </div>

        <div style={{position:'relative',zIndex:1,padding:'22px 24px 40px',width:'100%',boxSizing:'border-box'}}>

          {/* HEADER */}
          <motion.div initial={{opacity:0,y:-12}} animate={{opacity:1,y:0}} transition={{duration:0.45}}
            style={{marginBottom:16,display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12}}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
                <motion.div animate={{rotate:[0,5,-5,0]}} transition={{duration:4,repeat:Infinity,repeatDelay:8}} style={{fontSize:22}}>👋</motion.div>
                <h1 style={{margin:0,fontSize:20,fontWeight:900,color:C.t0,letterSpacing:'-0.5px'}}>
                  {greeting}, <span style={{background:C.gradCyan,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Trader</span>
                </h1>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:10,paddingLeft:2}}>
                <span style={{fontSize:10,color:C.t3}}>{(()=>{
                  const now=new Date();
                  const days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
                  const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
                  const startOfYear=new Date(now.getFullYear(),0,1);
                  const week=Math.ceil(((now-startOfYear)/86400000+startOfYear.getDay()+1)/7);
                  return `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()} · Week ${week}`;
                })()}</span>
                <div style={{width:4,height:4,borderRadius:'50%',background:C.t4}}/>
                <motion.div animate={{opacity:[1,0.4,1]}} transition={{duration:1.5,repeat:Infinity}} style={{display:'flex',alignItems:'center',gap:4}}>
                  <div style={{width:6,height:6,borderRadius:'50%',background:C.green,boxShadow:`0 0 6px ${C.green}`}}/>
                  <span style={{fontSize:9.5,color:C.green,fontWeight:700}}>{(()=>{
                    const h=new Date().getUTCHours();
                    if(h>=0&&h<7)  return 'Sydney · Session Active';
                    if(h>=2&&h<9)  return 'Tokyo · Session Active';
                    if(h>=7&&h<16) return 'London · Session Active';
                    if(h>=13&&h<22)return 'New York · Session Active';
                    return 'Market Closed';
                  })()}</span>
                </motion.div>
              </div>
            </div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              {/* Summary stats */}
              <div style={{padding:'6px 14px',borderRadius:8,background:'rgba(255,255,255,0.04)',border:`1px solid ${C.brd}`,display:'flex',gap:16,alignItems:'center'}}>
                <div style={{textAlign:'center'}}>
                  <div style={{fontSize:8,color:C.t3,textTransform:'uppercase',letterSpacing:'0.5px'}}>Trades</div>
                  <div style={{fontSize:13,fontWeight:800,color:C.t1}}>{stats.totalTrades||0}</div>
                </div>
                <div style={{width:1,height:24,background:C.brd}}/>
                <div style={{textAlign:'center'}}>
                  <div style={{fontSize:8,color:C.t3,textTransform:'uppercase',letterSpacing:'0.5px'}}>P&L</div>
                  <div style={{fontSize:13,fontWeight:800,color:stats.pnl>=0?C.green:C.danger}}>
                    {stats.pnl>=0?'+':''}{stats.pnl>=0?'$'+stats.pnl.toLocaleString():'-$'+Math.abs(stats.pnl).toLocaleString()}
                  </div>
                </div>
                <div style={{width:1,height:24,background:C.brd}}/>
                <div style={{textAlign:'center'}}>
                  <div style={{fontSize:8,color:C.t3,textTransform:'uppercase',letterSpacing:'0.5px'}}>WR</div>
                  <div style={{fontSize:13,fontWeight:800,color:C.cyan}}>{stats.winRate||0}%</div>
                </div>
              </div>
            </div>
          </motion.div>

          <LiveTicker/>
          <KpiStrip/>

          <div style={{display:'grid',gridTemplateColumns:'2fr 1.1fr',gap:12,marginBottom:12}}>
            <EquityPanel/>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <DailyPnl/>
              <GoalProgress/>
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1.2fr 1fr 1fr',gap:12,marginBottom:12}}>
            <PerformanceScore/>
            <BiaisPanel/>
            <RentabiliteGauge/>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:12,marginBottom:12}}>
            <RecentTrades/>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <SessionPanel/>
              <PairPanel/>
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1.6fr 1fr',gap:12,marginBottom:12}}>
            <TimeHeatmap/>
            <JournalNote/>
          </div>

          <div style={{marginBottom:12}}>
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