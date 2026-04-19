/*
╔══════════════════════════════════════════════════════════════════════════════╗
║   📊 ALL TRADES MARKETFLOW - ULTIMATE VERSION                               ║
║   ✅ TradeDetailPanel integrated (slides from right)                        ║
║   ✅ Mini chart entry→exit, metrics, psycho, notes                          ║
║   ✅ 6 stats cards (+ Profit Factor + Max DD)                               ║
║   ✅ Advanced filters: Session, Bias, Date range                            ║
║   ✅ Bulk actions premium                                                    ║
║   ✅ ImportModal UNIVERSAL v4 — smart 3-pass detection                      ║
║   🔧 FIX: extra = purple (not red)                                          ║
║   🔧 FIX: clear minimum file message                                        ║
║   🔧 FIX: addTrade maps to correct Supabase fields                          ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import * as XLSX from 'xlsx';
import { useTradingContext } from '../context/TradingContext';
import { shade } from '../lib/colorAlpha';
import { CHART_MOTION_SOFT, chartActiveDot, chartCursor, chartTooltipStyle } from '../lib/marketflowCharts';
import TradeImportModal from '../components/TradeImportModal';

// ══════════════════════════════════════════════════════════════════════════════
// 🎨 PALETTE
// ══════════════════════════════════════════════════════════════════════════════
const C = {
  bgPage:'#0F1420', bgCard:'var(--mf-card,#161D2E)', bgDeep:'var(--mf-deep,#0D1117)',
  bgHigh:'#1C2540', bgHov:'#1F2B42', bgGlass:'rgba(22,29,46,0.85)',
  cyan:'var(--mf-accent,#06E6FF)', cyanGlow:'rgba(var(--mf-accent-rgb, 6, 230, 255),0.35)', teal:'var(--mf-teal,#00F5D4)',
  green:'var(--mf-green,#00FF88)', greenDim:'#00FF88', greenGlow:'rgba(var(--mf-green-rgb, 0, 255, 136),0.35)',
  danger:'var(--mf-danger,#FF3D57)', dangerDim:'var(--mf-danger,#FF3D57)', dangerGlow:'rgba(var(--mf-danger-rgb, 255, 61, 87),0.35)',
  warn:'var(--mf-warn,#FFB31A)', purple:'var(--mf-purple,#A78BFA)', blue:'var(--mf-blue,#4D7CFF)',
  t1:'var(--mf-text-1,#E8EEFF)', t2:'var(--mf-text-2,#8B9BB4)', t3:'var(--mf-text-3,#3D4F6B)', t4:'var(--mf-text-3,#64748B)',
  brd:'var(--mf-border,#1E2D45)', brdSoft:'var(--mf-border-hi,#243454)', brdBright:'var(--mf-border-hi,#334155)',
  grad:'linear-gradient(135deg, var(--mf-accent,#06E6FF), var(--mf-green,#00FF88))',
  gradBlue:'linear-gradient(135deg, var(--mf-blue,#4D7CFF), var(--mf-blue,#4D7CFF))',
  gradDanger:'linear-gradient(135deg, var(--mf-danger,#FF3D57), var(--mf-danger,#FF3D57))',
  gradWarn:'linear-gradient(135deg, var(--mf-warn,#FFB31A), var(--mf-warn,#F59E0B))',
  gradPurple:'linear-gradient(135deg, var(--mf-purple,#A78BFA), var(--mf-purple,#8B5CF6))',
};

const DEFAULT_COLUMNS = [
  { key:'select',    label:'',        visible:true, locked:true, sortable:false, width:40  },
  { key:'date',      label:'Date',    visible:true, sortable:true, width:120 },
  { key:'symbol',    label:'Symbol', visible:true, sortable:true, width:160 },
  { key:'account',   label:'Account', visible:true, sortable:true, width:160 },
  { key:'type',      label:'Type',    visible:true, sortable:true, width:80  },
  { key:'session',   label:'Session', visible:true, sortable:true, width:100 },
  { key:'bias',      label:'Bias',    visible:false, sortable:true, width:100 },
  { key:'news',      label:'News',    visible:false, sortable:true, width:90  },
  { key:'entry',     label:'Entry',   visible:true, sortable:true, width:100 },
  { key:'exit',      label:'Exit',    visible:true, sortable:true, width:100 },
  { key:'tpPercent', label:'TP%',     visible:false, sortable:true, width:90  },
  { key:'rr',        label:'RR',      visible:true, sortable:true, width:80  },
  { key:'setup',     label:'Setup',   visible:true, sortable:true, width:120 },
  { key:'psychology',label:'Psychology',visible:false, sortable:true, width:100  },
  { key:'pnl',       label:'P&L',     visible:true, sortable:true, width:100, important:true },
];
const DEFAULT_FILTERS={search:'',result:'all',symbol:'all',session:'all',bias:'all',dateFrom:'',dateTo:''};

const COLUMN_STORAGE_KEY='mf_cols_v4';
const CUSTOM_COLUMN_PREFIX='custom:';

const DEFAULT_STANDARD_COLUMNS=DEFAULT_COLUMNS.map(column=>({ ...column, source:'standard' }));

const slugifyColumnKey=(value='')=>String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'')||`field_${Date.now()}`;
const prettifyColumnLabel=(value='')=>String(value).replace(/[_-]+/g,' ').replace(/\b\w/g,char=>char.toUpperCase()).trim()||'Custom column';
const isCustomColumnKey=(key='')=>String(key).startsWith(CUSTOM_COLUMN_PREFIX);
const getCustomFieldKey=(columnOrKey='')=>{
  if(typeof columnOrKey==='object'&&columnOrKey) return columnOrKey.fieldKey||String(columnOrKey.key||'').replace(CUSTOM_COLUMN_PREFIX,'');
  return String(columnOrKey).replace(CUSTOM_COLUMN_PREFIX,'');
};
const createCustomColumn=(label,dataType='text',visible=true)=>{const fieldKey=slugifyColumnKey(label);return{key:`${CUSTOM_COLUMN_PREFIX}${fieldKey}`,fieldKey,label:prettifyColumnLabel(label),visible,sortable:true,width:140,source:'custom',dataType};};
const getTradeExtraValue=(trade,fieldKey='')=>{
  if(!fieldKey) return '';
  const extra=trade?.extra&&typeof trade.extra==='object'?trade.extra:{};
  if(extra[fieldKey]!=null&&extra[fieldKey]!=='') return extra[fieldKey];
  const looseKey=Object.keys(extra).find(key=>slugifyColumnKey(key)===fieldKey);
  if(looseKey) return extra[looseKey];
  return trade?.[fieldKey]??'';
};
const normalizeStoredColumns=(storedColumns=[])=>{
  const savedByKey=new Map((Array.isArray(storedColumns)?storedColumns:[]).map(column=>[column.key,column]));
  const standard=DEFAULT_STANDARD_COLUMNS.map(column=>savedByKey.has(column.key)?{...column,...savedByKey.get(column.key),source:'standard'}:column);
  const custom=(Array.isArray(storedColumns)?storedColumns:[])
    .filter(column=>isCustomColumnKey(column.key))
    .map(column=>{
      const base=createCustomColumn(column.label||column.fieldKey||column.key.replace(CUSTOM_COLUMN_PREFIX,''),column.dataType||'text',column.visible!==false);
      return {...base,...column,source:'custom',fieldKey:column.fieldKey||getCustomFieldKey(column.key)};
    });
  return [...standard,...custom];
};
const loadColumns=()=>{
  try{
    const raw=localStorage.getItem(COLUMN_STORAGE_KEY)||localStorage.getItem('mf_cols_v3');
    if(!raw) return DEFAULT_STANDARD_COLUMNS;
    return normalizeStoredColumns(JSON.parse(raw));
  }catch{
    return DEFAULT_STANDARD_COLUMNS;
  }
};
const upsertCustomColumns=(columns,nextColumns=[])=>{
  const existingKeys=new Set(columns.filter(column=>isCustomColumnKey(column.key)).map(column=>column.fieldKey||getCustomFieldKey(column.key)));
  const created=(nextColumns||[])
    .map(column=>{
      const label=column.label||column.fieldKey||'Custom column';
      const fieldKey=column.fieldKey||slugifyColumnKey(label);
      const dataType=column.dataType||'text';
      return { ...createCustomColumn(label,dataType,column.visible!==false), fieldKey, label:prettifyColumnLabel(label), dataType };
    })
    .filter(column=>!existingKeys.has(column.fieldKey));
  return created.length?[...columns,...created]:columns;
};
const moveColumn=(columns,key,direction)=>{
  const index=columns.findIndex(column=>column.key===key);
  if(index===-1) return columns;
  const target=index+direction;
  if(target<0||target>=columns.length) return columns;
  const next=[...columns];
  const [column]=next.splice(index,1);
  next.splice(target,0,column);
  return next;
};
const cleanExtraValues=(extra={})=>Object.fromEntries(Object.entries(extra||{}).filter(([,value])=>value!==''&&value!=null));
const createEmptyTradeForm=(customColumns=[])=>({
  date:new Date().toISOString().split('T')[0],
  time:new Date().toTimeString().slice(0,5),
  symbol:'',
  account:'',
  type:'Long',
  entry:'',
  exit:'',
  pnl:'',
  session:'NY',
  bias:'Bullish',
  newsImpact:'Low',
  sl:'',
  tp:'',
  setup:'',
  psychologyScore:80,
  notes:'',
  extra:(customColumns||[]).reduce((accumulator,column)=>({...accumulator,[getCustomFieldKey(column)]:''}),{}),
});
const mergeCustomColumnsWithExtra=(customColumns=[],extra={})=>{
  const map=new Map((customColumns||[]).map(column=>[getCustomFieldKey(column),{...column,fieldKey:getCustomFieldKey(column),label:column.label||prettifyColumnLabel(getCustomFieldKey(column)),dataType:column.dataType||'text'}]));
  Object.keys(extra||{}).forEach(key=>{if(!map.has(key)) map.set(key,{...createCustomColumn(key,'text',false),fieldKey:key,label:prettifyColumnLabel(key),dataType:'text'});});
  return Array.from(map.values());
};

const fadeInUp = {
  hidden:{ opacity:0, y:20, scale:0.97 },
  visible:(i=0)=>({ opacity:1, y:0, scale:1, transition:{ delay:i*0.04, duration:0.5, ease:[0.22,1,0.36,1] } })
};

// ══════════════════════════════════════════════════════════════════════════════
// 🔧 UTILITIES
// ══════════════════════════════════════════════════════════════════════════════
const fmt = (n,d=2) => { const num=parseFloat(n); if(isNaN(num)) return '—'; return num.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d}); };
const fmtPnl = (n,showSign=true) => { const num=parseFloat(n); if(isNaN(num)) return '—'; const abs=Math.abs(num).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}); if(!showSign) return `$${abs}`; return num>=0?`+$${abs}`:`-$${abs}`; };

const mfToNumber = (value) => {
  const numeric = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const mfToStrictNumber = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed || trimmed.includes(':')) return null;

  let normalized = trimmed.replace(/\s+/g, '').replace(/[$€£¥%]/g, '');
  if (!normalized) return null;

  const commaCount = (normalized.match(/,/g) || []).length;
  const dotCount = (normalized.match(/\./g) || []).length;

  if (commaCount && dotCount) {
    if (normalized.lastIndexOf(',') > normalized.lastIndexOf('.')) {
      normalized = normalized.replace(/\./g, '').replace(',', '.');
    } else {
      normalized = normalized.replace(/,/g, '');
    }
  } else if (commaCount === 1 && dotCount === 0) {
    normalized = normalized.replace(',', '.');
  } else if (commaCount > 1 && dotCount === 0) {
    normalized = normalized.replace(/,/g, '');
  }

  if (!/^[-+]?\d*\.?\d+$/.test(normalized)) return null;

  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : null;
};

const mfFormatNumber = (value, digits = 2) => {
  const numeric = mfToNumber(value);
  if (numeric == null) return '--';
  return numeric.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
};

const mfFormatPrice = (value, digits = 5) => {
  const numeric = mfToNumber(value);
  if (numeric == null) return '--';
  return numeric.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
};

const mfFormatMoney = (value, signed = true, digits = 2) => {
  const numeric = mfToNumber(value);
  if (numeric == null) return '--';
  const absolute = Math.abs(numeric).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  if (!signed) return `$${absolute}`;
  if (numeric > 0) return `+$${absolute}`;
  if (numeric < 0) return `-$${absolute}`;
  return `$${absolute}`;
};

const mfFormatPercent = (value, digits = 1) => {
  const numeric = mfToStrictNumber(value);
  if (numeric == null) return '--';
  return `${numeric.toFixed(digits)}%`;
};

const mfFormatFactor = (value) => {
  const numeric = typeof value === 'number' ? value : mfToStrictNumber(value);
  if (numeric == null) return '--';
  if (!Number.isFinite(numeric)) return '∞';
  return `${numeric.toFixed(2)}x`;
};

const mfFormatRR = (value) => {
  const numeric = mfToStrictNumber(value);
  if (numeric == null) return '--';
  return `1:${numeric.toFixed(2)}`;
};

const mfFormatDate = (value) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const mfFormatTime = (value) => {
  if (!value) return '--';
  const raw = String(value).trim();
  const hhmm = raw.match(/^(\d{1,2}):(\d{2})/);
  if (hhmm) return `${hhmm[1].padStart(2, '0')}:${hhmm[2]}`;
  const date = new Date(`1970-01-01T${raw}`);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

const mfAccountLabel = (trade = {}) => trade.account || trade.accountLabel || trade.extra?.account || '';

const mfSessionLabel = (value = '') => {
  if (value === 'NY') return 'New York';
  if (value === 'Asia') return 'Tokyo / Asia';
  if (value === 'London') return 'London';
  return value || '--';
};

const exportToCSV = (data,filename='trades.csv') => {
  if(!data?.length){toast.error('No data to export');return;}
  try{
    const headers=Object.keys(data[0]);
    const rows=data.map(row=>headers.map(h=>{const v=row[h];if(v==null)return'';const s=String(v);return s.includes(',')||s.includes('"')||s.includes('\n')?`"${s.replace(/"/g,'""')}"`:s;}).join(','));
    const blob=new Blob(['\uFEFF'+[headers.join(','),...rows].join('\n')],{type:'text/csv;charset=utf-8;'});
    const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);
    toast.success(`CSV export successful! (${data.length} trades)`);
  }catch(e){toast.error('CSV export error');}
};

const filterTrades=(trades,filters)=>trades.filter(t=>{
  // Adapt Supabase fields vs local fields
  const symbol   = t.symbol   || '';
  const type     = t.direction || t.type || '';
  const setup    = t.setup    || '';
  const notes    = t.notes    || '';
  const account  = t.account  || t.extra?.account || '';
  const pnl      = t.profit_loss ?? t.pnl ?? 0;
  const session  = t.session  || '';
  const bias     = t.bias     || '';
  const date     = t.open_date?.split('T')[0] || t.date || '';

  if(filters.search){const q=filters.search.toLowerCase();if(!symbol.toLowerCase().includes(q)&&!type.toLowerCase().includes(q)&&!setup.toLowerCase().includes(q)&&!notes.toLowerCase().includes(q)&&!account.toLowerCase().includes(q))return false;}
  if(filters.result&&filters.result!=='all'){const win=parseFloat(pnl)>0;if(filters.result==='wins'&&!win)return false;if(filters.result==='losses'&&win)return false;if(filters.result==='long'&&type!=='Long')return false;if(filters.result==='short'&&type!=='Short')return false;}
  if(filters.symbol&&filters.symbol!=='all'&&symbol!==filters.symbol)return false;
  if(filters.session&&filters.session!=='all'&&session!==filters.session)return false;
  if(filters.bias&&filters.bias!=='all'&&bias!==filters.bias)return false;
  if(filters.dateFrom&&date<filters.dateFrom)return false;
  if(filters.dateTo&&date>filters.dateTo)return false;
  return true;
});

const sortTrades=(trades,key,dir)=>{
  if(!key)return trades;
  return[...trades].sort((a,b)=>{
    // Compatibility Supabase fields
    const getVal=(t,k)=>{
      if(isCustomColumnKey(k)){
        const raw=getTradeExtraValue(t,getCustomFieldKey(k));
        const numeric=mfToStrictNumber(raw);
        return raw!==''&&raw!=null&&numeric!=null?numeric:String(raw||'');
      }
      if(k==='pnl') return parseFloat(t.profit_loss??t.pnl??0)||0;
      if(k==='date') return new Date(t.open_date||t.date||'').getTime();
      if(k==='symbol') return t.symbol||'';
      if(k==='account') return t.account||t.extra?.account||'';
      if(k==='type') return t.direction||t.type||'';
      if(k==='session') return t.session||'';
      if(k==='bias') return t.bias||'';
      if(k==='entry') return mfToNumber(t.entry_price??t.entry) ?? Number.NEGATIVE_INFINITY;
      if(k==='exit') return mfToNumber(t.exit_price??t.exit) ?? Number.NEGATIVE_INFINITY;
      if(k==='tpPercent') return mfToStrictNumber(t.metrics?.tpPercent) ?? Number.NEGATIVE_INFINITY;
      if(k==='rr') return mfToStrictNumber(t.metrics?.rrReel) ?? Number.NEGATIVE_INFINITY;
      if(k==='psychology') return mfToNumber(t.psychologyScore) ?? Number.NEGATIVE_INFINITY;
      return t[k]||'';
    };
    let av=getVal(a,key),bv=getVal(b,key);
    if(av<bv)return dir==='asc'?-1:1;if(av>bv)return dir==='asc'?1:-1;return 0;
  });
};

const calcStats=(trades)=>{
  if(!trades?.length)return{total:0,wins:0,losses:0,winRate:0,totalPnL:0,avgRR:0,pf:0,maxDD:0};
  const getPnl=t=>parseFloat(t.profit_loss??t.pnl??0)||0;
  const wins=trades.filter(t=>getPnl(t)>0);
  const totalPnL=trades.reduce((s,t)=>s+getPnl(t),0);
  const rrs=trades.map(t=>parseFloat(t.metrics?.rrReel||0)).filter(r=>r>0);
  const avgRR=rrs.length?(rrs.reduce((s,r)=>s+r,0)/rrs.length).toFixed(2):0;
  const grossW=wins.reduce((s,t)=>s+getPnl(t),0);
  const grossL=Math.abs(trades.filter(t=>!wins.includes(t)).reduce((s,t)=>s+getPnl(t),0));
  const pf=grossL>0?(grossW/grossL).toFixed(2):grossW>0?'∞':'0.00';
  let peak=0,eq=0,dd=0;
  [...trades].sort((a,b)=>(a.open_date||a.date||'').localeCompare(b.open_date||b.date||'')).forEach(t=>{eq+=getPnl(t);if(eq>peak)peak=eq;const d=peak>0?((peak-eq)/peak)*100:0;if(d>dd)dd=d;});
  return{total:trades.length,wins:wins.length,losses:trades.length-wins.length,winRate:trades.length?(wins.length/trades.length)*100:0,totalPnL,avgRR,pf,maxDD:dd};
};

const calcLedgerStats=(trades=[])=>{
  if(!trades?.length)return{total:0,wins:0,losses:0,breakeven:0,winRate:0,totalPnL:0,avgRR:null,pf:null,maxDD:0};
  const getPnl=trade=>mfToNumber(trade.profit_loss??trade.pnl)??0;
  const wins=trades.filter(trade=>getPnl(trade)>0);
  const losses=trades.filter(trade=>getPnl(trade)<0);
  const breakeven=trades.filter(trade=>getPnl(trade)===0);
  const totalPnL=trades.reduce((sum,trade)=>sum+getPnl(trade),0);
  const rrs=trades.map(trade=>mfToStrictNumber(trade.metrics?.rrReel)).filter(value=>value!=null&&value>0);
  const avgRR=rrs.length?rrs.reduce((sum,value)=>sum+value,0)/rrs.length:null;
  const grossW=wins.reduce((sum,trade)=>sum+getPnl(trade),0);
  const grossL=Math.abs(losses.reduce((sum,trade)=>sum+getPnl(trade),0));
  const pf=grossL>0?(grossW/grossL):grossW>0?Number.POSITIVE_INFINITY:0;
  let peak=0;
  let equity=0;
  let dd=0;
  [...trades].sort((a,b)=>(a.open_date||a.date||'').localeCompare(b.open_date||b.date||'')).forEach(trade=>{
    equity += getPnl(trade);
    if(equity>peak) peak=equity;
    const drawdown=peak>0?((peak-equity)/peak)*100:0;
    if(drawdown>dd) dd=drawdown;
  });
  return{
    total:trades.length,
    wins:wins.length,
    losses:losses.length,
    breakeven:breakeven.length,
    winRate:trades.length?(wins.length/trades.length)*100:0,
    totalPnL,
    avgRR,
    pf,
    maxDD:dd,
  };
};

const toTradeFormData=(trade={})=>({
  ...trade,
  date:trade.date||trade.open_date?.split('T')[0]||new Date().toISOString().split('T')[0],
  time:trade.time||'',
  symbol:trade.symbol||'',
  account:trade.account||trade.extra?.account||trade.accountLabel||'',
  type:trade.type||trade.direction||'Long',
  entry:trade.entry??trade.entry_price??'',
  exit:trade.exit??trade.exit_price??'',
  sl:trade.sl??trade.stop_loss??'',
  tp:trade.tp??trade.take_profit??'',
  pnl:trade.pnl??trade.profit_loss??'',
  marketType:trade.marketType??trade.market_type??'',
  newsImpact:trade.newsImpact??trade.news_impact??'Low',
  psychologyScore:trade.psychologyScore??trade.psychology_score??80,
  extra:trade.extra&&typeof trade.extra==='object'?trade.extra:{},
});

// ══════════════════════════════════════════════════════════════════════════════
// 🧩 UI ATOMS
// ══════════════════════════════════════════════════════════════════════════════
const ICON_STRIP_RE=/^(📰|✅|❌|🐂|🐻|↗|↘|📅|📊|💰|⚖️|🎯|📍|🏁|🛑|✨|⚡|🔄|📦|💸|🌍|🧠|📝|📎|✏️|🗑️|📋|🤖)\s*/u;

