/*
╔══════════════════════════════════════════════════════════════════════════════╗
║  📊 MARKETFLOW — BACKTEST v5.1  ·  Your real EUR/USD data 2023→2025         ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/
import React,{useState,useMemo,useRef}from'react';
import{motion,AnimatePresence}from'framer-motion';
import{AreaChart,Area,BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,Cell,ReferenceLine,ComposedChart,Line}from'recharts';
import { shade } from '../lib/colorAlpha';

const C={
  bg0:'#0F1420',bgCard:'var(--mf-card,#0C1422)',bgHigh:'var(--mf-high,#121C2E)',
  cyan:'var(--mf-accent,#06E6FF)',cyanGlow:'rgba(var(--mf-accent-rgb, 6, 230, 255),0.35)',
  teal:'var(--mf-teal,#00F5D4)',tealGlow:'rgba(var(--mf-teal-rgb, 0, 245, 212),0.3)',
  green:'var(--mf-green,#00FF88)',greenGlow:'rgba(var(--mf-green-rgb, 0, 255, 136),0.35)',
  danger:'var(--mf-danger,#FF3D57)',dangerGlow:'rgba(var(--mf-danger-rgb, 255, 61, 87),0.35)',
  warn:'var(--mf-warn,#FFB31A)',warnGlow:'rgba(var(--mf-warn-rgb, 255, 179, 26),0.35)',
  orange:'var(--mf-orange,#FF6B35)',
  purple:'var(--mf-purple,#A78BFA)',purpleGlow:'rgba(var(--mf-purple-rgb, 176, 110, 255),0.35)',
  blue:'var(--mf-blue,#4D7CFF)',blueGlow:'rgba(var(--mf-blue-rgb, 77, 124, 255),0.3)',
  pink:'var(--mf-pink,#FB7185)',pinkGlow:'rgba(var(--mf-pink-rgb, 255, 77, 196),0.3)',
  gold:'var(--mf-gold,#FFD700)',
  t0:'var(--mf-text-0,#FFFFFF)',t1:'var(--mf-text-1,#E8EEFF)',t2:'var(--mf-text-2,#7A90B8)',t3:'var(--mf-text-3,#334566)',t4:'var(--mf-text-4,#1E2E45)',
  brd:'var(--mf-border,#162034)',brdHi:'var(--mf-border-hi,#1E2E48)',
  gradCyan:'linear-gradient(135deg,var(--mf-accent,#06E6FF),var(--mf-green,#00FF88))',
  gradPurple:'linear-gradient(135deg,var(--mf-purple,#A78BFA),var(--mf-blue,#4D7CFF))',
  gradWarm:'linear-gradient(135deg,var(--mf-warn,#FFB31A),var(--mf-orange,#FF6B35))',
  gradDanger:'linear-gradient(135deg,var(--mf-danger,#FF3D57),var(--mf-orange,#FF6B35))',
};
const fadeUp={hidden:{opacity:0,y:20,scale:0.97},visible:(i=0)=>({opacity:1,y:0,scale:1,transition:{delay:i*0.04,duration:0.5,ease:[0.16,1,0.3,1]}})};
const NOISE='url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")';

const GlassCard=({children,style={},glow=null,hover=true,custom=0,onClick,...p})=>(
  <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={custom}
    whileHover={hover?{y:-2,scale:1.003}:{}} onClick={onClick}
    style={{position:'relative',overflow:'hidden',
      background:'linear-gradient(145deg,rgba(15,24,44,0.93),rgba(10,16,32,0.97))',
      backdropFilter:'blur(20px) saturate(1.4)',borderRadius:20,
      border:`1px solid ${glow ? shade(glow,'28') : C.brd}`,
      boxShadow:`0 4px 40px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.04)${glow ? `,0 0 55px ${shade(glow,'08')}` : ''}`,
      cursor:onClick?'pointer':'default',...style}} {...p}>
    <div style={{position:'absolute',inset:0,opacity:0.022,backgroundImage:NOISE,backgroundSize:'128px',pointerEvents:'none',zIndex:0}}/>
    <div style={{position:'relative',zIndex:1,height:'100%'}}>{children}</div>
  </motion.div>
);

const ST=({children,sub,color=C.cyan,icon,mb=14})=>(
  <div style={{marginBottom:mb}}>
    <div style={{display:'flex',alignItems:'center',gap:8}}>
      {icon&&<span style={{fontSize:14,filter:`drop-shadow(0 0 7px ${color})`}}>{icon}</span>}
      <div style={{width:3,height:15,background:`linear-gradient(180deg,${color},${shade(color,'50')})`,borderRadius:2,flexShrink:0}}/>
      <span style={{fontSize:13,fontWeight:800,color:C.t1,letterSpacing:'-0.3px'}}>{children}</span>
    </div>
    {sub&&<p style={{margin:'3px 0 0',fontSize:9,color:C.t3,paddingLeft:icon?30:11}}>{sub}</p>}
  </div>
);

const RAW=[
["05/01/2024","10h50","Long","BE",0,"1,30%","economic news",5,"Rejection Block","Low","Strong","iFVG","Low","Bearish","Retracement","none","London","January","Friday"],
["10/01/2024","13h05","Short","BE",0,"0,00%","half",5.45,"Orderblock","Low","Strong","iFVG","None","Bearish","Continuation","","New York","January","Wednesday"],
["12/01/2024","10h00","Short","TP",5.4,"5,40%","half",5.4,"Orderblock","High","Strong","iFVG","None","Range","Retracement","","London","January","Friday"],
["17/01/2024","8h35","Long","BE",0,"0%","half",4.7,"FVG","Low","Strong","iFVG","Low","Bearish","Retracement","Price reversal","London","January","Wednesday"],
["18/01/2024","10h55","Long","SL",-1,"-1%","",5,"Orderblock","Low","Strong","iFVG","High","Bearish","Retracement","Bad Analysis","London","January","Thursday"],
["19/01/2024","11h30","Long","BE",0,"0%","half",4.3,"iFVG","Low","Strong","iFVG","None","Bearish","Retracement","Bad Market","London","January","Friday"],
["22/01/2024","08h15","Short","TP",4.9,"4,90%","half",4.9,"FVG","High","Strong","Fibo","High","Bearish","Continuation","","London","January","Monday"],
["23/01/2024","09h00","Short","TP",4.7,"4,70%","half",4.7,"Orderblock","High","Strong","iFVG","High","Bearish","Continuation","","London","January","Tuesday"],
["30/01/2024","9h30","Long","TP",4.6,"4,60%","half",4.6,"Rejection Block","Low","Weak","iFVG","None","Bearish","Retracement","none","London","January","Tuesday"],
["02/02/2024","11h00","Short","TP",17.64,"17,64%","economic news",5.2,"Rejection Block","High","Weak","iFVG","High","Range","Retracement","none","London","February","Friday"],
["07/02/2024","10h50","Short","SL",-1,"-1,00%","",4.8,"FVG","High","Strong","Fibo","High","Bearish","Continuation","","London","February","Wednesday"],
["08/02/2024","09h00","Short","TP",4.9,"4,90%","half",4.9,"Orderblock","High","Strong","FVG","High","Bullish","Retracement","","London","February","Thursday"],
["16/02/2024","9h25","Short","SL",-1,"-1%","",5.4,"FVG","Low","Strong","iFVG","None","Bearish","Continuation","","London","February","Friday"],
["20/02/2024","14h10","Short","SL",-1,"-1,00%","",7.6,"Breaker Block","High","Strong","iFVG","High","Bullish","Retracement","","New York","February","Tuesday"],
["21/02/2024","11h00","Long","TP",3.3,"3,30%","half",3.3,"FVG","Low","Strong","iFVG","None","Bullish","Continuation","","London","February","Wednesday"],
["06/03/2024","12h50","Short","BE",0,"0,00%","economic news",7.5,"Rejection Block","High","Weak","iFVG","High","Bullish","Retracement","none","Out of Session","March","Wednesday"],
["07/03/2024","10h15","Long","BE",0,"0,00%","economic news",4.15,"FVG","Low","Strong","iFVG","None","Bullish","Continuation","","London","March","Thursday"],
["26/03/2024","14h15","Short","TP",3.3,"3,30%","half",3.3,"Orderblock","High","Strong","iFVG","High","Bearish","Retracement","","New York","March","Tuesday"],
["27/03/2024","11h35","Short","BE",1.6,"1,60%","half",6.3,"FVG","High","Strong","iFVG","Low","Bearish","Retracement","","London","March","Wednesday"],
["01/04/2024","10h55","Short","TP",6.9,"6,90%","half",6.9,"Rejection Block","Low","Strong","iFVG","None","Bearish","Continuation","","London","April","Monday"],
["02/04/2024","10h20","Long","TP",6.1,"6,10%","half",6.1,"Orderblock","Low","Strong","iFVG","Low","Bearish","Retracement","","London","April","Tuesday"],
["05/04/2024","13h30","Long","TP",3.5,"3,50%","half",3.5,"iFVG","Low","Strong","iFVG","Low","Bearish","Retracement","","New York","April","Friday"],
["17/04/2024","8h20","Long","TP",7,"7,00%","half",7,"Rejection Block","Low","Strong","FVG","None","Bearish","Retracement","","London","April","Wednesday"],
["24/04/2024","10h15","Long","SL",-1,"-1,00%","",-1,"FVG","Low","Strong","iFVG","None","Bullish","Continuation","","London","April","Wednesday"],
["30/04/2024","10h10","Long","TP",4.85,"4,85%","half",4.85,"Rejection Block","Low","Strong","iFVG","Low","Bullish","Continuation","","London","April","Tuesday"],
["02/05/2024","16h40","Long","TP",7.05,"7,05%","half",7.05,"Orderblock","High","Strong","FVG","None","Range","Continuation","","New York","May","Thursday"],
["17/05/2024","09h30","Short","BE",1,"1,00%","half",7.2,"Orderblock","None","Strong","iFVG","None","Bearish","Continuation","","London","May","Friday"],
["21/05/2024","11h45","Short","TP",5.3,"5,30%","half",5.3,"Orderblock","High","Strong","FVG","None","Bullish","Retracement","","London","May","Tuesday"],
["27/05/2024","13h00","Short","TP",4.3,"4,30%","half",4.3,"Rejection Block","High","Strong","iFVG","High","Bullish","Retracement","","New York","May","Monday"],
["28/05/2024","11h50","Short","SL",-1,"-1,00%","",5.5,"Orderblock","High","Weak","FVG","High","Bullish","Retracement","","London","May","Tuesday"],
["06/06/2024","12h30","Long","SL",-1,"-1,00%","",4,"Orderblock","Low","Strong","iFVG","High","Bullish","Continuation","","Out of Session","June","Thursday"],
["07/06/2024","09h55","Short","BE",0,"0,00%","half",6.9,"Rejection Block","High","Strong","iFVG","None","Bullish","Retracement","","London","June","Friday"],
["11/06/2024","12h15","Long","SL",-1,"-1,00%","",5.45,"Orderblock","High","Strong","iFVG","None","Bearish","Retracement","","Out of Session","June","Tuesday"],
["19/06/2024","11h30","Long","BE",1.9,"1,90%","half",4.4,"FVG","Low","Strong","iFVG","None","Bearish","Retracement","","London","June","Wednesday"],
["10/07/2024","09h00","Short","BE",0,"0,00%","half",6.7,"FVG","High","Strong","FVG","High","Bearish","Continuation","","London","July","Monday"],
["16/07/2024","12h15","Short","SL",-1,"-1,00%","",5.1,"iFVG","Low","Strong","FVG","None","Bullish","Retracement","","Out of Session","July","Tuesday"],
["25/07/2024","09h30","Long","TP",3.2,"3,20%","half",3.2,"Rejection Block","Low","Strong","None","Low","Bearish","Retracement","","London","July","Thursday"],
["08/08/2024","10h05","Short","TP",12.5,"12,50%","half",12.5,"FVG","High","Strong","Fibo","High","Bearish","Continuation","","London","August","Thursday"],
["13/08/2024","08h20","Short","TP",7.9,"7,90%","half",7.9,"Rejection Block","High","Strong","FVG","High","Range","Retracement","","London","August","Tuesday"],
["23/08/2024","11h15","Short","BE",1.8,"1,80%","half",4.3,"iFVG","High","Strong","Fibo","None","Bullish","Retracement","","London","August","Friday"],
["28/08/2024","10h45","Long","SL",-1,"-1,00%","",5.1,"FVG","Low","Strong","iFVG","Low","Bullish","Continuation","","London","August","Wednesday"],
["03/09/2024","9h55","Long","SL",-1,"-1,00%","",4.3,"Orderblock","Low","Strong","FVG","None","Bearish","Retracement","","London","September","Tuesday"],
["04/09/2024","08h00","Short","BE",0,"0,00%","half",4.2,"Orderblock","High","Strong","Fibo","None","Bullish","Retracement","","London","September","Wednesday"],
["11/09/2024","10h10","Short","SL",-1,"-1,00%","",4.9,"Rejection Block","High","Strong","iFVG","High","Bearish","Continuation","","London","September","Wednesday"],
["24/09/2024","12h05","Short","BE",0,"0,00%","half",6.6,"FVG","High","Strong","FVG","None","Bearish","Continuation","","Out of Session","September","Tuesday"],
["25/09/2024","10h00","Short","TP",3.7,"3,70%","half",3.7,"Rejection Block","None","Strong","iFVG","High","Bullish","Retracement","","London","September","Wednesday"],
["10/10/2024","9h50","Long","SL",-1,"-1,00%","",5.75,"Orderblock","Low","Strong","iFVG","Low","Bearish","Retracement","","London","October","Thursday"],
["11/10/2024","10h55","Short","TP",4.5,"4,50%","half",4.5,"Rejection Block","High","Strong","iFVG","None","Bullish","Retracement","","London","October","Friday"],
["14/10/2024","12h10","Short","TP",4.2,"4,20%","half",4.2,"Orderblock","High","Strong","iFVG","Low","Bearish","Continuation","","Out of Session","October","Monday"],
["16/10/2024","9h35","Long","TP",3.7,"3,70%","half",3.7,"FVG","Low","Strong","FVG","Low","Bearish","Retracement","","London","October","Tuesday"],
["29/10/2024","8h55","Long","TP",3.7,"3,70%","half",3.7,"FVG","High","Strong","iFVG","None","Bearish","Retracement","","London","October","Tuesday"],
["31/10/2024","12h50","Short","SL",-1,"-1,00%","",3.2,"Orderblock","High","Strong","iFVG","High","Bullish","Retracement","","Out of Session","October","Thursday"],
["05/11/2024","11h10","Short","SL",-1,"-1,00%","",3.8,"Orderblock","High","Strong","iFVG","None","Bullish","Retracement","","London","November","Tuesday"],
["18/11/2024","13h10","Long","TP",5.6,"5,60%","half",5.6,"Rejection Block","High","Strong","iFVG","None","Bearish","Retracement","","New York","November","Monday"],
["20/11/2024","08h00","Short","TP",7.45,"7,45%","half",7.45,"Orderblock","Low","Strong","FVG","High","Bearish","Continuation","","London","November","Wednesday"],
["22/11/2024","9h30","Short","TP",9.65,"9,65%","reversal",26,"FVG","High","Strong","FVG","None","Bearish","Continuation","","London","November","Friday"],
["25/11/2024","12h20","Short","SL",-1,"-1,00%","",4.65,"FVG","High","Strong","iFVG","High","Bearish","Continuation","","Out of Session","November","Monday"],
["09/12/2024","12h40","Short","TP",3.4,"3,40%","half",3.4,"iFVG","High","Strong","iFVG","High","Bearish","Continuation","","Out of Session","December","Monday"],
["10/12/2024","08h05","Short","TP",4.2,"4,20%","half",4.2,"FVG","High","Strong","iFVG","High","Bearish","Continuation","","London","December","Tuesday"],
["17/12/2024","11h40","Long","TP",2.1,"2,10%","economic news",4.6,"Rejection Block","Low","Weak","iFVG","None","Range","Retracement","","London","December","Tuesday"],
["11/01/2023","9H50","Long","BE",0,"0%","Half",3.1,"Orderblock","None","Strong","iFVG","None","Range","","Price reversal","London","January","Wednesday"],
["12/01/2023","9H05","Long","TP",5,"5,00%","Half",5,"Rejection Block","Low","Strong","iFVG","None","Bullish","Continuation","none","London","January","Thursday"],
["13/01/2023","11H40","Short","BE",2.7,"2.7%","Half",7,"Breaker Block","Low","Strong","iFVG","None","Bullish","Retracement","Price reversal","London","January","Friday"],
["25/01/2023","13h50","Long","TP",6.5,"6,50%","Half",6.5,"Rejection Block","High","Strong","iFVG","High","Bullish","Continuation","none","New York","January","Wednesday"],
["03/02/2023","13h00","Short","SL",-1,"-1,00%","none",6.4,"iFVG","High","Weak","None","None","Bullish","Retracement","none","New York","February","Friday"],
["15/02/2023","09h15","Long","BE",0.4,"0,40%","Half",3.8,"FVG","Low","Strong","iFVG","Low","Bullish","Continuation","Price reversal","London","February","Wednesday"],
["22/02/2023","13h00","Long","TP",7.7,"7,60%","Half",7.7,"Rejection Block","Low","Strong","None","Low","Bullish","Continuation","none","New York","February","Wednesday"],
["24/02/2023","9h45","Long","SL",-1,"-1,00%","none",2.9,"FVG","Low","Strong","FVG","None","Bearish","Retracement","Bad Bias","London","February","Friday"],
["28/02/2023","10h50","Short","SL",-1,"-1,00%","none",5.3,"Rejection Block","High","Strong","iFVG","High","Bearish","Continuation","Price reversal","London","February","Tuesday"],
["15/03/2023","09h00","Short","TP",7.1,"7,10%","half",7.1,"iFVG","None","Strong","iFVG","High","Bullish","Retracement","none","London","March","Wednesday"],
["16/03/2023","09h40","Short","TP",5.2,"5,20%","half",5.2,"FVG","High","Strong","iFVG","None","Bearish","Continuation","none","London","March","Thursday"],
["17/03/2023","09h40","Short","TP",4.4,"4,40%","half",4.4,"FVG","High","Strong","None","High","Bearish","Continuation","none","London","March","Friday"],
["21/03/2023","07h50","Long","TP",4.6,"4,60%","half",4.6,"iFVG","Low","Strong","iFVG","None","Bullish","Continuation","none","London","March","Tuesday"],
["22/03/2023","08h55","Long","TP",5,"5,00%","half",5,"Rejection Block","Low","Strong","FVG","None","Bullish","Continuation","none","London","March","Wednesday"],
["25/04/2023","10h35","Long","SL",-1,"-1,00%","none",-1,"iFVG","Low","Strong","None","None","Bullish","Continuation","Price reversal","London","April","Tuesday"],
["27/04/2023","10h50","Short","TP",4,"4,00%","half",4,"Rejection Block","High","Strong","Fibo","None","Bullish","Retracement","none","London","April","Thursday"],
["05/05/2023","10h45","Long","SL",-1,"-1,00%","none",4.2,"Orderblock","High","Weak","iFVG","None","Bullish","Continuation","Price reversal","London","May","Friday"],
["09/05/2023","11h20","Long","SL",-1,"-1,00%","none",4.2,"Rejection Block","Low","Weak","None","None","Bullish","Continuation","Price reversal","London","May","Tuesday"],
["10/05/2023","09h40","Short","TP",4.4,"4,40%","half",4.4,"Orderblock","High","Strong","None","None","Bearish","Continuation","none","London","May","Wednesday"],
["12/05/2023","11h10","Long","SL",-1,"-1,00%","none",4.5,"Rejection Block","High","Weak","iFVG","Low","Bearish","Retracement","Bad Market","London","May","Friday"],
["16/05/2023","12h35","Short","TP",5.1,"5,10%","half",5.1,"FVG","Low","Strong","iFVG","High","Bearish","Continuation","none","Out of Session","May","Tuesday"],
["17/05/2023","09h10","Short","TP",4.4,"4,40%","half",4.4,"Orderblock","Low","Strong","iFVG","Low","Bearish","Continuation","none","London","May","Wednesday"],
["26/05/2023","09h35","Long","TP",2.6,"2,60%","none",2.6,"FVG","High","Strong","FVG","None","Bearish","Retracement","none","London","May","Friday"],
["30/05/2023","15h15","Short","BE",1.2,"1,20%","none",1.2,"Rejection Block","Low","Weak","iFVG","High","Bearish","Continuation","none","New York","May","Tuesday"],
["06/06/2023","09h10","Short","TP",5.6,"5,60%","half",5.6,"FVG","High","Strong","iFVG","High","Bearish","Continuation","none","London","June","Tuesday"],
["22/06/2023","09h10","Long","TP",3.4,"3,40%","none",3.4,"FVG","Low","Weak","iFVG","None","Bullish","Continuation","none","London","June","Thursday"],
["27/06/2023","11h35","Short","SL",-1,"-1,00%","none",-1,"FVG","High","Strong","iFVG","High","Bearish","Continuation","Bad Bias","London","June","Tuesday"],
["28/06/2023","12h45","Short","TP",5.8,"5,80%","half",5.8,"Orderblock","Low","Strong","None","None","Bullish","Retracement","none","Out of Session","June","Wednesday"],
["11/07/2023","08h55","Short","TP",4.3,"4,30%","half",4.3,"Orderblock","High","Strong","iFVG","High","Bullish","Retracement","none","London","July","Tuesday"],
["21/07/2023","10h55","Long","SL",-1,"-1,00%","none",-1,"Rejection Block","High","Strong","FVG","None","Bullish","Continuation","Bad Market","London","July","Friday"],
["28/07/2023","11h00","Long","TP",6,"6,00%","half",6,"Orderblock","Low","Strong","iFVG","Low","Bearish","Retracement","none","London","July","Friday"],
["01/08/2023","12h15","Long","SL",-1,"-1,00%","none",9.5,"Orderblock","Low","Strong","FVG","Low","Bearish","Retracement","Bad Bias","Out of Session","August","Tuesday"],
["09/08/2023","10h50","Short","BE",0,"0,00%","half",0,"iFVG","High","Strong","FVG","None","Bearish","Continuation","Price reversal","London","August","Wednesday"],
["24/08/2023","10h15","Long","SL",-1,"-1,00%","none",8.9,"Breaker Block","High","Strong","iFVG","High","Bearish","Retracement","Bad Bias","London","August","Thursday"],
["01/09/2023","13h55","Long","TP",6.3,"6,30%","none",6.3,"Breaker Block","Low","Strong","iFVG","Low","Bullish","Continuation","none","New York","September","Friday"],
["07/09/2023","8h40","Short","TP",4.65,"4,65%","economic news",9.3,"FVG","Low","Strong","iFVG","None","Bearish","Continuation","none","London","September","Thursday"],
["14/09/2023","8h15","Short","TP",2.4,"2,40%","pre-news cut",5,"Rejection Block","High","Strong","None","None","Bearish","Continuation","none","London","September","Thursday"],
["10/10/2023","9h45","Long","TP",6.6,"6,60%","half",6.6,"FVG","Low","Strong","iFVG","High","Bullish","Continuation","none","London","October","Tuesday"],
["11/10/2023","11h20","Short","BE",1.3,"1,30%","economic news",4.4,"Orderblock","High","Strong","FVG","High","Bullish","Continuation","none","London","October","Wednesday"],
["18/10/2023","11h00","Short","TP",6.5,"6,50%","half",6.5,"Rejection Block","High","Strong","FVG","None","Bearish","Continuation","none","London","October","Wednesday"],
["19/10/2023","8h35","Long","TP",7,"7,00%","half",7,"Rejection Block","Low","Strong","FVG","None","Bearish","Retracement","none","London","October","Thursday"],
["02/11/2023","9h35","Short","SL",-1,"-1,00%","none",4.1,"FVG","High","Strong","iFVG","High","Range","Continuation","Bad Bias","London","November","Thursday"],
["07/11/2023","11h35","Short","SL",-1,"-1,00%","none",8.3,"FVG","Low","Weak","iFVG","Low","Bullish","Continuation","none","London","November","Tuesday"],
["08/11/2023","13h50","Long","TP",3.2,"3,20%","half",3.2,"FVG","Low","Strong","FVG","Low","Bullish","Continuation","none","New York","November","Wednesday"],
["09/11/2023","13h45","Long","TP",3.6,"3,60%","half",3.6,"FVG","Low","Strong","iFVG","None","Bullish","Continuation","none","New York","November","Thursday"],
["10/11/2023","8h55","Long","BE",0,"0,00%","half",0,"FVG","Low","Strong","None","Low","Bullish","Continuation","none","London","November","Friday"],
["15/11/2023","9h35","Short","BE",0,"0,00%","half",0,"Orderblock","Low","Strong","FVG","None","Bullish","Retracement","none","London","November","Wednesday"],
["01/12/2023","12h40","Long","BE",0,"0,00%","half",0,"Rejection Block","Low","Strong","iFVG","None","Bullish","Continuation","Price reversal","Out of Session","December","Friday"],
["08/12/2023","09h00","Long","SL",-1,"-1,00%","none",6.7,"iFVG","Low","Strong","iFVG","None","Bearish","Retracement","Price reversal","London","December","Friday"],
["13/12/2023","12h25","Long","TP",3.5,"3,50%","half",3.5,"Rejection Block","Low","Strong","FVG","None","Bullish","Continuation","none","Out of Session","December","Wednesday"],
["19/12/2023","10H05","Long","SL",-1,"-1,00%","none",-3.7,"FVG","Low","Strong","iFVG","None","Bullish","Continuation","none","New York","December","Tuesday"],
["21/12/2023","10h45","Long","TP",4.9,"4,90%","half",4.9,"Rejection Block","Low","Strong","FVG","Low","Bullish","Continuation","none","London","December","Thursday"],
["19/01/2023","13h30","Short","BE",0,"0%","half",4.9,"Breaker Block","High","Strong","iFVG","None","Bullish","Retracement","Bad Market","New York","January","Thursday"],
["20/01/2023","10h55","Long","BE",0,"0,00%","half",3.1,"Orderblock","Low","Strong","FVG","High","Bullish","Continuation","Bad Market","London","January","Friday"],
["16/02/2023","12h00","Long","SL",-1,"-1,00%","none",4.7,"iFVG","High","Strong","iFVG","None","Range","Retracement","Bad Market","New York","February","Thursday"],
["17/02/2023","14h05","Long","TP",6,"6,00%","half",6,"FVG","Low","Strong","iFVG","Low","Range","Retracement","","New York","February","Friday"],
["14/03/2023","10h10","Long","TP",6,"6,00%","half",6,"Rejection Block","Low","Strong","iFVG","Low","Bullish","Continuation","","London","March","Tuesday"],
["12/04/2023","09h05","Short","BE",0,"0,00%","half",3.8,"Orderblock","High","Strong","iFVG","High","Bullish","Retracement","","London","April","Wednesday"],
["21/04/2023","12h00","Long","TP",4,"4,00%","half",4,"Rejection Block","Low","Strong","FVG","None","Bullish","Continuation","","Out of Session","April","Friday"],
["21/06/2023","10h00","Long","BE",0,"0,00%","half",4.55,"Rejection Block","Low","Strong","iFVG","None","Bullish","Continuation","","London","June","Wednesday"],
["05/07/2023","08h25","Long","TP",4.1,"4,10%","half",4.1,"Orderblock","Low","Strong","FVG","Low","Bearish","Retracement","","London","July","Tuesday"],
["16/01/2025","15h30","Long","TP",3.1,"3,10%","half",3.1,"Rejection Block","Low","Strong","iFVG","None","Bullish","Continuation","","New York","January","Thursday"],
["23/01/2025","12h30","Short","BE",0,"0,00%","half",3.4,"Orderblock","High","Strong","iFVG","None","Bullish","Retracement","","Out of Session","January","Thursday"],
["27/01/2025","14h30","Short","TP",4.2,"4,20%","half",4.2,"Rejection Block","High","Strong","FVG","High","Bullish","Retracement","","New York","January","Monday"],
["28/01/2025","14h55","Long","BE",0,"0%","half",4.45,"Orderblock","Low","Strong","iFVG","Low","Bullish","Continuation","","New York","January","Tuesday"],
["30/01/2025","13h40","Long","TP",4.6,"5%","",4.6,"Rejection Block","Low","Strong","iFVG","None","Bullish","Continuation","","New York","January","Thursday"],
["11/02/2025","10h30","Short","SL",-1,"-1%","half",4.05,"Orderblock","High","Strong","iFVG","None","Bearish","Continuation","","London","February","Tuesday"],
["13/02/2025","08h00","Short","TP",12.3,"12,30%","half",12.3,"Rejection Block","High","Strong","iFVG","High","Bullish","Retracement","","London","February","Thursday"],
["20/02/2025","13h05","Short","SL",-1,"-1,00%","",4.2,"FVG","High","Strong","FVG","None","Bullish","Retracement","","New York","February","Thursday"],
["25/02/2025","09h30","Long","TP",4.9,"4,90%","half",4.9,"Rejection Block","Low","Strong","iFVG","None","Bullish","Continuation","","London","February","Tuesday"],
["27/02/2025","13h35","Short","BE",0.4,"0,40%","economic news",5.4,"Orderblock","Low","Strong","iFVG","Low","Bullish","Continuation","","New York","February","Thursday"],
["13/03/2025","10H55","Short","TP",4.75,"4,75%","half",4.75,"Orderblock","Low","Strong","Fibo","Low","Bullish","Retracement","","London","March","Thursday"],
["18/03/2025","14h40","Long","BE",3.35,"3,35%","half",3.35,"Rejection Block","Low","Strong","iFVG","High","Bullish","Continuation","","New York","March","Tuesday"],
["20/03/2025","15h45","Long","TP",3.7,"4%","half",3.7,"Rejection Block","Low","Strong","iFVG","Low","Bullish","Continuation","","New York","March","Thursday"],
["21/03/2025","9h25","Long","TP",7.7,"7,70%","half",7.7,"Rejection Block","Low","Strong","iFVG","None","Bullish","Continuation","","London","March","Friday"],
["24/03/2025","11h30","Short","TP",8.6,"8,60%","half",8.6,"Rejection Block","High","Strong","iFVG","None","Bearish","Continuation","","London","March","Monday"],
["25/03/2025","09h45","Long","TP",4.3,"4,30%","half",4.3,"Rejection Block","Low","Strong","iFVG","Low","Bearish","Retracement","","London","March","Tuesday"],
["26/03/2025","12h35","Short","TP",4.7,"4,70%","half",4.7,"iFVG","High","Strong","iFVG","None","Bearish","Continuation","","Out of Session","March","Wednesday"],
["27/03/2025","10h35","Long","TP",4.3,"4,30%","half",4.3,"Orderblock","Low","Strong","iFVG","Low","Bearish","Retracement","","London","March","Thursday"],
["02/04/2025","12h35","Long","TP",5.7,"5,70%","half",5.7,"Rejection Block","Low","Strong","iFVG","None","Bearish","Retracement","","Out of Session","April","Wednesday"],
["08/04/2025","16h00","Long","SL",-1,"-1,00%","",-1,"Orderblock","High","Weak","iFVG","None","Bullish","Continuation","","New York","April","Tuesday"],
["09/04/2025","11H00","Long","TP",8.9,"8,90%","half",8.9,"FVG","Low","Strong","iFVG","High","Bullish","Continuation","","London","April","Wednesday"],
["10/04/2025","09h30","Short","SL",-1,"-1,00%","",3.2,"FVG","High","Strong","iFVG","None","Bullish","Retracement","","London","April","Thursday"],
["17/04/2025","08h25","Short","BE",0,"0,00%","half",7.6,"Rejection Block","Low","Strong","iFVG","None","Bullish","Continuation","","London","April","Thursday"],
["06/05/2025","10h35","Short","BE",0,"0,00%","half",6.4,"Orderblock","High","Strong","iFVG","None","Range","Continuation","","London","May","Tuesday"],
["07/05/2025","10h35","Short","BE",0,"0,00%","half",5.2,"Rejection Block","High","Weak","iFVG","None","Range","Retracement","","London","May","Wednesday"],
["08/05/2025","16h05","Short","TP",6.2,"6,20%","half",6.2,"iFVG","Low","Strong","Fibo","None","Bearish","Continuation","","New York","May","Thursday"],
["09/05/2025","13h10","Short","SL",-1,"-1,00%","",6,"FVG","High","Strong","iFVG","None","Bearish","Continuation","","New York","May","Friday"],
["16/05/2025","09h10","Short","TP",5.8,"5,80%","half",5.8,"Rejection Block","High","Strong","iFVG","None","Bearish","Continuation","","London","May","Friday"],
["05/06/2025","13h00","Short","BE",0.4,"0,40%","economic news",5.8,"Orderblock","Low","Strong","iFVG","High","Bullish","Retracement","","New York","June","Thursday"],
["17/06/2025","15h15","Short","TP",7.4,"7,40%","half",7.4,"FVG","High","Strong","iFVG","None","Bullish","Retracement","","New York","June","Tuesday"],
["23/06/2025","09h00","Short","TP",6.1,"6,10%","half",6.1,"Orderblock","High","Strong","iFVG","None","Bearish","Continuation","","London","June","Monday"],
["01/09/2025","10h45","Short","SL",-1,"-1,00%","",4.35,"Rejection Block","High","Weak","iFVG","High","Range","Continuation","","London","September","Monday"],
["12/09/2025","15h30","Long","TP",4,"4,00%","half",4,"FVG","High","Strong","FVG","High","Bullish","Continuation","","New York","September","Friday"],
["23/09/2025","12h15","Short","BE",0.9,"0,90%","half",4.2,"Rejection Block","Low","Strong","iFVG","High","Bullish","Retracement","","Out of Session","September","Tuesday"],
["24/09/2025","08h00","Short","TP",7.6,"7,60%","half",7.6,"Orderblock","Low","Strong","iFVG","None","Bullish","Retracement","","London","September","Wednesday"],
["25/09/2025","14h00","Short","TP",4.5,"4,50%","economic news",4.5,"FVG","Low","Strong","iFVG","None","Bearish","Continuation","","London","September","Thursday"],
["15/10/2025","11h35","Short","BE",1,"1,00%","half",5.3,"Orderblock","High","Strong","FVG","High","Bearish","Retracement","","London","October","Wednesday"],
["29/10/2025","13h05","Short","BE",0,"0,00%","half",4.6,"FVG","Low","Strong","FVG","Low","Bearish","Continuation","","New York","October","Wednesday"],
["05/11/2025","14h30","Short","TP",-1,"-1,00%","",4,"FVG","Low","Strong","FVG","None","Bearish","Retracement","","New York","November","Wednesday"],
["14/11/2025","14h35","Short","TP",6.6,"6,60%","half",6.6,"Rejection Block","High","Strong","FVG","None","Bullish","Retracement","","New York","November","Friday"],
["26/11/2025","08h05","Short","TP",5.6,"5,60%","half",5.6,"Rejection Block","High","Strong","iFVG","High","Bearish","Continuation","","London","November","Wednesday"],
["03/12/2025","11h05","Short","SL",-1,"-1,00%","",6.1,"Rejection Block","High","Strong","FVG","High","Bullish","Retracement","","London","December","Wednesday"],
["04/12/2025","12h30","Short","TP",4.4,"4,40%","half",4.4,"FVG","High","Strong","iFVG","High","Bullish","Retracement","","Out of Session","December","Thursday"],
["16/12/2025","10h40","Short","SL",-1,"-1,00%","",3.4,"Rejection Block","High","Strong","iFVG","None","Bullish","Retracement","","London","December","Tuesday"],
];

function toISO(s){const m=s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);return m?`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`:'';};
const MOIS_IDX={January:0,February:1,March:2,April:3,May:4,June:5,July:6,August:7,September:8,October:9,November:10,December:11};

const TRADES=RAW.map((r,i)=>{
  const[date_fr,heure,pos,res,rr,,be_from,rr_target,key_level,prise_asian,turtle_soup,retrac_cisd,prev_daily,tendance,contexte,raison,session,mois_str,jour_str]=r;
  const dateISO=toISO(date_fr);
  const annee=date_fr.split('/')[2]||'';
  const moisIdx=MOIS_IDX[mois_str]??0;
  const isWin=res==='TP';const isLoss=res==='SL';const isBE=res==='BE';
  const hInt=parseInt(String(heure||'').replace(/[hH].*/,''))||0;
  const session_calc=session||'London';
  return{id:i+1,date_fr,dateISO,heure,hInt,pos,res,rr:typeof rr==='number'?rr:0,
    be_from:String(be_from||''),rr_target,key_level,prise_asian,turtle_soup,retrac_cisd,prev_daily,
    tendance,contexte,raison:String(raison||''),session:session_calc,mois_str,moisIdx,jour_str,annee,
    isWin,isLoss,isBE};
}).filter(t=>t.dateISO).sort((a,b)=>a.dateISO>b.dateISO?1:-1).map((t,i)=>({...t,id:i+1}));

