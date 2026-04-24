import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

const UI = {
  bg: 'rgba(7, 11, 19, 0.76)',
  panel: 'linear-gradient(180deg, rgba(10, 16, 28, 0.98), rgba(8, 13, 22, 0.98))',
  card: 'rgba(255,255,255,0.03)',
  line: 'var(--mf-border, #1E2D45)',
  lineHi: 'rgba(var(--mf-accent-rgb, 6, 230, 255), 0.22)',
  text: 'var(--mf-text-1, #E8EEFF)',
  sub: 'var(--mf-text-2, #8B9BB4)',
  muted: 'var(--mf-text-3, #64748B)',
  accent: 'var(--mf-accent, #14C9E5)',
  accentSoft: 'rgba(var(--mf-accent-rgb, 6, 230, 255), 0.1)',
  success: 'var(--mf-green, #00D2B8)',
  successSoft: 'rgba(var(--mf-green-rgb, 0, 255, 136), 0.1)',
  danger: 'var(--mf-danger, #FF3D57)',
};

const FIELD_OPTIONS = [
  ['symbol', 'Pair'],
  ['_ignore', 'Ignore'],
  ['date', 'Date'],
  ['type', 'Direction'],
  ['entry', 'Entry'],
  ['exit', 'Exit'],
  ['pnl', 'P&L'],
  ['size', 'Size'],
  ['session', 'Session'],
  ['setup', 'Setup'],
  ['notes', 'Notes'],
  ['_create', 'Create column'],
];

const FIELD_ALIASES = {
  date: ['date', 'open_date', 'entry_date', 'opened', 'created'],
  time: ['time', 'hour', 'open_time'],
  symbol: ['symbol', 'pair', 'instrument', 'ticker', 'market'],
  type: ['type', 'direction', 'side', 'dir', 'position'],
  session: ['session'],
  bias: ['bias'],
  entry: ['entry', 'entryprice', 'entry_price', 'open', 'openprice', 'buyprice'],
  exit: ['exit', 'exitprice', 'exit_price', 'close', 'closeprice', 'sellprice'],
  sl: ['sl', 'stoploss', 'stop_loss', 'stop'],
  tp: ['tp', 'takeprofit', 'take_profit', 'target'],
  pnl: ['pnl', 'profitloss', 'profit_loss', 'profit', 'net', 'result', 'gainloss'],
  size: ['size', 'quantity', 'qty', 'lots', 'lotsize', 'volume'],
  setup: ['setup', 'strategy', 'playbook', 'pattern'],
  notes: ['notes', 'note', 'comment', 'comments', 'journal'],
  commission: ['commission', 'fee', 'fees', 'cost'],
  psychologyScore: ['psychology', 'psychologyscore', 'discipline', 'confidence'],
};

const SOURCE_CARDS = ['CSV / TSV', 'Excel', 'Notion', 'Broker export', 'Journal app', 'JSON'];
const CREATE_COLUMN_VALUE = '_create';

const normalizeHeader = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const slugifyFieldKey = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || `field_${Date.now()}`;

const detectDelimiter = (text) => {
  const sample = text.split(/\r?\n/).slice(0, 5).join('\n');
  return [',', ';', '\t', '|'].sort((a, b) => (sample.split(b).length - sample.split(a).length))[0] || ',';
};

const parseDelimitedLine = (line, delimiter) => {
  const values = [];
  let current = '';
  let insideQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"') {
      if (insideQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);
  return values.map((value) => value.trim());
};

const parseTableText = (text) => {
  const clean = String(text || '').replace(/^\uFEFF/, '').trim();
  if (!clean) return [];
  const delimiter = detectDelimiter(clean);
  const lines = clean.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const headers = parseDelimitedLine(lines[0], delimiter).map((header, index) => header || `Column ${index + 1}`);
  return lines.slice(1).map((line) => {
    const values = parseDelimitedLine(line, delimiter);
    return headers.reduce((row, header, index) => ({ ...row, [header]: values[index] ?? '' }), {});
  }).filter((row) => Object.values(row).some((value) => String(value || '').trim()));
};

