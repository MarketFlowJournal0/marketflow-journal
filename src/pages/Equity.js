import React, { useState } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

function Equity() {
  const [timeRange, setTimeRange] = useState('all');

  // Données de l'equity curve
  const equityData = [
    { date: 'Jan 1', equity: 10000, drawdown: 0, benchmark: 10000 },
    { date: 'Jan 5', equity: 10250, drawdown: 0, benchmark: 10050 },
    { date: 'Jan 10', equity: 10180, drawdown: -70, benchmark: 10100 },
    { date: 'Jan 15', equity: 10450, drawdown: 0, benchmark: 10150 },
    { date: 'Jan 20', equity: 10320, drawdown: -130, benchmark: 10200 },
    { date: 'Jan 25', equity: 10890, drawdown: 0, benchmark: 10300 },
    { date: 'Feb 1', equity: 11100, drawdown: 0, benchmark: 10400 },
    { date: 'Feb 5', equity: 10950, drawdown: -150, benchmark: 10450 },
    { date: 'Feb 10', equity: 11350, drawdown: 0, benchmark: 10550 },
    { date: 'Feb 15', equity: 11520, drawdown: 0, benchmark: 10650 },
    { date: 'Feb 20', equity: 11280, drawdown: -240, benchmark: 10750 },
    { date: 'Feb 25', equity: 11780, drawdown: 0, benchmark: 10900 },
    { date: 'Mar 1', equity: 12100, drawdown: 0, benchmark: 11000 },
    { date: 'Mar 5', equity: 12450, drawdown: 0, benchmark: 11100 },
  ];

  // Projections (Monte Carlo simulation simple)
  const projectionData = [
    { month: 'Current', conservative: 12450, realistic: 12450, optimistic: 12450 },
    { month: 'Month 1', conservative: 12650, realistic: 13100, optimistic: 13800 },
    { month: 'Month 2', conservative: 12850, realistic: 13800, optimistic: 15400 },
    { month: 'Month 3', conservative: 13050, realistic: 14550, optimistic: 17200 },
    { month: 'Month 4', conservative: 13250, realistic: 15350, optimistic: 19200 },
    { month: 'Month 5', conservative: 13450, realistic: 16200, optimistic: 21500 },
    { month: 'Month 6', conservative: 13650, realistic: 17100, optimistic: 24000 },
  ];

  const monthlyReturns = [
    { month: 'Jan', return: 11.0, benchmark: 4.0 },
    { month: 'Feb', return: 9.5, benchmark: 5.5 },
    { month: 'Mar', return: 2.6, benchmark: 1.0 },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Equity Curve</h1>
          <p className="text-gray-400">Track your capital growth over time</p>
        </div>
        
        <div className="flex space-x-3">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="3months">Last 3 Months</option>
            <option value="year">Last Year</option>
            <option value="all">All Time</option>
          </select>
          
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold">
            📊 Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div className="text-gray-400 text-sm mb-1">Current Balance</div>
          <div className="text-2xl font-bold text-white">$12,450</div>
          <div className="text-green-500 text-sm mt-2">+24.5% Total Return</div>
        </div>
        
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div className="text-gray-400 text-sm mb-1">Peak Balance</div>
          <div className="text-2xl font-bold text-white">$12,450</div>
          <div className="text-blue-500 text-sm mt-2">All-time high</div>
        </div>
        
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div className="text-gray-400 text-sm mb-1">Max Drawdown</div>
          <div className="text-2xl font-bold text-red-500">-2.08%</div>
          <div className="text-gray-400 text-sm mt-2">(-$240)</div>
        </div>
        
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div className="text-gray-400 text-sm mb-1">Recovery Factor</div>
          <div className="text-2xl font-bold text-white">11.77</div>
          <div className="text-green-500 text-sm mt-2">Excellent</div>
        </div>
      </div>

      {/* Main Equity Curve */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Equity Growth</h3>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-400">Your Equity</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-400">S&P 500 Benchmark</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={equityData}>
            <defs>
              <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorBenchmark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" domain={[9800, 12800]} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#fff' }}
            />
            <Legend />
            <ReferenceLine y={10000} stroke="#6b7280" strokeDasharray="3 3" label="Initial Capital" />
            <Area type="monotone" dataKey="equity" stroke="#10b981" fillOpacity={1} fill="url(#colorEquity)" strokeWidth={3} name="Your Equity" />
            <Area type="monotone" dataKey="benchmark" stroke="#3b82f6" fillOpacity={1} fill="url(#colorBenchmark)" strokeWidth={2} name="Benchmark" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Drawdown Chart */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
        <h3 className="text-xl font-bold text-white mb-4">Drawdown Analysis</h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={equityData}>
            <defs>
              <linearGradient id="colorDrawdown" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#fff' }}
            />
            <Area type="monotone" dataKey="drawdown" stroke="#ef4444" fillOpacity={1} fill="url(#colorDrawdown)" strokeWidth={2} name="Drawdown ($)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Projections & Stats */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Future Projections */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">6-Month Projections</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={projectionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Line type="monotone" dataKey="conservative" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" name="Conservative" />
              <Line type="monotone" dataKey="realistic" stroke="#3b82f6" strokeWidth={3} name="Realistic" />
              <Line type="monotone" dataKey="optimistic" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" name="Optimistic" />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 p-4 bg-blue-900 bg-opacity-20 border border-blue-600 rounded-lg">
            <div className="text-blue-400 text-sm font-semibold mb-1">💡 Projection Methodology</div>
            <p className="text-gray-300 text-xs">Based on your current win rate (68%), average P&L, and risk management. Monte Carlo simulation with 1000 iterations.</p>
          </div>
        </div>

        {/* Monthly Returns */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">Monthly Returns vs Benchmark</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyReturns}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
                formatter={(value) => `${value}%`}
              />
              <Legend />
              <Line type="monotone" dataKey="return" stroke="#10b981" strokeWidth={3} name="Your Returns" />
              <Line type="monotone" dataKey="benchmark" stroke="#3b82f6" strokeWidth={2} name="S&P 500" />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-gray-400 text-xs">Avg Monthly</div>
              <div className="text-green-500 font-bold text-lg">+7.7%</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400 text-xs">Best Month</div>
              <div className="text-green-500 font-bold text-lg">+11.0%</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400 text-xs">Worst Month</div>
              <div className="text-yellow-500 font-bold text-lg">+2.6%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">Detailed Statistics</h3>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <h4 className="text-gray-400 text-sm font-semibold mb-3">Returns</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Return:</span>
                <span className="text-green-500 font-bold">+24.5%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Annualized Return:</span>
                <span className="text-white font-bold">147.0%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">CAGR:</span>
                <span className="text-white font-bold">92.3%</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-gray-400 text-sm font-semibold mb-3">Risk Metrics</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Sharpe Ratio:</span>
                <span className="text-white font-bold">2.43</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Sortino Ratio:</span>
                <span className="text-white font-bold">3.12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Calmar Ratio:</span>
                <span className="text-white font-bold">11.77</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-gray-400 text-sm font-semibold mb-3">Drawdown Stats</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Max Drawdown:</span>
                <span className="text-red-500 font-bold">-2.08%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Avg Drawdown:</span>
                <span className="text-yellow-500 font-bold">-0.87%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Recovery Time:</span>
                <span className="text-white font-bold">2.3 days</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Equity;