function calcGlobal(trades){
  if(!trades.length)return null;
  const n=trades.length;
  const wins=trades.filter(t=>t.isWin);
  const losses=trades.filter(t=>t.isLoss);
  const bes=trades.filter(t=>t.isBE);
  const totalRR=parseFloat(trades.reduce((s,t)=>s+t.rr,0).toFixed(2));
  const grossW=wins.reduce((s,t)=>s+t.rr,0);
  const grossL=Math.abs(losses.reduce((s,t)=>s+t.rr,0));
  const pf=grossL>0?parseFloat((grossW/grossL).toFixed(2)):9.99;
  const avgRR=parseFloat((totalRR/n).toFixed(2));
  const avgWin=wins.length?parseFloat((grossW/wins.length).toFixed(2)):0;
  const avgLoss=losses.length?parseFloat((grossL/losses.length).toFixed(2)):1;
  const wr=Math.round(wins.length/n*100);
  const beRate=Math.round(bes.length/n*100);
  let peak=0,maxDD=0,bal=0;
  const equity=trades.map((t,i)=>{bal+=t.rr;if(bal>peak)peak=bal;const dd=peak-bal;if(dd>maxDD)maxDD=dd;return{i:i+1,v:parseFloat(bal.toFixed(2)),rr:t.rr,res:t.res,date:t.dateISO};});
  const ddSeries=equity.map((e,i)=>{let p2=0;for(let j=0;j<=i;j++)if(equity[j].v>p2)p2=equity[j].v;return{i:e.i,v:parseFloat((Math.min(0,e.v-p2)).toFixed(2))};});
  let cW=0,cL=0,mW=0,mL=0;
  trades.forEach(t=>{if(t.isWin){cW++;cL=0;if(cW>mW)mW=cW;}else if(t.isLoss){cL++;cW=0;if(cL>mL)mL=cL;}else{cW=0;cL=0;}});
  const exp=parseFloat(((wins.length/n)*avgWin-(losses.length/n)*avgLoss).toFixed(2));
  const kelly=avgLoss?parseFloat(((wins.length/n-(losses.length/n)/Math.max(0.01,avgWin/avgLoss))*100).toFixed(1)):0;
  const rets=trades.map(t=>t.rr);const mean=totalRR/n;
  const std=Math.sqrt(rets.reduce((s,v)=>s+(v-mean)**2,0)/n)||0.001;
  const sharpe=parseFloat(((mean/std)*Math.sqrt(252)).toFixed(2));
  const dates=trades.map(t=>t.dateISO).sort();
  const yrs=Math.max(0.1,parseFloat(((new Date(dates[dates.length-1])-new Date(dates[0]))/(365.25*86400000)).toFixed(1)));
  return{n,wins:wins.length,losses:losses.length,bes:bes.length,totalRR,grossW:parseFloat(grossW.toFixed(2)),grossL:parseFloat(grossL.toFixed(2)),pf,avgRR,avgWin,avgLoss,wr,beRate,equity,ddSeries,maxDD:parseFloat(maxDD.toFixed(2)),mW,mL,exp,kelly,sharpe,yrs};
}

