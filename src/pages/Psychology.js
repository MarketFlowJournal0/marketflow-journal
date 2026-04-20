/*
╔══════════════════════════════════════════════════════════════════════╗
║   🧠 MARKETFLOW — PSYCHOLOGY & MENTAL v3.0 ULTRA                    ║
║   ✦ Composite psychological score (8 weighted dimensions)          ║
║   ✦ 30 demo sessions with rich data                                ║
║   ✦ Animated score gauge + time evolution                          ║
║   ✦ 7-axis radar with multi-session comparison                     ║
║   ✦ Score/P&L correlation + calendar heatmap                       ║
║   ✦ Emotion distribution + detailed P&L impact                     ║
║   ✦ Auto-detected behavioral patterns                              ║
║   ✦ Performance by score range                                     ║
║   ✦ Premium accordion session journal                              ║
╚══════════════════════════════════════════════════════════════════════╝
*/

import React,{useState,useMemo,useEffect,useRef}from'react';
import{motion,AnimatePresence}from'framer-motion';
import{useTradingContext}from'../context/TradingContext';
import{
  AreaChart,Area,BarChart,Bar,ComposedChart,Line,LineChart,
  XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,
  Cell,ReferenceLine,PieChart,Pie,
}from'recharts';
import { shade } from '../lib/colorAlpha';
import { CHART_AXIS_SMALL, CHART_GRID, CHART_MOTION, CHART_MOTION_SOFT, chartActiveDot, chartCursor, chartTooltipStyle } from '../lib/marketflowCharts';

// ═══════════════════════════════════════════════════════════════════
// 🎨 DESIGN SYSTEM
// ═══════════════════════════════════════════════════════════════════
const C={
  bg0:'var(--mf-bg,#030508)',bg1:'#070C14',bg2:'#0A1020',bg3:'#0F1828',bg4:'#141E30',
  bgCard:'var(--mf-card,#0C1422)',bgHigh:'var(--mf-high,#121C2E)',bgHover:'#0F1A2E',
  cyan:'var(--mf-accent,#06E6FF)',   cyanGlow:  'rgba(var(--mf-accent-rgb, 6, 230, 255),0.35)',
  teal:'var(--mf-teal,#00F5D4)',   tealGlow:  'rgba(var(--mf-teal-rgb, 0, 245, 212),0.3)',
  green:'var(--mf-green,#00FF88)',  greenGlow: 'rgba(var(--mf-green-rgb, 0, 255, 136),0.35)',
  danger:'var(--mf-danger,#FF3D57)', dangerGlow:'rgba(var(--mf-danger-rgb, 255, 61, 87),0.35)',
  warn:'var(--mf-warn,#FFB31A)',   warnGlow:  'rgba(var(--mf-warn-rgb, 255, 179, 26),0.35)',
  orange:'var(--mf-orange,#FF6B35)',
  purple:'var(--mf-purple,#A78BFA)', purpleGlow:'rgba(var(--mf-purple-rgb, 176, 110, 255),0.35)',
  blue:'var(--mf-blue,#4D7CFF)',   blueGlow:  'rgba(var(--mf-blue-rgb, 77, 124, 255),0.3)',
  pink:'var(--mf-pink,#FB7185)',   pinkGlow:  'rgba(var(--mf-pink-rgb, 255, 77, 196),0.3)',
  gold:'var(--mf-gold,#FFD700)',
  t0:'var(--mf-text-0,#FFFFFF)',t1:'var(--mf-text-1,#E8EEFF)',t2:'var(--mf-text-2,#7A90B8)',t3:'var(--mf-text-3,#334566)',t4:'var(--mf-text-4,#1E2E45)',
  brd:'var(--mf-border,#162034)',brdHi:'var(--mf-border-hi,#1E2E48)',
  gradCyan:  'linear-gradient(135deg,var(--mf-accent,#06E6FF),var(--mf-green,#00FF88))',
  gradPurple:'linear-gradient(135deg,var(--mf-purple,#A78BFA),var(--mf-blue,#4D7CFF))',
  gradWarm:  'linear-gradient(135deg,var(--mf-warn,#FFB31A),var(--mf-orange,#FF6B35))',
  gradDanger:'linear-gradient(135deg,var(--mf-danger,#FF3D57),var(--mf-orange,#FF6B35))',
  gradPink:  'linear-gradient(135deg,var(--mf-pink,#FB7185),var(--mf-purple,#A78BFA))',
  gradGold:  'linear-gradient(135deg,var(--mf-gold,#FFD700),var(--mf-gold,#FFB31A))',
};

const fadeUp={
  hidden:{opacity:0,y:24,scale:0.96},
  visible:(i=0)=>({opacity:1,y:0,scale:1,transition:{delay:i*0.045,duration:0.58,ease:[0.16,1,0.3,1]}}),
};
const NOISE='url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")';

const GlassCard=({children,style={},glow=null,hover=true,custom=0,onClick,...p})=>(
  <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={custom}
    whileHover={hover?{y:-3,scale:1.004}:{}} onClick={onClick}
    style={{position:'relative',overflow:'hidden',
      background:'linear-gradient(145deg,rgba(15,24,44,0.92),rgba(10,16,32,0.96))',
      backdropFilter:'blur(20px) saturate(1.4)',borderRadius:20,
      border:`1px solid ${glow ? shade(glow,'26') : C.brd}`,
      boxShadow:`0 4px 40px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.04)${glow ? `,0 0 55px ${shade(glow,'08')}` : ''}`,
      cursor:onClick?'pointer':'default',transition:'box-shadow 0.4s',...style}} {...p}>
    <div style={{position:'absolute',inset:0,opacity:0.024,backgroundImage:NOISE,backgroundSize:'128px',pointerEvents:'none',zIndex:0}}/>
    <div style={{position:'relative',zIndex:1,height:'100%'}}>{children}</div>
  </motion.div>
);

const ST=({children,sub,color=C.cyan,mb=14})=>(
  <div style={{marginBottom:mb}}>
    <div style={{display:'flex',alignItems:'center',gap:9}}>
      <div style={{width:3,height:16,background:`linear-gradient(180deg,${color},${shade(color,'50')})`,borderRadius:2,flexShrink:0}}/>
      <span style={{fontSize:14,fontWeight:800,color:C.t1,letterSpacing:'-0.3px'}}>{children}</span>
    </div>
    {sub&&<p style={{margin:'4px 0 0',fontSize:9,color:C.t3,paddingLeft:12}}>{sub}</p>}
  </div>
);

// ═══════════════════════════════════════════════════════════════════
// 📊 RICH DATA — 30 sessions
// ═══════════════════════════════════════════════════════════════════
const MOODS=[
  {id:'excellent',label:'Excellent',emoji:'',color:C.green},
  {id:'bien',     label:'Good',       emoji:'',color:C.cyan},
  {id:'neutre',   label:'Neutral',    emoji:'',color:C.warn},
  {id:'difficile',label:'Difficult',  emoji:'',color:C.orange},
  {id:'terrible', label:'Terrible', emoji:'',color:C.danger},
];
const DAYS_FR=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const AXES7=[
  {key:'discipline', label:'Discipline',   color:C.cyan,   weight:0.18,desc:'Rule adherence'},
  {key:'patience',   label:'Patience',     color:C.green,  weight:0.14,desc:'Waiting for the right moment'},
  {key:'confidence', label:'Confidence',   color:C.purple, weight:0.12,desc:'Self-esteem in trading'},
  {key:'riskCtrl',   label:'Risk Control', color:C.teal,   weight:0.18,desc:'Position size management'},
  {key:'consistency',label:'Consistency',  color:C.warn,   weight:0.14,desc:'Process consistency'},
  {key:'emotional',  label:'Emot. Control',color:C.pink,   weight:0.14,desc:'Emotional control'},
  {key:'planFollow', label:'Plan Follow',  color:C.blue,   weight:0.10,desc:'Trading plan adherence'},
];

// Composite psychological score (weighted)
const calcPsych=s=>{
  if(!s)return 0;
  const moodScore={excellent:100,bien:80,neutre:60,difficile:35,terrible:15}[s.mood]||50;
  const axeScore=AXES7.reduce((acc,ax)=>{
    const v=s[ax.key]||0;
    return acc+v*ax.weight;
  },0)/AXES7.reduce((a,ax)=>a+ax.weight,0);
  const physScore=(((s.sleep||5)/10)*100*0.5+((s.energy||5)/10)*100*0.5);
  // Weighting: mood 20%, axes 55%, physical 15%, routine 10%
  const routineBonus=(s.routine?10:0);
  const raw=moodScore*0.20+axeScore*0.55+physScore*0.15+routineBonus;
  return Math.min(100,Math.max(0,Math.round(raw)));
};

const sColor=s=>s>=75?C.green:s>=60?C.cyan:s>=45?C.warn:s>=30?C.orange:C.danger;
const sLabel=s=>s>=80?'Elite':s>=70?'Excellent':s>=60?'Solid':s>=50?'Fair':s>=40?'Fragile':s>=30?'Difficult':'Critical';
const sEmoji=s=>'';

// 30 rich sessions
const DEMO=[
  {id:1, date:'2025-11-03',mood:'bien',     sleep:7,energy:7,discipline:72,patience:68,confidence:75,riskCtrl:70,consistency:68,emotional:70,planFollow:76,pnl:340, trades:3,wins:2,stressors:'',     objectives:'RR 1:2 minimum',       routine:true, maxTrades:4,maxLoss:120,notes:'Good calm session.'},
  {id:2, date:'2025-11-04',mood:'excellent',sleep:9,energy:9,discipline:92,patience:88,confidence:94,riskCtrl:90,consistency:88,emotional:92,planFollow:96,pnl:2100,trades:2,wins:2,stressors:'',     objectives:'Setups A+ only',       routine:true, maxTrades:3,maxLoss:200,notes:'Perfect, 2/2.'},
  {id:3, date:'2025-11-05',mood:'neutre',   sleep:6,energy:6,discipline:58,patience:52,confidence:60,riskCtrl:55,consistency:56,emotional:52,planFollow:62,pnl:-85, trades:3,wins:1,stressors:'Fatigue',objectives:'Limit overtrading',    routine:false,maxTrades:3,maxLoss:100,notes:'Premature exit on 2 trades.'},
  {id:4, date:'2025-11-06',mood:'difficile',sleep:5,energy:5,discipline:38,patience:32,confidence:42,riskCtrl:36,consistency:40,emotional:34,planFollow:44,pnl:-320,trades:5,wins:1,stressors:'Personal stress', objectives:'No revenge trading',   routine:false,maxTrades:2,maxLoss:80, notes:'Revenge trading x3. Stop loss not respected.'},
  {id:5, date:'2025-11-10',mood:'bien',     sleep:8,energy:8,discipline:78,patience:74,confidence:80,riskCtrl:76,consistency:72,emotional:76,planFollow:82,pnl:620, trades:3,wins:2,stressors:'',     objectives:'Clean scalp',            routine:true, maxTrades:4,maxLoss:150,notes:'Very good patience on entries.'},
  {id:6, date:'2025-11-11',mood:'excellent',sleep:8,energy:9,discipline:88,patience:86,confidence:90,riskCtrl:86,consistency:84,emotional:88,planFollow:92,pnl:1750,trades:3,wins:3,stressors:'',     objectives:'Swing day',              routine:true, maxTrades:3,maxLoss:180,notes:'3/3. Perfect day.'},
  {id:7, date:'2025-11-12',mood:'neutre',   sleep:6,energy:7,discipline:62,patience:58,confidence:64,riskCtrl:60,consistency:58,emotional:60,planFollow:66,pnl:110, trades:2,wins:1,stressors:'Short night',objectives:'Focus 2 trades max',  routine:true,maxTrades:2,maxLoss:80,notes:'Respected limits despite fatigue.'},
  {id:8, date:'2025-11-13',mood:'bien',     sleep:7,energy:8,discipline:76,patience:72,confidence:78,riskCtrl:74,consistency:70,emotional:74,planFollow:80,pnl:480, trades:4,wins:3,stressors:'',     objectives:'Long trend',             routine:true, maxTrades:4,maxLoss:150,notes:'Good trend following.'},
  {id:9, date:'2025-11-17',mood:'terrible', sleep:4,energy:4,discipline:28,patience:24,confidence:30,riskCtrl:26,consistency:28,emotional:22,planFollow:32,pnl:-450,trades:6,wins:1,stressors:'Serious personal issue',objectives:'',routine:false,maxTrades:2,maxLoss:80,notes:'Should not have traded. Impulsive decision.'},
  {id:10,date:'2025-11-18',mood:'neutre',   sleep:6,energy:6,discipline:55,patience:50,confidence:58,riskCtrl:52,consistency:54,emotional:50,planFollow:60,pnl:60,  trades:1,wins:1,stressors:'',     objectives:'Only one trade',         routine:true, maxTrades:1,maxLoss:60, notes:'Wise decision after yesterday.'},
  {id:11,date:'2025-11-19',mood:'bien',     sleep:7,energy:7,discipline:74,patience:70,confidence:76,riskCtrl:72,consistency:68,emotional:72,planFollow:78,pnl:390, trades:3,wins:2,stressors:'',     objectives:'Back to basics',         routine:true, maxTrades:4,maxLoss:120,notes:'Good comeback.'},
  {id:12,date:'2025-11-20',mood:'excellent',sleep:9,energy:8,discipline:90,patience:86,confidence:92,riskCtrl:88,consistency:86,emotional:90,planFollow:94,pnl:1920,trades:3,wins:3,stressors:'',     objectives:'Trend confirmation',     routine:true, maxTrades:3,maxLoss:200,notes:'Excellent timing on all entries.'},
  {id:13,date:'2025-11-24',mood:'bien',     sleep:7,energy:8,discipline:80,patience:76,confidence:82,riskCtrl:78,consistency:74,emotional:78,planFollow:84,pnl:720, trades:3,wins:2,stressors:'',     objectives:'Week continuity',        routine:true, maxTrades:4,maxLoss:150,notes:'Maintained the level.'},
  {id:14,date:'2025-11-25',mood:'difficile',sleep:5,energy:5,discipline:44,patience:38,confidence:46,riskCtrl:42,consistency:44,emotional:40,planFollow:48,pnl:-180,trades:4,wins:1,stressors:'Accumulated fatigue', objectives:'Reduce position size',routine:false,maxTrades:2,maxLoss:80,notes:'Should have reduced from the morning.'},
  {id:15,date:'2025-11-26',mood:'neutre',   sleep:6,energy:6,discipline:60,patience:56,confidence:62,riskCtrl:58,consistency:58,emotional:56,planFollow:64,pnl:150, trades:2,wins:1,stressors:'',     objectives:'Recovery',               routine:true, maxTrades:2,maxLoss:80, notes:'Progressive return.'},
  {id:16,date:'2025-12-01',mood:'excellent',sleep:8,energy:9,discipline:86,patience:84,confidence:88,riskCtrl:84,consistency:80,emotional:86,planFollow:90,pnl:1640,trades:3,wins:3,stressors:'',     objectives:'Comeback week',          routine:true, maxTrades:4,maxLoss:200,notes:'Perfect comeback week.'},
  {id:17,date:'2025-12-02',mood:'bien',     sleep:8,energy:8,discipline:78,patience:74,confidence:80,riskCtrl:76,consistency:72,emotional:76,planFollow:82,pnl:560, trades:3,wins:2,stressors:'',     objectives:'Consolidate gains',      routine:true, maxTrades:3,maxLoss:150,notes:'Managed cleanly.'},
  {id:18,date:'2025-12-03',mood:'neutre',   sleep:6,energy:7,discipline:64,patience:60,confidence:66,riskCtrl:62,consistency:62,emotional:62,planFollow:68,pnl:200, trades:2,wins:1,stressors:'',     objectives:'Limit risk',             routine:true, maxTrades:2,maxLoss:100,notes:'Conservative but ok.'},
  {id:19,date:'2025-12-04',mood:'bien',     sleep:7,energy:8,discipline:76,patience:72,confidence:78,riskCtrl:74,consistency:70,emotional:74,planFollow:80,pnl:480, trades:3,wins:2,stressors:'',     objectives:'Precise entries',        routine:true, maxTrades:4,maxLoss:130,notes:'Good market reading.'},
  {id:20,date:'2025-12-05',mood:'excellent',sleep:9,energy:9,discipline:94,patience:90,confidence:96,riskCtrl:92,consistency:90,emotional:94,planFollow:98,pnl:2850,trades:4,wins:4,stressors:'',     objectives:'Record day',             routine:true, maxTrades:5,maxLoss:250,notes:'4/4! Best day of the year.'},
  {id:21,date:'2025-12-08',mood:'difficile',sleep:5,energy:5,discipline:42,patience:36,confidence:44,riskCtrl:40,consistency:42,emotional:36,planFollow:46,pnl:-240,trades:4,wins:1,stressors:'Work stress', objectives:'Max 2 trades',routine:false,maxTrades:2,maxLoss:80,notes:'Partially respected, 2 trades too many.'},
  {id:22,date:'2025-12-09',mood:'bien',     sleep:7,energy:7,discipline:72,patience:68,confidence:74,riskCtrl:70,consistency:66,emotional:70,planFollow:76,pnl:310, trades:2,wins:2,stressors:'',     objectives:'Clean comeback',         routine:true, maxTrades:3,maxLoss:100,notes:'Good recovery.'},
  {id:23,date:'2025-12-10',mood:'bien',     sleep:8,energy:8,discipline:80,patience:76,confidence:82,riskCtrl:78,consistency:74,emotional:78,planFollow:84,pnl:680, trades:3,wins:2,stressors:'',     objectives:'Follow the trend',       routine:true, maxTrades:4,maxLoss:150,notes:'Good trend following.'},
  {id:24,date:'2025-12-11',mood:'excellent',sleep:8,energy:9,discipline:88,patience:86,confidence:90,riskCtrl:86,consistency:84,emotional:88,planFollow:92,pnl:1580,trades:3,wins:3,stressors:'',     objectives:'Strong week',            routine:true, maxTrades:4,maxLoss:200,notes:'Very nice week.'},
  {id:25,date:'2025-12-15',mood:'neutre',   sleep:6,energy:6,discipline:62,patience:58,confidence:64,riskCtrl:60,consistency:60,emotional:60,planFollow:66,pnl:80,  trades:2,wins:1,stressors:'Holidays approaching',objectives:'Caution',routine:true,maxTrades:2,maxLoss:80,notes:'Distracted by holidays.'},
  {id:26,date:'2025-12-16',mood:'neutre',   sleep:7,energy:7,discipline:66,patience:62,confidence:68,riskCtrl:64,consistency:62,emotional:64,planFollow:70,pnl:220, trades:2,wins:2,stressors:'',     objectives:'Focus 2 trades',         routine:true, maxTrades:2,maxLoss:80, notes:'Disciplined in the caution zone.'},
  {id:27,date:'2026-01-05',mood:'bien',     sleep:8,energy:8,discipline:76,patience:72,confidence:78,riskCtrl:74,consistency:70,emotional:74,planFollow:80,pnl:420, trades:3,wins:2,stressors:'',     objectives:'January restart',        routine:true, maxTrades:4,maxLoss:130,notes:'Good restart after holidays.'},
  {id:28,date:'2026-01-06',mood:'excellent',sleep:9,energy:9,discipline:90,patience:88,confidence:92,riskCtrl:88,consistency:86,emotional:90,planFollow:94,pnl:2100,trades:3,wins:3,stressors:'',     objectives:'Start the year strong',  routine:true, maxTrades:4,maxLoss:200,notes:'Excellent start of the year.'},
  {id:29,date:'2026-01-07',mood:'bien',     sleep:7,energy:8,discipline:78,patience:74,confidence:80,riskCtrl:76,consistency:72,emotional:76,planFollow:82,pnl:690, trades:3,wins:2,stressors:'',     objectives:'Consolidate',            routine:true, maxTrades:4,maxLoss:150,notes:'Solid.'},
  {id:30,date:'2026-01-08',mood:'bien',     sleep:7,energy:7,discipline:74,patience:70,confidence:76,riskCtrl:72,consistency:68,emotional:72,planFollow:78,pnl:380, trades:2,wins:2,stressors:'',     objectives:'Clean end of week',      routine:true,maxTrades:3,maxLoss:120,notes:'Closed the week cleanly.'},
];

