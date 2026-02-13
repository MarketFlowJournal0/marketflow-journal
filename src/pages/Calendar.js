import React, { useState } from 'react';

function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2024, 1));

  const tradesByDay = {
    '2024-02-06': { pnl: 287, trades: 1, win: true },
    '2024-02-07': { pnl: -31, trades: 2, win: false },
    '2024-02-08': { pnl: 638.25, trades: 2, win: true },
    '2024-02-09': { pnl: 206.80, trades: 2, win: true },
    '2024-02-10': { pnl: 380, trades: 1, win: true },
    '2024-02-12': { pnl: -156, trades: 1, win: false },
    '2024-02-13': { pnl: 445, trades: 3, win: true },
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  };

  const formatDate = (day) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days = getDaysInMonth(currentMonth);

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const monthlyStats = Object.values(tradesByDay).reduce((acc, day) => ({
    totalPnL: acc.totalPnL + day.pnl,
    totalTrades: acc.totalTrades + day.trades,
    winningDays: acc.winningDays + (day.win ? 1 : 0),
  }), { totalPnL: 0, totalTrades: 0, winningDays: 0 });

  const tradingDays = Object.keys(tradesByDay).length;
  const winRate = tradingDays > 0 ? ((monthlyStats.winningDays / tradingDays) * 100).toFixed(1) : 0;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Trading Calendar</h1>
          <p className="text-gray-400">Visual overview of your trading performance</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div className="text-gray-400 text-sm mb-1">Monthly P&L</div>
          <div className={`text-2xl font-bold ${monthlyStats.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {monthlyStats.totalPnL >= 0 ? '+' : ''}${monthlyStats.totalPnL.toFixed(2)}
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div className="text-gray-400 text-sm mb-1">Trading Days</div>
          <div className="text-2xl font-bold text-white">{tradingDays}</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div className="text-gray-400 text-sm mb-1">Win Rate</div>
          <div className="text-2xl font-bold text-white">{winRate}%</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div className="text-gray-400 text-sm mb-1">Total Trades</div>
          <div className="text-2xl font-bold text-white">{monthlyStats.totalTrades}</div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={previousMonth} className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition">
            ← Previous
          </button>
          <h2 className="text-2xl font-bold text-white">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h2>
          <button onClick={nextMonth} className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition">
            Next →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-gray-400 font-semibold py-2">{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square"></div>;
            }
            const dateStr = formatDate(day);
            const dayData = tradesByDay[dateStr];
            const isToday = dateStr === '2024-02-13';

            return (
              <div key={day} className={`aspect-square rounded-lg border p-3 transition cursor-pointer ${
                dayData ? dayData.win ? 'bg-green-900 bg-opacity-30 border-green-600 hover:bg-opacity-50' : 'bg-red-900 bg-opacity-30 border-red-600 hover:bg-opacity-50' : 'bg-gray-900 border-gray-700 hover:bg-gray-800'
              } ${isToday ? 'ring-2 ring-blue-500' : ''}`}>
                <div className="flex flex-col h-full">
                  <div className="text-white font-semibold mb-1">{day}</div>
                  {dayData && (
                    <>
                      <div className={`text-xs font-bold ${dayData.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {dayData.pnl >= 0 ? '+' : ''}${dayData.pnl}
                      </div>
                      <div className="text-xs text-gray-400 mt-auto">
                        {dayData.trades} trade{dayData.trades > 1 ? 's' : ''}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center space-x-6">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-900 bg-opacity-30 border border-green-600 rounded"></div>
          <span className="text-gray-400 text-sm">Winning Day</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-900 bg-opacity-30 border border-red-600 rounded"></div>
          <span className="text-gray-400 text-sm">Losing Day</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-900 border border-gray-700 rounded"></div>
          <span className="text-gray-400 text-sm">No Trading</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-900 border-2 border-blue-500 rounded"></div>
          <span className="text-gray-400 text-sm">Today</span>
        </div>
      </div>
    </div>
  );
}

export default Calendar;