const IconGlyph=({name,color='currentColor',size=12})=>{
  if(!name) return null;
  const common={width:size,height:size,viewBox:'0 0 16 16',fill:'none',stroke:color,strokeWidth:'1.4',strokeLinecap:'round',strokeLinejoin:'round'};
  switch(name){
    case '📰': return(<svg {...common}><rect x="2" y="2.5" width="12" height="11" rx="1.5"/><path d="M5 5.5h6"/><path d="M5 8h6"/><path d="M5 10.5h4"/><path d="M3.8 5.5h.01"/><path d="M3.8 8h.01"/></svg>);
    case '✅': return(<svg {...common}><circle cx="8" cy="8" r="6"/><path d="M5.2 8l1.8 1.8 3.8-4"/></svg>);
    case '❌': return(<svg {...common}><circle cx="8" cy="8" r="6"/><path d="M6 6l4 4"/><path d="M10 6l-4 4"/></svg>);
    case '🐂':
    case '↗': return(<svg {...common}><path d="M3 11.5l10-8"/><path d="M8.5 3.5H13V8"/></svg>);
    case '🐻':
    case '↘': return(<svg {...common}><path d="M3 4.5l10 8"/><path d="M8.5 12.5H13V8"/></svg>);
    case '📅': return(<svg {...common}><rect x="2.5" y="3.5" width="11" height="10" rx="1.8"/><path d="M5 2.5v2"/><path d="M11 2.5v2"/><path d="M2.5 6.5h11"/></svg>);
    case '📊': return(<svg {...common}><path d="M2.5 13.5h11"/><path d="M4.5 11V7.5"/><path d="M8 11V4.5"/><path d="M11.5 11V6"/></svg>);
    case '💰': return(<svg {...common}><circle cx="8" cy="8" r="5.5"/><path d="M8 5.2v5.6"/><path d="M10.2 6.4c0-.7-.8-1.2-2.2-1.2s-2.2.5-2.2 1.2.8 1.1 2.2 1.1 2.2.4 2.2 1.1-.8 1.2-2.2 1.2-2.2-.5-2.2-1.2"/></svg>);
    case '⚖️': return(<svg {...common}><path d="M8 3v10"/><path d="M5 5h6"/><path d="M4.5 5L2.8 8.3a1.8 1.8 0 003.4 0z"/><path d="M11.5 5l-1.7 3.3a1.8 1.8 0 003.4 0z"/><path d="M5 13h6"/></svg>);
    case '🎯': return(<svg {...common}><circle cx="8" cy="8" r="5.5"/><circle cx="8" cy="8" r="3.3"/><circle cx="8" cy="8" r="1.2"/></svg>);
    case '📍': return(<svg {...common}><path d="M8 13s3.5-3.5 3.5-6A3.5 3.5 0 104.5 7C4.5 9.5 8 13 8 13z"/><circle cx="8" cy="7" r="1.4"/></svg>);
    case '🏁': return(<svg {...common}><path d="M4 13.5v-11"/><path d="M4 3.5c1.6-1 3.2 1 4.8 0s3.2-1 4.8 0v5c-1.6-1-3.2 1-4.8 0s-3.2-1-4.8 0"/></svg>);
    case '🛑': return(<svg {...common}><path d="M5 2.5h6l2.5 2.5v6L11 13.5H5L2.5 11V5z"/></svg>);
    case '✨': return(<svg {...common}><path d="M8 2.5l1.1 3.4L12.5 7l-3.4 1.1L8 11.5 6.9 8.1 3.5 7l3.4-1.1z"/></svg>);
    case '⚡': return(<svg {...common}><path d="M8.8 2.5L4.6 8h2.4L6.8 13.5 11 8H8.6z"/></svg>);
    case '🔄': return(<svg {...common}><path d="M12.5 6A4.8 4.8 0 004 4.1"/><path d="M4.2 1.8v2.6h2.6"/><path d="M3.5 10A4.8 4.8 0 0012 11.9"/><path d="M11.8 14.2v-2.6H9.2"/></svg>);
    case '📦': return(<svg {...common}><path d="M3.2 5.2L8 2.5l4.8 2.7v5.6L8 13.5l-4.8-2.7z"/><path d="M8 2.5v5.7"/><path d="M3.2 5.2L8 7.9l4.8-2.7"/></svg>);
    case '💸': return(<svg {...common}><rect x="2.5" y="4" width="11" height="8" rx="1.6"/><path d="M5 8h6"/><path d="M8 5.8v4.4"/><path d="M12.5 2.5l-1.6 1.2"/><path d="M9.8 2.5h2.7v2.7"/></svg>);
    case '🌍': return(<svg {...common}><circle cx="8" cy="8" r="5.8"/><path d="M2.5 8h11"/><path d="M8 2.2a8.6 8.6 0 010 11.6"/><path d="M8 2.2a8.6 8.6 0 000 11.6"/></svg>);
    case '🧠': return(<svg {...common}><path d="M6 3.2A2.3 2.3 0 018.3 1a2.4 2.4 0 012.3 2.2 2.2 2.2 0 012.1 2.2 2.2 2.2 0 01-.8 1.7 2.2 2.2 0 01-.2 3.9A2.4 2.4 0 019.6 13H6.2A2.2 2.2 0 014 10.9 2.1 2.1 0 013 9a2.2 2.2 0 011-1.9A2.2 2.2 0 014 4.8a2.2 2.2 0 012-1.6z"/><path d="M6.8 5.2v5.6"/><path d="M9.3 5.2v5.6"/></svg>);
    case '📝': return(<svg {...common}><path d="M3 13h2.6l6.2-6.2-2.6-2.6L3 10.4z"/><path d="M8.6 3.8l2.6 2.6"/><path d="M2.5 13.5h11"/></svg>);
    case '📎': return(<svg {...common}><path d="M5.5 8.5l3.9-3.9a2 2 0 112.8 2.8l-5.1 5.1a3 3 0 11-4.2-4.2l5-5"/></svg>);
    case '✏️': return(<svg {...common}><path d="M3 13l2.5-.5 6.1-6.1-2-2L3.5 10.5z"/><path d="M8.9 3.9l2 2"/></svg>);
    case '🗑️': return(<svg {...common}><path d="M3.5 4.5h9"/><path d="M5.2 4.5V3h5.6v1.5"/><path d="M5 6.5v5"/><path d="M8 6.5v5"/><path d="M11 6.5v5"/><path d="M4.5 4.5l.5 8h6l.5-8"/></svg>);
    case '📋': return(<svg {...common}><rect x="3" y="3" width="10" height="11" rx="1.5"/><path d="M5.5 3V2h5v1"/><path d="M5.5 6h5"/><path d="M5.5 8.5h5"/><path d="M5.5 11h3.5"/></svg>);
    case '🤖': return(<svg {...common}><rect x="3.2" y="4.2" width="9.6" height="7.8" rx="2"/><path d="M8 2.2v2"/><path d="M5.8 7.3h.01"/><path d="M10.2 7.3h.01"/><path d="M6.2 10h3.6"/></svg>);
    case '•': return(<svg {...common}><circle cx="8" cy="8" r="1.6" fill={color} stroke="none"/></svg>);
    default: return null;
  }
};

const splitIconLabel=(value='')=>{
  const text=String(value||'');
  const match=text.match(ICON_STRIP_RE);
  return{icon:match?.[1]||'',text:text.replace(ICON_STRIP_RE,'').trim()};
};

const Tag=({label,color,bg,icon})=>{
  const parsed=splitIconLabel(label);
  const glyph=icon||parsed.icon;
  return(
    <span style={{display:'inline-flex',alignItems:'center',gap:6,padding:'3px 9px',borderRadius:5,fontSize:11,fontWeight:700,whiteSpace:'nowrap',color,backgroundColor:bg,border:`1px solid ${shade(color,'30')}`}}>
      {glyph&&<IconGlyph name={glyph} color={color} size={11}/>}
      <span>{parsed.text||label}</span>
    </span>
  );
};