function byKey(trades,keyFn,labels){
  const m={};
  labels.forEach(l=>{m[l]={label:l,n:0,wins:0,losses:0,bes:0,totalRR:0};});
  trades.forEach(t=>{const k=String(keyFn(t)||'');if(!k||k==='null'||k==='undefined'||k==='')return;if(!m[k])m[k]={label:k,n:0,wins:0,losses:0,bes:0,totalRR:0};m[k].n++;m[k].totalRR+=t.rr;if(t.isWin)m[k].wins++;else if(t.isLoss)m[k].losses++;else m[k].bes++;});
  return labels.map(l=>{const d=m[l];return{...d,wr:d.n?Math.round(d.wins/d.n*100):0,avgRR:d.n?parseFloat((d.totalRR/d.n).toFixed(2)):0,totalRR:parseFloat((d.totalRR||0).toFixed(2)),pf:d.losses>0?parseFloat((d.wins/d.losses).toFixed(2)):d.wins>0?9.99:0};});
}
function byKeyDir(trades,keyFn,labels){return{Long:byKey(trades.filter(t=>t.pos==='Long'),keyFn,labels),Short:byKey(trades.filter(t=>t.pos==='Short'),keyFn,labels)};}

const DIRS=['Long','Short'];
const SESSIONS=['London','New York','Out of Session'];
const JOURS=['Monday','Tuesday','Wednesday','Thursday','Friday'];
const MOIS=['January','February','March','April','May','June','July','August','September','October','November','December'];
const ANNEES=['2023','2024','2025'];
const RESULTATS=['TP','BE','SL'];
const KEY_LEVELS=['Orderblock','FVG','iFVG','Breaker Block','Rejection Block'];
const ASIAN_OPTS=['High','Low','None'];
const TS_OPTS=['Strong','Weak','None'];
const RETR_OPTS=['iFVG','Fibo','FVG','None'];
const PD_OPTS=['High','Low','None'];
const TENDANCE_OPTS=['Bullish','Bearish','Range'];
const CONTEXTE_OPTS=['Continuation','Retracement'];

