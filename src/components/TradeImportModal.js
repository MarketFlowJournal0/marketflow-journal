import React, { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { shade } from '../lib/colorAlpha';

const C = {
  bgCard: 'var(--mf-card, #101826)',
  bgDeep: 'var(--mf-deep, #090d15)',
  bgHigh: 'var(--mf-high, #141d2c)',
  cyan: 'var(--mf-accent, #06E6FF)',
  green: 'var(--mf-green, #00FF88)',
  danger: 'var(--mf-danger, #FF3D57)',
  warn: 'var(--mf-warn, #FFB31A)',
  blue: 'var(--mf-blue, #4D7CFF)',
  purple: 'var(--mf-purple, #A78BFA)',
  t0: 'var(--mf-text-0, #ffffff)',
  t1: 'var(--mf-text-1, #E8EEFF)',
  t2: 'var(--mf-text-2, #8B9BB4)',
  t3: 'var(--mf-text-3, #64748B)',
  brd: 'var(--mf-border, #1E2D45)',
  brdHi: 'var(--mf-border-hi, #2A3E5E)',
};

const SOURCE_OPTIONS = [
  { id: 'broker', title: 'Broker export', description: 'MT4, MT5, cTrader, DXtrade, prop firm statements.', accepts: 'CSV, XLSX, JSON' },
  { id: 'journal', title: 'Journal app', description: 'TradeZella, TraderSync, Edgewonk, or any app export.', accepts: 'CSV, XLSX, JSON' },
  { id: 'notion', title: 'Notion or database', description: 'Paste rows directly or import the exported CSV.', accepts: 'Paste, CSV' },
  { id: 'sheet', title: 'Spreadsheet', description: 'Excel, Google Sheets, Numbers, Airtable, custom ledgers.', accepts: 'XLSX, XLS, CSV, TSV' },
  { id: 'custom', title: 'Custom source', description: 'Use the mapper for any other file, copied table, or raw export.', accepts: 'File or paste' },
];

const SAMPLE_TEMPLATE_ROWS = [
  ['Date', 'Time', 'Symbol', 'Side', 'Entry', 'Exit', 'P&L', 'Session', 'Setup', 'Notes'],
  ['2026-04-12', '14:32', 'EURUSD', 'Long', '1.0825', '1.0851', '142.50', 'London', 'Breakout', 'Clean continuation after retest'],
];

const FIELD_MAP = {
  symbol: 'symbol', symbole: 'symbol', instrument: 'symbol', asset: 'symbol', pair: 'symbol', ticker: 'symbol', market: 'symbol',
  currency: 'symbol', currencypair: 'symbol', tradingsymbol: 'symbol', contract: 'symbol', product: 'symbol', securityname: 'symbol',
  security: 'symbol', underlying: 'symbol', stocksymbol: 'symbol', futuresymbol: 'symbol', cryptopair: 'symbol', base: 'symbol',
  basecurrency: 'symbol', tradepair: 'symbol', paire: 'symbol',
  type: 'type', direction: 'type', side: 'type', ordertype: 'type', buysell: 'type', tradetype: 'type', transactiontype: 'type',
  longshort: 'type', bs: 'type', action: 'type', cmd: 'type', operation: 'type', sens: 'type', position: 'type',
  entry: 'entry', entryprice: 'entry', openprice: 'entry', open: 'entry', prixentree: 'entry', openrate: 'entry', entryrate: 'entry',
  openlevel: 'entry', startprice: 'entry', avgentryprice: 'entry', averageentry: 'entry', fillprice: 'entry', executionprice: 'entry',
  buyprice: 'entry', openingprice: 'entry', initialprice: 'entry', price: 'entry', rate: 'entry',
  exit: 'exit', exitprice: 'exit', closeprice: 'exit', close: 'exit', prixsortie: 'exit', closerate: 'exit', exitrate: 'exit',
  closelevel: 'exit', endprice: 'exit', avgexitprice: 'exit', averageexit: 'exit', sellprice: 'exit', closingprice: 'exit', coverprice: 'exit',
  pnl: 'pnl', pl: 'pnl', profitloss: 'pnl', profit: 'pnl', gain: 'pnl', result: 'pnl', resultat: 'pnl', netprofit: 'pnl', grossprofit: 'pnl',
  realizedpnl: 'pnl', realizedpl: 'pnl', netpl: 'pnl', netgain: 'pnl', tradepnl: 'pnl', closedpnl: 'pnl', closedpl: 'pnl',
  returnamount: 'pnl', gainloss: 'pnl', profitandloss: 'pnl', montant: 'pnl', benefice: 'pnl', gainperte: 'pnl', performances: 'pnl',
  date: 'date', tradedate: 'date', opendate: 'date', entrydate: 'date', opentime: 'date', datetime: 'date', closetime: 'date', timestamp: 'date',
  exitdate: 'date', tradeday: 'date', tradedatetime: 'date', closedate: 'date', settledate: 'date', executiondate: 'date', filldate: 'date',
  jour: 'date', dateouverture: 'date', datefermeture: 'date',
  time: 'time', heure: 'time', entrytime: 'time', tradetime: 'time', exittime: 'time', executiontime: 'time',
  session: 'session', marketsession: 'session', tradesession: 'session', sessiontype: 'session', tradingsession: 'session', periode: 'session', sessions: 'session',
  bias: 'bias', sentiment: 'bias', trend: 'bias', markettend: 'bias', marketbias: 'bias', tradesentiment: 'bias', marketsentiment: 'bias', tendance: 'bias', orientation: 'bias',
  sl: 'sl', stoploss: 'sl', stop: 'sl', stoplosslevel: 'sl', stoplossvalue: 'sl', slprice: 'sl', stoplossprice: 'sl', slevel: 'sl', stopprice: 'sl',
  initialstop: 'sl', hardstop: 'sl', riskprice: 'sl', protectivestop: 'sl', niveaustoploss: 'sl', slbe: 'sl',
  tp: 'tp', takeprofit: 'tp', target: 'tp', profittarget: 'tp', tpprice: 'tp', takeprofitprice: 'tp', tplevel: 'tp', targetprice: 'tp',
  objectif: 'tp', niveautakeprofit: 'tp', tp1: 'tp', tp2: 'tp', tp3: 'tp', rrtarget: 'tp',
  be: 'breakEven', breakeven: 'breakEven', breakevenpoint: 'breakEven', beprice: 'breakEven', belevel: 'breakEven',
  trailingstop: 'trailingStop', trailstop: 'trailingStop', trailingsl: 'trailingStop', dynamicstop: 'trailingStop', tsl: 'trailingStop', trailingstoploss: 'trailingStop',
  setup: 'setup', strategy: 'setup', strategie: 'setup', pattern: 'setup', setuptype: 'setup', tradestyle: 'setup', signal: 'setup', tradesetup: 'setup',
  entrysetup: 'setup', catalyst: 'setup', triggertype: 'setup', entrytype: 'setup', trademodel: 'setup', playbook: 'setup', confluences: 'setup', model: 'setup',
  notes: 'notes', note: 'notes', comment: 'notes', commentaire: 'notes', remarks: 'notes', description: 'notes', tradecomment: 'notes', commentary: 'notes',
  annotation: 'notes', observations: 'notes', reflexion: 'notes', lesson: 'notes', journalentry: 'notes',
  news: 'newsImpact', newsimpact: 'newsImpact', impact: 'newsImpact',
  psychology: 'psychologyScore', psychologyscore: 'psychologyScore', psycho: 'psychologyScore', mentalstate: 'psychologyScore', emotionscore: 'psychologyScore', mental: 'psychologyScore',
  lots: 'lots', lot: 'lots', volume: 'lots', quantity: 'lots', size: 'lots', tradesize: 'lots', positionsize: 'lots', contracts: 'lots', shares: 'lots', units: 'lots', qty: 'lots',
  commission: 'commission', commissions: 'commission', brokerage: 'commission', tradecost: 'commission', fee: 'commission', fees: 'commission', tradingfee: 'commission',
  swap: 'swap', overnight: 'swap', overnightfee: 'swap', rollover: 'swap', financingcost: 'swap', holdingcost: 'swap',
  risk: 'risk', riskamount: 'risk', riskvalue: 'risk', dollarsatrisk: 'risk',
  rr: 'rrActual', rratio: 'rrActual', riskreward: 'rrActual', rrratio: 'rrActual', rrreel: 'rrActual',
  markettype: 'marketType', assetclass: 'marketType', assettype: 'marketType',
  exchange: 'exchange', broker: 'exchange', platform: 'exchange',
  account: 'account', accountname: 'account', accountnumber: 'account', compte: 'account',
  duration: 'duration', tradeduration: 'duration', holdtime: 'duration', duree: 'duration',
  tags: 'tags', tag: 'tags', labels: 'tags',
};

const KNOWN_FIELDS = [
  { value: 'symbol', label: 'Symbol', required: true },
  { value: 'type', label: 'Type' },
  { value: 'entry', label: 'Entry Price' },
  { value: 'exit', label: 'Exit Price' },
  { value: 'pnl', label: 'P&L', required: true },
  { value: 'date', label: 'Date' },
  { value: 'time', label: 'Time' },
  { value: 'session', label: 'Session' },
  { value: 'bias', label: 'Bias' },
  { value: 'sl', label: 'Stop Loss' },
  { value: 'tp', label: 'Take Profit' },
  { value: 'breakEven', label: 'Break Even' },
  { value: 'trailingStop', label: 'Trailing Stop' },
  { value: 'setup', label: 'Setup / Strategy' },
  { value: 'notes', label: 'Notes / Journal' },
  { value: 'newsImpact', label: 'News Impact' },
  { value: 'psychologyScore', label: 'Psychology Score' },
  { value: 'lots', label: 'Lots / Volume / Shares' },
  { value: 'commission', label: 'Commission / Fees' },
  { value: 'swap', label: 'Swap / Overnight' },
  { value: 'risk', label: 'Risk' },
  { value: 'rrActual', label: 'Actual RR' },
  { value: 'marketType', label: 'Market Type' },
  { value: 'exchange', label: 'Exchange / Broker' },
  { value: 'account', label: 'Account' },
  { value: 'duration', label: 'Duration' },
  { value: 'tags', label: 'Tags' },
  { value: '_extra', label: 'Keep as extra' },
  { value: '_ignore', label: 'Ignore this column' },
];

const CLEAN_FIELD_LABELS = KNOWN_FIELDS.reduce((acc, field) => {
  acc[field.value] = field.label;
  return acc;
}, {});

// HELPERS
function normalizeKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function detectSeparator(content) {
  const line = String(content || '').split(/\r?\n/)[0] || '';
  const separators = [',', ';', '\t', '|'];
  const counts = separators.map((separator) => line.split(separator).length - 1);
  return separators[counts.indexOf(Math.max(...counts))] || ',';
}

function parseCSVLine(line, separator) {
  const values = [];
  let current = '';
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (character === separator && !inQuotes) {
      values.push(current.trim().replace(/^["']|["']$/g, '').replace(/""/g, '"').trim());
      current = '';
    } else {
      current += character;
    }
  }
  values.push(current.trim().replace(/^["']|["']$/g, '').replace(/""/g, '"').trim());
  return values;
}

function isSpreadsheetFile(fileName = '') {
  return /\.(xlsx|xls)$/i.test(fileName);
}

function isJsonFile(fileName = '') {
  return /\.json$/i.test(fileName);
}

function normalizeImportedCell(value) {
  if (value == null) return '';
  if (value instanceof Date) return value.toISOString().split('T')[0];
  return String(value).trim();
}

function prepareImportedRows(rows = []) {
  const cleanRows = rows
    .map((row) => (Array.isArray(row) ? row : [row]).map(normalizeImportedCell))
    .filter((row) => row.some(Boolean));

  if (cleanRows.length < 2) {
    throw new Error('The dataset needs at least one header row and one trade row.');
  }

  const headers = cleanRows[0].map((header, index) => header || `Column ${index + 1}`);
  const dataRows = cleanRows.slice(1);
  return {
    headers,
    dataRows,
    preview: dataRows.slice(0, 6),
  };
}

function getRowsFromWorkbook(arrayBuffer) {
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) throw new Error('The spreadsheet is empty.');
  return XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], {
    header: 1,
    raw: false,
    defval: '',
  });
}

function toObjectMatrix(records = []) {
  const headers = Array.from(new Set(records.flatMap((record) => Object.keys(record || {}))));
  return [
    headers,
    ...records.map((record) => headers.map((header) => record?.[header] ?? '')),
  ];
}

function findJsonArrayCandidate(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return null;

  const priorityKeys = ['trades', 'data', 'results', 'history', 'records', 'items', 'rows'];
  for (const key of priorityKeys) {
    if (Array.isArray(payload[key])) return payload[key];
  }

  for (const value of Object.values(payload)) {
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') {
      const nested = findJsonArrayCandidate(value);
      if (nested) return nested;
    }
  }

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleClose} style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 12, 0.82)', backdropFilter: 'blur(8px)', zIndex: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
        <motion.div initial={{ scale: 0.96, opacity: 0, y: 18 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0, y: 10 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }} onClick={(event) => event.stopPropagation()} style={{ position: 'relative', width: '100%', maxWidth: step === 2 ? 1220 : 1140, maxHeight: '94vh', overflow: 'hidden', borderRadius: 28, border: `1px solid ${shade(C.cyan, 0.12)}`, background: 'linear-gradient(180deg, rgba(11, 18, 29, 0.98), rgba(7, 11, 19, 0.98))', boxShadow: '0 40px 100px rgba(0,0,0,0.52)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at 12% 18%, rgba(var(--mf-accent-rgb, 6, 230, 255), 0.12), transparent 32%), radial-gradient(circle at 88% 12%, rgba(var(--mf-accent-secondary-rgb, 0, 255, 136), 0.08), transparent 26%), linear-gradient(180deg, rgba(255,255,255,0.02), transparent 24%)' }} />
          <div style={{ position: 'relative', zIndex: 1, padding: '22px 24px 18px', borderBottom: `1px solid ${shade(C.brd, 0.85)}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 18, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 12, border: `1px solid ${shade(C.cyan, 0.18)}`, background: 'linear-gradient(180deg, rgba(var(--mf-accent-rgb, 6, 230, 255), 0.12), rgba(255,255,255,0.02))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><SourceIcon id={source} color={C.cyan} /></div>
                <StatChip label="Source" value={selectedSource.title} tone={sourceTone} />
                <StatChip label="Input" value={mode === 'file' ? 'File' : 'Paste'} />
              </div>
              <h2 style={{ margin: 0, fontSize: 27, fontWeight: 900, letterSpacing: '-0.03em', color: C.t0 }}>{step === 1 ? 'Import Center' : step === 2 ? 'Review and map trades' : 'Import complete'}</h2>
              <p style={{ margin: '8px 0 0', color: C.t2, fontSize: 13.5, lineHeight: 1.6, maxWidth: 720 }}>{step === 1 ? 'Bring trades in from broker statements, spreadsheets, Notion tables, journal exports, or pasted datasets.' : step === 2 ? `Review ${allRows.length} detected row${allRows.length > 1 ? 's' : ''}, confirm mappings, and import with full control.` : 'Your trades are in the ledger. You can close this desk or load another dataset immediately.'}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{[1, 2, 3].map((currentStep) => (<React.Fragment key={currentStep}><div style={{ width: 34, height: 34, borderRadius: 999, border: `1px solid ${currentStep <= step ? 'transparent' : C.brd}`, background: currentStep < step ? shade(C.green, 0.92) : currentStep === step ? 'linear-gradient(135deg, rgba(var(--mf-accent-rgb, 6, 230, 255), 0.95), rgba(var(--mf-accent-secondary-rgb, 0, 255, 136), 0.88))' : 'rgba(255,255,255,0.02)', color: currentStep <= step ? C.bgDeep : C.t3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>{currentStep}</div>{currentStep < 3 && <div style={{ width: 22, height: 1, background: currentStep < step ? shade(C.green, 0.75) : shade(C.brd, 0.9) }} />}</React.Fragment>))}</div>
          </div>

          {step === 1 && <div style={{ position: 'relative', zIndex: 1, padding: 22, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ padding: 18, borderRadius: 22, border: `1px solid ${shade(C.brd, 0.95)}`, background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}><div><div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', color: C.t3, textTransform: 'uppercase' }}>Choose source</div><div style={{ marginTop: 5, fontSize: 15, fontWeight: 800, color: C.t1 }}>Start from the export you already have</div></div><ActionButton variant="subtle" size="sm" onClick={downloadTemplate}>Download template</ActionButton></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>{SOURCE_OPTIONS.map((option) => { const active = option.id === source; return <motion.button key={option.id} type="button" onClick={() => { setSource(option.id); if (option.id === 'notion') setMode('paste'); }} whileHover={{ y: -2 }} whileTap={{ scale: 0.99 }} style={{ textAlign: 'left', padding: 15, borderRadius: 18, border: `1px solid ${active ? shade(C.cyan, 0.28) : shade(C.brd, 0.95)}`, background: active ? 'linear-gradient(180deg, rgba(var(--mf-accent-rgb, 6, 230, 255), 0.08), rgba(255,255,255,0.02))' : 'rgba(255,255,255,0.015)', cursor: 'pointer', fontFamily: 'inherit' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}><div style={{ width: 36, height: 36, borderRadius: 12, border: `1px solid ${active ? shade(C.cyan, 0.22) : shade(C.brd, 0.95)}`, background: active ? shade(C.cyan, 0.08) : 'rgba(255,255,255,0.015)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><SourceIcon id={option.id} color={active ? C.cyan : C.t2} /></div><StatChip label="Accepts" value={option.accepts} tone={active ? sourceTone : 'default'} /></div><div style={{ color: active ? C.t1 : C.t2, fontSize: 14, fontWeight: 800 }}>{option.title}</div><div style={{ marginTop: 7, color: C.t3, fontSize: 12, lineHeight: 1.6 }}>{option.description}</div></motion.button>; })}</div>
              </div>
              <div style={{ padding: 18, borderRadius: 22, border: `1px solid ${shade(C.brd, 0.95)}`, background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}><div><div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', color: C.t3, textTransform: 'uppercase' }}>Input mode</div><div style={{ marginTop: 5, fontSize: 15, fontWeight: 800, color: C.t1 }}>Upload a file or paste a table</div></div><div style={{ display: 'flex', gap: 8 }}>{['file', 'paste'].map((entryMode) => (<ActionButton key={entryMode} size="sm" variant={mode === entryMode ? 'primary' : 'subtle'} onClick={() => setMode(entryMode)}>{entryMode === 'file' ? 'Upload file' : 'Paste data'}</ActionButton>))}</div></div>
                {mode === 'file' ? <div onDragEnter={(event) => { event.preventDefault(); setDrag(true); }} onDragLeave={(event) => { event.preventDefault(); setDrag(false); }} onDragOver={(event) => { event.preventDefault(); setDrag(true); }} onDrop={(event) => { event.preventDefault(); setDrag(false); if (event.dataTransfer.files[0]) parseFile(event.dataTransfer.files[0]); }} onClick={() => fileRef.current?.click()} style={{ borderRadius: 22, border: `1.5px dashed ${drag ? shade(C.cyan, 0.42) : file ? shade(C.green, 0.32) : shade(C.brdHi, 0.9)}`, background: drag ? 'rgba(var(--mf-accent-rgb, 6, 230, 255), 0.06)' : file ? 'rgba(var(--mf-green-rgb, 0, 255, 136), 0.04)' : 'linear-gradient(180deg, rgba(255,255,255,0.015), rgba(255,255,255,0.01))', padding: '32px 22px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s ease' }}><input ref={fileRef} type="file" accept=".csv,.txt,.tsv,.xlsx,.xls,.json" style={{ display: 'none' }} onChange={(event) => { if (event.target.files?.[0]) parseFile(event.target.files[0]); }} /><motion.div animate={parsing ? { rotate: 360 } : { rotate: 0 }} transition={parsing ? { duration: 1, repeat: Infinity, ease: 'linear' } : { duration: 0.2 }} style={{ width: 42, height: 42, margin: '0 auto 14px', borderRadius: 14, border: `1px solid ${shade(file ? C.green : C.cyan, 0.2)}`, background: file ? shade(C.green, 0.08) : shade(C.cyan, 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center' }}><SourceIcon id={source} color={file ? C.green : C.cyan} /></motion.div><div style={{ color: C.t1, fontSize: 15, fontWeight: 800 }}>{parsing ? 'Analyzing import structure...' : file ? file.name : 'Drop a trading export here'}</div><div style={{ marginTop: 7, color: C.t3, fontSize: 12.5, lineHeight: 1.6 }}>{file ? `${(file.size / 1024).toFixed(1)} KB loaded. Click to replace or drop another file.` : 'CSV, TSV, XLSX, XLS, JSON and copied app exports are supported.'}</div></div> : <div><textarea value={pasteValue} onChange={(event) => setPasteValue(event.target.value)} placeholder={source === 'notion' ? 'Paste rows from Notion, Airtable, or a copied table here...' : 'Paste CSV, TSV, JSON, or copied trade rows here...'} style={{ width: '100%', minHeight: 220, resize: 'vertical', borderRadius: 22, border: `1px solid ${shade(C.brdHi, 0.95)}`, background: 'rgba(8, 12, 20, 0.82)', color: C.t1, padding: '16px 18px', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12, lineHeight: 1.7, outline: 'none' }} /><div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}><div style={{ color: C.t3, fontSize: 11.5, lineHeight: 1.6 }}>Paste copied database rows, exported CSV text, or JSON payloads from another app.</div><ActionButton variant="primary" onClick={analyzePastedData} loading={parsing}>Analyze pasted data</ActionButton></div></div>}
              </div>
            </div>
            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ padding: 18, borderRadius: 22, border: `1px solid ${shade(C.brd, 0.95)}`, background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))' }}><div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', color: C.t3, textTransform: 'uppercase', marginBottom: 12 }}>Live readiness</div><div style={{ display: 'grid', gap: 10 }}><div style={{ padding: 14, borderRadius: 16, border: `1px solid ${shade(C.brd, 0.9)}`, background: 'rgba(255,255,255,0.015)' }}><div style={{ color: C.t3, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Source</div><div style={{ marginTop: 6, color: C.t1, fontSize: 18, fontWeight: 900 }}>{selectedSource.title}</div><div style={{ marginTop: 6, color: C.t2, fontSize: 12, lineHeight: 1.6 }}>{selectedSource.description}</div></div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}><div style={{ padding: 14, borderRadius: 16, border: `1px solid ${shade(C.brd, 0.9)}`, background: 'rgba(255,255,255,0.015)' }}><div style={{ color: C.t3, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Mode</div><div style={{ marginTop: 7, color: C.t1, fontSize: 16, fontWeight: 800 }}>{mode === 'file' ? 'Upload' : 'Paste'}</div></div><div style={{ padding: 14, borderRadius: 16, border: `1px solid ${shade(C.brd, 0.9)}`, background: 'rgba(255,255,255,0.015)' }}><div style={{ color: C.t3, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Formats</div><div style={{ marginTop: 7, color: C.t1, fontSize: 16, fontWeight: 800 }}>{selectedSource.accepts}</div></div></div></div></div>
              <div style={{ padding: 18, borderRadius: 22, border: `1px solid ${shade(C.brd, 0.95)}`, background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))' }}><div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', color: C.t3, textTransform: 'uppercase', marginBottom: 12 }}>Supported exports</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{['MT4', 'MT5', 'cTrader', 'DXtrade', 'TradeLocker', 'TradeZella', 'Notion', 'Excel', 'Sheets', 'CSV', 'JSON'].map((item) => (<div key={item} style={{ padding: '7px 10px', borderRadius: 999, border: `1px solid ${shade(C.brd, 0.9)}`, background: 'rgba(255,255,255,0.02)', color: C.t2, fontSize: 11, fontWeight: 700 }}>{item}</div>))}</div></div>
            </div>
          </div>}

          {step === 2 && <div style={{ position: 'relative', zIndex: 1, padding: 22, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 18 }}>
            <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
              <div style={{ padding: 16, borderRadius: 20, border: `1px solid ${shade(C.brd, 0.95)}`, background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}><div><div style={{ color: C.t3, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Import snapshot</div><div style={{ marginTop: 6, color: C.t1, fontSize: 15, fontWeight: 800 }}>{selectedSource.title}</div></div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}><StatChip label="Rows" value={allRows.length} tone="cyan" /><StatChip label="Headers" value={rawHeaders.length} /><StatChip label="Format" value={separatorLabelFromValue(separator)} tone={separator === 'json' ? 'purple' : 'default'} /></div></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}><div style={{ padding: 14, borderRadius: 16, border: `1px solid ${shade(C.brd, 0.9)}`, background: 'rgba(255,255,255,0.015)' }}><div style={{ color: C.t3, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Required</div><div style={{ marginTop: 6, color: C.t1, fontSize: 20, fontWeight: 900 }}>{symbolMapped ? 'Ready' : 'Check'}</div><div style={{ marginTop: 6, color: C.t2, fontSize: 12 }}>Symbol is {symbolMapped ? 'mapped' : 'still missing'}</div></div><div style={{ padding: 14, borderRadius: 16, border: `1px solid ${shade(C.brd, 0.9)}`, background: 'rgba(255,255,255,0.015)' }}><div style={{ color: C.t3, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>P&L</div><div style={{ marginTop: 6, color: C.t1, fontSize: 20, fontWeight: 900 }}>{pnlMapped ? 'Mapped' : 'Optional'}</div><div style={{ marginTop: 6, color: C.t2, fontSize: 12 }}>{pnlMapped ? 'Ready for import' : 'Will rely on raw values if missing'}</div></div><div style={{ padding: 14, borderRadius: 16, border: `1px solid ${shade(C.brd, 0.9)}`, background: 'rgba(255,255,255,0.015)' }}><div style={{ color: C.t3, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Confidence</div><div style={{ marginTop: 6, color: C.t1, fontSize: 20, fontWeight: 900 }}>{highCount}/{rawHeaders.length}</div><div style={{ marginTop: 6, color: C.t2, fontSize: 12 }}>Columns matched automatically</div></div></div>
              </div>
              <div style={{ padding: 16, borderRadius: 20, border: `1px solid ${shade(C.brd, 0.95)}`, background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))', overflowX: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}><div><div style={{ color: C.t3, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Preview</div><div style={{ marginTop: 6, color: C.t1, fontSize: 15, fontWeight: 800 }}>First detected rows</div></div><ActionButton size="sm" variant="subtle" onClick={() => setStep(1)}>Load another source</ActionButton></div>
                <table style={{ width: '100%', minWidth: 'max-content', borderCollapse: 'collapse' }}><thead><tr>{rawHeaders.map((header) => (<th key={header} style={{ textAlign: 'left', padding: '10px 12px', borderBottom: `1px solid ${shade(C.brd, 0.95)}`, color: C.cyan, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{header}</th>))}</tr></thead><tbody>{previewRows.map((row, rowIndex) => (<tr key={`${rowIndex}_${row.join('_')}`}>{rawHeaders.map((_, columnIndex) => (<td key={`${rowIndex}_${columnIndex}`} style={{ padding: '11px 12px', borderBottom: `1px solid ${shade(C.brd, 0.55)}`, color: C.t2, fontSize: 12, whiteSpace: 'nowrap', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>{row[columnIndex] || '-'}</td>))}</tr>))}</tbody></table>
              </div>
            </div>
            <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
              <div style={{ padding: 16, borderRadius: 20, border: `1px solid ${shade(C.brd, 0.95)}`, background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}><div><div style={{ color: C.t3, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Mapping review</div><div style={{ marginTop: 6, color: C.t1, fontSize: 15, fontWeight: 800 }}>Adjust only what needs attention</div></div><ActionButton size="sm" variant="subtle" onClick={() => { const nextMapping = {}; rawHeaders.forEach((header) => { nextMapping[header] = FIELD_MAP[normalizeKey(header)] || '_extra'; }); setMapping(nextMapping); toast.success('Auto mapping reset.'); }}>Reset auto</ActionButton></div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}><StatChip label="Auto" value={highCount} tone="green" /><StatChip label="Review" value={mediumCount + lowCount} tone="warn" /><StatChip label="Extra" value={extraCount} tone="purple" /></div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>{[{ id: 'all', label: `All (${rawHeaders.length})` }, { id: 'high', label: `Auto (${highCount})` }, { id: 'review', label: `Review (${mediumCount + lowCount})` }, { id: 'extra', label: `Extra (${extraCount})` }].map((item) => (<ActionButton key={item.id} size="sm" variant={filterConf === item.id ? 'primary' : 'subtle'} onClick={() => setFilterConf(item.id)}>{item.label}</ActionButton>))}</div>
                <div style={{ display: 'grid', gap: 10, maxHeight: '48vh', overflowY: 'auto', paddingRight: 4 }}>{filteredHeaders.map((header) => { const current = mapping[header] || '_extra'; const sample = previewRows[0]?.[rawHeaders.indexOf(header)] || ''; const currentConfidence = confidence[header] ?? 0; const tone = current === '_extra' ? 'purple' : current === '_ignore' ? 'default' : currentConfidence >= 70 ? 'green' : currentConfidence >= 50 ? 'warn' : 'danger'; const borderColor = current === '_extra' ? C.purple : current === '_ignore' ? C.brd : currentConfidence >= 70 ? C.green : currentConfidence >= 50 ? C.warn : C.danger; return <div key={header} style={{ padding: 14, borderRadius: 16, border: `1px solid ${shade(borderColor, 0.16)}`, background: current === '_ignore' ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.02)', opacity: current === '_ignore' ? 0.55 : 1 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}><div style={{ minWidth: 0 }}><div style={{ color: C.t1, fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{header}</div><div style={{ marginTop: 5, color: C.t3, fontSize: 11.5, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sample || '-'}</div></div><StatChip label="Status" value={current === '_extra' ? 'Extra' : current === '_ignore' ? 'Ignored' : currentConfidence >= 70 ? 'Auto' : currentConfidence >= 50 ? 'Guess' : 'Check'} tone={tone} /></div><select value={current} onChange={(event) => { const nextValue = event.target.value; const existing = rawHeaders.find((otherHeader) => otherHeader !== header && mapping[otherHeader] === nextValue && nextValue !== '_extra' && nextValue !== '_ignore'); if (existing) setMapping((previous) => ({ ...previous, [existing]: '_extra', [header]: nextValue })); else setMapping((previous) => ({ ...previous, [header]: nextValue })); }} style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: `1px solid ${shade(C.brdHi, 0.95)}`, background: 'rgba(8, 12, 20, 0.82)', color: C.t1, fontSize: 12, fontFamily: 'inherit', outline: 'none' }}>{KNOWN_FIELDS.map((field) => (<option key={field.value} value={field.value}>{CLEAN_FIELD_LABELS[field.value]}{field.required ? ' *' : ''}</option>))}</select></div>; })}</div>
              </div>
              {!symbolMapped && <div style={{ padding: 14, borderRadius: 16, border: `1px solid ${shade(C.danger, 0.22)}`, background: shade(C.danger, 0.06), color: C.danger, fontSize: 12.5, lineHeight: 1.6 }}>Map a Symbol column before importing. Use the field selector on the right if the pair column was not matched automatically.</div>}
            </div>
          </div>}

          {step === 3 && <div style={{ position: 'relative', zIndex: 1, padding: '42px 24px 38px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}><div style={{ width: 74, height: 74, borderRadius: 24, border: `1px solid ${shade(C.green, 0.22)}`, background: 'linear-gradient(180deg, rgba(var(--mf-green-rgb, 0, 255, 136), 0.14), rgba(255,255,255,0.02))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, color: C.green, fontSize: 28, fontWeight: 900 }}>+</div><div style={{ color: C.t1, fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em' }}>Trades imported</div><div style={{ marginTop: 10, color: C.t2, fontSize: 14, lineHeight: 1.7, maxWidth: 620 }}>{importResult?.count || 0} trade{importResult?.count > 1 ? 's' : ''} added from {importResult?.source || selectedSource.title}.</div><div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}><StatChip label="Imported" value={importResult?.count || 0} tone="green" /><StatChip label="Ignored" value={importResult?.ignored || 0} tone="warn" /><StatChip label="Failed" value={importResult?.failed || 0} tone={(importResult?.failed || 0) > 0 ? 'danger' : 'default'} /></div><div style={{ marginTop: 28, display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}><ActionButton variant="primary" onClick={handleClose}>View ledger</ActionButton><ActionButton variant="subtle" onClick={() => { resetState(); setStep(1); }}>Import another source</ActionButton></div></div>}

          {step !== 3 && <div style={{ position: 'relative', zIndex: 1, padding: '14px 22px', borderTop: `1px solid ${shade(C.brd, 0.95)}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', background: 'rgba(8, 12, 20, 0.72)' }}><ActionButton variant="ghost" onClick={step === 1 ? handleClose : () => setStep(1)}>{step === 1 ? 'Cancel' : 'Back'}</ActionButton><div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>{step === 2 && <div style={{ color: C.t3, fontSize: 11.5 }}>{importing ? `${importProgress.done}/${importProgress.total} rows imported` : `${allRows.length} rows ready`}</div>}{step === 2 && importing && <div style={{ width: 140, height: 6, borderRadius: 999, overflow: 'hidden', background: 'rgba(255,255,255,0.06)' }}><motion.div initial={{ width: 0 }} animate={{ width: `${importProgress.total ? (importProgress.done / importProgress.total) * 100 : 0}%` }} style={{ height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, rgba(var(--mf-accent-rgb, 6, 230, 255), 1), rgba(var(--mf-accent-secondary-rgb, 0, 255, 136), 0.95))' }} /></div>}{step === 2 && <ActionButton variant="primary" onClick={handleImport} disabled={!symbolMapped} loading={importing}>Import {allRows.length} trade{allRows.length > 1 ? 's' : ''}</ActionButton>}</div></div>}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function getRowsFromJson(content) {
  const payload = JSON.parse(content);
  const records = findJsonArrayCandidate(payload);
  if (!records || !records.length) throw new Error('No trade rows were found in this JSON export.');
  if (Array.isArray(records[0])) return records;
  if (typeof records[0] === 'object') return toObjectMatrix(records);
  throw new Error('Unsupported JSON export format.');
}

