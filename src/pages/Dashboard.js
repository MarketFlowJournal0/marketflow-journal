import React from 'react';

function Dashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-6">Dashboard</h1>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="text-gray-400 text-sm mb-2">Total P&L</div>
          <div className="text-3xl font-bold text-green-500">+$12,450</div>
          <div className="text-green-500 text-sm mt-2">↑ 23.5% this month</div>
        </div>
        
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="text-gray-400 text-sm mb-2">Win Rate</div>
          <div className="text-3xl font-bold text-white">68%</div>
          <div className="text-gray-400 text-sm mt-2">156/230 trades</div>
        </div>
        
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="text-gray-400 text-sm mb-2">Avg Win</div>
          <div className="text-3xl font-bold text-white">$245</div>
          <div className="text-blue-500 text-sm mt-2">Risk/Reward: 2.3</div>
        </div>
        
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="text-gray-400 text-sm mb-2">Total Trades</div>
          <div className="text-3xl font-bold text-white">230</div>
          <div className="text-gray-400 text-sm mt-2">Last 30 days</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Recent Trades</h2>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">AAPL</span>
                </div>
                <div>
                  <div className="text-white font-medium">Apple Inc.</div>
                  <div className="text-gray-400 text-sm">Long • 100 shares</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-green-500 font-bold">+$456.00</div>
                <div className="text-gray-400 text-sm">2 hours ago</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;