const extractJsonRows = (value) => {
  if (Array.isArray(value)) return value.filter((item) => item && typeof item === 'object');
  if (!value || typeof value !== 'object') return [];
  const candidate = ['trades', 'data', 'items', 'rows'].find((key) => Array.isArray(value[key]));
  return candidate ? extractJsonRows(value[candidate]) : [value];
};

const autoMapHeaders = (headers) => headers.reduce((mapping, header) => {
  const normalized = normalizeHeader(header);
  const match = Object.entries(FIELD_ALIASES).find(([, aliases]) =>
    aliases.some((alias) => normalized === alias || normalized.includes(alias) || alias.includes(normalized))
  );
  return { ...mapping, [header]: match?.[0] || CREATE_COLUMN_VALUE };
}, {});

const toNumber = (value) => {
  if (value == null || value === '') return '';
  if (typeof value === 'number') return Number.isFinite(value) ? value : '';
  let clean = String(value).trim().replace(/\s/g, '');
  if (!clean) return '';
  if (clean.includes(',') && clean.includes('.')) {
    clean = clean.lastIndexOf(',') > clean.lastIndexOf('.') ? clean.replace(/\./g, '').replace(',', '.') : clean.replace(/,/g, '');
  } else if (clean.includes(',') && !clean.includes('.')) {
    clean = clean.replace(',', '.');
  }
  clean = clean.replace(/[^0-9.-]/g, '');
  const parsed = Number(clean);
  return Number.isFinite(parsed) ? parsed : '';
};

const toDate = (value) => {
  if (value == null || value === '') return '';
  if (typeof value === 'number') {
    const date = new Date(Math.round((value - 25569) * 86400 * 1000));
    return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
  }
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
};

const normalizeType = (value) => {
  const text = String(value || '').trim().toLowerCase();
  return ['short', 'sell', 'bear', 'bearish'].some((item) => text.includes(item)) ? 'Short' : 'Long';
};

async function parseInput({ file, text }) {
  if (file) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension === 'xlsx' || extension === 'xls') {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      return XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
    }
    if (extension === 'json') return extractJsonRows(JSON.parse(await file.text()));
    return parseTableText(await file.text());
  }
  return extractJsonRows(JSON.parse(text));
}

const pillStyle = (active) => ({
  padding: '9px 12px',
  borderRadius: 12,
  border: `1px solid ${active ? UI.lineHi : UI.line}`,
  background: active ? UI.accentSoft : UI.card,
  color: active ? UI.text : UI.sub,
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
});