function readTextFromBytes(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
    return new TextDecoder('utf-8').decode(bytes.slice(3));
  }
  try {
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    return new TextDecoder('iso-8859-1').decode(bytes);
  }
}

function parseNum(value) {
  if (value == null || value === '') return null;
  let normalized = String(value)
    .trim()
    .replace(/[$€£¥\s]/g, '')
    .replace(/[^0-9.,\-+%]/g, '')
    .replace(/%/g, '');
  if (normalized.includes(',') && !normalized.includes('.')) normalized = normalized.replace(',', '.');
  else if (normalized.includes(',') && normalized.includes('.')) normalized = normalized.replace(/,/g, '');
  const number = Number.parseFloat(normalized);
  return Number.isNaN(number) ? null : number;
}

function parseDate(raw) {
  if (!raw && raw !== 0) return new Date().toISOString().split('T')[0];

  if (typeof raw === 'number' && raw > 20000 && raw < 80000) {
    const excelDate = XLSX.SSF.parse_date_code(raw);
    if (excelDate) {
      const month = `${excelDate.m}`.padStart(2, '0');
      const day = `${excelDate.d}`.padStart(2, '0');
      return `${excelDate.y}-${month}-${day}`;
    }
  }

  const value = String(raw).trim();
  if (/^\d{5}(\.\d+)?$/.test(value)) {
    const excelDate = XLSX.SSF.parse_date_code(Number(value));
    if (excelDate) {
      const month = `${excelDate.m}`.padStart(2, '0');
      const day = `${excelDate.d}`.padStart(2, '0');
      return `${excelDate.y}-${month}-${day}`;
    }
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.substring(0, 10);

  const dmy = value.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;

  const mdy = value.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (mdy) {
    const year = mdy[3].length === 2 ? `20${mdy[3]}` : mdy[3];
    return `${year}-${mdy[1].padStart(2, '0')}-${mdy[2].padStart(2, '0')}`;
  }

  if (/^\d{10,13}$/.test(value)) {
    const date = new Date(value.length === 10 ? Number(value) * 1000 : Number(value));
    return date.toISOString().split('T')[0];
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
  return new Date().toISOString().split('T')[0];
}

function normalizeType(raw) {
  if (!raw) return 'Long';
  const value = String(raw).toLowerCase().trim();
  if (['buy', 'long', 'b', '1', 'bullish', 'achat', 'hausse', 'up'].includes(value)) return 'Long';
  if (['sell', 'short', 's', '-1', 'bearish', 'vente', 'baisse', 'down'].includes(value)) return 'Short';
  if (value.includes('buy') || value.includes('long') || value.includes('achat')) return 'Long';
  if (value.includes('sell') || value.includes('short') || value.includes('vente')) return 'Short';
  return 'Long';
}

function normalizeSession(raw) {
  if (!raw) return 'NY';
  const value = String(raw).toLowerCase().trim();
  if (value.includes('new york') || value === 'ny' || value.includes('american') || value.includes('nasdaq')) return 'NY';
  if (value.includes('london') || value === 'ldn' || value.includes('europe') || value === 'lon') return 'London';
  if (value.includes('asia') || value.includes('tokyo') || value.includes('asian') || value.includes('sydney')) return 'Asia';
  return raw;
}

function normalizeBias(raw) {
  if (!raw) return 'Neutral';
  const value = String(raw).toLowerCase().trim();
  if (value.includes('bull') || value.includes('long') || value === 'up' || value === '1') return 'Bullish';
  if (value.includes('bear') || value.includes('short') || value === 'down' || value === '-1') return 'Bearish';
  return 'Neutral';
}

function normalizeNews(raw) {
  if (!raw) return 'Low';
  const value = String(raw).toLowerCase().trim();
  if (value.includes('high') || value.includes('fort') || value === '3' || value === 'red') return 'High';
  if (value.includes('med') || value.includes('moyen') || value === '2' || value === 'orange' || value === 'yellow') return 'Medium';
  return 'Low';
}

function guessFieldFromContent(values) {
  const samples = values.filter((value) => value && String(value).trim()).slice(0, 10);
  if (!samples.length) return null;
  const typeValues = ['buy', 'sell', 'long', 'short', 'b', 's', '1', '-1', 'achat', 'vente'];
  if (samples.filter((value) => typeValues.includes(String(value).toLowerCase().trim())).length >= samples.length * 0.6) return 'type';
  const sessionValues = ['ny', 'london', 'asia', 'new york', 'tokyo', 'sydney', 'european', 'american', 'asian'];
  if (samples.filter((value) => sessionValues.some((session) => String(value).toLowerCase().includes(session))).length >= samples.length * 0.5) return 'session';
  const biasValues = ['bullish', 'bearish', 'neutral', 'haussier', 'baissier', 'bull', 'bear'];
  if (samples.filter((value) => biasValues.some((bias) => String(value).toLowerCase().includes(bias))).length >= samples.length * 0.5) return 'bias';
  const newsValues = ['high', 'medium', 'low', 'red', 'orange', 'green', 'fort', 'moyen', 'faible'];
  if (samples.filter((value) => newsValues.includes(String(value).toLowerCase().trim())).length >= samples.length * 0.5) return 'newsImpact';
  if (samples.filter((value) => /\d{2,4}[\-/.]\d{1,2}[\-/.]\d{2,4}/.test(value) || /^\d{10,13}$/.test(value)).length >= samples.length * 0.7) return 'date';
  if (samples.filter((value) => /^[A-Z]{2,10}(\/[A-Z]{2,6})?$/.test(String(value).toUpperCase().trim())).length >= samples.length * 0.6) return 'symbol';
  const numbers = samples.map((value) => parseNum(value)).filter((value) => value !== null);
  if (numbers.length >= samples.length * 0.8) {
    const hasNegative = numbers.some((value) => value < 0);
    const hasPositive = numbers.some((value) => value > 0);
    if (hasNegative && hasPositive && Math.max(...numbers.map(Math.abs)) < 100000) return 'pnl';
  }
  return null;
}

function getMappingConfidence(header, mappedField, sampleValues) {
  if (mappedField === '_ignore') return 0;
  if (mappedField === '_extra') return 30;
  const normalized = normalizeKey(header);
  if (FIELD_MAP[normalized] === mappedField) return 100;
  const partialKey = Object.keys(FIELD_MAP).find((key) => (key.includes(normalized) || normalized.includes(key)) && key.length >= 3);
  if (partialKey && FIELD_MAP[partialKey] === mappedField) return 70;
  if (guessFieldFromContent(sampleValues) === mappedField) return 50;
  return 20;
}

function autoMapHeaders(headers, previewRows) {
  const nextMapping = {};
  headers.forEach((header) => {
    nextMapping[header] = FIELD_MAP[normalizeKey(header)] || null;
  });

  headers.forEach((header, columnIndex) => {
    if (!nextMapping[header]) {
      const values = previewRows.map((row) => row[columnIndex] || '').filter(Boolean);
      nextMapping[header] = guessFieldFromContent(values) || '_extra';
    }
  });

  const usedFields = {};
  headers.forEach((header) => {
    const mappedField = nextMapping[header];
    if (!mappedField || mappedField === '_extra' || mappedField === '_ignore') return;
    if (!usedFields[mappedField]) {
      usedFields[mappedField] = header;
      return;
    }
    const currentScore = FIELD_MAP[normalizeKey(header)] === mappedField ? 100 : 50;
    const previousScore = FIELD_MAP[normalizeKey(usedFields[mappedField])] === mappedField ? 100 : 50;
    if (currentScore > previousScore) {
      nextMapping[usedFields[mappedField]] = '_extra';
      usedFields[mappedField] = header;
    } else {
      nextMapping[header] = '_extra';
    }
  });
  return nextMapping;
}

function buildDetection(headers, previewRows) {
  const mapping = autoMapHeaders(headers, previewRows);
  const confidence = {};
  headers.forEach((header, columnIndex) => {
    confidence[header] = getMappingConfidence(header, mapping[header], previewRows.map((row) => row[columnIndex] || ''));
  });
  return { mapping, confidence };
}

function parseDatasetFromText(text) {
  const content = String(text || '').trim();
  if (!content) throw new Error('Paste a dataset before running analysis.');
  if (content.startsWith('{') || content.startsWith('[')) {
    return { ...prepareImportedRows(getRowsFromJson(content)), separator: 'json' };
  }
  const separator = detectSeparator(content);
  const lines = content.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) throw new Error('The dataset needs at least one header row and one trade row.');
  const headers = parseCSVLine(lines[0], separator);
  const dataRows = lines.slice(1).map((line) => parseCSVLine(line, separator));
  return { headers, dataRows, preview: dataRows.slice(0, 6), separator };
}

function downloadTemplate() {
  const csv = SAMPLE_TEMPLATE_ROWS.map((row) => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'marketflow-import-template.csv';
  anchor.click();
  URL.revokeObjectURL(url);
}

function separatorLabelFromValue(separator) {
  if (separator === 'workbook') return 'Workbook';
  if (separator === 'json') return 'JSON';
  if (separator === '\t') return 'Tab';
  if (separator === ';') return 'Semicolon';
  if (separator === '|') return 'Pipe';
  return 'Comma';
}

// UI
function SourceIcon({ id, color = C.cyan }) {
  if (id === 'notion') {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2.25" y="2.25" width="13.5" height="13.5" rx="3" />
        <path d="M6 6h6" />
        <path d="M6 9h6" />
        <path d="M6 12h4" />
      </svg>
    );
  }
  if (id === 'sheet') {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2.25" y="2.25" width="13.5" height="13.5" rx="2.5" />
        <path d="M6 2.75v12.5" />
        <path d="M10.5 2.75v12.5" />
        <path d="M2.75 6h12.5" />
        <path d="M2.75 10.5h12.5" />
      </svg>
    );
  }
  if (id === 'journal') {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 14.75V3.25" />
        <path d="M3 14.75h12" />
        <path d="M5.75 11.25 8 8.5l2 1.5 3.5-4.5" />
      </svg>
    );
  }
  if (id === 'custom') {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5.25 4.75 2.5 9l2.75 4.25" />
        <path d="M12.75 4.75 15.5 9l-2.75 4.25" />
        <path d="M10.5 3 7.5 15" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.25 13.25h11.5" />
      <path d="M5 13V8.5" />
      <path d="M9 13V5" />
      <path d="M13 13V7" />
      <path d="M2.75 4.75h12.5" />
    </svg>
  );
}

