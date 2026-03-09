import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import toast from 'react-hot-toast';

function ColumnManager({ isOpen, onClose, columns, onApply }) {
  const [localColumns, setLocalColumns] = useState([...columns]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(localColumns);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setLocalColumns(items);
  };

  const toggleColumnVisibility = (columnKey) => {
    setLocalColumns(prev =>
      prev.map(col =>
        col.key === columnKey ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const handleSelectAll = () => {
    setLocalColumns(prev => prev.map(col => ({ ...col, visible: true })));
    toast.success('All columns selected');
  };

  const handleDeselectAll = () => {
    setLocalColumns(prev => prev.map(col => ({ ...col, visible: false })));
    toast.success('All columns hidden');
  };

  const handleReset = () => {
    const defaultColumns = [
      { key: 'select', label: '☑️ Select', visible: true, locked: true },
      { key: 'date', label: '📅 Date', visible: true, sortable: true },
      { key: 'symbol', label: '💱 Symbol', visible: true, sortable: false },
      { key: 'type', label: '📊 Type', visible: true, sortable: false },
      { key: 'session', label: '🌐 Session', visible: true, sortable: false },
      { key: 'bias', label: '📈 Bias', visible: true, sortable: false },
      { key: 'news', label: '📰 News', visible: true, sortable: false },
      { key: 'entry', label: '🔵 Entry', visible: true, sortable: false },
      { key: 'exit', label: '🔴 Exit', visible: true, sortable: false },
      { key: 'tpPercent', label: '🎯 TP %', visible: true, sortable: true },
      { key: 'rr', label: '⚡ RR', visible: true, sortable: true },
      { key: 'setup', label: '⚙️ Setup', visible: true, sortable: false },
      { key: 'psychology', label: '🧠 Psychology', visible: true, sortable: true },
      { key: 'pnl', label: '💰 P&L', visible: true, sortable: true },
    ];
    setLocalColumns(defaultColumns);
    toast.success('Column order reset to default! 🔄');
  };

  const handleApply = () => {
    const visibleCount = localColumns.filter(col => col.visible && !col.locked).length;
    if (visibleCount === 0) {
      toast.error('Please show at least one column');
      return;
    }

    onApply(localColumns);
    toast.success('Column preferences saved! ✅');
    onClose();
  };

  const visibleCount = localColumns.filter(col => col.visible).length;

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
            className="bg-[#1E2536] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border-2 border-[#2D3548] shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-cyan-600 to-blue-600 p-6 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-4xl">🎨</span>
                  <div>
                    <h3 className="text-2xl font-black text-white">Customize Columns</h3>
                    <p className="text-cyan-100 text-sm">Drag to reorder • Toggle visibility • Save preferences</p>
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
              {/* Quick Actions */}
              <div className="flex items-center justify-between">
                <div className="text-white font-bold text-lg">
                  {visibleCount} / {localColumns.length} columns visible
                </div>
                <div className="flex space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSelectAll}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-[#047857] transition"
                  >
                    👁️ Show All
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDeselectAll}
                    className="px-4 py-2 bg-[#252D42] text-white rounded-lg font-bold text-sm hover:bg-[#2D3548] transition"
                  >
                    🙈 Hide All
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleReset}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg font-bold text-sm hover:bg-orange-700 transition"
                  >
                    🔄 Reset
                  </motion.button>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-900 bg-opacity-20 rounded-xl p-4 border-2 border-[#3B82F6]">
                <div className="flex items-start space-x-3">
                  <span className="text-3xl">💡</span>
                  <div>
                    <div className="text-[#93C5FD] font-bold mb-2">How to use:</div>
                    <ul className="text-[#CBD5E0] text-sm space-y-1">
                      <li>• <strong>Drag</strong> rows to reorder columns</li>
                      <li>• <strong>Toggle</strong> visibility with checkbox</li>
                      <li>• <strong>Locked columns</strong> (like Select) cannot be hidden or moved</li>
                      <li>• Your preferences are saved automatically</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Drag & Drop List */}
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="columns">
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`space-y-2 transition-all ${
                        snapshot.isDraggingOver ? 'bg-blue-900 bg-opacity-10 rounded-xl p-2' : ''
                      }`}
                    >
                      {localColumns.map((column, index) => (
                        <Draggable
                          key={column.key}
                          draggableId={column.key}
                          index={index}
                          isDragDisabled={column.locked}
                        >
                          {(provided, snapshot) => (
                            <motion.div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.02 }}
                              className={`bg-[#1A1F2E] rounded-xl p-4 border-2 transition-all ${
                                snapshot.isDragging
                                  ? 'border-cyan-500 shadow-2xl scale-105 rotate-2'
                                  : column.visible
                                  ? 'border-cyan-600'
                                  : 'border-[#2D3548]'
                              } ${column.locked ? 'opacity-75' : 'cursor-move hover:border-cyan-500'}`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4 flex-1">
                                  {/* Drag Handle */}
                                  {!column.locked && (
                                    <motion.div
                                      whileHover={{ scale: 1.2 }}
                                      className="text-[#718096] text-2xl cursor-move"
                                    >
                                      ⋮⋮
                                    </motion.div>
                                  )}

                                  {/* Checkbox */}
                                  <label className="flex items-center space-x-3 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={column.visible}
                                      onChange={() => !column.locked && toggleColumnVisibility(column.key)}
                                      disabled={column.locked}
                                      className="w-6 h-6 rounded border-[#374357] bg-[#252D42] text-cyan-600 focus:ring-cyan-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                    <span className={`font-bold text-lg ${column.visible ? 'text-white' : 'text-[#718096]'}`}>
                                      {column.label}
                                    </span>
                                  </label>

                                  {/* Badges */}
                                  <div className="flex items-center space-x-2">
                                    {column.sortable && (
                                      <span className="px-2 py-1 bg-[#7C3AED] bg-opacity-30 text-[#A78BFA] rounded text-xs font-bold border border-[#7C3AED]">
                                        Sortable
                                      </span>
                                    )}
                                    {column.locked && (
                                      <span className="px-2 py-1 bg-[#DC2626] bg-opacity-30 text-[#F87171] rounded text-xs font-bold border border-[#DC2626]">
                                        🔒 Locked
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Position Indicator */}
                                <div className="text-[#718096] font-mono text-sm">
                                  #{index + 1}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              {/* Preview */}
              <div className="bg-cyan-900 bg-opacity-20 rounded-xl p-4 border-2 border-cyan-600">
                <div className="text-cyan-400 font-bold mb-3">📋 Column Order Preview</div>
                <div className="flex flex-wrap gap-2">
                  {localColumns
                    .filter(col => col.visible)
                    .map((col, index) => (
                      <motion.div
                        key={col.key}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="px-3 py-2 bg-cyan-600 bg-opacity-30 text-cyan-300 rounded-lg text-sm font-bold border border-cyan-600"
                      >
                        {index + 1}. {col.label}
                      </motion.div>
                    ))}
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
                className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-black shadow-xl"
              >
                💾 Save Column Preferences
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ColumnManager;