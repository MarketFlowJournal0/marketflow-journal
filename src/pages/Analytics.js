import React, { useMemo } from 'react';
import { useTradingContext } from '../context/TradingContext';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function Analytics() {
  const { trades, globalStats, confluences } = useTradingContext();

  // Advanced calculations for charts
  const analyticsData = useMemo(() => {
    if (trades.length === 0) {
      return {
        performanceData: [],
        setupPerformance: [],
        timeOfDayData: [],
        dayOfWeekData: [],
        winLossData: [],
        confluencePerformance: [],
        marketTypeData: [],
      };
    }

    // Cumulative performance
    let cumulative = 0;
    const performanceData = [...trades].reverse().map(trade => {
      cumulative += parseFloat(trade.pnl || 0);
      return {
        date: trade.date.substring(5),
        pnl: parseFloat(trade.pnl || 0),
        cumulative: parseFloat(cumulative.toFixed(2)),
      };
    });

    // Performance by setup
    const setupMap = {};
    trades.forEach(trade => {
      const setup = trade.setup || 'Other';
      if (!setupMap[setup]) {
        setupMap[setup] = { name: setup, wins: 0, losses: 0, totalPnL: 0, avgRR: 0, count: 0 };
      }
      setupMap[setup].wins += trade.win ? 1 : 0;
      setupMap[setup].losses += trade.win ? 0 : 1;
      setupMap[setup].totalPnL += parseFloat(trade.pnl || 0);
      setupMap[setup].avgRR += parseFloat(trade.metrics?.rr || 0);
      setupMap[setup].count += 1;
    });

    const setupPerformance = Object.values(setupMap).map(s => ({
      ...s,
      winRate: parseFloat(((s.wins / (s.wins + s.losses)) * 100).toFixed(1)),
      avgWin: s.wins > 0 ? (s.totalPnL / s.wins).toFixed(0) : 0,
      avgLoss: s.losses > 0 ? (s.totalPnL / s.losses).toFixed(0) : 0,
      avgRR: (s.avgRR / s.count).toFixed(2),
    }));

    // Performance by time (mock - simulating time slots)
    const timeOfDayMap = {
      '9:30-10:30': { time: '9:30-10:30', pnl: 0, trades: 0 },
      '10:30-11:30': { time: '10:30-11:30', pnl: 0, trades: 0 },
      '11:30-12:30': { time: '11:30-12:30', pnl: 0, trades: 0 },
      '12:30-13:30': { time: '12:30-13:30', pnl: 0, trades: 0 },
      '13:30-14:30': { time: '13:30-14:30', pnl: 0, trades: 0 },
      '14:30-15:30': { time: '14:30-15:30', pnl: 0, trades: 0 },
      '15:30-16:00': { time: '15:30-16:00', pnl: 0, trades: 0 },
    };

    trades.forEach(trade => {
      const hour = parseInt(trade.time?.split(':')[0] || 9);
      let timeSlot;
      if (hour >= 9 && hour < 10) timeSlot = '9:30-10:30';
      else if (hour >= 10 && hour < 11) timeSlot = '10:30-11:30';
      else if (hour >= 11 && hour < 12) timeSlot = '11:30-12:30';
      else if (hour >= 12 && hour < 13) timeSlot = '12:30-13:30';
      else if (hour >= 13 && hour < 14) timeSlot = '13:30-14:30';
      else if (hour >= 14 && hour < 15) timeSlot = '14:30-15:30';
      else timeSlot = '15:30-16:00';

      if (timeOfDayMap[timeSlot]) {
        timeOfDayMap[timeSlot].pnl += parseFloat(trade.pnl || 0);
        timeOfDayMap[timeSlot].trades += 1;
      }
    });

    const timeOfDayData = Object.values(timeOfDayMap).filter(t => t.trades > 0);

    // Performance by day of the week
    const dayOfWeekMap = {
      0: { day: 'Sunday', pnl: 0, winRate: 0, trades: 0, wins: 0 },
      1: { day: 'Monday', pnl: 0, winRate: 0, trades: 0, wins: 0 },
      2: { day: 'Tuesday', pnl: 0, winRate: 0, trades: 0, wins: 0 },
      3: { day: 'Wednesday', pnl: 0, winRate: 0, trades: 0, wins: 0 },
      4: { day: 'Thursday', pnl: 0, winRate: 0, trades: 0, wins: 0 },
      5: { day: 'Friday', pnl: 0, winRate: 0, trades: 0, wins: 0 },
      6: { day: 'Saturday', pnl: 0, winRate: 0, trades: 0, wins: 0 },
    };

    trades.forEach(trade => {
      const dayNum = new Date(trade.date).getDay();
      dayOfWeekMap[dayNum].pnl += parseFloat(trade.pnl || 0);
      dayOfWeekMap[dayNum].trades += 1;
      if (trade.win) dayOfWeekMap[dayNum].wins += 1;
    });

    const dayOfWeekData = Object.values(dayOfWeekMap)
      .filter(d => d.trades > 0)
      .map(d => ({
        ...d,
        winRate: parseFloat(((d.wins / d.trades) * 100).toFixed(1)),
      }));

    // Win/Loss data
    const winLossData = [
      { name: 'Wins', value: globalStats.wins || 0, color: '#10b981' },
      { name: 'Losses', value: globalStats.losses || 0, color: '#ef4444' },
    ];

    // Performance by confluence
    const confluenceMap = {};
    trades.forEach(trade => {
      if (trade.confluences && trade.confluences.length > 0) {
        trade.confluences.forEach(conf => {
          if (!confluenceMap[conf]) {
            confluenceMap[conf] = { name: conf, wins: 0, losses: 0, totalPnL: 0 };
          }
          confluenceMap[conf].wins += trade.win ? 1 : 0;
          confluenceMap[conf].losses += trade.win ? 0 : 1;
          confluenceMap[conf].totalPnL += parseFloat(trade.pnl || 0);
        });
      }
    });

    const confluencePerformance = Object.values(confluenceMap).map(c => ({
      ...c,
      winRate: parseFloat(((c.wins / (c.wins + c.losses)) * 100).toFixed(1)),
    }));

    // Performance by market type
    const marketTypeMap = {};
    trades.forEach(trade => {
      const market = trade.marketType || 'Unknown';
      if (!marketTypeMap[market]) {
        marketTypeMap[market] = { name: market, pnl: 0, trades: 0, wins: 0 };
      }
      marketTypeMap[market].pnl += parseFloat(trade.pnl || 0);
      marketTypeMap[market].trades += 1;
      if (trade.win) marketTypeMap[market].wins += 1;
    });

    const marketTypeData = Object.values(marketTypeMap).map(m => ({
      ...m,
      winRate: parseFloat(((m.wins / m.trades) * 100).toFixed(1)),
    }));

    return {
      performanceData,
      setupPerformance,
      timeOfDayData,
      dayOfWeekData,
      winLossData,
      confluencePerformance,
      marketTypeData,
    };
  }, [trades, globalStats]);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Advanced Analytics</h1>
        <p className="text-[#A0AEC0]">Deep insights into your trading performance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-[#1E2536] rounded-xl p-5 border border-[#2D3548]">
          <div className="text-[#A0AEC0] text-sm mb-1">Total P&L</div>
          <div className={`text-2xl font-bold ${parseFloat(globalStats.totalPnL || 0) >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
            {parseFloat(globalStats.totalPnL || 0) >= 0 ? '+' : ''}${globalStats.totalPnL || '0.00'}
          </div>
          <div className="text-[#10B981] text-sm mt-2">↑ Overall performance</div>
        </div>
        
        <div className="bg-[#1E2536] rounded-xl p-5 border border-[#2D3548]">
          <div className="text-[#A0AEC0] text-sm mb-1">Win Rate</div>
          <div className="text-2xl font-bold text-white">{globalStats.winRate || 0}%</div>
          <div className="text-[#A0AEC0] text-sm mt-2">{globalStats.wins || 0}/{globalStats.totalTrades || 0} trades</div>
        </div>
        
        <div className="bg-[#1E2536] rounded-xl p-5 border border-[#2D3548]">
          <div className="text-[#A0AEC0] text-sm mb-1">Avg RR</div>
          <div className="text-2xl font-bold text-white">1:{globalStats.avgRR || '0.00'}</div>
          <div className="text-[#60A5FA] text-sm mt-2">Risk/Reward ratio</div>
        </div>
        
        <div className="bg-[#1E2536] rounded-xl p-5 border border-[#2D3548]">
          <div className="text-[#A0AEC0] text-sm mb-1">Avg P&L</div>
          <div className="text-2xl font-bold text-white">${globalStats.avgPnL || '0.00'}</div>
          <div className="text-[#A0AEC0] text-sm mt-2">Per trade</div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Cumulative P&L Chart */}
        <div className="bg-[#1E2536] rounded-xl p-6 border border-[#2D3548]">
          <h3 className="text-xl font-bold text-white mb-4">Cumulative P&L</h3>
          {analyticsData.performanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.performanceData}>
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
          ) : (
            <div className="h-72 flex items-center justify-center text-[#718096]">No data yet</div>
          )}
        </div>

        {/* Win/Loss Pie Chart */}
        <div className="bg-[#1E2536] rounded-xl p-6 border border-[#2D3548]">
          <h3 className="text-xl font-bold text-white mb-4">Win/Loss Distribution</h3>
          {analyticsData.winLossData[0].value > 0 || analyticsData.winLossData[1].value > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.winLossData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analyticsData.winLossData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-72 flex items-center justify-center text-[#718096]">No data yet</div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Performance by Time of Day */}
        <div className="bg-[#1E2536] rounded-xl p-6 border border-[#2D3548]">
          <h3 className="text-xl font-bold text-white mb-4">Performance by Time of Day</h3>
          {analyticsData.timeOfDayData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.timeOfDayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9ca3af" angle={-45} textAnchor="end" height={100} />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                <Bar dataKey="pnl" fill="#3b82f6" name="P&L" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-72 flex items-center justify-center text-[#718096]">No data yet</div>
          )}
        </div>

        {/* Performance by Day of Week */}
        <div className="bg-[#1E2536] rounded-xl p-6 border border-[#2D3548]">
          <h3 className="text-xl font-bold text-white mb-4">Performance by Day of Week</h3>
          {analyticsData.dayOfWeekData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.dayOfWeekData}>
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
          ) : (
            <div className="h-72 flex items-center justify-center text-[#718096]">No data yet</div>
          )}
        </div>
      </div>

      {/* Performance Tables */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Setup Performance */}
        <div className="bg-[#1E2536] rounded-xl p-6 border border-[#2D3548]">
          <h3 className="text-xl font-bold text-white mb-4">Performance by Setup</h3>
          {analyticsData.setupPerformance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#1A1F2E]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#A0AEC0] uppercase">Setup</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#A0AEC0] uppercase">W/L</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#A0AEC0] uppercase">Win Rate</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#A0AEC0] uppercase">Avg RR</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#A0AEC0] uppercase">P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2D3548]">
                  {analyticsData.setupPerformance.map((setup, index) => (
                    <tr key={index} className="hover:bg-[#252D42] transition">
                      <td className="px-4 py-3 text-white font-medium">{setup.name}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="text-[#10B981]">{setup.wins}</span>
                        <span className="text-[#718096]">/</span>
                        <span className="text-[#EF4444]">{setup.losses}</span>
                      </td>
                      <td className="px-4 py-3 text-white font-bold">{setup.winRate}%</td>
                      <td className="px-4 py-3 text-white">1:{setup.avgRR}</td>
                      <td className={`px-4 py-3 font-bold ${setup.totalPnL >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                        {setup.totalPnL >= 0 ? '+' : ''}${setup.totalPnL.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-[#718096]">No data yet</div>
          )}
        </div>

        {/* Market Type Performance */}
        <div className="bg-[#1E2536] rounded-xl p-6 border border-[#2D3548]">
          <h3 className="text-xl font-bold text-white mb-4">Performance by Market Type</h3>
          {analyticsData.marketTypeData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#1A1F2E]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#A0AEC0] uppercase">Market</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#A0AEC0] uppercase">Trades</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#A0AEC0] uppercase">Win Rate</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#A0AEC0] uppercase">P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2D3548]">
                  {analyticsData.marketTypeData.map((market, index) => (
                    <tr key={index} className="hover:bg-[#252D42] transition">
                      <td className="px-4 py-3 text-white font-medium">{market.name}</td>
                      <td className="px-4 py-3 text-white">{market.trades}</td>
                      <td className="px-4 py-3 text-white font-bold">{market.winRate}%</td>
                      <td className={`px-4 py-3 font-bold ${market.pnl >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                        {market.pnl >= 0 ? '+' : ''}${market.pnl.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-[#718096]">No data yet</div>
          )}
        </div>
      </div>

      {/* Confluence Performance */}
      {analyticsData.confluencePerformance.length > 0 && (
        <div className="bg-[#1E2536] rounded-xl p-6 border border-[#2D3548]">
          <h3 className="text-xl font-bold text-white mb-4">🎯 Performance by Confluence</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#1A1F2E]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#A0AEC0] uppercase">Confluence</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#A0AEC0] uppercase">Wins</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#A0AEC0] uppercase">Losses</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#A0AEC0] uppercase">Win Rate</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#A0AEC0] uppercase">Total P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2D3548]">
                {analyticsData.confluencePerformance.map((conf, index) => (
                  <tr key={index} className="hover:bg-[#252D42] transition">
                    <td className="px-6 py-4 text-white font-medium capitalize">{conf.name}</td>
                    <td className="px-6 py-4 text-[#10B981] font-bold">{conf.wins}</td>
                    <td className="px-6 py-4 text-[#EF4444] font-bold">{conf.losses}</td>
                    <td className="px-6 py-4 text-white font-bold">{conf.winRate}%</td>
                    <td className={`px-6 py-4 font-bold ${conf.totalPnL >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                      {conf.totalPnL >= 0 ? '+' : ''}${conf.totalPnL.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Analytics;