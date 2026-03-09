import React, { useState } from 'react';
import { useTradingContext } from '../context/TradingContext';

function AddTradeModal({ isOpen, onClose }) {
  const { addTrade } = useTradingContext();
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '09:30',
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newTrade = {
      ...formData,
      entry: parseFloat(formData.entry),
      exit: parseFloat(formData.exit),
      stopLoss: parseFloat(formData.stopLoss) || parseFloat(formData.entry) * 0.98,
      shares: parseInt(formData.shares),
      pnl: parseFloat(formData.pnl),
      riskPercent: parseFloat(formData.riskPercent),
    };
    
    addTrade(newTrade);
    
    // Reset form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      time: '09:30',
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
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#0F1419] bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1E2536] rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-[#2D3548]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#2D3548]">
          <div>
            <h2 className="text-2xl font-bold text-white">Add New Trade</h2>
            <p className="text-[#A0AEC0] text-sm mt-1">Manual trade entry - AI will analyze automatically</p>
          </div>
          <button onClick={onClose} className="text-[#A0AEC0] hover:text-white text-2xl">×</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Date */}
            <div>
              <label className="block text-[#A0AEC0] text-sm mb-2">Date *</label>
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
              <label className="block text-[#A0AEC0] text-sm mb-2">Symbol *</label>
              <input
                type="text"
                name="symbol"
                value={formData.symbol}
                onChange={handleChange}
                placeholder="EURUSD, BTCUSD, AAPL..."
                className="w-full px-4 py-3 bg-[#1A1F2E] text-white rounded-lg border border-[#2D3548] focus:border-[#60A5FA] focus:outline-none"
                required
              />
              <p className="text-[#718096] text-xs mt-1">Market type will be auto-detected</p>
            </div>

            {/* Type */}
            <div>
              <label className="block text-[#A0AEC0] text-sm mb-2">Type *</label>
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
              <label className="block text-[#A0AEC0] text-sm mb-2">Entry Price *</label>
              <input
                type="number"
                step="0.00001"
                name="entry"
                value={formData.entry}
                onChange={handleChange}
                placeholder="1.0850"
                className="w-full px-4 py-3 bg-[#1A1F2E] text-white rounded-lg border border-[#2D3548] focus:border-[#60A5FA] focus:outline-none"
                required
              />
            </div>

            {/* Exit */}
            <div>
              <label className="block text-[#A0AEC0] text-sm mb-2">Exit Price *</label>
              <input
                type="number"
                step="0.00001"
                name="exit"
                value={formData.exit}
                onChange={handleChange}
                placeholder="1.0920"
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
                placeholder="1.0820 (optional)"
                className="w-full px-4 py-3 bg-[#1A1F2E] text-white rounded-lg border border-[#2D3548] focus:border-[#60A5FA] focus:outline-none"
              />
            </div>

            {/* Shares */}
            <div>
              <label className="block text-[#A0AEC0] text-sm mb-2">Shares / Lots *</label>
              <input
                type="number"
                name="shares"
                value={formData.shares}
                onChange={handleChange}
                placeholder="100"
                className="w-full px-4 py-3 bg-[#1A1F2E] text-white rounded-lg border border-[#2D3548] focus:border-[#60A5FA] focus:outline-none"
                required
              />
            </div>

            {/* P&L */}
            <div>
              <label className="block text-[#A0AEC0] text-sm mb-2">P&L ($) *</label>
              <input
                type="number"
                step="0.01"
                name="pnl"
                value={formData.pnl}
                onChange={handleChange}
                placeholder="380"
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
                placeholder="1"
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
                placeholder="Describe confluences (FVG, Order Block, SMT, CISD...), emotions (FOMO, disciplined...), market context..."
                className="w-full px-4 py-3 bg-[#1A1F2E] text-white rounded-lg border border-[#2D3548] focus:border-[#60A5FA] focus:outline-none"
              />
              <p className="text-[#718096] text-xs mt-1">💡 Include keywords like: FVG, Order Block, SMT, CISD, FOMO, disciplined, revenge trading...</p>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-900 bg-opacity-20 border border-[#3B82F6] rounded-lg p-4 mt-6">
            <h4 className="text-[#93C5FD] font-bold mb-2">🤖 AI Analysis</h4>
            <p className="text-[#CBD5E0] text-sm mb-2">When you add this trade, AI will automatically:</p>
            <ul className="text-[#A0AEC0] text-sm space-y-1">
              <li>✓ Detect market type (Forex/Crypto/Indices/Stocks)</li>
              <li>✓ Calculate TP%, SL%, RR, and pips (if Forex)</li>
              <li>✓ Identify confluences from your notes</li>
              <li>✓ Analyze psychology (FOMO, discipline, revenge trading)</li>
              <li>✓ Update all statistics in real-time</li>
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
              ➕ Add Trade
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddTradeModal;