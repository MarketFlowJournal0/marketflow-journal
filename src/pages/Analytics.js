import React from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function Analytics() {
  // Données de démonstration
  const performanceData = [
    { date: 'Feb 1', pnl: 120, cumulative: 120 },
    { date: 'Feb 2', pnl: -50, cumulative: 70 },
    { date: 'Feb 3', pnl: 200, cumulative: 270 },
    { date: 'Feb 4', pnl: 150, cumulative: 420 },
    { date: 'Feb 5', pnl: -80, cumulative: 340 },
    { date: 'Feb 6', pnl: 287, cumulative: 627 },
    { date: 'Feb 7', pnl: -31, cumulative: 596 },
    { date: 'Feb 8', pnl: 638, cumulative: 1234 },
    { date: 'Feb 9', pnl: 207, cumulative: 1441 },
    { date: 'Feb 10', pnl: 380, cumulative: 1821 },
  ];

  const setupPerformance = [
    { name: 'Breakout', wins: 12, losses: 3, winRate: 80, avgWin: 245, avgLoss: -120 },
    { name: 'Reversal', wins: 8, losses: 5, winRate: 61.5, avgWin: 180, avgLoss: -95 },
    { name: 'Trend Follow', wins: 15, losses: 4, winRate: 78.9, avgWin: 310, avgLoss: -140 },
    { name: 'Support Bounce', wins: 10, losses: 6, winRate: 62.5, avgWin: 220, avgLoss: -105 },
  ];

  const timeOfDayData = [
    { time: '9:30-10:00', pnl: 450, trades: 12 },
    { time: '10:00-11:00', pnl: 320, trades: 8 },
    { time: '11:00-12:00', pnl: -120, trades: 5 },
    { time: '12:00-13:00', pnl: 80, trades: 3 },
    { time: '13:00-14:00', pnl: 280, trades: 7 },
    { time: '14:00-15:00', pnl: 190, trades: 6 },
    { time: '15:00-16:00', pnl: 570, trades: 10 },
  ];

  const dayOfWeekData = [
    { day: 'Monday', pnl: 520, winRate: 68 },
    { day: 'Tuesday', pnl: 380, winRate: 72 },
    { day: 'Wednesday', pnl: -120, winRate: 45 },
    { day: 'Thursday', pnl: 640, winRate: 78 },
    { day: 'Friday', pnl: 350, winRate: 65 },
  ];

  const winLossData = [
    { name: 'Wins', value: 156, color: '#10b981' },
    { name: 'Losses', value: 74, color: '#ef4444' },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Advanced Analytics</h1>
        <p className="text-gray-400">Deep insights into your trading performance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div className="text-gray-400 text-sm mb-1">Total P&L</div>
          <div className="text-2xl font-bold text-green-500">+$1,821</div>
          <div className="text-green-500 text-sm mt-2">↑ 45.2% this month</div>
        </div>
        
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div className="text-gray-400 text-sm mb-1">Win Rate</div>
          <div className="text-2xl font-bold text-white">67.8%</div>
          <div className="text-gray-400 text-sm mt-2">156/230 trades</div>
        </div>
        
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div className="text-gray-400 text-sm mb-1">Profit Factor</div>
          <div className="text-2xl font-bold text-white">2.43</div>
          <div className="text-blue-500 text-sm mt-2">Excellent performance</div>
        </div>
        
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div className="text-gray-400 text-sm mb-1">Avg Risk/Reward</div>
          <div className="text-2xl font-bold text-white">1:2.8</div>
          <div className="text-gray-400 text-sm mt-2">Per trade</div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Cumulative P&L Chart */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">Cumulative P&L</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Line type="monotone" dataKey="cumulative" stroke="#10b981" strokeWidth={3} name="Cumulative P&L" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Win/Loss Pie Chart */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">Win/Loss Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={winLossData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {winLossData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Performance by Time of Day */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">Performance by Time of Day</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={timeOfDayData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Bar dataKey="pnl" fill="#3b82f6" name="P&L" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Performance by Day of Week */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">Performance by Day of Week</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dayOfWeekData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="day" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Bar dataKey="pnl" fill="#8b5cf6" name="P&L" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Setup Performance Table */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">Performance by Setup</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Setup</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Wins</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Losses</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Win Rate</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Avg Win</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Avg Loss</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {setupPerformance.map((setup, index) => (
                <tr key={index} className="hover:bg-gray-700 transition">
                  <td className="px-6 py-4 text-white font-medium">{setup.name}</td>
                  <td className="px-6 py-4 text-green-500">{setup.wins}</td>
                  <td className="px-6 py-4 text-red-500">{setup.losses}</td>
                  <td className="px-6 py-4 text-white font-bold">{setup.winRate}%</td>
                  <td className="px-6 py-4 text-green-500">+${setup.avgWin}</td>
                  <td className="px-6 py-4 text-red-500">${setup.avgLoss}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Analytics;