const GlassBtn=({children,onClick,variant='default',disabled,loading,size='md',fullWidth,icon})=>{
  const[ripples,setRipples]=useState([]);
  const V={default:{bg:C.bgGlass,border:C.brd,color:C.t2,shadow:'none'},primary:{bg:C.grad,border:'transparent',color:C.bgDeep,shadow:`0 6px 24px ${C.cyanGlow}`},danger:{bg:'rgba(var(--mf-danger-rgb, 255, 61, 87),0.1)',border:C.danger,color:C.danger,shadow:'none'},ghost:{bg:'transparent',border:'transparent',color:C.t2,shadow:'none'},cyan:{bg:'rgba(var(--mf-accent-rgb, 6, 230, 255),0.08)',border:C.cyan,color:C.cyan,shadow:'none'}};
  const S={sm:{padding:'6px 12px',fontSize:11},md:{padding:'9px 16px',fontSize:12},lg:{padding:'12px 20px',fontSize:13}};
  const v=V[variant]||V.default;const s=S[size]||S.md;
  const addRipple=(e)=>{if(disabled||loading)return;const r=e.currentTarget.getBoundingClientRect();const rpl={x:e.clientX-r.left,y:e.clientY-r.top,id:Date.now()};setRipples(p=>[...p,rpl]);setTimeout(()=>setRipples(p=>p.filter(x=>x.id!==rpl.id)),800);onClick?.(e);};
  return(<motion.button onClick={addRipple} disabled={disabled||loading} whileHover={!disabled&&!loading?{scale:1.02,y:-1}:{}} whileTap={!disabled&&!loading?{scale:0.97}:{}} style={{position:'relative',display:'inline-flex',alignItems:'center',justifyContent:'center',gap:7,...s,borderRadius:8,background:v.bg,border:`1px solid ${v.border}`,color:v.color,fontWeight:600,cursor:disabled||loading?'not-allowed':'pointer',opacity:disabled?0.5:1,backdropFilter:'blur(10px)',boxShadow:v.shadow,overflow:'hidden',transition:'all 0.25s cubic-bezier(0.4,0,0.2,1)',fontFamily:'inherit',width:fullWidth?'100%':'auto'}}><AnimatePresence>{ripples.map(rpl=>(<motion.span key={rpl.id} initial={{scale:0,opacity:0.5}} animate={{scale:5,opacity:0}} exit={{opacity:0}} transition={{duration:0.7}} style={{position:'absolute',left:rpl.x,top:rpl.y,width:20,height:20,borderRadius:'50%',backgroundColor:variant==='primary'?'rgba(255,255,255,0.35)':C.cyan,pointerEvents:'none',transform:'translate(-50%,-50%)'}}/>))}</AnimatePresence>{variant==='primary'&&(<motion.div animate={{backgroundPosition:['200% 0','-200% 0']}} transition={{duration:6,repeat:Infinity,ease:'linear'}} style={{position:'absolute',inset:0,background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)',backgroundSize:'200% 100%',pointerEvents:'none'}}/>)}{loading&&(<motion.div animate={{rotate:360}} transition={{duration:1,repeat:Infinity,ease:'linear'}} style={{width:14,height:14,border:`2px solid ${variant==='primary'?C.bgDeep:C.cyan}`,borderTopColor:'transparent',borderRadius:'50%'}}/>)}{!loading&&icon&&<IconGlyph name={icon} color={v.color} size={12}/>}<span>{children}</span></motion.button>);
};

const AccountScopePills=({options=[],activeAccount='all',onChange})=>(
  <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:2}}>
    {(options||[]).map(option=>(
      <button
        key={option.id}
        type="button"
        onClick={()=>onChange?.(option.id)}
        style={{
          padding:'9px 12px',
          borderRadius:14,
          border:`1px solid ${activeAccount===option.id?shade(C.cyan,'28'):C.brd}`,
          background:activeAccount===option.id?'rgba(var(--mf-accent-rgb, 6, 230, 255),0.1)':'rgba(255,255,255,0.02)',
          color:activeAccount===option.id?C.t1:C.t2,
          cursor:'pointer',
          fontFamily:'inherit',
          display:'inline-flex',
          alignItems:'center',
          gap:10,
          whiteSpace:'nowrap',
        }}
      >
        <span style={{fontSize:11,fontWeight:800}}>{option.label}</span>
        <span style={{padding:'3px 7px',borderRadius:999,border:`1px solid ${shade(activeAccount===option.id?C.cyan:C.t3,'20')}`,fontSize:10,fontWeight:800,color:activeAccount===option.id?C.cyan:C.t3,fontFamily:'monospace'}}>
          {option.count}
        </span>
      </button>
    ))}
  </div>
);

const DangerConfirmModal=({isOpen,onClose,onConfirm,title,body,confirmLabel='Delete permanently',loading=false})=>{
  const[step,setStep]=useState(1);
  const[input,setInput]=useState('');
  useEffect(()=>{if(!isOpen){setStep(1);setInput('');}},[isOpen]);
  if(!isOpen) return null;
  const ready=input.trim().toUpperCase()==='DELETE';
  return(
    <AnimatePresence>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.72)',backdropFilter:'blur(6px)',zIndex:430}} onClick={onClose}/>
      <motion.div initial={{opacity:0,y:20,scale:0.98}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:20,scale:0.98}} transition={{duration:0.2}} style={{position:'fixed',inset:0,zIndex:431,display:'flex',alignItems:'center',justifyContent:'center',padding:22}}>
        <div onClick={event=>event.stopPropagation()} style={{width:'min(520px,100%)',borderRadius:24,border:`1px solid ${shade(C.danger,'24')}`,background:'linear-gradient(180deg, rgba(10,17,28,0.98), rgba(8,13,22,0.98))',boxShadow:'0 36px 90px rgba(0,0,0,0.5)',overflow:'hidden'}}>
          <div style={{padding:'22px 24px 18px',borderBottom:`1px solid ${C.brd}`}}>
            <div style={{fontSize:10,color:C.danger,fontWeight:800,letterSpacing:'0.16em',textTransform:'uppercase'}}>Permanent action</div>
            <div style={{marginTop:8,fontSize:28,fontWeight:900,color:C.t1,letterSpacing:'-0.04em'}}>{title}</div>
            <div style={{marginTop:10,fontSize:13,color:C.t2,lineHeight:1.7}}>{body}</div>
          </div>
          <div style={{padding:24}}>
            {step===1?(
              <div style={{display:'grid',gap:12}}>
                <div style={{padding:'12px 14px',borderRadius:16,border:`1px solid ${shade(C.danger,'20')}`,background:'rgba(var(--mf-danger-rgb, 255, 61, 87),0.06)',fontSize:12,color:C.t2,lineHeight:1.7}}>
                  This cannot be undone. MarketFlow will remove the journal entries permanently from your account.
                </div>
                <div style={{display:'flex',justifyContent:'flex-end',gap:10}}>
                  <GlassBtn onClick={onClose}>Cancel</GlassBtn>
                  <GlassBtn variant="danger" onClick={()=>setStep(2)}>I understand</GlassBtn>
                </div>
              </div>
            ):(
              <div style={{display:'grid',gap:12}}>
                <div style={{fontSize:11,color:C.t3,fontWeight:800,letterSpacing:'0.14em',textTransform:'uppercase'}}>Type DELETE to confirm</div>
                <input value={input} onChange={event=>setInput(event.target.value)} placeholder="DELETE" style={{width:'100%',padding:'13px 14px',borderRadius:14,border:`1px solid ${ready?shade(C.danger,'28'):C.brd}`,background:C.bgDeep,color:C.t1,fontSize:13,outline:'none',fontFamily:'inherit'}}/>
                <div style={{display:'flex',justifyContent:'space-between',gap:10}}>
                  <GlassBtn onClick={()=>setStep(1)}>Back</GlassBtn>
                  <GlassBtn variant="danger" loading={loading} disabled={!ready||loading} onClick={onConfirm}>{confirmLabel}</GlassBtn>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

const InfoHint=({text,align='left'})=>{
  const[open,setOpen]=useState(false);
  return(
    <div style={{position:'relative',display:'inline-flex'}} onClick={e=>e.stopPropagation()}>
      <button
        type="button"
        onClick={()=>setOpen(v=>!v)}
        style={{
          width:18,
          height:18,
          borderRadius:'50%',
          border:`1px solid ${shade(C.cyan,'24')}`,
          background:'rgba(var(--mf-accent-rgb, 6, 230, 255),0.06)',
          color:C.cyan,
          fontSize:10,
          fontWeight:800,
          cursor:'pointer',
          display:'inline-flex',
          alignItems:'center',
          justifyContent:'center',
          fontFamily:'inherit',
        }}
      >
        i
      </button>
      <AnimatePresence>
        {open&&(
          <motion.div
            initial={{opacity:0,y:6}}
            animate={{opacity:1,y:0}}
            exit={{opacity:0,y:6}}
            transition={{duration:0.16}}
            style={{
              position:'absolute',
              top:26,
              [align]:0,
              width:260,
              padding:'10px 12px',
              borderRadius:12,
              border:`1px solid ${C.brd}`,
              background:'rgba(9,15,24,0.96)',
              color:C.t2,
              fontSize:11,
              lineHeight:1.6,
              boxShadow:'0 18px 34px rgba(0,0,0,0.28)',
              zIndex:20,
            }}
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FilterBar=({filters,setFilters,trades,onReset,compact=false})=>{
  const symbols=useMemo(()=>[...new Set(trades.map(t=>t.symbol).filter(Boolean))].sort(),[trades]);
  const activeCount=[filters.search,filters.result!=='all'&&filters.result,filters.symbol!=='all'&&filters.symbol,filters.session!=='all'&&filters.session,filters.bias!=='all'&&filters.bias,filters.dateFrom,filters.dateTo].filter(Boolean).length;
  const iStyle={padding:compact?'8px 10px':'10px 12px',borderRadius:compact?10:12,border:`1px solid ${C.brd}`,backgroundColor:'rgba(6,10,18,0.88)',color:C.t1,fontSize:compact?11:12,outline:'none',fontFamily:'inherit',cursor:'pointer',minHeight:compact?36:40};
  const resultFilters=[{id:'all',label:'All'},{id:'wins',label:'Winners'},{id:'losses',label:'Losers'},{id:'long',label:'Long'},{id:'short',label:'Short'}];
  return(
    <motion.div variants={fadeInUp} initial="hidden" animate="visible" style={{background:'linear-gradient(180deg, rgba(11,18,30,0.92), rgba(8,13,22,0.96))',border:`1px solid ${C.brd}`,borderRadius:compact?18:20,padding:compact?'12px':'16px 16px 14px',marginBottom:compact?0:14,boxShadow:compact?'none':'0 18px 34px rgba(0,0,0,0.16)'}}>
      {activeCount>0&&(
        <div style={{display:'flex',justifyContent:compact?'flex-end':'space-between',alignItems:'flex-start',gap:12,flexWrap:'wrap',marginBottom:12}}>
          <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
            {activeCount>0&&<div style={{padding:compact?'6px 8px':'8px 10px',borderRadius:999,border:`1px solid ${shade(C.cyan,'24')}`,background:'rgba(var(--mf-accent-rgb, 6, 230, 255),0.08)',fontSize:10,fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase',color:C.cyan}}>{activeCount} active</div>}
            {activeCount>0&&(<GlassBtn size="sm" variant="danger" onClick={onReset}>Clear filters</GlassBtn>)}
          </div>
        </div>
      )}
      <div style={{display:'flex',gap:compact?8:10,alignItems:'center',flexWrap:'wrap',marginBottom:compact?0:10}}>
        <input type="text" placeholder="Search symbol, setup, or notes" value={filters.search||''} onChange={e=>setFilters({...filters,search:e.target.value})} style={{...iStyle,flex:'1 1 280px',cursor:'text'}}/>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {resultFilters.map(option=>(
            <button key={option.id} onClick={()=>setFilters({...filters,result:option.id})} style={{minHeight:compact?34:38,padding:compact?'0 10px':'0 12px',borderRadius:compact?10:11,border:`1px solid ${filters.result===option.id ? shade(C.cyan,'34') : C.brd}`,background:filters.result===option.id ? 'rgba(var(--mf-accent-rgb, 6, 230, 255),0.12)' : 'rgba(255,255,255,0.02)',color:filters.result===option.id ? C.cyan : C.t2,fontSize:11,fontWeight:800,letterSpacing:'0.04em',cursor:'pointer'}}>
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{display:'flex',gap:compact?8:10,alignItems:'center',flexWrap:'wrap'}}>
        {symbols.length>0&&(
          <select value={filters.symbol||'all'} onChange={e=>setFilters({...filters,symbol:e.target.value})} style={{...iStyle,minWidth:150}}>
            <option value="all">All symbols</option>
            {symbols.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        )}
        <select value={filters.session||'all'} onChange={e=>setFilters({...filters,session:e.target.value})} style={{...iStyle,minWidth:140}}>
          <option value="all">All sessions</option>
          {['NY','London','Asia'].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filters.bias||'all'} onChange={e=>setFilters({...filters,bias:e.target.value})} style={{...iStyle,minWidth:140}}>
          <option value="all">All bias</option>
          {['Bullish','Bearish','Neutral'].map(b=><option key={b} value={b}>{b}</option>)}
        </select>
        <input type="date" value={filters.dateFrom||''} onChange={e=>setFilters({...filters,dateFrom:e.target.value})} style={{...iStyle,cursor:'text'}}/>
        <input type="date" value={filters.dateTo||''} onChange={e=>setFilters({...filters,dateTo:e.target.value})} style={{...iStyle,cursor:'text'}}/>
      </div>
    </motion.div>
  );
};

const TradeRow=React.memo(({trade,isSelected,onSelect,onClickDetail,onDoubleClickEdit,cols,cumulativePnl})=>{
  const[hov,setHov]=useState(false);
  const pnl    = mfToNumber(trade.profit_loss??trade.pnl)??0;
  const isWin  = pnl>=0;
  const symbol = trade.symbol||'';
  const type   = trade.direction||trade.type||'Long';
  const entry  = mfToNumber(trade.entry_price??trade.entry);
  const exit   = mfToNumber(trade.exit_price??trade.exit);
  const date   = trade.open_date?.split('T')[0]||trade.date||'';
  const psychology = mfToNumber(trade.psychologyScore ?? trade.psychology_score);
  const accountLabel = mfAccountLabel(trade);
  const rrValue = mfToStrictNumber(trade.metrics?.rrReel);
  const tpProgress = mfToStrictNumber(trade.metrics?.tpPercent);
  const runningPnl = cumulativePnl!=null ? mfFormatMoney(cumulativePnl) : '--';
  const rowBg  = isSelected?'rgba(var(--mf-accent-rgb, 6, 230, 255),0.09)':hov?'rgba(255,255,255,0.026)':isWin?'rgba(var(--mf-green-rgb, 0, 255, 136),0.018)':'rgba(var(--mf-danger-rgb, 255, 61, 87),0.018)';

  const cell=(key)=>{
    switch(key){
      case 'date':return(<div><div style={{color:C.t1,fontSize:12,fontWeight:700}}>{mfFormatDate(date)}</div><div style={{color:C.t3,fontSize:10.5,marginTop:2}}>{mfFormatTime(trade.time)}</div></div>);
      case 'symbol':return(<div style={{display:'flex',alignItems:'center',gap:10}}><div style={{width:32,height:32,borderRadius:10,background:'linear-gradient(135deg, rgba(var(--mf-accent-rgb, 6, 230, 255),0.18), rgba(var(--mf-accent-rgb, 6, 230, 255),0.04))',border:`1px solid ${shade(C.cyan,'26')}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:900,color:C.cyan,flexShrink:0}}>{symbol.substring(0,3)||'--'}</div><div><div style={{color:C.t1,fontSize:12.5,fontWeight:800,letterSpacing:'0.01em'}}>{symbol||'--'}</div><div style={{color:C.t3,fontSize:10.5,marginTop:2}}>{trade.setup||accountLabel||trade.marketType||'Execution'}</div></div></div>);
      case 'account':return accountLabel?<Tag label={accountLabel} color={C.blue} bg="rgba(var(--mf-blue-rgb, 77, 124, 255),0.1)"/>:<span style={{color:C.t3,fontSize:11}}>--</span>;
      case 'type':return<Tag label={type==='Long'?'Long':'Short'} color={type==='Long'?C.green:C.danger} bg={type==='Long'?'rgba(var(--mf-green-rgb, 0, 255, 136),0.1)':'rgba(var(--mf-danger-rgb, 255, 61, 87),0.1)'}/>;
      case 'session':return<Tag label={mfSessionLabel(trade.session)} color={C.cyan} bg="rgba(var(--mf-accent-rgb, 6, 230, 255),0.08)"/>;
      case 'bias':return<Tag label={trade.bias||'--'} color={trade.bias==='Bullish'?C.green:trade.bias==='Bearish'?C.danger:C.t2} bg={trade.bias==='Bullish'?'rgba(var(--mf-green-rgb, 0, 255, 136),0.08)':trade.bias==='Bearish'?'rgba(var(--mf-danger-rgb, 255, 61, 87),0.08)':'rgba(255,255,255,0.04)'}/>;
      case 'news':return<Tag label={trade.newsImpact||'--'} color={trade.newsImpact==='High'?C.danger:trade.newsImpact==='Medium'?C.warn:C.teal} bg={trade.newsImpact==='High'?'rgba(var(--mf-danger-rgb, 255, 61, 87),0.1)':trade.newsImpact==='Medium'?'rgba(var(--mf-warn-rgb, 255, 179, 26),0.1)':'rgba(var(--mf-teal-rgb, 0, 245, 212),0.1)'}/>;
      case 'entry':return<span style={{color:C.t1,fontSize:12,fontFamily:'monospace'}}>{mfFormatPrice(entry)}</span>;
      case 'exit':return<span style={{color:C.t1,fontSize:12,fontFamily:'monospace'}}>{mfFormatPrice(exit)}</span>;
      case 'tpPercent':{if(tpProgress==null)return<span style={{color:C.t3}}>--</span>;return<Tag label={mfFormatPercent(tpProgress,1)} color={tpProgress>=80?C.green:tpProgress>=50?C.warn:C.danger} bg={tpProgress>=80?'rgba(var(--mf-green-rgb, 0, 255, 136),0.1)':tpProgress>=50?'rgba(var(--mf-warn-rgb, 255, 179, 26),0.1)':'rgba(var(--mf-danger-rgb, 255, 61, 87),0.1)'}/>;}
      case 'rr':return rrValue==null?<span style={{color:C.t3}}>--</span>:<Tag label={mfFormatRR(rrValue)} color={C.teal} bg="rgba(var(--mf-teal-rgb, 0, 245, 212),0.1)"/>;
      case 'setup':return trade.setup?<Tag label={trade.setup} color={C.purple} bg="rgba(167,139,250,0.1)"/>:<span style={{color:C.t3}}>--</span>;
      case 'psychology':{const s=psychology;if(s==null)return<span style={{color:C.t3}}>--</span>;return<Tag label={Math.round(s)} color={s>=80?C.green:s>=60?C.warn:C.danger} bg={s>=80?'rgba(var(--mf-green-rgb, 0, 255, 136),0.08)':s>=60?'rgba(var(--mf-warn-rgb, 255, 179, 26),0.08)':'rgba(var(--mf-danger-rgb, 255, 61, 87),0.08)'}/>;}
      case 'pnl':return(<div><div style={{color:isWin?C.green:C.danger,fontSize:13,fontWeight:900,fontFamily:'monospace',letterSpacing:'-0.02em'}}>{mfFormatMoney(pnl)}</div>{cumulativePnl!=null&&(<div style={{color:C.t3,fontSize:9.5,fontWeight:700,marginTop:3}}>Running {runningPnl}</div>)}</div>);
      default:
        if(isCustomColumnKey(key)){
          const value=getTradeExtraValue(trade,getCustomFieldKey(key));
          if(value==null||value==='') return<span style={{color:C.t3,fontSize:11}}>--</span>;
          const numeric=mfToStrictNumber(value);
          return <span style={{color:C.t1,fontSize:12,fontFamily:numeric!=null?'monospace':'inherit'}}>{numeric!=null?mfFormatNumber(numeric,2):String(value)}</span>;
        }
        return<span style={{color:C.t3,fontSize:11}}>--</span>;
    }
  };
  return(<motion.tr initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}} transition={{duration:0.15}} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} onClick={onClickDetail} onDoubleClick={()=>onDoubleClickEdit(trade)} style={{backgroundColor:rowBg,borderLeft:`2px solid ${isSelected?C.cyan:isWin?'rgba(var(--mf-green-rgb, 0, 255, 136),0.14)':'rgba(var(--mf-danger-rgb, 255, 61, 87),0.14)'}`,cursor:'pointer',transition:'all 0.12s ease'}}>{cols.map(col=>(<td key={col.key} onClick={col.key==='select'?(e)=>{e.stopPropagation();onSelect(trade.id);}:undefined} style={{padding:'12px 14px',whiteSpace:'nowrap',borderBottom:'1px solid rgba(255,255,255,0.05)',verticalAlign:'middle'}}>{col.key==='select'?<input type="checkbox" checked={isSelected} onChange={()=>onSelect(trade.id)} onClick={e=>e.stopPropagation()} style={{cursor:'pointer',accentColor:C.cyan,width:14,height:14}}/>:cell(col.key)}</td>))}</motion.tr>);
});
TradeRow.displayName='TradeRow';

const Pagination=({page,total,perPage,onPage,onPerPage})=>{
  const totalPages=Math.ceil(total/perPage)||1;
  return(<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12,marginTop:16,padding:'12px 14px',border:`1px solid ${C.brd}`,borderRadius:16,background:'rgba(8,13,22,0.74)'}}><div style={{fontSize:12,color:C.t2}}>{((page-1)*perPage)+1}-{Math.min(page*perPage,total)} of <span style={{color:C.t1,fontWeight:800}}>{total}</span> trades</div><div style={{display:'flex',gap:6,alignItems:'center'}}><motion.button whileHover={{scale:1.03}} onClick={()=>onPage(page-1)} disabled={page===1} style={{height:34,padding:'0 14px',borderRadius:10,border:`1px solid ${C.brd}`,backgroundColor:C.bgDeep,color:page===1?C.t3:C.t1,cursor:page===1?'not-allowed':'pointer',opacity:page===1?0.4:1,fontSize:11,fontWeight:800}}>Previous</motion.button><span style={{fontSize:11.5,color:C.t2,padding:'0 12px',fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase'}}>Page {page} / {totalPages}</span><motion.button whileHover={{scale:1.03}} onClick={()=>onPage(page+1)} disabled={page===totalPages} style={{height:34,padding:'0 14px',borderRadius:10,border:`1px solid ${C.brd}`,backgroundColor:C.bgDeep,color:page===totalPages?C.t3:C.t1,cursor:page===totalPages?'not-allowed':'pointer',opacity:page===totalPages?0.4:1,fontSize:11,fontWeight:800}}>Next</motion.button></div><div style={{display:'flex',alignItems:'center',gap:8}}><span style={{fontSize:11.5,color:C.t2,fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase'}}>Rows</span><select value={perPage} onChange={e=>onPerPage(Number(e.target.value))} style={{padding:'7px 11px',borderRadius:10,border:`1px solid ${C.brd}`,backgroundColor:C.bgDeep,color:C.t1,fontSize:12,cursor:'pointer',outline:'none',fontFamily:'inherit'}}>{[10,25,50,100].map(n=><option key={n} value={n}>{n}</option>)}</select></div></div>);
};

// ══════════════════════════════════════════════════════════════════════════════
// 🎯 TRADE DETAIL PANEL
// ══════════════════════════════════════════════════════════════════════════════
const ColumnStudioModal=({isOpen,onClose,cols,onChange})=>{
  const [label,setLabel]=useState('');
  const [type,setType]=useState('text');
  if(!isOpen) return null;
  const customCount=cols.filter(column=>isCustomColumnKey(column.key)).length;
  const addColumn=()=>{
    const cleanLabel=label.trim();
    if(!cleanLabel){toast.error('Add a column name first');return;}
    const next=upsertCustomColumns(cols,[{label:cleanLabel,dataType:type}]);
    if(next===cols){toast.error('This column already exists');return;}
    onChange(next);
    setLabel('');
    setType('text');
    toast.success('Custom column added');
  };
  return(<AnimatePresence><motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(7,11,19,0.78)',backdropFilter:'blur(8px)',zIndex:420}}/><motion.div initial={{opacity:0,y:24,scale:0.98}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:24,scale:0.98}} transition={{duration:0.2}} style={{position:'fixed',inset:0,zIndex:421,display:'flex',alignItems:'center',justifyContent:'center',padding:24}}><div onClick={event=>event.stopPropagation()} style={{width:'min(980px,100%)',maxHeight:'88vh',overflow:'hidden',borderRadius:26,border:`1px solid ${C.brd}`,background:'linear-gradient(180deg, rgba(10,17,28,0.98), rgba(8,13,22,0.98))',boxShadow:'0 30px 90px rgba(0,0,0,0.44)',display:'flex',flexDirection:'column'}}><div style={{padding:'22px 24px 18px',borderBottom:`1px solid ${C.brd}`,display:'flex',justifyContent:'space-between',gap:16,alignItems:'flex-start'}}><div><div style={{fontSize:10,color:C.t3,fontWeight:800,letterSpacing:'0.16em',textTransform:'uppercase'}}>Columns</div><div style={{marginTop:6,fontSize:28,fontWeight:900,letterSpacing:'-0.03em',color:C.t1}}>Ledger column studio</div><div style={{marginTop:8,fontSize:13,color:C.t2}}>{cols.filter(column=>column.visible).length} visible / {customCount} custom</div></div><GlassBtn onClick={onClose}>Close</GlassBtn></div><div style={{padding:24,overflowY:'auto',display:'grid',gridTemplateColumns:'minmax(320px,0.8fr) minmax(0,1.2fr)',gap:18}}><div style={{padding:18,borderRadius:22,border:`1px solid ${C.brd}`,background:'rgba(255,255,255,0.02)'}}><div style={{fontSize:11,color:C.t3,fontWeight:800,letterSpacing:'0.16em',textTransform:'uppercase'}}>Add a custom column</div><div style={{marginTop:14,display:'grid',gap:10}}><input value={label} onChange={event=>setLabel(event.target.value)} placeholder="Example: Grade, Playbook note, HTF bias" style={{width:'100%',padding:'12px 14px',borderRadius:14,border:`1px solid ${C.brd}`,background:C.bgDeep,color:C.t1,fontSize:13,outline:'none',fontFamily:'inherit'}}/><select value={type} onChange={event=>setType(event.target.value)} style={{width:'100%',padding:'12px 14px',borderRadius:14,border:`1px solid ${C.brd}`,background:C.bgDeep,color:C.t1,fontSize:13,outline:'none',fontFamily:'inherit'}}><option value="text">Text</option><option value="number">Number</option></select><GlassBtn variant="primary" onClick={addColumn} fullWidth>Add column</GlassBtn></div><div style={{marginTop:16,padding:'12px 14px',borderRadius:16,border:`1px solid ${C.brd}`,background:'rgba(255,255,255,0.02)',fontSize:12,color:C.t2,lineHeight:1.7}}>New columns appear in the review table and inside the add trade form. Hidden columns stay available until you delete them.</div></div><div style={{padding:18,borderRadius:22,border:`1px solid ${C.brd}`,background:'rgba(255,255,255,0.02)'}}><div style={{fontSize:11,color:C.t3,fontWeight:800,letterSpacing:'0.16em',textTransform:'uppercase',marginBottom:14}}>Active structure</div><div style={{display:'grid',gap:10}}>{cols.map((column,index)=>(<div key={column.key} style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) auto auto auto',gap:10,alignItems:'center',padding:'12px 14px',borderRadius:16,border:`1px solid ${column.visible?shade(C.cyan,'16'):C.brd}`,background:column.visible?'rgba(var(--mf-accent-rgb, 6, 230, 255),0.04)':'rgba(255,255,255,0.02)'}}><div style={{minWidth:0}}><div style={{fontSize:13,fontWeight:700,color:C.t1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{column.label||prettifyColumnLabel(column.key)}</div><div style={{marginTop:4,fontSize:11,color:C.t3}}>{column.source==='custom'?'Custom column':'Core column'}</div></div><button type="button" onClick={()=>onChange(cols.map(item=>item.key===column.key?{...item,visible:!item.visible}:item))} style={{padding:'8px 10px',borderRadius:10,border:`1px solid ${column.visible?shade(C.cyan,'24'):C.brd}`,background:column.visible?'rgba(var(--mf-accent-rgb, 6, 230, 255),0.08)':'rgba(255,255,255,0.02)',color:column.visible?C.cyan:C.t2,fontSize:11,fontWeight:800,cursor:'pointer'}}>{column.visible?'Visible':'Hidden'}</button><div style={{display:'flex',gap:6}}><button type="button" onClick={()=>onChange(moveColumn(cols,column.key,-1))} disabled={index===0} style={{width:34,height:34,borderRadius:10,border:`1px solid ${C.brd}`,background:C.bgDeep,color:index===0?C.t3:C.t1,cursor:index===0?'not-allowed':'pointer'}}>↑</button><button type="button" onClick={()=>onChange(moveColumn(cols,column.key,1))} disabled={index===cols.length-1} style={{width:34,height:34,borderRadius:10,border:`1px solid ${C.brd}`,background:C.bgDeep,color:index===cols.length-1?C.t3:C.t1,cursor:index===cols.length-1?'not-allowed':'pointer'}}>↓</button></div>{column.source==='custom'?<button type="button" onClick={()=>onChange(cols.filter(item=>item.key!==column.key))} style={{padding:'8px 10px',borderRadius:10,border:`1px solid ${shade(C.danger,'24')}`,background:'rgba(var(--mf-danger-rgb, 255, 61, 87),0.08)',color:C.danger,fontSize:11,fontWeight:800,cursor:'pointer'}}>Delete</button>:<div style={{fontSize:11,color:C.t3,fontWeight:700,textAlign:'right'}}>{column.locked?'Locked':'Core'}</div>}</div>))}</div></div></div></div></motion.div></AnimatePresence>);
};

const PBar=({label,value,max=100,color})=>(<div style={{marginBottom:10}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{fontSize:10,color:C.t3,fontWeight:600}}>{label}</span><span style={{fontSize:10,fontWeight:800,color}}>{value}</span></div><div style={{height:4,borderRadius:2,backgroundColor:C.bgDeep,overflow:'hidden'}}><motion.div initial={{width:0}} animate={{width:`${Math.min(100,(value/max)*100)}%`}} transition={{duration:0.8,ease:[0.22,1,0.36,1]}} style={{height:'100%',borderRadius:2,background:color,boxShadow:`0 0 8px ${shade(color,'50')}`}}/></div></div>);
const SecTitle=({title,color=C.cyan,icon})=>(<div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12,marginTop:4}}>{icon&&<div style={{width:18,height:18,borderRadius:6,display:'inline-flex',alignItems:'center',justifyContent:'center',background:shade(color,'12'),border:`1px solid ${shade(color,'20')}`,color}}><IconGlyph name={icon} color={color} size={11}/></div>}<span style={{fontSize:10,fontWeight:800,color:C.t3,letterSpacing:'1.5px',textTransform:'uppercase'}}>{title}</span><div style={{flex:1,height:1,background:`linear-gradient(90deg,${shade(color,'40')},transparent)`}}/></div>);
const MRow=({label,value,color,sub,icon})=>(<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 0',borderBottom:`1px solid ${C.brd}`}}><div style={{display:'flex',alignItems:'center',gap:7}}>{icon&&<div style={{width:18,height:18,borderRadius:6,display:'inline-flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.03)',border:`1px solid ${shade(color||C.cyan,'18')}`,color:color||C.cyan}}><IconGlyph name={icon} color={color||C.cyan} size={11}/></div>}<div><div style={{fontSize:10,color:C.t3,fontWeight:600,letterSpacing:'0.4px'}}>{label}</div>{sub&&<div style={{fontSize:9,color:C.t4,marginTop:1}}>{sub}</div>}</div></div><div style={{fontSize:13,fontWeight:800,color:color||C.t1,fontFamily:'monospace'}}>{value}</div></div>);

const MiniChart=({trade})=>{
  const pnl=parseFloat(trade?.profit_loss??trade?.pnl??0);
  const isWin=pnl>=0;const color=isWin?C.green:C.danger;
  const entry=parseFloat(trade?.entry_price??trade?.entry??0);
  const exit=parseFloat(trade?.exit_price??trade?.exit??0);
  const data=useMemo(()=>{if(!entry||!exit)return[];const pts=14,diff=exit-entry;return Array.from({length:pts},(_,i)=>{const t=i/(pts-1);const noise=i>0&&i<pts-1?Math.sin(i*1.6)*Math.abs(diff)*0.12:0;return{i,price:entry+diff*t+noise};});},[entry,exit]);
  if(!entry||!exit)return null;
  return(<div style={{padding:'14px',borderRadius:10,backgroundColor:C.bgDeep,border:`1px solid ${C.brd}`,marginBottom:16}}><div style={{fontSize:10,color:C.t3,fontWeight:700,letterSpacing:'0.8px',marginBottom:10}}>TRADE PATH</div><div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}><div><div style={{fontSize:8,color:C.t3,fontWeight:700}}>ENTRY</div><div style={{fontSize:12,fontWeight:800,color:C.cyan,fontFamily:'monospace'}}>{mfFormatPrice(entry)}</div></div>{(trade?.stop_loss||trade?.sl)&&parseFloat(trade.stop_loss||trade.sl)>0&&(<div style={{textAlign:'center'}}><div style={{fontSize:8,color:C.t3,fontWeight:700}}>SL</div><div style={{fontSize:11,fontWeight:700,color:C.danger,fontFamily:'monospace'}}>{mfFormatPrice(parseFloat(trade.stop_loss||trade.sl))}</div></div>)}{(trade?.tp||trade?.take_profit)&&parseFloat(trade.tp||trade.take_profit)>0&&(<div style={{textAlign:'center'}}><div style={{fontSize:8,color:C.t3,fontWeight:700}}>TP</div><div style={{fontSize:11,fontWeight:700,color:C.green,fontFamily:'monospace'}}>{mfFormatPrice(parseFloat(trade.tp||trade.take_profit))}</div></div>)}<div style={{textAlign:'right'}}><div style={{fontSize:8,color:C.t3,fontWeight:700}}>EXIT</div><div style={{fontSize:12,fontWeight:800,color,fontFamily:'monospace'}}>{mfFormatPrice(exit)}</div></div></div><div style={{height:70}}><ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{top:4,right:0,bottom:0,left:0}}><defs><linearGradient id={`cg_${trade?.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={color} stopOpacity={0.28}/><stop offset="95%" stopColor={color} stopOpacity={0}/></linearGradient></defs><Area type="monotone" dataKey="price" stroke={color} strokeWidth={2} fill={`url(#cg_${trade?.id})`} dot={false} activeDot={chartActiveDot(color,4,C.bgDeep)} {...CHART_MOTION_SOFT}/><Tooltip contentStyle={chartTooltipStyle(color)} cursor={chartCursor(color)} formatter={v=>[v?.toFixed(5),'Price']} labelFormatter={()=>''}/></AreaChart></ResponsiveContainer></div><motion.div initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} transition={{delay:0.35}} style={{marginTop:10,padding:'8px 12px',borderRadius:7,background:`linear-gradient(135deg,${shade(color,'12')},${shade(color,'04')})`,border:`1px solid ${shade(color,'28')}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}><span style={{fontSize:10,color:C.t3,fontWeight:600}}>Net Result</span><span style={{fontSize:18,fontWeight:900,color,fontFamily:'monospace',textShadow:`0 0 20px ${shade(color,'60')}`}}>{mfFormatMoney(pnl)}</span></motion.div></div>);
};

const PsychoCard=({score})=>{
  const s=parseInt(score)||0;const color=s>=80?C.green:s>=60?C.warn:C.danger;  const label=s>=80?'Excellent':s>=60?'Good':'Difficult';
  return(<div style={{padding:'12px 14px',borderRadius:10,background:`linear-gradient(135deg,${shade(color,'10')},transparent)`,border:`1px solid ${shade(color,'28')}`,marginBottom:12}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}><div><div style={{fontSize:10,color:C.t3,fontWeight:600}}>Psychological Score</div><div style={{fontSize:11,color,fontWeight:700}}>{label}</div></div><motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:'spring',delay:0.3}} style={{fontSize:26,fontWeight:900,color,fontFamily:'monospace'}}>{s}</motion.div></div><div style={{height:5,borderRadius:3,backgroundColor:C.bgDeep,overflow:'hidden'}}><motion.div initial={{width:0}} animate={{width:`${s}%`}} transition={{duration:0.9,ease:[0.22,1,0.36,1],delay:0.2}} style={{height:'100%',borderRadius:3,background:`linear-gradient(90deg,${color},${shade(color,'88')})`,boxShadow:`0 0 10px ${shade(color,'60')}`}}/></div></div>);
};

const TradeDetailPanel=({trade,onClose,onEdit,onDelete})=>{
  const panelRef=useRef(null);
  useEffect(()=>{const fn=e=>{if(e.key==='Escape')onClose?.();};window.addEventListener('keydown',fn);return()=>window.removeEventListener('keydown',fn);},[onClose]);
  useEffect(()=>{if(panelRef.current)panelRef.current.scrollTop=0;},[trade?.id]);
  if(!trade)return null;
  const pnl    = parseFloat(trade.profit_loss??trade.pnl??0);
  const isWin  = pnl>=0;
  const pColor = isWin?C.green:C.danger;
  const pGlow  = isWin?C.greenGlow:C.dangerGlow;
  const rr     = trade.metrics?.rrReel||'0';
  const tpPct  = trade.metrics?.tpPercent||'0';
  const type   = trade.direction||trade.type||'Long';
  const typeC  = type==='Long'?C.green:C.danger;
  const biasC  = trade.bias==='Bullish'?C.green:trade.bias==='Bearish'?C.danger:C.t2;
  const newsC  = trade.newsImpact==='High'?C.danger:trade.newsImpact==='Medium'?C.warn:C.teal;
  const sessE  = '';
  const entryP = parseFloat(trade.entry_price??trade.entry??0);
  const exitP  = parseFloat(trade.exit_price??trade.exit??0);
  const slP    = parseFloat(trade.stop_loss??trade.sl??0);
  const tpP    = parseFloat(trade.tp??trade.take_profit??0);
  const contextCards=[
    {label:'Session',value:mfSessionLabel(trade.session),color:C.cyan},
    {label:'Account',value:mfAccountLabel(trade)||'-',color:C.blue},
    {label:'Bias',value:trade.bias||'-',color:biasC},
    {label:'News',value:trade.newsImpact||'-',color:newsC},
    {label:'Setup',value:trade.setup||'-',color:C.purple},
    {label:'Type',value:type||'-',color:typeC},
    {label:'Date',value:mfFormatDate(trade.open_date||trade.date||''),color:C.t2},
  ];
  return(
    <AnimatePresence>
      <motion.div key="bd" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.22}} onClick={onClose} style={{position:'fixed',inset:0,backgroundColor:'rgba(7,10,20,0.68)',backdropFilter:'blur(4px)',zIndex:200}}/>
      <motion.div key="pnl" initial={{x:'100%',opacity:0.6}} animate={{x:0,opacity:1}} exit={{x:'100%',opacity:0}} transition={{type:'spring',stiffness:300,damping:34,mass:0.85}} style={{position:'fixed',top:0,right:0,bottom:0,width:420,backgroundColor:C.bgCard,borderLeft:`1px solid ${C.brdSoft}`,zIndex:201,display:'flex',flexDirection:'column',boxShadow:'-20px 0 70px rgba(0,0,0,0.55)',fontFamily:'system-ui,-apple-system,sans-serif'}}>
        <div style={{position:'absolute',top:-100,right:-100,width:320,height:320,borderRadius:'50%',background:`radial-gradient(circle,${shade(pColor,'18')},transparent 70%)`,pointerEvents:'none',zIndex:0}}/>
        <div style={{position:'relative',zIndex:1,padding:'18px 18px 14px',borderBottom:`1px solid ${C.brd}`,background:`linear-gradient(180deg,${C.bgHigh},${C.bgCard})`,flexShrink:0}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <motion.div initial={{scale:0.5,opacity:0}} animate={{scale:1,opacity:1}} transition={{type:'spring',delay:0.08}} style={{width:46,height:46,borderRadius:12,background:C.grad,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:900,color:C.bgDeep,boxShadow:`0 4px 18px ${C.cyanGlow}`,flexShrink:0}}>
                {(trade.symbol||'??').substring(0,2)}
              </motion.div>
              <div>
                <div style={{fontSize:19,fontWeight:900,color:C.t1,letterSpacing:'-0.5px',lineHeight:1.1}}>{trade.symbol||'-'}</div>
                <div style={{fontSize:11,color:C.t3,marginTop:2}}>{mfFormatDate(trade.open_date||trade.date||'')} / {mfFormatTime(trade.time)}</div>
              </div>
            </div>
            <motion.button onClick={onClose} whileHover={{scale:1.06}} whileTap={{scale:0.94}} style={{height:30,padding:'0 10px',borderRadius:7,border:`1px solid ${C.brd}`,backgroundColor:C.bgDeep,color:C.t3,cursor:'pointer',fontSize:11,fontWeight:800,letterSpacing:'0.8px',textTransform:'uppercase'}}>Close</motion.button>
          </div>
          <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:12}}>
            <Tag label={type==='Long'?'Long':'Short'} color={typeC} bg={`${shade(typeC,'14')}`}/>
            <Tag label={mfSessionLabel(trade.session)} color={C.cyan} bg="rgba(var(--mf-accent-rgb, 6, 230, 255),0.08)"/>
            {trade.bias&&<Tag label={trade.bias} color={biasC} bg={`${shade(biasC,'12')}`}/>}
            {trade.newsImpact&&<Tag label={trade.newsImpact} color={newsC} bg={`${shade(newsC,'12')}`}/>}
            {trade.setup&&<Tag label={trade.setup} color={C.purple} bg="rgba(167,139,250,0.1)"/>}
          </div>
          <div style={{padding:'12px 14px',borderRadius:10,background:`linear-gradient(135deg,${shade(pColor,'14')},${shade(pColor,'04')})`,border:`1px solid ${shade(pColor,'28')}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{fontSize:9,color:C.t3,fontWeight:700,letterSpacing:'1px',marginBottom:4}}>NET RESULT</div>
              <div style={{fontSize:30,fontWeight:900,color:pColor,fontFamily:'monospace',letterSpacing:'-0.5px',textShadow:`0 0 28px ${pGlow}`}}>{mfFormatMoney(pnl)}</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:13,color:pColor,fontWeight:900,letterSpacing:'1px'}}>{isWin?'WIN':'LOSS'}</div>
              <div style={{fontSize:10,color:C.t3,marginTop:4}}>RR: <span style={{color:C.teal,fontWeight:800}}>{mfFormatRR(rr)}</span></div>
            </div>
          </div>
          <div style={{display:'flex',gap:7,marginTop:11}}>
            <GlassBtn variant="primary" size="sm" onClick={()=>onEdit?.(trade)}>Edit</GlassBtn>
            <GlassBtn variant="danger" size="sm" onClick={()=>{if(window.confirm('Delete this trade?'))onDelete?.(trade.id);}}>Delete</GlassBtn>
            <div style={{flex:1}}/>
            <GlassBtn variant="ghost" size="sm" onClick={()=>{navigator.clipboard?.writeText(JSON.stringify(trade,null,2));toast.success('Copied');}}>Copy</GlassBtn>
          </div>
        </div>
        <div ref={panelRef} style={{flex:1,overflowY:'auto',overflowX:'hidden',padding:'18px',scrollbarWidth:'thin',scrollbarColor:`${C.brd} transparent`}}>
          <MiniChart trade={trade}/>
          <SecTitle title="Metrics" color={C.cyan}/>
          <div style={{backgroundColor:C.bgDeep,borderRadius:10,padding:'2px 14px',border:`1px solid ${C.brd}`,marginBottom:16}}>
            <MRow label="P&L Net" value={mfFormatMoney(pnl)} color={pColor}/>
            <MRow label="Risk / Reward" value={mfFormatRR(rr)} color={mfToStrictNumber(rr)>=2?C.green:mfToStrictNumber(rr)>=1?C.warn:C.danger} sub="Actual achieved"/>
            <MRow label="TP reached" value={mfFormatPercent(tpPct,1)} color={mfToStrictNumber(tpPct)>=100?C.green:mfToStrictNumber(tpPct)>=50?C.warn:C.danger} sub="Target progress"/>
            <MRow label="Entry price" value={mfFormatPrice(entryP)}/>
            <MRow label="Exit price" value={mfFormatPrice(exitP)}/>
            {slP>0&&<MRow label="Stop Loss" value={mfFormatPrice(slP)} color={C.danger}/>}
            {tpP>0&&<MRow label="Take Profit" value={mfFormatPrice(tpP)} color={C.green}/>}
            {trade.breakEven&&<MRow label="Break Even" value={mfFormatPrice(trade.breakEven)} color={C.teal}/>}
            {trade.trailingStop&&<MRow label="Trailing Stop" value={mfFormatPrice(trade.trailingStop)} color={C.warn}/>}
            {trade.lots&&<MRow label="Volume / Lots" value={trade.lots}/>}
            {(trade.commission||trade.quantity!=null)&&<MRow label="Commission" value={mfFormatMoney(trade.commission||0,false)} color={C.warn}/>}
          </div>
          <SecTitle title="Context" color={C.blue}/>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:16}}>
            {contextCards.map(({label,value,color})=>(
              <div key={label} style={{padding:'10px 11px',borderRadius:8,backgroundColor:C.bgDeep,border:`1px solid ${C.brd}`}}>
                <div style={{fontSize:8,color:C.t3,fontWeight:700,letterSpacing:'0.8px',marginBottom:5,textTransform:'uppercase'}}>{label}</div>
                <div style={{fontSize:12,fontWeight:800,color}}>{value}</div>
              </div>
            ))}
          </div>
          <SecTitle title="Psychology" color={C.purple}/>
          <PsychoCard score={trade.psychologyScore}/>
          <PBar label="Discipline" value={trade.psychologyScore>=80?90:trade.psychologyScore>=60?65:40} color={C.purple}/>
          <PBar label="Emotion management" value={parseInt(trade.psychologyScore)||0} color={C.blue}/>
          <PBar label="Confidence" value={Math.min(100,(parseInt(trade.psychologyScore)||0)+10)} color={C.cyan}/>
          {trade.notes&&(<><SecTitle title="Notes" color={C.warn}/><div style={{padding:'13px 15px',borderRadius:10,backgroundColor:C.bgDeep,border:`1px solid ${C.brd}`,borderLeft:`3px solid ${shade(C.warn,'40')}`,fontSize:12,color:C.t2,lineHeight:1.75,fontStyle:'italic',marginBottom:16,whiteSpace:'pre-wrap'}}>{trade.notes}</div></>)}
          {trade.extra&&Object.keys(trade.extra).length>0&&(<><SecTitle title="Extra Data" color={C.purple}/><div style={{backgroundColor:C.bgDeep,borderRadius:10,padding:'2px 14px',border:`1px solid ${C.brd}`,marginBottom:16}}>{Object.entries(trade.extra).map(([k,v])=>(<MRow key={k} label={k} value={String(v)}/>))}</div></>)}
          <div style={{padding:'9px 13px',borderRadius:8,backgroundColor:C.bgDeep,border:`1px solid ${C.brd}`,marginBottom:8}}>
            <div style={{fontSize:9,color:C.t3,fontFamily:'monospace',wordBreak:'break-all'}}>ID: {trade.id||'-'}</div>
            {trade.lastModified&&<div style={{fontSize:9,color:C.t3,marginTop:2}}>Modified: {new Date(trade.lastModified).toLocaleString('fr-FR')}</div>}
          </div>
          <div style={{height:20}}/>
        </div>
      </motion.div>
    </AnimatePresence>
  );
  return(<AnimatePresence><motion.div key="bd" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.22}} onClick={onClose} style={{position:'fixed',inset:0,backgroundColor:'rgba(7,10,20,0.6)',backdropFilter:'blur(3px)',zIndex:200}}/><motion.div key="pnl" initial={{x:'100%',opacity:0.6}} animate={{x:0,opacity:1}} exit={{x:'100%',opacity:0}} transition={{type:'spring',stiffness:300,damping:34,mass:0.85}} style={{position:'fixed',top:0,right:0,bottom:0,width:420,backgroundColor:C.bgCard,borderLeft:`1px solid ${C.brdSoft}`,zIndex:201,display:'flex',flexDirection:'column',boxShadow:'-20px 0 70px rgba(0,0,0,0.55)',fontFamily:'system-ui,-apple-system,sans-serif'}}><div style={{position:'absolute',top:-100,right:-100,width:320,height:320,borderRadius:'50%',background:`radial-gradient(circle,${shade(pColor,'18')},transparent 70%)`,pointerEvents:'none',zIndex:0}}/><div style={{position:'relative',zIndex:1,padding:'18px 18px 14px',borderBottom:`1px solid ${C.brd}`,background:`linear-gradient(180deg,${C.bgHigh},${C.bgCard})`,flexShrink:0}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}><div style={{display:'flex',alignItems:'center',gap:12}}><motion.div initial={{scale:0.5,opacity:0}} animate={{scale:1,opacity:1}} transition={{type:'spring',delay:0.08}} style={{width:46,height:46,borderRadius:12,background:C.grad,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:900,color:C.bgDeep,boxShadow:`0 4px 18px ${C.cyanGlow}`,flexShrink:0}}>{(trade.symbol||'??').substring(0,2)}</motion.div><div><motion.div initial={{x:-8,opacity:0}} animate={{x:0,opacity:1}} transition={{delay:0.1}} style={{fontSize:19,fontWeight:900,color:C.t1,letterSpacing:'-0.5px',lineHeight:1.1}}>{trade.symbol||'—'}</motion.div><motion.div initial={{x:-8,opacity:0}} animate={{x:0,opacity:1}} transition={{delay:0.14}} style={{fontSize:11,color:C.t3,marginTop:2}}>{(trade.open_date||trade.date||'—').substring(0,10)} · {trade.time||'—'}</motion.div></div></div><motion.button onClick={onClose} whileHover={{scale:1.15,rotate:90}} whileTap={{scale:0.88}} style={{width:30,height:30,borderRadius:7,border:`1px solid ${C.brd}`,backgroundColor:C.bgDeep,color:C.t3,cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.18s'}}>✕</motion.button></div><motion.div initial={{y:5,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:0.17}} style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:12}}><Tag label={type==='Long'?'↗ Long':'↘ Short'} color={typeC} bg={`${shade(typeC,'14')}`}/><Tag label={`${sessE} ${trade.session||'—'}`} color={C.cyan} bg="rgba(var(--mf-accent-rgb, 6, 230, 255),0.08)"/>{trade.bias&&<Tag label={trade.bias} color={biasC} bg={`${shade(biasC,'12')}`}/>}{trade.newsImpact&&<Tag label={`📰 ${trade.newsImpact}`} color={newsC} bg={`${shade(newsC,'12')}`}/>}{trade.setup&&<Tag label={trade.setup} color={C.purple} bg="rgba(167,139,250,0.1)"/>}</motion.div><motion.div initial={{scale:0.88,opacity:0}} animate={{scale:1,opacity:1}} transition={{type:'spring',delay:0.16,stiffness:180}} style={{padding:'12px 14px',borderRadius:10,background:`linear-gradient(135deg,${shade(pColor,'14')},${shade(pColor,'04')})`,border:`1px solid ${shade(pColor,'28')}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}><div><div style={{fontSize:9,color:C.t3,fontWeight:700,letterSpacing:'1px',marginBottom:4}}>NET RESULT</div><div style={{fontSize:30,fontWeight:900,color:pColor,fontFamily:'monospace',letterSpacing:'-0.5px',textShadow:`0 0 28px ${pGlow}`}}>{fmtPnl(pnl)}</div></div><div style={{textAlign:'right'}}><motion.div animate={{scale:[1,1.1,1]}} transition={{duration:2.5,repeat:Infinity}} style={{width:36,height:36,display:'inline-flex',alignItems:'center',justifyContent:'center',filter:`drop-shadow(0 4px 10px ${pGlow})`}}><IconGlyph name={isWin?'✅':'❌'} color={pColor} size={22}/></motion.div><div style={{fontSize:10,color:C.t3,marginTop:4}}>RR: <span style={{color:C.teal,fontWeight:800}}>1:{rr}</span></div></div></motion.div><motion.div initial={{y:5,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:0.24}} style={{display:'flex',gap:7,marginTop:11}}><GlassBtn variant="primary" icon="✏️" size="sm" onClick={()=>onEdit?.(trade)}>Modifier</GlassBtn><GlassBtn variant="danger" icon="🗑️" size="sm" onClick={()=>{if(window.confirm('Delete ce trade ?'))onDelete?.(trade.id);}}>Delete</GlassBtn><div style={{flex:1}}/><GlassBtn variant="ghost" icon="📋" size="sm" onClick={()=>{navigator.clipboard?.writeText(JSON.stringify(trade,null,2));toast.success('Copied!');}}></GlassBtn></motion.div></div><div ref={panelRef} style={{flex:1,overflowY:'auto',overflowX:'hidden',padding:'18px',scrollbarWidth:'thin',scrollbarColor:`${C.brd} transparent`}}><motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.2}}><MiniChart trade={trade}/></motion.div><motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.24}}><SecTitle icon="📊" title="Metrics" color={C.cyan}/><div style={{backgroundColor:C.bgDeep,borderRadius:10,padding:'2px 14px',border:`1px solid ${C.brd}`,marginBottom:16}}><MRow label="P&L Net" value={fmtPnl(pnl)} color={pColor} icon="💰"/><MRow label="Risk / Reward" value={`1 : ${rr}`} color={parseFloat(rr)>=2?C.green:parseFloat(rr)>=1?C.warn:C.danger} sub="Actual achieved" icon="⚖️"/><MRow label="TP Atteint" value={`${tpPct}%`} color={parseFloat(tpPct)>=100?C.green:parseFloat(tpPct)>=50?C.warn:C.danger} sub="% de l'objectif" icon="🎯"/><MRow label="Entry price" value={fmt(entryP,5)} icon="📍"/><MRow label="Prix de sortie" value={fmt(exitP,5)} icon="🏁"/>{slP>0&&<MRow label="Stop Loss" value={fmt(slP,5)} color={C.danger} icon="🛑"/>}{tpP>0&&<MRow label="Take Profit" value={fmt(tpP,5)} color={C.green} icon="✨"/>}{trade.breakEven&&<MRow label="Break Even" value={fmt(trade.breakEven,5)} color={C.teal} icon="⚡"/>}{trade.trailingStop&&<MRow label="Trailing Stop" value={fmt(trade.trailingStop,5)} color={C.warn} icon="🔄"/>}{trade.lots&&<MRow label="Volume / Lots" value={trade.lots} icon="📦"/>}{(trade.commission||trade.quantity!=null)&&<MRow label="Commission" value={`$${parseFloat(trade.commission||0).toFixed(2)}`} color={C.warn} icon="💸"/>}</div></motion.div><motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.28}}><SecTitle icon="🌍" title="Contexte" color={C.blue}/><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:16}}>{[{label:'Session',value:trade.session||'—',icon:sessE,color:C.cyan},{label:'Bias',value:trade.bias||'—',icon:trade.bias==='Bullish'?'🐂':trade.bias==='Bearish'?'🐻':'⚖️',color:biasC},{label:'News',value:trade.newsImpact||'—',icon:'📰',color:newsC},{label:'Setup',value:trade.setup||'—',icon:'🎯',color:C.purple},{label:'Type',value:type||'—',icon:type==='Long'?'↗':'↘',color:typeC},{label:'Date',value:(trade.open_date||trade.date||'—').substring(0,10),icon:'📅',color:C.t2}].map(({label,value,icon,color})=>(<div key={label} style={{padding:'10px 11px',borderRadius:8,backgroundColor:C.bgDeep,border:`1px solid ${C.brd}`}}><div style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:8,color:C.t3,fontWeight:700,letterSpacing:'0.8px',marginBottom:5,textTransform:'uppercase'}}>{icon&&<IconGlyph name={icon} color={color||C.t3} size={10}/>}<span>{label}</span></div><div style={{fontSize:12,fontWeight:800,color}}>{value}</div></div>))}</div></motion.div><motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.32}}><SecTitle icon="🧠" title="Psychologie" color={C.purple}/><PsychoCard score={trade.psychologyScore}/><PBar label="Discipline" value={trade.psychologyScore>=80?90:trade.psychologyScore>=60?65:40} color={C.purple}/><PBar label="Emotion management" value={parseInt(trade.psychologyScore)||0} color={C.blue}/><PBar label="Confiance" value={Math.min(100,(parseInt(trade.psychologyScore)||0)+10)} color={C.cyan}/><div style={{marginBottom:16}}/></motion.div>{trade.notes&&(<motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.36}}><SecTitle icon="📝" title="Notes" color={C.warn}/><div style={{padding:'13px 15px',borderRadius:10,backgroundColor:C.bgDeep,border:`1px solid ${C.brd}`,borderLeft:`3px solid ${shade(C.warn,'40')}`,fontSize:12,color:C.t2,lineHeight:1.75,fontStyle:'italic',marginBottom:16,whiteSpace:'pre-wrap'}}><span style={{fontSize:15,marginRight:5,opacity:0.4}}>"</span>{trade.notes}<span style={{fontSize:15,marginLeft:5,opacity:0.4}}>"</span></div></motion.div>)}{trade.extra&&Object.keys(trade.extra).length>0&&(<motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.38}}><SecTitle icon="📎" title="Extra Data" color={C.purple}/><div style={{backgroundColor:C.bgDeep,borderRadius:10,padding:'2px 14px',border:`1px solid ${C.brd}`,marginBottom:16}}>{Object.entries(trade.extra).map(([k,v])=>(<MRow key={k} label={k} value={String(v)} icon="•"/>))}</div></motion.div>)}<motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.42}} style={{padding:'9px 13px',borderRadius:8,backgroundColor:C.bgDeep,border:`1px solid ${C.brd}`,marginBottom:8}}><div style={{fontSize:9,color:C.t3,fontFamily:'monospace',wordBreak:'break-all'}}>ID: {trade.id||'—'}</div>{trade.lastModified&&<div style={{fontSize:9,color:C.t3,marginTop:2}}>Modified: {new Date(trade.lastModified).toLocaleString('fr-FR')}</div>}</motion.div><div style={{height:20}}/></div></motion.div></AnimatePresence>);
};

// ══════════════════════════════════════════════════════════════════════════════
// 📥 ADD METHOD MODAL
// ══════════════════════════════════════════════════════════════════════════════
const AddMethodModal=({isOpen,onClose,onSelectMethod})=>{
  if(!isOpen)return null;
  const methods=[
    {m:'auto',title:'Import file',desc:'Import broker exports from CSV, XLSX, XLS, TXT or TSV.'},
    {m:'manual',title:'Manual trade',desc:'Add one clean trade with the detailed form.'},
  ];
  return(
    <AnimatePresence>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose} style={{position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.72)',backdropFilter:'blur(4px)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
        <motion.div initial={{scale:0.94,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.94,opacity:0}} onClick={e=>e.stopPropagation()} style={{backgroundColor:C.bgCard,borderRadius:16,border:`1px solid ${C.brd}`,maxWidth:620,width:'100%',overflow:'hidden'}}>
          <div style={{padding:'22px',borderBottom:`1px solid ${C.brd}`}}>
            <h2 style={{margin:0,fontSize:22,fontWeight:850,color:C.t1}}>Add Trades</h2>
            <p style={{margin:'6px 0 0',fontSize:12,color:C.t3}}>Choose the cleanest input for this trade data.</p>
          </div>
          <div style={{padding:'22px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            {methods.map(({m,title,desc})=>(
              <motion.div key={m} whileHover={{y:-3}} whileTap={{scale:0.98}} onClick={()=>{onSelectMethod(m);onClose();}} style={{padding:'22px 18px',borderRadius:12,border:`1px solid ${C.brd}`,backgroundColor:C.bgDeep,cursor:'pointer'}}>
                <div style={{width:32,height:3,borderRadius:999,background:m==='auto'?C.cyan:C.green,marginBottom:16}}/>
                <h3 style={{margin:'0 0 7px',fontSize:16,fontWeight:800,color:C.t1}}>{title}</h3>
                <p style={{margin:0,fontSize:12,color:C.t3,lineHeight:1.6}}>{desc}</p>
              </motion.div>
            ))}
          </div>
          <div style={{padding:'14px 22px',borderTop:`1px solid ${C.brd}`,textAlign:'right'}}><GlassBtn onClick={onClose}>Cancel</GlassBtn></div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// 📂 IMPORT MODAL UNIVERSEL v4
// ══════════════════════════════════════════════════════════════════════════════

const FIELD_MAP = {
  // SYMBOL
  symbol:'symbol',symbole:'symbol',instrument:'symbol',asset:'symbol',pair:'symbol',
  ticker:'symbol',market:'symbol',currency:'symbol',currencypair:'symbol',
  tradingsymbol:'symbol',contract:'symbol',product:'symbol',securityname:'symbol',
  security:'symbol',underlying:'symbol',stocksymbol:'symbol',futuresymbol:'symbol',
  cryptopair:'symbol',base:'symbol',basecurrency:'symbol',tradepair:'symbol',paire:'symbol',
  // TYPE
  type:'type',direction:'type',side:'type',ordertype:'type',buysell:'type',
  tradetype:'type',transactiontype:'type',longshort:'type',bs:'type',
  action:'type',cmd:'type',operation:'type',sens:'type',position:'type',
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
  montant:'pnl',benefice:'pnl',gainperte:'pnl',performances:'pnl',
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
  sessiontype:'session',tradingsession:'session',periode:'session',sessions:'session',
  // BIAS
  bias:'bias',sentiment:'bias',trend:'bias',markettend:'bias',
  marketbias:'bias',tradesentiment:'bias',marketsentiment:'bias',
  tendance:'bias',orientation:'bias',
  // STOP LOSS
  sl:'sl',stoploss:'sl',stop:'sl',stoplosslevel:'sl',stoplossvalue:'sl',
  slprice:'sl',stoplossprice:'sl',slevel:'sl',stopprice:'sl',
  initialstop:'sl',hardstop:'sl',riskprice:'sl',protectivestop:'sl',
  niveaustoploss:'sl',slbe:'sl',
  // TAKE PROFIT
  tp:'tp',takeprofit:'tp',target:'tp',profittarget:'tp',tpprice:'tp',
  takeprofitprice:'tp',tplevel:'tp',targetprice:'tp',objectif:'tp',
  niveautakeprofit:'tp',tp1:'tp',tp2:'tp',tp3:'tp',rrtarget:'tp',
  // BREAK EVEN
  be:'breakEven',breakeven:'breakEven',breakevenpoint:'breakEven',
  beprice:'breakEven',belevel:'breakEven',seuilrentabilite:'breakEven',
  pointmort:'breakEven',beapartirde:'breakEven',
  // TRAILING STOP
  trailingstop:'trailingStop',trailstop:'trailingStop',trailingsl:'trailingStop',
  dynamicstop:'trailingStop',tsl:'trailingStop',trailingstoploss:'trailingStop',turtlesoup:'trailingStop',turtlesourejet:'trailingStop',
  // SETUP
  setup:'setup',strategy:'setup',strategie:'setup',pattern:'setup',
  setuptype:'setup',tradestyle:'setup',signal:'setup',tradesetup:'setup',
  entrysetup:'setup',catalyst:'setup',triggertype:'setup',entrytype:'setup',
  trademodel:'setup',playbook:'setup',confluences:'setup',model:'setup',
  keylevel:'setup',keylevels:'setup',
  // NOTES
  notes:'notes',note:'notes',comment:'notes',commentaire:'notes',
  remarks:'notes',description:'notes',tradecomment:'notes',
  commentary:'notes',annotation:'notes',observations:'notes',
  reflexion:'notes',lesson:'notes',journalentry:'notes',
  // NEWS
  news:'newsImpact',newsimpact:'newsImpact',impact:'newsImpact',
  newsevent:'newsImpact',newstier:'newsImpact',newstype:'newsImpact',priseasian:'newsImpact',
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
  tradingfee:'commission',frais:'commission',courtage:'commission',pp:'commission',
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
  duration:'duration',tradeduration:'duration',holdtime:'duration',duree:'duration',
  tags:'tags',tag:'tags',labels:'tags',
  structure:'_extra',contexte:'_extra',retracementaprescisd:'_extra',
  previousdaily:'_extra',emplacement:'_extra',mois:'_extra',
};

const KNOWN_FIELDS=[
  {value:'symbol',    label:'Symbol',          required:true},
  {value:'type',      label:'Type (Long/Short)'             },
  {value:'entry',     label:'Entry Price'                   },
  {value:'exit',      label:'Exit Price'                   },
  {value:'pnl',       label:'P&L ($)',           required:true},
  {value:'date',      label:'Date'                          },
  {value:'time',      label:'Time'                         },
  {value:'session',   label:'Session'                       },
  {value:'bias',      label:'Bias'                          },
  {value:'sl',        label:'Stop Loss'                     },
  {value:'tp',        label:'Take Profit'                   },
  {value:'breakEven', label:'Break Even'                    },
  {value:'trailingStop',label:'Trailing Stop'               },
  {value:'setup',     label:'Setup / Strategy'             },
  {value:'notes',     label:'Notes / Journal'               },
  {value:'newsImpact',label:'News Impact'                   },
  {value:'psychologyScore',label:'Psycho Score'             },
  {value:'lots',      label:'Lots / Volume / Shares'        },
  {value:'commission',label:'Commission / Fees'            },
  {value:'swap',      label:'Swap / Overnight'              },
  {value:'risk',      label:'Risk ($)'                    },
  {value:'rrActual',  label:'Actual RR'                       },
  {value:'marketType',label:'Market type'                },
  {value:'exchange',  label:'Exchange / Broker'             },
  {value:'account',   label:'Account'                        },
  {value:'duration',  label:'Duration'                         },
  {value:'tags',      label:'Tags'                          },
  {value:'_extra',    label:'Keep as extra'            },
  {value:'_ignore',   label:'Ignore this column'          },
];

const CLEAN_FIELD_LABELS={
  symbol:'Symbol',
  type:'Type (Long/Short)',
  entry:'Entry Price',
  exit:'Exit Price',
  pnl:'P&L ($)',
  date:'Date',
  time:'Time',
  session:'Session',
  bias:'Bias',
  sl:'Stop Loss',
  tp:'Take Profit',
  breakEven:'Break Even',
  trailingStop:'Trailing Stop',
  setup:'Setup / Strategy',
  notes:'Notes / Journal',
  newsImpact:'News Impact',
  psychologyScore:'Psycho Score',
  lots:'Lots / Volume / Shares',
  commission:'Commission / Fees',
  swap:'Swap / Overnight',
  risk:'Risk ($)',
  rrActual:'Actual RR',
  marketType:'Market type',
  exchange:'Exchange / Broker',
  account:'Account',
  duration:'Duration',
  tags:'Tags',
  _extra:'Keep as extra',
  _ignore:'Ignore this column',
};

const normalizeKey=(k)=>k.toString().trim().toLowerCase().replace(/[\u{1F300}-\u{1F9FF}]/gu,'').replace(/\s+/g,'').replace(/[^a-z0-9]/g,'');
const detectSeparator=(content)=>{const line=content.split(/\r?\n/)[0];const seps=[',',';','\t','|'];const counts=seps.map(s=>line.split(s).length-1);return seps[counts.indexOf(Math.max(...counts))];};
const parseCSVLine=(line,sep)=>{const vals=[];let cur='',inQ=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(inQ&&line[i+1]==='"'){cur+='"';i++;}else inQ=!inQ;}else if(c===sep&&!inQ){vals.push(cur.trim().replace(/^["']|["']$/g,'').replace(/""/g,'"').trim());cur='';}else cur+=c;}vals.push(cur.trim().replace(/^["']|["']$/g,'').replace(/""/g,'"').trim());return vals;};
const isSpreadsheetFile=(fileName='')=>/\.(xlsx|xls)$/i.test(fileName);
const normalizeImportedCell=(value)=>{
  if(value==null)return'';
  if(value instanceof Date)return value.toISOString().split('T')[0];
  return String(value).trim();
};
const prepareImportedRows=(rows=[])=>{
  const cleanRows=rows
    .map(row=>(Array.isArray(row)?row:[row]).map(normalizeImportedCell))
    .filter(row=>row.some(Boolean));
  if(cleanRows.length<2)throw new Error('Invalid file: you need at least 1 header line + 1 data line.');
  const headers=cleanRows[0].map((header,index)=>header||`Column ${index+1}`);
  const dataRows=cleanRows.slice(1);
  return{headers,dataRows,preview:dataRows.slice(0,7)};
};
const getRowsFromWorkbook=(arrayBuffer)=>{
  const workbook=XLSX.read(arrayBuffer,{type:'array',cellDates:true});
  const firstSheetName=workbook.SheetNames[0];
  if(!firstSheetName)throw new Error('The spreadsheet is empty.');
  return XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName],{header:1,raw:false,defval:''});
};

const normalizeType=(raw)=>{if(!raw)return'Long';const r=raw.toString().toLowerCase().trim();if(['buy','long','b','1','bullish','achat','hausse','up'].includes(r))return'Long';if(['sell','short','s','-1','bearish','vente','baisse','down'].includes(r))return'Short';if(r.includes('buy')||r.includes('long')||r.includes('achat'))return'Long';if(r.includes('sell')||r.includes('short')||r.includes('vente'))return'Short';return'Long';};
const normalizeSession=(raw)=>{if(!raw)return'NY';const r=raw.toString().toLowerCase().trim();if(r.includes('new york')||r==='ny'||r.includes('new_york')||r.includes('newyo')||r==='us'||r.includes('american')||r.includes('nyse')||r.includes('nasdaq')||r==='new-york')return'NY';if(r.includes('london')||r==='ldn'||r.includes('europe')||r==='eu'||r.includes('lse')||r.includes('euro')||r==='lon')return'London';if(r.includes('asia')||r.includes('tokyo')||r.includes('asian')||r.includes('japan')||r.includes('sydney')||r==='jp')return'Asia';return raw;};
const normalizeBias=(raw)=>{if(!raw)return'Neutral';const r=raw.toString().toLowerCase().trim();if(r.includes('bull')||r.includes('long')||r.includes('haussier')||r.includes('hausse')||r==='up'||r==='1')return'Bullish';if(r.includes('bear')||r.includes('short')||r.includes('baissier')||r.includes('baisse')||r==='down'||r==='-1')return'Bearish';return'Neutral';};
const normalizeNews=(raw)=>{if(!raw)return'Low';const r=raw.toString().toLowerCase().trim();if(r.includes('high')||r.includes('fort')||r==='3'||r==='red'||r==='rouge')return'High';if(r.includes('med')||r.includes('moyen')||r==='2'||r==='orange'||r==='yellow')return'Medium';return'Low';};
const parseNum=(v)=>{if(v==null||v==='')return null;let s=v.toString().trim().replace(/[$€£¥\s]/g,'').replace(/[^0-9.,\-+%]/g,'').replace(/%/g,'');if(s.includes(',')&&!s.includes('.'))s=s.replace(',','.');else if(s.includes(',')&&s.includes('.'))s=s.replace(/,/g,'');const n=parseFloat(s);return isNaN(n)?null:n;};
const parseDate=(raw)=>{
  if(!raw&&raw!==0)return new Date().toISOString().split('T')[0];
  if(typeof raw==='number'&&raw>20000&&raw<80000){
    const excelDate=XLSX.SSF.parse_date_code(raw);
    if(excelDate){
      const month=`${excelDate.m}`.padStart(2,'0');
      const day=`${excelDate.d}`.padStart(2,'0');
      return`${excelDate.y}-${month}-${day}`;
    }
  }
  const s=raw.toString().trim();
  if(/^\d{5}(\.\d+)?$/.test(s)){
    const excelDate=XLSX.SSF.parse_date_code(Number(s));
    if(excelDate){
      const month=`${excelDate.m}`.padStart(2,'0');
      const day=`${excelDate.d}`.padStart(2,'0');
      return`${excelDate.y}-${month}-${day}`;
    }
  }
  if(/^\d{4}-\d{2}-\d{2}/.test(s))return s.substring(0,10);
  const dmy=s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
  if(dmy)return`${dmy[3]}-${dmy[2].padStart(2,'0')}-${dmy[1].padStart(2,'0')}`;
  const mdy=s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
  if(mdy){
    const y=mdy[3].length===2?'20'+mdy[3]:mdy[3];
    return`${y}-${mdy[1].padStart(2,'0')}-${mdy[2].padStart(2,'0')}`;
  }
  if(/^\d{10,13}$/.test(s)){
    const d=new Date(s.length===10?parseInt(s,10)*1000:parseInt(s,10));
    return d.toISOString().split('T')[0];
  }
  try{
    const d=new Date(s);
    if(!isNaN(d))return d.toISOString().split('T')[0];
  }catch{}
  return new Date().toISOString().split('T')[0];
};

const guessFieldFromContent=(values)=>{
  const samples=values.filter(v=>v&&v.toString().trim()).slice(0,10);
  if(!samples.length)return null;
  const typeVals=['buy','sell','long','short','b','s','1','-1','achat','vente'];
  if(samples.filter(v=>typeVals.includes(v.toString().toLowerCase().trim())).length>=samples.length*0.6)return'type';
  const sessVals=['ny','london','asia','new york','tokyo','sydney','european','american','asian','new-york','newyo'];
  if(samples.filter(v=>sessVals.some(s=>v.toString().toLowerCase().includes(s))).length>=samples.length*0.5)return'session';
  const biasVals=['bullish','bearish','neutral','haussier','baissier','neutre','bull','bear'];
  if(samples.filter(v=>biasVals.some(b=>v.toString().toLowerCase().includes(b))).length>=samples.length*0.5)return'bias';
  const newsVals=['high','medium','low','red','orange','green','rouge','jaune','vert','fort','moyen','faible'];
  if(samples.filter(v=>newsVals.includes(v.toString().toLowerCase().trim())).length>=samples.length*0.5)return'newsImpact';
  if(samples.filter(v=>/\d{2,4}[\-\/\.]\d{1,2}[\-\/\.]\d{2,4}/.test(v)||/^\d{10,13}$/.test(v)).length>=samples.length*0.7)return'date';
  if(samples.filter(v=>/^[A-Z]{2,10}(\/[A-Z]{2,6})?$/.test(v.toString().toUpperCase().trim())).length>=samples.length*0.6)return'symbol';
  const nums=samples.map(v=>parseNum(v)).filter(n=>n!==null);
  if(nums.length>=samples.length*0.8){const hasNeg=nums.some(n=>n<0);const hasPos=nums.some(n=>n>0);if(hasNeg&&hasPos&&Math.max(...nums.map(Math.abs))<100000)return'pnl';}
  return null;
};

const getMappingConfidence=(header,mappedField,sampleValues)=>{
  if(mappedField==='_ignore')return 0;
  if(mappedField==='_extra')return 30; // 🔧 FIX: extra = neutral (not red)
  const norm=normalizeKey(header);
  if(FIELD_MAP[norm]===mappedField)return 100;
  const partialKey=Object.keys(FIELD_MAP).find(k=>(k.includes(norm)||norm.includes(k))&&k.length>=3);
  if(partialKey&&FIELD_MAP[partialKey]===mappedField)return 70;
  const guessed=guessFieldFromContent(sampleValues);
  if(guessed===mappedField)return 50;
  return 20;
};

const ImportModal=({isOpen,onClose,onImport})=>{
  const[step,setStep]=useState(1);
  const[file,setFile]=useState(null);
  const[drag,setDrag]=useState(false);
  const[parsing,setParsing]=useState(false);
  const[rawHeaders,setRawHeaders]=useState([]);
  const[previewRows,setPreviewRows]=useState([]);
  const[mapping,setMapping]=useState({});
  const[confidence,setConfidence]=useState({});
  const[importing,setImporting]=useState(false);
  const[importResult,setImportResult]=useState(null);
  const[sep,setSep]=useState(',');
  const[allLines,setAllLines]=useState([]);
  const[filterConf,setFilterConf]=useState('all');
  const fileRef=useRef(null);

  const handleClose=()=>{setStep(1);setFile(null);setDrag(false);setParsing(false);setRawHeaders([]);setPreviewRows([]);setMapping({});setConfidence({});setImporting(false);setImportResult(null);setAllLines([]);setFilterConf('all');onClose();};

  const handleFileLoad=(f)=>{
    if(!f)return;setFile(f);setParsing(true);
    const reader=new FileReader();
    reader.onload=(e)=>{
      try{
        const arrayBuffer=e.target.result;
        let headers=[];
        let preview=[];
        let importedRows=[];
        let detectedSep=',';
        if(isSpreadsheetFile(f.name)){
          const prepared=prepareImportedRows(getRowsFromWorkbook(arrayBuffer));
          headers=prepared.headers;
          preview=prepared.preview;
          importedRows=prepared.dataRows;
          detectedSep='workbook';
          setSep(detectedSep);
        }else{
        const bytes=new Uint8Array(arrayBuffer);
        let content;
        if(bytes[0]===0xEF&&bytes[1]===0xBB&&bytes[2]===0xBF)content=new TextDecoder('utf-8').decode(bytes.slice(3));
        else{try{content=new TextDecoder('utf-8').decode(bytes);}catch{content=new TextDecoder('iso-8859-1').decode(bytes);}}
        content=content.trim();
        detectedSep=detectSeparator(content);setSep(detectedSep);
        const lines=content.split(/\r?\n/).filter(l=>l.trim());

        // 🔧 FIX : clear minimum message (instead of "Fichier trop court")
        if(lines.length<2){
          toast.error('Invalid file: you need at least 1 header line + 1 data line.');
          setParsing(false);return;
        }

        headers=parseCSVLine(lines[0],detectedSep);
        preview=lines.slice(1,8).map(l=>parseCSVLine(l,detectedSep));
        importedRows=lines.slice(1).map(l=>parseCSVLine(l,detectedSep));
        }

        // PASS 1: match by name
        const autoMap={};
        headers.forEach(h=>{const norm=normalizeKey(h);autoMap[h]=FIELD_MAP[norm]||null;});

        // PASS 2: analyze content for non-matched
        headers.forEach((h,colIdx)=>{
          if(!autoMap[h]){
            const colValues=preview.map(row=>row[colIdx]||'').filter(Boolean);
            const guessed=guessFieldFromContent(colValues);
            autoMap[h]=guessed||'_extra';
          }
        });

        // PASS 3: resolve duplicates
        const usedFields={};
        headers.forEach(h=>{
          const f=autoMap[h];
          if(!f||f==='_extra'||f==='_ignore')return;
          if(!usedFields[f]){usedFields[f]=h;}
          else{
            const normH=normalizeKey(h);const normE=normalizeKey(usedFields[f]);
            const scoreH=FIELD_MAP[normH]===f?100:50;const scoreE=FIELD_MAP[normE]===f?100:50;
            if(scoreH>scoreE){autoMap[usedFields[f]]='_extra';usedFields[f]=h;}
            else{autoMap[h]='_extra';}
          }
        });

        // Calcul confiance
        const conf={};
        headers.forEach((h,colIdx)=>{
          const colValues=preview.map(row=>row[colIdx]||'');
          conf[h]=getMappingConfidence(h,autoMap[h],colValues);
        });

        setRawHeaders(headers);setPreviewRows(preview.slice(0,5));setMapping(autoMap);setConfidence(conf);setAllLines(importedRows);setParsing(false);setStep(2);
        const highCount=Object.values(conf).filter(c=>c>=70).length;
        toast.success(`${highCount}/${headers.length} columns auto-detected`);
      }catch(err){toast.error(`Error: ${err.message}`);setParsing(false);}
    };
    reader.readAsArrayBuffer(f);
  };

  // 🔧 FIX PRINCIPAL : mapping vers les bons champs Supabase
  const handleImport=()=>{
    setImporting(true);
    setTimeout(async()=>{
      try{
        const results=[];const skipped=[];
        allLines.forEach((line,idx)=>{
          const vals=Array.isArray(line)?line:parseCSVLine(line,sep);
          if(!vals.some(val=>String(val||'').trim()))return;
          const raw={};rawHeaders.forEach((h,i)=>{raw[h]=(vals[i]||'').toString().trim();});
          const mapped={};const extra={};
          rawHeaders.forEach(h=>{
            const target=mapping[h]||'_extra';const val=raw[h]||'';
            if(target==='_ignore')return;
            if(target==='_extra'){if(val)extra[h]=val;return;}
            if(!mapped[target]&&val)mapped[target]=val;
          });
          if(!mapped.symbol){skipped.push(idx+2);return;}
          const entry   = parseNum(mapped.entry);
          const exit    = parseNum(mapped.exit);
          const pnlVal  = parseNum(mapped.pnl)??0;
          const slVal   = parseNum(mapped.sl);
          const tpVal   = parseNum(mapped.tp);
          const beVal   = parseNum(mapped.breakEven);
          const tsVal   = parseNum(mapped.trailingStop);
          const lotsVal = parseNum(mapped.lots);
          const commVal = parseNum(mapped.commission);
          const swapVal = parseNum(mapped.swap);
          const riskVal = parseNum(mapped.risk);
          const rrVal   = parseNum(mapped.rrActual);
          const riskDist= slVal&&entry?Math.abs(entry-slVal):0;
          const reward  = entry&&exit?Math.abs(exit-entry):0;
          const rrCalc  = riskDist>0?(reward/riskDist).toFixed(2):rrVal?.toFixed(2)||'0';
          const tpPctCalc= tpVal&&entry&&Math.abs(tpVal-entry)>0?((reward/Math.abs(tpVal-entry))*100).toFixed(1):'0';
          const typeNorm = normalizeType(mapped.type||mapped.side);
          const sessionNorm = normalizeSession(mapped.session);
          const dateStr = parseDate(mapped.date);

          // IMPORTANT : ne jamais passer id, user_id, created_at
          // addTrade() in TradingContext handles user_id itself from session
          // Supabase generates id and created_at automatically
          results.push({
            symbol:      mapped.symbol.toUpperCase().trim().replace(/[^A-Z0-9\/\.\-_]/g,''),
            pair:        mapped.symbol.toUpperCase().trim().replace(/[^A-Z0-9\/\.\-_]/g,''),
            direction:   typeNorm,
            type:        typeNorm,
            dir:         typeNorm,
            entry:       entry||0,
            exit:        exit||0,
            tp:          tpVal,
            sl:          slVal,
            size:        lotsVal||0,
            pnl:         pnlVal,
            open_date:   dateStr,
            date:        dateStr,
            time:        mapped.time||'',
            session:     sessionNorm,
            bias:        normalizeBias(mapped.bias),
            newsImpact:  normalizeNews(mapped.newsImpact),
            setup:       mapped.setup||'',
            notes:       mapped.notes||'',
            breakEven:   beVal,
            trailingStop:tsVal,
            lots:        lotsVal,
            commission:  commVal,
            swap:        swapVal,
            risk:        riskVal,
            tags:        mapped.tags||null,
            marketType:  mapped.marketType||'',
            exchange:    mapped.exchange||'',
            account:     mapped.account||'',
            duration:    mapped.duration||'',
            psychologyScore: mapped.psychologyScore?parseInt(mapped.psychologyScore):80,
            extra:       Object.keys(extra).length?extra:undefined,
            metrics:     {rrReel:rrCalc,tpPercent:tpPctCalc},
          });
        });

        setImportResult({count:results.length,ignored:skipped.length});
        if(!results.length){toast.error('No valid trade. Check that the Symbol column is mapped.');setImporting(false);return;}

        // Sequential import with error handling d'erreur par trade
        let success=0, failed=0;
        for(const trade of results){
          const res=await onImport(trade);
          if(res!==null&&res!==false)success++;
          else failed++;
        }

        if(success>0)toast.success(`${success} trade(s) imported.`);
        if(failed>0)toast.error(`${failed} trade(s) failed (see console)`);
        if(skipped.length>0)toast(`${skipped.length} line(s) skipped (missing symbol)`);
        setImporting(false);setStep(3);
      }catch(err){toast.error(`Import error: ${err.message}`);console.error(err);setImporting(false);}
    },100);
  };

  if(!isOpen)return null;

  const iStyle={padding:'6px 10px',borderRadius:6,border:`1px solid ${C.brd}`,backgroundColor:C.bgDeep,color:C.t1,fontSize:11,outline:'none',fontFamily:'inherit',cursor:'pointer',width:'100%'};
  const symbolMapped=Object.values(mapping).includes('symbol');
  const highCount  =rawHeaders.filter(h=>(confidence[h]??0)>=70).length;
  const medCount   =rawHeaders.filter(h=>{const c=confidence[h]??0;return c>=50&&c<70;}).length;
  const lowCount   =rawHeaders.filter(h=>(confidence[h]??0)<50&&mapping[h]!=='_ignore'&&mapping[h]!=='_extra').length;
  const extraCount =rawHeaders.filter(h=>mapping[h]==='_extra').length;

  // 🔧 FIX colors: extra = purple/blue, not red
  const confColor=(c,field)=>{
    if(field==='_extra')  return C.blue;     // BLUE for extra (not red!)
    if(field==='_ignore') return C.t4;       // gray for ignored
    if(c>=70) return C.green;
    if(c>=50) return C.warn;
    return C.danger;  // red ONLY for real unknown unmapped
  };
  const confLabel=(c,field)=>{
    if(field==='_extra')  return 'extra';
    if(field==='_ignore') return 'ignored';
    if(c>=70) return 'Auto';
    if(c>=50) return '~ Guessed';
    return '? Manual';
  };

  const filteredHeaders=rawHeaders.filter(h=>{
    const c=confidence[h]??0;const cur=mapping[h]||'_extra';
    if(filterConf==='high')    return c>=70;
    if(filterConf==='low')     return c<70&&cur!=='_extra'&&cur!=='_ignore';
    if(filterConf==='unmapped')return cur==='_extra';
    return true;
  });
  const sourceLabel=sep==='workbook'?'Workbook':sep==='\t'?'Tab':sep;

  return(
    <AnimatePresence>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={handleClose}
        style={{position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.78)',backdropFilter:'blur(5px)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
        <motion.div initial={{scale:0.92,opacity:0,y:20}} animate={{scale:1,opacity:1,y:0}} exit={{scale:0.92,opacity:0,y:10}} transition={{type:'spring',stiffness:280,damping:28}} onClick={e=>e.stopPropagation()}
          style={{backgroundColor:C.bgCard,borderRadius:16,border:`1px solid ${C.brd}`,width:'100%',maxWidth:step===2?980:560,maxHeight:'94vh',overflow:'hidden',display:'flex',flexDirection:'column',boxShadow:'0 40px 100px rgba(0,0,0,0.65)'}}>

          {/* HEADER */}
          <div style={{padding:'14px 22px',borderBottom:`1px solid ${C.brd}`,background:`linear-gradient(135deg,${C.bgHigh},${C.bgCard})`,display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
            <div>
              <h3 style={{margin:0,fontSize:15,fontWeight:800,color:C.t1}}>
                {step===1&&'Import file'}
                {step===2&&'Field mapping'}
                {step===3&&'Import complete'}
              </h3>
              <p style={{margin:'2px 0 0',fontSize:10,color:C.t3}}>
                {step===1&&'Smart detection for broker exports, spreadsheets, and manual trading logs'}
                {step===2&&`${rawHeaders.length} columns / ${highCount} auto-mapped / source: ${sourceLabel}`}
                {step===3&&`${importResult?.count} trades imported successfully`}
              </p>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:5}}>
              {[1,2,3].map(s=>(<React.Fragment key={s}><div style={{width:24,height:24,borderRadius:'50%',background:s===step?C.grad:s<step?C.greenDim:C.bgDeep,border:`1px solid ${s<=step?'transparent':C.brd}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:800,color:s<=step?C.bgDeep:C.t3,transition:'all 0.3s'}}>{s}</div>{s<3&&<div style={{width:14,height:1,backgroundColor:s<step?C.greenDim:C.brd}}/>}</React.Fragment>))}
            </div>
          </div>

          {/* STEP 1 */}
          {step===1&&(
            <div style={{padding:'22px',flex:1,overflowY:'auto'}}>
              <div onDragEnter={e=>{e.preventDefault();setDrag(true);}} onDragLeave={e=>{e.preventDefault();setDrag(false);}} onDragOver={e=>{e.preventDefault();setDrag(true);}} onDrop={e=>{e.preventDefault();setDrag(false);if(e.dataTransfer.files[0])handleFileLoad(e.dataTransfer.files[0]);}} onClick={()=>fileRef.current?.click()}
                style={{border:`2px dashed ${drag?C.cyan:file?C.green:C.brd}`,borderRadius:12,padding:'38px 24px',textAlign:'center',backgroundColor:drag?'rgba(var(--mf-accent-rgb, 6, 230, 255),0.04)':file?'rgba(var(--mf-green-rgb, 0, 255, 136),0.03)':C.bgDeep,cursor:'pointer',transition:'all 0.25s'}}>
                <input ref={fileRef} type="file" accept=".csv,.txt,.tsv,.xlsx,.xls" style={{display:'none'}} onChange={e=>e.target.files[0]&&handleFileLoad(e.target.files[0])}/>
                {parsing?<div style={{fontSize:13,color:C.cyan}}><motion.div animate={{rotate:360}} transition={{duration:1,repeat:Infinity,ease:'linear'}} style={{width:26,height:26,border:`3px solid ${C.cyan}`,borderTopColor:'transparent',borderRadius:'50%',margin:'0 auto 10px'}}/>Smart analysis in progress...</div>
                :file?<><div style={{width:42,height:3,borderRadius:999,background:C.green,margin:'0 auto 14px'}}/><div style={{fontSize:13,fontWeight:700,color:C.green,marginBottom:3}}>{file.name}</div><div style={{fontSize:10,color:C.t3}}>{(file.size/1024).toFixed(1)} KB / click to change</div></>
                :<><div style={{width:48,height:3,borderRadius:999,background:C.cyan,margin:'0 auto 16px'}}/><div style={{fontSize:13,fontWeight:600,color:C.t1,marginBottom:4}}>Drop your trading file here</div><div style={{fontSize:10,color:C.t3}}>or click to browse / .csv .txt .tsv .xlsx .xls</div></>}
              </div>
              <div style={{marginTop:14,padding:'12px 14px',borderRadius:10,backgroundColor:'rgba(var(--mf-accent-rgb, 6, 230, 255),0.03)',border:`1px solid rgba(var(--mf-accent-rgb, 6, 230, 255),0.1)`}}>
                <div style={{fontSize:9,fontWeight:700,color:C.cyan,marginBottom:8,letterSpacing:'1px'}}>SMART DETECTION IN 3 PASSES</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
                  {[{title:'By name',desc:'200+ aliases: sl/stoploss/stop, tp/target, be/breakeven, trailing stop, session, bias.'},{title:'By content',desc:'Analyzes values: buy/sell to Type, NY/London to Session, bullish/bearish to Bias.'},{title:'Anti-duplicates',desc:'If two columns match the same field, the most likely one is kept and the other becomes extra.'}].map(({title,desc})=>(<div key={title} style={{padding:'8px 10px',borderRadius:8,backgroundColor:C.bgDeep,border:`1px solid ${C.brd}`}}><div style={{width:24,height:2,borderRadius:999,background:C.cyan,marginBottom:8}}/><div style={{fontSize:10,fontWeight:700,color:C.t1,marginBottom:2}}>{title}</div><div style={{fontSize:9,color:C.t4,lineHeight:1.5}}>{desc}</div></div>))}
                </div>
              </div>
              <div style={{marginTop:10,padding:'10px 13px',borderRadius:9,backgroundColor:'rgba(var(--mf-accent-rgb, 6, 230, 255),0.03)',border:`1px solid rgba(var(--mf-accent-rgb, 6, 230, 255),0.1)`}}>
                <div style={{fontSize:9,fontWeight:700,color:C.cyan,marginBottom:6}}>COMPATIBLE WITH</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                  {['MT4','MT5','cTrader','TradingView','TradeZella','TraderSync','FTMO','TopStep','E8','The5%ers','Binance','Bybit','Kraken','OANDA','Forex.com','Interactive Brokers','ThinkOrSwim','NinjaTrader','Tradovate','Excel','Google Sheets','Notion','Airtable'].map(b=>(<span key={b} style={{padding:'2px 7px',borderRadius:4,fontSize:9,fontWeight:600,color:C.t3,backgroundColor:C.bgDeep,border:`1px solid ${C.brd}`}}>{b}</span>))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step===2&&(
            <div style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column'}}>
              {/* Barre stats */}
              <div style={{padding:'10px 20px',borderBottom:`1px solid ${C.brd}`,flexShrink:0,backgroundColor:C.bgDeep}}>
                <div style={{display:'flex',gap:7,marginBottom:8,flexWrap:'wrap',alignItems:'center'}}>
                  <span style={{fontSize:10,color:C.t3,fontWeight:600}}>Detection result :</span>
                  {[
                    {label:`${highCount} auto`,          color:C.green,  bg:'rgba(var(--mf-green-rgb, 0, 255, 136),0.1)'},
                    {label:`${medCount} guessed`,       color:C.warn,   bg:'rgba(var(--mf-warn-rgb, 255, 179, 26),0.1)'},
                    {label:`${lowCount} to check`,     color:C.danger, bg:'rgba(var(--mf-danger-rgb, 255, 61, 87),0.1)'},
                    // 🔧 FIX : extra = bleu/purple, plus de rouge
                    {label:`${extraCount} extra`,        color:C.blue,   bg:'rgba(91,123,246,0.1)'},
                  ].map(({label,color,bg})=>(<span key={label} style={{fontSize:9,padding:'2px 8px',borderRadius:4,color,backgroundColor:bg,fontWeight:700}}>{label}</span>))}
                </div>
                <div style={{display:'flex',gap:4,alignItems:'center'}}>
                  {[
                    {k:'all',     label:`All (${rawHeaders.length})`},
                    {k:'high',    label:`Auto (${highCount})`},
                    {k:'low',     label:`? To check (${lowCount})`},
                    {k:'unmapped',label:`Extra (${extraCount})`},
                  ].map(({k,label})=>(<button key={k} onClick={()=>setFilterConf(k)} style={{padding:'4px 10px',borderRadius:6,border:`1px solid ${filterConf===k?C.cyan:C.brd}`,backgroundColor:filterConf===k?'rgba(var(--mf-accent-rgb, 6, 230, 255),0.1)':C.bgDeep,color:filterConf===k?C.cyan:C.t3,fontSize:10,fontWeight:filterConf===k?700:400,cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s'}}>{label}</button>))}
                  <div style={{flex:1}}/>
                  <button onClick={()=>{const re={};rawHeaders.forEach(h=>{const norm=normalizeKey(h);re[h]=FIELD_MAP[norm]||'_extra';});setMapping(re);toast.success('Mapping reset');}} style={{padding:'4px 10px',borderRadius:6,border:`1px solid ${C.brd}`,backgroundColor:C.bgDeep,color:C.t3,fontSize:10,cursor:'pointer',fontFamily:'inherit'}}>Reset auto</button>
                </div>
              </div>

              <div style={{flex:1,overflow:'auto',padding:'12px 20px'}}>
                {/* Preview */}
                <div style={{marginBottom:12,overflowX:'auto'}}>
                  <div style={{fontSize:9,fontWeight:700,color:C.t3,marginBottom:5,letterSpacing:'0.8px'}}>DATA PREVIEW (first 5 rows)</div>
                  <table style={{borderCollapse:'collapse',minWidth:'max-content',fontSize:9}}>
                    <thead><tr>{rawHeaders.map(h=>(<th key={h} style={{padding:'4px 8px',backgroundColor:C.bgDeep,border:`1px solid ${C.brd}`,whiteSpace:'nowrap',color:C.cyan,fontWeight:700,maxWidth:100,overflow:'hidden',textOverflow:'ellipsis'}}>{h}</th>))}</tr></thead>
                    <tbody>{previewRows.map((row,ri)=>(<tr key={ri} style={{backgroundColor:ri%2===0?'transparent':'rgba(255,255,255,0.01)'}}>{rawHeaders.map((_,ci)=>(<td key={ci} style={{padding:'3px 8px',border:`1px solid ${shade(C.brd,'20')}`,color:C.t2,whiteSpace:'nowrap',maxWidth:100,overflow:'hidden',textOverflow:'ellipsis'}}>{row[ci]||''}</td>))}</tr>))}</tbody>
                  </table>
                </div>

                {/* Grille mapping */}
                <div style={{fontSize:9,fontWeight:700,color:C.t3,marginBottom:8,letterSpacing:'0.8px'}}>MAPPING — modify, add or ignore freely</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))',gap:7}}>
                  {filteredHeaders.map(h=>{
                    const cur    = mapping[h]||'_extra';
                    const conf   = confidence[h]??0;
                    const cc     = confColor(conf, cur);
                    const cl     = confLabel(conf, cur);
                    const isIgn  = cur==='_ignore';
                    const isExtr = cur==='_extra';
                    const isReq  = ['symbol','pnl'].includes(cur);
                    const colIdx = rawHeaders.indexOf(h);
                    const sample = previewRows[0]?.[colIdx]||'';
                    return(
                      <motion.div key={h} initial={{opacity:0,y:4}} animate={{opacity:1,y:0}}
                        style={{
                          padding:'9px 11px',borderRadius:9,
                          backgroundColor:isIgn ? shade(C.bgDeep,'60') : C.bgDeep,
                          // 🔧 FIX : bordure bleue pour extra, pas rouge
                          border:`1px solid ${isReq ? shade(C.cyan,'60') : isIgn ? shade(C.brd,'40') : isExtr ? shade(C.blue,'30') : shade(cc,'30')}`,
                          opacity:isIgn?0.4:1,position:'relative',
                        }}>
                        {/* Badge confiance */}
                        <div style={{position:'absolute',top:6,right:8,fontSize:7,fontWeight:800,color:cc,letterSpacing:'0.3px'}}>{cl}</div>
                        <div style={{fontSize:10,fontWeight:700,color:isIgn?C.t3:C.t1,marginBottom:4,paddingRight:60,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={h}>{h}</div>
                        <select value={cur} onChange={e=>{
                          const newVal=e.target.value;
                          const existing=rawHeaders.find(hh=>hh!==h&&mapping[hh]===newVal&&newVal!=='_extra'&&newVal!=='_ignore');
                          if(existing){setMapping(m=>({...m,[existing]:'_extra',[h]:newVal}));toast(`"${existing}" moved to extra`,{duration:2000});}
                          else{setMapping(m=>({...m,[h]:newVal}));}
                        }} style={{...iStyle,fontSize:10,borderColor:isReq ? shade(C.cyan,'50') : isIgn ? shade(C.brd,'60') : isExtr ? shade(C.blue,'30') : shade(cc,'25'),color:isIgn?C.t3:C.t1}}>
                          {KNOWN_FIELDS.map(f=>(<option key={f.value} value={f.value}>{CLEAN_FIELD_LABELS[f.value]||f.label}{f.required?' *':''}</option>))}
                        </select>
                        {sample&&(<div style={{fontSize:8,color:C.t4,fontFamily:'monospace',marginTop:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>ex: {sample}</div>)}
                      </motion.div>
                    );
                  })}
                </div>

                {!symbolMapped&&(<motion.div initial={{opacity:0}} animate={{opacity:1}} style={{marginTop:12,padding:'10px 14px',borderRadius:8,backgroundColor:'rgba(var(--mf-danger-rgb, 255, 61, 87),0.06)',border:`1px solid ${shade(C.danger,'30')}`,fontSize:11,color:C.danger}}>The <strong>Symbol</strong> column is required. Find the column containing your pairs (e.g. EURUSD, BTCUSDT) and select <em>Symbol</em>.</motion.div>)}

                {/* Summary */}
                <div style={{marginTop:12,padding:'10px 14px',borderRadius:8,backgroundColor:'rgba(var(--mf-accent-rgb, 6, 230, 255),0.03)',border:`1px solid rgba(var(--mf-accent-rgb, 6, 230, 255),0.1)`}}>
                  <div style={{fontSize:9,color:C.t3,fontWeight:700,marginBottom:6}}>MARKETFLOW FIELDS MAPPED</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                    {KNOWN_FIELDS.filter(f=>f.value!=='_ignore'&&f.value!=='_extra').map(f=>{
                      const isMapped=Object.values(mapping).includes(f.value);
                      const mappedFrom=rawHeaders.find(h=>mapping[h]===f.value);
                      return(<div key={f.value} style={{fontSize:8,padding:'3px 8px',borderRadius:5,backgroundColor:isMapped?`${shade(C.green,'12')}`:C.bgDeep,border:`1px solid ${isMapped?C.greenDim:C.brd}`,color:isMapped?C.green:C.t4,fontWeight:isMapped?700:400,display:'flex',alignItems:'center',gap:4}}>{CLEAN_FIELD_LABELS[f.value]||f.label}{isMapped&&<span style={{color:C.teal,fontSize:7}}>from {mappedFrom}</span>}</div>);
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step===3&&(
            <div style={{padding:'40px 22px',textAlign:'center',flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
              <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:'spring',delay:0.1,stiffness:160}}><div style={{width:70,height:4,borderRadius:999,background:C.grad,margin:'0 auto 24px'}}/></motion.div>
              <h2 style={{margin:'0 0 8px',fontSize:24,fontWeight:900,background:C.grad,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Import completed</h2>
              <div style={{fontSize:14,color:C.t2,marginBottom:6}}><span style={{color:C.green,fontWeight:800,fontSize:22}}>{importResult?.count}</span> trades imported to Supabase</div>
              {importResult?.ignored>0&&<div style={{fontSize:12,color:C.warn,marginBottom:14}}>{importResult.ignored} line(s) skipped</div>}
              <div style={{marginTop:24}}><GlassBtn variant="primary" icon="✓" onClick={handleClose}>Close and view trades</GlassBtn></div>
            </div>
          )}

          {/* FOOTER */}
          {step!==3&&(
            <div style={{padding:'12px 20px',borderTop:`1px solid ${C.brd}`,display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0,backgroundColor:C.bgDeep}}>
              <GlassBtn onClick={step===1?handleClose:()=>setStep(1)} icon={step===2?'←':undefined}>{step===1?'Cancel':'Back'}</GlassBtn>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                {step===2&&<span style={{fontSize:11,color:C.t3}}>{allLines.length} lines to import</span>}
                {step===1&&file&&!parsing&&(<GlassBtn variant="primary" onClick={()=>setStep(2)} icon="🤖">Auto-detect</GlassBtn>)}
                {step===2&&(<GlassBtn variant="primary" loading={importing} disabled={!symbolMapped} onClick={handleImport}>Import {allLines.length} trade(s)</GlassBtn>)}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// ✏️ TRADE FORM MODAL
// ══════════════════════════════════════════════════════════════════════════════
const TradeFormModal=({isOpen,onClose,onSave,trade=null,customColumns=[]})=>{
  const isEdit=!!trade;
  const[form,setForm]=useState(createEmptyTradeForm(customColumns));
  const[saving,setSaving]=useState(false);const[errors,setErrors]=useState({});
  const[showAdvanced,setShowAdvanced]=useState(false);
  useEffect(()=>{
    const base=createEmptyTradeForm(customColumns);
    if(trade){
      const prepared=toTradeFormData(trade);
      setForm({...base,...prepared,extra:{...base.extra,...(prepared.extra||{})}});
    }else{
      setForm(base);
    }
    setShowAdvanced(Boolean(trade)||customColumns.length>0);
    setErrors({});
  },[trade,isOpen,customColumns]);
  const mergedCustomColumns=useMemo(()=>mergeCustomColumnsWithExtra(customColumns,form.extra),[customColumns,form.extra]);
  const calcRR=d=>{const[en,ex,sl]=[parseFloat(d.entry),parseFloat(d.exit),parseFloat(d.sl)];if(!en||!ex||!sl||isNaN(en)||isNaN(ex)||isNaN(sl))return'0.00';const risk=Math.abs(en-sl),reward=Math.abs(ex-en);return risk>0?(reward/risk).toFixed(2):'0.00';};
  const calcTPP=d=>{const[en,ex,tp]=[parseFloat(d.entry),parseFloat(d.exit),parseFloat(d.tp)];if(!en||!ex||!tp||isNaN(en)||isNaN(ex)||isNaN(tp))return'0.0';const target=Math.abs(tp-en);return target>0?((Math.abs(ex-en)/target)*100).toFixed(1):'0.0';};
  const validate=()=>{const errs={};if(!form.symbol?.trim())errs.symbol='Required';if(!form.date)errs.date='Required';if(form.entry!==''&&isNaN(parseFloat(form.entry)))errs.entry='Invalid price';if(form.exit!==''&&isNaN(parseFloat(form.exit)))errs.exit='Invalid price';if(form.pnl!==''&&isNaN(parseFloat(form.pnl)))errs.pnl='Invalid amount';if(form.pnl===''&&!form.entry&&!form.exit)errs.pnl='Add P&L or prices';setErrors(errs);return Object.keys(errs).length===0;};
  const handleSubmit=async()=>{if(!validate()){toast.error('Check the highlighted fields');return;}setSaving(true);try{const saved=await onSave({...form,symbol:(form.symbol||'').toUpperCase().trim(),extra:cleanExtraValues(form.extra),id:form.id,win:parseFloat(form.pnl)>0,metrics:{rrReel:calcRR(form),tpPercent:calcTPP(form)},lastModified:new Date().toISOString()});if(!saved){toast.error('Trade could not be saved');return;}toast.success(isEdit?'Trade updated':'Trade added');setErrors({});onClose();}finally{setSaving(false);}};
  if(!isOpen)return null;
  const iStyle={width:'100%',padding:'8px 11px',borderRadius:7,border:`1px solid ${C.brd}`,backgroundColor:C.bgDeep,color:C.t1,fontSize:12,outline:'none',fontFamily:'inherit'};
  const lStyle={display:'block',fontSize:10,fontWeight:600,color:C.t3,marginBottom:5};
  const eStyle={fontSize:10,color:C.danger,marginTop:3};
  return(
    <AnimatePresence>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose} style={{position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.75)',backdropFilter:'blur(4px)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:20,overflowY:'auto'}}>
        <motion.div initial={{scale:0.96,y:18}} animate={{scale:1,y:0}} exit={{scale:0.96,y:18}} onClick={e=>e.stopPropagation()} style={{background:'linear-gradient(180deg, rgba(10,17,28,0.98), rgba(8,13,22,0.98))',borderRadius:24,border:`1px solid ${C.brd}`,maxWidth:720,width:'100%',maxHeight:'90vh',overflow:'hidden',display:'flex',flexDirection:'column',boxShadow:'0 28px 90px rgba(0,0,0,0.42)'}}>
          <div style={{padding:'22px 24px 18px',borderBottom:`1px solid ${C.brd}`,background:'linear-gradient(180deg, rgba(var(--mf-accent-rgb, 6, 230, 255),0.06), rgba(255,255,255,0))'}}>
            <div style={{fontSize:10,color:C.t3,fontWeight:800,letterSpacing:'0.16em',textTransform:'uppercase'}}>Manual entry</div>
            <h3 style={{margin:'8px 0 0',fontSize:24,fontWeight:900,color:C.t1,letterSpacing:'-0.03em'}}>{isEdit?'Edit trade':'Add trade'}</h3>
            <div style={{marginTop:8,fontSize:12.5,color:C.t2}}>Keep the essentials visible. Open advanced fields only when you need more detail.</div>
          </div>
          <div style={{flex:1,overflowY:'auto',padding:'22px 24px 24px'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:15}}>
              {[{k:'symbol',l:'Pair *',t:'text',ph:'EURUSD'},{k:'account',l:'Account',t:'text',ph:'FTMO Challenge'},{k:'type',l:'Direction',t:'select',opts:['Long','Short']},{k:'date',l:'Date *',t:'date'},{k:'session',l:'Session',t:'select',opts:['NY','London','Asia']},{k:'pnl',l:'P&L',t:'number',ph:'150.00',step:'0.01'},{k:'entry',l:'Entry',t:'number',ph:'1.08500',step:'0.00001'},{k:'exit',l:'Exit',t:'number',ph:'1.09000',step:'0.00001'}].map(({k,l,t,ph,step,opts})=>(
                <div key={k}>
                  <label style={{...lStyle,color:errors[k]?C.danger:C.t3}}>{l}</label>
                  {t==='select'
                    ? <select value={form[k]||''} onChange={e=>setForm({...form,[k]:e.target.value})} style={{...iStyle,border:`1px solid ${errors[k]?C.danger:C.brd}`,cursor:'pointer'}}>{opts.map(o=><option key={o} value={o}>{o}</option>)}</select>
                    : <input type={t} placeholder={ph} step={step} value={form[k]||''} onChange={e=>setForm({...form,[k]:k==='symbol'?e.target.value.toUpperCase():e.target.value})} style={{...iStyle,border:`1px solid ${errors[k]?C.danger:C.brd}`}}/>
                  }
                  {errors[k]&&<div style={eStyle}>{errors[k]}</div>}
                </div>
              ))}
            </div>
            <div style={{marginTop:16,padding:'12px 14px',borderRadius:16,border:`1px solid ${C.brd}`,background:'rgba(255,255,255,0.02)',display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}>
              <div>
                <div style={{fontSize:10,color:C.t3,fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase'}}>Advanced fields</div>
                <div style={{fontSize:12,color:C.t2,marginTop:4}}>Time, setup, levels, psychology, and custom fields.</div>
              </div>
              <button type="button" onClick={()=>setShowAdvanced(value=>!value)} style={{padding:'9px 12px',borderRadius:12,border:`1px solid ${shade(C.cyan,'18')}`,background:showAdvanced?'rgba(var(--mf-accent-rgb, 6, 230, 255),0.08)':'rgba(255,255,255,0.02)',color:showAdvanced?C.cyan:C.t2,fontSize:11,fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>
                {showAdvanced?'Hide advanced':'Show advanced'}
              </button>
            </div>
            {showAdvanced&&(
              <div style={{marginTop:18}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:15}}>
                  {[{k:'time',l:'Time',t:'time'},{k:'setup',l:'Setup',t:'text',ph:'Opening range reclaim'},{k:'sl',l:'Stop loss',t:'number',step:'0.00001'},{k:'tp',l:'Take profit',t:'number',step:'0.00001'},{k:'bias',l:'Bias',t:'select',opts:['Bullish','Bearish','Neutral']},{k:'newsImpact',l:'News impact',t:'select',opts:['High','Medium','Low']}].map(({k,l,t,ph,step,opts})=>(
                    <div key={k}>
                      <label style={lStyle}>{l}</label>
                      {t==='select'
                        ? <select value={form[k]||''} onChange={e=>setForm({...form,[k]:e.target.value})} style={{...iStyle,cursor:'pointer'}}>{opts.map(o=><option key={o} value={o}>{o}</option>)}</select>
                        : <input type={t} placeholder={ph} step={step} value={form[k]||''} onChange={e=>setForm({...form,[k]:e.target.value})} style={iStyle}/>
                      }
                    </div>
                  ))}
                  <div style={{gridColumn:'1 / -1'}}>
                    <label style={lStyle}>Psychology score <span style={{color:form.psychologyScore>=80?C.green:form.psychologyScore>=60?C.warn:C.danger,fontWeight:800}}>{form.psychologyScore}</span></label>
                    <input type="range" min="0" max="100" value={form.psychologyScore} onChange={e=>setForm({...form,psychologyScore:+e.target.value})} style={{...iStyle,padding:8,accentColor:C.cyan}}/>
                  </div>
                </div>
                {mergedCustomColumns.length>0&&(<>
                <div style={{fontSize:10,fontWeight:800,color:C.t3,letterSpacing:'0.14em',textTransform:'uppercase',margin:'16px 0 10px'}}>Custom columns</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:15}}>
                  {mergedCustomColumns.map(column=>(
                    <div key={column.key||column.fieldKey}>
                      <label style={lStyle}>{column.label}</label>
                      <input type={column.dataType==='number'?'number':'text'} value={form.extra?.[column.fieldKey]??''} onChange={event=>setForm(current=>({...current,extra:{...(current.extra||{}),[column.fieldKey]:event.target.value}}))} style={iStyle}/>
                    </div>
                  ))}
                </div></>)}
              </div>
            )}
            <div style={{marginTop:14}}>
              <label style={lStyle}>Notes</label>
              <textarea placeholder="Keep the context short and useful." value={form.notes||''} onChange={e=>setForm({...form,notes:e.target.value})} rows={3} style={{...iStyle,resize:'vertical',minHeight:82}}/>
            </div>
            {form.entry&&form.exit&&form.sl&&(
              <div style={{marginTop:16,padding:14,borderRadius:16,backgroundColor:'rgba(var(--mf-accent-rgb, 6, 230, 255),0.04)',border:`1px solid rgba(var(--mf-accent-rgb, 6, 230, 255),0.14)`}}>
                <div style={{fontSize:10,fontWeight:700,color:C.cyan,marginBottom:8,letterSpacing:'0.12em',textTransform:'uppercase'}}>Calculated from levels</div>
                <div style={{display:'flex',gap:28}}>
                  <div><div style={{fontSize:9,color:C.t3}}>Risk / Reward</div><div style={{fontSize:16,fontWeight:800,color:C.teal}}>1:{calcRR(form)}</div></div>
                  <div><div style={{fontSize:9,color:C.t3}}>Target reached</div><div style={{fontSize:16,fontWeight:800,color:C.cyan}}>{calcTPP(form)}%</div></div>
                </div>
              </div>
            )}
          </div>
          <div style={{padding:'16px 24px',borderTop:`1px solid ${C.brd}`,display:'flex',gap:9,justifyContent:'flex-end'}}>
            <GlassBtn onClick={onClose}>Cancel</GlassBtn>
            <GlassBtn variant="primary" onClick={handleSubmit} loading={saving}>{isEdit?'Save Trade':'Add Trade'}</GlassBtn>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
  return(<AnimatePresence><motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose} style={{position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.75)',backdropFilter:'blur(4px)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:20,overflowY:'auto'}}><motion.div initial={{scale:0.9}} animate={{scale:1}} exit={{scale:0.9}} onClick={e=>e.stopPropagation()} style={{backgroundColor:C.bgCard,borderRadius:16,border:`1px solid ${C.brd}`,maxWidth:680,width:'100%',maxHeight:'90vh',overflow:'hidden',display:'flex',flexDirection:'column'}}><div style={{padding:'18px 22px',borderBottom:`1px solid ${C.brd}`,background:C.grad}}><h3 style={{margin:0,fontSize:17,fontWeight:700,color:'#fff'}}>{isEdit?'Edit Trade':'Add Trade'}</h3></div><div style={{flex:1,overflowY:'auto',padding:'22px'}}><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:15}}>{[{k:'date',l:'Date *',t:'date'},{k:'time',l:'Time',t:'time'},{k:'symbol',l:'Symbol *',t:'text',ph:'EURUSD'},{k:'account',l:'Account',t:'text',ph:'FTMO Challenge #1'},{k:'type',l:'Type',t:'select',opts:['Long','Short']},{k:'session',l:'Session',t:'select',opts:['NY','London','Asia']},{k:'bias',l:'Bias',t:'select',opts:['Bullish','Bearish','Neutral']},{k:'entry',l:'Entry *',t:'number',ph:'1.08500',step:'0.00001'},{k:'exit',l:'Exit *',t:'number',ph:'1.09000',step:'0.00001'},{k:'sl',l:'Stop Loss',t:'number',step:'0.00001'},{k:'tp',l:'Take Profit',t:'number',step:'0.00001'},{k:'pnl',l:'P&L ($) *',t:'number',ph:'150.00',step:'0.01'},{k:'setup',l:'Setup',t:'text',ph:'Breakout, Pullback...'},{k:'newsImpact',l:'News Impact',t:'select',opts:['High','Medium','Low']}].map(({k,l,t,ph,step,opts})=>(<div key={k}><label style={{...lStyle,color:errors[k]?C.danger:C.t3}}>{l}</label>{t==='select'?<select value={form[k]||''} onChange={e=>setForm({...form,[k]:e.target.value})} style={{...iStyle,border:`1px solid ${errors[k]?C.danger:C.brd}`,cursor:'pointer'}}>{opts.map(o=><option key={o} value={o}>{o}</option>)}</select>:<input type={t} placeholder={ph} step={step} value={form[k]||''} onChange={e=>setForm({...form,[k]:k==='symbol'?e.target.value.toUpperCase():e.target.value})} style={{...iStyle,border:`1px solid ${errors[k]?C.danger:C.brd}`}}/>}{errors[k]&&<div style={eStyle}>{errors[k]}</div>}</div>))}<div><label style={lStyle}>Psychology Score: <span style={{color:form.psychologyScore>=80?C.green:form.psychologyScore>=60?C.warn:C.danger,fontWeight:800}}>{form.psychologyScore}</span></label><input type="range" min="0" max="100" value={form.psychologyScore} onChange={e=>setForm({...form,psychologyScore:+e.target.value})} style={{...iStyle,padding:8,accentColor:C.cyan}}/></div></div><div style={{marginTop:14}}><label style={lStyle}>Notes</label><textarea placeholder="Context, emotions, observations..." value={form.notes||''} onChange={e=>setForm({...form,notes:e.target.value})} rows={3} style={{...iStyle,resize:'vertical',minHeight:70}}/></div>{form.entry&&form.exit&&form.sl&&(<div style={{marginTop:16,padding:14,borderRadius:9,backgroundColor:'rgba(var(--mf-accent-rgb, 6, 230, 255),0.05)',border:`1px solid rgba(var(--mf-accent-rgb, 6, 230, 255),0.18)`}}><div style={{fontSize:10,fontWeight:700,color:C.cyan,marginBottom:8}}>Auto calculations</div><div style={{display:'flex',gap:28}}><div><div style={{fontSize:9,color:C.t3}}>Risk/Reward</div><div style={{fontSize:16,fontWeight:800,color:C.teal}}>1:{calcRR(form)}</div></div><div><div style={{fontSize:9,color:C.t3}}>TP reached</div><div style={{fontSize:16,fontWeight:800,color:C.cyan}}>{calcTPP(form)}%</div></div></div></div>)}</div><div style={{padding:'14px 22px',borderTop:`1px solid ${C.brd}`,display:'flex',gap:9,justifyContent:'flex-end'}}><GlassBtn onClick={onClose}>Cancel</GlassBtn><GlassBtn variant="primary" onClick={handleSubmit} loading={saving}>{isEdit?'Save Trade':'Add Trade'}</GlassBtn></div></motion.div></motion.div></AnimatePresence>);
};

// ══════════════════════════════════════════════════════════════════════════════
// 🏠 COMPOSANT PRINCIPAL - AllTrades
// ══════════════════════════════════════════════════════════════════════════════
export default function AllTrades(){
  const{
    trades,
    allTrades,
    activeAccount,
    setActiveAccount,
    accountOptions,
    deleteTrade,
    deleteAllTrades,
    updateTrade,
    addTrade,
    importTrades,
    downloadBackup,
  }=useTradingContext();

  const[filters,setFilters]=useState(DEFAULT_FILTERS);
  const[sort,setSort]=useState({key:'date',dir:'desc'});
  const[selected,setSelected]=useState(new Set());
  const[cols,setCols]=useState(loadColumns);
  const[page,setPage]=useState(1);const[perPage,setPerPage]=useState(25);
  const[modalImport,setModalImport]=useState(false);
  const[modalColumns,setModalColumns]=useState(false);
  const[modalForm,setModalForm]=useState(false);const[editTrade,setEditTrade]=useState(null);
  const[detailTrade,setDetailTrade]=useState(null);
  const[showWipeModal,setShowWipeModal]=useState(false);
  const[wiping,setWiping]=useState(false);
  const[showWorkflow,setShowWorkflow]=useState(false);
  const backupRestoreRef=useRef(null);

  useEffect(()=>{try{localStorage.setItem(COLUMN_STORAGE_KEY,JSON.stringify(cols));}catch{}},[cols]);
  useEffect(()=>{setPage(1);},[filters,sort]);

  const visibleCols=useMemo(()=>cols.filter(c=>c.visible),[cols]);
  const customColumns=useMemo(()=>cols.filter(column=>isCustomColumnKey(column.key)),[cols]);
  const filtered=useMemo(()=>filterTrades(trades,filters),[trades,filters]);
  const sorted=useMemo(()=>sortTrades(filtered,sort.key,sort.dir),[filtered,sort]);
  const totalPages=Math.max(1,Math.ceil(sorted.length/perPage));
  const paginated=useMemo(()=>sorted.slice((page-1)*perPage,page*perPage),[sorted,page,perPage]);
  const cumulMap=useMemo(()=>{let r=0;const m={};[...sorted].reverse().forEach(t=>{r+=parseFloat(t.profit_loss??t.pnl??0);m[t.id]=r;});return m;},[sorted]);
  const stats=useMemo(()=>calcLedgerStats(filtered),[filtered]);
  const activeFilterCount=useMemo(()=>[filters.search,filters.result!=='all'&&filters.result,filters.symbol!=='all'&&filters.symbol,filters.session!=='all'&&filters.session,filters.bias!=='all'&&filters.bias,filters.dateFrom,filters.dateTo].filter(Boolean).length,[filters]);
  const workflowOpen=showWorkflow||activeFilterCount>0;
  const symbolCount=useMemo(()=>new Set(filtered.map(t=>t.symbol).filter(Boolean)).size,[filtered]);
  const averageTrade=stats.total?stats.totalPnL/stats.total:0;
  const latestTrade=sorted[0]||null;
  const activeScopeLabel=useMemo(()=>{
    if(activeAccount==='all') return 'All accounts';
    return accountOptions.find(option=>option.id===activeAccount)?.label || 'Current account';
  },[accountOptions,activeAccount]);
  const topSetup=useMemo(()=>{
    const setups=filtered.reduce((acc,trade)=>{
      const key=String(trade.setup||'').trim();
      if(!key)return acc;
      if(!acc[key])acc[key]={count:0,pnl:0};
      acc[key].count+=1;
      acc[key].pnl+=parseFloat(trade.profit_loss??trade.pnl??0)||0;
      return acc;
    },{});
    return Object.entries(setups).sort((a,b)=>b[1].count-a[1].count||b[1].pnl-a[1].pnl)[0]?.[0]||'Unassigned';
  },[filtered]);
  const selectedTrades=useMemo(()=>sorted.filter(trade=>selected.has(trade.id)),[sorted,selected]);
  const selectedPnl=useMemo(()=>selectedTrades.reduce((sum,trade)=>sum+(parseFloat(trade.profit_loss??trade.pnl??0)||0),0),[selectedTrades]);
  const activeSortLabel=visibleCols.find(col=>col.key===sort.key)?.label||'Date';
  const handleSort=useCallback(k=>{setSort(p=>({key:k,dir:p.key===k&&p.dir==='asc'?'desc':'asc'}));},[]);
  const handleSelectAll=useCallback(()=>{setSelected(prev=>{const ids=new Set(paginated.map(t=>t.id));const allSel=paginated.every(t=>prev.has(t.id));if(allSel){const n=new Set(prev);ids.forEach(id=>n.delete(id));return n;}return new Set([...prev,...ids]);});},[paginated]);
  const handleDeleteSelected=useCallback(()=>{if(!selected.size)return;if(!window.confirm(`Delete ${selected.size} selected trade${selected.size>1?'s':''}?`))return;const id=toast.loading('Deleting selected trades');setTimeout(()=>{selected.forEach(tid=>deleteTrade(tid));toast.dismiss(id);toast.success(`${selected.size} trade${selected.size>1?'s':''} deleted`);setSelected(new Set());},350);},[selected,deleteTrade]);
  const handleImport=useCallback((trade)=>addTrade(trade),[addTrade]);
  const handleImportBatch=useCallback((tradeRows,options)=>importTrades?.(tradeRows,options),[importTrades]);
  const handleRegisterCustomColumns=useCallback((definitions)=>setCols(current=>upsertCustomColumns(current,definitions)),[]);

  const handleSave=useCallback(async(t)=>{const saved=t.id&&trades.find(x=>x.id===t.id)?await updateTrade(t.id,t):await addTrade(t);if(saved)setEditTrade(null);return saved;},[trades,updateTrade,addTrade]);
  const handleEdit=useCallback(t=>{setEditTrade(toTradeFormData(t));setModalForm(true);},[]);
  const handleCreate=useCallback(()=>{setEditTrade(null);setModalForm(true);},[]);
  const handleReset=useCallback(()=>{setFilters(DEFAULT_FILTERS);toast.success('Filters cleared');},[]);
  const handleImportComplete=useCallback((result={})=>{
    setFilters(DEFAULT_FILTERS);
    setSort({key:'date',dir:'desc'});
    setPage(1);
    setSelected(new Set());
    if((result?.imported||0)>0){
      setActiveAccount('all');
    }
  },[setActiveAccount]);
  const handleBackup=useCallback(()=>{
    downloadBackup?.({ columns: cols, scope: 'all' });
    toast.success(`Backup saved with ${allTrades.length} trade${allTrades.length===1?'':'s'}`);
  },[allTrades.length, cols, downloadBackup]);
  const handleRestoreBackup=useCallback(async(event)=>{
    const file=event.target.files?.[0];
    event.target.value='';
    if(!file) return;
    try{
      const snapshot=JSON.parse(await file.text());
      const backupTrades=Array.isArray(snapshot?.trades)?snapshot.trades:[];
      if(!backupTrades.length){toast.error('This backup does not contain any trades');return;}
      if(allTrades.length>0&&!window.confirm('Restore will append the backup to your current journal. Continue?')) return;
      if(Array.isArray(snapshot?.columns)&&snapshot.columns.length){
        setCols(normalizeStoredColumns(snapshot.columns));
      }
      const result=await importTrades?.(backupTrades);
      if(result?.imported){
        toast.success(`${result.imported} trade${result.imported===1?'':'s'} restored from backup`);
      }else{
        toast.error(result?.error||'No trade was restored from this backup');
      }
    }catch(error){
      toast.error('Backup file could not be restored');
    }
  },[allTrades.length, importTrades]);
  const handleDeleteAll=useCallback(async()=>{
    setWiping(true);
    const result=await deleteAllTrades?.();
    setWiping(false);
    if(result?.success){
      setShowWipeModal(false);
      setSelected(new Set());
      setFilters(DEFAULT_FILTERS);
      toast.success(`${result.deleted||0} trade${result.deleted===1?'':'s'} deleted`);
      return;
    }
    toast.error(result?.error||'The journal could not be wiped');
  },[deleteAllTrades]);

  return(
    <div style={{backgroundColor:'transparent',minHeight:'100vh',fontFamily:'system-ui,-apple-system,sans-serif',color:C.t1,padding:'28px 24px 48px',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',inset:0,background:'radial-gradient(circle at 10% 0%, rgba(var(--mf-accent-rgb, 6, 230, 255),0.065), transparent 24%), radial-gradient(circle at 88% 10%, rgba(var(--mf-accent-secondary-rgb, 102, 240, 255),0.03), transparent 20%), linear-gradient(135deg, rgba(255,255,255,0.015), transparent 36%, transparent 64%, rgba(var(--mf-accent-rgb, 6, 230, 255),0.02) 100%)',pointerEvents:'none'}}/>
      <div style={{position:'relative',zIndex:1,maxWidth:1520,margin:'0 auto'}}>
        <motion.div variants={fadeInUp} initial="hidden" animate="visible" style={{display:'grid',gridTemplateColumns:'minmax(0,1.45fr) minmax(320px,0.82fr)',gap:16,marginBottom:18}}>
          <div style={{padding:'24px 24px 22px',borderRadius:24,border:`1px solid ${C.brd}`,background:'linear-gradient(180deg, rgba(10,17,28,0.94), rgba(8,13,22,0.98))',boxShadow:'0 24px 48px rgba(0,0,0,0.18)',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:-120,right:-120,width:280,height:280,borderRadius:'50%',background:'radial-gradient(circle, rgba(var(--mf-accent-rgb, 6, 230, 255),0.11), transparent 68%)',pointerEvents:'none'}}/>
            <div style={{position:'relative',zIndex:1}}>
              <div style={{fontSize:10,color:C.t3,fontWeight:800,letterSpacing:'0.16em',textTransform:'uppercase',marginBottom:10}}>All trades</div>
              <div style={{display:'flex',justifyContent:'space-between',gap:18,alignItems:'flex-start',flexWrap:'wrap'}}>
                <div style={{maxWidth:720,display:'grid',gap:10}}>
                  <h1 style={{margin:0,fontSize:34,fontWeight:900,letterSpacing:'-0.04em',lineHeight:1.02,color:C.t1}}>Execution Ledger</h1>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                    <div style={{padding:'7px 10px',borderRadius:999,border:`1px solid ${shade(C.cyan,'22')}`,background:'rgba(var(--mf-accent-rgb, 6, 230, 255),0.08)',fontSize:10,fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase',color:C.cyan}}>
                      {filtered.length} rows in view
                    </div>
                    <div style={{padding:'7px 10px',borderRadius:999,border:`1px solid ${C.brd}`,background:'rgba(255,255,255,0.02)',fontSize:10,fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase',color:C.t2}}>
                      {activeScopeLabel}
                    </div>
                  </div>
                </div>
                <div style={{display:'grid',gap:8,justifyItems:'end'}}>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap',justifyContent:'flex-end'}}>
                    <GlassBtn size="sm" onClick={()=>setModalImport(true)}>Import trades</GlassBtn>
                    <GlassBtn size="sm" variant="primary" onClick={handleCreate}>Add trade</GlassBtn>
                  </div>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap',justifyContent:'flex-end'}}>
                    <GlassBtn size="sm" onClick={()=>setModalColumns(true)}>Columns</GlassBtn>
                    <GlassBtn size="sm" onClick={()=>exportToCSV(filtered,`trades_${Date.now()}.csv`)}>Export CSV</GlassBtn>
                    <GlassBtn size="sm" onClick={handleBackup}>Backup</GlassBtn>
                    <GlassBtn size="sm" onClick={()=>backupRestoreRef.current?.click()}>Restore</GlassBtn>
                    <GlassBtn size="sm" variant="danger" onClick={()=>setShowWipeModal(true)}>Delete all</GlassBtn>
                  </div>
                </div>
              </div>
              {accountOptions.length>1&&(
                <div style={{marginTop:18}}>
                  <div style={{fontSize:10,color:C.t3,fontWeight:800,letterSpacing:'0.14em',textTransform:'uppercase',marginBottom:10}}>Account scope</div>
                  <AccountScopePills options={accountOptions} activeAccount={activeAccount} onChange={setActiveAccount}/>
                </div>
              )}
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10,marginTop:18}}>
                <div style={{padding:'13px 14px',borderRadius:16,border:`1px solid ${C.brd}`,background:'rgba(255,255,255,0.02)'}}>
                  <div style={{fontSize:10,color:C.t3,fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:6}}>Net P&amp;L</div>
                  <div style={{fontSize:18,fontWeight:900,color:stats.totalPnL>=0?C.green:C.danger,fontFamily:'monospace',letterSpacing:'-0.03em'}}>{mfFormatMoney(stats.totalPnL)}</div>
                  <div style={{fontSize:11,color:C.t2,marginTop:4}}>{filtered.length} row{filtered.length===1?'':'s'} in scope</div>
                </div>
                <div style={{padding:'13px 14px',borderRadius:16,border:`1px solid ${C.brd}`,background:'rgba(255,255,255,0.02)'}}>
                  <div style={{fontSize:10,color:C.t3,fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:6}}>Win rate</div>
                  <div style={{fontSize:18,fontWeight:900,color:stats.winRate>=55?C.green:stats.winRate>=45?C.warn:C.danger,fontFamily:'monospace',letterSpacing:'-0.03em'}}>{mfFormatPercent(stats.winRate,1)}</div>
                  <div style={{fontSize:11,color:C.t2,marginTop:4}}>{stats.wins||0}W / {stats.losses||0}L / {stats.breakeven||0}BE</div>
                </div>
                <div style={{padding:'13px 14px',borderRadius:16,border:`1px solid ${C.brd}`,background:'rgba(255,255,255,0.02)'}}>
                  <div style={{fontSize:10,color:C.t3,fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:6}}>Profit factor</div>
                  <div style={{fontSize:18,fontWeight:900,color:stats.pf===Infinity||stats.pf>=2?C.green:stats.pf>=1.2?C.warn:C.danger,fontFamily:'monospace',letterSpacing:'-0.03em'}}>{mfFormatFactor(stats.pf)}</div>
                  <div style={{fontSize:11,color:C.t2,marginTop:4}}>Average R:R {stats.avgRR!=null?mfFormatRR(stats.avgRR):'--'}</div>
                </div>
                <div style={{padding:'13px 14px',borderRadius:16,border:`1px solid ${C.brd}`,background:'rgba(255,255,255,0.02)'}}>
                  <div style={{fontSize:10,color:C.t3,fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:6}}>Average trade</div>
                  <div style={{fontSize:18,fontWeight:900,color:averageTrade>=0?C.green:C.danger,fontFamily:'monospace',letterSpacing:'-0.03em'}}>{mfFormatMoney(averageTrade)}</div>
                  <div style={{fontSize:11,color:C.t2,marginTop:4}}>Max drawdown {stats.maxDD>0?`-${mfFormatPercent(stats.maxDD,1)}`:'0.0%'}</div>
                </div>
              </div>
            </div>
          </div>
          <div style={{padding:'20px',borderRadius:24,border:`1px solid ${C.brd}`,background:'linear-gradient(180deg, rgba(10,17,28,0.94), rgba(8,13,22,0.98))',boxShadow:'0 24px 48px rgba(0,0,0,0.18)'}}>
            <div style={{fontSize:10,color:C.t3,fontWeight:800,letterSpacing:'0.16em',textTransform:'uppercase',marginBottom:14}}>Journal desk</div>
            <div style={{display:'grid',gap:10}}>
              <div style={{padding:'14px 15px',borderRadius:16,border:`1px solid ${C.brd}`,background:'rgba(255,255,255,0.02)'}}>
                <div style={{fontSize:10,color:C.t3,fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:6}}>Latest execution</div>
                <div style={{fontSize:18,fontWeight:900,color:C.t1,letterSpacing:'-0.03em'}}>{latestTrade?.symbol || 'No executions yet'}</div>
                <div style={{fontSize:11,color:C.t2,marginTop:4}}>{latestTrade ? `${mfFormatDate(latestTrade.open_date || latestTrade.date)} · ${mfFormatTime(latestTrade.time)}` : 'Import or add the first trade'}</div>
              </div>
              <div style={{padding:'14px 15px',borderRadius:16,border:`1px solid ${C.brd}`,background:'rgba(255,255,255,0.02)'}}>
                <div style={{fontSize:10,color:C.t3,fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:6}}>Active setup</div>
                <div style={{fontSize:18,fontWeight:900,color:C.t1,letterSpacing:'-0.03em'}}>{topSetup !== 'Unassigned' ? topSetup : 'No setup tagged'}</div>
                <div style={{fontSize:11,color:C.t2,marginTop:4}}>{symbolCount} symbol{symbolCount===1?'':'s'} · {customColumns.length} custom column{customColumns.length===1?'':'s'}</div>
              </div>
              <div style={{padding:'14px 15px',borderRadius:16,border:`1px solid ${shade(C.cyan,'18')}`,background:'linear-gradient(180deg, rgba(var(--mf-accent-rgb, 6, 230, 255),0.08), rgba(255,255,255,0.01))'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}>
                  <div>
                    <div style={{fontSize:10,color:C.t3,fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:6}}>Workflow</div>
                    <div style={{fontSize:16,fontWeight:900,color:C.t1}}>{workflowOpen ? 'Open' : 'Collapsed'}</div>
                    <div style={{fontSize:11,color:C.t2,marginTop:4}}>{activeFilterCount ? `${activeFilterCount} active filter${activeFilterCount===1?'':'s'}` : 'Ready for clean review'}</div>
                  </div>
                  <GlassBtn size="sm" onClick={()=>setShowWorkflow(value=>!value)}>
                    {workflowOpen ? 'Hide workflow' : 'Open workflow'}
                  </GlassBtn>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

      <AnimatePresence>
        {selected.size>0&&(
          <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} style={{background:'linear-gradient(180deg, rgba(var(--mf-accent-rgb, 6, 230, 255),0.08), rgba(255,255,255,0.01))',border:`1px solid rgba(var(--mf-accent-rgb, 6, 230, 255),0.2)`,borderRadius:18,padding:'12px 14px',marginBottom:12,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
            <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}><span style={{color:C.t1,fontSize:13,fontWeight:800}}>{selected.size} trade{selected.size>1?'s':''} selected</span><span style={{padding:'7px 10px',borderRadius:999,border:`1px solid ${shade(selectedPnl>=0?C.green:C.danger,'26')}`,background:selectedPnl>=0?'rgba(var(--mf-green-rgb, 0, 255, 136),0.08)':'rgba(var(--mf-danger-rgb, 255, 61, 87),0.08)',fontSize:11,fontWeight:800,color:selectedPnl>=0?C.green:C.danger}}>Selection P&L {mfFormatMoney(selectedPnl)}</span></div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              <GlassBtn size="sm" variant="cyan" onClick={()=>exportToCSV(selectedTrades,`selection_${Date.now()}.csv`)}>Export selection</GlassBtn>
              <GlassBtn size="sm" variant="danger" onClick={handleDeleteSelected}>Delete selected</GlassBtn>
              <GlassBtn size="sm" onClick={()=>setSelected(new Set())}>Clear selection</GlassBtn>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={fadeInUp} initial="hidden" animate="visible" custom={1} style={{background:'linear-gradient(180deg, rgba(10,17,28,0.95), rgba(8,13,22,0.98))',border:`1px solid ${C.brd}`,borderRadius:24,overflow:'hidden',boxShadow:'0 24px 48px rgba(0,0,0,0.18)'}}>
        <div style={{padding:'16px 18px',borderBottom:`1px solid ${C.brd}`,display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap',background:'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))'}}>
          <div>
            <div style={{fontSize:20,fontWeight:900,color:C.t1,letterSpacing:'-0.03em'}}>Trade review table</div>
          </div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <div style={{padding:'9px 11px',borderRadius:12,border:`1px solid ${C.brd}`,background:'rgba(255,255,255,0.02)',fontSize:11,color:C.t2}}>
              {filtered.length} rows / <span style={{color:C.t1,fontWeight:800}}>{activeSortLabel}</span> {sort.dir==='asc'?'ASC':'DESC'}
            </div>
            <button type="button" onClick={()=>setShowWorkflow(value=>!value)} style={{padding:'9px 11px',borderRadius:12,border:`1px solid ${workflowOpen?shade(C.cyan,'30'):C.brd}`,background:workflowOpen?'rgba(var(--mf-accent-rgb, 6, 230, 255),0.08)':'rgba(255,255,255,0.02)',fontSize:11,color:workflowOpen?C.cyan:C.t2,cursor:'pointer',fontFamily:'inherit'}}>
              Workflow {activeFilterCount>0?`· ${activeFilterCount}`:''}
            </button>
            <button type="button" onClick={()=>setModalColumns(true)} style={{padding:'9px 11px',borderRadius:12,border:`1px solid ${C.brd}`,background:'rgba(255,255,255,0.02)',fontSize:11,color:C.t2,cursor:'pointer',fontFamily:'inherit'}}>
              {visibleCols.length} visible columns
            </button>
          </div>
        </div>
        <AnimatePresence initial={false}>
          {workflowOpen&&(
            <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} transition={{duration:0.24,ease:[0.22,1,0.36,1]}} style={{overflow:'hidden'}}>
              <div style={{padding:'12px 18px 0'}}>
                <FilterBar filters={filters} setFilters={setFilters} trades={trades} onReset={handleReset} compact />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {filtered.length===0?(
          <div style={{padding:'84px 22px',textAlign:'center'}}>
            <div style={{width:54,height:54,borderRadius:18,margin:'0 auto 18px',border:`1px solid ${shade(C.cyan,'18')}`,background:'linear-gradient(180deg, rgba(var(--mf-accent-rgb, 6, 230, 255),0.08), rgba(255,255,255,0.01))'}}/>
            <h3 style={{color:C.t1,fontSize:20,fontWeight:800,margin:'0 0 8px'}}>{allTrades.length===0?'No trades yet':trades.length===0?'No trades in this scope':'No trades match the filters'}</h3>
            <p style={{color:C.t2,fontSize:13,lineHeight:1.7,maxWidth:520,margin:'0 auto 22px'}}>{allTrades.length===0?'Import a file or add the first trade.':trades.length===0?'Change scope or import trades for this account.':'Reset the workflow or widen the date range.'}</p>
            <div style={{display:'flex',justifyContent:'center',gap:8,flexWrap:'wrap'}}>
              {allTrades.length===0&&<GlassBtn onClick={()=>setModalImport(true)}>Import trades</GlassBtn>}
              <GlassBtn variant="primary" onClick={handleCreate}>{allTrades.length===0?'Add first trade':'Add trade manually'}</GlassBtn>
              {allTrades.length>0&&<GlassBtn onClick={handleReset}>Reset filters</GlassBtn>}
            </div>
          </div>
        ):(
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',minWidth:980}}>
              <thead>
                <tr style={{background:'rgba(7,12,20,0.92)'}}>
                  {visibleCols.map(col=>(<th key={col.key} onClick={col.sortable?()=>handleSort(col.key):undefined} style={{padding:'13px 14px',textAlign:'left',fontSize:9,fontWeight:800,letterSpacing:'0.16em',textTransform:'uppercase',color:sort.key===col.key?C.cyan:C.t3,cursor:col.sortable?'pointer':'default',borderBottom:`1px solid ${C.brd}`,whiteSpace:'nowrap',userSelect:'none',transition:'color 0.2s',position:'sticky',top:0,zIndex:3,background:'rgba(7,12,20,0.96)',backdropFilter:'blur(14px)'}}>
                    {col.key==='select'?<input type="checkbox" checked={paginated.every(t=>selected.has(t.id))&&paginated.length>0} onChange={handleSelectAll} style={{cursor:'pointer',accentColor:C.cyan,width:14,height:14}}/>:<span style={{display:'flex',alignItems:'center',gap:6}}>{col.label}{col.sortable&&<span style={{opacity:0.5,fontSize:8.5}}>{sort.key===col.key?sort.dir==='asc'?'ASC':'DESC':'SORT'}</span>}</span>}
                  </th>))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {paginated.map(trade=>(<TradeRow key={trade.id} trade={trade} isSelected={selected.has(trade.id)} onSelect={id=>{setSelected(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n;});}} onClickDetail={()=>setDetailTrade(trade)} onDoubleClickEdit={handleEdit} cols={visibleCols} cumulativePnl={cumulMap[trade.id]}/>))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {filtered.length>0&&(<Pagination page={page} total={filtered.length} perPage={perPage} onPage={p=>setPage(Math.max(1,Math.min(p,totalPages)))} onPerPage={n=>{setPerPage(n);setPage(1);}}/>)}

      <TradeImportModal isOpen={modalImport} onClose={()=>setModalImport(false)} onImport={handleImport} onImportBatch={handleImportBatch} onRegisterCustomColumns={handleRegisterCustomColumns} onImportComplete={handleImportComplete}/>
      <input ref={backupRestoreRef} type="file" accept=".json" hidden onChange={handleRestoreBackup}/>
      <ColumnStudioModal isOpen={modalColumns} onClose={()=>setModalColumns(false)} cols={cols} onChange={setCols}/>
      <TradeFormModal isOpen={modalForm} onClose={()=>{setModalForm(false);setEditTrade(null);}} onSave={handleSave} trade={editTrade} customColumns={customColumns}/>
      <TradeDetailPanel trade={detailTrade} onClose={()=>setDetailTrade(null)} onEdit={t=>{handleEdit(t);setDetailTrade(null);}} onDelete={id=>{deleteTrade(id);setDetailTrade(null);toast.success('Trade deleted');}}/>
      <DangerConfirmModal
        isOpen={showWipeModal}
        onClose={()=>!wiping&&setShowWipeModal(false)}
        onConfirm={handleDeleteAll}
        loading={wiping}
        title="Delete the full journal"
        body={`You are about to permanently remove ${allTrades.length} trade${allTrades.length===1?'':'s'} from this account. Export a backup first if you want a recovery file.`}
      />
      </div>
    </div>
  );
}

