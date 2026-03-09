import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTradingContext } from '../context/TradingContext';

function Calendar() {
  const { trades } = useTradingContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // Obtenir le mois et l'année actuels
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Calculer les jours du mois
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  // Mois précédent
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  // Mois suivant
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Grouper les trades par date
  const tradesByDate = useMemo(() => {
    const grouped = {};
    trades.forEach(trade => {
      if (!grouped[trade.date]) {
        grouped[trade.date] = [];
      }
      grouped[trade.date].push(trade);
    });
    return grouped;
  }, [trades]);

  // Stats par date
  const getDateStats = (dateString) => {
    const dateTrades = tradesByDate[dateString] || [];
    if (dateTrades.length === 0) return null;

    const wins = dateTrades.filter(t => t.win).length;
    const totalPnL = dateTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
    const winRate = (wins / dateTrades.length) * 100;

    return {
      count: dateTrades.length,
      wins,
      losses: dateTrades.length - wins,
      totalPnL: totalPnL.toFixed(2),
      winRate: winRate.toFixed(0),
      trades: dateTrades,
    };
  };

  // Trades du jour sélectionné
  const selectedDayTrades = selectedDate ? (tradesByDate[selectedDate] || []) : [];

  // Noms des mois
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Jours de la semaine
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Stats du mois
  const monthStats = useMemo(() => {
    const monthTrades = trades.filter(trade => {
      const tradeDate = new Date(trade.date);
      return tradeDate.getMonth() === month && tradeDate.getFullYear() === year;
    });

    const wins = monthTrades.filter(t => t.win).length;
    const totalPnL = monthTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
    const winRate = monthTrades.length > 0 ? (wins / monthTrades.length) * 100 : 0;

    return {
      totalTrades: monthTrades.length,
      wins,
      losses: monthTrades.length - wins,
      totalPnL: totalPnL.toFixed(2),
      winRate: winRate.toFixed(1),
    };
  }, [trades, month, year]);

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header Hero */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: "spring" }}
        className="mb-10"
      >
        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 mb-4">
          📅 Trading Calendar
        </h1>
        <p className="text-[#A0AEC0] text-xl">Track your daily performance and identify patterns</p>
      </motion.div>

      {/* Month Stats */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-5 gap-6 mb-10"
      >
        {[
          {
            label: 'Trades This Month',
            value: monthStats.totalTrades,
            icon: '📊',
            gradient: 'from-blue-500 to-cyan-500',
            bgGradient: 'from-blue-500/10 to-cyan-500/10',
          },
          {
            label: 'Wins',
            value: monthStats.wins,
            icon: '✅',
            gradient: 'from-green-500 to-emerald-500',
            bgGradient: 'from-green-500/10 to-emerald-500/10',
          },
          {
            label: 'Losses',
            value: monthStats.losses,
            icon: '❌',
            gradient: 'from-red-500 to-rose-500',
            bgGradient: 'from-red-500/10 to-rose-500/10',
          },
          {
            label: 'Win Rate',
            value: `${monthStats.winRate}%`,
            icon: '🎯',
            gradient: 'from-purple-500 to-pink-500',
            bgGradient: 'from-purple-500/10 to-pink-500/10',
          },
          {
            label: 'Monthly P&L',
            value: `${parseFloat(monthStats.totalPnL) >= 0 ? '+' : ''}$${monthStats.totalPnL}`,
            icon: '💰',
            gradient: parseFloat(monthStats.totalPnL) >= 0 ? 'from-green-500 to-emerald-500' : 'from-red-500 to-rose-500',
            bgGradient: parseFloat(monthStats.totalPnL) >= 0 ? 'from-green-500/10 to-emerald-500/10' : 'from-red-500/10 to-rose-500/10',
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 * index }}
            whileHover={{
              scale: 1.05,
              y: -10,
              boxShadow: "0 25px 50px rgba(0,0,0,0.4)"
            }}
            className={`relative overflow-hidden bg-gradient-to-br ${stat.bgGradient} backdrop-blur-xl rounded-2xl p-5 border border-[#2D3548] shadow-2xl`}
          >
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ repeat: Infinity, duration: 5 }}
              className="absolute top-0 right-0 text-6xl opacity-10"
            >
              {stat.icon}
            </motion.div>
            <div className="relative z-10">
              <div className="text-[#A0AEC0] text-xs font-bold mb-2 uppercase tracking-wider">{stat.label}</div>
              <div className={`text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r ${stat.gradient}`}>
                {stat.value}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-3 gap-8">
        {/* Calendar */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="col-span-2 bg-[#1E2536] bg-opacity-50 backdrop-blur-xl rounded-2xl p-8 border border-[#2D3548] shadow-2xl"
        >
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-8">
            <motion.button
              whileHover={{ scale: 1.1, x: -5 }}
              whileTap={{ scale: 0.9 }}
              onClick={prevMonth}
              className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-xl hover:shadow-2xl transition-all"
            >
              ←
            </motion.button>
            
            <div className="text-center">
              <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                {monthNames[month]} {year}
              </h2>
            </div>

            <motion.button
              whileHover={{ scale: 1.1, x: 5 }}
              whileTap={{ scale: 0.9 }}
              onClick={nextMonth}
              className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-xl hover:shadow-2xl transition-all"
            >
              →
            </motion.button>
          </div>

          {/* Day Names */}
          <div className="grid grid-cols-7 gap-3 mb-4">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-[#A0AEC0] font-bold text-sm uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-3">
            {/* Empty cells avant le 1er jour */}
            {[...Array(startingDayOfWeek)].map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square" />
            ))}

            {/* Jours du mois */}
            {[...Array(daysInMonth)].map((_, index) => {
              const day = index + 1;
              const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const stats = getDateStats(dateString);
              const isSelected = selectedDate === dateString;
              const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

              return (
                <motion.div
                  key={day}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.01 * day }}
                  whileHover={{ scale: 1.1, zIndex: 10 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedDate(dateString)}
                  className={`aspect-square relative cursor-pointer rounded-xl p-2 transition-all ${
                    isSelected
                      ? 'bg-gradient-to-br from-blue-600 to-purple-600 shadow-2xl border-2 border-blue-400'
                      : isToday
                      ? 'bg-gradient-to-br from-yellow-600 to-orange-600 shadow-xl border-2 border-yellow-400'
                      : stats
                      ? parseFloat(stats.totalPnL) >= 0
                        ? 'bg-gradient-to-br from-green-900 to-emerald-900 bg-opacity-50 border border-[#059669] hover:border-green-400'
                        : 'bg-gradient-to-br from-red-900 to-rose-900 bg-opacity-50 border border-[#DC2626] hover:border-red-400'
                      : 'bg-[#1A1F2E] bg-opacity-50 border border-[#2D3548] hover:border-gray-500'
                  }`}
                >
                  <div className="flex flex-col h-full justify-between">
                    <div className={`text-sm font-bold ${isSelected || isToday ? 'text-white' : stats ? 'text-white' : 'text-[#718096]'}`}>
                      {day}
                    </div>
                    
                    {stats && (
                      <div className="flex flex-col items-center">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="text-lg mb-1"
                        >
                          {parseFloat(stats.totalPnL) >= 0 ? '' : '💸'}
                        </motion.div>
                        <div className={`text-xs font-black ${parseFloat(stats.totalPnL) >= 0 ? 'text-[#34D399]' : 'text-[#F87171]'}`}>
                          ${Math.abs(parseFloat(stats.totalPnL))}
                        </div>
                        <div className="text-xs text-[#A0AEC0] font-bold">{stats.count} trades</div>
                      </div>
                    )}
                  </div>

                  {isToday && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full shadow-lg"
                    />
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Selected Day Details */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-[#1E2536] bg-opacity-50 backdrop-blur-xl rounded-2xl p-6 border border-[#2D3548] shadow-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                📋 Day Details
              </h3>
              <p className="text-[#718096] text-sm">
                {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Select a date'}
              </p>
            </div>
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              className="text-4xl"
            >
              
            </motion.div>
          </div>

          {selectedDate && selectedDayTrades.length > 0 ? (
            <div className="space-y-4">
              {/* Day Stats */}
              <div className="bg-[#1A1F2E] bg-opacity-50 rounded-xl p-4 border border-[#2D3548]">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[#A0AEC0] text-xs mb-1">Trades</div>
                    <div className="text-white font-bold text-xl">{selectedDayTrades.length}</div>
                  </div>
                  <div>
                    <div className="text-[#A0AEC0] text-xs mb-1">Win Rate</div>
                    <div className="text-white font-bold text-xl">
                      {((selectedDayTrades.filter(t => t.win).length / selectedDayTrades.length) * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-[#A0AEC0] text-xs mb-1">Daily P&L</div>
                    <div className={`font-black text-2xl ${
                      selectedDayTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0) >= 0
                        ? 'text-[#34D399]'
                        : 'text-[#F87171]'
                    }`}>
                      {selectedDayTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0) >= 0 ? '+' : ''}
                      ${selectedDayTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Trades List */}
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                <AnimatePresence>
                  {selectedDayTrades.map((trade, index) => (
                    <motion.div
                      key={trade.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: 0.05 * index }}
                      whileHover={{
                        scale: 1.03,
                        boxShadow: trade.pnl >= 0 ? "0 10px 30px rgba(16, 185, 129, 0.3)" : "0 10px 30px rgba(239, 68, 68, 0.3)"
                      }}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        trade.pnl >= 0
                          ? 'bg-green-900 bg-opacity-20 border-[#059669] hover:border-green-400'
                          : 'bg-[#7F1D1D]/20 border-[#DC2626] hover:border-red-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <motion.div
                            whileHover={{ rotate: 360, scale: 1.2 }}
                            transition={{ duration: 0.5 }}
                            className="w-10 h-10 bg-gradient-to-br from-[#3B82F6] to-[#7C3AED] rounded-lg flex items-center justify-center shadow-lg"
                          >
                            <span className="text-white font-bold text-sm">{trade.symbol?.substring(0, 2)}</span>
                          </motion.div>
                          <div>
                            <div className="text-white font-bold">{trade.symbol}</div>
                            <div className="text-[#718096] text-xs">{trade.time}</div>
                          </div>
                        </div>
                        <motion.span
                          whileHover={{ scale: 1.1 }}
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            trade.type === 'Long'
                              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                              : 'bg-gradient-to-r from-red-500 to-rose-600 text-white'
                          }`}
                        >
                          {trade.type === 'Long' ? '🔼' : '🔽'} {trade.type}
                        </motion.span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex space-x-4 text-xs">
                          <div>
                            <div className="text-[#A0AEC0]">Entry</div>
                            <div className="text-white font-mono font-bold">{parseFloat(trade.entry).toFixed(5)}</div>
                          </div>
                          <div>
                            <div className="text-[#A0AEC0]">Exit</div>
                            <div className="text-white font-mono font-bold">{parseFloat(trade.exit).toFixed(5)}</div>
                          </div>
                          <div>
                            <div className="text-[#A0AEC0]">RR</div>
                            <div className="text-[#A78BFA] font-bold">1:{trade.metrics?.rrReel}</div>
                          </div>
                        </div>
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className={`px-4 py-2 rounded-lg font-black text-lg shadow-lg ${
                            trade.pnl >= 0
                              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                              : 'bg-gradient-to-r from-red-500 to-rose-600 text-white'
                          }`}
                        >
                          {trade.pnl >= 0 ? '💰 +' : '💸 '}${Math.abs(parseFloat(trade.pnl || 0)).toFixed(2)}
                        </motion.div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ) : selectedDate ? (
            <div className="h-96 flex items-center justify-center">
              <div className="text-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                  className="text-8xl mb-4"
                >
                  🌙
                </motion.div>
                <p className="text-[#718096] text-lg">No trades on this day</p>
              </div>
            </div>
          ) : (
            <div className="h-96 flex items-center justify-center">
              <div className="text-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="text-8xl mb-4"
                >
                  📅
                </motion.div>
                <p className="text-[#718096] text-lg">Select a date to view trades</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default Calendar;