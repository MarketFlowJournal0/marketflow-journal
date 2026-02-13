import React from 'react';

function Sidebar({ currentPage, setCurrentPage }) {
  const menuItems = [
    { id: 'home', name: 'Home', icon: '🏠' },
    { id: 'dashboard', name: 'Dashboard', icon: '📊', badge: 'New' },
    { id: 'trades', name: 'All Trades', icon: '💹' },
    { id: 'calendar', name: 'Calendar', icon: '📅' },
    { id: 'analytics', name: 'Analytics', icon: '📈' },
    { id: 'backtest', name: 'Backtest', icon: '⏮️' },
    { id: 'psychology', name: 'Psychology', icon: '🧠', badge: 'AI' },
    { id: 'equity', name: 'Equity', icon: '💰' },
    { id: 'ai-chat', name: 'AI Chat', icon: '🤖', badge: 'Beta' },
  ];

  return (
    <div className="w-64 h-screen bg-gray-900 fixed left-0 top-0 flex flex-col border-r border-gray-800">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">M</span>
          </div>
          <span className="text-white text-xl font-bold">MarketFlow</span>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
              currentPage === item.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </div>
            {item.badge && (
              <span className="px-2 py-1 text-xs bg-purple-600 text-white rounded-full">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold">U</span>
          </div>
          <div className="flex-1">
            <div className="text-white font-medium">User Demo</div>
            <div className="text-gray-400 text-sm">Pro Plan</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;