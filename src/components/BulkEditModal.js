import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

function BulkEditModal({ isOpen, onClose, selectedTrades, onApplyBulkEdit, confluences }) {
  const [editMode, setEditMode] = useState('overwrite'); // overwrite or append
  const [fieldsToEdit, setFieldsToEdit] = useState({
    type: { enabled: false, value: '' },
    marketType: { enabled: false, value: '' },
    session: { enabled: false, value: '' },
    bias: { enabled: false, value: '' },
    newsImpact: { enabled: false, value: '' },
    setup: { enabled: false, value: '' },
    confluences: { enabled: false, value: [] },
    riskPercent: { enabled: false, value: '' },
    notes: { enabled: false, value: '' },
  });

  const handleToggleField = (field) => {
    setFieldsToEdit(prev => ({
      ...prev,
      [field]: { ...prev[field], enabled: !prev[field].enabled }
    }));
  };

  const handleFieldValueChange = (field, value) => {
    setFieldsToEdit(prev => ({
      ...prev,
      [field]: { ...prev[field], value }
    }));
  };

  const toggleConfluence = (confId) => {
    setFieldsToEdit(prev => ({
      ...prev,
      confluences: {
        ...prev.confluences,
        value: prev.confluences.value.includes(confId)
          ? prev.confluences.value.filter(c => c !== confId)
          : [...prev.confluences.value, confId]
      }
    }));
  };

  const handleApply = () => {
    const enabledFields = Object.entries(fieldsToEdit)
      .filter(([_, field]) => field.enabled)
      .reduce((acc, [key, field]) => {
        acc[key] = field.value;
        return acc;
      }, {});

    if (Object.keys(enabledFields).length === 0) {
      toast.error('Please select at least one field to edit');
      return;
    }

    onApplyBulkEdit(enabledFields, editMode);
    onClose();
  };

  const handleSelectAll = () => {
    setFieldsToEdit({
      type: { enabled: true, value: fieldsToEdit.type.value },
      marketType: { enabled: true, value: fieldsToEdit.marketType.value },
      session: { enabled: true, value: fieldsToEdit.session.value },
      bias: { enabled: true, value: fieldsToEdit.bias.value },
      newsImpact: { enabled: true, value: fieldsToEdit.newsImpact.value },
      setup: { enabled: true, value: fieldsToEdit.setup.value },
      confluences: { enabled: true, value: fieldsToEdit.confluences.value },
      riskPercent: { enabled: true, value: fieldsToEdit.riskPercent.value },
      notes: { enabled: true, value: fieldsToEdit.notes.value },
    });
    toast.success('All fields selected for editing');
  };

  const handleDeselectAll = () => {
    setFieldsToEdit({
      type: { enabled: false, value: '' },
      marketType: { enabled: false, value: '' },
      session: { enabled: false, value: '' },
      bias: { enabled: false, value: '' },
      newsImpact: { enabled: false, value: '' },
      setup: { enabled: false, value: '' },
      confluences: { enabled: false, value: [] },
      riskPercent: { enabled: false, value: '' },
      notes: { enabled: false, value: '' },
    });
    toast.success('All fields deselected');
  };

  const enabledFieldsCount = Object.values(fieldsToEdit).filter(f => f.enabled).length;

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
            <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-red-600 p-6 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-4xl">✏️</span>
                  <div>
                    <h3 className="text-2xl font-black text-white">Bulk Edit</h3>
                    <p className="text-orange-100 text-sm">
                      Editing {selectedTrades.length} selected trade{selectedTrades.length !== 1 ? 's' : ''}
                    </p>
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
              {/* Edit Mode Selection */}
              <div className="bg-[#1A1F2E] rounded-xl p-5 border-2 border-[#2D3548]">
                <label className="block text-white font-bold mb-3 text-lg">Edit Mode</label>
                <div className="grid grid-cols-2 gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setEditMode('overwrite')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      editMode === 'overwrite'
                        ? 'bg-orange-600 border-orange-400 text-white'
                        : 'bg-[#1E2536] border-[#2D3548] text-[#A0AEC0] hover:border-[#374357]'
                    }`}
                  >
                    <div className="text-3xl mb-2">🔄</div>
                    <div className="font-bold text-lg">Overwrite</div>
                    <div className="text-xs opacity-75">Replace existing values</div>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setEditMode('append')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      editMode === 'append'
                        ? 'bg-orange-600 border-orange-400 text-white'
                        : 'bg-[#1E2536] border-[#2D3548] text-[#A0AEC0] hover:border-[#374357]'
                    }`}
                  >
                    <div className="text-3xl mb-2">➕</div>
                    <div className="font-bold text-lg">Append</div>
                    <div className="text-xs opacity-75">Add to existing (notes, confluences)</div>
                  </motion.button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center justify-between">
                <div className="text-white font-bold text-lg">
                  Select Fields to Edit ({enabledFieldsCount}/9)
                </div>
                <div className="flex space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSelectAll}
                    className="px-4 py-2 bg-[#3B82F6] text-white rounded-lg font-bold text-sm hover:bg-[#2563EB] transition"
                  >
                    ✓ Select All
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDeselectAll}
                    className="px-4 py-2 bg-[#252D42] text-white rounded-lg font-bold text-sm hover:bg-[#2D3548] transition"
                  >
                    ✕ Deselect All
                  </motion.button>
                </div>
              </div>

              {/* Fields Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Type */}
                <div className={`bg-[#1A1F2E] rounded-xl p-4 border-2 transition-all ${
                  fieldsToEdit.type.enabled ? 'border-orange-500' : 'border-[#2D3548]'
                }`}>
                  <label className="flex items-center space-x-3 cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      checked={fieldsToEdit.type.enabled}
                      onChange={() => handleToggleField('type')}
                      className="w-5 h-5 rounded border-[#374357] bg-[#252D42] text-orange-600 focus:ring-orange-500 cursor-pointer"
                    />
                    <span className="text-white font-bold">Trade Type</span>
                  </label>
                  {fieldsToEdit.type.enabled && (
                    <motion.select
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      value={fieldsToEdit.type.value}
                      onChange={(e) => handleFieldValueChange('type', e.target.value)}
                      className="w-full px-3 py-2 bg-[#1E2536] text-white rounded-lg border border-[#2D3548] focus:border-orange-500 focus:outline-none"
                    >
                      <option value="">Select Type</option>
                      <option value="Long">Long</option>
                      <option value="Short">Short</option>
                    </motion.select>
                  )}
                </div>

                {/* Market Type */}
                <div className={`bg-[#1A1F2E] rounded-xl p-4 border-2 transition-all ${
                  fieldsToEdit.marketType.enabled ? 'border-orange-500' : 'border-[#2D3548]'
                }`}>
                  <label className="flex items-center space-x-3 cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      checked={fieldsToEdit.marketType.enabled}
                      onChange={() => handleToggleField('marketType')}
                      className="w-5 h-5 rounded border-[#374357] bg-[#252D42] text-orange-600 focus:ring-orange-500 cursor-pointer"
                    />
                    <span className="text-white font-bold">Market Type</span>
                  </label>
                  {fieldsToEdit.marketType.enabled && (
                    <motion.select
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      value={fieldsToEdit.marketType.value}
                      onChange={(e) => handleFieldValueChange('marketType', e.target.value)}
                      className="w-full px-3 py-2 bg-[#1E2536] text-white rounded-lg border border-[#2D3548] focus:border-orange-500 focus:outline-none"
                    >
                      <option value="">Select Market</option>
                      <option value="Forex">Forex</option>
                      <option value="Crypto">Crypto</option>
                      <option value="Stocks">Stocks</option>
                      <option value="Indices">Indices</option>
                    </motion.select>
                  )}
                </div>

                {/* Session */}
                <div className={`bg-[#1A1F2E] rounded-xl p-4 border-2 transition-all ${
                  fieldsToEdit.session.enabled ? 'border-orange-500' : 'border-[#2D3548]'
                }`}>
                  <label className="flex items-center space-x-3 cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      checked={fieldsToEdit.session.enabled}
                      onChange={() => handleToggleField('session')}
                      className="w-5 h-5 rounded border-[#374357] bg-[#252D42] text-orange-600 focus:ring-orange-500 cursor-pointer"
                    />
                    <span className="text-white font-bold">Session</span>
                  </label>
                  {fieldsToEdit.session.enabled && (
                    <motion.select
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      value={fieldsToEdit.session.value}
                      onChange={(e) => handleFieldValueChange('session', e.target.value)}
                      className="w-full px-3 py-2 bg-[#1E2536] text-white rounded-lg border border-[#2D3548] focus:border-orange-500 focus:outline-none"
                    >
                      <option value="">Select Session</option>
                      <option value="London">London</option>
                      <option value="New York">New York</option>
                      <option value="Asian">Asian</option>
                      <option value="Overlap">Overlap</option>
                    </motion.select>
                  )}
                </div>

                {/* Bias */}
                <div className={`bg-[#1A1F2E] rounded-xl p-4 border-2 transition-all ${
                  fieldsToEdit.bias.enabled ? 'border-orange-500' : 'border-[#2D3548]'
                }`}>
                  <label className="flex items-center space-x-3 cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      checked={fieldsToEdit.bias.enabled}
                      onChange={() => handleToggleField('bias')}
                      className="w-5 h-5 rounded border-[#374357] bg-[#252D42] text-orange-600 focus:ring-orange-500 cursor-pointer"
                    />
                    <span className="text-white font-bold">Bias</span>
                  </label>
                  {fieldsToEdit.bias.enabled && (
                    <motion.select
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      value={fieldsToEdit.bias.value}
                      onChange={(e) => handleFieldValueChange('bias', e.target.value)}
                      className="w-full px-3 py-2 bg-[#1E2536] text-white rounded-lg border border-[#2D3548] focus:border-orange-500 focus:outline-none"
                    >
                      <option value="">Select Bias</option>
                      <option value="Bullish">Bullish</option>
                      <option value="Bearish">Bearish</option>
                      <option value="Neutral">Neutral</option>
                    </motion.select>
                  )}
                </div>

                {/* News Impact */}
                <div className={`bg-[#1A1F2E] rounded-xl p-4 border-2 transition-all ${
                  fieldsToEdit.newsImpact.enabled ? 'border-orange-500' : 'border-[#2D3548]'
                }`}>
                  <label className="flex items-center space-x-3 cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      checked={fieldsToEdit.newsImpact.enabled}
                      onChange={() => handleToggleField('newsImpact')}
                      className="w-5 h-5 rounded border-[#374357] bg-[#252D42] text-orange-600 focus:ring-orange-500 cursor-pointer"
                    />
                    <span className="text-white font-bold">News Impact</span>
                  </label>
                  {fieldsToEdit.newsImpact.enabled && (
                    <motion.select
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      value={fieldsToEdit.newsImpact.value}
                      onChange={(e) => handleFieldValueChange('newsImpact', e.target.value)}
                      className="w-full px-3 py-2 bg-[#1E2536] text-white rounded-lg border border-[#2D3548] focus:border-orange-500 focus:outline-none"
                    >
                      <option value="">Select Impact</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </motion.select>
                  )}
                </div>

                {/* Setup */}
                <div className={`bg-[#1A1F2E] rounded-xl p-4 border-2 transition-all ${
                  fieldsToEdit.setup.enabled ? 'border-orange-500' : 'border-[#2D3548]'
                }`}>
                  <label className="flex items-center space-x-3 cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      checked={fieldsToEdit.setup.enabled}
                      onChange={() => handleToggleField('setup')}
                      className="w-5 h-5 rounded border-[#374357] bg-[#252D42] text-orange-600 focus:ring-orange-500 cursor-pointer"
                    />
                    <span className="text-white font-bold">Setup / Strategy</span>
                  </label>
                  {fieldsToEdit.setup.enabled && (
                    <motion.input
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      type="text"
                      value={fieldsToEdit.setup.value}
                      onChange={(e) => handleFieldValueChange('setup', e.target.value)}
                      placeholder="e.g., Breakout, FVG..."
                      className="w-full px-3 py-2 bg-[#1E2536] text-white rounded-lg border border-[#2D3548] focus:border-orange-500 focus:outline-none"
                    />
                  )}
                </div>

                {/* Risk % */}
                <div className={`bg-[#1A1F2E] rounded-xl p-4 border-2 transition-all ${
                  fieldsToEdit.riskPercent.enabled ? 'border-orange-500' : 'border-[#2D3548]'
                }`}>
                  <label className="flex items-center space-x-3 cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      checked={fieldsToEdit.riskPercent.enabled}
                      onChange={() => handleToggleField('riskPercent')}
                      className="w-5 h-5 rounded border-[#374357] bg-[#252D42] text-orange-600 focus:ring-orange-500 cursor-pointer"
                    />
                    <span className="text-white font-bold">Risk %</span>
                  </label>
                  {fieldsToEdit.riskPercent.enabled && (
                    <motion.input
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      type="number"
                      step="0.1"
                      value={fieldsToEdit.riskPercent.value}
                      onChange={(e) => handleFieldValueChange('riskPercent', e.target.value)}
                      placeholder="e.g., 1, 2"
                      className="w-full px-3 py-2 bg-[#1E2536] text-white rounded-lg border border-[#2D3548] focus:border-orange-500 focus:outline-none"
                    />
                  )}
                </div>
              </div>

              {/* Confluences */}
              <div className={`bg-[#1A1F2E] rounded-xl p-4 border-2 transition-all ${
                fieldsToEdit.confluences.enabled ? 'border-orange-500' : 'border-[#2D3548]'
              }`}>
                <label className="flex items-center space-x-3 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={fieldsToEdit.confluences.enabled}
                    onChange={() => handleToggleField('confluences')}
                    className="w-5 h-5 rounded border-[#374357] bg-[#252D42] text-orange-600 focus:ring-orange-500 cursor-pointer"
                  />
                  <span className="text-white font-bold">Confluences</span>
                </label>
                {fieldsToEdit.confluences.enabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex flex-wrap gap-2"
                  >
                    {confluences.map((conf) => (
                      <motion.button
                        key={conf.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleConfluence(conf.id)}
                        className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                          fieldsToEdit.confluences.value.includes(conf.id)
                            ? 'bg-orange-600 text-white border-2 border-orange-400'
                            : 'bg-[#1E2536] text-[#A0AEC0] border-2 border-[#2D3548] hover:border-[#374357]'
                        }`}
                      >
                        {conf.name}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Notes */}
              <div className={`bg-[#1A1F2E] rounded-xl p-4 border-2 transition-all ${
                fieldsToEdit.notes.enabled ? 'border-orange-500' : 'border-[#2D3548]'
              }`}>
                <label className="flex items-center space-x-3 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={fieldsToEdit.notes.enabled}
                    onChange={() => handleToggleField('notes')}
                    className="w-5 h-5 rounded border-[#374357] bg-[#252D42] text-orange-600 focus:ring-orange-500 cursor-pointer"
                  />
                  <span className="text-white font-bold">Notes</span>
                </label>
                {fieldsToEdit.notes.enabled && (
                  <motion.textarea
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    value={fieldsToEdit.notes.value}
                    onChange={(e) => handleFieldValueChange('notes', e.target.value)}
                    rows="3"
                    placeholder={editMode === 'append' ? 'Text to append to existing notes...' : 'New notes (will replace existing)...'}
                    className="w-full px-3 py-2 bg-[#1E2536] text-white rounded-lg border border-[#2D3548] focus:border-orange-500 focus:outline-none"
                  />
                )}
              </div>

              {/* Preview */}
              <div className="bg-blue-900 bg-opacity-20 rounded-xl p-4 border-2 border-[#3B82F6]">
                <div className="text-[#93C5FD] font-bold mb-2">📋 Preview Changes</div>
                <div className="text-white text-sm space-y-1">
                  <div>• Editing {selectedTrades.length} trade{selectedTrades.length !== 1 ? 's' : ''}</div>
                  <div>• Mode: {editMode === 'overwrite' ? 'Overwrite' : 'Append'}</div>
                  <div>• Fields to update: {enabledFieldsCount}</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-[#1A1F2E] p-6 rounded-b-2xl flex items-center justify-between border-t-2 border-[#2D3548]">
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
                disabled={enabledFieldsCount === 0}
                className="px-8 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-black shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✏️ Apply Changes to {selectedTrades.length} Trade{selectedTrades.length !== 1 ? 's' : ''}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default BulkEditModal;