import React, { useState } from 'react';

function AllTrades() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Données de démonstration
  const tradesData = [
    { id: 1, symbol: 'AAPL', type: 'Long', entry: 178.50, exit: 182.30, shares: 100, pnl: 380, date: '2024-02-10', setup: 'Breakout', win: true },
    { id: 2, symbol: 'TSLA', type: 'Short', entry: 195.20, exit: 189.40, shares: 50, pnl: 290, date: '2024-02-09', setup: 'Reversal', win: true },
    { id: 3, symbol: 'NVDA', type: 'Long', entry: 722.48, exit: 718.32, shares: 20, pnl: -83.20, date: '2024-02-09', setup: 'Trend Follow', win: false },
    { id: 4, symbol: 'MSFT', type: 'Long', entry: 405.70, exit: 411.25, shares: 75, pnl: 416.25, date: '2024-02-08', setup: 'Support Bounce', win: true },
    { id: 5, symbol: 'AMD', type: 'Long', entry: 181.90, exit: 185.60, shares: 60, pnl: 222, date: '2024-02-08', setup: 'Breakout', win: true },
    { id: 6, symbol: 'GOOGL', type: 'Short', entry: 142.15, exit: 145.80, shares: 80, pnl: -292, date: '2024-02-07', setup: 'Failed Setup', win: false },
    { id: 7, symbol: 'META', type: 'Long', entry: 474.20, exit: 482.90, shares: 30, pnl: 261, date: '2024-02-07', setup: 'Earnings Play', win: true },
    { id: 8, symbol: 'AMZN', type: 'Long', entry: 175.35, exit: 178.22, shares: 100, pnl: 287, date: '2024-02-06', setup: 'Gap Fill', win: true },
  ];

  const totalPnL = tradesData.reduce((sum, trade) => sum + trade.pnl, 0);
  const winningTrades = tradesData.filter(t => t.win).length;
  const winRate = ((winningTrades / tradesData.length) * 100).toFixed(1);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">All Trades</h1>
          <p className="text-gray-400">Manage and analyze all your trading activity</p>
        </div>
        
        <div className="flex space-x-3">
          <button className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition border border-gray-700">
            📤 Import CSV
          </button>
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold">
            ➕ Add Trade
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div className="text-gray-400 text-sm mb-1">Total Trades</div>
          <div className="text-2xl font-bold text-white">{tradesData.length}</div>
        </div>
        
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div className="text-gray-400 text-sm mb-1">Win Rate</div>
          <div className="text-2xl font-bold text-white">{winRate}%</div>
        </div>
        
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div className="text-gray-400 text-sm mb-1">Total P&L</div>
          <div className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="🔍 Search by symbol, setup, or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
            />
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-3 bg-gray-900 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All Trades</option>
            <option value="wins">Wins Only</option>
            <option value="losses">Losses Only</option>
            <option value="long">Long Positions</option>
            <option value="short">Short Positions</option>
          </select>
          
          <button className="px-6 py-3 bg-gray-900 text-white rounded-lg border border-gray-700 hover:bg-gray-700 transition">
            🎯 Advanced Filters
          </button>
        </div>
      </div>

      {/* Trades Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Symbol</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Entry</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Exit</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Shares</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Setup</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">P&L</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {tradesData.map((trade) => (
                <tr key={trade.id} className="hover:bg-gray-700 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {trade.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-white text-xs font-bold">{trade.symbol.substring(0, 2)}</span>
                      </div>
                      <span className="text-white font-medium">{trade.symbol}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      trade.type === 'Long' 
                        ? 'bg-green-500 bg-opacity-20 text-green-500' 
                        : 'bg-red-500 bg-opacity-20 text-red-500'
                    }`}>
                      {trade.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    ${trade.entry.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    ${trade.exit.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {trade.shares}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 bg-purple-500 bg-opacity-20 text-purple-400 rounded-full text-xs font-medium">
                      {trade.setup}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`font-bold ${trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-blue-500 hover:text-blue-400 mr-3">Edit</button>
                    <button className="text-red-500 hover:text-red-400">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AllTrades;