const COL_MAP_XL={date_fr:['date','Date','DATE','jour','Jour'],heure:['heure','Heure','time','Time','horaire'],pos:['position','Position','pos','direction','Direction','Long/Short','sens','side'],res:['résultat','Résultat','resultat','result','Result','outcome','RES','res'],rr:['r/r','R/R','rr','RR','R:R','ratio','r_r','Ratio'],perf:['performances','Performances','perf','%','pct','rendement'],be_from:['be a partir de','Be a partir de','be from','BE from','be_from'],rr_target:['rr target','RR Target','rr_target','target'],key_level:['key-level','key level','KeyLevel','Key-Level','confirmation','structure','conf'],prise_asian:['prise asian','Prise Asian','asian','Asian','prise_asian'],turtle_soup:['turtle soup','Turtle Soup','turtle_soup','TS','ts','rejet'],retrac_cisd:['retracement après cisd','Retracement après CISD','retrac cisd','cisd','CISD'],prev_daily:['previous daily','Previous Daily','prev_daily','PDH','PDL'],tendance:['tendance de fond','Tendance de Fond','tendance','Trend'],contexte:['contexte','Contexte','context'],raison:['raison','Raison','reason','notes','Notes'],session:['sessions','Sessions','session','Session'],mois_str:['mois','Mois','month','Month'],jour_str:['jour','Jour','day','Day','weekday']};
function fuzz(a,b){a=a.toLowerCase().replace(/[\s_\-\.]/g,'');b=b.toLowerCase().replace(/[\s_\-\.]/g,'');if(a===b)return 1;if(a.includes(b)||b.includes(a))return 0.8;let c=0;for(let i=0;i<Math.min(a.length,b.length);i++)if(a[i]===b[i])c++;return c/Math.max(a.length,b.length);}
function detectCol(headers,aliases){let best={idx:-1,score:0};headers.forEach((h,i)=>{const hs=String(h||'');aliases.forEach(a=>{const s=fuzz(hs,a);if(s>best.score)best={idx:i,score:s};});});return best.score>=0.6?best.idx:-1;}
function parseXL(buf){const XLSX=window.XLSX;const wb=XLSX.read(buf,{type:'array',cellDates:false});const ws=wb.Sheets[wb.SheetNames[0]];const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:true});let hr=0;for(let i=0;i<Math.min(8,rows.length);i++){if(rows[i].filter(c=>c!==''&&c!=null).length>=4){hr=i;break;}}const headers=rows[hr].map(h=>String(h||''));const cm={};Object.entries(COL_MAP_XL).forEach(([f,a])=>{cm[f]=detectCol(headers,a);});const g=(row,f)=>cm[f]>=0?row[cm[f]]:'';function pDate(v){if(!v&&v!==0)return'';if(typeof v==='number'){try{const d=XLSX.SSF.parse_date_code(v);if(d)return`${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;}catch(e){}}const s=String(v).trim();const fr=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);if(fr)return`${fr[3]}-${fr[2].padStart(2,'0')}-${fr[1].padStart(2,'0')}`;return s.substring(0,10);}function pRR(v){return parseFloat(String(v||'').replace(',','.').replace(/[^0-9.\-]/g,''))||0;}function nPos(v){const s=String(v||'').trim().toLowerCase();return s==='long'||s==='l'||s==='buy'?'Long':s==='short'||s==='s'||s==='sell'?'Short':String(v||'');}function nRes(v){const s=String(v||'').trim().toUpperCase();return s==='TP'||s==='WIN'||s==='W'?'TP':s==='SL'||s==='LOSS'||s==='L'?'SL':s==='BE'||s==='BREAKEVEN'?'BE':String(v||'');}function nSess(v){const s=String(v||'').toLowerCase();return s.includes('london')||s.includes('lon')||s.includes('uk')?'London':s.includes('new-york')||s.includes('ny')||s.includes('nyc')?'New York':'Out of Session';}const MOIS_FULL=['January','February','March','April','May','June','July','August','September','October','November','December'];const JOURS_FULL=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];const trades=rows.slice(hr+1).filter(r=>r.some(c=>c!==''&&c!=null)).map((row,i)=>{const dateISO=pDate(g(row,'date_fr'));if(!dateISO)return null;const pos=nPos(g(row,'pos'));const res=nRes(g(row,'res'));const rr=pRR(g(row,'rr'));const dateObj=new Date(dateISO+'T12:00:00');const moisStr=MOIS_FULL[dateObj.getMonth()]||'';const jourStr=JOURS_FULL[dateObj.getDay()]||'';const annee=String(dateObj.getFullYear());const session=nSess(g(row,'session'));const key_level=String(g(row,'key_level')||'');const prise_asian=String(g(row,'prise_asian')||'');const turtle_soup=String(g(row,'turtle_soup')||'');const retrac_cisd=String(g(row,'retrac_cisd')||'');const prev_daily=String(g(row,'prev_daily')||'');const tendance=String(g(row,'tendance')||'');const contexte=String(g(row,'contexte')||'');const raison=String(g(row,'raison')||'');const be_from=String(g(row,'be_from')||'');const rr_target=String(g(row,'rr_target')||'');const heure=String(g(row,'heure')||'');const hInt=parseInt(String(heure).replace(/[hH].*/,''))||0;return{id:i+1,date_fr:String(row[cm.date_fr]||''),dateISO,heure,hInt,pos,res,rr,be_from,rr_target,key_level,prise_asian,turtle_soup,retrac_cisd,prev_daily,tendance,contexte,raison,session,mois_str:moisStr,jour_str:jourStr,annee,isWin:res==='TP',isLoss:res==='SL',isBE:res==='BE'};}).filter(Boolean).map((t,i)=>({...t,id:i+1}));return trades;}

const KpiCard=({label,value,sub,color,icon,custom})=>(
  <GlassCard custom={custom} glow={color} style={{padding:'16px 15px',position:'relative',overflow:'hidden',minHeight:88}}>
    <div style={{position:'absolute',top:-18,right:-18,width:70,height:70,borderRadius:'50%',background:`radial-gradient(circle,${shade(color,'22')},transparent 70%)`,filter:'blur(12px)',pointerEvents:'none'}}/>
    <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${shade(color,'60')},transparent)`}}/>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:7}}>
      <span style={{fontSize:7.5,fontWeight:800,color:C.t3,letterSpacing:'1.4px',textTransform:'uppercase'}}>{label}</span>
      <motion.span animate={{scale:[1,1.12,1]}} transition={{duration:3.5,repeat:Infinity,delay:(custom||0)*0.2}} style={{fontSize:16,filter:`drop-shadow(0 0 6px ${color})`}}>{icon}</motion.span>
    </div>
    <div style={{fontSize:24,fontWeight:900,fontFamily:'monospace',color,lineHeight:1,marginBottom:3,textShadow:`0 0 20px ${shade(color,'40')}`}}>{value}</div>
    {sub&&<div style={{fontSize:8.5,color:C.t2,lineHeight:1.5}}>{sub}</div>}
    <motion.div animate={{opacity:[0.3,0.8,0.3]}} transition={{duration:2.5,repeat:Infinity,delay:(custom||0)*0.15}} style={{position:'absolute',bottom:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${shade(color,'60')},transparent)`}}/>
  </GlassCard>
);

const EquityChart=({data})=>{
  const last=data[data.length-1]?.v||0;const col=last>=0?C.green:C.danger;
  return(
    <GlassCard hover={false} glow={col} style={{padding:'22px 20px'}}>
      <ST icon="📈" color={col} mb={10}>Equity Curve (in R) · {last>=0?'+':''}{last}R total</ST>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{top:6,right:6,bottom:0,left:0}}>
          <defs>
            <linearGradient id="eqg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={col} stopOpacity={0.4}/><stop offset="100%" stopColor={col} stopOpacity={0.02}/></linearGradient>
            <linearGradient id="eql" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={C.cyan}/><stop offset="50%" stopColor={C.green}/><stop offset="100%" stopColor={C.purple}/></linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="4 4" vertical={false}/>
          <XAxis dataKey="i" tick={{fill:C.t3,fontSize:7}} axisLine={false} tickLine={false} interval={Math.floor(data.length/8)}/>
          <YAxis tick={{fill:C.t3,fontSize:7}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}R`} width={34}/>
          <Tooltip contentStyle={{background:C.bgHigh,border:`1px solid ${C.brdHi}`,borderRadius:10,fontSize:10,boxShadow:'0 8px 28px rgba(0,0,0,0.8)'}}
            formatter={(v,_,p)=>[<span style={{color:p.payload.rr>=0?C.green:C.danger,fontFamily:'monospace',fontWeight:900}}>{v}R</span>,'Equity']}
            labelFormatter={(_,p)=>`Trade #${p?.[0]?.payload?.i} · ${p?.[0]?.payload?.date||''} · ${p?.[0]?.payload?.res||''}`}/>
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 3"/>
          <Area type="monotone" dataKey="v" stroke="url(#eql)" strokeWidth={2.5} fill="url(#eqg)" dot={false} activeDot={{r:5,fill:C.green,stroke:'#fff',strokeWidth:2}}/>
        </AreaChart>
      </ResponsiveContainer>
    </GlassCard>
  );
};

