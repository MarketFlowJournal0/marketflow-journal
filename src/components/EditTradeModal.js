import React, { useState, useEffect } from 'react';
import { useTradingContext } from '../context/TradingContext';

function EditTradeModal({ isOpen, onClose, trade }) {
  const { updateTrade } = useTradingContext();
  
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    symbol: '',
    type: 'Long',
    entry: '',
    exit: '',
    stopLoss: '',
    shares: '',
    pnl: '',
    setup: '',
    notes: '',
    riskPercent: 1,
  });

  useEffect(() => {
    if (trade) {
      setFormData({
        date: trade.date || '',
        time: trade.time || '',
        symbol: trade.symbol || '',
        type: trade.type || 'Long',
        entry: trade.entry || '',
        exit: trade.exit || '',
        stopLoss: trade.stopLoss || '',
        shares: trade.shares || '',
        pnl: trade.pnl || '',
        setup: trade.setup || '',
        notes: trade.notes || '',
        riskPercent: trade.riskPercent || 1,
      });
    }
  }, [trade]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const updatedData = {
      ...formData,
      entry: parseFloat(formData.entry),
      exit: parseFloat(formData.exit),
      stopLoss: parseFloat(formData.stopLoss),
      shares: parseInt(formData.shares),
      pnl: parseFloat(formData.pnl),
      riskPercent: parseFloat(formData.riskPercent),
    };
    
    updateTrade(trade.id, updatedData);
    onClose();
  };

  if (!isOpen || !trade) return null;

  return (
    <div className="fixed inset-0 bg-[#0F1419] bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1E2536] rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-[#2D3548]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#2D3548]">
          <div>
            <h2 className="text-2xl font-bold text-white">Edit Trade</h2>
            <p className="text-[#A0AEC0] text-sm mt-1">Modify trade details - metrics will be recalculated automatically</p>
          </div>
          <button onClick={onClose} className="text-[#A0AEC0] hover:text-white text-2xl">×</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Date */}
            <div>
              <label className="block text-[#A0AEC0] text-sm mb-2">Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#1A1F2E] text-white rounded-lg border border-[#2D3548] focus:border-[#60A5FA] focus:outline-none"
                required
              />
            </div>

            {/* Time */}
            <div>
              <label className="block text-[#A0AEC0] text-sm mb-2">Time</label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#1A1F2E] text-white rounded-lg border border-[#2D3548] focus:border-[#60A5FA] focus:outline-none"
              />
            </div>

            {/* Symbol */}
            <div>
              <label className="block text-[#A0AEC0] text-sm mb-2">Symbol</label>
              <input
                type="text"
                name="symbol"
                value={formData.symbol}
                onChange={handleChange}
                placeholder="EURUSD, BTCUSD, AAPL..."
                className="w-full px-4 py-3 bg-[#1A1F2E] text-white rounded-lg border border-[#2D3548] focus:border-[#60A5FA] focus:outline-none"
                required
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-[#A0AEC0] text-sm mb-2">Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#1A1F2E] text-white rounded-lg border border-[#2D3548] focus:border-[#60A5FA] focus:outline-none"
              >
                <option value="Long">Long</option>
                <option value="Short">Short</option>
              </select>
            </div>

            {/* Entry */}
            <div>
              <label className="block text-[#A0AEC0] text-sm mb-2">Entry Price</label>
              <input
                type="number"
                step="0.00001"
                name="entry"
                value={formData.entry}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#1A1F2E] text-white rounded-lg border border-[#2D3548] focus:border-[#60A5FA] focus:outline-none"
                required
              />
            </div>

            {/* Exit */}
            <div>
              <label className="block text-[#A0AEC0] text-sm mb-2">Exit Price</label>
              <input
                type="number"
                step="0.00001"
                name="exit"
                value={formData.exit}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#1A1F2E] text-white rounded-lg border border-[#2D3548] focus:border-[#60A5FA] focus:outline-none"
                required
              />
            </div>

            {/* Stop Loss */}
            <div>
              <label className="block text-[#A0AEC0] text-sm mb-2">Stop Loss</label>
              <input
                type="number"
                step="0.00001"
                name="stopLoss"
                value={formData.stopLoss}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#1A1F2E] text-white rounded-lg border border-[#2D3548] focus:border-[#60A5FA] focus:outline-none"
              />
            </div>

            {/* Shares */}
            <div>
              <label className="block text-[#A0AEC0] text-sm mb-2">Shares / Lots</label>
              <input
                type="number"
                name="shares"
                value={formData.shares}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#1A1F2E] text-white rounded-lg border border-[#2D3548] focus:border-[#60A5FA] focus:outline-none"
                required
              />
            </div>

            {/* P&L */}
            <div>
              <label className="block text-[#A0AEC0] text-sm mb-2">P&L ($)</label>
              <input
                type="number"
                step="0.01"
                name="pnl"
                value={formData.pnl}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#1A1F2E] text-white rounded-lg border border-[#2D3548] focus:border-[#60A5FA] focus:outline-none"
                required
              />
            </div>

            {/* Risk % */}
            <div>
              <label className="block text-[#A0AEC0] text-sm mb-2">Risk %</label>
              <input
                type="number"
                step="0.1"
                name="riskPercent"
                value={formData.riskPercent}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#1A1F2E] text-white rounded-lg border border-[#2D3548] focus:border-[#60A5FA] focus:outline-none"
              />
            </div>

            {/* Setup */}
            <div className="col-span-2">
              <label className="block text-[#A0AEC0] text-sm mb-2">Setup / Strategy</label>
              <input
                type="text"
                name="setup"
                value={formData.setup}
                onChange={handleChange}
                placeholder="Breakout, Reversal, Trend Follow..."
                className="w-full px-4 py-3 bg-[#1A1F2E] text-white rounded-lg border border-[#2D3548] focus:border-[#60A5FA] focus:outline-none"
              />
            </div>

            {/* Notes */}
            <div className="col-span-2">
              <label className="block text-[#A0AEC0] text-sm mb-2">Notes / Confluences</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="4"
                placeholder="Describe your trade setup, confluences (FVG, Order Block, SMT...), emotions, etc."
                className="w-full px-4 py-3 bg-[#1A1F2E] text-white rounded-lg border border-[#2D3548] focus:border-[#60A5FA] focus:outline-none"
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-900 bg-opacity-20 border border-[#3B82F6] rounded-lg p-4 mt-6">
            <h4 className="text-[#93C5FD] font-bold mb-2">🤖 Auto-Recalculation</h4>
            <p className="text-[#CBD5E0] text-sm">When you save, the system will automatically:</p>
            <ul className="text-[#A0AEC0] text-sm mt-2 space-y-1">
              <li>✓ Recalculate TP%, SL%, and RR</li>
              <li>✓ Re-detect market type and confluences</li>
              <li>✓ Re-analyze psychology from notes</li>
              <li>✓ Update all statistics</li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="flex space-x-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-[#252D42] text-white rounded-lg hover:bg-[#2D3548] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-[#3B82F6] text-white rounded-lg hover:bg-[#2563EB] transition font-bold"
            >
              💾 Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditTradeModal;