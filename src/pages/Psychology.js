/*
╔══════════════════════════════════════════════════════════════════════╗
║   🧠 MARKETFLOW — PSYCHOLOGIE & MENTAL v3.0 ULTRA                   ║
║   ✦ Score psychologique composite (8 dimensions pondérées)         ║
║   ✦ 30 sessions de démo avec données riches                        ║
║   ✦ Gauge score animée + évolution temporelle                      ║
║   ✦ Radar 7 axes avec comparaison multi-sessions                   ║
║   ✦ Corrélation score/P&L + heatmap calendrier                     ║
║   ✦ Distribution émotions + impact P&L détaillé                    ║
║   ✦ Patterns comportementaux auto-détectés                         ║
║   ✦ Performance par tranche de score                               ║
║   ✦ Journal sessions accordéon premium                             ║
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

// ═══════════════════════════════════════════════════════════════════
// 🎨 DESIGN SYSTEM
// ═══════════════════════════════════════════════════════════════════
const C={
  bg0:'#030508',bg1:'#070C14',bg2:'#0A1020',bg3:'#0F1828',bg4:'#141E30',
  bgCard:'#0C1422',bgHigh:'#121C2E',bgHover:'#0F1A2E',
  cyan:'#06E6FF',   cyanGlow:  'rgba(6,230,255,0.35)',
  teal:'#00F5D4',   tealGlow:  'rgba(0,245,212,0.3)',
  green:'#00FF88',  greenGlow: 'rgba(0,255,136,0.35)',
  danger:'#FF3D57', dangerGlow:'rgba(255,61,87,0.35)',
  warn:'#FFB31A',   warnGlow:  'rgba(255,179,26,0.35)',
  orange:'#FF6B35',
  purple:'#B06EFF', purpleGlow:'rgba(176,110,255,0.35)',
  blue:'#4D7CFF',   blueGlow:  'rgba(77,124,255,0.3)',
  pink:'#FF4DC4',   pinkGlow:  'rgba(255,77,196,0.3)',
  gold:'#FFD700',
  t0:'#FFFFFF',t1:'#E8EEFF',t2:'#7A90B8',t3:'#334566',t4:'#1E2E45',
  brd:'#162034',brdHi:'#1E2E48',
  gradCyan:  'linear-gradient(135deg,#06E6FF,#00FF88)',
  gradPurple:'linear-gradient(135deg,#B06EFF,#4D7CFF)',
  gradWarm:  'linear-gradient(135deg,#FFB31A,#FF6B35)',
  gradDanger:'linear-gradient(135deg,#FF3D57,#FF6B35)',
  gradPink:  'linear-gradient(135deg,#FF4DC4,#B06EFF)',
  gradGold:  'linear-gradient(135deg,#FFD700,#FF9F00)',
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
      border:`1px solid ${glow?glow+'26':C.brd}`,
      boxShadow:`0 4px 40px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.04)${glow?`,0 0 55px ${glow}08`:''}`,
      cursor:onClick?'pointer':'default',transition:'box-shadow 0.4s',...style}} {...p}>
    <div style={{position:'absolute',inset:0,opacity:0.024,backgroundImage:NOISE,backgroundSize:'128px',pointerEvents:'none',zIndex:0}}/>
    <div style={{position:'relative',zIndex:1,height:'100%'}}>{children}</div>
  </motion.div>
);

const ST=({children,sub,color=C.cyan,icon,mb=14})=>(
  <div style={{marginBottom:mb}}>
    <div style={{display:'flex',alignItems:'center',gap:9}}>
      {icon&&<span style={{fontSize:15,filter:`drop-shadow(0 0 8px ${color})`}}>{icon}</span>}
      <div style={{width:3,height:16,background:`linear-gradient(180deg,${color},${color}50)`,borderRadius:2,flexShrink:0}}/>
      <span style={{fontSize:14,fontWeight:800,color:C.t1,letterSpacing:'-0.3px'}}>{children}</span>
    </div>
    {sub&&<p style={{margin:'4px 0 0',fontSize:9,color:C.t3,paddingLeft:icon?33:12}}>{sub}</p>}
  </div>
);

// ═══════════════════════════════════════════════════════════════════
// 📊 DATA RICHE — 30 sessions
// ═══════════════════════════════════════════════════════════════════
const MOODS=[
  {id:'excellent',label:'Excellent',emoji:'🔥',color:C.green},
  {id:'bien',     label:'Bien',     emoji:'😊',color:C.cyan},
  {id:'neutre',   label:'Neutre',   emoji:'😐',color:C.warn},
  {id:'difficile',label:'Difficile',emoji:'😔',color:C.orange},
  {id:'terrible', label:'Terrible', emoji:'😤',color:C.danger},
];
const DAYS_FR=['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
const AXES7=[
  {key:'discipline', label:'Discipline',   color:C.cyan,   weight:0.18,desc:'Respect des règles'},
  {key:'patience',   label:'Patience',     color:C.green,  weight:0.14,desc:'Attente du bon moment'},
  {key:'confidence', label:'Confiance',    color:C.purple, weight:0.12,desc:'Estime de soi dans le trade'},
  {key:'riskCtrl',   label:'Risk Control', color:C.teal,   weight:0.18,desc:'Gestion de la taille'},
  {key:'consistency',label:'Consistency',  color:C.warn,   weight:0.14,desc:'Régularité du process'},
  {key:'emotional',  label:'Émot. Control',color:C.pink,   weight:0.14,desc:'Contrôle des émotions'},
  {key:'planFollow', label:'Plan Follow',  color:C.blue,   weight:0.10,desc:'Suivi du plan de trading'},
];

// Score psychologique composite (pondéré)
const calcPsych=s=>{
  if(!s)return 0;
  const moodScore={excellent:100,bien:80,neutre:60,difficile:35,terrible:15}[s.mood]||50;
  const axeScore=AXES7.reduce((acc,ax)=>{
    const v=s[ax.key]||0;
    return acc+v*ax.weight;
  },0)/AXES7.reduce((a,ax)=>a+ax.weight,0);
  const physScore=(((s.sleep||5)/10)*100*0.5+((s.energy||5)/10)*100*0.5);
  // Pondération: humeur 20%, axes 55%, physique 15%, routine 10%
  const routineBonus=(s.routine?10:0);
  const raw=moodScore*0.20+axeScore*0.55+physScore*0.15+routineBonus;
  return Math.min(100,Math.max(0,Math.round(raw)));
};

const sColor=s=>s>=75?C.green:s>=60?C.cyan:s>=45?C.warn:s>=30?C.orange:C.danger;
const sLabel=s=>s>=80?'Elite':s>=70?'Excellent':s>=60?'Solide':s>=50?'Correct':s>=40?'Fragile':s>=30?'Difficile':'Critique';
const sEmoji=s=>s>=80?'🏆':s>=70?'🔥':s>=60?'😊':s>=50?'😐':s>=40?'😔':'😤';

// 30 sessions riches
const DEMO=[
  {id:1, date:'2025-11-03',mood:'bien',     sleep:7,energy:7,discipline:72,patience:68,confidence:75,riskCtrl:70,consistency:68,emotional:70,planFollow:76,pnl:340, trades:3,wins:2,stressors:'',     objectives:'RR 1:2 minimum',    routine:true, maxTrades:4,maxLoss:120,notes:'Bonne session calme.'},
  {id:2, date:'2025-11-04',mood:'excellent',sleep:9,energy:9,discipline:92,patience:88,confidence:94,riskCtrl:90,consistency:88,emotional:92,planFollow:96,pnl:2100,trades:2,wins:2,stressors:'',     objectives:'Setups A+ only',    routine:true, maxTrades:3,maxLoss:200,notes:'Parfait, 2/2.'},
  {id:3, date:'2025-11-05',mood:'neutre',   sleep:6,energy:6,discipline:58,patience:52,confidence:60,riskCtrl:55,consistency:56,emotional:52,planFollow:62,pnl:-85, trades:3,wins:1,stressors:'Fatigue',objectives:'Limiter overtrade', routine:false,maxTrades:3,maxLoss:100,notes:'Sortie prématurée sur 2 trades.'},
  {id:4, date:'2025-11-06',mood:'difficile',sleep:5,energy:5,discipline:38,patience:32,confidence:42,riskCtrl:36,consistency:40,emotional:34,planFollow:44,pnl:-320,trades:5,wins:1,stressors:'Stress perso', objectives:'Ne pas revenge', routine:false,maxTrades:2,maxLoss:80, notes:'Revenge trading x3. Stop loss non respecté.'},
  {id:5, date:'2025-11-10',mood:'bien',     sleep:8,energy:8,discipline:78,patience:74,confidence:80,riskCtrl:76,consistency:72,emotional:76,planFollow:82,pnl:620, trades:3,wins:2,stressors:'',     objectives:'Scalp propre',      routine:true, maxTrades:4,maxLoss:150,notes:'Très bonne patience sur les entries.'},
  {id:6, date:'2025-11-11',mood:'excellent',sleep:8,energy:9,discipline:88,patience:86,confidence:90,riskCtrl:86,consistency:84,emotional:88,planFollow:92,pnl:1750,trades:3,wins:3,stressors:'',     objectives:'Journée swing',     routine:true, maxTrades:3,maxLoss:180,notes:'3/3. Journée parfaite.'},
  {id:7, date:'2025-11-12',mood:'neutre',   sleep:6,energy:7,discipline:62,patience:58,confidence:64,riskCtrl:60,consistency:58,emotional:60,planFollow:66,pnl:110, trades:2,wins:1,stressors:'Nuit courte',objectives:'Focus 2 trades max', routine:true,maxTrades:2,maxLoss:80,notes:'Respecté les limites malgré la fatigue.'},
  {id:8, date:'2025-11-13',mood:'bien',     sleep:7,energy:8,discipline:76,patience:72,confidence:78,riskCtrl:74,consistency:70,emotional:74,planFollow:80,pnl:480, trades:4,wins:3,stressors:'',     objectives:'Tendance longue',    routine:true, maxTrades:4,maxLoss:150,notes:'Bon suivi de tendance.'},
  {id:9, date:'2025-11-17',mood:'terrible', sleep:4,energy:4,discipline:28,patience:24,confidence:30,riskCtrl:26,consistency:28,emotional:22,planFollow:32,pnl:-450,trades:6,wins:1,stressors:'Problème perso grave',objectives:'',routine:false,maxTrades:2,maxLoss:80,notes:'Aurais dû ne pas trader. Décision impulsive.'},
  {id:10,date:'2025-11-18',mood:'neutre',   sleep:6,energy:6,discipline:55,patience:50,confidence:58,riskCtrl:52,consistency:54,emotional:50,planFollow:60,pnl:60,  trades:1,wins:1,stressors:'',     objectives:'Un seul trade',      routine:true, maxTrades:1,maxLoss:60, notes:'Sage décision après hier.'},
  {id:11,date:'2025-11-19',mood:'bien',     sleep:7,energy:7,discipline:74,patience:70,confidence:76,riskCtrl:72,consistency:68,emotional:72,planFollow:78,pnl:390, trades:3,wins:2,stressors:'',     objectives:'Back to basics',     routine:true, maxTrades:4,maxLoss:120,notes:'Bonne reprise.'},
  {id:12,date:'2025-11-20',mood:'excellent',sleep:9,energy:8,discipline:90,patience:86,confidence:92,riskCtrl:88,consistency:86,emotional:90,planFollow:94,pnl:1920,trades:3,wins:3,stressors:'',     objectives:'Confirmation trend', routine:true, maxTrades:3,maxLoss:200,notes:'Excellent timing sur toutes les entries.'},
  {id:13,date:'2025-11-24',mood:'bien',     sleep:7,energy:8,discipline:80,patience:76,confidence:82,riskCtrl:78,consistency:74,emotional:78,planFollow:84,pnl:720, trades:3,wins:2,stressors:'',     objectives:'Continuité semaine', routine:true, maxTrades:4,maxLoss:150,notes:'Maintenu le niveau.'},
  {id:14,date:'2025-11-25',mood:'difficile',sleep:5,energy:5,discipline:44,patience:38,confidence:46,riskCtrl:42,consistency:44,emotional:40,planFollow:48,pnl:-180,trades:4,wins:1,stressors:'Fatigue accum.', objectives:'Réduire taille',routine:false,maxTrades:2,maxLoss:80,notes:'Aurais dû réduire dès le matin.'},
  {id:15,date:'2025-11-26',mood:'neutre',   sleep:6,energy:6,discipline:60,patience:56,confidence:62,riskCtrl:58,consistency:58,emotional:56,planFollow:64,pnl:150, trades:2,wins:1,stressors:'',     objectives:'Récupération',       routine:true, maxTrades:2,maxLoss:80, notes:'Retour progressif.'},
  {id:16,date:'2025-12-01',mood:'excellent',sleep:8,energy:9,discipline:86,patience:84,confidence:88,riskCtrl:84,consistency:80,emotional:86,planFollow:90,pnl:1640,trades:3,wins:3,stressors:'',     objectives:'Semaine de reprise', routine:true, maxTrades:4,maxLoss:200,notes:'Parfaite semaine de retour.'},
  {id:17,date:'2025-12-02',mood:'bien',     sleep:8,energy:8,discipline:78,patience:74,confidence:80,riskCtrl:76,consistency:72,emotional:76,planFollow:82,pnl:560, trades:3,wins:2,stressors:'',     objectives:'Consolider gains',   routine:true, maxTrades:3,maxLoss:150,notes:'Géré proprement.'},
  {id:18,date:'2025-12-03',mood:'neutre',   sleep:6,energy:7,discipline:64,patience:60,confidence:66,riskCtrl:62,consistency:62,emotional:62,planFollow:68,pnl:200, trades:2,wins:1,stressors:'',     objectives:'Limiter risque',     routine:true, maxTrades:2,maxLoss:100,notes:'Conservateur mais ok.'},
  {id:19,date:'2025-12-04',mood:'bien',     sleep:7,energy:8,discipline:76,patience:72,confidence:78,riskCtrl:74,consistency:70,emotional:74,planFollow:80,pnl:480, trades:3,wins:2,stressors:'',     objectives:'Entrées précises',   routine:true, maxTrades:4,maxLoss:130,notes:'Bonne lecture du marché.'},
  {id:20,date:'2025-12-05',mood:'excellent',sleep:9,energy:9,discipline:94,patience:90,confidence:96,riskCtrl:92,consistency:90,emotional:94,planFollow:98,pnl:2850,trades:4,wins:4,stressors:'',     objectives:'Journée record',     routine:true, maxTrades:5,maxLoss:250,notes:'4/4 ! Meilleure journée de l\'année.'},
  {id:21,date:'2025-12-08',mood:'difficile',sleep:5,energy:5,discipline:42,patience:36,confidence:44,riskCtrl:40,consistency:42,emotional:36,planFollow:46,pnl:-240,trades:4,wins:1,stressors:'Stress trav.', objectives:'Max 2 trades',routine:false,maxTrades:2,maxLoss:80,notes:'Respecté partiellement, 2 trades de trop.'},
  {id:22,date:'2025-12-09',mood:'bien',     sleep:7,energy:7,discipline:72,patience:68,confidence:74,riskCtrl:70,consistency:66,emotional:70,planFollow:76,pnl:310, trades:2,wins:2,stressors:'',     objectives:'Retour propre',      routine:true, maxTrades:3,maxLoss:100,notes:'Bonne récupération.'},
  {id:23,date:'2025-12-10',mood:'bien',     sleep:8,energy:8,discipline:80,patience:76,confidence:82,riskCtrl:78,consistency:74,emotional:78,planFollow:84,pnl:680, trades:3,wins:2,stressors:'',     objectives:'Suivre la tendance', routine:true, maxTrades:4,maxLoss:150,notes:'Bon trend following.'},
  {id:24,date:'2025-12-11',mood:'excellent',sleep:8,energy:9,discipline:88,patience:86,confidence:90,riskCtrl:86,consistency:84,emotional:88,planFollow:92,pnl:1580,trades:3,wins:3,stressors:'',     objectives:'Semaine forte',      routine:true, maxTrades:4,maxLoss:200,notes:'Très belle semaine.'},
  {id:25,date:'2025-12-15',mood:'neutre',   sleep:6,energy:6,discipline:62,patience:58,confidence:64,riskCtrl:60,consistency:60,emotional:60,planFollow:66,pnl:80,  trades:2,wins:1,stressors:'Vacances proches',objectives:'Prudence',routine:true,maxTrades:2,maxLoss:80,notes:'Distrait par les vacances.'},
  {id:26,date:'2025-12-16',mood:'neutre',   sleep:7,energy:7,discipline:66,patience:62,confidence:68,riskCtrl:64,consistency:62,emotional:64,planFollow:70,pnl:220, trades:2,wins:2,stressors:'',     objectives:'Focus 2 trades',     routine:true, maxTrades:2,maxLoss:80, notes:'Discipliné dans la zone de prudence.'},
  {id:27,date:'2026-01-05',mood:'bien',     sleep:8,energy:8,discipline:76,patience:72,confidence:78,riskCtrl:74,consistency:70,emotional:74,planFollow:80,pnl:420, trades:3,wins:2,stressors:'',     objectives:'Reprise janvier',    routine:true, maxTrades:4,maxLoss:130,notes:'Bonne reprise après vacances.'},
  {id:28,date:'2026-01-06',mood:'excellent',sleep:9,energy:9,discipline:90,patience:88,confidence:92,riskCtrl:88,consistency:86,emotional:90,planFollow:94,pnl:2100,trades:3,wins:3,stressors:'',     objectives:'Année en beauté',    routine:true, maxTrades:4,maxLoss:200,notes:'Excellent début d\'année.'},
  {id:29,date:'2026-01-07',mood:'bien',     sleep:7,energy:8,discipline:78,patience:74,confidence:80,riskCtrl:76,consistency:72,emotional:76,planFollow:82,pnl:690, trades:3,wins:2,stressors:'',     objectives:'Consolider',         routine:true, maxTrades:4,maxLoss:150,notes:'Solide.'},
  {id:30,date:'2026-01-08',mood:'bien',     sleep:7,energy:7,discipline:74,patience:70,confidence:76,riskCtrl:72,consistency:68,emotional:72,planFollow:78,pnl:380, trades:2,wins:2,stressors:'',     objectives:'Fin de semaine propre',routine:true,maxTrades:3,maxLoss:120,notes:'Clôturé proprement la semaine.'},
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
// 🏆 SCORE GAUGE — pièce maîtresse
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
        <ST icon="🧠" color={sc} mb={0}>Score Psychologique</ST>
        <div style={{display:'flex',gap:7}}>
          <div style={{padding:'3px 10px',borderRadius:20,background:`${C.purple}18`,border:`1px solid ${C.purple}30`,fontSize:9,fontWeight:700,color:C.purple}}>Moy. {avgScore}</div>
          <div style={{padding:'3px 10px',borderRadius:20,background:`${C.gold}18`,border:`1px solid ${C.gold}30`,fontSize:9,fontWeight:700,color:C.gold}}>Best {bestScore}</div>
        </div>
      </div>

      {/* ── BIG SCORE : horizontal segmented bar ── */}
      <div style={{
        padding:'18px 20px',borderRadius:16,
        background:`linear-gradient(135deg,${sc}0F,${sc}06)`,
        border:`1px solid ${sc}30`,marginBottom:16,
      }}>
        {/* Valeur + label */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:12}}>
          <div>
            <div style={{fontSize:8,color:C.t3,marginBottom:4,textTransform:'uppercase',letterSpacing:'1px',fontWeight:700}}>Score du jour</div>
            <div style={{display:'flex',alignItems:'baseline',gap:6}}>
              <motion.span
                key={score}
                initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}
                style={{fontSize:64,fontWeight:900,fontFamily:'monospace',lineHeight:1,
                  color:sc,textShadow:`0 0 40px ${sc}70`,letterSpacing:'-3px'}}>
                {animScore}
              </motion.span>
              <span style={{fontSize:18,color:C.t3,fontWeight:700,marginBottom:4}}>/100</span>
            </div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:22,marginBottom:4}}>{sEmoji(score)}</div>
            <div style={{fontSize:13,fontWeight:900,color:sc,letterSpacing:'-0.3px'}}>{sLabel(score)}</div>
            <div style={{fontSize:10,color:C.t2,marginTop:2,display:'flex',alignItems:'center',gap:4,justifyContent:'flex-end'}}>
              <span style={{color:trend>=0?C.green:C.danger,fontWeight:800}}>{trend>=0?'↗':'↘'} {trend>=0?'+':''}{trend} pts</span>
              <span style={{color:C.t3}}>vs hier</span>
            </div>
          </div>
        </div>

        {/* Barre segmentée 0→100 avec gradient de couleur */}
        <div style={{position:'relative',height:14,borderRadius:7,background:'rgba(255,255,255,0.05)',overflow:'hidden',marginBottom:6}}>
          {/* Zones colorées fixes */}
          <div style={{position:'absolute',inset:0,background:`linear-gradient(90deg,
            ${C.danger}45 0%,${C.danger}45 30%,
            ${C.orange}45 30%,${C.orange}45 45%,
            ${C.warn}45 45%,${C.warn}45 60%,
            ${C.cyan}45 60%,${C.cyan}45 75%,
            ${C.green}45 75%,${C.green}45 100%
          )`,borderRadius:7}}/>
          {/* Fill animé */}
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
              boxShadow:`0 0 16px ${sc}60`,
            }}/>
          {/* Marqueur score moyen */}
          <div style={{position:'absolute',top:-2,bottom:-2,left:`${avgScore}%`,
            width:2,background:'rgba(255,255,255,0.6)',borderRadius:1,zIndex:2,
            boxShadow:'0 0 4px rgba(255,255,255,0.4)'}}/>
        </div>
        {/* Zone labels */}
        <div style={{display:'flex',justifyContent:'space-between',fontSize:7.5,color:C.t3,fontWeight:600}}>
          <span>Critique</span><span>Fragile</span><span>Correct</span><span>Solide</span><span>Elite</span>
        </div>
        <div style={{fontSize:8,color:C.t3,marginTop:4,display:'flex',alignItems:'center',gap:4}}>
          <div style={{width:8,height:1.5,background:'rgba(255,255,255,0.5)',borderRadius:1}}/>
          Barre blanche = moyenne historique ({avgScore}/100)
        </div>
      </div>

      {/* ── Info session : humeur + routine + physique ── */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:16}}>
        {[
          {l:'Humeur',     v:`${em?.emoji} ${em?.label}`,       c:em?.color||C.t3},
          {l:'Routine',    v:latest.routine?'✓ Complétée':'✗ Non faite', c:latest.routine?C.green:C.danger},
          {l:'Sommeil',    v:`${latest.sleep||'—'}/10`,         c:C.purple},
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
                    background:`linear-gradient(90deg,${ax.color}45,${ax.color})`,
                    boxShadow:`0 0 6px ${ax.color}35`}}/>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{marginTop:8,fontSize:8,color:C.t3,display:'flex',alignItems:'center',gap:4}}>
        <div style={{width:10,height:1.5,background:'rgba(255,255,255,0.35)',borderRadius:1}}/>
        Barre verticale blanche = moyenne historique par axe
      </div>
    </GlassCard>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 🗓️ PSYCHOLOGY BY DAY OF WEEK — version premium