function ActionButton({ children, onClick, variant = 'default', disabled, loading, size = 'md', fullWidth = false }) {
  const variants = {
    default: { background: 'rgba(10, 15, 24, 0.88)', border: C.brd, color: C.t1, shadow: 'none' },
    primary: {
      background: 'linear-gradient(135deg, rgba(var(--mf-accent-rgb, 6, 230, 255), 0.98), rgba(var(--mf-accent-secondary-rgb, 0, 255, 136), 0.92))',
      border: 'transparent',
      color: C.bgDeep,
      shadow: `0 18px 34px ${shade(C.cyan, 0.22)}`,
    },
    ghost: { background: 'transparent', border: 'transparent', color: C.t2, shadow: 'none' },
    subtle: { background: 'rgba(255,255,255,0.02)', border: C.brd, color: C.t2, shadow: 'none' },
  };
  const sizes = {
    sm: { padding: '9px 12px', fontSize: 11 },
    md: { padding: '11px 15px', fontSize: 12 },
  };
  const style = variants[variant] || variants.default;
  const sizeStyle = sizes[size] || sizes.md;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={disabled || loading ? {} : { y: -1, scale: 1.01 }}
      whileTap={disabled || loading ? {} : { scale: 0.98 }}
      style={{
        ...sizeStyle,
        width: fullWidth ? '100%' : 'auto',
        borderRadius: 12,
        border: `1px solid ${style.border}`,
        background: style.background,
        color: style.color,
        boxShadow: style.shadow,
        fontWeight: 700,
        fontFamily: 'inherit',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        transition: 'all 0.2s ease',
      }}
    >
      {loading && (
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
          style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            border: `2px solid ${variant === 'primary' ? C.bgDeep : C.cyan}`,
            borderTopColor: 'transparent',
            display: 'inline-block',
          }}
        />
      )}
      {children}
    </motion.button>
  );
}

