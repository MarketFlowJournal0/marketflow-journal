import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function AdvancedFilters({ isOpen, onClose, onApply, confluences }) {
  const [filters, setFilters] = useState({
    type: 'all',
    marketType: 'all',
    session: 'all',
    bias: 'all',
    newsImpact: 'all',
    setup: '',
    confluences: [],
    minPnL: '',
    maxPnL: '',
    minRR: '',
    maxRR: '',
    minPsychology: '',
    maxPsychology: '',
    dateFrom: '',
    dateTo: '',
    winLoss: 'all',
  });

  const handleChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const toggleConfluence = (confId) => {
    setFilters(prev => ({
      ...prev,
      confluences: prev.confluences.includes(confId)
        ? prev.confluences.filter(c => c !== confId)
        : [...prev.confluences, confId],
    }));
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({
      type: 'all',
      marketType: 'all',
      session: 'all',
      bias: 'all',
      newsImpact: 'all',
      setup: '',
      confluences: [],
      minPnL: '',
      maxPnL: '',
      minRR: '',
      maxRR: '',
      minPsychology: '',
      maxPsychology: '',
      dateFrom: '',
      dateTo: '',
      winLoss: 'all',
    });
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
            initial={{ scale: 0.9, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 50 }}
            transition={{ type: "spring", duration: 0.5 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#1E2536] rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border-2 border-[#2D3548] shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-4xl">🔍</span>
                  <div>
                    <h3 className="text-2xl font-black text-white">Advanced Filters</h3>
                    <p className="text-purple-100 text-sm">Fine-tune your trade analysis</p>
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
              {/* Basic Filters */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-white font-bold mb-2">Trade Type</label>
                  <select
                    value={filters.type}
                    onChange={(e) => handleChange('type', e.target.value)}
                    className="w-full px-4 py-3 bg-[#1A1F2E] text-white rounded-xl border-2 border-[#2D3548] focus:border-purple-500 focus:outline-none transition-all"
                  >
                    <option value="all">All Types</option>
                    <option value="Long">Long Only</option>
                    <option value="Short">Short Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white font-bold mb-2">Market Type</label>
                  <select
                    value={filters.marketType}
                    onChange={(e) => handleChange('marketType', e.target.value)}
                    className="w-full px-4 py-3 bg-[#1A1F2E] text-white rounded-xl border-2 border-[#2D3548] focus:border-purple-500 focus:outline-none transition-all"
                  >
                    <option value="all">All Markets</option>
                    <option value="Forex">Forex</option>
                    <option value="Crypto">Crypto</option>
                    <option value="Stocks">Stocks</option>
                    <option value="Indices">Indices</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white font-bold mb-2">Win/Loss</label>
                  <select
                    value={filters.winLoss}
                    onChange={(e) => handleChange('winLoss', e.target.value)}
                    className="w-full px-4 py-3 bg-[#1A1F2E] text-white rounded-xl border-2 border-[#2D3548] focus:border-purple-500 focus:outline-none transition-all"
                  >
                    <option value="all">All Trades</option>
                    <option value="wins">Wins Only</option>
                    <option value="losses">Losses Only</option>
                  </select>
                </div>
              </div>

              {/* Session & Bias */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-white font-bold mb-2">Session</label>
                  <select
                    value={filters.session}
                    onChange={(e) => handleChange('session', e.target.value)}
                    className="w-full px-4 py-3 bg-[#1A1F2E] text-white rounded-xl border-2 border-[#2D3548] focus:border-purple-500 focus:outline-none transition-all"
                  >
                    <option value="all">All Sessions</option>
                    <option value="London">London</option>
                    <option value="New York">New York</option>
                    <option value="Asian">Asian</option>
                    <option value="Overlap">Overlap</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white font-bold mb-2">Bias</label>
                  <select
                    value={filters.bias}
                    onChange={(e) => handleChange('bias', e.target.value)}
                    className="w-full px-4 py-3 bg-[#1A1F2E] text-white rounded-xl border-2 border-[#2D3548] focus:border-purple-500 focus:outline-none transition-all"
                  >
                    <option value="all">All Bias</option>
                    <option value="Bullish">Bullish</option>
                    <option value="Bearish">Bearish</option>
                    <option value="Neutral">Neutral</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white font-bold mb-2">News Impact</label>
                  <select
                    value={filters.newsImpact}
                    onChange={(e) => handleChange('newsImpact', e.target.value)}
                    className="w-full px-4 py-3 bg-[#1A1F2E] text-white rounded-xl border-2 border-[#2D3548] focus:border-purple-500 focus:outline-none transition-all"
                  >
                    <option value="all">All Impact Levels</option>
                    <option value="High">High Impact</option>
                    <option value="Medium">Medium Impact</option>
                    <option value="Low">Low Impact</option>
                  </select>
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-bold mb-2">Date From</label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleChange('dateFrom', e.target.value)}
                    className="w-full px-4 py-3 bg-[#1A1F2E] text-white rounded-xl border-2 border-[#2D3548] focus:border-purple-500 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-white font-bold mb-2">Date To</label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleChange('dateTo', e.target.value)}
                    className="w-full px-4 py-3 bg-[#1A1F2E] text-white rounded-xl border-2 border-[#2D3548] focus:border-purple-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* P&L Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-bold mb-2">Min P&L ($)</label>
                  <input
                    type="number"
                    value={filters.minPnL}
                    onChange={(e) => handleChange('minPnL', e.target.value)}
                    placeholder="e.g., -100"
                    className="w-full px-4 py-3 bg-[#1A1F2E] text-white rounded-xl border-2 border-[#2D3548] focus:border-purple-500 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-white font-bold mb-2">Max P&L ($)</label>
                  <input
                    type="number"
                    value={filters.maxPnL}
                    onChange={(e) => handleChange('maxPnL', e.target.value)}
                    placeholder="e.g., 500"
                    className="w-full px-4 py-3 bg-[#1A1F2E] text-white rounded-xl border-2 border-[#2D3548] focus:border-purple-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* RR Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-bold mb-2">Min RR</label>
                  <input
                    type="number"
                    step="0.1"
                    value={filters.minRR}
                    onChange={(e) => handleChange('minRR', e.target.value)}
                    placeholder="e.g., 1"
                    className="w-full px-4 py-3 bg-[#1A1F2E] text-white rounded-xl border-2 border-[#2D3548] focus:border-purple-500 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-white font-bold mb-2">Max RR</label>
                  <input
                    type="number"
                    step="0.1"
                    value={filters.maxRR}
                    onChange={(e) => handleChange('maxRR', e.target.value)}
                    placeholder="e.g., 5"
                    className="w-full px-4 py-3 bg-[#1A1F2E] text-white rounded-xl border-2 border-[#2D3548] focus:border-purple-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Psychology Score Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-bold mb-2">Min Psychology Score</label>
                  <input
                    type="number"
                    value={filters.minPsychology}
                    onChange={(e) => handleChange('minPsychology', e.target.value)}
                    placeholder="e.g., 60"
                    max="100"
                    className="w-full px-4 py-3 bg-[#1A1F2E] text-white rounded-xl border-2 border-[#2D3548] focus:border-purple-500 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-white font-bold mb-2">Max Psychology Score</label>
                  <input
                    type="number"
                    value={filters.maxPsychology}
                    onChange={(e) => handleChange('maxPsychology', e.target.value)}
                    placeholder="e.g., 100"
                    max="100"
                    className="w-full px-4 py-3 bg-[#1A1F2E] text-white rounded-xl border-2 border-[#2D3548] focus:border-purple-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Setup */}
              <div>
                <label className="block text-white font-bold mb-2">Setup / Strategy</label>
                <input
                  type="text"
                  value={filters.setup}
                  onChange={(e) => handleChange('setup', e.target.value)}
                  placeholder="e.g., Breakout, Reversal, FVG..."
                  className="w-full px-4 py-3 bg-[#1A1F2E] text-white rounded-xl border-2 border-[#2D3548] focus:border-purple-500 focus:outline-none transition-all"
                />
              </div>

              {/* Confluences */}
              <div>
                <label className="block text-white font-bold mb-3">Confluences</label>
                <div className="flex flex-wrap gap-3">
                  {confluences.map((conf) => (
                    <motion.button
                      key={conf.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleConfluence(conf.id)}
                      className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                        filters.confluences.includes(conf.id)
                          ? 'bg-[#7C3AED] text-white border-2 border-purple-400'
                          : 'bg-[#1A1F2E] text-[#A0AEC0] border-2 border-[#2D3548] hover:border-[#374357]'
                      }`}
                    >
                      {conf.name}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-[#1A1F2E] p-6 rounded-b-2xl flex items-center justify-between border-t-2 border-[#2D3548]">
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-[#252D42] text-white rounded-xl hover:bg-[#2D3548] transition font-bold"
              >
                🔄 Reset All
              </button>
              <div className="flex items-center space-x-4">
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-[#252D42] text-white rounded-xl hover:bg-[#2D3548] transition font-bold"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleApply}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-black shadow-xl"
                >
                  🔍 Apply Filters
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AdvancedFilters;