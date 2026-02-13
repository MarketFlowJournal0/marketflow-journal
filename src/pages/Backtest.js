import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function Backtest() {
  const [isRunning, setIsRunning] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Données de backtest (exemple)
  const backtestResults = [
    { date: 'Jan 1', equity: 10000 },
    { date: 'Jan 5', equity: 10250 },
    { date: 'Jan 10', equity: 10180 },
    { date: 'Jan 15', equity: 10450 },
    { date: 'Jan 20', equity: 10620 },
    { date: 'Jan 25', equity: 10890 },
    { date: 'Jan 30', equity: 11100 },
    { date: 'Feb 5', equity: 11350 },
    { date: 'Feb 10', equity: 11520 },
    { date: 'Feb 15', equity: 11780 },
    { date: 'Feb 20', equity: 12100 },
    { date: 'Feb 25', equity: 12450 },
  ];

  const handleRunBacktest = () => {
    setIsRunning(true);
    // Simulation du temps de calcul
    setTimeout(() => {
      setIsRunning(false);
      setShowResults(true);
    }, 2000);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Strategy Backtesting</h1>
        <p className="text-gray-400">Test your trading strategies on historical data</p>
      </div>

      {/* Backtest Configuration */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Left Column - Strategy Setup */}
        <div className="col-span-2 bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-6">Strategy Configuration</h2>
          
          <div className="grid grid-cols-2 gap-6">
            {/* Strategy Type */}
            <div>
              <label className="block text-gray-400 text-sm mb-2">Strategy Type</label>
              <select className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none">
                <option>Breakout Strategy</option>
                <option>Mean Reversion</option>
                <option>Trend Following</option>
                <option>Support/Resistance</option>
                <option>Custom Strategy</option>
              </select>
            </div>

            {/* Timeframe */}
            <div>
              <label className="block text-gray-400 text-sm mb-2">Timeframe</label>
              <select className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none">
                <option>1 minute</option>
                <option>5 minutes</option>
                <option>15 minutes</option>
                <option>1 hour</option>
                <option>4 hours</option>
                <option>Daily</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-gray-400 text-sm mb-2">Start Date</label>
              <input 
                type="date" 
                defaultValue="2024-01-01"
                className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">End Date</label>
              <input 
                type="date" 
                defaultValue="2024-02-29"
                className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Initial Capital */}
            <div>
              <label className="block text-gray-400 text-sm mb-2">Initial Capital</label>
              <input 
                type="number" 
                defaultValue="10000"
                className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Position Size */}
            <div>
              <label className="block text-gray-400 text-sm mb-2">Position Size (%)</label>
              <input 
                type="number" 
                defaultValue="10"
                className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Stop Loss */}
            <div>
              <label className="block text-gray-400 text-sm mb-2">Stop Loss (%)</label>
              <input 
                type="number" 
                defaultValue="2"
                step="0.1"
                className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Take Profit */}
            <div>
              <label className="block text-gray-400 text-sm mb-2">Take Profit (%)</label>
              <input 
                type="number" 
                defaultValue="4"
                step="0.1"
                className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Run Button */}
          <button
            onClick={handleRunBacktest}
            disabled={isRunning}
            className={`w-full mt-6 px-6 py-4 rounded-lg font-semibold text-lg transition ${
              isRunning
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isRunning ? '⏳ Running Backtest...' : '▶️ Run Backtest'}
          </button>
        </div>

        {/* Right Column - Quick Stats */}
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">Saved Strategies</h3>
            <div className="space-y-3">
              <div className="p-3 bg-gray-900 rounded-lg hover:bg-gray-700 cursor-pointer transition">
                <div className="text-white font-medium">Breakout Pro</div>
                <div className="text-gray-400 text-sm">Win Rate: 72%</div>
              </div>
              <div className="p-3 bg-gray-900 rounded-lg hover:bg-gray-700 cursor-pointer transition">
                <div className="text-white font-medium">Reversal Master</div>
                <div className="text-gray-400 text-sm">Win Rate: 65%</div>
              </div>
              <div className="p-3 bg-gray-900 rounded-lg hover:bg-gray-700 cursor-pointer transition">
                <div className="text-white font-medium">Trend Rider</div>
                <div className="text-gray-400 text-sm">Win Rate: 68%</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-6 text-white">
            <div className="text-lg font-bold mb-2">💡 Pro Tip</div>
            <p className="text-sm opacity-90">
              Test multiple strategies on the same data to find what works best for your trading style.
            </p>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {showResults && (
        <div className="space-y-6">
          {/* Performance Metrics */}
          <div className="grid grid-cols-4 gap-6">
            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
              <div className="text-gray-400 text-sm mb-1">Net Profit</div>
              <div className="text-2xl font-bold text-green-500">+$2,450</div>
              <div className="text-green-500 text-sm mt-2">+24.5% ROI</div>
            </div>

            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
              <div className="text-gray-400 text-sm mb-1">Win Rate</div>
              <div className="text-2xl font-bold text-white">68.5%</div>
              <div className="text-gray-400 text-sm mt-2">137/200 trades</div>
            </div>

            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
              <div className="text-gray-400 text-sm mb-1">Profit Factor</div>
              <div className="text-2xl font-bold text-white">2.15</div>
              <div className="text-blue-500 text-sm mt-2">Strong strategy</div>
            </div>

            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
              <div className="text-gray-400 text-sm mb-1">Max Drawdown</div>
              <div className="text-2xl font-bold text-red-500">-8.3%</div>
              <div className="text-gray-400 text-sm mt-2">Acceptable risk</div>
            </div>
          </div>

          {/* Equity Curve */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Equity Curve</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={backtestResults}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="equity" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  name="Account Equity" 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed Stats */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">Trade Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Trades:</span>
                  <span className="text-white font-bold">200</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Winning Trades:</span>
                  <span className="text-green-500 font-bold">137</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Losing Trades:</span>
                  <span className="text-red-500 font-bold">63</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg Win:</span>
                  <span className="text-green-500 font-bold">+$285</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg Loss:</span>
                  <span className="text-red-500 font-bold">-$132</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Largest Win:</span>
                  <span className="text-green-500 font-bold">+$890</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Largest Loss:</span>
                  <span className="text-red-500 font-bold">-$310</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">Risk Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Sharpe Ratio:</span>
                  <span className="text-white font-bold">1.85</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Sortino Ratio:</span>
                  <span className="text-white font-bold">2.43</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Calmar Ratio:</span>
                  <span className="text-white font-bold">2.95</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Win/Loss Ratio:</span>
                  <span className="text-white font-bold">2.16</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Expectancy:</span>
                  <span className="text-green-500 font-bold">+$12.25</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Recovery Factor:</span>
                  <span className="text-white font-bold">2.95</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Max Consecutive Wins:</span>
                  <span className="text-green-500 font-bold">9</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Backtest;