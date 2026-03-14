import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine, PieChart, Pie, RadarChart,
  Radar, PolarGrid, PolarAngleAxis
} from 'recharts';
import { useTradingContext } from '../context/TradingContext';

const DashboardDataCtx = React.createContext(null);
const useDashData = () => React.useContext(DashboardDataCtx) || {};

const C = {
  bg:'#0B0F1A',bgCard:'#0E1525',bgHigh:'#131D30',bgGlass:'rgba(14,21,37,0.92)',
  cyan:'#06E6FF',teal:'#00F5D4',green:'#00FF88',blue:'#4D7CFF',purple:'#B06EFF',
  pink:'#FF4DC4',gold:'#FFD700',danger:'#FF3D57',warn:'#FFB31A',orange:'#FF6B35',
  t0:'#FFFFFF',t1:'#E8EEFF',t2:'#7A90B8',t3:'#334566',t4:'#1A2440',
  brd:'#162034',brdHi:'#1E2E48',
  gradCyan:'linear-gradient(135deg,#06E6FF,#00FF88)',
  gradPurple:'linear-gradient(135deg,#B06EFF,#4D7CFF)',
  gradWarm:'linear-gradient(135deg,#FFD700,#FF6B35)',
  gradDanger:'linear-gradient(135deg,#FF3D57,#B06EFF)',
};

const Card = ({ children, style={}, glow=null, hover=false, custom=0, onClick }) => (
  <motion.div
    variants={{hidden:{opacity:0,y:16},visible:(i)=>({opacity:1,y:0,transition:{delay:i*0.05,duration:0.5,ease:[0.16,1,0.3,1]}})}}
    initial="hidden" animate="visible" custom={custom}
    whileHover={hover?{y:-2,boxShadow:`0 8px 50px ${glow||C.cyan}15`}:{}}
    onClick={onClick}
    style={{background:'linear-gradient(145deg,rgba(14,21,37,0.95),rgba(11,16,28,0.98))',borderRadius:16,border:`1px solid ${glow?glow+'22':C.brd}`,boxShadow:`0 2px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)`,position:'relative',overflow:'hidden',cursor:onClick?'pointer':'default',...style}}>
    {glow&&<div style={{position:'absolute',top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${glow}55,transparent)`,pointerEvents:'none'}}/>}
    <div style={{position:'relative',zIndex:1,height:'100%'}}>{children}</div>
  </motion.div>
);

const SectionTitle = ({children,color=C.cyan,icon}) => (
  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
    {icon&&<span style={{fontSize:13,filter:`drop-shadow(0 0 6px ${color})`}}>{icon}</span>}
    <div style={{width:2,height:13,background:color,borderRadius:2,flexShrink:0}}/>
    <span style={{fontSize:11.5,fontWeight:800,color:C.t1,letterSpacing:'-0.2px'}}>{children}</span>
  </div>
);

const Badge = ({children,color}) => (
  <span style={{fontSize:8.5,fontWeight:800,padding:'2px 7px',borderRadius:4,color,background:`${color}18`,border:`1px solid ${color}30`,textTransform:'uppercase',letterSpacing:'0.5px',whiteSpace:'nowrap'}}>{children}</span>
);

const Delta = ({value,suffix='%',invert=false}) => {
  const pos = invert?value<0:value>=0;
  return <span style={{fontSize:9,fontWeight:700,padding:'1px 6px',borderRadius:4,color:pos?C.green:C.danger,background:pos?`${C.green}15`:`${C.danger}15`,border:`1px solid ${pos?C.green:C.danger}25`}}>{pos?'▲':'▼'} {Math.abs(value)}{suffix}</span>;
};

const ChartTip = ({active,payload,label,prefix='$'}) => {
  if(!active||!payload?.length) return null;
  const v = payload[0]?.value;
  return <div style={{background:C.bgHigh,border:`1px solid ${C.brdHi}`,borderRadius:10,padding:'8px 12px',fontSize:11,boxShadow:'0 8px 28px rgba(0,0,0,0.8)'}}><div style={{color:C.t3,fontSize:8.5,marginBottom:3}}>{label}</div><div style={{color:v>=0?C.green:C.danger,fontWeight:900,fontFamily:'monospace'}}>{v>=0?'+':''}{prefix}{typeof v==='number'?v.toLocaleString():v}</div></div>;
};

const KPI_ITEMS = [
  {label:'P&L Total',value:'+$16 590',delta:8.2,sub:'$371/trade',color:C.green,icon:'💰'},
  {label:'Win Rate',value:'76.5%',delta:2.8,sub:'36W · 8L · 3BE',color:C.cyan,icon:'🎯'},
  {label:'Profit Factor',value:'21.74',delta:7.5,sub:'Avg W $116',color:C.teal,icon:'⚖️'},
  {label:'Avg R:R',value:'1:1.6',delta:0.0,sub:'Objectif x1.2',color:C.blue,icon:'📐'},
  {label:'Sharpe',value:'10.89',delta:null,sub:'Annualisé',color:C.purple,icon:'📏'},
  {label:'Max Drawdown',value:'-31.6%',delta:-1.9,sub:'Recovery ×1.4',color:C.danger,icon:'⚠️',invert:true},
  {label:'Expectancy',value:'$976',delta:-1.8,sub:'Par trade',color:C.gold,icon:'🧮'},
];

const KpiStrip = () => (
  <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:8,marginBottom:14}}>
    {KPI_ITEMS.map((k,i)=>(
      <Card key={k.label} custom={i} glow={k.color} hover style={{padding:'13px 14px',minHeight:82}}>
        <div style={{position:'absolute',top:-20,right:-12,width:60,height:60,borderRadius:'50%',background:`radial-gradient(circle,${k.color}20,transparent 70%)`,filter:'blur(10px)',pointerEvents:'none'}}/>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:5}}>
          <span style={{fontSize:7,fontWeight:800,color:C.t3,letterSpacing:'1.2px',textTransform:'uppercase',lineHeight:1.4}}>{k.label}</span>
          <span style={{fontSize:14,filter:`drop-shadow(0 0 5px ${k.color})`}}>{k.icon}</span>
        </div>
        <div style={{fontSize:19,fontWeight:900,fontFamily:'monospace',color:k.color,lineHeight:1,marginBottom:4,textShadow:`0 0 18px ${k.color}30`}}>{k.value}</div>
        <div style={{display:'flex',alignItems:'center',gap:5,flexWrap:'wrap'}}>
          <span style={{fontSize:7.5,color:C.t2}}>{k.sub}</span>
          {k.delta!==null&&<Delta value={k.delta} invert={k.invert}/>}
        </div>
        <motion.div animate={{opacity:[0.3,0.7,0.3]}} transition={{duration:2.5,repeat:Infinity,delay:i*0.2}} style={{position:'absolute',bottom:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${k.color}50,transparent)`}}/>
      </Card>
    ))}
  </div>
);