export default function TradeImportModal({ isOpen, onClose, onImport, onImportBatch, onRegisterCustomColumns, onImportComplete }) {
  const fileInputRef = useRef(null);
  const [mode, setMode] = useState('upload');
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [step, setStep] = useState(1);
  const [rows, setRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState({ stage: 'idle', total: 0, processed: 0, imported: 0, skipped: 0 });

  useEffect(() => {
    if (!isOpen) {
      setMode('upload');
      setFile(null);
      setText('');
      setStep(1);
      setRows([]);
      setMapping({});
      setImporting(false);
      setResult(null);
      setProgress({ stage: 'idle', total: 0, processed: 0, imported: 0, skipped: 0 });
    }
  }, [isOpen]);

  const headers = useMemo(() => Object.keys(rows[0] || {}), [rows]);
  const previewRows = useMemo(() => rows.slice(0, 6), [rows]);

  const loadRows = async () => {
    try {
      const nextRows = await parseInput({ file, text });
      if (!nextRows.length) {
        toast.error('No rows detected in this import.');
        return;
      }
      setRows(nextRows);
      setMapping(autoMapHeaders(Object.keys(nextRows[0] || {})));
      setStep(2);
      toast.success(`${nextRows.length} row(s) ready to review.`);
    } catch (error) {
      const fallbackRows = !file && text ? parseTableText(text) : [];
      if (fallbackRows.length) {
        setRows(fallbackRows);
        setMapping(autoMapHeaders(Object.keys(fallbackRows[0] || {})));
        setStep(2);
        toast.success(`${fallbackRows.length} row(s) ready to review.`);
        return;
      }
      toast.error('Import source could not be read.');
    }
  };

  const handleImport = async () => {
    const reverse = Object.entries(mapping).reduce((accumulator, [header, field]) => {
      if (field && field !== '_ignore' && !accumulator[field]) accumulator[field] = header;
      return accumulator;
    }, {});
    if (!reverse.symbol) {
      toast.error('Map a symbol column before importing.');
      return;
    }
    const customColumns = headers
      .filter((header) => mapping[header] === CREATE_COLUMN_VALUE)
      .map((header) => ({ fieldKey: slugifyFieldKey(header), label: String(header).trim() || 'Created column', dataType: 'text' }));

    if (customColumns.length) {
      onRegisterCustomColumns?.(customColumns);
    }

    const normalizedTrades = rows.map((row) => {
      const read = (field) => row[reverse[field]] ?? '';
      const date = toDate(read('date')) || new Date().toISOString().slice(0, 10);
      const symbol = String(read('symbol') || '').trim().toUpperCase();
      const extra = customColumns.reduce((accumulator, column) => {
        const raw = row[column.label];
        if (raw == null || raw === '') return accumulator;
        return { ...accumulator, [column.fieldKey]: raw };
      }, {});
      return symbol ? {
        date,
        open_date: date,
        time: String(read('time') || '').trim(),
        symbol,
        type: normalizeType(read('type')),
        direction: normalizeType(read('type')),
        session: String(read('session') || '').trim(),
        bias: String(read('bias') || '').trim(),
        entry: toNumber(read('entry')),
        exit: toNumber(read('exit')),
        sl: toNumber(read('sl')),
        tp: toNumber(read('tp')),
        pnl: toNumber(read('pnl')),
        size: toNumber(read('size')),
        lots: toNumber(read('size')),
        setup: String(read('setup') || '').trim(),
        notes: String(read('notes') || '').trim(),
        extra: Object.keys(extra).length ? extra : null,
      } : null;
    }).filter(Boolean);
    if (!normalizedTrades.length) {
      toast.error('No valid trades found after mapping.');
      return;
    }
    if (!onImportBatch && !onImport) {
      toast.error('Import handler is missing.');
      return;
    }

    setImporting(true);
    setProgress({ stage: 'starting', total: normalizedTrades.length, processed: 0, imported: 0, skipped: 0 });
    try {
      let imported = 0;
      let skipped = 0;
      let importError = '';
      let importNotice = '';

      if (onImportBatch) {
        const result = await onImportBatch(normalizedTrades, {
          onProgress: (next) => setProgress((current) => ({
            ...current,
            ...next,
            total: next?.total ?? current.total ?? normalizedTrades.length,
          })),
        });
        imported = Number(result?.imported ?? 0);
        skipped = Number(result?.skipped ?? Math.max(0, normalizedTrades.length - imported));
        importError = String(result?.error || '').trim();
        importNotice = String(result?.notice || '').trim();
      } else {
        for (const trade of normalizedTrades) {
          const saved = await onImport(trade);
          if (saved) imported += 1;
        }
        skipped = normalizedTrades.length - imported;
      }

      onImportComplete?.({ imported, skipped });
      setResult({ imported, skipped, error: importError || null, notice: importNotice || null });
      setProgress({ stage: 'done', total: normalizedTrades.length, processed: normalizedTrades.length, imported, skipped });
      setStep(3);
      if (imported > 0) {
        toast.success(`${imported} trade(s) imported.`);
      } else if (importError) {
        toast.error(importError);
      } else {
        toast.error('No trade could be saved.');
      }
    } catch (error) {
      console.error('Import failed:', error);
      toast.error('Import failed. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: UI.bg, backdropFilter: 'blur(8px)', zIndex: 500 }} onClick={onClose} />
      <motion.div initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.98 }} transition={{ duration: 0.22 }} style={{ position: 'fixed', inset: 0, zIndex: 501, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div onClick={(event) => event.stopPropagation()} style={{ width: 'min(1080px, 100%)', maxHeight: '90vh', overflow: 'hidden', borderRadius: 28, border: `1px solid ${UI.line}`, background: UI.panel, boxShadow: '0 30px 90px rgba(0,0,0,0.45)', color: UI.text, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '22px 24px 18px', borderBottom: `1px solid ${UI.line}`, display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: UI.muted, fontWeight: 800 }}>Import trades</div>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginTop: 6 }}>Bring data into MarketFlow</div>
              <div style={{ marginTop: 8, fontSize: 13, color: UI.sub }}>CSV, Excel, tables, or JSON.</div>
            </div>
            <button type="button" onClick={onClose} style={{ width: 36, height: 36, borderRadius: 12, border: `1px solid ${UI.line}`, background: UI.card, color: UI.sub, cursor: 'pointer', fontSize: 16 }}>×</button>
          </div>

          <div style={{ padding: 24, overflowY: 'auto' }}>
            {step === 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(320px, 0.9fr)', gap: 18 }}>
                <div style={{ padding: 18, borderRadius: 22, border: `1px solid ${UI.line}`, background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>{SOURCE_CARDS.map((label) => <div key={label} style={pillStyle(false)}>{label}</div>)}</div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                    <button type="button" onClick={() => setMode('upload')} style={pillStyle(mode === 'upload')}>Upload file</button>
                    <button type="button" onClick={() => setMode('paste')} style={pillStyle(mode === 'paste')}>Paste data</button>
                  </div>
                  {mode === 'upload' ? (
                    <button type="button" onClick={() => fileInputRef.current?.click()} style={{ width: '100%', minHeight: 220, borderRadius: 24, border: `1px dashed ${UI.lineHi}`, background: 'linear-gradient(180deg, rgba(var(--mf-accent-rgb, 6, 230, 255), 0.06), rgba(255,255,255,0.01))', color: UI.text, cursor: 'pointer', padding: 24, textAlign: 'left' }}>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>{file ? file.name : 'Select an import file'}</div>
                      <div style={{ marginTop: 8, fontSize: 13, color: UI.sub }}>Accepted: .csv .tsv .txt .xlsx .xls .json</div>
                    </button>
                  ) : (
                    <textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Paste a CSV, TSV, copied table, or JSON payload here." style={{ width: '100%', minHeight: 220, resize: 'vertical', borderRadius: 20, border: `1px solid ${UI.line}`, background: UI.card, color: UI.text, padding: 16, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                  )}
                  <input ref={fileInputRef} type="file" accept=".csv,.tsv,.txt,.xlsx,.xls,.json" hidden onChange={(event) => setFile(event.target.files?.[0] || null)} />
                </div>

                <div style={{ padding: 18, borderRadius: 22, border: `1px solid ${UI.line}`, background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ fontSize: 12, color: UI.muted, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 800 }}>Import flow</div>
                  <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 16, border: `1px solid ${UI.line}`, background: UI.card, color: UI.sub, fontSize: 13 }}>
                    Review the mapping, then import.
                  </div>
                  <button type="button" onClick={loadRows} disabled={mode === 'upload' ? !file : !text.trim()} style={{ marginTop: 18, width: '100%', padding: '14px 16px', borderRadius: 16, border: 'none', background: 'linear-gradient(135deg, var(--mf-accent, #14C9E5), rgba(var(--mf-accent-rgb, 6, 230, 255), 0.82))', color: '#031018', fontSize: 13, fontWeight: 800, cursor: mode === 'upload' ? (!file ? 'not-allowed' : 'pointer') : (!text.trim() ? 'not-allowed' : 'pointer'), opacity: mode === 'upload' ? (file ? 1 : 0.55) : (text.trim() ? 1 : 0.55) }}>Review import</button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 360px) minmax(0, 1fr)', gap: 18 }}>
                <div style={{ padding: 18, borderRadius: 22, border: `1px solid ${UI.line}`, background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ fontSize: 12, color: UI.muted, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 800 }}>Column mapping</div>
                  <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>{headers.map((header) => (
                    <div key={header} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 150px', gap: 10, alignItems: 'center' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: UI.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{header}</div>
                        <div style={{ fontSize: 11, color: UI.muted }}>{String(previewRows[0]?.[header] ?? '').slice(0, 42) || 'Empty sample'}</div>
                      </div>
                      <select value={mapping[header] || '_ignore'} onChange={(event) => setMapping((current) => ({ ...current, [header]: event.target.value }))} style={{ width: '100%', borderRadius: 12, border: `1px solid ${UI.line}`, background: UI.card, color: UI.text, padding: '10px 12px', outline: 'none', fontFamily: 'inherit', fontSize: 12 }}>{FIELD_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
                    </div>
                  ))}</div>
                </div>

                <div style={{ padding: 18, borderRadius: 22, border: `1px solid ${UI.line}`, background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 12, color: UI.muted, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 800 }}>Preview</div>
                      <div style={{ marginTop: 6, fontSize: 14, color: UI.sub }}>{rows.length} row(s) detected</div>
                    </div>
                    <button type="button" onClick={() => setStep(1)} style={{ ...pillStyle(false), background: UI.card }}>Back</button>
                  </div>
                  <div style={{ overflow: 'auto', borderRadius: 18, border: `1px solid ${UI.line}` }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
                      <thead><tr>{headers.map((header) => <th key={header} style={{ padding: '12px 14px', borderBottom: `1px solid ${UI.line}`, textAlign: 'left', fontSize: 11, color: UI.muted, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', background: 'rgba(255,255,255,0.02)' }}>{header}</th>)}</tr></thead>
                      <tbody>{previewRows.map((row, index) => <tr key={index}>{headers.map((header) => <td key={`${index}-${header}`} style={{ padding: '11px 14px', borderBottom: `1px solid ${UI.line}`, color: UI.sub, fontSize: 12 }}>{String(row[header] ?? '').slice(0, 48) || '—'}</td>)}</tr>)}</tbody>
                    </table>
                  </div>
                  <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ display: 'grid', gap: 6 }}>
                      <div style={{ padding: '10px 12px', borderRadius: 14, border: `1px solid ${UI.line}`, background: UI.card, color: UI.sub, fontSize: 12 }}>Mapped symbol: <span style={{ color: mapping[headers.find((header) => mapping[header] === 'symbol')] ? UI.success : UI.danger, fontWeight: 700 }}>{Object.values(mapping).includes('symbol') ? 'Ready' : 'Missing'}</span></div>
                      {importing && (
                        <div style={{ fontSize: 11, color: UI.muted }}>
                          {progress.processed > 0 ? `${progress.processed}/${progress.total} processed` : 'Preparing import...'}
                        </div>
                      )}
                    </div>
                    <button type="button" onClick={handleImport} disabled={importing} style={{ padding: '14px 18px', borderRadius: 16, border: 'none', background: importing ? UI.card : 'linear-gradient(135deg, var(--mf-accent, #14C9E5), rgba(var(--mf-accent-rgb, 6, 230, 255), 0.82))', color: importing ? UI.sub : '#031018', fontSize: 13, fontWeight: 800, cursor: importing ? 'wait' : 'pointer' }}>{importing ? `Importing ${Math.min(progress.processed, progress.total)}/${progress.total || rows.length}` : `Import ${rows.length} trade(s)`}</button>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div style={{ maxWidth: 520, margin: '0 auto', padding: '38px 18px 20px', textAlign: 'center' }}>
                <div style={{ width: 82, height: 82, margin: '0 auto', borderRadius: 24, border: `1px solid ${UI.lineHi}`, background: UI.successSoft, display: 'grid', placeItems: 'center', color: UI.success, fontSize: 30 }}>+</div>
                <div style={{ marginTop: 18, fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em' }}>Import complete</div>
                <div style={{ marginTop: 10, fontSize: 14, color: UI.sub }}>{result?.imported || 0} trade(s) added to the journal.</div>
                {!!result?.skipped && <div style={{ marginTop: 8, fontSize: 12, color: UI.muted }}>{result.skipped} row(s) could not be saved.</div>}
                {!!result?.notice && <div style={{ marginTop: 10, fontSize: 12, color: UI.sub, lineHeight: 1.6 }}>{result.notice}</div>}
                {!!result?.error && <div style={{ marginTop: 10, fontSize: 12, color: UI.danger, lineHeight: 1.6 }}>{result.error}</div>}
                <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => setStep(1)} style={pillStyle(false)}>Import another file</button>
                  <button type="button" onClick={onClose} style={{ ...pillStyle(true), background: UI.accentSoft }}>Close</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