// ═══════════════════════════════════════════════════════════════════
// 🔧 COMPOSANTS DE BASE
// ═══════════════════════════════════════════════════════════════════
const TTBox=({active,payload,label,extra})=>{
  if(!active||!payload?.length)return null;
  return(
    <div style={{background:C.bgHigh,border:`1px solid ${C.brdHi}`,borderRadius:11,padding:'10px 14px',fontSize:11,boxShadow:'0 12px 40px rgba(0,0,0,0.75)'}}>
      <div style={{color:C.t2,fontWeight:700,marginBottom:6,fontSize:10}}>{label}</div>
      {payload.map((p,i)=>(
        <div key={i} style={{color:p.color||C.t1,fontFamily:'monospace',fontWeight:800,marginTop:i>0?3:0}}>
          {p.name}: <span style={{color:p.color||C.t1}}>{p.value}{p.unit||''}</span>
        </div>
      ))}
      {extra&&<div style={{borderTop:`1px solid ${C.brd}`,marginTop:6,paddingTop:6,fontSize:9,color:C.t3}}>{extra}</div>}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 🏆 SCORE GAUGE — centerpiece
// ═══════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════
// 🧠 SCORE CARD — Vertical stacked bars (pas circulaire)
// ═══════════════════════════════════════════════════════════════════
const ScoreCard=({sessions})=>{
  const latest=sessions[sessions.length-1];
  const score=calcPsych(latest);
  const sc=sColor(score);
  const trend=sessions.length>1?score-calcPsych(sessions[sessions.length-2]):0;
  const avgScore=Math.round(sessions.reduce((s,v)=>s+calcPsych(v),0)/sessions.length);
  const bestScore=Math.max(...sessions.map(calcPsych));
  const axeScores=AXES7.map(ax=>({
    ...ax,
    val:latest[ax.key]||0,
    avg:Math.round(sessions.reduce((s,v)=>s+(v[ax.key]||0),0)/sessions.length),
  }));

  // Animated counter
  const [animScore,setAnimScore]=useState(0);
  useEffect(()=>{
    const dur=1600,fps=60,total=dur/(1000/fps),step=score/total;
    let cur=0;
    const id=setInterval(()=>{
      cur+=step;
      if(cur>=score){setAnimScore(score);clearInterval(id);}
      else setAnimScore(Math.round(cur));
    },1000/fps);
    return()=>clearInterval(id);
  },[score]);

  const em=MOODS.find(m=>m.id===latest.mood);

  return(
    <GlassCard custom={0} glow={sc} style={{padding:'24px 22px',display:'flex',flexDirection:'column',gap:0}}>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18}}>
        <ST color={sc} mb={0}>Psychological Score</ST>
        <div style={{display:'flex',gap:7}}>
          <div style={{padding:'3px 10px',borderRadius:20,background:`${shade(C.purple,'18')}`,border:`1px solid ${shade(C.purple,'30')}`,fontSize:9,fontWeight:700,color:C.purple}}>Avg {avgScore}</div>
          <div style={{padding:'3px 10px',borderRadius:20,background:`${shade(C.gold,'18')}`,border:`1px solid ${shade(C.gold,'30')}`,fontSize:9,fontWeight:700,color:C.gold}}>Best {bestScore}</div>
        </div>
      </div>

      {/* ── BIG SCORE : horizontal segmented bar ── */}
      <div style={{
        padding:'18px 20px',borderRadius:16,
        background:`linear-gradient(135deg,${shade(sc,'0F')},${shade(sc,'06')})`,
        border:`1px solid ${shade(sc,'30')}`,marginBottom:16,
      }}>
        {/* Valeur + label */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:12}}>
          <div>
            <div style={{fontSize:8,color:C.t3,marginBottom:4,textTransform:'uppercase',letterSpacing:'1px',fontWeight:700}}>Today's Score</div>
            <div style={{display:'flex',alignItems:'baseline',gap:6}}>
              <motion.span
                key={score}
                initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}
                style={{fontSize:64,fontWeight:900,fontFamily:'monospace',lineHeight:1,
                  color:sc,textShadow:`0 0 40px ${shade(sc,'70')}`,letterSpacing:'-3px'}}>
                {animScore}
              </motion.span>
              <span style={{fontSize:18,color:C.t3,fontWeight:700,marginBottom:4}}>/100</span>
            </div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:13,fontWeight:900,color:sc,letterSpacing:'-0.3px'}}>{sLabel(score)}</div>
            <div style={{fontSize:10,color:C.t2,marginTop:2,display:'flex',alignItems:'center',gap:4,justifyContent:'flex-end'}}>
              <span style={{color:trend>=0?C.green:C.danger,fontWeight:800}}>{trend>=0?'Up':'Down'} {trend>=0?'+':''}{trend} pts</span>
              <span style={{color:C.t3}}>vs yesterday</span>
            </div>
          </div>
        </div>

        {/* Segmented bar 0→100 with color gradient */}
        <div style={{position:'relative',height:14,borderRadius:7,background:'rgba(255,255,255,0.05)',overflow:'hidden',marginBottom:6}}>
          {/* Fixed color zones */}
          <div style={{position:'absolute',inset:0,background:`linear-gradient(90deg,
            ${shade(C.danger,'45')} 0%,${shade(C.danger,'45')} 30%,
            ${shade(C.orange,'45')} 30%,${shade(C.orange,'45')} 45%,
            ${shade(C.warn,'45')} 45%,${shade(C.warn,'45')} 60%,
            ${shade(C.cyan,'45')} 60%,${shade(C.cyan,'45')} 75%,
            ${shade(C.green,'45')} 75%,${shade(C.green,'45')} 100%
          )`,borderRadius:7}}/>
          {/* Animated fill */}
          <motion.div
            initial={{width:0}}
            animate={{width:`${score}%`}}
            transition={{duration:1.6,ease:[0.22,1,0.36,1]}}
            style={{position:'absolute',top:0,left:0,height:'100%',borderRadius:7,
              background:`linear-gradient(90deg,
                ${C.danger} 0%,${C.danger} 30%,
                ${C.orange} 30%,${C.orange} 45%,
                ${C.warn}   45%,${C.warn}   60%,
                ${C.cyan}   60%,${C.cyan}   75%,
                ${C.green}  75%,${C.green}  100%
              )`,
              boxShadow:`0 0 16px ${shade(sc,'60')}`,
            }}/>
          {/* Marqueur score moyen */}
          <div style={{position:'absolute',top:-2,bottom:-2,left:`${avgScore}%`,
            width:2,background:'rgba(255,255,255,0.6)',borderRadius:1,zIndex:2,
            boxShadow:'0 0 4px rgba(255,255,255,0.4)'}}/>
        </div>
        {/* Zone labels */}
        <div style={{display:'flex',justifyContent:'space-between',fontSize:7.5,color:C.t3,fontWeight:600}}>
          <span>Critical</span><span>Fragile</span><span>Fair</span><span>Solid</span><span>Elite</span>
        </div>
        <div style={{fontSize:8,color:C.t3,marginTop:4,display:'flex',alignItems:'center',gap:4}}>
          <div style={{width:8,height:1.5,background:'rgba(255,255,255,0.5)',borderRadius:1}}/>
          White bar = historical average ({avgScore}/100)
        </div>
      </div>

      {/* ── Session info: mood + routine + physical ── */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:16}}>
        {[
          {l:'Mood',       v:em?.label||'-',       c:em?.color||C.t3},
          {l:'Routine',    v:latest.routine?'Completed':'Not done', c:latest.routine?C.green:C.danger},
          {l:'Sleep',      v:`${latest.sleep||'—'}/10`,         c:C.purple},
        ].map(({l,v,c})=>(
          <div key={l} style={{padding:'9px 10px',borderRadius:11,background:'rgba(255,255,255,0.04)',border:`1px solid ${C.brd}`,textAlign:'center'}}>
            <div style={{fontSize:7.5,color:C.t3,marginBottom:3,textTransform:'uppercase',letterSpacing:'0.5px'}}>{l}</div>
            <div style={{fontSize:11,fontWeight:800,color:c,lineHeight:1.3}}>{v}</div>
          </div>
        ))}
      </div>

      {/* ── Axes breakdown : barres horizontales ── */}
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {axeScores.map((ax,i)=>{
          const delta=ax.val-ax.avg;
          const pct=ax.val;
          return(
            <div key={ax.key}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:3}}>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <div style={{width:6,height:6,borderRadius:'50%',background:ax.color,flexShrink:0,boxShadow:`0 0 5px ${ax.color}`}}/>
                  <span style={{fontSize:10,color:C.t2,fontWeight:600}}>{ax.label}</span>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:8,color:delta>0?C.green:delta<0?C.danger:C.t3,fontWeight:700,minWidth:24,textAlign:'right'}}>
                    {delta>0?'+':''}{delta!==0?delta:'—'}
                  </span>
                  <span style={{fontSize:12,fontWeight:900,color:ax.color,fontFamily:'monospace',minWidth:24,textAlign:'right'}}>{ax.val}</span>
                </div>
              </div>
              <div style={{height:6,borderRadius:3,background:'rgba(255,255,255,0.05)',position:'relative',overflow:'visible'}}>
                {/* Avg marker */}
                <div style={{position:'absolute',top:-1,bottom:-1,left:`${ax.avg}%`,width:1.5,
                  background:'rgba(255,255,255,0.35)',borderRadius:1,zIndex:3}}/>
                <motion.div
                  initial={{width:0}}
                  animate={{width:`${pct}%`}}
                  transition={{duration:0.8,delay:i*0.04,ease:[0.22,1,0.36,1]}}
                  style={{height:'100%',borderRadius:3,
                    background:`linear-gradient(90deg,${shade(ax.color,'45')},${ax.color})`,
                    boxShadow:`0 0 6px ${shade(ax.color,'35')}`}}/>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{marginTop:8,fontSize:8,color:C.t3,display:'flex',alignItems:'center',gap:4}}>
        <div style={{width:10,height:1.5,background:'rgba(255,255,255,0.35)',borderRadius:1}}/>
        White vertical bar = historical average per axis
      </div>
    </GlassCard>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 🗓️ PSYCHOLOGY BY DAY OF WEEK — version premium