const DDChart=({data})=>(
  <GlassCard hover={false} glow={C.danger} style={{padding:'22px 20px'}}>
    <ST icon="📉" color={C.danger} mb={10}>Drawdown (in R)</ST>
    <ResponsiveContainer width="100%" height={138}>
      <AreaChart data={data} margin={{top:4,right:6,bottom:0,left:0}}>
        <defs><linearGradient id="ddg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.danger} stopOpacity={0.55}/><stop offset="100%" stopColor={C.danger} stopOpacity={0.03}/></linearGradient></defs>
        <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="4 4" vertical={false}/>
        <XAxis dataKey="i" tick={{fill:C.t3,fontSize:7}} axisLine={false} tickLine={false} interval={Math.floor(data.length/7)}/>
        <YAxis tick={{fill:C.t3,fontSize:7}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}R`} width={34}/>
        <Tooltip contentStyle={{background:C.bgHigh,border:`1px solid ${C.brdHi}`,borderRadius:10,fontSize:10}} formatter={v=>[<span style={{color:C.danger,fontFamily:'monospace',fontWeight:900}}>{v}R</span>,'DD']}/>
        <Area type="monotone" dataKey="v" stroke={C.danger} strokeWidth={1.5} fill="url(#ddg)" dot={false}/>
      </AreaChart>
    </ResponsiveContainer>
  </GlassCard>
);

const RRDist=({trades})=>{
  const buckets={};trades.forEach(t=>{const b=Math.round(t.rr);if(!buckets[b])buckets[b]=0;buckets[b]++;});
  const data=Object.entries(buckets).sort((a,b)=>Number(a[0])-Number(b[0])).map(([k,v])=>({rr:Number(k),n:v}));
  return(
    <GlassCard hover={false} glow={C.purple} style={{padding:'22px 20px'}}>
      <ST icon="📊" color={C.purple} mb={10}>R/R Distribution</ST>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{top:4,right:6,bottom:0,left:0}}>
          <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="4 4" vertical={false}/>
          <XAxis dataKey="rr" tick={{fill:C.t3,fontSize:7}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}R`}/>
          <YAxis tick={{fill:C.t3,fontSize:7}} axisLine={false} tickLine={false} width={24}/>
          <Tooltip contentStyle={{background:C.bgHigh,border:`1px solid ${C.brdHi}`,borderRadius:10,fontSize:10}} formatter={(v,_,p)=>[v,'Trades']} labelFormatter={v=>`${v}R`}/>
          <Bar dataKey="n" radius={[4,4,0,0]}>{data.map((d,i)=><Cell key={i} fill={d.rr>=0?C.green:C.danger}/>)}</Bar>
        </BarChart>
      </ResponsiveContainer>
    </GlassCard>
  );
};

