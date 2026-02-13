import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import AllTrades from './pages/AllTrades';
import Calendar from './pages/Calendar';
import Analytics from './pages/Analytics';
import Backtest from './pages/Backtest';
import Psychology from './pages/Psychology';
import Equity from './pages/Equity';
import AIChat from './pages/AIChat';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const HomePage = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <nav className="flex items-center justify-between px-8 py-4 bg-black bg-opacity-50">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg"></div>
          <span className="text-white text-xl font-bold">MarketFlow</span>
        </div>
        
        <div className="flex items-center space-x-8">
          <a href="#" className="text-gray-300 hover:text-white">Features</a>
          <a href="#" className="text-gray-300 hover:text-white">Pricing</a>
          <a href="#" className="text-gray-300 hover:text-white">About</a>
          <a href="#" className="text-gray-300 hover:text-white">Contact</a>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="text-white px-4 py-2 rounded-lg hover:bg-gray-800">Sign In</button>
          <button onClick={() => setCurrentPage('dashboard')} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Get Started</button>
        </div>
      </nav>

      <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
        <div className="mb-4">
          <span className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm">🚀 AI-powered journal insights</span>
        </div>
        
        <h1 className="text-6xl font-bold text-white mb-6">
          Master Your Trading<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">Journey</span>
        </h1>
        
        <p className="text-xl text-gray-300 mb-8 max-w-2xl">
          The most advanced AI trading journal for professional traders. Track, analyze, and optimize your trading performance with powerful AI-driven insights.
        </p>
        
        <div className="flex space-x-4 mb-16">
          <button onClick={() => setCurrentPage('dashboard')} className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition">Start Free Trial</button>
          <button className="bg-white text-gray-900 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition">Watch Demo</button>
        </div>

        <div className="grid grid-cols-4 gap-8 max-w-4xl">
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6">
            <div className="text-4xl font-bold text-white mb-2">50K+</div>
            <div className="text-gray-400">Active traders</div>
          </div>
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6">
            <div className="text-4xl font-bold text-white mb-2">10M+</div>
            <div className="text-gray-400">Trades logged</div>
          </div>
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6">
            <div className="text-4xl font-bold text-white mb-2">120+</div>
            <div className="text-gray-400">Countries</div>
          </div>
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6">
            <div className="text-4xl font-bold text-white mb-2">94%</div>
            <div className="text-gray-400">Success rate</div>
          </div>
        </div>
      </div>
    </div>
  );

  const MainApp = () => (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <div className="flex-1 ml-64">
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'trades' && <AllTrades />}
        {currentPage === 'calendar' && <Calendar />}
        {currentPage === 'analytics' && <Analytics />}
        {currentPage === 'backtest' && <Backtest />}
        {currentPage === 'psychology' && <Psychology />}
        {currentPage === 'equity' && <Equity />}
        {currentPage === 'ai-chat' && <AIChat />}
      </div>
    </div>
  );

  return currentPage === 'home' ? <HomePage /> : <MainApp />;
}

export default App;