// ═══════════════════════════════════════════════════════════════════
const PsychByDay=({sessions})=>{
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
        <ST icon="🗓️" color={C.purple} mb={0}>Psychology by Day of Week</ST>
        {/* Résumé meilleur/pire */}
        <div style={{display:'flex',gap:10}}>
          {bestDay&&<div style={{padding:'4px 12px',borderRadius:20,background:`${C.green}15`,border:`1px solid ${C.green}28`,fontSize:9,fontWeight:700,color:C.green}}>
            🏆 {bestDay.day} · {bestDay.score}
          </div>}
          {worstDay&&worstDay.day!==bestDay?.day&&<div style={{padding:'4px 12px',borderRadius:20,background:`${C.danger}15`,border:`1px solid ${C.danger}28`,fontSize:9,fontWeight:700,color:C.danger}}>
            ⚠️ {worstDay.day} · {worstDay.score}
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

              {/* Tooltip au survol */}
              <AnimatePresence>
                {isHov&&d.count>0&&(
                  <motion.div initial={{opacity:0,y:6,scale:0.92}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:4,scale:0.95}}
                    transition={{duration:0.18}}
                    style={{position:'absolute',marginBottom:4,zIndex:20,
                      background:C.bgHigh,border:`1px solid ${sc}40`,borderRadius:11,
                      padding:'10px 12px',boxShadow:`0 12px 36px rgba(0,0,0,0.8),0 0 0 1px ${sc}20`,
                      pointerEvents:'none',minWidth:130,transform:'translateY(-210px)'}}>
                    <div style={{fontSize:11,fontWeight:900,color:sc,marginBottom:4}}>{d.day} — {d.count} session{d.count>1?'s':''}</div>
                    <div style={{fontSize:10,color:C.t1,fontWeight:800,marginBottom:2}}>Score : {d.score}/100</div>
                    <div style={{fontSize:10,color:d.avgPnl>=0?C.green:C.danger,fontFamily:'monospace',fontWeight:800}}>P&L moy. : {d.avgPnl>=0?'+':''}${d.avgPnl}</div>
                    <div style={{fontSize:9,color:C.t2,marginTop:3}}>Win Rate : {d.winRate}%</div>
                    <div style={{fontSize:9,color:C.danger}}>Taux émot. : {d.emotRate}%</div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Score label au dessus */}
              {d.count>0&&(
                <div style={{fontSize:10,fontWeight:900,color:isHov?sc:C.t3,fontFamily:'monospace',
                  transition:'color 0.2s',marginBottom:2}}>
                  {d.score}
                </div>
              )}

              {/* Barre principale */}
              <div style={{width:'100%',position:'relative',display:'flex',flexDirection:'column',alignItems:'center'}}>
                {/* Glow halo */}
                {d.count>0&&isHov&&(
                  <div style={{position:'absolute',bottom:0,left:'50%',transform:'translateX(-50%)',
                    width:'110%',height:barH+20,background:`radial-gradient(ellipse at bottom,${sc}30,transparent 70%)`,
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
                      ?`linear-gradient(180deg,${sc}EE 0%,${sc}99 60%,${sc}44 100%)`
                      :'rgba(255,255,255,0.05)',
                    boxShadow:isHov&&d.count?`0 0 20px ${sc}60,0 4px 16px ${sc}30`:'none',
                    transition:'box-shadow 0.2s',
                    border:`1px solid ${d.count?(isHov?sc+'80':sc+'30'):'rgba(255,255,255,0.07)'}`,
                  }}>
                  {/* Shimmer interne */}
                  {d.count>0&&(
                    <motion.div
                      animate={{x:['-100%','100%']}}
                      transition={{duration:2.5,repeat:Infinity,delay:i*0.3,ease:'linear'}}
                      style={{position:'absolute',top:0,bottom:0,width:'40%',
                        background:`linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent)`,
                        transform:'skewX(-15deg)'}}/>
                  )}
                  {/* P&L indicator (petit point bas) */}
                  {d.count>0&&(
                    <div style={{position:'absolute',bottom:4,left:'50%',transform:'translateX(-50%)',
                      width:5,height:5,borderRadius:'50%',
                      background:d.avgPnl>=0?C.green:C.danger,
                      boxShadow:`0 0 5px ${d.avgPnl>=0?C.green:C.danger}`}}/>
                  )}
                  {/* Best badge */}
                  {isBest&&(
                    <div style={{position:'absolute',top:4,left:'50%',transform:'translateX(-50%)',
                      fontSize:9}}>🏆</div>
                  )}
                </motion.div>

                {/* Barre émotionnelle en dessous */}
                {d.count>0&&d.emotRate>0&&(
                  <motion.div
                    initial={{height:0}} animate={{height:Math.max(3,Math.round(d.emotRate/100*20))}}
                    transition={{duration:0.7,delay:i*0.06+0.4}}
                    style={{width:'80%',borderRadius:'0 0 4px 4px',marginTop:1,
                      background:`linear-gradient(180deg,${C.danger}90,${C.danger}40)`,
                      boxShadow:`0 2px 6px ${C.danger}30`}}/>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Labels jours ── */}
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
          {l:'Meilleur jour',v:bestDay?.day||'—',sub:`Score ${bestDay?.score||0}`,c:C.green},
          {l:'P&L moy. max', v:bestDay?.avgPnl>=0?`+$${bestDay?.avgPnl||0}`:`-$${Math.abs(bestDay?.avgPnl||0)}`,sub:bestDay?.day||'—',c:C.green},
          {l:'Win Rate max', v:`${Math.max(...data.filter(d=>d.count>0).map(d=>d.winRate),0)}%`,sub:`${data.filter(d=>d.count>0).sort((a,b)=>b.winRate-a.winRate)[0]?.day||'—'}`,c:C.cyan},
          {l:'Taux émot. max',v:`${Math.max(...data.filter(d=>d.count>0).map(d=>d.emotRate),0)}%`,sub:data.filter(d=>d.count>0).sort((a,b)=>b.emotRate-a.emotRate)[0]?.day||'—',c:C.danger},
        ].map(({l,v,sub,c})=>(
          <div key={l} style={{padding:'9px 10px',borderRadius:10,background:'rgba(255,255,255,0.03)',border:`1px solid ${C.brd}`,textAlign:'center'}}>
            <div style={{fontSize:7.5,color:C.t3,marginBottom:4,textTransform:'uppercase',letterSpacing:'0.5px',fontWeight:700}}>{l}</div>
            <div style={{fontSize:14,fontWeight:900,color:c,fontFamily:'monospace',marginBottom:2}}>{v}</div>
            <div style={{fontSize:9,color:C.t3}}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Légende */}
      <div style={{display:'flex',gap:16,marginTop:12,flexWrap:'wrap'}}>
        {[
          {c:C.green, l:'Score ≥ 75 — Optimal'},
          {c:C.cyan,  l:'60–75 — Solide'},
          {c:C.warn,  l:'45–60 — Correct'},
          {c:C.danger,l:'< 45 — Risqué'},
        ].map(({c,l})=>(
          <div key={l} style={{display:'flex',alignItems:'center',gap:5,fontSize:8.5,color:C.t3}}>
            <div style={{width:8,height:8,borderRadius:2,background:c,opacity:0.9}}/>
            {l}
          </div>
        ))}
        <div style={{display:'flex',alignItems:'center',gap:5,fontSize:8.5,color:C.t3}}>
          <div style={{width:5,height:5,borderRadius:'50%',background:C.danger}}/>
          Point bas = taux émotionnel
        </div>
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
        <ST icon="🕸️" color={C.purple} mb={0}>Psychological Profile</ST>
        <select value={compareIdx} onChange={e=>setCompareIdx(e.target.value)}
          style={{background:C.bgHigh,border:`1px solid ${C.brd}`,borderRadius:8,padding:'4px 8px',color:C.t2,fontSize:9,fontFamily:'inherit',outline:'none',cursor:'pointer'}}>
          <option value="avg">vs Moyenne</option>
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
              fill={s===1?'rgba(176,110,255,0.04)':'none'}
              stroke={s===1?'rgba(176,110,255,0.22)':'rgba(255,255,255,0.06)'} strokeWidth={s===1?1.5:0.7}/>
          ))}
          {[25,50,75,100].map(pct=>{
            const[x,y]=polar(0,R*(pct/100));
            return<text key={pct} x={x-6} y={y} fill="rgba(255,255,255,0.2)" fontSize={7.5} fontFamily="monospace" textAnchor="end">{pct}</text>;
          })}
          {AXES7.map((_,i)=>{const[x,y]=polar(i,R);return<line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.07)" strokeWidth={1} strokeDasharray="3 4"/>;} )}
          {compare&&<path d={poly(compare)} fill="url(#rg-c)" stroke="rgba(6,230,255,0.38)" strokeWidth={1.5} strokeDasharray="5 4"/>}
          <motion.path initial={{pathLength:0,opacity:0}} animate={{pathLength:1,opacity:1}} transition={{duration:1.8,delay:0.2}}
            d={poly(latest)} fill="url(#rg-m)" stroke="rgba(176,110,255,0.95)" strokeWidth={2} filter="url(#rg-gl)"/>
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
        {[{c:C.purple,l:'Session actuelle'},{c:C.cyan,l:compareIdx==='avg'?'Moyenne':'Session précédente',dash:true}].map(({c,l,dash})=>(
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
        <div style={{color:sc,fontFamily:'monospace',fontWeight:800}}>Score : {d?.score}/100 — {sLabel(d?.score||0)}</div>
        <div style={{color:d?.pnl>=0?C.green:C.danger,fontFamily:'monospace',fontWeight:800,marginTop:2}}>P&L cumulé : {d?.pnl>=0?'+':''}${d?.pnl?.toLocaleString()}</div>
        <div style={{color:C.t3,fontSize:9,marginTop:3}}>{MOODS.find(m=>m.id===d?.mood)?.emoji} {MOODS.find(m=>m.id===d?.mood)?.label}</div>
      </div>
    );
  };
  return(
    <GlassCard custom={5} glow={C.blue} style={{padding:'24px 22px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
        <ST icon="📈" color={C.blue} mb={0}>Score Mental vs P&L Cumulatif</ST>
        <div style={{display:'flex',gap:14}}>
          {[{c:C.purple,l:'Score'},{c:C.green,l:'P&L cumulatif'}].map(({c,l})=>(
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
          <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" vertical={false}/>
          <XAxis dataKey="date" tick={{fill:C.t3,fontSize:8.5}} axisLine={false} tickLine={false} interval={3}/>
          <YAxis yAxisId="s" domain={[0,100]} tick={{fill:C.t3,fontSize:8}} axisLine={false} tickLine={false} width={26}/>
          <YAxis yAxisId="p" orientation="right" tick={{fill:C.t3,fontSize:8}} axisLine={false} tickLine={false} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} width={38}/>
          <Tooltip content={<CustomTT/>}/>
          <ReferenceLine yAxisId="s" y={70} stroke={`${C.green}22`} strokeDasharray="4 3"/>
          <ReferenceLine yAxisId="s" y={50} stroke="rgba(255,255,255,0.07)" strokeDasharray="4 3"/>
          <Area yAxisId="p" type="monotone" dataKey="pnl" stroke={C.green} strokeWidth={2.5} fill="url(#ev-pnl)" dot={false} activeDot={{r:5,fill:C.green,stroke:'#fff',strokeWidth:2}} name="pnl"/>
          <Line yAxisId="s" type="monotone" dataKey="score" stroke={C.purple} strokeWidth={2.5}
            dot={(p)=>{
              const sc=sColor(p.value);
              return<circle key={p.index} cx={p.cx} cy={p.cy} r={4} fill={sc} stroke="rgba(255,255,255,0.8)" strokeWidth={1.5}/>;
            }}
            activeDot={{r:7,fill:C.purple,stroke:'#fff',strokeWidth:2}} name="score"/>
        </ComposedChart>
      </ResponsiveContainer>
    </GlassCard>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 🗓️ HEATMAP + DAY OF WEEK
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// 😊 DISTRIBUTION ÉMOTIONS
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
      <ST icon="😊" color={C.warn}>Distribution des États Émotionnels</ST>
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
                      style={{transformOrigin:'80px 80px',filter:`drop-shadow(0 0 5px ${m.color}55)`}}/>
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
              <span style={{fontSize:18,flexShrink:0}}>{m.emoji}</span>
              <div style={{flex:1}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                  <span style={{fontSize:11,fontWeight:700,color:m.color}}>{m.label}</span>
                  <span style={{fontSize:11,fontWeight:900,fontFamily:'monospace',color:m.avgPnl>=0?C.green:C.danger}}>{m.avgPnl>=0?'+':''}${m.avgPnl}</span>
                </div>
                <div style={{height:5,borderRadius:3,background:'rgba(255,255,255,0.05)',overflow:'hidden'}}>
                  <motion.div initial={{width:0}} animate={{width:`${m.pct}%`}} transition={{duration:0.8,delay:i*0.06}}
                    style={{height:'100%',background:`linear-gradient(90deg,${m.color}55,${m.color})`,borderRadius:3,boxShadow:`0 0 5px ${m.color}40`}}/>
                </div>
                <div style={{fontSize:8,color:C.t3,marginTop:2}}>{m.count}× · WR {m.winRate}% · Score moy. {m.avgScore}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{borderRadius:12,overflow:'hidden',border:`1px solid ${C.brd}`}}>
        <div style={{display:'grid',gridTemplateColumns:'1.2fr 1fr 1fr 1fr 1fr',padding:'7px 12px',background:'rgba(255,255,255,0.04)',borderBottom:`1px solid ${C.brd}`}}>
          {['Humeur','Sessions','P&L Total','Win Rate','Score Moy.'].map(h=>(
            <div key={h} style={{fontSize:8,fontWeight:800,color:C.t3,textTransform:'uppercase',letterSpacing:'0.5px',textAlign:h==='Humeur'?'left':'center'}}>{h}</div>
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
  const heat=v=>{if(v>=80)return{bg:`${C.green}28`,border:`${C.green}50`,c:C.green};if(v>=65)return{bg:`${C.cyan}22`,border:`${C.cyan}40`,c:C.cyan};if(v>=50)return{bg:`${C.warn}18`,border:`${C.warn}35`,c:C.warn};if(v>=35)return{bg:`${C.orange}18`,border:`${C.orange}30`,c:C.orange};return{bg:`${C.danger}18`,border:`${C.danger}30`,c:C.danger};};
  return(
    <GlassCard custom={8} glow={C.pink} style={{padding:'24px 22px'}}>
      <ST icon="🌡️" color={C.pink}>Heatmap Humeur × Axes Psychologiques</ST>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'separate',borderSpacing:3}}>
          <thead><tr>
            <th style={{fontSize:8,color:C.t3,fontWeight:700,textAlign:'left',padding:'0 6px 8px',textTransform:'uppercase'}}>Humeur</th>
            {AXES7.map(ax=><th key={ax.key} style={{fontSize:8,color:ax.color,fontWeight:700,padding:'0 2px 8px',textAlign:'center',textTransform:'uppercase',minWidth:54}}>{ax.label}</th>)}
            <th style={{fontSize:8,color:C.green,fontWeight:700,padding:'0 2px 8px',textAlign:'center',textTransform:'uppercase'}}>P&L moy.</th>
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
                  <div style={{background:row.avgPnl>=0?`${C.green}22`:`${C.danger}18`,border:`1px solid ${row.avgPnl>=0?C.green:C.danger}40`,borderRadius:7,padding:'5px 6px',textAlign:'center',fontSize:10,fontWeight:900,fontFamily:'monospace',color:row.avgPnl>=0?C.green:C.danger}}>
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
            <div style={{width:10,height:10,borderRadius:3,background:`${c}40`,border:`1px solid ${c}60`}}/>{l}
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
      <ST icon="💰" color={C.cyan}>Impact Humeur → P&L moyen & Win Rate</ST>
      <ResponsiveContainer width="100%" height={230}>
        <ComposedChart data={data} margin={{top:16,right:20,bottom:0,left:0}}>
          <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" vertical={false}/>
          <XAxis dataKey="mood" tick={{fill:C.t2,fontSize:9,fontWeight:700}} axisLine={false} tickLine={false}
            tickFormatter={(v,i)=>`${data[i]?.emoji} ${v}`}/>
          <YAxis yAxisId="pnl" tick={{fill:C.t3,fontSize:8}} axisLine={false} tickLine={false} tickFormatter={v=>`$${v}`} width={42}/>
          <YAxis yAxisId="wr" orientation="right" domain={[0,100]} tick={{fill:C.t3,fontSize:8}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`} width={32}/>
          <Tooltip contentStyle={{background:C.bgHigh,border:`1px solid ${C.brdHi}`,borderRadius:10,fontSize:10,boxShadow:'0 12px 40px rgba(0,0,0,0.7)'}}
            formatter={(v,n)=>n==='avgPnl'?[<span style={{color:v>=0?C.green:C.danger,fontFamily:'monospace',fontWeight:900}}>{v>=0?'+':''}${v}</span>,'P&L moyen']:[<span style={{color:C.purple,fontFamily:'monospace',fontWeight:900}}>{v}%</span>,'Win Rate']}/>
          <ReferenceLine yAxisId="pnl" y={0} stroke="rgba(255,255,255,0.12)"/>
          <Bar yAxisId="pnl" dataKey="avgPnl" maxBarSize={52} radius={[6,6,0,0]} label={{position:'top',fontSize:8,fontWeight:700,fill:C.t3,formatter:v=>v?`${v>=0?'+':''}$${v}`:''}}>
            {data.map((d,i)=><Cell key={i} fill={d.color} fillOpacity={0.85}/>)}
          </Bar>
          <Line yAxisId="wr" type="monotone" dataKey="winRate" stroke={C.purple} strokeWidth={2.5} name="Win Rate"
            dot={{r:5,fill:C.purple,stroke:'rgba(255,255,255,0.8)',strokeWidth:1.5}} activeDot={{r:7,fill:C.purple}}/>
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
      res.push({icon:'⚠️',color:C.danger,title:'Coût du trading émotionnel',
        desc:`Score < 50 : P&L moy. ${emoAvg>=0?'+':''}$${emoAvg} · WR ${emoWR}%`,
        sub:`Score ≥ 70 : P&L moy. +$${goodAvg} · WR ${goodWR}% — écart de $${goodAvg-emoAvg}/session`,
        badge:`Δ $${goodAvg-emoAvg}`});
    }
    const byMood={};
    sessions.forEach(s=>{if(!byMood[s.mood])byMood[s.mood]={pnl:0,n:0,wins:0};byMood[s.mood].pnl+=(s.pnl||0);byMood[s.mood].n++;if((s.pnl||0)>0)byMood[s.mood].wins++;});
    const best=Object.entries(byMood).sort((a,b)=>(b[1].pnl/b[1].n)-(a[1].pnl/a[1].n))[0];
    if(best){
      const m=MOODS.find(m=>m.id===best[0]);
      const avg=Math.round(best[1].pnl/best[1].n);
      const wr=Math.round(best[1].wins/best[1].n*100);
      res.push({icon:'🎯',color:C.green,title:`Meilleure humeur : ${m?.emoji} ${m?.label||best[0]}`,
        desc:`Moy. ${avg>=0?'+':''}$${avg}/session · WR ${wr}% · ${best[1].n} sessions`,
        sub:'Prioriser le trading dans cet état — impact direct et mesurable',badge:`+$${avg}`});
    }
    const withR=sessions.filter(s=>s.routine),noR=sessions.filter(s=>!s.routine);
    if(withR.length>0&&noR.length>0){
      const rA=Math.round(withR.reduce((s,v)=>s+(v.pnl||0),0)/withR.length);
      const nA=Math.round(noR.reduce((s,v)=>s+(v.pnl||0),0)/noR.length);
      const rWR=Math.round(withR.filter(s=>(s.pnl||0)>0).length/withR.length*100);
      res.push({icon:'📋',color:C.cyan,title:`Routine matinale : +$${rA-nA} d'impact moyen`,
        desc:`Avec routine (${withR.length}×) : moy. ${rA>=0?'+':''}$${rA} · WR ${rWR}%`,
        sub:`Sans routine (${noR.length}×) : moy. ${nA>=0?'+':''}$${nA} — la discipline paie`,badge:rA>nA?'✓ Crucial':'Neutre'});
    }
    const overS=sessions.filter(s=>s.trades>(s.maxTrades||99));
    if(overS.length){
      const oPnl=Math.round(overS.reduce((s,v)=>s+(v.pnl||0),0)/overS.length);
      const nPnl=Math.round(sessions.filter(s=>s.trades<=(s.maxTrades||99)).reduce((s,v)=>s+(v.pnl||0),0)/Math.max(1,sessions.filter(s=>s.trades<=(s.maxTrades||99)).length));
      res.push({icon:'📉',color:C.warn,title:`Overtrade : ${overS.length}/${sessions.length} sessions`,
        desc:`P&L en overtrade : ${oPnl>=0?'+':''}$${oPnl} vs normal : ${nPnl>=0?'+':''}$${nPnl}`,
        sub:`Respecter le max de trades éviterait ~$${nPnl-oPnl} de perte/session`,badge:`${Math.round(overS.length/sessions.length*100)}% des sess.`});
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
      res.push({icon:'🔥',color:C.orange,title:`Meilleure série : ${maxS} sessions gagnantes consécutives`,
        desc:`Score moyen : ${avSc}/100 · P&L total : +$${serP.toLocaleString()}`,
        sub:`Débutée le ${serie[0]?.date?.substring(5)||'—'} — score élevé et séries sont fortement corrélés`,badge:`+${maxS} wins`});
    }
    const axeMeans=AXES7.map(ax=>{
      const mean=Math.round(sessions.reduce((s,v)=>s+(v[ax.key]||0),0)/sessions.length);
      const hi=sessions.filter(s=>(s[ax.key]||0)>=mean),lo=sessions.filter(s=>(s[ax.key]||0)<mean);
      return{...ax,mean,impact:(hi.length?Math.round(hi.reduce((s,v)=>s+(v.pnl||0),0)/hi.length):0)-(lo.length?Math.round(lo.reduce((s,v)=>s+(v.pnl||0),0)/lo.length):0)};
    });
    const weakest=[...axeMeans].sort((a,b)=>a.mean-b.mean)[0];
    const highImpact=[...axeMeans].sort((a,b)=>b.impact-a.impact)[0];
    res.push({icon:'💡',color:C.purple,title:`Axe prioritaire à renforcer : ${weakest?.label}`,
      desc:`Score moyen de ${weakest?.mean}/100 — ${weakest?.desc}`,
      sub:`Plus fort levier P&L : ${highImpact?.label} (+$${highImpact?.impact} d'écart moyen quand élevé)`,badge:`${weakest?.mean}/100`});
    return res;
  },[sessions]);
  return(
    <GlassCard custom={8} glow={C.teal} style={{padding:'24px 22px'}}>
      <ST icon="🔍" color={C.teal}>Behavioral Patterns & Insights</ST>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {insights.map((ins,i)=>(
          <motion.div key={i} initial={{opacity:0,x:14}} animate={{opacity:1,x:0}} transition={{delay:i*0.07}}
            whileHover={{x:3}} style={{display:'flex',gap:14,padding:'14px 16px',borderRadius:14,cursor:'default',
              background:`linear-gradient(135deg,${ins.color}0A,${ins.color}05)`,border:`1px solid ${ins.color}28`,alignItems:'flex-start',
              boxShadow:`0 2px 16px ${ins.color}08`}}>
            <div style={{width:40,height:40,borderRadius:12,background:`${ins.color}18`,border:`1px solid ${ins.color}30`,
              display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0,
              boxShadow:`0 0 14px ${ins.color}25`}}>{ins.icon}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:800,color:ins.color,marginBottom:4}}>{ins.title}</div>
              <div style={{fontSize:10.5,color:C.t2,lineHeight:1.65}}>{ins.desc}</div>
              {ins.sub&&<div style={{fontSize:9.5,color:C.t3,marginTop:4,lineHeight:1.5}}>{ins.sub}</div>}
            </div>
            {ins.badge&&<div style={{padding:'5px 12px',borderRadius:20,background:`${ins.color}18`,border:`1px solid ${ins.color}35`,
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
          <ST icon="📊" color={C.cyan}>P&L Moyen par Tranche de Score</ST>
          <ResponsiveContainer width="100%" height={195}>
            <BarChart data={buckets} margin={{top:22,right:4,bottom:0,left:0}}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" vertical={false}/>
              <XAxis dataKey="range" tick={{fill:C.t2,fontSize:9,fontWeight:600}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:C.t3,fontSize:8}} axisLine={false} tickLine={false} tickFormatter={v=>`$${v}`}/>
              <Tooltip contentStyle={{background:C.bgHigh,border:`1px solid ${C.brdHi}`,borderRadius:10,fontSize:10,boxShadow:'0 12px 40px rgba(0,0,0,0.7)'}}
                formatter={(v,n,{payload:p})=>[<span style={{fontFamily:'monospace',fontWeight:900,color:v>=0?C.green:C.danger}}>{v>=0?'+':''}${v} ({p.count} sess.)</span>,'P&L moyen']}/>
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)"/>
              <Bar dataKey="avgPnl" maxBarSize={48} radius={[6,6,0,0]} label={{position:'top',fill:C.t3,fontSize:8,fontWeight:700,formatter:v=>v?`${v>=0?'+':''}$${v}`:''}}>
                {buckets.map((b,i)=>(<Cell key={i} fill={b.color} fillOpacity={b.count?0.85:0.15}/>))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard custom={5} glow={C.blue} style={{padding:'24px 22px'}}>
          <ST icon="📈" color={C.blue}>Score vs P&L — Vue session par session</ST>
          <ResponsiveContainer width="100%" height={195}>
            <ComposedChart data={[...sessions].sort((a,b)=>a.date.localeCompare(b.date)).map(s=>({score:calcPsych(s),pnl:s.pnl||0,mood:s.mood}))} margin={{top:8,right:8,bottom:0,left:0}}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" vertical={false}/>
              <XAxis dataKey="score" type="number" domain={[20,100]} tick={{fill:C.t3,fontSize:8}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:C.t3,fontSize:8}} axisLine={false} tickLine={false} tickFormatter={v=>`$${v}`}/>
              <Tooltip contentStyle={{background:C.bgHigh,border:`1px solid ${C.brdHi}`,borderRadius:10,fontSize:10,boxShadow:'0 12px 40px rgba(0,0,0,0.7)'}}
                formatter={(v,n,{payload:p})=>[<span style={{fontFamily:'monospace',fontWeight:900,color:v>=0?C.green:C.danger}}>{v>=0?'+':''}${v}</span>,`P&L · score ${p.score}`]}/>
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.12)"/>
              <ReferenceLine x={70} stroke={`${C.green}30`} strokeDasharray="4 3" label={{value:'70',fill:C.green,fontSize:8,position:'top'}}/>
              <ReferenceLine x={50} stroke={`${C.warn}25`} strokeDasharray="4 3" label={{value:'50',fill:C.warn,fontSize:8,position:'top'}}/>
              <Bar dataKey="pnl" maxBarSize={9} radius={[3,3,0,0]}>
                {[...sessions].sort((a,b)=>a.date.localeCompare(b.date)).map((s,i)=><Cell key={i} fill={(s.pnl||0)>=0?C.green:C.danger} fillOpacity={0.75}/>)}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1.5fr',gap:16}}>
        <GlassCard custom={6} glow={C.green} style={{padding:'24px 22px'}}>
          <ST icon="🎯" color={C.green}>Win Rate par Tranche de Score</ST>
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
                    style={{height:'100%',borderRadius:3,background:`linear-gradient(90deg,${b.color}50,${b.color})`,boxShadow:`0 0 6px ${b.color}35`}}/>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard custom={7} glow={C.teal} style={{padding:'24px 22px'}}>
          <ST icon="📋" color={C.teal}>Tableau Récapitulatif Complet</ST>
          <div style={{borderRadius:12,overflow:'hidden',border:`1px solid ${C.brd}`}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 0.7fr 0.9fr 1fr 1fr 0.8fr',padding:'7px 10px',
              background:'rgba(255,255,255,0.05)',borderBottom:`1px solid ${C.brd}`}}>
              {['Score','Sess.','Win Rate','P&L Moy','P&L Total','Trades'].map(h=>(
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
          <div style={{marginTop:12,padding:'10px 14px',borderRadius:11,background:`${C.teal}08`,border:`1px solid ${C.teal}22`}}>
            <div style={{fontSize:10,fontWeight:800,color:C.teal,marginBottom:4}}>💡 Recommandation</div>
            <div style={{fontSize:9.5,color:C.t2,lineHeight:1.7}}>
              {(()=>{
                const best=buckets.filter(b=>b.count>0).sort((a,b)=>b.avgPnl-a.avgPnl)[0];
                const total=buckets.reduce((s,b)=>s+b.count,0);
                const highPct=Math.round(buckets.filter(b=>b.min>=70).reduce((s,b)=>s+b.count,0)/total*100);
                return best?`Les sessions avec score ${best.range} génèrent le meilleur P&L moyen (+$${best.avgPnl}). Actuellement ${highPct}% des sessions atteignent score ≥ 70 — viser 60%+.`:'Accumuler plus de données pour des conclusions fiables.';
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

  // Score badge inline — barre segmentée horizontale compacte
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
          background:`linear-gradient(135deg,${sc}22,${sc}10)`,
          border:`1px solid ${sc}45`,
          fontSize:isLg?15:10,fontWeight:900,fontFamily:'monospace',
          color:sc,
          boxShadow:`0 0 12px ${sc}30`,
          letterSpacing:'-0.5px',
          display:'flex',alignItems:'center',gap:isLg?6:4,
        }}>
          <span style={{fontSize:isLg?14:9}}>{sEmoji(score)}</span>
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
                    boxShadow:`0 0 4px ${z.c}60`,
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
        <ST icon="📓" color={C.teal} mb={0}>Journal des Sessions</ST>
        <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
          {[{k:'all',l:'Toutes'},{k:'high',l:'Score ≥70'},{k:'low',l:'Score <50'},{k:'win',l:'Gains'},{k:'loss',l:'Pertes'}].map(({k,l})=>(
            <motion.button key={k} onClick={()=>setFilter(k)} whileHover={{scale:1.04}} whileTap={{scale:0.96}}
              style={{padding:'5px 10px',borderRadius:8,fontSize:9,fontWeight:700,cursor:'pointer',fontFamily:'inherit',border:'none',
                background:filter===k?`${C.teal}20`:'rgba(255,255,255,0.04)',
                color:filter===k?C.teal:C.t3,
                boxShadow:filter===k?`0 0 0 1px ${C.teal}40`:`0 0 0 1px rgba(255,255,255,0.07)`}}>
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
                  border:`1px solid ${isOpen?sc+'45':C.brd}`}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <div style={{width:38,height:38,borderRadius:10,flexShrink:0,background:`${em?.color||C.t3}14`,border:`1px solid ${em?.color||C.t3}28`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:19}}>{em?.emoji}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:3}}>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <span style={{fontSize:12,fontWeight:700,color:C.t1}}>
                          {new Date(s.date+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short'})}
                        </span>
                        {s.routine&&<span style={{fontSize:8,padding:'1px 6px',borderRadius:4,background:`${C.green}15`,color:C.green,border:`1px solid ${C.green}25`}}>✓ Routine</span>}
                      </div>
                      <div style={{display:'flex',gap:8,alignItems:'center'}}>
                        <span style={{fontSize:9,color:C.t3}}>{s.trades||0}T · {wr}%WR</span>
                        <span style={{fontSize:11,fontWeight:900,fontFamily:'monospace',color:(s.pnl||0)>=0?C.green:C.danger}}>{(s.pnl||0)>=0?'+':''}${s.pnl?.toLocaleString()}</span>
                        <ScoreBadge score={score}/>
                      </div>
                    </div>
                    <div style={{height:3,borderRadius:2,background:'rgba(255,255,255,0.06)',overflow:'hidden'}}>
                      <motion.div initial={{width:0}} animate={{width:`${score}%`}} transition={{duration:0.8,delay:i*0.025}}
                        style={{height:'100%',borderRadius:2,background:`linear-gradient(90deg,${sc}45,${sc})`,boxShadow:`0 0 5px ${sc}35`}}/>
                    </div>
                  </div>
                  <motion.span animate={{rotate:isOpen?180:0}} transition={{duration:0.22}} style={{fontSize:10,color:C.t3,marginLeft:2}}>▾</motion.span>
                </div>
              </motion.div>

              <AnimatePresence>
                {isOpen&&(
                  <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} style={{overflow:'hidden'}}>
                    <div style={{padding:'12px 12px 8px',borderLeft:`2px solid ${sc}22`,marginLeft:4,display:'flex',flexDirection:'column',gap:10}}>
                      {/* ── Score détaillé — version barre segmentée ── */}
                      <div style={{padding:'14px 16px',borderRadius:14,background:`${sc}08`,border:`1px solid ${sc}22`,overflow:'hidden',position:'relative'}}>
                        {/* Orb glow */}
                        <div style={{position:'absolute',top:-20,right:-20,width:100,height:100,borderRadius:'50%',background:`radial-gradient(circle,${sc}25,transparent 70%)`,filter:'blur(20px)',pointerEvents:'none'}}/>
                        <div style={{position:'relative',display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:16}}>
                          {/* Gauche: valeur + label */}
                          <div>
                            <div style={{fontSize:8,color:C.t3,marginBottom:5,textTransform:'uppercase',letterSpacing:'1px',fontWeight:700}}>Score psychologique</div>
                            <div style={{display:'flex',alignItems:'flex-end',gap:6,marginBottom:8}}>
                              <span style={{fontSize:48,fontWeight:900,fontFamily:'monospace',lineHeight:1,color:sc,textShadow:`0 0 32px ${sc}70`,letterSpacing:'-2px'}}>{score}</span>
                              <span style={{fontSize:14,color:C.t3,fontWeight:700,marginBottom:4}}>/100</span>
                            </div>
                            {/* Segmented bar large */}
                            <div style={{display:'flex',gap:3,marginBottom:6}}>
                              {[{max:30,c:C.danger,l:'Critique'},{max:45,c:C.orange,l:'Fragile'},{max:60,c:C.warn,l:'Correct'},{max:75,c:C.cyan,l:'Solide'},{max:100,c:C.green,l:'Elite'}].map((z,i,arr)=>{
                                const prev=i>0?arr[i-1].max:0;
                                const filled=score>prev;
                                const partial=filled&&score<=z.max;
                                const pct=partial?((score-prev)/(z.max-prev))*100:100;
                                return(
                                  <div key={i} style={{flex:1,height:8,borderRadius:3,background:'rgba(255,255,255,0.05)',overflow:'hidden',position:'relative'}}>
                                    {filled&&(
                                      <motion.div initial={{width:0}} animate={{width:partial?`${pct}%`:'100%'}} transition={{duration:0.9,delay:i*0.07}}
                                        style={{position:'absolute',top:0,left:0,height:'100%',background:z.c,borderRadius:3,boxShadow:`0 0 8px ${z.c}50`}}/>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            <div style={{display:'flex',gap:3}}>
                              {[{max:30,c:C.danger,l:'Crit.'},{max:45,c:C.orange,l:'Frag.'},{max:60,c:C.warn,l:'Corr.'},{max:75,c:C.cyan,l:'Solid'},{max:100,c:C.green,l:'Elite'}].map((z,i,arr)=>{
                                const prev=i>0?arr[i-1].max:0;
                                const active=score>prev&&score<=(z.max);
                                return<div key={i} style={{flex:1,fontSize:7,fontWeight:700,color:active?z.c:'rgba(255,255,255,0.2)',textAlign:'center',textTransform:'uppercase',letterSpacing:'0.2px'}}>{z.l}</div>;
                              })}
                            </div>
                          </div>
                          {/* Droite: mini radar */}
                          <svg width={90} height={90} viewBox="0 0 90 90" style={{flexShrink:0}}>
                            {[0.35,0.7,1].map(r=>(
                              <polygon key={r} stroke={r===1?`${sc}35`:'rgba(255,255,255,0.07)'} fill={r===1?`${sc}07`:'none'} strokeWidth={0.7}
                                points={Array.from({length:7},(_,ii)=>{const a=(2*Math.PI*ii/7)-Math.PI/2;return`${45+38*r*Math.cos(a)},${45+38*r*Math.sin(a)}`;}).join(' ')}/>
                            ))}
                            <motion.polygon initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.8}}
                              fill={`${sc}22`} stroke={sc} strokeWidth={1.5}
                              points={AXES7.map((ax,ii)=>{const v=(s[ax.key]||0)/100;const a=(2*Math.PI*ii/7)-Math.PI/2;return`${45+38*v*Math.cos(a)},${45+38*v*Math.sin(a)}`;}).join(' ')}/>
                            {AXES7.map((ax,ii)=>{const v=(s[ax.key]||0)/100;const a=(2*Math.PI*ii/7)-Math.PI/2;const px=45+38*v*Math.cos(a),py=45+38*v*Math.sin(a);return<circle key={ii} cx={px} cy={py} r={2.5} fill={ax.color} stroke="rgba(255,255,255,0.7)" strokeWidth={0.8}/>;} )}
                          </svg>
                        </div>
                        {/* Label niveau */}
                        <div style={{marginTop:8,display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',borderRadius:20,background:`${sc}18`,border:`1px solid ${sc}35`}}>
                          <span style={{fontSize:12}}>{sEmoji(score)}</span>
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
                          {l:'Sommeil',v:`${s.sleep}/10`,c:C.purple},
                          {l:'Énergie', v:`${s.energy}/10`,c:C.cyan},
                          {l:'Trades',  v:`${s.trades||0}`,c:C.t1},
                          {l:'Wins',    v:`${s.wins||0}`,  c:C.green},
                          {l:'Max T.',  v:`${s.maxTrades||'—'}`,c:C.warn},
                          {l:'Max L.',  v:`${s.maxLoss||0}€`,c:C.danger},
                        ].map(({l,v,c})=>(
                          <div key={l} style={{padding:'6px',borderRadius:8,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.05)',textAlign:'center'}}>
                            <div style={{fontSize:7,color:C.t3,marginBottom:2,textTransform:'uppercase',letterSpacing:'0.3px'}}>{l}</div>
                            <div style={{fontSize:12,fontWeight:900,color:c,fontFamily:'monospace'}}>{v}</div>
                          </div>
                        ))}
                      </div>
                      {/* Objectifs + Notes */}
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                        {[{cond:s.objectives,icon:'🎯',label:'Objectifs',val:s.objectives,c:C.cyan},
                          {cond:s.notes,icon:'📝',label:'Notes',val:s.notes,c:C.purple},
                          {cond:s.stressors,icon:'⚠️',label:'Stresseurs',val:s.stressors,c:C.warn},
                        ].filter(x=>x.cond).map(({icon,label,val,c})=>(
                          <div key={label} style={{padding:'9px 12px',borderRadius:9,background:`${c}08`,border:`1px solid ${c}18`}}>
                            <div style={{fontSize:8,color:c,marginBottom:3,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.5px'}}>{icon} {label}</div>
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
const KpiCard=({label,value,sub,color,icon,custom,trend})=>(
  <GlassCard custom={custom} glow={color} style={{padding:'20px 18px',position:'relative'}}>
    <div style={{position:'absolute',top:-20,right:-20,width:90,height:90,borderRadius:'50%',background:`radial-gradient(circle,${color}22,transparent 70%)`,filter:'blur(14px)',pointerEvents:'none'}}/>
    <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${color}45,transparent)`}}/>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
      <span style={{fontSize:7.5,fontWeight:800,color:C.t3,letterSpacing:'1.8px',textTransform:'uppercase'}}>{label}</span>
      <motion.span animate={{scale:[1,1.12,1]}} transition={{duration:3,repeat:Infinity,delay:(custom||0)*0.4}}
        style={{fontSize:18,filter:`drop-shadow(0 0 8px ${color})`}}>{icon}</motion.span>
    </div>
    <div style={{fontSize:26,fontWeight:900,fontFamily:'monospace',color,lineHeight:1,marginBottom:5,textShadow:`0 0 24px ${color}50`}}>{value}</div>
    <div style={{fontSize:9.5,color:C.t2,lineHeight:1.4}}>{sub}</div>
    {trend!==undefined&&(
      <div style={{marginTop:6,fontSize:9,fontWeight:700,color:trend>=0?C.green:C.danger,display:'flex',alignItems:'center',gap:4}}>
        <span>{trend>=0?'↗':'↘'}</span><span>{Math.abs(trend).toFixed(1)}% vs période préc.</span>
      </div>
    )}
    <motion.div animate={{opacity:[0.4,0.8,0.4]}} transition={{duration:2.5,repeat:Infinity,delay:(custom||0)*0.3}}
      style={{position:'absolute',bottom:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${color}50,transparent)`}}/>
  </GlassCard>
);

const TABS=[
  {id:'overview',  label:'Overview',    icon:'📊'},
  {id:'emotions',  label:'Émotions',    icon:'😊'},
  {id:'patterns',  label:'Patterns',    icon:'🔍'},
  {id:'perf',      label:'Performance', icon:'📈'},
  {id:'journal',   label:'Journal',     icon:'📓'},
];

export default function Psychology(){
  const[tab,setTab]=useState('overview');
  const { trades } = useTradingContext();

  // ── Convertir les trades Supabase en sessions Psychology ──────────────
  // Chaque "session" = groupe de trades par jour
  const sessions = useMemo(() => {
    if (!trades || trades.length === 0) return [];

    // Grouper par date
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

        // Score psycho depuis les données disponibles
        // Si les trades ont un psychologyScore, on l'utilise, sinon on le déduit du P&L
        const psychScores = dayTrades.map(t => t.psychologyScore).filter(Boolean);
        const avgPsychScore = psychScores.length > 0
          ? psychScores.reduce((s, v) => s + v, 0) / psychScores.length
          : null;

        // Déduire les axes depuis le P&L et les données disponibles
        const perfScore = pnl > 0 ? Math.min(100, 60 + (wins / dayTrades.length) * 40) : Math.max(20, 60 - Math.abs(pnl) / 50);
        const baseScore = avgPsychScore ?? perfScore;

        // Humeur déduite du P&L et win rate
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
          sleep: 7,  // non disponible dans les trades
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

  // ── État vide si pas de trades ────────────────────────────────────────
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
    // Tendances
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
      <div style={{background:'radial-gradient(ellipse 130% 60% at 50% -10%,rgba(176,110,255,0.10) 0%,#030508 65%)',minHeight:'100vh',fontFamily:"'SF Pro Display','Segoe UI',system-ui,sans-serif",color:C.t1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:40}}>
        <motion.div initial={{scale:0.8,opacity:0}} animate={{scale:1,opacity:1}} transition={{type:'spring',stiffness:120}}>
          <div style={{fontSize:72,marginBottom:20}}>🧠</div>
          <h2 style={{fontSize:28,fontWeight:900,background:C.gradPurple,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',marginBottom:12}}>Psychology Tracker</h2>
          <p style={{fontSize:15,color:C.t2,maxWidth:440,lineHeight:1.7,marginBottom:8}}>
            Aucun trade enregistré pour le moment.
          </p>
          <p style={{fontSize:13,color:C.t3,maxWidth:400,lineHeight:1.7}}>
            Importe ou ajoute tes trades dans <strong style={{color:C.cyan}}>All Trades</strong> — les données psychology apparaîtront automatiquement ici.
          </p>
          <motion.div animate={{opacity:[0.4,0.9,0.4]}} transition={{duration:2.5,repeat:Infinity}} style={{marginTop:28,display:'inline-flex',alignItems:'center',gap:8,padding:'10px 22px',borderRadius:12,background:`${C.purple}14`,border:`1px solid ${C.purple}30`,fontSize:12,color:C.purple,fontWeight:700}}>
            📊 Tes statistiques apparaîtront ici
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return(
    <div style={{background:`radial-gradient(ellipse 130% 60% at 50% -10%,rgba(176,110,255,0.10) 0%,#030508 65%)`,minHeight:'100vh',fontFamily:"'SF Pro Display','Segoe UI',system-ui,sans-serif",color:C.t1,position:'relative'}}>
      {/* Particles */}
      <div style={{position:'fixed',inset:0,pointerEvents:'none',overflow:'hidden',zIndex:0}}>
        {Array.from({length:24}).map((_,i)=>(
          <motion.div key={i} animate={{y:[0,-50,0],x:[0,(i%2?1:-1)*14,0],opacity:[0.04,0.18,0.04]}}
            transition={{duration:7+i*0.38,repeat:Infinity,delay:i*0.58,ease:'easeInOut'}}
            style={{position:'absolute',left:`${(i*14.1)%100}%`,top:`${(i*8.3+10)%100}%`,
              width:i%5===0?3:2,height:i%5===0?3:2,borderRadius:'50%',
              background:[C.purple,C.cyan,C.pink,C.blue,C.teal][i%5]}}/>
        ))}
        <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(255,255,255,0.011) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.011) 1px,transparent 1px)',backgroundSize:'60px 60px'}}/>
      </div>

      <div style={{position:'relative',zIndex:1,padding:'28px 36px 56px'}}>

        {/* ── HEADER ── */}
        <motion.div initial={{opacity:0,y:-18}} animate={{opacity:1,y:0}} transition={{duration:0.5}}
          style={{marginBottom:22,paddingBottom:20,borderBottom:`1px solid ${C.brd}`}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:14}}>
            <div style={{display:'flex',alignItems:'center',gap:14}}>
              <motion.div animate={{rotate:[0,8,-8,0]}} transition={{duration:5,repeat:Infinity,ease:'easeInOut'}}
                style={{width:46,height:46,borderRadius:14,background:C.gradPurple,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,flexShrink:0,boxShadow:`0 4px 24px ${C.purpleGlow}`}}>
                🧠
              </motion.div>
              <div>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
                  <h1 style={{margin:0,fontSize:28,fontWeight:900,background:C.gradPurple,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',letterSpacing:'-1.2px',lineHeight:1}}>
                    Trading Psychology Pro
                  </h1>
                  <span style={{padding:'2px 9px',borderRadius:6,background:`${C.blue}20`,border:`1px solid ${C.blue}40`,fontSize:9,fontWeight:800,color:C.blue,letterSpacing:'0.5px'}}>v3.0</span>
                </div>
                <div style={{fontSize:11,color:C.t3}}>Score composite · 8 dimensions · {sessions.length} sessions analysées</div>
              </div>
            </div>
            {/* Tabs */}
            <div style={{display:'flex',gap:4,padding:'4px',borderRadius:13,background:'rgba(255,255,255,0.03)',border:`1px solid ${C.brd}`}}>
              {TABS.map(t=>(
                <motion.button key={t.id} onClick={()=>setTab(t.id)} whileHover={{scale:1.04}} whileTap={{scale:0.95}}
                  style={{padding:'9px 18px',borderRadius:10,border:'none',cursor:'pointer',fontFamily:'inherit',
                    display:'flex',alignItems:'center',gap:6,fontSize:11,fontWeight:700,transition:'all 0.2s',
                    background:tab===t.id?`linear-gradient(135deg,${C.purple}24,${C.blue}16)`:'transparent',
                    color:tab===t.id?C.purple:C.t3,
                    boxShadow:tab===t.id?`0 0 0 1px ${C.purple}45,0 2px 14px ${C.purple}18`:'none'}}>
                  <span style={{fontSize:13}}>{t.icon}</span>{t.label}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── KPI ROW ── */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
          <KpiCard custom={0} label="Score Actuel"         icon="🧠"
            value={stats.latestScore}
            sub={`${sEmoji(stats.latestScore)} ${sLabel(stats.latestScore)} · Moy. ${stats.avgScore}`}
            color={sColor(stats.latestScore)} trend={stats.scoreTrend}/>
          <KpiCard custom={1} label="Discipline Rate"      icon="📐"
            value={`${stats.disciplineRate}%`}
            sub="Score discipline moyen" color={C.blue}/>
          <KpiCard custom={2} label="Sessions Émotionnelles" icon="😤"
            value={`${stats.emotionalPct}%`}
            sub={`${Math.round(sessions.length*stats.emotionalPct/100)} sessions score < 50`}
            color={C.danger}/>
          <KpiCard custom={3} label="P&L Sessions Optimales" icon="💹"
            value={stats.highPnl>=0?`+$${stats.highPnl.toLocaleString()}`:`-$${Math.abs(stats.highPnl).toLocaleString()}`}
            sub="Sessions avec score ≥ 70" color={C.green}/>
        </div>

        {/* ── CONTENT ── */}
        <AnimatePresence mode="wait">

          {tab==='overview'&&(
            <motion.div key="ov" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.32}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1.55fr',gap:16,marginBottom:16}}>
                <ScoreCard sessions={sessions}/>
                <div style={{display:'flex',flexDirection:'column',gap:16}}>
                  <ProfileRadar sessions={sessions}/>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1.6fr 1fr',gap:16,marginBottom:16}}>
                <ScoreEvolution sessions={sessions}/>
                <Patterns sessions={sessions}/>
              </div>
              <PsychByDay sessions={sessions}/>
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
              <div style={{display:'grid',gridTemplateColumns:'1fr 1.35fr',gap:16,marginBottom:16}}>
                <Patterns sessions={sessions}/>
                <ScoreEvolution sessions={sessions}/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                <PsychByDay sessions={sessions}/>
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