const ConfCard=({title,icon,color,data,custom=0})=>{
  const[sort,setSort]=useState('wr');
  const sorted=[...data].sort((a,b)=>sort==='wr'?(b.wr-a.wr):sort==='avgRR'?(b.avgRR-a.avgRR):sort==='totalRR'?(b.totalRR-a.totalRR):sort==='pf'?(b.pf-a.pf):(b.n-a.n));
  const maxN=Math.max(...data.map(d=>d.n),1);
  return(
    <GlassCard custom={custom} glow={color} hover={false} style={{padding:'18px 16px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
        <ST icon={icon} color={color} mb={0}>{title}</ST>
        <div style={{display:'flex',gap:3}}>
          {[{v:'wr',l:'WR'},{v:'avgRR',l:'R:R'},{v:'totalRR',l:'Tot'},{v:'pf',l:'PF'},{v:'n',l:'#'}].map(({v,l})=>(
            <button key={v} onClick={()=>setSort(v)} style={{padding:'2px 6px',borderRadius:5,border:`1px solid ${sort===v?color:C.brd}`,background:sort===v?`${shade(color,'18')}`:'transparent',color:sort===v?color:C.t3,fontSize:7.5,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>{l}</button>
          ))}
        </div>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:4}}>
        {sorted.map((d,i)=>{
          const wrc=d.wr>=60?C.green:d.wr>=45?C.warn:d.n?C.danger:C.t4;
          const rrc=d.avgRR>=1?C.green:d.avgRR>=0?C.warn:C.danger;
          const trc=d.totalRR>=0?C.green:C.danger;
          const pfc=d.pf>=1.5?C.green:d.pf>=1?C.warn:d.pf>0?C.danger:C.t4;
          return(
            <div key={d.label} style={{padding:'8px 10px',borderRadius:9,background:i%2===0?'rgba(255,255,255,0.026)':'rgba(255,255,255,0.013)',border:'1px solid rgba(255,255,255,0.04)',opacity:d.n?1:0.3}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:d.n?3:0}}>
                <div style={{display:'flex',alignItems:'center',gap:5}}>
                  <div style={{width:5,height:5,borderRadius:'50%',background:color,flexShrink:0,boxShadow:d.n?`0 0 5px ${color}`:undefined}}/>
                  <span style={{fontSize:10.5,fontWeight:700,color:d.n?C.t1:C.t3}}>{d.label}</span>
                  {d.n>0&&<span style={{fontSize:7.5,color:C.t3}}>×{d.n}</span>}
                </div>
                {d.n>0&&<div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <span style={{fontSize:9,fontWeight:900,fontFamily:'monospace',color:wrc,minWidth:30,textAlign:'right'}}>{d.wr}%</span>
                  <span style={{fontSize:8.5,fontFamily:'monospace',color:rrc,minWidth:34,textAlign:'right'}}>{d.avgRR>0?'+':''}{d.avgRR}R</span>
                  <span style={{fontSize:8.5,fontFamily:'monospace',color:trc,minWidth:38,textAlign:'right'}}>{d.totalRR>=0?'+':''}{d.totalRR}R</span>
                  <span style={{fontSize:8,fontFamily:'monospace',color:pfc,minWidth:28,textAlign:'right'}}>PF{d.pf}</span>
                </div>}
                {!d.n&&<span style={{fontSize:8,color:C.t4}}>—</span>}
              </div>
              {d.n>0&&(
                <div style={{display:'flex',gap:3,alignItems:'center'}}>
                  <div style={{flex:1,height:3,borderRadius:2,background:'rgba(255,255,255,0.05)',overflow:'hidden'}}>
                    <motion.div initial={{width:0}} animate={{width:`${d.wr}%`}} transition={{duration:0.75,delay:i*0.04}} style={{height:'100%',borderRadius:2,background:`linear-gradient(90deg,${shade(wrc,'44')},${wrc})`}}/>
                  </div>
                  <div style={{width:48,height:3,borderRadius:2,background:'rgba(255,255,255,0.04)',overflow:'hidden',position:'relative'}}>
                    <motion.div initial={{width:0}} animate={{width:`${Math.min(96,d.n/maxN*96)}%`}} transition={{duration:0.7,delay:i*0.04}} style={{position:'absolute',left:0,height:'100%',background:color,opacity:0.55,borderRadius:2}}/>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
};

const DirSplit=({title,icon,color,dataByDir,labels,custom=0})=>{
  const[metric,setMetric]=useState('wr');
  const mv=(d)=>{if(!d.n)return{v:'—',c:C.t4};if(metric==='wr')return{v:`${d.wr}%`,c:d.wr>=60?C.green:d.wr>=45?C.warn:C.danger};if(metric==='avgRR')return{v:`${d.avgRR>0?'+':''}${d.avgRR}R`,c:d.avgRR>=1?C.green:d.avgRR>=0?C.warn:C.danger};if(metric==='totalRR')return{v:`${d.totalRR>=0?'+':''}${d.totalRR}R`,c:d.totalRR>=0?C.green:C.danger};if(metric==='pf')return{v:`PF${d.pf}`,c:d.pf>=1.5?C.green:d.pf>=1?C.warn:C.danger};return{v:String(d.n),c:C.t2};};
  return(
    <GlassCard custom={custom} glow={color} hover={false} style={{padding:'18px 16px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
        <ST icon={icon} color={color} mb={0}>{title}</ST>
        <div style={{display:'flex',gap:3}}>{[{v:'wr',l:'WR'},{v:'avgRR',l:'R:R'},{v:'totalRR',l:'Tot'},{v:'pf',l:'PF'},{v:'n',l:'#'}].map(({v,l})=>(<button key={v} onClick={()=>setMetric(v)} style={{padding:'2px 6px',borderRadius:5,border:`1px solid ${metric===v?color:C.brd}`,background:metric===v?`${shade(color,'18')}`:'transparent',color:metric===v?color:C.t3,fontSize:7.5,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>{l}</button>))}</div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1.4fr 1fr 1fr',gap:3,marginBottom:6}}>
        <div/>
        {['Long','Short'].map(d=>(<div key={d} style={{textAlign:'center',padding:'3px 0',borderRadius:6,background:d==='Long'?`${shade(C.green,'12')}`:`${shade(C.danger,'12')}`,border:`1px solid ${d==='Long' ? shade(C.green,'25') : shade(C.danger,'25')}`}}><span style={{fontSize:9,fontWeight:800,color:d==='Long'?C.green:C.danger}}>{d==='Long'?'▲ Long':'▼ Short'}</span></div>))}
      </div>
      {labels.map((lbl,i)=>{
        const dL=dataByDir['Long']?.find(d=>d.label===lbl)||{n:0,wr:0,avgRR:0,totalRR:0,pf:0};
        const dS=dataByDir['Short']?.find(d=>d.label===lbl)||{n:0,wr:0,avgRR:0,totalRR:0,pf:0};
        const mL=mv(dL),mS=mv(dS);
        return(<div key={lbl} style={{display:'grid',gridTemplateColumns:'1.4fr 1fr 1fr',gap:3,marginBottom:3,opacity:(dL.n||dS.n)?1:0.3}}>
          <div style={{display:'flex',alignItems:'center',gap:5,padding:'6px 8px',borderRadius:8,background:'rgba(255,255,255,0.025)'}}><div style={{width:4,height:4,borderRadius:'50%',background:color,flexShrink:0}}/><span style={{fontSize:9.5,fontWeight:700,color:(dL.n||dS.n)?C.t1:C.t3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{lbl}</span></div>
          {[{d:dL,m:mL,dir:'Long'},{d:dS,m:mS,dir:'Short'}].map(({d,m,dir})=>(<div key={dir} style={{padding:'5px 6px',borderRadius:8,background:d.n?`${shade(dir==='Long'?C.green:C.danger,'08')}`:'rgba(255,255,255,0.015)',border:`1px solid ${d.n ? (dir==='Long' ? shade(C.green,'22') : shade(C.danger,'22')) : C.brd}`,textAlign:'center'}}>{d.n?(<><div style={{fontSize:9.5,fontWeight:900,fontFamily:'monospace',color:m.c,lineHeight:1}}>{m.v}</div><div style={{fontSize:6.5,color:C.t3,marginTop:1}}>×{d.n}</div></>):<div style={{fontSize:8,color:C.t4}}>—</div>}</div>))}
        </div>);
      })}
    </GlassCard>
  );
};

const Heatmap=({trades,rowKey,rowLabels,colKey,colLabels,title,icon,color,metric='wr'})=>{
  const mtx=useMemo(()=>{const m={};rowLabels.forEach(r=>{m[r]={};colLabels.forEach(c=>{m[r][c]={n:0,wins:0,totalRR:0};});});trades.forEach(t=>{const rk=String(t[rowKey]||''),ck=String(t[colKey]||'');if(!m[rk]||!m[rk][ck])return;m[rk][ck].n++;m[rk][ck].totalRR+=t.rr;if(t.isWin)m[rk][ck].wins++;});return m;},[trades,rowKey,colKey]);
  const[met,setMet]=useState(metric);
  const cv=(cell)=>{if(!cell.n)return null;if(met==='wr')return Math.round(cell.wins/cell.n*100);if(met==='avgRR')return parseFloat((cell.totalRR/cell.n).toFixed(1));if(met==='totalRR')return parseFloat(cell.totalRR.toFixed(1));return cell.n;};
  const allV=rowLabels.flatMap(r=>colLabels.map(c=>cv(mtx[r]?.[c]))).filter(v=>v!==null);
  const maxV=Math.max(...allV.map(Math.abs),1);
  const cbg=(val,cell)=>{if(!cell.n||val===null)return'rgba(255,255,255,0.03)';if(met==='wr'){const i=Math.min(0.75,Math.abs(val-50)/50*0.75);return val>=50?`rgba(0,255,136,${i*0.65})`:`rgba(255,61,87,${i*0.55})`;}const i=Math.min(0.75,Math.abs(val)/maxV*0.75);return val>=0?`rgba(0,255,136,${i*0.6})`:`rgba(255,61,87,${i*0.55})`;};
  return(
    <GlassCard hover={false} style={{padding:'18px 16px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
        <ST icon={icon} color={color} mb={0}>{title}</ST>
        <div style={{display:'flex',gap:3}}>{[{v:'wr',l:'WR%'},{v:'avgRR',l:'R:R'},{v:'totalRR',l:'Total'},{v:'n',l:'#'}].map(({v,l})=>(<button key={v} onClick={()=>setMet(v)} style={{padding:'2px 6px',borderRadius:5,border:`1px solid ${met===v?color:C.brd}`,background:met===v?`${shade(color,'18')}`:'transparent',color:met===v?color:C.t3,fontSize:7.5,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>{l}</button>))}</div>
      </div>
      <div style={{overflowX:'auto'}}>
        <table style={{borderCollapse:'separate',borderSpacing:3,minWidth:'100%'}}>
          <thead><tr><th style={{minWidth:90}}/>{colLabels.map(c=><th key={c} style={{fontSize:7.5,fontWeight:700,color:C.t3,padding:'0 2px 5px',textAlign:'center',minWidth:48,whiteSpace:'nowrap'}}>{c}</th>)}</tr></thead>
          <tbody>{rowLabels.map(r=>(<tr key={r}><td style={{fontSize:8.5,fontWeight:700,color:C.t2,paddingRight:6,textAlign:'right',whiteSpace:'nowrap'}}>{r}</td>{colLabels.map(c=>{const cell=mtx[r]?.[c]||{n:0};const val=cv(cell);const bg=cbg(val,cell);const tc=val===null?C.t4:met==='wr'?(val>=50?C.green:C.danger):(val>=0?C.green:C.danger);return(<td key={c} style={{padding:2}}><div title={cell.n?`${r}×${c}: ${cell.n} trades`:''} style={{height:38,borderRadius:7,background:bg,border:`1px solid ${cell.n?'rgba(255,255,255,0.07)':C.brd}`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:cell.n?'pointer':'default',transition:'transform 0.12s'}} onMouseEnter={e=>{if(cell.n)e.currentTarget.style.transform='scale(1.1)';}} onMouseLeave={e=>{e.currentTarget.style.transform='scale(1)';}}>
            {cell.n>0?(<><div style={{fontSize:9,fontWeight:900,fontFamily:'monospace',color:tc,lineHeight:1}}>{met==='wr'?`${val}%`:met==='n'?val:`${val>=0?'+':''}${val}R`}</div><div style={{fontSize:6,color:C.t3,marginTop:1}}>×{cell.n}</div></>):<div style={{width:6,height:1,background:'rgba(255,255,255,0.08)'}}/>}
          </div></td>);})}</tr>))}</tbody>
        </table>
      </div>
    </GlassCard>
  );
};

const TradeList=({trades})=>{
  const[page,setPage]=useState(0);const[sk,setSk]=useState('dateISO');const[sd,setSd]=useState(1);
  const[fRes,setFRes]=useState('all');const[fDir,setFDir]=useState('all');const[fSess,setFSess]=useState('all');
  const[fYear,setFYear]=useState('all');const[fKL,setFKL]=useState('all');
  const PER=20;
  const filtered=useMemo(()=>{let t=[...trades];if(fRes!=='all')t=t.filter(x=>x.res===fRes);if(fDir!=='all')t=t.filter(x=>x.pos===fDir);if(fSess!=='all')t=t.filter(x=>x.session===fSess);if(fYear!=='all')t=t.filter(x=>x.annee===fYear);if(fKL!=='all')t=t.filter(x=>x.key_level===fKL);t.sort((a,b)=>{const va=a[sk],vb=b[sk];return sd*(va>vb?1:va<vb?-1:0);});return t;},[trades,fRes,fDir,fSess,fYear,fKL,sk,sd]);
  const pages=Math.ceil(filtered.length/PER);const vis=filtered.slice(page*PER,(page+1)*PER);
  const RC={TP:C.green,SL:C.danger,BE:C.warn};
  const COLS=[{k:'dateISO',l:'Date',w:'78px'},{k:'heure',l:'Time',w:'52px'},{k:'pos',l:'Dir',w:'44px'},{k:'res',l:'Res.',w:'40px'},{k:'rr',l:'R/R',w:'52px'},{k:'session',l:'Session',w:'85px'},{k:'jour_str',l:'Day',w:'70px'},{k:'annee',l:'Year',w:'50px'},{k:'key_level',l:'Structure',w:'100px'},{k:'prise_asian',l:'Asian',w:'55px'},{k:'turtle_soup',l:'TS',w:'50px'},{k:'retrac_cisd',l:'CISD',w:'55px'},{k:'prev_daily',l:'Prev D.',w:'55px'},{k:'tendance',l:'Trend',w:'70px'},{k:'contexte',l:'Context',w:'82px'},{k:'be_from',l:'BE from',w:'80px'},{k:'raison',l:'Reason',w:'120px'}];
  return(
    <GlassCard hover={false} style={{padding:'20px 18px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14,flexWrap:'wrap',gap:8}}>
        <ST icon="📋" color={C.teal} mb={0}>All Trades ({filtered.length}/{trades.length})</ST>
        <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
          {[{v:fRes,sv:setFRes,opts:[{v:'all',l:'Result'},...RESULTATS.map(r=>({v:r,l:r}))]},{v:fDir,sv:setFDir,opts:[{v:'all',l:'Direction'},{v:'Long',l:'Long'},{v:'Short',l:'Short'}]},{v:fSess,sv:setFSess,opts:[{v:'all',l:'Session'},...SESSIONS.map(s=>({v:s,l:s}))]},{v:fYear,sv:setFYear,opts:[{v:'all',l:'Year'},...ANNEES.map(a=>({v:a,l:a}))]},{v:fKL,sv:setFKL,opts:[{v:'all',l:'Structure'},...KEY_LEVELS.map(k=>({v:k,l:k}))]}].map(({v,sv,opts},i)=>(
            <select key={i} value={v} onChange={e=>{sv(e.target.value);setPage(0);}} style={{background:C.bgHigh,border:`1px solid ${C.brd}`,borderRadius:7,padding:'4px 7px',color:C.t2,fontSize:9,fontFamily:'inherit',outline:'none',cursor:'pointer'}}>
              {opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          ))}
        </div>
      </div>
      <div style={{overflowX:'auto'}}>
        <table style={{borderCollapse:'separate',borderSpacing:'0 2px',minWidth:'100%'}}>
          <thead><tr style={{background:'rgba(255,255,255,0.05)'}}>{COLS.map(col=>(<th key={col.k} onClick={()=>{if(sk===col.k)setSd(d=>-d);else{setSk(col.k);setSd(1);}}} style={{padding:'6px 8px',fontSize:7.5,fontWeight:800,color:sk===col.k?C.cyan:C.t3,textTransform:'uppercase',letterSpacing:'0.4px',cursor:'pointer',userSelect:'none',textAlign:'left',borderBottom:`1px solid ${C.brd}`,whiteSpace:'nowrap',width:col.w}}>{col.l}{sk===col.k&&<span style={{marginLeft:3,fontSize:8}}>{sd===1?'↑':'↓'}</span>}</th>))}</tr></thead>
          <tbody>{vis.map((t,i)=>(<motion.tr key={t.id} initial={{opacity:0,x:-4}} animate={{opacity:1,x:0}} transition={{delay:i*0.012}} style={{background:i%2===0?'rgba(255,255,255,0.01)':'rgba(255,255,255,0.018)',cursor:'default'}} onMouseEnter={e=>e.currentTarget.style.background='rgba(var(--mf-accent-rgb, 6, 230, 255),0.04)'} onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'rgba(255,255,255,0.01)':'rgba(255,255,255,0.018)'}>
            <td style={{padding:'5px 8px',fontSize:9,color:C.cyan,fontFamily:'monospace',borderRadius:'6px 0 0 6px'}}>{t.dateISO}</td>
            <td style={{padding:'5px 8px',fontSize:8.5,color:C.t3}}>{t.heure}</td>
            <td style={{padding:'5px 8px'}}><span style={{fontSize:9,fontWeight:800,color:t.pos==='Long'?C.green:C.danger}}>{t.pos}</span></td>
            <td style={{padding:'5px 8px'}}><span style={{fontSize:8,fontWeight:800,padding:'1px 5px',borderRadius:4,background:`${shade(RC[t.res]||C.t3,'18')}`,color:RC[t.res]||C.t3,border:`1px solid ${shade(RC[t.res]||C.t3,'28')}`}}>{t.res}</span></td>
            <td style={{padding:'5px 8px',fontSize:9.5,fontWeight:900,fontFamily:'monospace',color:t.rr>0?C.green:t.rr<0?C.danger:C.warn}}>{t.rr>0?'+':''}{t.rr}R</td>
            <td style={{padding:'5px 8px',fontSize:8.5,color:C.purple}}>{t.session}</td>
            <td style={{padding:'5px 8px',fontSize:8.5,color:C.t2}}>{t.jour_str}</td>
            <td style={{padding:'5px 8px',fontSize:8.5,color:C.t3}}>{t.annee}</td>
            <td style={{padding:'5px 8px',fontSize:8.5,color:C.blue,whiteSpace:'nowrap'}}>{t.key_level}</td>
            <td style={{padding:'5px 8px',fontSize:8.5,color:t.prise_asian==='None'?C.t4:C.cyan}}>{t.prise_asian}</td>
            <td style={{padding:'5px 8px',fontSize:8.5,color:t.turtle_soup==='Strong'?C.green:t.turtle_soup==='Weak'?C.warn:C.t4}}>{t.turtle_soup}</td>
            <td style={{padding:'5px 8px',fontSize:8.5,color:C.teal,whiteSpace:'nowrap'}}>{t.retrac_cisd}</td>
            <td style={{padding:'5px 8px',fontSize:8.5,color:t.prev_daily==='None'?C.t4:C.orange}}>{t.prev_daily}</td>
            <td style={{padding:'5px 8px',fontSize:8.5,color:t.tendance==='Bullish'?C.green:t.tendance==='Bearish'?C.danger:C.warn}}>{t.tendance}</td>
            <td style={{padding:'5px 8px',fontSize:8.5,color:C.t2}}>{t.contexte}</td>
            <td style={{padding:'5px 8px',fontSize:8,color:C.t3,whiteSpace:'nowrap'}}>{t.be_from}</td>
            <td style={{padding:'5px 8px',fontSize:8,color:t.raison&&t.raison!=='none'?C.warn:C.t4,maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',borderRadius:'0 6px 6px 0'}}>{t.raison||'—'}</td>
          </motion.tr>))}</tbody>
        </table>
      </div>
      {pages>1&&(<div style={{display:'flex',justifyContent:'center',gap:4,marginTop:12,alignItems:'center'}}>
        <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0} style={{padding:'4px 10px',borderRadius:7,border:`1px solid ${C.brd}`,background:'rgba(255,255,255,0.04)',color:C.t2,cursor:page===0?'not-allowed':'pointer',opacity:page===0?0.4:1,fontSize:9,fontFamily:'inherit'}}>←</button>
        {Array.from({length:Math.min(pages,8)},(_,i)=>i).map(i=>(<button key={i} onClick={()=>setPage(i)} style={{width:26,height:26,borderRadius:7,border:`1px solid ${page===i?C.cyan:C.brd}`,background:page===i?`${shade(C.cyan,'20')}`:'rgba(255,255,255,0.04)',color:page===i?C.cyan:C.t3,cursor:'pointer',fontSize:9,fontWeight:page===i?800:500,fontFamily:'inherit'}}>{i+1}</button>))}
        <button onClick={()=>setPage(p=>Math.min(pages-1,p+1))} disabled={page===pages-1} style={{padding:'4px 10px',borderRadius:7,border:`1px solid ${C.brd}`,background:'rgba(255,255,255,0.04)',color:C.t2,cursor:page===pages-1?'not-allowed':'pointer',opacity:page===pages-1?0.4:1,fontSize:9,fontFamily:'inherit'}}>→</button>
      </div>)}
    </GlassCard>
  );
};

const ImportZone=({onImport,isReal,count})=>{
  const[drag,setDrag]=useState(false);const[loading,setLoading]=useState(false);const[err,setErr]=useState('');
  const[preview,setPreview]=useState(null);const[raw,setRaw]=useState(null);const ref=useRef();
  const loadXLSX=async()=>{if(!window.XLSX){await new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';s.onload=res;s.onerror=()=>rej(new Error('Unable to load SheetJS'));document.head.appendChild(s);});}};
  const proc=async(file)=>{setLoading(true);setErr('');setPreview(null);try{await loadXLSX();const buf=await file.arrayBuffer();const ts=parseXL(buf);if(!ts.length)throw new Error('No trades found');setRaw(ts);setPreview(ts.slice(0,4));}catch(e){setErr(e.message);}setLoading(false);};
  return(
    <GlassCard glow={C.cyan} style={{padding:'20px 20px',marginBottom:18}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,flexWrap:'wrap',gap:8}}>
        <ST icon="📥" color={C.cyan} mb={0}>Excel Import — Update with your new data</ST>
        {isReal?<span style={{fontSize:8.5,padding:'2px 9px',borderRadius:12,background:`${shade(C.green,'15')}`,border:`1px solid ${shade(C.green,'30')}`,color:C.green,fontWeight:700}}>✓ {count} trades imported</span>:<span style={{fontSize:8.5,padding:'2px 9px',borderRadius:12,background:`${shade(C.cyan,'12')}`,border:`1px solid ${shade(C.cyan,'30')}`,color:C.cyan,fontWeight:700}}>📊 {count} trades · Real EUR/USD data 2023-2025</span>}
      </div>
      <div style={{display:'grid',gridTemplateColumns:preview?'1fr 1fr':'1fr',gap:12}}>
        <div onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);const f=e.dataTransfer.files[0];if(f)proc(f);}} onClick={()=>ref.current?.click()} style={{border:`2px dashed ${drag?C.cyan:err?C.danger:isReal?C.green:C.brd}`,borderRadius:12,padding:'24px 16px',display:'flex',flexDirection:'column',alignItems:'center',gap:8,cursor:'pointer',background:drag?`${shade(C.cyan,'07')}`:'rgba(255,255,255,0.02)',transition:'all 0.2s'}}>
          <input ref={ref} type="file" accept=".xlsx,.xls,.csv,.ods" style={{display:'none'}} onChange={e=>{const f=e.target.files?.[0];if(f)proc(f);e.target.value='';}}/>
          <div style={{fontSize:28}}>{loading?'⏳':preview?'✅':'📂'}</div>
          <div style={{fontSize:11,fontWeight:700,color:drag?C.cyan:C.t2,textAlign:'center'}}>{loading?'Analyzing…':preview?`${raw.length} trades detected — ready to import`:'Drag your Excel file or click to browse'}</div>
          <div style={{fontSize:8.5,color:C.t3}}>xlsx · xls · csv — auto-detected columns, FR formats accepted</div>
          {err&&<div style={{padding:'4px 10px',borderRadius:6,background:`${shade(C.danger,'12')}`,fontSize:9,color:C.danger}}>{err}</div>}
        </div>
        {preview&&(<div style={{display:'flex',flexDirection:'column',gap:7}}>
          <div style={{fontSize:8,color:C.t3,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.5px'}}>Preview — first 4 rows</div>
          <div style={{border:`1px solid ${C.brd}`,borderRadius:8,overflow:'hidden',flex:1}}>
            {preview.map((t,i)=>(<div key={i} style={{display:'flex',gap:8,padding:'5px 9px',borderBottom:i<preview.length-1?`1px solid rgba(255,255,255,0.04)`:'none',background:i%2===0?'transparent':'rgba(255,255,255,0.02)'}}>
              <span style={{fontSize:8,color:C.cyan,fontFamily:'monospace',minWidth:78}}>{t.dateISO}</span>
              <span style={{fontSize:8,color:t.pos==='Long'?C.green:C.danger,fontWeight:700,minWidth:34}}>{t.pos}</span>
              <span style={{fontSize:8,color:{TP:C.green,SL:C.danger,BE:C.warn}[t.res]||C.t2,fontWeight:700,minWidth:22}}>{t.res}</span>
              <span style={{fontSize:8,color:t.rr>0?C.green:t.rr<0?C.danger:C.warn,fontFamily:'monospace',minWidth:36}}>{t.rr>0?'+':''}{t.rr}R</span>
              <span style={{fontSize:8,color:C.purple}}>{t.session}</span>
            </div>))}
          </div>
          <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={()=>{onImport(raw);setPreview(null);setRaw(null);}} style={{padding:'8px',borderRadius:8,border:`1px solid ${C.green}`,background:`${shade(C.green,'18')}`,color:C.green,fontSize:10,fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>✓ Import {raw.length} trades</motion.button>
        </div>)}
      </div>
    </GlassCard>
  );
};

const MAIN_TABS=[{id:'datas',label:'Data',icon:'📊'},{id:'manuel',label:'Manual Backtest',icon:'✏️'}];
const SEC_TABS=[{id:'overview',label:'Overview',icon:'🏆'},{id:'general',label:'General',icon:'🌐'},{id:'ict',label:'ICT Confluences',icon:'🔷'},{id:'dirsplit',label:'Long vs Short',icon:'↕️'},{id:'heatmaps',label:'Heatmaps',icon:'🌡️'},{id:'trades',label:'Trades',icon:'📋'}];

export default function Backtest(){
  const[mainTab,setMainTab]=useState('datas');
  const[secTab,setSecTab]=useState('overview');
  const[trades,setTrades]=useState(TRADES);
  const[isReal,setIsReal]=useState(false);
  const stats=useMemo(()=>calcGlobal(trades),[trades]);
  const bDir=useMemo(()=>byKey(trades,t=>t.pos,DIRS),[trades]);
  const bSess=useMemo(()=>byKey(trades,t=>t.session,SESSIONS),[trades]);
  const bJour=useMemo(()=>byKey(trades,t=>t.jour_str,JOURS),[trades]);
  const bMois=useMemo(()=>byKey(trades,t=>t.mois_str,MOIS),[trades]);
  const bAnnee=useMemo(()=>byKey(trades,t=>t.annee,ANNEES),[trades]);
  const bRes=useMemo(()=>byKey(trades,t=>t.res,RESULTATS),[trades]);
  const bKL=useMemo(()=>byKey(trades,t=>t.key_level,KEY_LEVELS),[trades]);
  const bAsian=useMemo(()=>byKey(trades,t=>t.prise_asian,ASIAN_OPTS),[trades]);
  const bTS=useMemo(()=>byKey(trades,t=>t.turtle_soup,TS_OPTS),[trades]);
  const bRetr=useMemo(()=>byKey(trades,t=>t.retrac_cisd,RETR_OPTS),[trades]);
  const bPD=useMemo(()=>byKey(trades,t=>t.prev_daily,PD_OPTS),[trades]);
  const bTend=useMemo(()=>byKey(trades,t=>t.tendance,TENDANCE_OPTS),[trades]);
  const bCtx=useMemo(()=>byKey(trades,t=>t.contexte,CONTEXTE_OPTS),[trades]);
  const asianDir=useMemo(()=>byKeyDir(trades,t=>t.prise_asian,ASIAN_OPTS),[trades]);
  const pdDir=useMemo(()=>byKeyDir(trades,t=>t.prev_daily,PD_OPTS),[trades]);
  const tsDir=useMemo(()=>byKeyDir(trades,t=>t.turtle_soup,TS_OPTS),[trades]);
  const klDir=useMemo(()=>byKeyDir(trades,t=>t.key_level,KEY_LEVELS),[trades]);
  const retrDir=useMemo(()=>byKeyDir(trades,t=>t.retrac_cisd,RETR_OPTS),[trades]);
  const sessDir=useMemo(()=>byKeyDir(trades,t=>t.session,SESSIONS),[trades]);
  const tendDir=useMemo(()=>byKeyDir(trades,t=>t.tendance,TENDANCE_OPTS),[trades]);
  const ctxDir=useMemo(()=>byKeyDir(trades,t=>t.contexte,CONTEXTE_OPTS),[trades]);

  const KPI=stats?[
    {label:'Total Trades',value:stats.n,sub:`${stats.yrs} years · EUR/USD M5`,color:C.cyan,icon:'📊',custom:0},
    {label:'Win Rate (TP)',value:`${stats.wr}%`,sub:`${stats.wins}TP · ${stats.losses}SL · ${shade(stats.bes,'BE')}`,color:stats.wr>=60?C.green:stats.wr>=50?C.warn:C.danger,icon:'🎯',custom:1},
    {label:'Profit Factor',value:stats.pf,sub:`${stats.grossW}R won / ${stats.grossL}R lost`,color:stats.pf>=2?C.green:stats.pf>=1.3?C.cyan:stats.pf>=1?C.warn:C.danger,icon:'⚖️',custom:2},
    {label:'Total R Won',value:`+${stats.totalRR}R`,sub:`Avg/trade: ${stats.avgRR}R`,color:stats.totalRR>=0?C.green:C.danger,icon:'💹',custom:3},
    {label:'Avg Win / Loss',value:`+${stats.avgWin}R`,sub:`Avg loss: -${stats.avgLoss}R · ratio ${parseFloat((stats.avgWin/Math.max(0.01,stats.avgLoss)).toFixed(2))}:1`,color:C.green,icon:'📐',custom:4},
    {label:'Sharpe Ratio',value:stats.sharpe,sub:`≥1 good · ≥2 excellent`,color:stats.sharpe>=2?C.green:stats.sharpe>=1?C.cyan:C.warn,icon:'📏',custom:5},
    {label:'Max Drawdown',value:`-${stats.maxDD}R`,sub:`Max streak: ${stats.mW}W · ${stats.mL}L`,color:C.danger,icon:'📉',custom:6},
    {label:'Expectancy',value:`${stats.exp>=0?'+':''}${stats.exp}R`,sub:`Kelly: ${stats.kelly}% · BE rate: ${stats.beRate}%`,color:stats.exp>=0?C.green:C.danger,icon:'🧮',custom:7},
  ]:[];

  return(
    /* ── OUTER WRAPPER: same bg as Dashboard (#0F1420), fills full height ── */
    <div style={{
      background:'#0F1420',
      minHeight:'100%',
      width:'100%',
      fontFamily:"'SF Pro Display','Segoe UI',system-ui,sans-serif",
      color:C.t1,
      position:'relative',
    }}>
      {/* Subtle top glow — much lighter than before */}
      <div style={{position:'absolute',top:0,left:0,right:0,height:320,background:'radial-gradient(ellipse 80% 40% at 50% -5%,rgba(var(--mf-blue-rgb, 77, 124, 255),0.08) 0%,transparent 70%)',pointerEvents:'none',zIndex:0}}/>
      {/* Grid texture */}
      <div style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:0,backgroundImage:'linear-gradient(rgba(var(--mf-blue-rgb, 77, 124, 255),0.009) 1px,transparent 1px),linear-gradient(90deg,rgba(var(--mf-blue-rgb, 77, 124, 255),0.009) 1px,transparent 1px)',backgroundSize:'60px 60px'}}/>
      {/* Floating dots */}
      <div style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:0}}>
        {Array.from({length:14}).map((_,i)=>(
          <motion.div key={i} animate={{y:[0,-35,0],opacity:[0.02,0.10,0.02]}} transition={{duration:5.5+i*0.38,repeat:Infinity,delay:i*0.44}}
            style={{position:'absolute',left:`${(i*17+3)%100}%`,top:`${(i*9.3+7)%100}%`,width:2,height:2,borderRadius:'50%',background:[C.blue,C.cyan,C.purple,C.green,C.teal][i%5]}}/>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <div style={{position:'relative',zIndex:1,padding:'26px 28px 52px',width:'100%',boxSizing:'border-box'}}>

        {/* HEADER */}
        <motion.div initial={{opacity:0,y:-16}} animate={{opacity:1,y:0}} transition={{duration:0.48}}
          style={{marginBottom:20,paddingBottom:18,borderBottom:`1px solid ${C.brd}`}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <motion.div animate={{rotateY:[0,360]}} transition={{duration:8,repeat:Infinity,ease:'linear'}}
                style={{width:44,height:44,borderRadius:13,background:C.gradCyan,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,boxShadow:`0 4px 22px ${C.cyanGlow},0 0 40px ${C.cyanGlow}`}}>📊</motion.div>
              <div>
                <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:3}}>
                  <h1 style={{margin:0,fontSize:26,fontWeight:900,background:C.gradCyan,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',letterSpacing:'-1px'}}>Backtest Analytics</h1>
                  <span style={{padding:'2px 8px',borderRadius:5,background:`${shade(C.green,'18')}`,border:`1px solid ${shade(C.green,'38')}`,fontSize:8.5,fontWeight:800,color:C.green}}>EUR/USD · M5 · 2023-2025</span>
                  {stats&&<span style={{padding:'2px 8px',borderRadius:5,background:`${shade(C.cyan,'12')}`,border:`1px solid ${shade(C.cyan,'30')}`,fontSize:8.5,fontWeight:800,color:C.cyan}}>{stats.n} trades</span>}
                </div>
                <div style={{fontSize:10.5,color:C.t3}}>Your real data · All ICT confluences · Long vs Short split</div>
              </div>
            </div>
            <div style={{display:'flex',gap:3,padding:'3px',borderRadius:13,background:'rgba(255,255,255,0.04)',border:`1px solid ${C.brd}`}}>
              {MAIN_TABS.map(t=>(
                <motion.button key={t.id} onClick={()=>setMainTab(t.id)} whileHover={{scale:1.03}} whileTap={{scale:0.95}}
                  style={{padding:'9px 20px',borderRadius:10,border:'none',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:6,fontSize:11,fontWeight:800,transition:'all 0.2s',
                    background:mainTab===t.id?`linear-gradient(135deg,${shade(C.blue,'28')},${shade(C.cyan,'15')})`:'transparent',
                    color:mainTab===t.id?C.cyan:C.t3,
                    boxShadow:mainTab===t.id?`0 0 0 1px ${shade(C.cyan,'40')},0 2px 14px ${shade(C.cyan,'15')}`:'none'}}>
                  <span style={{fontSize:13}}>{t.icon}</span>{t.label}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
        {mainTab==='datas'&&(
          <motion.div key="datas" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.28}}>
            <ImportZone onImport={t=>{setTrades(t);setIsReal(true);}} isReal={isReal} count={trades.length}/>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:10}}>
              {KPI.slice(0,4).map(k=><KpiCard key={k.label} {...k}/>)}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:22}}>
              {KPI.slice(4).map(k=><KpiCard key={k.label} {...k}/>)}
            </div>
            <div style={{display:'flex',gap:3,marginBottom:18,padding:'3px',borderRadius:12,background:'rgba(255,255,255,0.03)',border:`1px solid ${C.brd}`,width:'fit-content',flexWrap:'wrap'}}>
              {SEC_TABS.map(s=>(<motion.button key={s.id} onClick={()=>setSecTab(s.id)} whileHover={{scale:1.03}} whileTap={{scale:0.96}}
                style={{padding:'7px 15px',borderRadius:9,border:'none',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:5,fontSize:10.5,fontWeight:700,transition:'all 0.2s',
                  background:secTab===s.id?`linear-gradient(135deg,${shade(C.blue,'22')},${shade(C.purple,'14')})`:'transparent',
                  color:secTab===s.id?C.cyan:C.t3,
                  boxShadow:secTab===s.id?`0 0 0 1px ${shade(C.cyan,'32')},0 2px 10px ${shade(C.cyan,'12')}`:'none'}}>
                <span>{s.icon}</span>{s.label}
              </motion.button>))}
            </div>

            <AnimatePresence mode="wait">
              {secTab==='overview'&&(<motion.div key="ov" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}} transition={{duration:0.25}}>
                <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:14,marginBottom:14}}>{stats&&<EquityChart data={stats.equity}/>}{stats&&<DDChart data={stats.ddSeries}/>}</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14,marginBottom:14}}><ConfCard title="TP/BE/SL Results" icon="🏁" color={C.cyan} data={bRes}/><ConfCard title="Direction" icon="↕️" color={C.green} data={bDir}/><ConfCard title="Year" icon="📅" color={C.purple} data={bAnnee}/></div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}><RRDist trades={trades}/><ConfCard title="Overall Trend" icon="📈" color={C.teal} data={bTend}/></div>
              </motion.div>)}
              {secTab==='general'&&(<motion.div key="gen" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}} transition={{duration:0.25}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}><ConfCard title="Sessions" icon="🌍" color={C.purple} data={bSess}/><ConfCard title="Days of the Week" icon="📆" color={C.green} data={bJour}/></div>
                <ConfCard title="Months of the Year" icon="🗓️" color={C.warn} data={bMois} custom={2}/>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginTop:14}}><ConfCard title="Overall Trend" icon="📈" color={C.teal} data={bTend}/><ConfCard title="Trade Context" icon="🎯" color={C.orange} data={bCtx}/></div>
              </motion.div>)}
              {secTab==='ict'&&(<motion.div key="ict" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}} transition={{duration:0.25}}>
                <ConfCard title="Confirmation Structure (Key-Level)" icon="🔷" color={C.blue} data={bKL}/>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14,marginTop:14,marginBottom:14}}><ConfCard title="Asian Take" icon="🌙" color={C.cyan} data={bAsian} custom={1}/><ConfCard title="Turtle Soup (Rejection)" icon="🐢" color={C.orange} data={bTS} custom={2}/><ConfCard title="Previous Daily H/L" icon="📌" color={C.teal} data={bPD} custom={3}/></div>
                <ConfCard title="Retracement after CISD" icon="🔁" color={C.pink} data={bRetr} custom={4}/>
              </motion.div>)}
              {secTab==='dirsplit'&&(<motion.div key="dir" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}} transition={{duration:0.25}}>
                <div style={{background:`${shade(C.blue,'08')}`,border:`1px solid ${shade(C.blue,'18')}`,borderRadius:12,padding:'10px 14px',marginBottom:14,fontSize:9.5,color:C.t2,lineHeight:1.65}}><strong style={{color:C.cyan}}>How to read:</strong> Each table shows the same confluence broken down by direction.&nbsp;<span style={{color:C.green}}>▲ Long</span> = Long trades · <span style={{color:C.danger}}>▼ Short</span> = Short trades · Switch WR/R:R/Tot/PF/# to change the metric.</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}><DirSplit title="Asian Take × Direction" icon="🌙" color={C.cyan} dataByDir={asianDir} labels={ASIAN_OPTS}/><DirSplit title="Previous Daily × Direction" icon="📌" color={C.teal} dataByDir={pdDir} labels={PD_OPTS} custom={1}/></div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}><DirSplit title="Turtle Soup × Direction" icon="🐢" color={C.orange} dataByDir={tsDir} labels={TS_OPTS} custom={2}/><DirSplit title="Structure (Key-Level) × Direction" icon="🔷" color={C.purple} dataByDir={klDir} labels={KEY_LEVELS} custom={3}/></div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}><DirSplit title="CISD Retracement × Direction" icon="🔁" color={C.pink} dataByDir={retrDir} labels={RETR_OPTS} custom={4}/><DirSplit title="Session × Direction" icon="🌍" color={C.green} dataByDir={sessDir} labels={SESSIONS} custom={5}/></div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}><DirSplit title="Overall Trend × Direction" icon="📈" color={C.teal} dataByDir={tendDir} labels={TENDANCE_OPTS} custom={6}/><DirSplit title="Context × Direction" icon="🎯" color={C.orange} dataByDir={ctxDir} labels={CONTEXTE_OPTS} custom={7}/></div>
              </motion.div>)}
              {secTab==='heatmaps'&&(<motion.div key="hm" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}} transition={{duration:0.25}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}><Heatmap trades={trades} rowKey="key_level" rowLabels={KEY_LEVELS} colKey="pos" colLabels={DIRS} title="Structure × Direction" icon="🔷" color={C.blue}/><Heatmap trades={trades} rowKey="prise_asian" rowLabels={ASIAN_OPTS} colKey="pos" colLabels={DIRS} title="Asian Take × Direction" icon="🌙" color={C.cyan}/></div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}><Heatmap trades={trades} rowKey="prev_daily" rowLabels={PD_OPTS} colKey="pos" colLabels={DIRS} title="Previous Daily × Direction" icon="📌" color={C.teal}/><Heatmap trades={trades} rowKey="turtle_soup" rowLabels={TS_OPTS} colKey="pos" colLabels={DIRS} title="Turtle Soup × Direction" icon="🐢" color={C.orange}/></div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}><Heatmap trades={trades} rowKey="key_level" rowLabels={KEY_LEVELS} colKey="session" colLabels={SESSIONS} title="Structure × Session" icon="🔷" color={C.purple}/><Heatmap trades={trades} rowKey="retrac_cisd" rowLabels={RETR_OPTS} colKey="pos" colLabels={DIRS} title="CISD Retracement × Direction" icon="🔁" color={C.pink}/></div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}><Heatmap trades={trades} rowKey="jour_str" rowLabels={JOURS} colKey="session" colLabels={SESSIONS} title="Day × Session" icon="📆" color={C.warn}/><Heatmap trades={trades} rowKey="tendance" rowLabels={TENDANCE_OPTS} colKey="pos" colLabels={DIRS} title="Trend × Direction" icon="📈" color={C.green}/></div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}><Heatmap trades={trades} rowKey="contexte" rowLabels={CONTEXTE_OPTS} colKey="session" colLabels={SESSIONS} title="Context × Session" icon="🎯" color={C.teal}/><Heatmap trades={trades} rowKey="mois_str" rowLabels={MOIS.slice(0,6)} colKey="pos" colLabels={DIRS} title="Month (H1) × Direction" icon="🗓️" color={C.gold}/></div>
              </motion.div>)}
              {secTab==='trades'&&(<motion.div key="tr" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}} transition={{duration:0.25}}><TradeList trades={trades}/></motion.div>)}
            </AnimatePresence>
          </motion.div>
        )}
        {mainTab==='manuel'&&(
          <motion.div key="manuel" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:0.28}}>
            <GlassCard glow={C.purple} style={{padding:'60px 40px',textAlign:'center'}}>
              <motion.div animate={{scale:[1,1.07,1]}} transition={{duration:3,repeat:Infinity}} style={{fontSize:52,marginBottom:20}}>🛠️</motion.div>
              <div style={{fontSize:22,fontWeight:900,color:C.t1,marginBottom:8,letterSpacing:'-0.5px'}}>Manual Backtest</div>
              <div style={{fontSize:12,color:C.t3,maxWidth:400,margin:'0 auto',lineHeight:1.7}}>Trade-by-trade entry with all ICT confluences.<br/><span style={{color:C.cyan,fontWeight:700}}>Under construction — next step.</span></div>
              <div style={{marginTop:22,display:'inline-flex',gap:7,flexWrap:'wrap',justifyContent:'center'}}>
                {['Trade form','ICT validation','Live stats','Excel export'].map(f=>(<span key={f} style={{padding:'5px 13px',borderRadius:20,background:`${shade(C.purple,'12')}`,border:`1px solid ${shade(C.purple,'28')}`,fontSize:9.5,fontWeight:700,color:C.purple}}>{f}</span>))}
              </div>
            </GlassCard>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
}