// ═══════════════════════════════════════════════════════════════════
const PsychByDayLegacy=({sessions})=>{
  const data=useMemo(()=>{
    const m=DAYS_FR.map((d,di)=>({day:d,di,score:0,pnl:0,count:0,emotional:0,wins:0,sessions:[]}));
    sessions.forEach(s=>{
      const di=new Date(s.date+'T12:00:00').getDay();
      const sc=calcPsych(s);
      m[di].score+=sc; m[di].pnl+=(s.pnl||0); m[di].count++;
      if(sc<50)m[di].emotional++;
      if((s.pnl||0)>0)m[di].wins++;
      m[di].sessions.push(s);
    });
    return m.map(d=>({
      day:d.day, di:d.di,
      score:     d.count?Math.round(d.score/d.count):0,
      emotRate:  d.count?Math.round((d.emotional/d.count)*100):0,
      winRate:   d.count?Math.round((d.wins/d.count)*100):0,
      avgPnl:    d.count?Math.round(d.pnl/d.count):0,
      count:     d.count,
      sessions:  d.sessions,
    }));
  },[sessions]);

  const [hovered,setHovered]=useState(null);
  const maxScore=Math.max(...data.map(d=>d.score),1);

  // Meilleur / pire jour
  const withData=data.filter(d=>d.count>0);
  const bestDay=withData.reduce((a,b)=>b.score>a.score?b:a,withData[0]||data[0]);
  const worstDay=withData.reduce((a,b)=>b.score<a.score?b:a,withData[0]||data[0]);

  return(
    <GlassCard custom={6} glow={C.purple} style={{padding:'26px 24px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
        <ST color={C.purple} mb={0}>Psychology by Day of Week</ST>
        {/* Summary best/worst */}
        <div style={{display:'flex',gap:10}}>
          {bestDay&&<div style={{padding:'4px 12px',borderRadius:20,background:`${shade(C.green,'15')}`,border:`1px solid ${shade(C.green,'28')}`,fontSize:9,fontWeight:700,color:C.green}}>
            Best {bestDay.day} / {bestDay.score}
          </div>}
          {worstDay&&worstDay.day!==bestDay?.day&&<div style={{padding:'4px 12px',borderRadius:20,background:`${shade(C.danger,'15')}`,border:`1px solid ${shade(C.danger,'28')}`,fontSize:9,fontWeight:700,color:C.danger}}>
            Risk {worstDay.day} / {worstDay.score}
          </div>}
        </div>
      </div>

      {/* ── Barres verticales custom ── */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:8,alignItems:'flex-end',height:220,marginBottom:14}}>
        {data.map((d,i)=>{
          const sc=sColor(d.score);
          const isHov=hovered===i;
          const isBest=d.day===bestDay?.day&&d.count>0;
          const isWorst=d.day===worstDay?.day&&d.count>0&&worstDay?.day!==bestDay?.day;
          const barH=d.count?Math.max(28,Math.round((d.score/100)*180)):18;

          return(
            <div key={d.day}
              onMouseEnter={()=>setHovered(i)}
              onMouseLeave={()=>setHovered(null)}
              style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-end',height:'100%',cursor:d.count?'pointer':'default',gap:6}}>

              {/* Tooltip on hover */}
              <AnimatePresence>
                {isHov&&d.count>0&&(
                  <motion.div initial={{opacity:0,y:6,scale:0.92}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:4,scale:0.95}}
                    transition={{duration:0.18}}
                    style={{position:'absolute',marginBottom:4,zIndex:20,
                      background:C.bgHigh,border:`1px solid ${shade(sc,'40')}`,borderRadius:11,
                      padding:'10px 12px',boxShadow:`0 12px 36px rgba(0,0,0,0.8),0 0 0 1px ${shade(sc,'20')}`,
                      pointerEvents:'none',minWidth:130,transform:'translateY(-210px)'}}>
                    <div style={{fontSize:11,fontWeight:900,color:sc,marginBottom:4}}>{d.day} — {d.count} session{d.count>1?'s':''}</div>
                    <div style={{fontSize:10,color:C.t1,fontWeight:800,marginBottom:2}}>Score: {d.score}/100</div>
                    <div style={{fontSize:10,color:d.avgPnl>=0?C.green:C.danger,fontFamily:'monospace',fontWeight:800}}>Avg P&L: {d.avgPnl>=0?'+':''}${d.avgPnl}</div>
                    <div style={{fontSize:9,color:C.t2,marginTop:3}}>Win Rate: {d.winRate}%</div>
                    <div style={{fontSize:9,color:C.danger}}>Emot. rate: {d.emotRate}%</div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Score label above */}
              {d.count>0&&(
                <div style={{fontSize:10,fontWeight:900,color:isHov?sc:C.t3,fontFamily:'monospace',
                  transition:'color 0.2s',marginBottom:2}}>
                  {d.score}
                </div>
              )}

              {/* Main bar */}
              <div style={{width:'100%',position:'relative',display:'flex',flexDirection:'column',alignItems:'center'}}>
                {/* Glow halo */}
                {d.count>0&&isHov&&(
                  <div style={{position:'absolute',bottom:0,left:'50%',transform:'translateX(-50%)',
                    width:'110%',height:barH+20,background:`radial-gradient(ellipse at bottom,${shade(sc,'30')},transparent 70%)`,
                    borderRadius:'50%',filter:'blur(8px)',pointerEvents:'none'}}/>
                )}

                {/* Barre */}
                <motion.div
                  initial={{height:0,opacity:0}}
                  animate={{height:barH,opacity:1}}
                  transition={{duration:0.9,delay:i*0.06,ease:[0.22,1,0.36,1]}}
                  style={{
                    width:'100%',borderRadius:'6px 6px 3px 3px',
                    position:'relative',overflow:'hidden',
                    background:d.count
                      ?`linear-gradient(180deg,${shade(sc,'EE')} 0%,${shade(sc,'99')} 60%,${shade(sc,'44')} 100%)`
                      :'rgba(255,255,255,0.05)',
                    boxShadow:isHov&&d.count?`0 0 20px ${shade(sc,'60')},0 4px 16px ${shade(sc,'30')}`:'none',
                    transition:'box-shadow 0.2s',
                    border:`1px solid ${d.count?(isHov ? shade(sc,'80') : shade(sc,'30')):'rgba(255,255,255,0.07)'}`,
                  }}>
                  {/* Internal shimmer */}
                  {d.count>0&&(
                    <motion.div
                      animate={{x:['-100%','100%']}}
                      transition={{duration:2.5,repeat:Infinity,delay:i*0.3,ease:'linear'}}
                      style={{position:'absolute',top:0,bottom:0,width:'40%',
                        background:`linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent)`,
                        transform:'skewX(-15deg)'}}/>
                  )}
                  {/* P&L indicator (small bottom dot) */}
                  {d.count>0&&(
                    <div style={{position:'absolute',bottom:4,left:'50%',transform:'translateX(-50%)',
                      width:5,height:5,borderRadius:'50%',
                      background:d.avgPnl>=0?C.green:C.danger,
                      boxShadow:`0 0 5px ${d.avgPnl>=0?C.green:C.danger}`}}/>
                  )}
                  {/* Best badge */}
                  {isBest&&(
                    <div style={{position:'absolute',top:4,left:'50%',transform:'translateX(-50%)',
                      width:14,height:2,borderRadius:999,background:C.gold,boxShadow:`0 0 8px ${C.gold}`}}/>
                  )}
                </motion.div>

                {/* Emotional bar below */}
                {d.count>0&&d.emotRate>0&&(
                  <motion.div
                    initial={{height:0}} animate={{height:Math.max(3,Math.round(d.emotRate/100*20))}}
                    transition={{duration:0.7,delay:i*0.06+0.4}}
                    style={{width:'80%',borderRadius:'0 0 4px 4px',marginTop:1,
                      background:`linear-gradient(180deg,${shade(C.danger,'90')},${shade(C.danger,'40')})`,
                      boxShadow:`0 2px 6px ${shade(C.danger,'30')}`}}/>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Day labels ── */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:8,marginBottom:16}}>
        {data.map((d,i)=>(
          <div key={d.day} onMouseEnter={()=>setHovered(i)} onMouseLeave={()=>setHovered(null)}
            style={{textAlign:'center',cursor:'default'}}>
            <div style={{fontSize:11,fontWeight:800,color:hovered===i?sColor(d.score):d.count?C.t2:C.t4,transition:'color 0.2s'}}>{d.day}</div>
            {d.count>0&&<div style={{fontSize:8,color:C.t3,marginTop:1}}>{d.count}×</div>}
          </div>
        ))}
      </div>

      {/* ── Stats row ── */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,paddingTop:14,borderTop:`1px solid ${C.brd}`}}>
        {[
          {l:'Best Day',v:bestDay?.day||'—',sub:`Score ${bestDay?.score||0}`,c:C.green},
          {l:'Max Avg P&L', v:bestDay?.avgPnl>=0?`+$${bestDay?.avgPnl||0}`:`-$${Math.abs(bestDay?.avgPnl||0)}`,sub:bestDay?.day||'—',c:C.green},
          {l:'Max Win Rate', v:`${Math.max(...data.filter(d=>d.count>0).map(d=>d.winRate),0)}%`,sub:`${data.filter(d=>d.count>0).sort((a,b)=>b.winRate-a.winRate)[0]?.day||'—'}`,c:C.cyan},
          {l:'Max Emot. Rate',v:`${Math.max(...data.filter(d=>d.count>0).map(d=>d.emotRate),0)}%`,sub:data.filter(d=>d.count>0).sort((a,b)=>b.emotRate-a.emotRate)[0]?.day||'—',c:C.danger},
        ].map(({l,v,sub,c})=>(
          <div key={l} style={{padding:'9px 10px',borderRadius:10,background:'rgba(255,255,255,0.03)',border:`1px solid ${C.brd}`,textAlign:'center'}}>
            <div style={{fontSize:7.5,color:C.t3,marginBottom:4,textTransform:'uppercase',letterSpacing:'0.5px',fontWeight:700}}>{l}</div>
            <div style={{fontSize:14,fontWeight:900,color:c,fontFamily:'monospace',marginBottom:2}}>{v}</div>
            <div style={{fontSize:9,color:C.t3}}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{display:'flex',gap:16,marginTop:12,flexWrap:'wrap'}}>
        {[
          {c:C.green, l:'Score ≥ 75 — Optimal'},
          {c:C.cyan,  l:'60–75 — Solid'},
          {c:C.warn,  l:'45–60 — Fair'},
          {c:C.danger,l:'< 45 — Risky'},
        ].map(({c,l})=>(
          <div key={l} style={{display:'flex',alignItems:'center',gap:5,fontSize:8.5,color:C.t3}}>
            <div style={{width:8,height:8,borderRadius:2,background:c,opacity:0.9}}/>
            {l}
          </div>
        ))}
        <div style={{display:'flex',alignItems:'center',gap:5,fontSize:8.5,color:C.t3}}>
          <div style={{width:5,height:5,borderRadius:'50%',background:C.danger}}/>
          Bottom dot = emotional rate
        </div>
      </div>
    </GlassCard>
  );
};

const PsychByDay=({sessions})=>{
  const money=v=>`${v>=0?'+':'-'}$${Math.abs(Math.round(v||0)).toLocaleString()}`;
  const data=useMemo(()=>{
    const days=DAYS_FR.map((day,di)=>({day,di,score:0,pnl:0,count:0,emotional:0,wins:0,best:0,worst:0}));
    sessions.forEach(session=>{
      const di=new Date(`${session.date}T12:00:00`).getDay();
      const score=calcPsych(session);
      const pnl=session.pnl||0;
      const bucket=days[di];
      bucket.score+=score;
      bucket.pnl+=pnl;
      bucket.count+=1;
      if(score<50) bucket.emotional+=1;
      if(pnl>0) bucket.wins+=1;
      bucket.best=Math.max(bucket.best,pnl);
      bucket.worst=Math.min(bucket.worst,pnl);
    });
    return days.map(bucket=>({
      day:bucket.day,
      score:bucket.count?Math.round(bucket.score/bucket.count):0,
      avgPnl:bucket.count?Math.round(bucket.pnl/bucket.count):0,
      totalPnl:Math.round(bucket.pnl),
      winRate:bucket.count?Math.round((bucket.wins/bucket.count)*100):0,
      emotRate:bucket.count?Math.round((bucket.emotional/bucket.count)*100):0,
      count:bucket.count,
      bestTrade:bucket.best,
      worstTrade:bucket.worst,
      tone:sColor(bucket.count?Math.round(bucket.score/bucket.count):0),
    }));
  },[sessions]);

  const activeDays=data.filter(day=>day.count>0);
  const bestDay=activeDays.reduce((best,day)=>!best||day.score>best.score?day:best,null);
  const riskDay=activeDays.reduce((worst,day)=>{
    if(!worst) return day;
    if(day.score<worst.score) return day;
    if(day.score===worst.score&&day.emotRate>worst.emotRate) return day;
    return worst;
  },null);
  const topWinDay=activeDays.reduce((best,day)=>!best||day.winRate>best.winRate?day:best,null);
  const topFlowDay=activeDays.reduce((best,day)=>!best||day.avgPnl>best.avgPnl?day:best,null);

  return(
    <GlassCard custom={6} glow={C.purple} style={{padding:'26px 24px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:16,marginBottom:18,flexWrap:'wrap'}}>
        <ST color={C.purple} mb={0}>Psychology by Day of Week</ST>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          {bestDay&&<div style={{padding:'5px 11px',borderRadius:999,background:shade(C.green,'14'),border:`1px solid ${shade(C.green,'24')}`,fontSize:9,fontWeight:800,color:C.green}}>
            Best {bestDay.day} / {bestDay.score}
          </div>}
          {riskDay&&riskDay.day!==bestDay?.day&&<div style={{padding:'5px 11px',borderRadius:999,background:shade(C.danger,'14'),border:`1px solid ${shade(C.danger,'24')}`,fontSize:9,fontWeight:800,color:C.danger}}>
            Risk {riskDay.day} / {riskDay.score}
          </div>}
        </div>
      </div>

      <div style={{padding:'14px 14px 10px',borderRadius:18,border:`1px solid ${C.brd}`,background:'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))',marginBottom:16}}>
        <ResponsiveContainer width="100%" height={310}>
          <ComposedChart data={data} margin={{top:8,right:8,left:-10,bottom:0}}>
            <defs>
              <linearGradient id="mfPsychDayPnl" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={shade(C.cyan,'55')} />
                <stop offset="100%" stopColor={shade(C.cyan,'06')} />
              </linearGradient>
            </defs>
            <CartesianGrid {...CHART_GRID} vertical={false}/>
            <XAxis dataKey="day" axisLine={false} tickLine={false} {...CHART_AXIS_SMALL}/>
            <YAxis yAxisId="score" domain={[0,100]} width={34} axisLine={false} tickLine={false} {...CHART_AXIS_SMALL}/>
            <YAxis yAxisId="pnl" orientation="right" width={56} axisLine={false} tickLine={false} tickFormatter={value=>`${value>=0?'+':'-'}$${Math.abs(value)}`} {...CHART_AXIS_SMALL}/>
            <Tooltip
              cursor={chartCursor(C.purple)}
              content={({active,payload,label})=>{
                if(!active||!payload?.length) return null;
                const row=payload[0]?.payload;
                if(!row) return null;
                return(
                  <TTBox
                    active={active}
                    label={label}
                    payload={[
                      {name:'Score',value:row.score,color:sColor(row.score),unit:'/100'},
                      {name:'Win rate',value:row.winRate,color:C.cyan,unit:'%'},
                      {name:'Avg P&L',value:money(row.avgPnl),color:row.avgPnl>=0?C.green:C.danger},
                      {name:'Emotion',value:row.emotRate,color:C.danger,unit:'%'},
                    ]}
                    extra={`${row.count} session${row.count>1?'s':''} • Total ${money(row.totalPnl)}`}
                  />
                );
              }}
              wrapperStyle={chartTooltipStyle}
            />
            <ReferenceLine yAxisId="score" y={60} stroke={shade(C.warn,'60')} strokeDasharray="4 4" />
            <Area yAxisId="pnl" type="monotone" dataKey="avgPnl" stroke={C.teal} fill="url(#mfPsychDayPnl)" strokeWidth={2.2} animationDuration={900} />
            <Bar yAxisId="score" dataKey="score" barSize={24} radius={[10,10,5,5]} animationDuration={700}>
              {data.map((entry)=>(
                <Cell key={entry.day} fill={entry.count?shade(entry.tone,'D2'):'rgba(255,255,255,0.08)'} stroke={entry.count?shade(entry.tone,'38'):'rgba(255,255,255,0.06)'} />
              ))}
            </Bar>
            <Line yAxisId="score" type="monotone" dataKey="winRate" stroke={C.cyan} strokeWidth={2.6} dot={false} activeDot={chartActiveDot(C.cyan)} animationDuration={950} />
            <Line yAxisId="score" type="monotone" dataKey="emotRate" stroke={C.danger} strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={chartActiveDot(C.danger)} animationDuration={980} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:10,marginBottom:14}}>
        {[
          {label:'Best day',value:bestDay?bestDay.day:'—',sub:bestDay?`Score ${bestDay.score}`:'No sessions',tone:C.green},
          {label:'Risk day',value:riskDay?riskDay.day:'—',sub:riskDay?`${riskDay.emotRate}% emotional`:'No sessions',tone:C.danger},
          {label:'Top win rate',value:topWinDay?`${topWinDay.winRate}%`:'0%',sub:topWinDay?topWinDay.day:'No sessions',tone:C.cyan},
          {label:'Best avg P&L',value:topFlowDay?money(topFlowDay.avgPnl):'$0',sub:topFlowDay?topFlowDay.day:'No sessions',tone:topFlowDay&&topFlowDay.avgPnl<0?C.danger:C.teal},
        ].map(card=>(
          <div key={card.label} style={{padding:'10px 11px',borderRadius:14,border:`1px solid ${shade(card.tone,'20')}`,background:'rgba(255,255,255,0.022)'}}>
            <div style={{fontSize:9,color:C.t3,fontWeight:800,letterSpacing:'0.14em',textTransform:'uppercase',marginBottom:7}}>{card.label}</div>
            <div style={{fontSize:18,fontWeight:900,color:card.tone,letterSpacing:'-0.03em',marginBottom:4}}>{card.value}</div>
            <div style={{fontSize:11,color:C.t2}}>{card.sub}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(7,minmax(0,1fr))',gap:8,paddingTop:14,borderTop:`1px solid ${C.brd}`}}>
        {data.map(day=>(
          <div key={day.day} style={{padding:'10px 8px',borderRadius:12,border:`1px solid ${day.count?shade(day.tone,'18'):C.brd}`,background:day.count?shade(day.tone,'08'):'rgba(255,255,255,0.02)'}}>
            <div style={{fontSize:10,fontWeight:800,color:day.count?C.t1:C.t3,marginBottom:8,textAlign:'center'}}>{day.day}</div>
            <div style={{fontSize:16,fontWeight:900,color:day.count?day.tone:C.t3,textAlign:'center',letterSpacing:'-0.03em'}}>{day.count?day.score:'—'}</div>
            <div style={{fontSize:10,color:C.t3,textAlign:'center',marginTop:3}}>{day.count?`${day.count} sessions`:'No data'}</div>
            {day.count>0&&<div style={{fontSize:10,color:day.avgPnl>=0?C.green:C.danger,textAlign:'center',marginTop:6,fontFamily:'monospace'}}>{money(day.avgPnl)}</div>}
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

const ProfileRadar=({sessions})=>{
  const [compareIdx,setCompareIdx]=useState('avg');
  const latest=sessions[sessions.length-1];
  const avg=useMemo(()=>{
    const res={};
    AXES7.forEach(ax=>{res[ax.key]=Math.round(sessions.reduce((s,v)=>s+(v[ax.key]||0),0)/sessions.length);});
    return res;
  },[sessions]);
  const compare=compareIdx==='avg'?avg:sessions[sessions.length-1-(parseInt(compareIdx)||1)];
  const N=7,SZ=310,cx=SZ/2,cy=SZ/2,R=SZ/2.85;
  const polar=(i,r)=>{const a=(2*Math.PI*i/N)-Math.PI/2;return[cx+r*Math.cos(a),cy+r*Math.sin(a)];};
  const norm=v=>Math.min((v||0)/100,1);
  const poly=src=>AXES7.map((ax,i)=>{const[x,y]=polar(i,R*norm(src?.[ax.key]||0));return`${i===0?'M':'L'}${x.toFixed(1)},${y.toFixed(1)}`;}).join(' ')+'Z';
  return(
    <GlassCard custom={4} glow={C.purple} style={{padding:'24px 22px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <ST color={C.purple} mb={0}>Psychological Profile</ST>
        <select value={compareIdx} onChange={e=>setCompareIdx(e.target.value)}
          style={{background:C.bgHigh,border:`1px solid ${C.brd}`,borderRadius:8,padding:'4px 8px',color:C.t2,fontSize:9,fontFamily:'inherit',outline:'none',cursor:'pointer'}}>
          <option value="avg">vs Average</option>
          <option value="1">vs J-1</option>
          <option value="2">vs J-2</option>
          <option value="7">vs J-7</option>
        </select>
      </div>
      <div style={{display:'flex',justifyContent:'center'}}>
        <svg width={SZ} height={SZ} viewBox={`0 0 ${SZ} ${SZ}`} style={{maxWidth:'100%',overflow:'visible'}}>
          <defs>
            <radialGradient id="rg-m"><stop offset="0%" stopColor={C.purple} stopOpacity={0.42}/><stop offset="100%" stopColor={C.blue} stopOpacity={0.06}/></radialGradient>
            <radialGradient id="rg-c"><stop offset="0%" stopColor={C.cyan} stopOpacity={0.22}/><stop offset="100%" stopColor={C.cyan} stopOpacity={0}/></radialGradient>
            <filter id="rg-gl"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          </defs>
          {[0.25,0.5,0.75,1].map(s=>(
            <path key={s} d={AXES7.map((_,i)=>{const[x,y]=polar(i,R*s);return`${i===0?'M':'L'}${x.toFixed(1)},${y.toFixed(1)}`;}).join(' ')+'Z'}
              fill={s===1?'rgba(var(--mf-purple-rgb, 167, 139, 250),0.04)':'none'}
              stroke={s===1?'rgba(var(--mf-purple-rgb, 167, 139, 250),0.22)':'rgba(255,255,255,0.06)'} strokeWidth={s===1?1.5:0.7}/>
          ))}
          {[25,50,75,100].map(pct=>{
            const[x,y]=polar(0,R*(pct/100));
            return<text key={pct} x={x-6} y={y} fill="rgba(255,255,255,0.2)" fontSize={7.5} fontFamily="monospace" textAnchor="end">{pct}</text>;
          })}
          {AXES7.map((_,i)=>{const[x,y]=polar(i,R);return<line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.07)" strokeWidth={1} strokeDasharray="3 4"/>;} )}
          {compare&&<path d={poly(compare)} fill="url(#rg-c)" stroke="rgba(var(--mf-accent-rgb, 6, 230, 255),0.38)" strokeWidth={1.5} strokeDasharray="5 4"/>}
          <motion.path initial={{pathLength:0,opacity:0}} animate={{pathLength:1,opacity:1}} transition={{duration:1.8,delay:0.2}}
            d={poly(latest)} fill="url(#rg-m)" stroke="rgba(var(--mf-purple-rgb, 167, 139, 250),0.95)" strokeWidth={2} filter="url(#rg-gl)"/>
          {AXES7.map((ax,i)=>{
            const[dx,dy]=polar(i,R*norm(latest?.[ax.key]||0));
            const[lx,ly]=polar(i,R+34);
            const score=latest?.[ax.key]||0;
            const delta=compare?Math.round(score-(compare[ax.key]||0)):0;
            return(
              <g key={i}>
                <motion.circle cx={dx} cy={dy} r={10} fill={ax.color} opacity={0.12}
                  animate={{r:[10,18,10],opacity:[0.12,0,0.12]}} transition={{duration:2.8,repeat:Infinity,delay:i*0.35}}/>
                <circle cx={dx} cy={dy} r={4.5} fill={ax.color} stroke="rgba(255,255,255,0.85)" strokeWidth={1.5}/>
                <text x={lx.toFixed(1)} y={(ly-5).toFixed(1)} textAnchor="middle" fill={ax.color} fontSize={9.5} fontWeight={700}>{ax.label}</text>
                <text x={lx.toFixed(1)} y={(ly+7).toFixed(1)} textAnchor="middle" fill={delta>0?C.green:delta<0?C.danger:'rgba(255,255,255,0.25)'} fontSize={8} fontWeight={700}>
                  {score}{delta!==0?` (${delta>0?'+':''}${delta})`:''}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div style={{display:'flex',gap:16,justifyContent:'center',marginTop:2}}>
        {[{c:C.purple,l:'Current session'},{c:C.cyan,l:compareIdx==='avg'?'Average':'Previous session',dash:true}].map(({c,l,dash})=>(
          <span key={l} style={{fontSize:9,color:c,display:'flex',alignItems:'center',gap:5}}>
            <span style={{width:14,height:2,background:c,display:'inline-block',borderRadius:1,opacity:dash?0.7:1}}/>{l}
          </span>
        ))}
      </div>
    </GlassCard>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 📈 SCORE EVOLUTION + PNL
// ═══════════════════════════════════════════════════════════════════
const ScoreEvolution=({sessions})=>{
  const data=useMemo(()=>{
    let cum=0;
    return [...sessions].sort((a,b)=>a.date.localeCompare(b.date)).map(s=>({
      date:s.date.substring(5),
      score:calcPsych(s),
      pnl:(cum+=(s.pnl||0),cum),
      mood:s.mood,
    }));
  },[sessions]);
  const CustomTT=({active,payload,label})=>{
    if(!active||!payload?.length)return null;
    const d=payload[0]?.payload;
    const sc=sColor(d?.score||0);
    return(
      <div style={{background:C.bgHigh,border:`1px solid ${C.brdHi}`,borderRadius:11,padding:'10px 14px',fontSize:11,boxShadow:'0 12px 40px rgba(0,0,0,0.75)'}}>
        <div style={{color:C.t2,fontWeight:700,marginBottom:6,fontSize:10}}>{label}</div>
        <div style={{color:sc,fontFamily:'monospace',fontWeight:800}}>Score: {d?.score}/100 / {sLabel(d?.score||0)}</div>
        <div style={{color:d?.pnl>=0?C.green:C.danger,fontFamily:'monospace',fontWeight:800,marginTop:2}}>Cumulative P&L: {d?.pnl>=0?'+':''}${d?.pnl?.toLocaleString()}</div>
        <div style={{color:C.t3,fontSize:9,marginTop:3}}>{MOODS.find(m=>m.id===d?.mood)?.label}</div>
      </div>
    );
  };
  return(
    <GlassCard custom={5} glow={C.blue} style={{padding:'24px 22px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
        <ST color={C.blue} mb={0}>Mental Score vs Cumulative P&L</ST>
        <div style={{display:'flex',gap:14}}>
          {[{c:C.purple,l:'Score'},{c:C.green,l:'Cumulative P&L'}].map(({c,l})=>(
            <div key={l} style={{display:'flex',alignItems:'center',gap:5,fontSize:9,color:C.t3}}>
              <div style={{width:9,height:9,borderRadius:'50%',background:c}}/>{l}
            </div>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={data} margin={{top:8,right:20,bottom:0,left:0}}>
          <defs>
            <linearGradient id="ev-pnl" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.green} stopOpacity={0.35}/><stop offset="100%" stopColor={C.green} stopOpacity={0.02}/>
            </linearGradient>
          </defs>
          <CartesianGrid {...CHART_GRID}/>
          <XAxis {...CHART_AXIS_SMALL} dataKey="date" tick={{...CHART_AXIS_SMALL.tick,fontSize:8.5}} interval={3}/>
          <YAxis {...CHART_AXIS_SMALL} yAxisId="s" domain={[0,100]} tick={{...CHART_AXIS_SMALL.tick,fontSize:8}} width={26}/>
          <YAxis {...CHART_AXIS_SMALL} yAxisId="p" orientation="right" tick={{...CHART_AXIS_SMALL.tick,fontSize:8}} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} width={38}/>
          <Tooltip content={<CustomTT/>} cursor={chartCursor(C.purple)}/>
          <ReferenceLine yAxisId="s" y={70} stroke={`${shade(C.green,'22')}`} strokeDasharray="4 3"/>
          <ReferenceLine yAxisId="s" y={50} stroke="rgba(255,255,255,0.07)" strokeDasharray="4 3"/>
          <Area yAxisId="p" type="monotone" dataKey="pnl" stroke={C.green} strokeWidth={2.5} fill="url(#ev-pnl)" dot={false} activeDot={chartActiveDot(C.green,5,'#fff')} name="pnl" {...CHART_MOTION_SOFT}/>
          <Line yAxisId="s" type="monotone" dataKey="score" stroke={C.purple} strokeWidth={2.5}
            dot={(p)=>{
              const sc=sColor(p.value);
              return<circle key={p.index} cx={p.cx} cy={p.cy} r={4} fill={sc} stroke="rgba(255,255,255,0.8)" strokeWidth={1.5}/>;
            }}
            activeDot={chartActiveDot(C.purple,7,'#fff')} name="score" {...CHART_MOTION_SOFT}/>
        </ComposedChart>
      </ResponsiveContainer>
    </GlassCard>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 🗓️ HEATMAP + DAY OF WEEK
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// 😊 EMOTION DISTRIBUTION
// ═══════════════════════════════════════════════════════════════════
const EmotionDist=({sessions})=>{
  const data=useMemo(()=>{
    const map={};
    MOODS.forEach(m=>{map[m.id]={...m,count:0,pnl:0,wins:0,totalTrades:0,scores:[]};});
    sessions.forEach(s=>{
      if(!map[s.mood])return;
      map[s.mood].count++;
      map[s.mood].pnl+=(s.pnl||0);
      map[s.mood].wins+=(s.wins||0);
      map[s.mood].totalTrades+=(s.trades||0);
      map[s.mood].scores.push(calcPsych(s));
    });
    const total=Object.values(map).reduce((s,m)=>s+m.count,0);
    return Object.values(map).map(m=>({
      ...m,
      pct:total?Math.round((m.count/total)*100):0,
      avgPnl:m.count?Math.round(m.pnl/m.count):0,
      totalPnl:m.pnl,
      winRate:m.totalTrades?Math.round((m.wins/m.totalTrades)*100):0,
      avgScore:m.scores.length?Math.round(m.scores.reduce((a,b)=>a+b,0)/m.scores.length):0,
    })).filter(m=>m.count>0).sort((a,b)=>b.avgPnl-a.avgPnl);
  },[sessions]);

  const RINNER=40,ROUTER=68;
  return(
    <GlassCard custom={7} glow={C.warn} style={{padding:'24px 22px'}}>
      <ST color={C.warn}>Emotional State Distribution</ST>
      <div style={{display:'flex',gap:20,alignItems:'center',marginBottom:20}}>
        <div style={{flexShrink:0,position:'relative',width:160,height:160}}>
          <svg width={160} height={160} viewBox="0 0 160 160">
            {(()=>{
              let sa=-Math.PI/2;
              const tot=data.reduce((s,m)=>s+m.count,0);
              return data.map((m,i)=>{
                const ang=(m.count/tot)*2*Math.PI,ea=sa+ang;
                const x1=80+ROUTER*Math.cos(sa),y1=80+ROUTER*Math.sin(sa);
                const x2=80+ROUTER*Math.cos(ea),y2=80+ROUTER*Math.sin(ea);
                const xi=80+RINNER*Math.cos(sa),yi=80+RINNER*Math.sin(sa);
                const xj=80+RINNER*Math.cos(ea),yj=80+RINNER*Math.sin(ea);
                const lg=ang>Math.PI?1:0;
                const d2=`M${x1},${y1} A${ROUTER},${ROUTER} 0 ${lg} 1 ${x2},${y2} L${xj},${yj} A${RINNER},${RINNER} 0 ${lg} 0 ${xi},${yi} Z`;
                const ma=sa+ang/2,lx=80+(RINNER+ROUTER)/2*Math.cos(ma),ly=80+(RINNER+ROUTER)/2*Math.sin(ma);
                sa=ea;
                return(
                  <g key={m.id}>
                    <motion.path d={d2} fill={m.color} opacity={0.82}
                      initial={{scale:0.5,opacity:0}} animate={{scale:1,opacity:0.82}}
                      transition={{duration:0.55,delay:i*0.08}}
                      style={{transformOrigin:'80px 80px',filter:`drop-shadow(0 0 5px ${shade(m.color,'55')})`}}/>
                    {m.pct>=12&&<text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize={10} fontWeight={900} fill="rgba(255,255,255,0.95)">{m.pct}%</text>}
                  </g>
                );
              });
            })()}
            <circle cx={80} cy={80} r={RINNER-3} fill={C.bgHigh}/>
            <text x={80} y={76} textAnchor="middle" fill={C.t1} fontSize={22} fontWeight={900} fontFamily="monospace">{data.reduce((s,m)=>s+m.count,0)}</text>
            <text x={80} y={91} textAnchor="middle" fill={C.t3} fontSize={8} fontWeight={700} letterSpacing={1}>sessions</text>
          </svg>
        </div>
        <div style={{flex:1,display:'flex',flexDirection:'column',gap:9}}>
          {data.map((m,i)=>(
            <div key={m.id} style={{display:'flex',alignItems:'center',gap:9}}>
              <div style={{flex:1}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                  <span style={{fontSize:11,fontWeight:700,color:m.color}}>{m.label}</span>
                  <span style={{fontSize:11,fontWeight:900,fontFamily:'monospace',color:m.avgPnl>=0?C.green:C.danger}}>{m.avgPnl>=0?'+':''}${m.avgPnl}</span>
                </div>
                <div style={{height:5,borderRadius:3,background:'rgba(255,255,255,0.05)',overflow:'hidden'}}>
                  <motion.div initial={{width:0}} animate={{width:`${m.pct}%`}} transition={{duration:0.8,delay:i*0.06}}
                    style={{height:'100%',background:`linear-gradient(90deg,${shade(m.color,'55')},${m.color})`,borderRadius:3,boxShadow:`0 0 5px ${shade(m.color,'40')}`}}/>
                </div>
                <div style={{fontSize:8,color:C.t3,marginTop:2}}>{m.count}x / WR {m.winRate}% / Avg Score {m.avgScore}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{borderRadius:12,overflow:'hidden',border:`1px solid ${C.brd}`}}>
        <div style={{display:'grid',gridTemplateColumns:'1.2fr 1fr 1fr 1fr 1fr',padding:'7px 12px',background:'rgba(255,255,255,0.04)',borderBottom:`1px solid ${C.brd}`}}>
          {['Mood','Sessions','Total P&L','Win Rate','Avg Score'].map(h=>(
            <div key={h} style={{fontSize:8,fontWeight:800,color:C.t3,textTransform:'uppercase',letterSpacing:'0.5px',textAlign:h==='Mood'?'left':'center'}}>{h}</div>
          ))}
        </div>
        {data.map((m,i)=>(
          <div key={m.id} style={{display:'grid',gridTemplateColumns:'1.2fr 1fr 1fr 1fr 1fr',padding:'9px 12px',
            borderBottom:i<data.length-1?`1px solid rgba(255,255,255,0.04)`:'none',background:i%2===0?'transparent':'rgba(255,255,255,0.015)'}}>
            <div style={{display:'flex',alignItems:'center',gap:6}}><span>{m.emoji}</span><span style={{fontSize:11,fontWeight:700,color:m.color}}>{m.label}</span></div>
            <div style={{textAlign:'center',fontSize:11,fontWeight:800,color:C.t1,fontFamily:'monospace'}}>{m.count}</div>
            <div style={{textAlign:'center',fontSize:11,fontWeight:900,fontFamily:'monospace',color:m.totalPnl>=0?C.green:C.danger}}>{m.totalPnl>=0?'+':''}${m.totalPnl.toLocaleString()}</div>
            <div style={{textAlign:'center',fontSize:11,fontWeight:900,fontFamily:'monospace',color:m.winRate>=60?C.green:m.winRate>=45?C.warn:C.danger}}>{m.winRate}%</div>
            <div style={{textAlign:'center',fontSize:11,fontWeight:900,fontFamily:'monospace',color:sColor(m.avgScore)}}>{m.avgScore}</div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 🌡️ HEATMAP HUMEUR × AXES
// ═══════════════════════════════════════════════════════════════════
const EmotionHeatmap=({sessions})=>{
  const matrix=useMemo(()=>MOODS.map(mood=>{
    const ss=sessions.filter(s=>s.mood===mood.id);
    const row={mood,count:ss.length,avgPnl:ss.length?Math.round(ss.reduce((s,v)=>s+(v.pnl||0),0)/ss.length):0};
    AXES7.forEach(ax=>{row[ax.key]=ss.length?Math.round(ss.reduce((s,v)=>s+(v[ax.key]||0),0)/ss.length):0;});
    return row;
  }).filter(r=>r.count>0),[sessions]);
  const heat=v=>{if(v>=80)return{bg:`${shade(C.green,'28')}`,border:`${shade(C.green,'50')}`,c:C.green};if(v>=65)return{bg:`${shade(C.cyan,'22')}`,border:`${shade(C.cyan,'40')}`,c:C.cyan};if(v>=50)return{bg:`${shade(C.warn,'18')}`,border:`${shade(C.warn,'35')}`,c:C.warn};if(v>=35)return{bg:`${shade(C.orange,'18')}`,border:`${shade(C.orange,'30')}`,c:C.orange};return{bg:`${shade(C.danger,'18')}`,border:`${shade(C.danger,'30')}`,c:C.danger};};
  return(
    <GlassCard custom={8} glow={C.pink} style={{padding:'24px 22px'}}>
      <ST color={C.pink}>Heatmap Mood x Psychological Axes</ST>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'separate',borderSpacing:3}}>
          <thead><tr>
            <th style={{fontSize:8,color:C.t3,fontWeight:700,textAlign:'left',padding:'0 6px 8px',textTransform:'uppercase'}}>Mood</th>
            {AXES7.map(ax=><th key={ax.key} style={{fontSize:8,color:ax.color,fontWeight:700,padding:'0 2px 8px',textAlign:'center',textTransform:'uppercase',minWidth:54}}>{ax.label}</th>)}
            <th style={{fontSize:8,color:C.green,fontWeight:700,padding:'0 2px 8px',textAlign:'center',textTransform:'uppercase'}}>Avg P&L</th>
          </tr></thead>
          <tbody>
            {matrix.map(row=>(
              <tr key={row.mood.id}>
                <td style={{padding:'3px 4px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:6,whiteSpace:'nowrap'}}>
                    <span style={{fontSize:16}}>{row.mood.emoji}</span>
                    <span style={{fontSize:9,fontWeight:700,color:row.mood.color}}>{row.mood.label}</span>
                    <span style={{fontSize:8,color:C.t3}}>({row.count}×)</span>
                  </div>
                </td>
                {AXES7.map(ax=>{const h=heat(row[ax.key]);return(
                  <td key={ax.key} style={{padding:2}}>
                    <div style={{background:h.bg,border:`1px solid ${h.border}`,borderRadius:7,padding:'5px 4px',textAlign:'center',fontSize:11,fontWeight:900,fontFamily:'monospace',color:h.c}}>{row[ax.key]}</div>
                  </td>);})}
                <td style={{padding:2}}>
                  <div style={{background:row.avgPnl>=0?`${shade(C.green,'22')}`:`${shade(C.danger,'18')}`,border:`1px solid ${shade(row.avgPnl>=0?C.green:C.danger,'40')}`,borderRadius:7,padding:'5px 6px',textAlign:'center',fontSize:10,fontWeight:900,fontFamily:'monospace',color:row.avgPnl>=0?C.green:C.danger}}>
                    {row.avgPnl>=0?'+':''}${row.avgPnl}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{display:'flex',gap:10,marginTop:12,flexWrap:'wrap'}}>
        {[{c:C.green,l:'≥ 80'},{c:C.cyan,l:'65–80'},{c:C.warn,l:'50–65'},{c:C.orange,l:'35–50'},{c:C.danger,l:'< 35'}].map(({c,l})=>(
          <div key={l} style={{display:'flex',alignItems:'center',gap:4,fontSize:8,color:C.t3}}>
            <div style={{width:10,height:10,borderRadius:3,background:`${shade(c,'40')}`,border:`1px solid ${shade(c,'60')}`}}/>{l}
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 💰 EMOTION IMPACT
// ═══════════════════════════════════════════════════════════════════
const EmotionImpact=({sessions})=>{
  const data=useMemo(()=>MOODS.map(mood=>{
    const ss=sessions.filter(s=>s.mood===mood.id);
    const totalTrades=ss.reduce((s,v)=>s+(v.trades||0),0);
    const totalWins=ss.reduce((s,v)=>s+(v.wins||0),0);
    return{mood:mood.label,emoji:mood.emoji,color:mood.color,
      avgPnl:ss.length?Math.round(ss.reduce((s,v)=>s+(v.pnl||0),0)/ss.length):0,
      winRate:totalTrades?Math.round((totalWins/totalTrades)*100):0,
      count:ss.length};
  }).filter(d=>d.count>0),[sessions]);
  return(
    <GlassCard custom={9} glow={C.cyan} style={{padding:'24px 22px'}}>
      <ST color={C.cyan}>Mood Impact / Avg P&L & Win Rate</ST>
      <ResponsiveContainer width="100%" height={230}>
        <ComposedChart data={data} margin={{top:16,right:20,bottom:0,left:0}}>
          <CartesianGrid {...CHART_GRID}/>
          <XAxis {...CHART_AXIS_SMALL} dataKey="mood" tick={{fill:C.t2,fontSize:9,fontWeight:700}} 
            tickFormatter={(v)=>v}/>
          <YAxis {...CHART_AXIS_SMALL} yAxisId="pnl" tick={{...CHART_AXIS_SMALL.tick,fontSize:8}} tickFormatter={v=>`$${v}`} width={42}/>
          <YAxis {...CHART_AXIS_SMALL} yAxisId="wr" orientation="right" domain={[0,100]} tick={{...CHART_AXIS_SMALL.tick,fontSize:8}} tickFormatter={v=>`${v}%`} width={32}/>
          <Tooltip contentStyle={chartTooltipStyle(C.cyan)} cursor={chartCursor(C.cyan)}
             formatter={(v,n)=>n==='avgPnl'?[<span style={{color:v>=0?C.green:C.danger,fontFamily:'monospace',fontWeight:900}}>{v>=0?'+':''}${v}</span>,'Avg P&L']:[<span style={{color:C.purple,fontFamily:'monospace',fontWeight:900}}>{v}%</span>,'Win Rate']}/>
          <ReferenceLine yAxisId="pnl" y={0} stroke="rgba(255,255,255,0.12)"/>
          <Bar yAxisId="pnl" dataKey="avgPnl" maxBarSize={52} radius={[6,6,0,0]} label={{position:'top',fontSize:8,fontWeight:700,fill:C.t3,formatter:v=>v?`${v>=0?'+':''}$${v}`:''}} {...CHART_MOTION}>
            {data.map((d,i)=><Cell key={i} fill={d.color} fillOpacity={0.85}/>)}
          </Bar>
          <Line yAxisId="wr" type="monotone" dataKey="winRate" stroke={C.purple} strokeWidth={2.5} name="Win Rate"
            dot={{r:5,fill:C.purple,stroke:'rgba(255,255,255,0.8)',strokeWidth:1.5}} activeDot={chartActiveDot(C.purple,7,'#fff')} {...CHART_MOTION_SOFT}/>
        </ComposedChart>
      </ResponsiveContainer>
    </GlassCard>
  );
};

const Patterns=({sessions})=>{
  const insights=useMemo(()=>{
    const res=[];
    const sorted=[...sessions].sort((a,b)=>a.date.localeCompare(b.date));
    const emoS=sessions.filter(s=>calcPsych(s)<50);
    const goodS=sessions.filter(s=>calcPsych(s)>=70);
    if(emoS.length&&goodS.length){
      const emoAvg=Math.round(emoS.reduce((s,v)=>s+(v.pnl||0),0)/emoS.length);
      const goodAvg=Math.round(goodS.reduce((s,v)=>s+(v.pnl||0),0)/goodS.length);
      const emoWR=Math.round(emoS.filter(s=>(s.pnl||0)>0).length/emoS.length*100);
      const goodWR=Math.round(goodS.filter(s=>(s.pnl||0)>0).length/goodS.length*100);
      res.push({color:C.danger,title:'Cost of emotional trading',
        desc:`Score < 50: Avg P&L ${emoAvg>=0?'+':''}$${emoAvg} / WR ${emoWR}%`,
        sub:`Score >= 70: Avg P&L +$${goodAvg} / WR ${goodWR}% / gap of $${goodAvg-emoAvg}/session`,
        badge:`Δ $${goodAvg-emoAvg}`});
    }
    const byMood={};
    sessions.forEach(s=>{if(!byMood[s.mood])byMood[s.mood]={pnl:0,n:0,wins:0};byMood[s.mood].pnl+=(s.pnl||0);byMood[s.mood].n++;if((s.pnl||0)>0)byMood[s.mood].wins++;});
    const best=Object.entries(byMood).sort((a,b)=>(b[1].pnl/b[1].n)-(a[1].pnl/a[1].n))[0];
    if(best){
      const m=MOODS.find(m=>m.id===best[0]);
      const avg=Math.round(best[1].pnl/best[1].n);
      const wr=Math.round(best[1].wins/best[1].n*100);
      res.push({color:C.green,title:`Best mood: ${m?.label||best[0]}`,
        desc:`Avg ${avg>=0?'+':''}$${avg}/session / WR ${wr}% / ${best[1].n} sessions`,
        sub:'Prioritize trading in this state for direct, measurable impact',badge:`+$${avg}`});
    }
    const withR=sessions.filter(s=>s.routine),noR=sessions.filter(s=>!s.routine);
    if(withR.length>0&&noR.length>0){
      const rA=Math.round(withR.reduce((s,v)=>s+(v.pnl||0),0)/withR.length);
      const nA=Math.round(noR.reduce((s,v)=>s+(v.pnl||0),0)/noR.length);
      const rWR=Math.round(withR.filter(s=>(s.pnl||0)>0).length/withR.length*100);
      res.push({color:C.cyan,title:`Morning routine: +$${rA-nA} avg impact`,
        desc:`With routine (${withR.length}x): avg ${rA>=0?'+':''}$${rA} / WR ${rWR}%`,
        sub:`Without routine (${noR.length}x): avg ${nA>=0?'+':''}$${nA} / discipline pays off`,badge:rA>nA?'Crucial':'Neutral'});
    }
    const overS=sessions.filter(s=>s.trades>(s.maxTrades||99));
    if(overS.length){
      const oPnl=Math.round(overS.reduce((s,v)=>s+(v.pnl||0),0)/overS.length);
      const nPnl=Math.round(sessions.filter(s=>s.trades<=(s.maxTrades||99)).reduce((s,v)=>s+(v.pnl||0),0)/Math.max(1,sessions.filter(s=>s.trades<=(s.maxTrades||99)).length));
      res.push({color:C.warn,title:`Overtrading: ${overS.length}/${sessions.length} sessions`,
        desc:`P&L while overtrading: ${oPnl>=0?'+':''}$${oPnl} vs normal: ${nPnl>=0?'+':''}$${nPnl}`,
        sub:`Respecting max trades would avoid ~$${nPnl-oPnl} loss/session`,badge:`${Math.round(overS.length/sessions.length*100)}% of sess.`});
    }
    let maxS=1,maxSS=0,cur=1,curS=0;
    for(let i=1;i<sorted.length;i++){
      if((sorted[i].pnl||0)>0&&(sorted[i-1].pnl||0)>0){cur++;if(cur>maxS){maxS=cur;maxSS=curS;}}
      else{cur=1;curS=i;}
    }
    if(maxS>=2){
      const serie=sorted.slice(maxSS,maxSS+maxS);
      const avSc=Math.round(serie.reduce((s,v)=>s+calcPsych(v),0)/maxS);
      const serP=serie.reduce((s,v)=>s+(v.pnl||0),0);
      res.push({color:C.orange,title:`Best streak: ${maxS} consecutive winning sessions`,
        desc:`Avg score: ${avSc}/100 / Total P&L: +$${serP.toLocaleString()}`,
        sub:`Started on ${serie[0]?.date?.substring(5)||'-'} / high score and streaks are strongly correlated`,badge:`+${maxS} wins`});
    }
    const axeMeans=AXES7.map(ax=>{
      const mean=Math.round(sessions.reduce((s,v)=>s+(v[ax.key]||0),0)/sessions.length);
      const hi=sessions.filter(s=>(s[ax.key]||0)>=mean),lo=sessions.filter(s=>(s[ax.key]||0)<mean);
      return{...ax,mean,impact:(hi.length?Math.round(hi.reduce((s,v)=>s+(v.pnl||0),0)/hi.length):0)-(lo.length?Math.round(lo.reduce((s,v)=>s+(v.pnl||0),0)/lo.length):0)};
    });
    const weakest=[...axeMeans].sort((a,b)=>a.mean-b.mean)[0];
    const highImpact=[...axeMeans].sort((a,b)=>b.impact-a.impact)[0];
    res.push({color:C.purple,title:`Priority axis to strengthen: ${weakest?.label}`,
      desc:`Average score of ${weakest?.mean}/100 / ${weakest?.desc}`,
      sub:`Strongest P&L lever: ${highImpact?.label} (+$${highImpact?.impact} avg gap when high)`,badge:`${weakest?.mean}/100`});
    return res;
  },[sessions]);
  return(
    <GlassCard custom={8} glow={C.teal} style={{padding:'24px 22px'}}>
      <ST color={C.teal}>Behavioral Patterns & Insights</ST>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {insights.map((ins,i)=>(
          <motion.div key={i} initial={{opacity:0,x:14}} animate={{opacity:1,x:0}} transition={{delay:i*0.07}}
            whileHover={{x:3}} style={{display:'flex',gap:14,padding:'14px 16px',borderRadius:14,cursor:'default',
              background:`linear-gradient(135deg,${shade(ins.color,'0A')},${shade(ins.color,'05')})`,border:`1px solid ${shade(ins.color,'28')}`,alignItems:'flex-start',
              boxShadow:`0 2px 16px ${shade(ins.color,'08')}`}}>
            <div style={{width:40,height:40,borderRadius:12,background:`${shade(ins.color,'18')}`,border:`1px solid ${shade(ins.color,'30')}`,
              display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,
              boxShadow:`0 0 14px ${shade(ins.color,'25')}`}}>
              <span style={{width:18,height:2,borderRadius:999,background:ins.color,boxShadow:`0 0 10px ${ins.color}`}}/>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:800,color:ins.color,marginBottom:4}}>{ins.title}</div>
              <div style={{fontSize:10.5,color:C.t2,lineHeight:1.65}}>{ins.desc}</div>
              {ins.sub&&<div style={{fontSize:9.5,color:C.t3,marginTop:4,lineHeight:1.5}}>{ins.sub}</div>}
            </div>
            {ins.badge&&<div style={{padding:'5px 12px',borderRadius:20,background:`${shade(ins.color,'18')}`,border:`1px solid ${shade(ins.color,'35')}`,
              fontSize:11,fontWeight:900,color:ins.color,flexShrink:0,fontFamily:'monospace'}}>{ins.badge}</div>}
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
};

const PerfByScore=({sessions})=>{
  const buckets=useMemo(()=>[
    {range:'< 40', min:0, max:39, color:C.danger},
    {range:'40–50',min:40,max:49,color:C.orange},
    {range:'50–60',min:50,max:59,color:C.warn},
    {range:'60–70',min:60,max:69,color:C.cyan},
    {range:'70–80',min:70,max:79,color:C.green},
    {range:'≥ 80', min:80,max:100,color:C.purple},
  ].map(b=>{
    const ss=sessions.filter(s=>{const sc=calcPsych(s);return sc>=b.min&&sc<=b.max;});
    const pnl=ss.reduce((t,s)=>t+(s.pnl||0),0);
    const wins=ss.filter(s=>(s.pnl||0)>0).length;
    const trades=ss.reduce((t,s)=>t+(s.trades||0),0);
    return{...b,count:ss.length,pnl,avgPnl:ss.length?Math.round(pnl/ss.length):0,
      winRate:ss.length?Math.round((wins/ss.length)*100):0,trades};
  }),[sessions]);

  return(
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1.3fr',gap:16}}>
        <GlassCard custom={4} glow={C.cyan} style={{padding:'24px 22px'}}>
          <ST color={C.cyan}>Avg P&L by Score Range</ST>
          <ResponsiveContainer width="100%" height={195}>
            <BarChart data={buckets} margin={{top:22,right:4,bottom:0,left:0}}>
              <CartesianGrid {...CHART_GRID}/>
              <XAxis {...CHART_AXIS_SMALL} dataKey="range" tick={{fill:C.t2,fontSize:9,fontWeight:600}}/>
              <YAxis {...CHART_AXIS_SMALL} tick={{...CHART_AXIS_SMALL.tick,fontSize:8}} tickFormatter={v=>`$${v}`}/>
              <Tooltip contentStyle={chartTooltipStyle(C.cyan)} cursor={chartCursor(C.cyan)}
                formatter={(v,n,{payload:p})=>[<span style={{fontFamily:'monospace',fontWeight:900,color:v>=0?C.green:C.danger}}>{v>=0?'+':''}${v} ({p.count} sess.)</span>,'Avg P&L']}/>
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)"/>
              <Bar dataKey="avgPnl" maxBarSize={48} radius={[6,6,0,0]} label={{position:'top',fill:C.t3,fontSize:8,fontWeight:700,formatter:v=>v?`${v>=0?'+':''}$${v}`:''}} {...CHART_MOTION}>
                {buckets.map((b,i)=>(<Cell key={i} fill={b.color} fillOpacity={b.count?0.85:0.15}/>))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard custom={5} glow={C.blue} style={{padding:'24px 22px'}}>
          <ST color={C.blue}>Score vs P&L / Session by Session View</ST>
          <ResponsiveContainer width="100%" height={195}>
            <ComposedChart data={[...sessions].sort((a,b)=>a.date.localeCompare(b.date)).map(s=>({score:calcPsych(s),pnl:s.pnl||0,mood:s.mood}))} margin={{top:8,right:8,bottom:0,left:0}}>
              <CartesianGrid {...CHART_GRID}/>
              <XAxis {...CHART_AXIS_SMALL} dataKey="score" type="number" domain={[20,100]} tick={{...CHART_AXIS_SMALL.tick,fontSize:8}}/>
              <YAxis {...CHART_AXIS_SMALL} tick={{...CHART_AXIS_SMALL.tick,fontSize:8}} tickFormatter={v=>`$${v}`}/>
              <Tooltip contentStyle={chartTooltipStyle(C.blue)} cursor={chartCursor(C.blue)}
                formatter={(v,n,{payload:p})=>[<span style={{fontFamily:'monospace',fontWeight:900,color:v>=0?C.green:C.danger}}>{v>=0?'+':''}${v}</span>,`P&L / score ${p.score}`]}/>
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.12)"/>
              <ReferenceLine x={70} stroke={`${shade(C.green,'30')}`} strokeDasharray="4 3" label={{value:'70',fill:C.green,fontSize:8,position:'top'}}/>
              <ReferenceLine x={50} stroke={`${shade(C.warn,'25')}`} strokeDasharray="4 3" label={{value:'50',fill:C.warn,fontSize:8,position:'top'}}/>
              <Bar dataKey="pnl" maxBarSize={9} radius={[3,3,0,0]} {...CHART_MOTION}>
                {[...sessions].sort((a,b)=>a.date.localeCompare(b.date)).map((s,i)=><Cell key={i} fill={(s.pnl||0)>=0?C.green:C.danger} fillOpacity={0.75}/>)}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1.5fr',gap:16}}>
        <GlassCard custom={6} glow={C.green} style={{padding:'24px 22px'}}>
          <ST color={C.green}>Win Rate by Score Range</ST>
          <div style={{display:'flex',flexDirection:'column',gap:11,marginTop:4}}>
            {buckets.filter(b=>b.count>0).map((b,i)=>(
              <div key={b.range}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{width:10,height:10,borderRadius:3,background:b.color,opacity:0.9,flexShrink:0}}/>
                    <span style={{fontSize:11,color:C.t2,fontWeight:600}}>{b.range}</span>
                    <span style={{fontSize:9,color:C.t3}}>({b.count} sess.)</span>
                  </div>
                  <div style={{display:'flex',gap:12,alignItems:'center'}}>
                    <span style={{fontSize:9,color:b.avgPnl>=0?C.green:C.danger,fontFamily:'monospace',fontWeight:700}}>{b.avgPnl>=0?'+':''}${b.avgPnl}</span>
                    <span style={{fontSize:13,fontWeight:900,fontFamily:'monospace',color:b.winRate>=60?C.green:b.winRate>=45?C.warn:C.danger}}>{b.winRate}%</span>
                  </div>
                </div>
                <div style={{height:6,borderRadius:3,background:'rgba(255,255,255,0.05)',overflow:'hidden'}}>
                  <motion.div initial={{width:0}} animate={{width:`${b.winRate}%`}} transition={{duration:0.85,delay:i*0.08}}
                    style={{height:'100%',borderRadius:3,background:`linear-gradient(90deg,${shade(b.color,'50')},${b.color})`,boxShadow:`0 0 6px ${shade(b.color,'35')}`}}/>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard custom={7} glow={C.teal} style={{padding:'24px 22px'}}>
          <ST color={C.teal}>Complete Summary Table</ST>
          <div style={{borderRadius:12,overflow:'hidden',border:`1px solid ${C.brd}`}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 0.7fr 0.9fr 1fr 1fr 0.8fr',padding:'7px 10px',
              background:'rgba(255,255,255,0.05)',borderBottom:`1px solid ${C.brd}`}}>
              {['Score','Sess.','Win Rate','Avg P&L','Total P&L','Trades'].map(h=>(
                <div key={h} style={{fontSize:7.5,fontWeight:800,color:C.t3,textTransform:'uppercase',letterSpacing:'0.4px',textAlign:'center'}}>{h}</div>
              ))}
            </div>
            {buckets.map((b,i)=>(
              <div key={b.range} style={{display:'grid',gridTemplateColumns:'1fr 0.7fr 0.9fr 1fr 1fr 0.8fr',
                padding:'8px 10px',borderBottom:i<buckets.length-1?`1px solid rgba(255,255,255,0.04)`:'none',
                background:b.count?i%2===0?'transparent':'rgba(255,255,255,0.015)':'rgba(255,255,255,0.01)',
                opacity:b.count?1:0.35}}>
                <div style={{textAlign:'center',fontSize:10,fontWeight:800,color:b.color}}>{b.range}</div>
                <div style={{textAlign:'center',fontSize:10,fontWeight:700,color:C.t1,fontFamily:'monospace'}}>{b.count||'—'}</div>
                <div style={{textAlign:'center',fontSize:10,fontWeight:900,fontFamily:'monospace',color:b.winRate>=60?C.green:b.winRate>=45?C.warn:C.danger}}>{b.count?`${b.winRate}%`:'—'}</div>
                <div style={{textAlign:'center',fontSize:10,fontWeight:900,fontFamily:'monospace',color:b.avgPnl>=0?C.green:C.danger}}>{b.count?`${b.avgPnl>=0?'+':''}$${b.avgPnl}`:'—'}</div>
                <div style={{textAlign:'center',fontSize:10,fontWeight:900,fontFamily:'monospace',color:b.pnl>=0?C.green:C.danger}}>{b.count?`${b.pnl>=0?'+':''}$${b.pnl.toLocaleString()}`:'—'}</div>
                <div style={{textAlign:'center',fontSize:10,fontWeight:700,color:C.t2,fontFamily:'monospace'}}>{b.count?b.trades:'—'}</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:12,padding:'10px 14px',borderRadius:11,background:`${shade(C.teal,'08')}`,border:`1px solid ${shade(C.teal,'22')}`}}>
            <div style={{fontSize:10,fontWeight:800,color:C.teal,marginBottom:4}}>Recommendation</div>
            <div style={{fontSize:9.5,color:C.t2,lineHeight:1.7}}>
              {(()=>{
                const best=buckets.filter(b=>b.count>0).sort((a,b)=>b.avgPnl-a.avgPnl)[0];
                const total=buckets.reduce((s,b)=>s+b.count,0);
                const highPct=Math.round(buckets.filter(b=>b.min>=70).reduce((s,b)=>s+b.count,0)/total*100);
                return best?`Sessions with score ${best.range} generate the best avg P&L (+$${best.avgPnl}). Currently ${highPct}% of sessions reach score ≥ 70 — aim for 60%+.`:'Accumulate more data for reliable conclusions.';
              })()}
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
// ═══════════════════════════════════════════════════════════════════
// 📓 JOURNAL
// ═══════════════════════════════════════════════════════════════════
const Journal=({sessions})=>{
  const[expanded,setExpanded]=useState(null);
  const[filter,setFilter]=useState('all');
  const sorted=useMemo(()=>[...sessions].sort((a,b)=>b.date.localeCompare(a.date)),[sessions]);
  const filtered=useMemo(()=>{
    if(filter==='all')return sorted;
    if(filter==='high')return sorted.filter(s=>calcPsych(s)>=70);
    if(filter==='low') return sorted.filter(s=>calcPsych(s)<50);
    if(filter==='win') return sorted.filter(s=>(s.pnl||0)>0);
    if(filter==='loss')return sorted.filter(s=>(s.pnl||0)<0);
    return sorted;
  },[sorted,filter]);

  // Score badge inline — compact horizontal segmented bar
  const ScoreBadge=({score,size='md'})=>{
    const sc=sColor(score);
    const zones=[
      {max:30,c:C.danger},{max:45,c:C.orange},{max:60,c:C.warn},
      {max:75,c:C.cyan},{max:100,c:C.green},
    ];
    const activeZone=zones.find(z=>score<=z.max)||zones[zones.length-1];
    const isLg=size==='lg';
    return(
      <div style={{display:'flex',alignItems:'center',gap:isLg?10:6,flexShrink:0}}>
        {/* Score value pill */}
        <div style={{
          padding:isLg?'4px 14px':'2px 9px',
          borderRadius:isLg?10:7,
          background:`linear-gradient(135deg,${shade(sc,'22')},${shade(sc,'10')})`,
          border:`1px solid ${shade(sc,'45')}`,
          fontSize:isLg?15:10,fontWeight:900,fontFamily:'monospace',
          color:sc,
          boxShadow:`0 0 12px ${shade(sc,'30')}`,
          letterSpacing:'-0.5px',
          display:'flex',alignItems:'center',gap:isLg?6:4,
        }}>
          {score}
        </div>
        {/* Mini segmented bar */}
        <div style={{display:'flex',gap:2,alignItems:'center'}}>
          {zones.map((z,i)=>{
            const prev=i>0?zones[i-1].max:0;
            const filled=score>prev;
            const partial=filled&&score<=z.max;
            const pct=partial?((score-prev)/(z.max-prev))*100:100;
            return(
              <div key={i} style={{
                width:isLg?16:9,height:isLg?6:4,borderRadius:2,
                background:'rgba(255,255,255,0.06)',overflow:'hidden',
                position:'relative',
              }}>
                {filled&&(
                  <div style={{
                    position:'absolute',top:0,left:0,height:'100%',
                    width:partial?`${pct}%`:'100%',
                    background:z.c,opacity:0.9,borderRadius:2,
                    boxShadow:`0 0 4px ${shade(z.c,'60')}`,
                  }}/>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return(
    <GlassCard custom={9} style={{padding:'26px 26px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
        <ST color={C.teal} mb={0}>Session Journal</ST>
        <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
          {[{k:'all',l:'All'},{k:'high',l:'Score ≥70'},{k:'low',l:'Score <50'},{k:'win',l:'Wins'},{k:'loss',l:'Losses'}].map(({k,l})=>(
            <motion.button key={k} onClick={()=>setFilter(k)} whileHover={{scale:1.04}} whileTap={{scale:0.96}}
              style={{padding:'5px 10px',borderRadius:8,fontSize:9,fontWeight:700,cursor:'pointer',fontFamily:'inherit',border:'none',
                background:filter===k?`${shade(C.teal,'20')}`:'rgba(255,255,255,0.04)',
                color:filter===k?C.teal:C.t3,
                boxShadow:filter===k?`0 0 0 1px ${shade(C.teal,'40')}`:`0 0 0 1px rgba(255,255,255,0.07)`}}>
              {l}
            </motion.button>
          ))}
          <div style={{padding:'5px 10px',borderRadius:8,fontSize:9,fontWeight:700,background:'rgba(255,255,255,0.04)',color:C.t3,border:`1px solid rgba(255,255,255,0.07)`}}>
            {filtered.length} session{filtered.length>1?'s':''}
          </div>
        </div>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:6}}>
        {filtered.map((s,i)=>{
          const score=calcPsych(s),sc=sColor(score),em=MOODS.find(m=>m.id===s.mood),isOpen=expanded===s.id;
          const wr=s.trades?Math.round(((s.wins||0)/s.trades)*100):0;
          return(
            <motion.div key={s.id} initial={{opacity:0,x:10}} animate={{opacity:1,x:0}} transition={{delay:i*0.025}}>
              <motion.div whileHover={{x:-2,backgroundColor:'rgba(255,255,255,0.04)'}} onClick={()=>setExpanded(isOpen?null:s.id)}
                style={{padding:'11px 13px',borderRadius:12,cursor:'pointer',transition:'all 0.2s',
                  background:isOpen?'rgba(255,255,255,0.05)':'rgba(255,255,255,0.025)',
                  border:`1px solid ${isOpen ? shade(sc,'45') : C.brd}`}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <div style={{width:38,height:38,borderRadius:10,flexShrink:0,background:`${shade(em?.color||C.t3,'14')}`,border:`1px solid ${shade(em?.color||C.t3,'28')}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <span style={{width:18,height:2,borderRadius:999,background:em?.color||C.t3,boxShadow:`0 0 10px ${em?.color||C.t3}`}}/>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:3}}>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <span style={{fontSize:12,fontWeight:700,color:C.t1}}>
                          {new Date(s.date+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short'})}
                        </span>
                        {s.routine&&<span style={{fontSize:8,padding:'1px 6px',borderRadius:4,background:`${shade(C.green,'15')}`,color:C.green,border:`1px solid ${shade(C.green,'25')}`}}>Routine</span>}
                      </div>
                      <div style={{display:'flex',gap:8,alignItems:'center'}}>
                        <span style={{fontSize:9,color:C.t3}}>{s.trades||0}T / {wr}%WR</span>
                        <span style={{fontSize:11,fontWeight:900,fontFamily:'monospace',color:(s.pnl||0)>=0?C.green:C.danger}}>{(s.pnl||0)>=0?'+':''}${s.pnl?.toLocaleString()}</span>
                        <ScoreBadge score={score}/>
                      </div>
                    </div>
                    <div style={{height:3,borderRadius:2,background:'rgba(255,255,255,0.06)',overflow:'hidden'}}>
                      <motion.div initial={{width:0}} animate={{width:`${score}%`}} transition={{duration:0.8,delay:i*0.025}}
                        style={{height:'100%',borderRadius:2,background:`linear-gradient(90deg,${shade(sc,'45')},${sc})`,boxShadow:`0 0 5px ${shade(sc,'35')}`}}/>
                    </div>
                  </div>
                  <motion.span animate={{rotate:isOpen?180:0}} transition={{duration:0.22}} style={{fontSize:10,color:C.t3,marginLeft:2}}>▾</motion.span>
                </div>
              </motion.div>

              <AnimatePresence>
                {isOpen&&(
                  <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} style={{overflow:'hidden'}}>
                    <div style={{padding:'12px 12px 8px',borderLeft:`2px solid ${shade(sc,'22')}`,marginLeft:4,display:'flex',flexDirection:'column',gap:10}}>
                      {/* ── Detailed score — segmented bar version ── */}
                      <div style={{padding:'14px 16px',borderRadius:14,background:`${shade(sc,'08')}`,border:`1px solid ${shade(sc,'22')}`,overflow:'hidden',position:'relative'}}>
                        {/* Orb glow */}
                        <div style={{position:'absolute',top:-20,right:-20,width:100,height:100,borderRadius:'50%',background:`radial-gradient(circle,${shade(sc,'25')},transparent 70%)`,filter:'blur(20px)',pointerEvents:'none'}}/>
                        <div style={{position:'relative',display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:16}}>
                          {/* Gauche: valeur + label */}
                          <div>
                            <div style={{fontSize:8,color:C.t3,marginBottom:5,textTransform:'uppercase',letterSpacing:'1px',fontWeight:700}}>Psychological score</div>
                            <div style={{display:'flex',alignItems:'flex-end',gap:6,marginBottom:8}}>
                              <span style={{fontSize:48,fontWeight:900,fontFamily:'monospace',lineHeight:1,color:sc,textShadow:`0 0 32px ${shade(sc,'70')}`,letterSpacing:'-2px'}}>{score}</span>
                              <span style={{fontSize:14,color:C.t3,fontWeight:700,marginBottom:4}}>/100</span>
                            </div>
                            {/* Segmented bar large */}
                            <div style={{display:'flex',gap:3,marginBottom:6}}>
                              {[{max:30,c:C.danger,l:'Critical'},{max:45,c:C.orange,l:'Fragile'},{max:60,c:C.warn,l:'Fair'},{max:75,c:C.cyan,l:'Solid'},{max:100,c:C.green,l:'Elite'}].map((z,i,arr)=>{
                                const prev=i>0?arr[i-1].max:0;
                                const filled=score>prev;
                                const partial=filled&&score<=z.max;
                                const pct=partial?((score-prev)/(z.max-prev))*100:100;
                                return(
                                  <div key={i} style={{flex:1,height:8,borderRadius:3,background:'rgba(255,255,255,0.05)',overflow:'hidden',position:'relative'}}>
                                    {filled&&(
                                      <motion.div initial={{width:0}} animate={{width:partial?`${pct}%`:'100%'}} transition={{duration:0.9,delay:i*0.07}}
                                        style={{position:'absolute',top:0,left:0,height:'100%',background:z.c,borderRadius:3,boxShadow:`0 0 8px ${shade(z.c,'50')}`}}/>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            <div style={{display:'flex',gap:3}}>
                              {[{max:30,c:C.danger,l:'Crit.'},{max:45,c:C.orange,l:'Frag.'},{max:60,c:C.warn,l:'Fair'},{max:75,c:C.cyan,l:'Solid'},{max:100,c:C.green,l:'Elite'}].map((z,i,arr)=>{
                                const prev=i>0?arr[i-1].max:0;
                                const active=score>prev&&score<=(z.max);
                                return<div key={i} style={{flex:1,fontSize:7,fontWeight:700,color:active?z.c:'rgba(255,255,255,0.2)',textAlign:'center',textTransform:'uppercase',letterSpacing:'0.2px'}}>{z.l}</div>;
                              })}
                            </div>
                          </div>
                          {/* Right: mini radar */}
                          <svg width={90} height={90} viewBox="0 0 90 90" style={{flexShrink:0}}>
                            {[0.35,0.7,1].map(r=>(
                              <polygon key={r} stroke={r===1?`${shade(sc,'35')}`:'rgba(255,255,255,0.07)'} fill={r===1?`${shade(sc,'07')}`:'none'} strokeWidth={0.7}
                                points={Array.from({length:7},(_,ii)=>{const a=(2*Math.PI*ii/7)-Math.PI/2;return`${45+38*r*Math.cos(a)},${45+38*r*Math.sin(a)}`;}).join(' ')}/>
                            ))}
                            <motion.polygon initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.8}}
                              fill={`${shade(sc,'22')}`} stroke={sc} strokeWidth={1.5}
                              points={AXES7.map((ax,ii)=>{const v=(s[ax.key]||0)/100;const a=(2*Math.PI*ii/7)-Math.PI/2;return`${45+38*v*Math.cos(a)},${45+38*v*Math.sin(a)}`;}).join(' ')}/>
                            {AXES7.map((ax,ii)=>{const v=(s[ax.key]||0)/100;const a=(2*Math.PI*ii/7)-Math.PI/2;const px=45+38*v*Math.cos(a),py=45+38*v*Math.sin(a);return<circle key={ii} cx={px} cy={py} r={2.5} fill={ax.color} stroke="rgba(255,255,255,0.7)" strokeWidth={0.8}/>;} )}
                          </svg>
                        </div>
                        {/* Level label */}
                        <div style={{marginTop:8,display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',borderRadius:20,background:`${shade(sc,'18')}`,border:`1px solid ${shade(sc,'35')}`}}>
                          <span style={{fontSize:10,fontWeight:800,color:sc}}>{sLabel(score)}</span>
                        </div>
                      </div>
                      {/* 7 axes */}
                      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6}}>
                        {AXES7.map(ax=>(
                          <div key={ax.key} style={{padding:'7px 9px',borderRadius:9,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',textAlign:'center'}}>
                            <div style={{fontSize:7.5,color:C.t3,marginBottom:2,textTransform:'uppercase',letterSpacing:'0.3px'}}>{ax.label}</div>
                            <div style={{fontSize:15,fontWeight:900,color:ax.color,fontFamily:'monospace',lineHeight:1,marginBottom:3}}>{s[ax.key]||0}</div>
                            <div style={{height:2.5,borderRadius:2,background:'rgba(255,255,255,0.05)'}}><div style={{width:`${s[ax.key]||0}%`,height:'100%',background:ax.color,opacity:0.7,borderRadius:2}}/></div>
                          </div>
                        ))}
                      </div>
                      {/* Stats */}
                      <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:6}}>
                        {[
                          {l:'Sleep',   v:`${s.sleep}/10`,c:C.purple},
                          {l:'Energy',  v:`${s.energy}/10`,c:C.cyan},
                          {l:'Trades',  v:`${s.trades||0}`,c:C.t1},
                          {l:'Wins',    v:`${s.wins||0}`,  c:C.green},
                          {l:'Max T.',  v:`${s.maxTrades||'—'}`,c:C.warn},
                          {l:'Max L.',  v:`$${s.maxLoss||0}`,c:C.danger},
                        ].map(({l,v,c})=>(
                          <div key={l} style={{padding:'6px',borderRadius:8,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.05)',textAlign:'center'}}>
                            <div style={{fontSize:7,color:C.t3,marginBottom:2,textTransform:'uppercase',letterSpacing:'0.3px'}}>{l}</div>
                            <div style={{fontSize:12,fontWeight:900,color:c,fontFamily:'monospace'}}>{v}</div>
                          </div>
                        ))}
                      </div>
                      {/* Objectifs + Notes */}
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                        {[{cond:s.objectives,label:'Objectives',val:s.objectives,c:C.cyan},
                          {cond:s.notes,label:'Notes',val:s.notes,c:C.purple},
                          {cond:s.stressors,label:'Stressors',val:s.stressors,c:C.warn},
                        ].filter(x=>x.cond).map(({label,val,c})=>(
                          <div key={label} style={{padding:'9px 12px',borderRadius:9,background:`${shade(c,'08')}`,border:`1px solid ${shade(c,'18')}`}}>
                            <div style={{fontSize:8,color:c,marginBottom:3,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.5px'}}>{label}</div>
                            <div style={{fontSize:10.5,color:C.t2,lineHeight:1.6}}>{val}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </GlassCard>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 📊 KPI CARD
// ═══════════════════════════════════════════════════════════════════
const KpiCard=({label,value,sub,color,custom,trend})=>(
  <GlassCard custom={custom} glow={color} style={{padding:'20px 18px',position:'relative'}}>
    <div style={{position:'absolute',top:-20,right:-20,width:90,height:90,borderRadius:'50%',background:`radial-gradient(circle,${shade(color,'22')},transparent 70%)`,filter:'blur(14px)',pointerEvents:'none'}}/>
    <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${shade(color,'45')},transparent)`}}/>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
      <span style={{fontSize:7.5,fontWeight:800,color:C.t3,letterSpacing:'1.8px',textTransform:'uppercase'}}>{label}</span>
      <motion.span animate={{opacity:[0.5,1,0.5]}} transition={{duration:3,repeat:Infinity,delay:(custom||0)*0.4}}
        style={{width:28,height:2,borderRadius:999,background:color,boxShadow:`0 0 12px ${shade(color,'70')}`}}/>
    </div>
    <div style={{fontSize:26,fontWeight:900,fontFamily:'monospace',color,lineHeight:1,marginBottom:5,textShadow:`0 0 24px ${shade(color,'50')}`}}>{value}</div>
    <div style={{fontSize:9.5,color:C.t2,lineHeight:1.4}}>{sub}</div>
    {trend!==undefined&&(
      <div style={{marginTop:6,fontSize:9,fontWeight:700,color:trend>=0?C.green:C.danger,display:'flex',alignItems:'center',gap:4}}>
        <span>{trend>=0?'Up':'Down'}</span><span>{Math.abs(trend).toFixed(1)}% vs prev. period</span>
      </div>
    )}
    <motion.div animate={{opacity:[0.4,0.8,0.4]}} transition={{duration:2.5,repeat:Infinity,delay:(custom||0)*0.3}}
      style={{position:'absolute',bottom:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${shade(color,'50')},transparent)`}}/>
  </GlassCard>
);

const TABS=[
  {id:'overview',  label:'Overview'},
  {id:'emotions',  label:'Emotions'},
  {id:'patterns',  label:'Patterns'},
  {id:'perf',      label:'Performance'},
  {id:'journal',   label:'Journal'},
];

export default function Psychology(){
  const[tab,setTab]=useState('overview');
  const { trades } = useTradingContext();

  // ── Convertir les trades Supabase en sessions Psychology ──────────────
  // Each "session" = group of trades per day
  const sessions = useMemo(() => {
    if (!trades || trades.length === 0) return [];

    // Group by date
    const byDate = {};
    trades.forEach(t => {
      const date = (t.open_date || t.date || '').substring(0, 10);
      if (!date) return;
      if (!byDate[date]) byDate[date] = [];
      byDate[date].push(t);
    });

    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, dayTrades], idx) => {
        const pnl = dayTrades.reduce((s, t) => s + parseFloat(t.profit_loss ?? t.pnl ?? 0), 0);
        const wins = dayTrades.filter(t => parseFloat(t.profit_loss ?? t.pnl ?? 0) > 0).length;

        // Psycho score from available data
        // If trades have a psychologyScore, use it, otherwise deduce from P&L
        const psychScores = dayTrades.map(t => t.psychologyScore).filter(Boolean);
        const avgPsychScore = psychScores.length > 0
          ? psychScores.reduce((s, v) => s + v, 0) / psychScores.length
          : null;

        // Deduce axes from P&L and available data
        const perfScore = pnl > 0 ? Math.min(100, 60 + (wins / dayTrades.length) * 40) : Math.max(20, 60 - Math.abs(pnl) / 50);
        const baseScore = avgPsychScore ?? perfScore;

        // Mood deduced from P&L and win rate
        const wr = wins / dayTrades.length;
        const mood = pnl > 500 && wr > 0.7 ? 'excellent'
          : pnl > 0 && wr >= 0.5 ? 'bien'
          : pnl >= -50 ? 'neutre'
          : pnl > -200 ? 'difficile'
          : 'terrible';

        const axeBase = Math.round(baseScore);

        return {
          id: idx + 1,
          date,
          mood,
          sleep: 7,  // not available in trades
          energy: 7,
          routine: pnl > 0,
          discipline:  Math.min(100, Math.round(axeBase * (0.9 + wr * 0.2))),
          patience:    Math.min(100, Math.round(axeBase * (0.85 + wr * 0.15))),
          confidence:  Math.min(100, Math.round(axeBase * (0.88 + wr * 0.12))),
          riskCtrl:    Math.min(100, Math.round(axeBase * (0.92 + wr * 0.08))),
          consistency: Math.min(100, Math.round(axeBase * (0.87 + wr * 0.13))),
          emotional:   Math.min(100, Math.round(axeBase * (0.83 + wr * 0.17))),
          planFollow:  Math.min(100, Math.round(axeBase * (0.90 + wr * 0.10))),
          pnl:         Math.round(pnl),
          trades:      dayTrades.length,
          wins,
          maxTrades:   dayTrades.length + 2,
          maxLoss:     200,
          stressors:   '',
          objectives:  '',
          notes:       dayTrades.map(t => t.notes).filter(Boolean).join(' | ') || '',
        };
      });
  }, [trades]);

  // ── Empty state if no trades ────────────────────────────────────────
  const hasData = sessions.length > 0;

  const stats=useMemo(()=>{
    if(!sessions.length) return{avgScore:0,disciplineRate:0,emotionalPct:0,highPnl:0,totalPnl:0,latestScore:0,prevScore:0,scoreTrend:0};
    const scores=sessions.map(calcPsych);
    const avgScore=Math.round(scores.reduce((s,v)=>s+v,0)/scores.length);
    const disciplineRate=Math.round(sessions.reduce((s,v)=>s+(v.discipline||0),0)/sessions.length);
    const emotionalSess=sessions.filter(s=>calcPsych(s)<50);
    const emotionalPct=Math.round((emotionalSess.length/sessions.length)*100);
    const highPnl=sessions.filter(s=>calcPsych(s)>=70).reduce((s,v)=>s+(v.pnl||0),0);
    const totalPnl=sessions.reduce((s,v)=>s+(v.pnl||0),0);
    const latest=sessions[sessions.length-1];
    const latestScore=calcPsych(latest);
    const prevScore=sessions.length>1?calcPsych(sessions[sessions.length-2]):latestScore;
    // Trends
    const mid=Math.floor(scores.length/2);
    const firstHalf=scores.slice(0,mid),secondHalf=scores.slice(mid);
    const avgFirst=firstHalf.reduce((s,v)=>s+v,0)/firstHalf.length;
    const avgSecond=secondHalf.reduce((s,v)=>s+v,0)/secondHalf.length;
    const scoreTrend=Math.round((avgSecond-avgFirst)*10)/10;
    return{avgScore,disciplineRate,emotionalPct,highPnl,totalPnl,latestScore,prevScore,scoreTrend};
  },[sessions]);

  // Empty state
  if(!hasData){
    return(
      <div style={{background:'transparent',minHeight:'100vh',fontFamily:"'SF Pro Display','Segoe UI',system-ui,sans-serif",color:C.t1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:40}}>
        <motion.div initial={{scale:0.8,opacity:0}} animate={{scale:1,opacity:1}} transition={{type:'spring',stiffness:120}}>
          <div style={{width:70,height:4,borderRadius:999,background:C.gradPurple,boxShadow:`0 0 22px ${shade(C.purple,'70')}`,margin:'0 auto 26px'}}/>
          <h2 style={{fontSize:28,fontWeight:900,background:C.gradPurple,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',marginBottom:12}}>Psychology Tracker</h2>
          <p style={{fontSize:15,color:C.t2,maxWidth:440,lineHeight:1.7,marginBottom:8}}>
            No trades recorded yet.
          </p>
          <p style={{fontSize:13,color:C.t3,maxWidth:400,lineHeight:1.7}}>
            Import or add your trades in <strong style={{color:C.cyan}}>All Trades</strong> — psychology data will appear automatically here.
          </p>
          <motion.div animate={{opacity:[0.4,0.9,0.4]}} transition={{duration:2.5,repeat:Infinity}} style={{marginTop:28,display:'inline-flex',alignItems:'center',gap:8,padding:'10px 22px',borderRadius:12,background:`${shade(C.purple,'14')}`,border:`1px solid ${shade(C.purple,'30')}`,fontSize:12,color:C.purple,fontWeight:700}}>
            Your statistics will appear here
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return(
    <div style={{background:'transparent',minHeight:'100vh',fontFamily:"'SF Pro Display','Segoe UI',system-ui,sans-serif",color:C.t1,position:'relative'}}>
      {/* Particles */}
      <div style={{position:'fixed',inset:0,pointerEvents:'none',overflow:'hidden',zIndex:0}}>
        {Array.from({length:14}).map((_,i)=>(
          <motion.div key={i} animate={{y:[0,-34,0],x:[0,(i%2?1:-1)*10,0],opacity:[0.012,0.07,0.012]}}
            transition={{duration:8.5+i*0.42,repeat:Infinity,delay:i*0.62,ease:'easeInOut'}}
            style={{position:'absolute',left:`${(i*14.1)%100}%`,top:`${(i*8.3+10)%100}%`,
              width:i%5===0?3:2,height:i%5===0?3:2,borderRadius:'50%',
              background:[C.purple,C.cyan,C.pink,C.blue,C.teal][i%5]}}/>
        ))}
        <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(255,255,255,0.005) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.005) 1px,transparent 1px)',backgroundSize:'60px 60px'}}/>
      </div>

      <div style={{position:'relative',zIndex:1,padding:'28px 36px 56px'}}>

        {/* ── HEADER ── */}
        <motion.div initial={{opacity:0,y:-18}} animate={{opacity:1,y:0}} transition={{duration:0.5}}
          style={{marginBottom:22,paddingBottom:20,borderBottom:`1px solid ${C.brd}`}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:14}}>
            <div style={{display:'flex',alignItems:'center',gap:14}}>
              <motion.div animate={{opacity:[0.72,1,0.72]}} transition={{duration:5,repeat:Infinity,ease:'easeInOut'}}
                style={{width:46,height:46,borderRadius:14,background:C.gradPurple,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:`0 4px 24px ${C.purpleGlow}`}}>
                <span style={{width:22,height:2,borderRadius:999,background:'#fff',boxShadow:'0 0 16px rgba(255,255,255,0.75)'}}/>
              </motion.div>
              <div>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
                  <h1 style={{margin:0,fontSize:28,fontWeight:900,background:C.gradPurple,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',letterSpacing:'-1.2px',lineHeight:1}}>
                    Trading Psychology Pro
                  </h1>
                  <span style={{padding:'2px 9px',borderRadius:6,background:`${shade(C.blue,'20')}`,border:`1px solid ${shade(C.blue,'40')}`,fontSize:9,fontWeight:800,color:C.blue,letterSpacing:'0.5px'}}>v3.0</span>
                </div>
                <div style={{fontSize:11,color:C.t3}}>Composite score / 8 dimensions / {sessions.length} sessions analyzed</div>
              </div>
            </div>
            {/* Tabs */}
            <div style={{display:'flex',gap:4,padding:'4px',borderRadius:13,background:'rgba(255,255,255,0.03)',border:`1px solid ${C.brd}`}}>
              {TABS.map(t=>(
                <motion.button key={t.id} onClick={()=>setTab(t.id)} whileHover={{scale:1.04}} whileTap={{scale:0.95}}
                  style={{padding:'9px 18px',borderRadius:10,border:'none',cursor:'pointer',fontFamily:'inherit',
                    display:'flex',alignItems:'center',gap:6,fontSize:11,fontWeight:700,transition:'all 0.2s',
                    background:tab===t.id?`linear-gradient(135deg,${shade(C.purple,'24')},${shade(C.blue,'16')})`:'transparent',
                    color:tab===t.id?C.purple:C.t3,
                    boxShadow:tab===t.id?`0 0 0 1px ${shade(C.purple,'45')},0 2px 14px ${shade(C.purple,'18')}`:'none'}}>
                  {t.label}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── KPI ROW ── */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
          <KpiCard custom={0} label="Current Score"
            value={stats.latestScore}
            sub={`${sLabel(stats.latestScore)} / Avg ${stats.avgScore}`}
            color={sColor(stats.latestScore)} trend={stats.scoreTrend}/>
          <KpiCard custom={1} label="Discipline Rate"
            value={`${stats.disciplineRate}%`}
            sub="Avg discipline score" color={C.blue}/>
          <KpiCard custom={2} label="Emotional Sessions"
            value={`${stats.emotionalPct}%`}
            sub={`${Math.round(sessions.length*stats.emotionalPct/100)} sessions with score < 50`}
            color={C.danger}/>
          <KpiCard custom={3} label="Optimal Session P&L"
            value={stats.highPnl>=0?`+$${stats.highPnl.toLocaleString()}`:`-$${Math.abs(stats.highPnl).toLocaleString()}`}
            sub="Sessions with score ≥ 70" color={C.green}/>
        </div>

        {/* ── CONTENT ── */}
        <AnimatePresence mode="wait">

          {tab==='overview'&&(
            <motion.div key="ov" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.32}}>
              <div style={{display:'grid',gridTemplateColumns:'1.15fr 0.95fr',gap:16,marginBottom:16}}>
                <ScoreCard sessions={sessions}/>
                <ProfileRadar sessions={sessions}/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1.28fr 0.92fr',gap:16,marginBottom:16}}>
                <PsychByDay sessions={sessions}/>
                <Patterns sessions={sessions}/>
              </div>
              <ScoreEvolution sessions={sessions}/>
            </motion.div>
          )}

          {tab==='emotions'&&(
            <motion.div key="em" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.32}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
                <EmotionDist sessions={sessions}/>
                <EmotionHeatmap sessions={sessions}/>
              </div>
              <EmotionImpact sessions={sessions}/>
            </motion.div>
          )}

          {tab==='patterns'&&(
            <motion.div key="pt" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.32}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
                <Patterns sessions={sessions}/>
                <PsychByDay sessions={sessions}/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1.15fr 0.85fr',gap:16}}>
                <ScoreEvolution sessions={sessions}/>
                <ProfileRadar sessions={sessions}/>
              </div>
            </motion.div>
          )}

          {tab==='perf'&&(
            <motion.div key="pf" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.32}}>
              <PerfByScore sessions={sessions}/>
            </motion.div>
          )}

          {tab==='journal'&&(
            <motion.div key="jo" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.32}}>
              <Journal sessions={sessions}/>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

