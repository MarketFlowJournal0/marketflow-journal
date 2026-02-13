import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function Psychology() {
  const [selectedEmotion, setSelectedEmotion] = useState(null);

  // Données de démonstration
  const emotionPerformance = [
    { emotion: 'Confident', trades: 45, winRate: 78, avgPnL: 320 },
    { emotion: 'Calm', trades: 38, winRate: 72, avgPnL: 280 },
    { emotion: 'Anxious', trades: 28, winRate: 45, avgPnL: -85 },
    { emotion: 'FOMO', trades: 22, winRate: 35, avgPnL: -145 },
    { emotion: 'Revenge Trading', trades: 15, winRate: 20, avgPnL: -280 },
    { emotion: 'Neutral', trades: 52, winRate: 68, avgPnL: 195 },
  ];

  const disciplineData = [
    { date: 'Week 1', discipline: 85, performance: 420 },
    { date: 'Week 2', discipline: 72, performance: 280 },
    { date: 'Week 3', discipline: 92, performance: 680 },
    { date: 'Week 4', discipline: 65, performance: -120 },
    { date: 'Week 5', discipline: 88, performance: 540 },
    { date: 'Week 6', discipline: 78, performance: 360 },
  ];

  const psychologicalProfile = [
    { trait: 'Discipline', value: 78 },
    { trait: 'Patience', value: 65 },
    { trait: 'Risk Control', value: 82 },
    { trait: 'Emotional Control', value: 58 },
    { trait: 'Consistency', value: 72 },
    { trait: 'Adaptability', value: 68 },
  ];

  const recentEntries = [
    { 
      id: 1, 
      date: '2024-02-13', 
      time: '14:30',
      preTrade: { emotion: 'Confident', notes: 'Setup looks perfect, waited for confirmation' },
      postTrade: { emotion: 'Satisfied', pnl: 380, notes: 'Followed my plan exactly' },
      disciplineScore: 95
    },
    { 
      id: 2, 
      date: '2024-02-12', 
      time: '10:15',
      preTrade: { emotion: 'FOMO', notes: 'Afraid to miss the move' },
      postTrade: { emotion: 'Regret', pnl: -156, notes: 'Entered too late without confirmation' },
      disciplineScore: 35
    },
    { 
      id: 3, 
      date: '2024-02-10', 
      time: '09:45',
      preTrade: { emotion: 'Calm', notes: 'Good setup, risk defined' },
      postTrade: { emotion: 'Content', pnl: 445, notes: 'Patient execution paid off' },
      disciplineScore: 90
    },
  ];

  const aiInsights = [
    {
      type: 'warning',
      title: '⚠️ Pattern Detected: Revenge Trading',
      description: 'You tend to take impulsive trades after losses. 5 out of 7 trades after red days had poor discipline scores.',
      action: 'Consider taking a 30-minute break after any losing trade.'
    },
    {
      type: 'success',
      title: '✅ Strength Identified: Morning Focus',
      description: 'Your best performance (78% win rate) occurs between 9:30-11:00 AM when trading with "Calm" or "Confident" emotions.',
      action: 'Focus your trading during this window and avoid afternoon sessions when anxious.'
    },
    {
      type: 'info',
      title: '💡 Improvement Opportunity',
      description: 'Trades with discipline scores above 80 have a 2.3x higher profit factor than those below 60.',
      action: 'Use pre-trade checklists to boost discipline consistency.'
    },
  ];

  const getEmotionColor = (emotion) => {
    const colors = {
      'Confident': 'bg-green-500',
      'Calm': 'bg-blue-500',
      'Anxious': 'bg-yellow-500',
      'FOMO': 'bg-orange-500',
      'Revenge Trading': 'bg-red-500',
      'Neutral': 'bg-gray-500',
      'Satisfied': 'bg-green-500',
      'Regret': 'bg-red-500',
      'Content': 'bg-blue-500',
    };
    return colors[emotion] || 'bg-gray-500';
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Trading Psychology</h1>
          <p className="text-gray-400">Master your emotions, master your trading</p>
        </div>
        
        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold">
          📝 New Journal Entry
        </button>
      </div>

      {/* AI Insights */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">🤖 AI-Powered Insights</h2>
        <div className="grid grid-cols-3 gap-6">
          {aiInsights.map((insight, index) => (
            <div 
              key={index}
              className={`rounded-xl p-5 border ${
                insight.type === 'warning' ? 'bg-red-900 bg-opacity-20 border-red-600' :
                insight.type === 'success' ? 'bg-green-900 bg-opacity-20 border-green-600' :
                'bg-blue-900 bg-opacity-20 border-blue-600'
              }`}
            >
              <h3 className="text-white font-bold mb-2">{insight.title}</h3>
              <p className="text-gray-300 text-sm mb-3">{insight.description}</p>
              <div className="text-xs text-gray-400 italic">💡 {insight.action}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Emotion vs Performance */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">Emotion vs Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={emotionPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="emotion" stroke="#9ca3af" angle={-45} textAnchor="end" height={100} />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Bar dataKey="avgPnL" fill="#3b82f6" name="Avg P&L" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Discipline vs Performance */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">Discipline vs Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={disciplineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Line type="monotone" dataKey="discipline" stroke="#10b981" strokeWidth={2} name="Discipline Score" />
              <Line type="monotone" dataKey="performance" stroke="#8b5cf6" strokeWidth={2} name="Performance" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Psychological Profile Radar */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
        <h3 className="text-xl font-bold text-white mb-4">Your Psychological Profile</h3>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={psychologicalProfile}>
            <PolarGrid stroke="#374151" />
            <PolarAngleAxis dataKey="trait" stroke="#9ca3af" />
            <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#9ca3af" />
            <Radar name="Your Score" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Journal Entries */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">Recent Journal Entries</h3>
        <div className="space-y-4">
          {recentEntries.map((entry) => (
            <div key={entry.id} className="bg-gray-900 rounded-lg p-5 border border-gray-700">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-white font-bold text-lg">{entry.date} at {entry.time}</div>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="text-gray-400 text-sm">Discipline Score:</span>
                    <div className="flex-1 h-2 bg-gray-700 rounded-full w-32">
                      <div 
                        className={`h-full rounded-full ${
                          entry.disciplineScore >= 80 ? 'bg-green-500' :
                          entry.disciplineScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${entry.disciplineScore}%` }}
                      ></div>
                    </div>
                    <span className="text-white font-bold">{entry.disciplineScore}%</span>
                  </div>
                </div>
                <div className={`text-2xl font-bold ${entry.postTrade.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {entry.postTrade.pnl >= 0 ? '+' : ''}${entry.postTrade.pnl}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Pre-Trade */}
                <div>
                  <div className="text-gray-400 text-sm font-semibold mb-2">📝 Before Trade</div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getEmotionColor(entry.preTrade.emotion)}`}>
                      {entry.preTrade.emotion}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm italic">"{entry.preTrade.notes}"</p>
                </div>

                {/* Post-Trade */}
                <div>
                  <div className="text-gray-400 text-sm font-semibold mb-2">✅ After Trade</div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getEmotionColor(entry.postTrade.emotion)}`}>
                      {entry.postTrade.emotion}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm italic">"{entry.postTrade.notes}"</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Psychology;