function StatChip({ label, value, tone = 'default' }) {
  const tones = {
    default: { border: shade(C.t2, 0.18), color: C.t2, background: 'rgba(255,255,255,0.02)' },
    green: { border: shade(C.green, 0.24), color: C.green, background: shade(C.green, 0.08) },
    cyan: { border: shade(C.cyan, 0.24), color: C.cyan, background: shade(C.cyan, 0.08) },
    warn: { border: shade(C.warn, 0.24), color: C.warn, background: shade(C.warn, 0.08) },
    danger: { border: shade(C.danger, 0.24), color: C.danger, background: shade(C.danger, 0.08) },
    purple: { border: shade(C.purple, 0.24), color: C.purple, background: shade(C.purple, 0.08) },
  };
  const toneStyle = tones[tone] || tones.default;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 10px',
        borderRadius: 999,
        border: `1px solid ${toneStyle.border}`,
        background: toneStyle.background,
        color: toneStyle.color,
        fontSize: 10.5,
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}
    >
      <span style={{ color: C.t3 }}>{label}</span>
      <span>{value}</span>
    </span>
  );
}

// COMPONENT
export default function TradeImportModal({ isOpen, onClose, onImport }) {
  const fileRef = useRef(null);
  const [step, setStep] = useState(1);
  const [source, setSource] = useState('broker');
  const [mode, setMode] = useState('file');
  const [file, setFile] = useState(null);
  const [pasteValue, setPasteValue] = useState('');
  const [drag, setDrag] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [rawHeaders, setRawHeaders] = useState([]);
  const [previewRows, setPreviewRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [confidence, setConfidence] = useState({});
  const [separator, setSeparator] = useState(',');
  const [allRows, setAllRows] = useState([]);
  const [filterConf, setFilterConf] = useState('all');
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });
  const [importResult, setImportResult] = useState(null);

  const selectedSource = useMemo(() => SOURCE_OPTIONS.find((option) => option.id === source) || SOURCE_OPTIONS[0], [source]);
  const symbolMapped = useMemo(() => Object.values(mapping).includes('symbol'), [mapping]);
  const pnlMapped = useMemo(() => Object.values(mapping).includes('pnl'), [mapping]);
  const highCount = useMemo(() => rawHeaders.filter((header) => (confidence[header] ?? 0) >= 70).length, [rawHeaders, confidence]);
  const mediumCount = useMemo(() => rawHeaders.filter((header) => { const value = confidence[header] ?? 0; return value >= 50 && value < 70; }).length, [rawHeaders, confidence]);
  const lowCount = useMemo(() => rawHeaders.filter((header) => { const value = confidence[header] ?? 0; const current = mapping[header] || '_extra'; return value < 50 && current !== '_extra' && current !== '_ignore'; }).length, [rawHeaders, confidence, mapping]);
  const extraCount = useMemo(() => rawHeaders.filter((header) => mapping[header] === '_extra').length, [rawHeaders, mapping]);
  const filteredHeaders = useMemo(() => rawHeaders.filter((header) => {
    const value = confidence[header] ?? 0;
    const current = mapping[header] || '_extra';
    if (filterConf === 'high') return value >= 70;
    if (filterConf === 'review') return value < 70 && current !== '_extra' && current !== '_ignore';
    if (filterConf === 'extra') return current === '_extra';
    return true;
  }), [rawHeaders, confidence, mapping, filterConf]);

  const resetState = () => {
    setStep(1);
    setMode('file');
    setFile(null);
    setPasteValue('');
    setDrag(false);
    setParsing(false);
    setRawHeaders([]);
    setPreviewRows([]);
    setMapping({});
    setConfidence({});
    setSeparator(',');
    setAllRows([]);
    setFilterConf('all');
    setImporting(false);
    setImportProgress({ done: 0, total: 0 });
    setImportResult(null);
  };

  const handleClose = () => {
    resetState();
    onClose?.();
  };

  const applyParsedDataset = ({ headers, preview, dataRows, separator: nextSeparator, originLabel }) => {
    const detection = buildDetection(headers, preview);
    setRawHeaders(headers);
    setPreviewRows(preview);
    setMapping(detection.mapping);
    setConfidence(detection.confidence);
    setAllRows(dataRows);
    setSeparator(nextSeparator);
    setStep(2);
    const autoReady = Object.values(detection.confidence).filter((value) => value >= 70).length;
    toast.success(`${dataRows.length} rows analyzed from ${originLabel}. ${autoReady} columns matched automatically.`);
  };

  const parseFile = (nextFile) => {
    if (!nextFile) return;
    setFile(nextFile);
    setParsing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const arrayBuffer = event.target.result;
        let prepared;
        if (isSpreadsheetFile(nextFile.name)) prepared = { ...prepareImportedRows(getRowsFromWorkbook(arrayBuffer)), separator: 'workbook' };
        else if (isJsonFile(nextFile.name)) prepared = { ...prepareImportedRows(getRowsFromJson(readTextFromBytes(arrayBuffer))), separator: 'json' };
        else prepared = parseDatasetFromText(readTextFromBytes(arrayBuffer));
        applyParsedDataset({ ...prepared, originLabel: nextFile.name });
      } catch (error) {
        toast.error(error.message || 'Unable to analyze this file.');
      } finally {
        setParsing(false);
      }
    };
    reader.readAsArrayBuffer(nextFile);
  };

  const analyzePastedData = () => {
    if (!pasteValue.trim()) {
      toast.error('Paste a trade dataset first.');
      return;
    }
    setParsing(true);
    try {
      const prepared = parseDatasetFromText(pasteValue);
      applyParsedDataset({ ...prepared, originLabel: 'pasted data' });
    } catch (error) {
      toast.error(error.message || 'Unable to analyze the pasted data.');
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    if (!symbolMapped) {
      toast.error('Map a Symbol column before importing.');
      return;
    }

    setImporting(true);
    setImportProgress({ done: 0, total: allRows.length });

    try {
      const results = [];
      const skipped = [];

      allRows.forEach((row, index) => {
        const values = Array.isArray(row) ? row : parseCSVLine(row, separator);
        if (!values.some((value) => String(value || '').trim())) return;

        const raw = {};
        rawHeaders.forEach((header, columnIndex) => {
          raw[header] = (values[columnIndex] || '').toString().trim();
        });

        const mapped = {};
        const extra = {};
        rawHeaders.forEach((header) => {
          const target = mapping[header] || '_extra';
          const value = raw[header] || '';
          if (target === '_ignore') return;
          if (target === '_extra') {
            if (value) extra[header] = value;
            return;
          }
          if (!mapped[target] && value) mapped[target] = value;
        });

        if (!mapped.symbol) {
          skipped.push(index + 2);
          return;
        }

        const entry = parseNum(mapped.entry);
        const exit = parseNum(mapped.exit);
        const pnlValue = parseNum(mapped.pnl);
        const slValue = parseNum(mapped.sl);
        const tpValue = parseNum(mapped.tp);
        const breakEvenValue = parseNum(mapped.breakEven);
        const trailingStopValue = parseNum(mapped.trailingStop);
        const lotsValue = parseNum(mapped.lots);
        const commissionValue = parseNum(mapped.commission);
        const swapValue = parseNum(mapped.swap);
        const riskValue = parseNum(mapped.risk);
        const rrValue = parseNum(mapped.rrActual);
        const riskDistance = slValue && entry ? Math.abs(entry - slValue) : 0;
        const reward = entry && exit ? Math.abs(exit - entry) : 0;
        const rrCalculated = riskDistance > 0 ? (reward / riskDistance).toFixed(2) : rrValue?.toFixed(2) || '0';
        const tpPercentCalculated = tpValue && entry && Math.abs(tpValue - entry) > 0 ? ((reward / Math.abs(tpValue - entry)) * 100).toFixed(1) : '0';

        const trade = {
          symbol: mapped.symbol.toUpperCase().trim().replace(/[^A-Z0-9/.\-_]/g, ''),
          pair: mapped.symbol.toUpperCase().trim().replace(/[^A-Z0-9/.\-_]/g, ''),
          direction: normalizeType(mapped.type),
          type: normalizeType(mapped.type),
          dir: normalizeType(mapped.type),
          entry: entry ?? 0,
          exit: exit ?? 0,
          tp: tpValue,
          sl: slValue,
          size: lotsValue || 0,
          open_date: parseDate(mapped.date),
          date: parseDate(mapped.date),
          time: mapped.time || '',
          session: normalizeSession(mapped.session),
          bias: normalizeBias(mapped.bias),
          newsImpact: normalizeNews(mapped.newsImpact),
          setup: mapped.setup || '',
          notes: mapped.notes || '',
          breakEven: breakEvenValue,
          trailingStop: trailingStopValue,
          lots: lotsValue,
          commission: commissionValue,
          swap: swapValue,
          risk: riskValue,
          tags: mapped.tags || null,
          marketType: mapped.marketType || '',
          exchange: mapped.exchange || '',
          account: mapped.account || '',
          duration: mapped.duration || '',
          psychologyScore: mapped.psychologyScore ? Number.parseInt(mapped.psychologyScore, 10) : 80,
          metrics: { rrReel: rrCalculated, tpPercent: tpPercentCalculated },
        };

        if (pnlValue != null) trade.pnl = pnlValue;
        if (Object.keys(extra).length) trade.extra = extra;
        results.push(trade);
      });

      if (!results.length) {
        toast.error('No valid trade rows were detected. Check your Symbol mapping.');
        setImporting(false);
        setImportProgress({ done: 0, total: 0 });
        return;
      }

      let success = 0;
      let failed = 0;
      for (let index = 0; index < results.length; index += 1) {
        const imported = await onImport(results[index]);
        if (imported !== null && imported !== false) success += 1;
        else failed += 1;
        setImportProgress({ done: index + 1, total: results.length });
      }

      setImportResult({ count: success, failed, ignored: skipped.length, source: selectedSource.title });
      if (success > 0) toast.success(`${success} trade${success > 1 ? 's' : ''} imported.`);
      if (failed > 0) toast.error(`${failed} trade${failed > 1 ? 's' : ''} failed during import.`);
      if (skipped.length > 0) toast(`${skipped.length} row${skipped.length > 1 ? 's were' : ' was'} skipped.`);
      setStep(3);
    } catch (error) {
      toast.error(error.message || 'Import failed.');
    } finally {
      setImporting(false);
    }
  };

  if (!isOpen) return null;

  const sourceTone = source === 'notion'
    ? 'purple'
    : source === 'sheet'
      ? 'warn'
      : source === 'journal'
        ? 'green'
        : source === 'custom'
          ? 'default'
          : 'cyan';

  return null;
}
