import React, { useState, useEffect } from 'react';
import { useTradingContext } from '../context/TradingContext';

function TradeDetailsModal({ isOpen, onClose, trade }) {
  const { updateTrade, confluences } = useTradingContext();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [selectedConfluences, setSelectedConfluences] = useState([]);
  const [showConfluenceDropdown, setShowConfluenceDropdown] = useState(false);

  useEffect(() => {
    if (trade) {
      setFormData(trade);
      setSelectedConfluences(trade.confluences || []);
    }
  }, [trade]);

  if (!isOpen || !trade) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    updateTrade(trade.id, {
      ...formData,
      confluences: selectedConfluences,
    });
    setIsEditing(false);
    onClose();
  };

  const addConfluence = (confId) => {
    if (!selectedConfluences.includes(confId)) {
      setSelectedConfluences([...selectedConfluences, confId]);
    }
    setShowConfluenceDropdown(false);
  };

  const removeConfluence = (confId) => {
    setSelectedConfluences(selectedConfluences.filter(c => c !== confId));
  };

  const getConfluenceName = (confId) => {
    const conf = confluences.find(c => c.id === confId);
    return conf ? conf.name : confId;
  };

  return (
    <div className="fixed inset-0 bg-[#0F1419] bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1E2536] rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-[#2D3548]">
        {/* Header */}
        <div className="sticky top-0 bg-[#1E2536] border-b border-[#2D3548] p-6 flex items-center justify-between z-10">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-[#3B82F6] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">{trade.symbol?.substring(0, 2)}</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{trade.symbol}</h2>
              <p className="text-[#A0AEC0] text-sm">{trade.date} • {trade.time}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="px-6 py-2 bg-[#3B82F6] text-white rounded-lg hover:bg-[#2563EB] transition font-semibold"
              >
                ✏️ Edit
              </button>
            ) : (
              <>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2 bg-[#252D42] text-white rounded-lg hover:bg-[#2D3548] transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-[#047857] transition font-semibold"
                >
                  💾 Save
                </button>
              </>
            )}
            <button onClick={onClose} className="text-[#A0AEC0] hover:text-white text-2xl">×</button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="bg-[#1A1F2E] rounded-lg p-4 border border-[#2D3548]">
              <div className="text-[#A0AEC0] text-xs mb-1">Type</div>
              <div className={`text-lg font-bold ${trade.type === 'Long' ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                {trade.type}
              </div>
            </div>
            <div className="bg-[#1A1F2E] rounded-lg p-4 border border-[#2D3548]">
              <div className="text-[#A0AEC0] text-xs mb-1">P&L</div>
              <div className={`text-lg font-bold ${trade.pnl >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                {trade.pnl >= 0 ? '+' : ''}${parseFloat(trade.pnl || 0).toFixed(2)}
              </div>
            </div>
            <div className="bg-[#1A1F2E] rounded-lg p-4 border border-[#2D3548]">
              <div className="text-[#A0AEC0] text-xs mb-1">TP%</div>
              <div className={`text-lg font-bold ${parseFloat(trade.metrics?.tpPercent || 0) >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                {trade.metrics?.tpPercent}%
              </div>
            </div>
            <div className="bg-[#1A1F2E] rounded-lg p-4 border border-[#2D3548]">
              <div className="text-[#A0AEC0] text-xs mb-1">RR</div>
              <div className="text-lg font-bold text-white">1:{trade.metrics?.rrReel}</div>
            </div>
            <div className="bg-[#1A1F2E] rounded-lg p-4 border border-[#2D3548]">
              <div className="text-[#A0AEC0] text-xs mb-1">Psychology</div>
              <div className={`text-lg font-bold ${
                trade.psychologyScore >= 80 ? 'text-[#10B981]' :
                trade.psychologyScore >= 60 ? 'text-[#F59E0B]' : 'text-[#EF4444]'
              }`}>
                {trade.psychologyScore}/100
              </div>
            </div>
          </div>

          {/* Main Details Grid */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Trade Details */}
              <div className="bg-[#1A1F2E] rounded-lg p-5 border border-[#2D3548]">
                <h3 className="text-white font-bold mb-4">Trade Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[#A0AEC0]">Market Type</span>
                    <span className="text-white font-medium">{trade.marketType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A0AEC0]">Session</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      trade.session === 'London' ? 'bg-[#8B5CF6] bg-opacity-20 text-[#A78BFA]' :
                      trade.session === 'New York' ? 'bg-[#60A5FA] bg-opacity-20 text-[#93C5FD]' :
                      trade.session === 'Asian' ? 'bg-[#F59E0B]/20 text-[#FBBF24]' :
                      trade.session === 'Overlap' ? 'bg-[#10B981]/20 text-[#34D399]' :
                      'bg-gray-500 bg-opacity-20 text-[#A0AEC0]'
                    }`}>
                      {trade.session}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A0AEC0]">Bias</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      trade.bias === 'Bullish' ? 'bg-[#10B981]/20 text-[#34D399]' :
                      trade.bias === 'Bearish' ? 'bg-[#EF4444]/20 text-[#F87171]' :
                      'bg-gray-500 bg-opacity-20 text-[#A0AEC0]'
                    }`}>
                      {trade.bias}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A0AEC0]">News Impact</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      trade.newsImpact === 'High' ? 'bg-[#EF4444]/20 text-[#F87171]' :
                      trade.newsImpact === 'Medium' ? 'bg-[#F59E0B]/20 text-[#FBBF24]' :
                      'bg-[#10B981]/20 text-[#34D399]'
                    }`}>
                      {trade.newsImpact}
                    </span>
                  </div>
                </div>
              </div>

              {/* Price Levels */}
              <div className="bg-[#1A1F2E] rounded-lg p-5 border border-[#2D3548]">
                <h3 className="text-white font-bold mb-4">Price Levels</h3>
                <div className="space-y-3">
                  {isEditing ? (
                    <>
                      <div>
                        <label className="text-[#A0AEC0] text-sm">Entry</label>
                        <input
                          type="number"
                          step="0.00001"
                          name="entry"
                          value={formData.entry || ''}
                          onChange={handleChange}
                          className="w-full mt-1 px-3 py-2 bg-[#1E2536] text-white rounded border border-[#2D3548] focus:border-[#60A5FA] focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[#A0AEC0] text-sm">Exit</label>
                        <input
                          type="number"
                          step="0.00001"
                          name="exit"
                          value={formData.exit || ''}
                          onChange={handleChange}
                          className="w-full mt-1 px-3 py-2 bg-[#1E2536] text-white rounded border border-[#2D3548] focus:border-[#60A5FA] focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[#A0AEC0] text-sm">Stop Loss</label>
                        <input
                          type="number"
                          step="0.00001"
                          name="stopLoss"
                          value={formData.stopLoss || ''}
                          onChange={handleChange}
                          className="w-full mt-1 px-3 py-2 bg-[#1E2536] text-white rounded border border-[#2D3548] focus:border-[#60A5FA] focus:outline-none font-mono"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-[#A0AEC0]">Entry</span>
                        <span className="text-white font-mono">{parseFloat(trade.entry).toFixed(5)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#A0AEC0]">Exit</span>
                        <span className="text-white font-mono">{parseFloat(trade.exit).toFixed(5)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#A0AEC0]">Stop Loss</span>
                        <span className="text-white font-mono">{parseFloat(trade.stopLoss).toFixed(5)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Confluences - Style Notion */}
              <div className="bg-[#1A1F2E] rounded-lg p-5 border border-[#2D3548]">
                <h3 className="text-white font-bold mb-4">🎯 Confluences</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedConfluences.map((confId) => (
                    <div
                      key={confId}
                      className="flex items-center space-x-2 px-3 py-1.5 bg-[#60A5FA] bg-opacity-20 text-[#93C5FD] rounded-lg border border-[#3B82F6] group hover:border-blue-400 transition"
                    >
                      <span className="text-sm font-medium">{getConfluenceName(confId)}</span>
                      {isEditing && (
                        <button
                          onClick={() => removeConfluence(confId)}
                          className="text-[#93C5FD] hover:text-[#F87171] transition opacity-0 group-hover:opacity-100"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {isEditing && (
                    <div className="relative">
                      <button
                        onClick={() => setShowConfluenceDropdown(!showConfluenceDropdown)}
                        className="px-3 py-1.5 bg-[#1E2536] text-[#A0AEC0] rounded-lg border border-[#2D3548] hover:border-[#60A5FA] hover:text-[#93C5FD] transition text-sm font-medium"
                      >
                        + Add
                      </button>
                      
                      {showConfluenceDropdown && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-[#1E2536] border border-[#2D3548] rounded-lg shadow-xl z-20 max-h-64 overflow-y-auto">
                          {confluences
                            .filter(conf => !selectedConfluences.includes(conf.id))
                            .map((conf) => (
                              <button
                                key={conf.id}
                                onClick={() => addConfluence(conf.id)}
                                className="w-full text-left px-4 py-2 text-white hover:bg-[#252D42] transition text-sm"
                              >
                                {conf.name}
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {selectedConfluences.length === 0 && (
                  <p className="text-[#718096] text-sm">No confluences detected</p>
                )}
              </div>

              {/* Setup */}
              <div className="bg-[#1A1F2E] rounded-lg p-5 border border-[#2D3548]">
                <h3 className="text-white font-bold mb-4">Setup / Strategy</h3>
                {isEditing ? (
                  <input
                    type="text"
                    name="setup"
                    value={formData.setup || ''}
                    onChange={handleChange}
                    placeholder="e.g., Breakout, Reversal..."
                    className="w-full px-3 py-2 bg-[#1E2536] text-white rounded border border-[#2D3548] focus:border-[#60A5FA] focus:outline-none"
                  />
                ) : (
                  <p className="text-white">{trade.setup || 'No setup specified'}</p>
                )}
              </div>

              {/* Psychology */}
              <div className="bg-[#1A1F2E] rounded-lg p-5 border border-[#2D3548]">
                <h3 className="text-white font-bold mb-4">🧠 Psychology</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {trade.psychology?.emotions.map((emotion, idx) => (
                    <span 
                      key={idx}
                      className={`px-3 py-1 rounded text-xs font-semibold ${
                        emotion === 'Disciplined' ? 'bg-[#10B981]/20 text-[#10B981]' :
                        emotion === 'FOMO' || emotion === 'Revenge Trading' ? 'bg-[#EF4444]/20 text-[#EF4444]' :
                        'bg-[#F59E0B]/20 text-[#F59E0B]'
                      }`}
                    >
                      {emotion}
                    </span>
                  ))}
                </div>
                <div className="text-[#A0AEC0] text-sm">
                  Discipline Score: <span className="text-white font-bold">{trade.disciplineScore}/100</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-[#1A1F2E] rounded-lg p-5 border border-[#2D3548]">
            <h3 className="text-white font-bold mb-4">📝 Notes</h3>
            {isEditing ? (
              <textarea
                name="notes"
                value={formData.notes || ''}
                onChange={handleChange}
                rows="4"
                placeholder="Add your trade notes, observations, lessons learned..."
                className="w-full px-4 py-3 bg-[#1E2536] text-white rounded border border-[#2D3548] focus:border-[#60A5FA] focus:outline-none"
              />
            ) : (
              <p className="text-[#CBD5E0] whitespace-pre-wrap">{trade.notes || 'No notes'}</p>
            )}
          </div>

          {/* Psychology Issues */}
          {trade.psychology?.issues && trade.psychology.issues.length > 0 && (
            <div className="bg-[#7F1D1D]/20 rounded-lg p-5 border border-[#DC2626]">
              <h3 className="text-[#F87171] font-bold mb-3">⚠️ Psychology Issues Detected</h3>
              <ul className="space-y-2">
                {trade.psychology.issues.map((issue, idx) => (
                  <li key={idx} className="text-[#CBD5E0] text-sm">• {issue}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TradeDetailsModal;