const EquityPanel = () => {
  const {EQUITY_DATA=[]} = useDashData();
  const [range,setRange] = useState('1A');
  // ── FIX: guard si EQUITY_DATA vide ──
  const last     = EQUITY_DATA.length ? EQUITY_DATA[EQUITY_DATA.length-1].v : 0;
  const first    = EQUITY_DATA.length ? EQUITY_DATA[0].v : 0;
  const gain     = last - first;
  const gainPct  = first ? ((gain/first)*100).toFixed(1) : '0.0';
  return (
    <Card custom={7} glow={C.green} hover={false} style={{padding:'20px 20px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
        <div>
          <SectionTitle color={C.green} icon="📈">Equity Curve</SectionTitle>
          <div style={{display:'flex',alignItems:'baseline',gap:10,marginTop:-6,marginBottom:10}}>
            <span style={{fontSize:28,fontWeight:900,fontFamily:'monospace',color:C.green,textShadow:`0 0 24px ${C.green}40`}}>+$16,590</span>
            <Delta value={gainPct} suffix="%"/>
            <span style={{fontSize:9,color:C.t3}}>depuis le début</span>
          </div>
        </div>
        <div style={{display:'flex',gap:3}}>
          {['1M','3M','6M','1A','Tout'].map(r=>(
            <button key={r} onClick={()=>setRange(r)} style={{padding:'4px 9px',borderRadius:6,border:`1px solid ${range===r?C.green:C.brd}`,background:range===r?`${C.green}18`:'transparent',color:range===r?C.green:C.t3,fontSize:9,fontWeight:700,cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s'}}>{r}</button>
          ))}
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:14}}>
        {[{l:'Max DD',v:'-31.6%',c:C.danger},{l:'Meilleur',v:'+$4,500',c:C.green},{l:'Pire',v:'-$280',c:C.danger},{l:'Trades',v:'1/1',c:C.cyan}].map(x=>(
          <div key={x.l} style={{padding:'6px 10px',borderRadius:8,background:'rgba(255,255,255,0.03)',border:`1px solid ${C.brd}`,textAlign:'center'}}>
            <div style={{fontSize:7,color:C.t3,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:2}}>{x.l}</div>
            <div style={{fontSize:12,fontWeight:900,fontFamily:'monospace',color:x.c}}>{x.v}</div>
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={EQUITY_DATA} margin={{top:4,right:4,bottom:0,left:0}}>
          <defs>
            <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.green} stopOpacity={0.35}/><stop offset="100%" stopColor={C.green} stopOpacity={0.01}/></linearGradient>
            <linearGradient id="el" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={C.cyan}/><stop offset="60%" stopColor={C.green}/><stop offset="100%" stopColor={C.teal}/></linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="4 4" vertical={false}/>
          <XAxis dataKey="d" tick={{fill:C.t3,fontSize:7.5}} axisLine={false} tickLine={false}/>
          <YAxis tick={{fill:C.t3,fontSize:7}} axisLine={false} tickLine={false} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} width={36}/>
          <Tooltip content={<ChartTip/>}/>
          <Area type="monotone" dataKey="v" stroke="url(#el)" strokeWidth={2.5} fill="url(#eg)" dot={false} activeDot={{r:5,fill:C.green,stroke:'#fff',strokeWidth:2}}/>
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
};

const DAILY_PNL = [
  {d:'Lun',v:0},{d:'Mar',v:0},{d:'Mer',v:0},{d:'Jeu',v:0},{d:'Ven',v:0},{d:'Sam',v:0},{d:'Dim',v:16590},
];

const DailyPnl = () => (
  <Card custom={8} glow={C.cyan} hover={false} style={{padding:'18px 18px'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
      <SectionTitle color={C.cyan} icon="📅">Performance par jour</SectionTitle>
      <div style={{display:'flex',gap:8,alignItems:'center'}}><Badge color={C.green}>Sun +$16590</Badge><Badge color={C.warn}>Mon $0</Badge></div>
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
    <div style={{display:'grid',gridTemplateColumns:`repeat(${DAILY_PNL.length},1fr)`,gap:3,marginTop:8}}>
      {DAILY_PNL.map((d,i)=>(
        <div key={i} style={{textAlign:'center',padding:'4px 0',borderRadius:6,background:'rgba(255,255,255,0.025)'}}>
          <div style={{fontSize:7,color:C.t3,marginBottom:1}}>{d.d}</div>
          <div style={{fontSize:8.5,fontWeight:900,fontFamily:'monospace',color:d.v>0?C.green:d.v<0?C.danger:C.t3}}>{d.v>0?'+':''}${Math.abs(d.v)}</div>
        </div>
      ))}
    </div>
  </Card>
);

const PerformanceScore = () => {
  const {RADAR_DATA=[]} = useDashData();
  return (
    <Card custom={9} glow={C.purple} hover={false} style={{padding:'18px 18px'}}>
      <SectionTitle color={C.purple} icon="⚡">Performance Score</SectionTitle>
      <div style={{display:'flex',alignItems:'center',gap:16}}>
        <div style={{position:'relative',flexShrink:0,width:70,height:70}}>
          <svg width="70" height="70" viewBox="0 0 70 70">
            <circle cx="35" cy="35" r="30" fill="none" stroke="rgba(176,110,255,0.12)" strokeWidth="6"/>
            <circle cx="35" cy="35" r="30" fill="none" stroke="url(#sg)" strokeWidth="6" strokeDasharray={`${2*Math.PI*30*0.68} ${2*Math.PI*30*(1-0.68)}`} strokeLinecap="round" transform="rotate(-90 35 35)"/>
            <defs><linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="0%"><stop stopColor={C.cyan}/><stop offset="1" stopColor={C.purple}/></linearGradient></defs>
          </svg>
          <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
            <span style={{fontSize:19,fontWeight:900,color:C.t0,lineHeight:1}}>68</span>
            <span style={{fontSize:6.5,color:C.t3,fontWeight:700,letterSpacing:'0.5px'}}>SCORE</span>
          </div>
        </div>
        <div style={{flex:1,display:'flex',flexDirection:'column',gap:5}}>
          {[{l:'Win Rate',v:77,c:C.green},{l:'Profit F.',v:100,c:C.cyan},{l:'Risk/Rew.',v:53,c:C.purple},{l:'Sharpe',v:100,c:C.teal},{l:'Discipline',v:65,c:C.warn},{l:'Constance',v:100,c:C.blue}].map(x=>(
            <div key={x.l} style={{display:'flex',alignItems:'center',gap:7}}>
              <span style={{fontSize:7.5,color:C.t3,width:52,flexShrink:0}}>{x.l}</span>
              <div style={{flex:1,height:3,borderRadius:2,background:'rgba(255,255,255,0.05)',overflow:'hidden'}}>
                <motion.div initial={{width:0}} animate={{width:`${x.v}%`}} transition={{duration:1,delay:0.3,ease:[0.16,1,0.3,1]}} style={{height:'100%',background:`linear-gradient(90deg,${x.c}66,${x.c})`,borderRadius:2}}/>
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
};

const BiaisPanel = () => {
  const {BIAIS_DATA=[]} = useDashData();
  return (
    <Card custom={10} glow={C.teal} hover={false} style={{padding:'18px 18px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
        <SectionTitle color={C.teal} icon="🧭">Analyse des Biais</SectionTitle>
        <Badge color={C.cyan}>17 annotés</Badge>
      </div>
      <div style={{display:'flex',gap:16,alignItems:'center',marginBottom:12}}>
        <div style={{position:'relative',flexShrink:0}}>
          <ResponsiveContainer width={110} height={110}>
            <PieChart>
              <Pie data={BIAIS_DATA} cx="50%" cy="50%" innerRadius={32} outerRadius={50} dataKey="value" startAngle={90} endAngle={-270} stroke="none" paddingAngle={2}>
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
                <div style={{display:'flex',alignItems:'center',gap:5}}><div style={{width:7,height:7,borderRadius:2,background:d.color}}/><span style={{fontSize:9.5,fontWeight:700,color:C.t1}}>{d.name}</span></div>
                <div style={{display:'flex',gap:8}}><span style={{fontSize:9,fontWeight:800,color:d.color,fontFamily:'monospace'}}>{d.value}%</span><span style={{fontSize:9,color:d.pnl.startsWith('+')?C.green:C.danger,fontFamily:'monospace'}}>{d.pnl}</span></div>
              </div>
              <div style={{height:3,borderRadius:2,background:'rgba(255,255,255,0.05)',overflow:'hidden'}}>
                <motion.div initial={{width:0}} animate={{width:`${d.value}%`}} transition={{duration:0.9,delay:i*0.15}} style={{height:'100%',background:d.color,borderRadius:2}}/>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,padding:'10px',borderRadius:10,background:'rgba(255,255,255,0.025)',border:`1px solid ${C.brd}`}}>
        {[{l:'P&L Bull.',v:'+$13,580',c:C.green},{l:'P&L Bear.',v:'+$3,010',c:C.danger},{l:'Biais dom.',v:'🐂 Bull',c:C.green}].map((x,i)=>(
          <div key={i} style={{textAlign:'center'}}><div style={{fontSize:7,color:C.t3,marginBottom:2}}>{x.l}</div><div style={{fontSize:11,fontWeight:900,color:x.c,fontFamily:'monospace'}}>{x.v}</div></div>
        ))}
      </div>
    </Card>
  );
};

const RentabiliteGauge = () => {
  const pct = 76.5;
  const angle = (pct/100)*180-90;
  return (
    <Card custom={11} glow={C.orange} hover={false} style={{padding:'18px 18px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
        <SectionTitle color={C.orange} icon="🔥">Rentabilité</SectionTitle>
        <Badge color={C.cyan}>1h 24m avg</Badge>
      </div>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',paddingTop:4}}>
        <svg width="200" height="110" viewBox="0 0 200 110">
          <defs><linearGradient id="gg" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor={C.danger}/><stop offset="40%" stopColor={C.warn}/><stop offset="70%" stopColor={C.teal}/><stop offset="100%" stopColor={C.green}/></linearGradient></defs>
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="14" strokeLinecap="round"/>
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#gg)" strokeWidth="14" strokeLinecap="round" strokeDasharray={`${pct/100*251} 251`}/>
          <g transform={`rotate(${angle},100,100)`}><line x1="100" y1="100" x2="100" y2="30" stroke={C.t0} strokeWidth="2.5" strokeLinecap="round"/><circle cx="100" cy="100" r="5" fill={C.t0}/></g>
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

const RecentTrades = () => {
  const {RECENT_TRADES=[]} = useDashData();
  const [filter,setFilter] = useState('All');
  const filtered = filter==='All'?RECENT_TRADES:RECENT_TRADES.filter(t=>t.res===filter);
  return (
    <Card custom={12} glow={C.blue} hover={false} style={{padding:'18px 18px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <SectionTitle color={C.blue} icon="📋">Recent Trades</SectionTitle>
        <div style={{display:'flex',gap:4,alignItems:'center'}}>
          <div style={{display:'flex',gap:3}}>
            {['All','TP','SL'].map(f=>(
              <button key={f} onClick={()=>setFilter(f)} style={{padding:'3px 8px',borderRadius:5,border:`1px solid ${filter===f?C.blue:C.brd}`,background:filter===f?`${C.blue}20`:'transparent',color:filter===f?C.blue:C.t3,fontSize:8.5,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>{f}</button>
            ))}
          </div>
          <button style={{padding:'3px 9px',borderRadius:5,border:`1px solid ${C.brd}`,background:'transparent',color:C.t3,fontSize:8,cursor:'pointer',fontFamily:'inherit'}}>Tout voir →</button>
        </div>
      </div>
      <div style={{display:'flex',gap:8,marginBottom:12}}>
        <div style={{padding:'4px 10px',borderRadius:7,background:`${C.green}12`,border:`1px solid ${C.green}25`,display:'flex',gap:6,alignItems:'center'}}><span style={{fontSize:8,color:C.t3}}>P&L semaine</span><span style={{fontSize:10,fontWeight:900,color:C.green,fontFamily:'monospace'}}>+$5,000</span></div>
        <div style={{padding:'4px 10px',borderRadius:7,background:`${C.cyan}12`,border:`1px solid ${C.cyan}25`,display:'flex',gap:6,alignItems:'center'}}><span style={{fontSize:8,color:C.t3}}>Win rate</span><span style={{fontSize:10,fontWeight:900,color:C.cyan,fontFamily:'monospace'}}>88%</span></div>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:3}}>
        {filtered.map((t,i)=>{
          const rc=t.res==='TP'?C.green:t.res==='SL'?C.danger:C.warn;
          return(
            <motion.div key={t.id} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:i*0.05}}
              style={{display:'grid',gridTemplateColumns:'32px 1fr 1fr 1fr 1fr 1fr',alignItems:'center',gap:8,padding:'8px 10px',borderRadius:9,background:i%2===0?'rgba(255,255,255,0.018)':'rgba(255,255,255,0.010)',border:'1px solid rgba(255,255,255,0.035)',transition:'all 0.12s',cursor:'pointer'}}
              whileHover={{background:'rgba(77,124,255,0.06)',borderColor:'rgba(77,124,255,0.18)'}}>
              <div style={{width:32,height:22,borderRadius:5,background:`${rc}15`,border:`1px solid ${rc}28`,display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{fontSize:6.5,fontWeight:900,color:rc}}>{t.pair.slice(0,3)}</span></div>
              <div><div style={{fontSize:10,fontWeight:800,color:C.t1}}>{t.pair}</div><div style={{fontSize:7.5,color:t.dir==='Long'?C.green:C.danger,fontWeight:700}}>{t.dir==='Long'?'▲':'▼'} {t.dir}</div></div>
              <div style={{textAlign:'center'}}><div style={{display:'inline-block',padding:'1px 6px',borderRadius:4,background:`${rc}18`,border:`1px solid ${rc}30`,fontSize:8,fontWeight:800,color:rc}}>{t.res}</div></div>
              <div style={{textAlign:'right'}}><div style={{fontSize:9.5,fontWeight:900,fontFamily:'monospace',color:t.rr>0?C.green:C.danger}}>{t.rr>0?'+':''}{t.rr}R</div></div>
              <div style={{textAlign:'right'}}><div style={{fontSize:9.5,fontWeight:900,fontFamily:'monospace',color:t.pnl>0?C.green:C.danger}}>{t.pnl>0?'+':''}{t.pnl}$</div></div>
              <div style={{textAlign:'right'}}><div style={{fontSize:7.5,color:C.purple}}>{t.session}</div><div style={{fontSize:7,color:C.t3}}>{t.date.slice(5)}</div></div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
};

const SessionPanel = () => {
  const {SESSION_DATA=[]} = useDashData();
  return (
    <Card custom={13} glow={C.purple} hover={false} style={{padding:'18px 18px'}}>
      <SectionTitle color={C.purple} icon="🌍">Sessions</SectionTitle>
      <div style={{display:'flex',flexDirection:'column',gap:6}}>
        {SESSION_DATA.map((s,i)=>{
          const wr=Math.round(s.tp/(s.tp+s.sl+s.be)*100);
          const maxPnl=Math.max(...SESSION_DATA.map(x=>x.pnl));
          const pct=s.pnl/maxPnl*100;
          return(
            <div key={i} style={{padding:'9px 11px',borderRadius:10,background:'rgba(255,255,255,0.025)',border:`1px solid ${C.brd}`,position:'relative',overflow:'hidden'}}>
              <motion.div animate={{opacity:[0.04,0.08,0.04]}} transition={{duration:3,repeat:Infinity,delay:i*0.4}} style={{position:'absolute',inset:0,background:`linear-gradient(90deg,${C.purple}10,transparent)`}}/>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5,position:'relative'}}>
                <span style={{fontSize:10,fontWeight:800,color:C.t1}}>{s.s}</span>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <span style={{fontSize:8.5,fontWeight:800,fontFamily:'monospace',color:C.green}}>+${s.pnl.toLocaleString()}</span>
                  <span style={{fontSize:8,fontWeight:800,color:wr>=65?C.green:wr>=50?C.warn:C.danger,fontFamily:'monospace'}}>{wr}%</span>
                  <span style={{fontSize:7.5,color:C.t3}}>{s.tp}W·{s.sl}L·{s.be}BE</span>
                </div>
              </div>
              <div style={{height:3,borderRadius:2,background:'rgba(255,255,255,0.05)',overflow:'hidden'}}>
                <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:0.8,delay:0.2+i*0.1}} style={{height:'100%',background:`linear-gradient(90deg,${C.purple}88,${C.purple})`,borderRadius:2}}/>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

const PairPanel = () => {
  const {PAIR_DATA=[]} = useDashData();
  return (
    <Card custom={14} glow={C.gold} hover={false} style={{padding:'18px 18px'}}>
      <SectionTitle color={C.gold} icon="💱">Par Paire</SectionTitle>
      <div style={{display:'flex',flexDirection:'column',gap:4}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 32px 42px 60px',gap:8,padding:'0 8px 6px',borderBottom:`1px solid ${C.brd}`}}>
          {['Paire','#','WR','P&L'].map(h=><span key={h} style={{fontSize:7,fontWeight:800,color:C.t3,textTransform:'uppercase',letterSpacing:'0.5px',textAlign:'right'}}>{h}</span>)}
        </div>
        {PAIR_DATA.map((p,i)=>(
          <motion.div key={i} initial={{opacity:0,x:8}} animate={{opacity:1,x:0}} transition={{delay:0.1+i*0.06}}
            style={{display:'grid',gridTemplateColumns:'1fr 32px 42px 60px',gap:8,padding:'7px 8px',borderRadius:8,background:'rgba(255,255,255,0.02)',alignItems:'center',cursor:'pointer',transition:'all 0.12s'}}
            whileHover={{background:'rgba(255,215,0,0.05)',borderColor:`${C.gold}20`}}>
            <div style={{display:'flex',alignItems:'center',gap:6}}><div style={{width:6,height:6,borderRadius:'50%',background:p.col,boxShadow:`0 0 5px ${p.col}`,flexShrink:0}}/><span style={{fontSize:10.5,fontWeight:800,color:C.t1}}>{p.p}</span></div>
            <span style={{fontSize:9,color:C.t2,fontFamily:'monospace',textAlign:'right'}}>{p.n}</span>
            <span style={{fontSize:9,fontWeight:800,fontFamily:'monospace',color:p.wr>=65?C.green:p.wr>=50?C.warn:C.danger,textAlign:'right'}}>{p.wr}%</span>
            <span style={{fontSize:10,fontWeight:900,fontFamily:'monospace',color:p.pnl>=0?C.green:C.danger,textAlign:'right'}}>{p.pnl>=0?'+':''}{p.pnl>=0?'$'+p.pnl.toLocaleString():'-$'+Math.abs(p.pnl)}</span>
          </motion.div>
        ))}
      </div>
    </Card>
  );
};

const TimeHeatmap = () => {
  const {WEEK_HEATMAP=[],HOURS=['8h','10h','12h','14h','16h']} = useDashData();
  const maxV = Math.max(...WEEK_HEATMAP.flatMap(w=>Object.values(w.h).map(Math.abs)),1);
  return (
    <Card custom={15} glow={C.teal} hover={false} style={{padding:'18px 18px'}}>
      <SectionTitle color={C.teal} icon="🌡️">Heatmap Heure × Jour</SectionTitle>
      <div style={{overflowX:'auto'}}>
        <table style={{borderCollapse:'separate',borderSpacing:3,minWidth:'100%'}}>
          <thead><tr><th style={{width:44}}/>{HOURS.map(h=><th key={h} style={{fontSize:7.5,fontWeight:700,color:C.t3,textAlign:'center',padding:'0 2px 5px',whiteSpace:'nowrap'}}>{h}</th>)}</tr></thead>
          <tbody>
            {WEEK_HEATMAP.map((row,ri)=>(
              <tr key={ri}>
                <td style={{fontSize:8.5,fontWeight:700,color:C.t2,paddingRight:6,textAlign:'right'}}>{row.day}</td>
                {HOURS.map(h=>{
                  const v=row.h[h]||0;
                  const intensity=Math.min(0.8,Math.abs(v)/maxV*0.8);
                  const bg=v>0?`rgba(0,255,136,${intensity*0.65})`:v<0?`rgba(255,61,87,${intensity*0.55})`:'rgba(255,255,255,0.03)';
                  const tc=v>0?C.green:v<0?C.danger:C.t4;
                  return(
                    <td key={h} style={{padding:2}}>
                      <motion.div whileHover={{scale:1.15}} style={{width:38,height:34,borderRadius:7,background:bg,border:`1px solid ${v!==0?'rgba(255,255,255,0.07)':C.brd}`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
                        {v!==0?(<><div style={{fontSize:8.5,fontWeight:900,fontFamily:'monospace',color:tc,lineHeight:1}}>{v>0?'+':''}${Math.abs(v)*100}</div><div style={{fontSize:6,color:C.t3,marginTop:1}}>{v>0?'+':''}{v}R</div></>):<div style={{width:5,height:1,background:'rgba(255,255,255,0.06)'}}/>}
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

const LiveTicker = () => {
  const [visible,setVisible] = useState(true);
  if(!visible) return null;
  return (
    <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} transition={{duration:0.4}}
      style={{marginBottom:10,padding:'8px 16px',borderRadius:10,background:'linear-gradient(90deg,rgba(0,255,136,0.06),rgba(6,230,255,0.04))',border:`1px solid ${C.green}25`,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <motion.div animate={{opacity:[1,0.3,1]}} transition={{duration:1.2,repeat:Infinity}} style={{width:7,height:7,borderRadius:'50%',background:C.green,boxShadow:`0 0 8px ${C.green}`,flexShrink:0}}/>
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

const QuickActions = ({onNewTrade,onImport,onPDF,onGoals}) => (
  <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap'}}>
    {[
      {l:'+ Nouveau Trade',c:C.green,bg:`${C.green}15`,bd:`${C.green}35`,icon:'➕',fn:onNewTrade},
      {l:'Importer Excel',c:C.cyan,bg:`${C.cyan}12`,bd:`${C.cyan}30`,icon:'📥',fn:onImport},
      {l:'Rapport PDF',c:C.purple,bg:`${C.purple}12`,bd:`${C.purple}28`,icon:'📄',fn:onPDF},
      {l:'Objectifs du mois',c:C.gold,bg:`${C.gold}12`,bd:`${C.gold}25`,icon:'🎯',fn:onGoals},
    ].map((a,i)=>(
      <motion.button key={i} whileHover={{scale:1.03,y:-1}} whileTap={{scale:0.97}} onClick={a.fn}
        style={{display:'flex',alignItems:'center',gap:7,padding:'8px 14px',borderRadius:9,border:`1px solid ${a.bd}`,background:a.bg,color:a.c,fontSize:10,fontWeight:700,cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s'}}>
        <span style={{fontSize:13}}>{a.icon}</span>{a.l}
      </motion.button>
    ))}
  </div>
);

const GoalProgress = () => {
  const goals = [
    {l:'Objectif mensuel',cur:8400,target:10000,c:C.cyan},
    {l:'Win Rate cible',cur:76.5,target:70,c:C.green,suffix:'%'},
    {l:'Max trades/sem.',cur:7,target:10,c:C.purple},
    {l:'Drawdown max',cur:31.6,target:20,c:C.danger,invert:true,suffix:'%'},
  ];
  return (
    <Card custom={16} glow={C.cyan} hover={false} style={{padding:'18px 18px'}}>
      <SectionTitle color={C.cyan} icon="🏆">Objectifs du Mois</SectionTitle>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {goals.map((g,i)=>{
          const pct=Math.min(100,(g.cur/g.target)*100);
          const ok=g.invert?g.cur<=g.target:pct>=100;
          const c=ok?C.green:pct>=70?g.c:C.warn;
          return(
            <div key={i}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                <span style={{fontSize:9.5,fontWeight:700,color:C.t1}}>{g.l}</span>
                <div style={{display:'flex',gap:6,alignItems:'center'}}>
                  <span style={{fontSize:9,fontFamily:'monospace',color:c,fontWeight:800}}>{g.suffix==='%'?g.cur+'%':g.prefix==='$'?'$'+g.cur.toLocaleString():g.cur}</span>
                  <span style={{fontSize:7.5,color:C.t3}}>/ {g.suffix==='%'?g.target+'%':'$'+g.target.toLocaleString()}</span>
                  {ok&&<span style={{fontSize:10}}>✅</span>}
                </div>
              </div>
              <div style={{height:5,borderRadius:3,background:'rgba(255,255,255,0.05)',overflow:'hidden'}}>
                <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:0.9,delay:0.15+i*0.1,ease:[0.16,1,0.3,1]}} style={{height:'100%',borderRadius:3,background:`linear-gradient(90deg,${c}66,${c})`}}/>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

const JournalNote = () => (
  <Card custom={17} glow={C.warn} hover={false} style={{padding:'18px 18px'}}>
    <SectionTitle color={C.warn} icon="📝">Note du jour</SectionTitle>
    <div style={{fontSize:9.5,color:C.t2,lineHeight:1.75,background:'rgba(255,255,255,0.02)',borderRadius:10,padding:'10px 12px',border:`1px solid ${C.brd}`,marginBottom:10,minHeight:64}}>
      <span style={{color:C.gold,fontWeight:700}}>Points forts :</span> Excellente lecture du contexte London open. EURUSD reaction propre sur le RB 1H.
      <br/><span style={{color:C.danger,fontWeight:700}}>À améliorer :</span> Attendre confirmation après CISD avant d'entrer — 2 faux signaux cette semaine.
    </div>
    <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
      {['Discipline ✓','Patience ✓','FOMO ✗','Overtrading ✗'].map((t,i)=>(
        <span key={i} style={{padding:'3px 8px',borderRadius:5,fontSize:8,fontWeight:700,background:t.includes('✓')?`${C.green}12`:`${C.danger}12`,border:`1px solid ${t.includes('✓')?C.green:C.danger}25`,color:t.includes('✓')?C.green:C.danger}}>{t}</span>
      ))}
    </div>
  </Card>
);

const MF_RANKS = [
  {rank:'Iron',min:0,max:19,color:'#8B7355',icon:'🔩',desc:'Débutant'},
  {rank:'Bronze',min:20,max:39,color:'#CD7F32',icon:'🥉',desc:'En progression'},
  {rank:'Silver',min:40,max:59,color:'#C0C0C0',icon:'🥈',desc:'Régulier'},
  {rank:'Gold',min:60,max:74,color:'#FFD700',icon:'🥇',desc:'Performant'},
  {rank:'Platinum',min:75,max:84,color:'#00F5D4',icon:'💎',desc:'Expert'},
  {rank:'Diamond',min:85,max:92,color:'#06E6FF',icon:'💠',desc:'Élite'},
  {rank:'Master',min:93,max:97,color:'#B06EFF',icon:'👑',desc:'Master Trader'},
  {rank:'Grandmaster',min:98,max:100,color:'#FF4DC4',icon:'⚡',desc:'Légende'},
];

function getRank(score) { return MF_RANKS.find(r=>score>=r.min&&score<=r.max)||MF_RANKS[0]; }

function calcRegularityScore(trades) {
  if(!trades||trades.length===0) return 0;
  const wins=trades.filter(t=>t.pnl>0).length;
  const wr=wins/trades.length;
  const wrScore=Math.min(30,wr*40);
  const weeks=new Set(trades.map(t=>{const d=new Date(t.date||t.entryDate||Date.now());const start=new Date(d.getFullYear(),0,1);return Math.ceil(((d-start)/86400000+start.getDay()+1)/7);}));
  const weekScore=Math.min(20,weeks.size*3);
  const pnls=trades.map(t=>t.pnl||0);
  const maxLoss=Math.abs(Math.min(...pnls,0));
  const totalPnl=pnls.reduce((a,b)=>a+b,0);
  const riskScore=totalPnl>0?Math.min(25,25-(maxLoss/Math.max(totalPnl,1))*10):10;
  const grossWin=pnls.filter(p=>p>0).reduce((a,b)=>a+b,0);
  const grossLoss=Math.abs(pnls.filter(p=>p<0).reduce((a,b)=>a+b,0));
  const pf=grossLoss>0?grossWin/grossLoss:grossWin>0?3:0;
  const pfScore=Math.min(15,pf*5);
  const actScore=Math.min(10,trades.length*0.5);
  return Math.round(wrScore+weekScore+riskScore+pfScore+actScore);
}

const TradingCalendar = () => {
  const ctx=useTradingContext(); const trades=ctx?.trades||[];
  const [currentMonth,setCurrentMonth]=useState(()=>new Date());
  const year=currentMonth.getFullYear();
  const month=currentMonth.getMonth();
  const MONTHS=['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const DAYS=['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
  const firstDay=new Date(year,month,1);
  const lastDay=new Date(year,month+1,0);
  const startPad=(firstDay.getDay()+6)%7;
  const totalDays=lastDay.getDate();
  const tradesByDay={};
  (trades||[]).forEach(t=>{const d=new Date(t.date||t.entryDate||t.createdAt);if(d.getFullYear()===year&&d.getMonth()===month){const key=d.getDate();if(!tradesByDay[key])tradesByDay[key]=[];tradesByDay[key].push(t);}});
  const score=calcRegularityScore(trades);
  const rank=getRank(score);
  const nextRank=MF_RANKS[MF_RANKS.findIndex(r=>r.rank===rank.rank)+1];
  const monthTrades=Object.values(tradesByDay).flat();
  const monthPnl=monthTrades.reduce((a,t)=>a+(t.pnl||0),0);
  const tradingDays=Object.keys(tradesByDay).length;
  return (
    <Card custom={18} glow={rank.color} hover={false} style={{padding:'20px 22px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16,flexWrap:'wrap',gap:12}}>
        <SectionTitle color={rank.color} icon="📅">Calendrier de Trading</SectionTitle>
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
            {nextRank&&(
              <div style={{marginTop:6}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}><span style={{fontSize:9,color:C.t3}}>→ {nextRank.rank}</span><span style={{fontSize:9,color:C.t3}}>{nextRank.min-score} pts</span></div>
                <div style={{width:120,height:4,background:'rgba(255,255,255,0.06)',borderRadius:2,overflow:'hidden'}}>
                  <div style={{width:`${((score-rank.min)/(rank.max-rank.min+1))*100}%`,height:'100%',background:`linear-gradient(90deg,${rank.color},${nextRank.color})`,borderRadius:2,transition:'width 1s ease'}}/>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div style={{display:'flex',gap:16,marginBottom:16,flexWrap:'wrap'}}>
        {[{l:'P&L du mois',v:monthPnl>=0?`+$${monthPnl.toLocaleString()}`:`-$${Math.abs(monthPnl).toLocaleString()}`,c:monthPnl>=0?C.green:C.danger},{l:'Jours tradés',v:tradingDays,c:C.cyan},{l:'Trades ce mois',v:monthTrades.length,c:C.purple}].map((s,i)=>(
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
          const day=i+1;
          const dayTrades=tradesByDay[day]||[];
          const dayPnl=dayTrades.reduce((a,t)=>a+(t.pnl||0),0);
          const isToday=new Date().getDate()===day&&new Date().getMonth()===month&&new Date().getFullYear()===year;
          const hasData=dayTrades.length>0;
          const isWeekend=((i+startPad)%7)>=5;
          let bg='rgba(255,255,255,0.02)',border=C.brd,pnlColor=C.t3;
          if(hasData){if(dayPnl>0){bg=`${C.green}18`;border=`${C.green}40`;pnlColor=C.green;}else if(dayPnl<0){bg=`${C.danger}15`;border=`${C.danger}35`;pnlColor=C.danger;}else{bg=`${C.warn}10`;border=`${C.warn}30`;pnlColor=C.warn;}}
          if(isWeekend&&!hasData){bg='rgba(255,255,255,0.01)';}
          return(
            <div key={day} style={{background:bg,border:`1px solid ${isToday?rank.color:border}`,borderRadius:8,padding:'6px 4px',minHeight:52,textAlign:'center',position:'relative',boxShadow:isToday?`0 0 8px ${rank.color}40`:'none',transition:'all 0.15s',cursor:hasData?'pointer':'default'}}>
              <div style={{fontSize:10,fontWeight:isToday?800:500,color:isToday?rank.color:isWeekend?C.t4:C.t2,marginBottom:3}}>{day}</div>
              {hasData&&(<><div style={{fontSize:9,fontWeight:700,color:pnlColor}}>{dayPnl>=0?'+':''}{dayPnl>=1000||dayPnl<=-1000?`${(dayPnl/1000).toFixed(1)}k`:dayPnl}$</div><div style={{fontSize:8,color:C.t3,marginTop:1}}>{dayTrades.length}T</div><div style={{display:'flex',justifyContent:'center',gap:2,marginTop:3}}>{dayTrades.slice(0,3).map((_,di)=><div key={di} style={{width:4,height:4,borderRadius:'50%',background:dayPnl>0?C.green:C.danger,opacity:0.8}}/>)}</div></>)}
            </div>
          );
        })}
      </div>
      <div style={{display:'flex',gap:16,marginTop:14,flexWrap:'wrap'}}>
        {[{c:C.green,l:'Jour positif'},{c:C.danger,l:'Jour négatif'},{c:C.warn,l:'Breakeven'},{c:C.t4,l:'Pas de trade'}].map(({c,l})=>(
          <div key={l} style={{display:'flex',alignItems:'center',gap:5}}><div style={{width:10,height:10,borderRadius:3,background:`${c}30`,border:`1px solid ${c}60`}}/><span style={{fontSize:9,color:C.t3}}>{l}</span></div>
        ))}
      </div>
    </Card>
  );
};

const NewTradeModal = ({onClose,onAdd}) => {
  const [form,setForm]=useState({pair:'EURUSD',dir:'Long',entry:'',sl:'',tp:'',size:'',date:new Date().toISOString().split('T')[0],notes:''});
  const set=(k,v)=>setForm(p=>({...p,[k]:v}));
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(4px)'}} onClick={onClose}>
      <motion.div initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}} onClick={e=>e.stopPropagation()}
        style={{background:'#0C1422',border:'1px solid #1E2E48',borderRadius:16,padding:28,width:420,maxWidth:'95vw',boxShadow:'0 20px 60px rgba(0,0,0,0.7)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <div style={{fontSize:16,fontWeight:800,color:'#fff'}}>➕ Nouveau Trade</div>
          <button onClick={onClose} style={{background:'none',border:'none',color:'#7A90B8',fontSize:18,cursor:'pointer'}}>✕</button>
        </div>
        {[{l:'Paire',k:'pair',type:'text',ph:'EURUSD'},{l:'Direction',k:'dir',type:'select',opts:['Long','Short']},{l:'Prix entrée',k:'entry',type:'number',ph:'1.08320'},{l:'Stop Loss',k:'sl',type:'number',ph:'1.08000'},{l:'Take Profit',k:'tp',type:'number',ph:'1.09000'},{l:'Taille (lots)',k:'size',type:'number',ph:'0.10'},{l:'Date',k:'date',type:'date'}].map(({l,k,type,ph,opts})=>(
          <div key={k} style={{marginBottom:12}}>
            <div style={{fontSize:11,color:'#7A90B8',marginBottom:5,fontWeight:600}}>{l}</div>
            {type==='select'?<select value={form[k]} onChange={e=>set(k,e.target.value)} style={{width:'100%',padding:'9px 12px',background:'rgba(255,255,255,0.04)',border:'1px solid #1E2E48',borderRadius:8,color:'#E8EEFF',fontSize:13,outline:'none'}}>{opts.map(o=><option key={o}>{o}</option>)}</select>:<input type={type} placeholder={ph} value={form[k]} onChange={e=>set(k,e.target.value)} style={{width:'100%',padding:'9px 12px',background:'rgba(255,255,255,0.04)',border:'1px solid #1E2E48',borderRadius:8,color:'#E8EEFF',fontSize:13,outline:'none',boxSizing:'border-box'}}/>}
          </div>
        ))}
        <textarea placeholder="Notes..." value={form.notes} onChange={e=>set('notes',e.target.value)} style={{width:'100%',padding:'9px 12px',background:'rgba(255,255,255,0.04)',border:'1px solid #1E2E48',borderRadius:8,color:'#E8EEFF',fontSize:12,outline:'none',resize:'vertical',minHeight:60,boxSizing:'border-box',marginBottom:16}}/>
        <div style={{display:'flex',gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:'10px',borderRadius:9,background:'rgba(255,255,255,0.04)',border:'1px solid #162034',color:'#7A90B8',cursor:'pointer',fontWeight:600}}>Annuler</button>
          <button onClick={()=>{onAdd(form);onClose();}} style={{flex:2,padding:'10px',borderRadius:9,background:'linear-gradient(135deg,#06E6FF,#00FF88)',border:'none',color:'#000',cursor:'pointer',fontWeight:800}}>Ajouter le trade</button>
        </div>
      </motion.div>
    </div>
  );
};

const GoalsModal = ({onClose}) => {
  const goals=[{l:'Objectif P&L mensuel ($)',k:'pnl',v:'10000'},{l:'Win Rate cible (%)',k:'wr',v:'70'},{l:'Max trades/semaine',k:'trades',v:'10'},{l:'Max Drawdown (%)',k:'dd',v:'20'}];
  const [vals,setVals]=useState(()=>Object.fromEntries(goals.map(g=>[g.k,g.v])));
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(4px)'}} onClick={onClose}>
      <motion.div initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}} onClick={e=>e.stopPropagation()}
        style={{background:'#0C1422',border:'1px solid #1E2E48',borderRadius:16,padding:28,width:380,maxWidth:'95vw'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <div style={{fontSize:16,fontWeight:800,color:'#fff'}}>🎯 Objectifs du mois</div>
          <button onClick={onClose} style={{background:'none',border:'none',color:'#7A90B8',fontSize:18,cursor:'pointer'}}>✕</button>
        </div>
        {goals.map(g=>(
          <div key={g.k} style={{marginBottom:14}}>
            <div style={{fontSize:11,color:'#7A90B8',marginBottom:5,fontWeight:600}}>{g.l}</div>
            <input type="number" value={vals[g.k]} onChange={e=>setVals(p=>({...p,[g.k]:e.target.value}))} style={{width:'100%',padding:'9px 12px',background:'rgba(255,255,255,0.04)',border:'1px solid #1E2E48',borderRadius:8,color:'#E8EEFF',fontSize:13,outline:'none',boxSizing:'border-box'}}/>
          </div>
        ))}
        <button onClick={onClose} style={{width:'100%',padding:'11px',borderRadius:9,background:'linear-gradient(135deg,#FFD700,#FF8C42)',border:'none',color:'#000',cursor:'pointer',fontWeight:800,marginTop:4}}>Enregistrer</button>
      </motion.div>
    </div>
  );
};

function emptyStats() {
  return {equityData:[],dailyPnl:[],recentTrades:[],sessionData:[],pairData:[],radarData:[],biaisData:[],heatmap:[]};
}

export default function Dashboard() {
  const [greeting]=useState(()=>{const h=new Date().getHours();return h<12?'Bonjour':h<18?'Bon après-midi':'Bonsoir';});
  const [showNewTrade,setShowNewTrade]=useState(false);
  const [showGoals,setShowGoals]=useState(false);

  const handleImportExcel=()=>{const input=document.createElement('input');input.type='file';input.accept='.xlsx,.xls,.csv';input.onchange=(e)=>{const file=e.target.files[0];if(file)alert(`Fichier "${file.name}" sélectionné. Import en cours de développement.`);};input.click();};
  const handlePDF=()=>window.print();

  const {stats=emptyStats(),trades:allTrades=[],addTrade=()=>null}=useTradingContext()||{};
  const dashData={
    MOCK_STATS:stats,
    EQUITY_DATA:stats.equityData||[],
    DAILY_PNL:stats.dailyPnl||[],
    RECENT_TRADES:stats.recentTrades||[],
    SESSION_DATA:stats.sessionData||[],
    PAIR_DATA:stats.pairData||[],
    RADAR_DATA:stats.radarData||[],
    BIAIS_DATA:stats.biaisData||[],
    WEEK_HEATMAP:stats.heatmap||[],
    HOURS:['8h','10h','12h','14h','16h'],
    trades:allTrades,
  };

  const handleAddTrade=async(tradeData)=>{await addTrade(tradeData);};

  return(
    <DashboardDataCtx.Provider value={dashData}>
    <div style={{background:'var(--bg, #0B0F1A)',minHeight:'100%',width:'100%',fontFamily:"'SF Pro Display','Segoe UI',system-ui,sans-serif",color:'var(--t1, #E8EEFF)',position:'relative'}}>
      <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:0}}>
        <div style={{position:'absolute',top:0,left:'20%',width:600,height:400,background:'radial-gradient(ellipse,rgba(77,124,255,0.06) 0%,transparent 70%)',filter:'blur(40px)'}}/>
        <div style={{position:'absolute',bottom:0,right:'10%',width:500,height:350,background:'radial-gradient(ellipse,rgba(0,255,136,0.04) 0%,transparent 70%)',filter:'blur(40px)'}}/>
        <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(77,124,255,0.008) 1px,transparent 1px),linear-gradient(90deg,rgba(77,124,255,0.008) 1px,transparent 1px)',backgroundSize:'52px 52px'}}/>
      </div>
      <div style={{position:'relative',zIndex:1,padding:'22px 24px 40px',width:'100%',boxSizing:'border-box'}}>
        <motion.div initial={{opacity:0,y:-12}} animate={{opacity:1,y:0}} transition={{duration:0.45}}
          style={{marginBottom:16,display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
              <motion.div animate={{rotate:[0,5,-5,0]}} transition={{duration:4,repeat:Infinity,repeatDelay:8}} style={{fontSize:22}}>👋</motion.div>
              <h1 style={{margin:0,fontSize:20,fontWeight:900,color:C.t0,letterSpacing:'-0.5px'}}>{greeting}, <span style={{background:C.gradCyan,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Trader</span></h1>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:10,paddingLeft:2}}>
              <span style={{fontSize:10,color:C.t3}}>{(()=>{const now=new Date();const days=['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];const months=['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];const d=now.getDate();const startOfYear=new Date(now.getFullYear(),0,1);const week=Math.ceil(((now-startOfYear)/86400000+startOfYear.getDay()+1)/7);return `${days[now.getDay()]} ${d} ${months[now.getMonth()]} ${now.getFullYear()} · Semaine ${week}`;})()}</span>
              <div style={{width:4,height:4,borderRadius:'50%',background:C.t4}}/>
              <motion.div animate={{opacity:[1,0.4,1]}} transition={{duration:1.5,repeat:Infinity}} style={{display:'flex',alignItems:'center',gap:4}}>
                <div style={{width:6,height:6,borderRadius:'50%',background:C.green,boxShadow:`0 0 6px ${C.green}`}}/>
                <span style={{fontSize:9.5,color:C.green,fontWeight:700}}>{(()=>{const h=new Date().getUTCHours();if(h>=0&&h<7)return 'Sydney · Session Active';if(h>=2&&h<9)return 'Tokyo · Session Active';if(h>=7&&h<16)return 'London · Session Active';if(h>=13&&h<22)return 'New York · Session Active';return 'Marché Fermé';})()}</span>
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
          </div>
        </motion.div>
        <LiveTicker/>
        <QuickActions onNewTrade={()=>setShowNewTrade(true)} onImport={handleImportExcel} onPDF={handlePDF} onGoals={()=>setShowGoals(true)}/>
        <AnimatePresence>
          {showNewTrade&&<NewTradeModal onClose={()=>setShowNewTrade(false)} onAdd={handleAddTrade}/>}
          {showGoals&&<GoalsModal onClose={()=>setShowGoals(false)}/>}
        </AnimatePresence>
        <KpiStrip/>
        <div style={{display:'grid',gridTemplateColumns:'2fr 1.1fr',gap:12,marginBottom:12}}>
          <EquityPanel/>
          <div style={{display:'flex',flexDirection:'column',gap:12}}><DailyPnl/><GoalProgress/></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1.2fr 1fr 1fr',gap:12,marginBottom:12}}>
          <PerformanceScore/><BiaisPanel/><RentabiliteGauge/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:12,marginBottom:12}}>
          <RecentTrades/>
          <div style={{display:'flex',flexDirection:'column',gap:12}}><SessionPanel/><PairPanel/></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1.6fr 1fr',gap:12,marginBottom:12}}>
          <TimeHeatmap/><JournalNote/>
        </div>
        <div style={{marginBottom:12}}><TradingCalendar/></div>
      </div>
    </div>
    </DashboardDataCtx.Provider>
  );
}