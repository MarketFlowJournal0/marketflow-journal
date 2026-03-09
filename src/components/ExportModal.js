import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function ExportModal({ isOpen, onClose, trades, filters }) {
  const [exportFormat, setExportFormat] = useState('csv');
  const [includeCharts, setIncludeCharts] = useState(false);
  const [dateRange, setDateRange] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Filter trades based on date range
  const getFilteredTrades = () => {
    let filtered = [...trades];

    if (dateRange === 'custom') {
      if (customStartDate) {
        filtered = filtered.filter(t => t.date >= customStartDate);
      }
      if (customEndDate) {
        filtered = filtered.filter(t => t.date <= customEndDate);
      }
    } else if (dateRange === 'lastMonth') {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      filtered = filtered.filter(t => new Date(t.date) >= lastMonth);
    } else if (dateRange === 'last3Months') {
      const last3Months = new Date();
      last3Months.setMonth(last3Months.getMonth() - 3);
      filtered = filtered.filter(t => new Date(t.date) >= last3Months);
    }

    return filtered;
  };

  // Export to CSV
  const exportToCSV = () => {
    const filteredTrades = getFilteredTrades();
    
    if (filteredTrades.length === 0) {
      toast.error('No trades to export');
      return;
    }

    const loadingToast = toast.loading('Generating CSV file...');

    const csvData = filteredTrades.map(trade => ({
      Date: trade.date,
      Time: trade.time,
      Symbol: trade.symbol,
      Type: trade.type,
      'Market Type': trade.marketType,
      Session: trade.session,
      Bias: trade.bias,
      'News Impact': trade.newsImpact,
      Entry: trade.entry,
      Exit: trade.exit,
      'Stop Loss': trade.stopLoss,
      'TP %': trade.metrics?.tpPercent,
      'RR': trade.metrics?.rrReel,
      Setup: trade.setup,
      'Psychology Score': trade.psychologyScore,
      'Discipline Score': trade.disciplineScore,
      'P&L': trade.pnl,
      Win: trade.win ? 'Yes' : 'No',
      Notes: trade.notes || '',
    }));

    const ws = XLSX.utils.json_to_sheet(csvData);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    
    toast.dismiss(loadingToast);
    toast.success(`${filteredTrades.length} trades exported to CSV! 📄`);
    
    saveAs(blob, `MarketFlow_Export_${new Date().toISOString().split('T')[0]}.csv`);
    onClose();
  };

  // Export to Excel
  const exportToExcel = () => {
    const filteredTrades = getFilteredTrades();
    
    if (filteredTrades.length === 0) {
      toast.error('No trades to export');
      return;
    }

    const loadingToast = toast.loading('Generating Excel file...');

    // Trades sheet
    const tradesData = filteredTrades.map(trade => ({
      Date: trade.date,
      Time: trade.time,
      Symbol: trade.symbol,
      Type: trade.type,
      'Market Type': trade.marketType,
      Session: trade.session,
      Bias: trade.bias,
      'News Impact': trade.newsImpact,
      Entry: parseFloat(trade.entry),
      Exit: parseFloat(trade.exit),
      'Stop Loss': parseFloat(trade.stopLoss),
      'TP %': parseFloat(trade.metrics?.tpPercent || 0),
      'RR': parseFloat(trade.metrics?.rrReel || 0),
      Setup: trade.setup,
      'Psychology Score': trade.psychologyScore,
      'Discipline Score': trade.disciplineScore,
      'P&L': parseFloat(trade.pnl || 0),
      Win: trade.win ? 'Yes' : 'No',
      Confluences: (trade.confluences || []).join(', '),
      Emotions: (trade.psychology?.emotions || []).join(', '),
      Notes: trade.notes || '',
    }));

    // Stats sheet
    const wins = filteredTrades.filter(t => t.win).length;
    const losses = filteredTrades.length - wins;
    const totalPnL = filteredTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
    const avgRR = filteredTrades.reduce((sum, t) => sum + parseFloat(t.metrics?.rrReel || 0), 0) / filteredTrades.length;

    const statsData = [
      { Metric: 'Total Trades', Value: filteredTrades.length },
      { Metric: 'Wins', Value: wins },
      { Metric: 'Losses', Value: losses },
      { Metric: 'Win Rate', Value: `${((wins / filteredTrades.length) * 100).toFixed(1)}%` },
      { Metric: 'Total P&L', Value: `$${totalPnL.toFixed(2)}` },
      { Metric: 'Avg P&L', Value: `$${(totalPnL / filteredTrades.length).toFixed(2)}` },
      { Metric: 'Avg RR', Value: `1:${avgRR.toFixed(2)}` },
    ];

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(tradesData);
    const ws2 = XLSX.utils.json_to_sheet(statsData);
    
    XLSX.utils.book_append_sheet(wb, ws1, 'Trades');
    XLSX.utils.book_append_sheet(wb, ws2, 'Statistics');
    
    XLSX.writeFile(wb, `MarketFlow_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast.dismiss(loadingToast);
    toast.success(`${filteredTrades.length} trades exported to Excel! 📊`);
    onClose();
  };

  // Export to PDF
  const exportToPDF = () => {
    const filteredTrades = getFilteredTrades();
    
    if (filteredTrades.length === 0) {
      toast.error('No trades to export');
      return;
    }

    const loadingToast = toast.loading('Generating PDF report...');

    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(59, 130, 246);
    doc.text('MarketFlow Trading Journal', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Export Date: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Total Trades: ${filteredTrades.length}`, 14, 36);

    // Statistics Summary
    const wins = filteredTrades.filter(t => t.win).length;
    const losses = filteredTrades.length - wins;
    const totalPnL = filteredTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
    const winRate = ((wins / filteredTrades.length) * 100).toFixed(1);

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Performance Summary', 14, 46);
    
    doc.autoTable({
      startY: 50,
      head: [['Metric', 'Value']],
      body: [
        ['Win Rate', `${winRate}%`],
        ['Total P&L', `$${totalPnL.toFixed(2)}`],
        ['Wins', wins],
        ['Losses', losses],
      ],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
    });

    // Trades Table
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Trades Details', 14, 22);

    const tableData = filteredTrades.slice(0, 50).map(trade => [
      trade.date,
      trade.symbol,
      trade.type,
      `$${trade.pnl}`,
      `${trade.metrics?.tpPercent}%`,
      `1:${trade.metrics?.rrReel}`,
      trade.win ? '✓' : '✗',
    ]);

    doc.autoTable({
      startY: 28,
      head: [['Date', 'Symbol', 'Type', 'P&L', 'TP%', 'RR', 'Win']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 8 },
    });

    if (filteredTrades.length > 50) {
      doc.text(`Showing first 50 of ${filteredTrades.length} trades`, 14, doc.lastAutoTable.finalY + 10);
    }

    doc.save(`MarketFlow_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast.dismiss(loadingToast);
    toast.success(`PDF report generated with ${filteredTrades.length} trades! 📄`);
    onClose();
  };

  const handleExport = () => {
    switch (exportFormat) {
      case 'csv':
        exportToCSV();
        break;
      case 'excel':
        exportToExcel();
        break;
      case 'pdf':
        exportToPDF();
        break;
      default:
        toast.error('Invalid export format');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-[#0F1419] bg-opacity-70 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#1E2536] rounded-2xl max-w-2xl w-full border-2 border-[#2D3548] shadow-2xl"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-4xl">📤</span>
                  <div>
                    <h3 className="text-2xl font-black text-white">Export Trades</h3>
                    <p className="text-blue-100 text-sm">Download your trading data</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-white hover:text-[#E2E8F0] text-3xl transition"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Export Format */}
              <div>
                <label className="block text-white font-bold mb-3 text-lg">Export Format</label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: 'csv', label: 'CSV', icon: '📄', desc: 'Excel compatible' },
                    { value: 'excel', label: 'Excel', icon: '📊', desc: 'Multi-sheet workbook' },
                    { value: 'pdf', label: 'PDF', icon: '📕', desc: 'Professional report' },
                  ].map((format) => (
                    <motion.button
                      key={format.value}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setExportFormat(format.value)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        exportFormat === format.value
                          ? 'bg-[#3B82F6] border-blue-400 text-white'
                          : 'bg-[#1A1F2E] border-[#2D3548] text-[#A0AEC0] hover:border-[#374357]'
                      }`}
                    >
                      <div className="text-3xl mb-2">{format.icon}</div>
                      <div className="font-bold">{format.label}</div>
                      <div className="text-xs opacity-75">{format.desc}</div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-white font-bold mb-3 text-lg">Date Range</label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1A1F2E] text-white rounded-xl border-2 border-[#2D3548] focus:border-[#60A5FA] focus:outline-none transition-all font-semibold"
                >
                  <option value="all">All Trades</option>
                  <option value="lastMonth">Last Month</option>
                  <option value="last3Months">Last 3 Months</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {/* Custom Date Range */}
              <AnimatePresence>
                {dateRange === 'custom' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div>
                      <label className="block text-[#A0AEC0] text-sm mb-2 font-semibold">Start Date</label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="w-full px-4 py-3 bg-[#1A1F2E] text-white rounded-xl border-2 border-[#2D3548] focus:border-[#60A5FA] focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[#A0AEC0] text-sm mb-2 font-semibold">End Date</label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-full px-4 py-3 bg-[#1A1F2E] text-white rounded-xl border-2 border-[#2D3548] focus:border-[#60A5FA] focus:outline-none transition-all"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Options */}
              {exportFormat === 'pdf' && (
                <div>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeCharts}
                      onChange={(e) => setIncludeCharts(e.target.checked)}
                      className="w-5 h-5 rounded border-[#374357] bg-[#252D42] text-blue-600 focus:ring-[#3B82F6] cursor-pointer"
                    />
                    <span className="text-white font-semibold">Include Charts & Analytics</span>
                  </label>
                </div>
              )}

              {/* Summary */}
              <div className="bg-[#1A1F2E] rounded-xl p-4 border-2 border-[#2D3548]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#A0AEC0]">Trades to export:</span>
                  <span className="text-white font-black text-xl">{getFilteredTrades().length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#A0AEC0]">Format:</span>
                  <span className="text-[#93C5FD] font-bold uppercase">{exportFormat}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-[#1A1F2E] p-6 rounded-b-2xl flex items-center justify-between border-t-2 border-[#2D3548]">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-[#252D42] text-white rounded-xl hover:bg-[#2D3548] transition font-bold"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExport}
                disabled={getFilteredTrades().length === 0}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-black shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📤 Export {getFilteredTrades().length} Trades
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ExportModal;