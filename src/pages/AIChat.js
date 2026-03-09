import React, { useState } from 'react';

function AIChat() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '👋 Hello! I\'m your AI trading assistant. I can help you analyze your performance, suggest improvements, and answer questions about your trading. What would you like to know?',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Questions suggérées
  const suggestedQuestions = [
    '📊 What are my best trading setups?',
    '⏰ When do I perform best during the day?',
    '😰 How do my emotions affect my performance?',
    '💡 What can I improve in my trading?',
    '📈 Analyze my win rate trend',
    '🎯 What\'s my average risk/reward ratio?',
  ];

  // Réponses pré-programmées (simulation IA)
  const getAIResponse = (question) => {
    const responses = {
      'best trading setups': 'Based on your trading history, your **Breakout Strategy** has the highest win rate at **80%** with an average profit of **$245**. Your **Trend Following** setup also performs well at **78.9%** win rate. I recommend focusing more on these two setups during high-volume market hours (9:30-11:00 AM).',
      
      'perform best': 'Your performance analysis shows that you trade best between **9:30-11:00 AM** with a **78% win rate**. Your afternoon sessions (after 2 PM) show lower discipline scores and a **45% win rate**. Consider limiting your trading to morning sessions when you\'re most focused.',
      
      'emotions': 'Emotional analysis reveals that trades taken with **"Confident"** or **"Calm"** emotions have a **75%+ win rate**, while trades with **"FOMO"** or **"Anxious"** emotions have only a **35-40% win rate**. I\'ve also detected a pattern: you tend to revenge trade after losses, which reduces your discipline score by 60%. Consider implementing a **30-minute cooldown** after any losing trade.',
      
      'improve': 'Here are my top 3 recommendations:\n\n1. **Stick to morning sessions** (9:30-11:00 AM) - your win rate is 33% higher\n2. **Avoid revenge trading** - 5 out of 7 trades after losses had poor outcomes\n3. **Use pre-trade checklists** - trades with discipline scores above 80 have 2.3x higher profit factor',
      
      'win rate': 'Your overall win rate is **67.8%** (156 wins / 230 trades). The trend shows improvement over the last 6 weeks, going from **62%** to **72%**. Your consistency is strongest when trading with a predefined plan and avoiding impulsive decisions.',
      
      'risk reward': 'Your average risk/reward ratio is **1:2.8**, which is excellent! Your winning trades average **$245**, while your losing trades average **-$87**. This means you\'re letting your winners run and cutting losers quickly - keep it up!',
      
      'default': 'That\'s an interesting question! Based on your trading data, I can provide insights on:\n\n• Performance patterns\n• Emotional analysis\n• Best trading times\n• Strategy optimization\n• Risk management\n\nCould you be more specific about what you\'d like to know?'
    };

    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('setup') || lowerQuestion.includes('strategy')) {
      return responses['best trading setups'];
    } else if (lowerQuestion.includes('time') || lowerQuestion.includes('when') || lowerQuestion.includes('perform')) {
      return responses['perform best'];
    } else if (lowerQuestion.includes('emotion') || lowerQuestion.includes('feeling')) {
      return responses['emotions'];
    } else if (lowerQuestion.includes('improve') || lowerQuestion.includes('better')) {
      return responses['improve'];
    } else if (lowerQuestion.includes('win rate') || lowerQuestion.includes('trend')) {
      return responses['win rate'];
    } else if (lowerQuestion.includes('risk') || lowerQuestion.includes('reward')) {
      return responses['risk reward'];
    } else {
      return responses['default'];
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    // Ajouter le message de l'utilisateur
    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages([...messages, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simuler le délai de réponse de l'IA
    setTimeout(() => {
      const aiResponse = {
        role: 'assistant',
        content: getAIResponse(inputMessage),
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleQuickQuestion = (question) => {
    setInputMessage(question);
  };

  return (
    <div className="p-8 h-screen flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">AI Trading Assistant</h1>
        <p className="text-[#A0AEC0]">Ask me anything about your trading performance</p>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 bg-[#1E2536] rounded-xl border border-[#2D3548] flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-3xl ${
                    message.role === 'user'
                      ? 'bg-[#3B82F6] text-white'
                      : 'bg-[#252D42] text-[#F7FAFC]'
                  } rounded-2xl px-5 py-3`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-[#3B82F6] to-[#7C3AED] rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">🤖</span>
                      </div>
                      <span className="text-xs text-[#A0AEC0]">AI Assistant</span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-line">{message.content}</p>
                  <div className="text-xs opacity-60 mt-2">{message.timestamp}</div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-[#252D42] rounded-2xl px-5 py-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-[#2D3548]">
            <div className="flex space-x-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me anything about your trading..."
                className="flex-1 px-4 py-3 bg-[#1A1F2E] text-white rounded-lg border border-[#2D3548] focus:border-[#60A5FA] focus:outline-none"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                className={`px-6 py-3 rounded-lg font-semibold transition ${
                  inputMessage.trim()
                    ? 'bg-[#3B82F6] text-white hover:bg-[#2563EB]'
                    : 'bg-[#252D42] text-[#718096] cursor-not-allowed'
                }`}
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 space-y-6">
          {/* Quick Questions */}
          <div className="bg-[#1E2536] rounded-xl p-5 border border-[#2D3548]">
            <h3 className="text-white font-bold mb-4">💡 Quick Questions</h3>
            <div className="space-y-2">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickQuestion(question)}
                  className="w-full text-left px-4 py-3 bg-[#1A1F2E] text-[#CBD5E0] rounded-lg hover:bg-[#252D42] transition text-sm"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>

          {/* AI Capabilities */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-5 text-white">
            <h3 className="font-bold mb-3">🤖 What I Can Do</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Analyze your trading patterns</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Identify emotional triggers</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Suggest strategy improvements</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Answer performance questions</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Provide personalized insights</span>
              </li>
            </ul>
          </div>

          {/* Stats */}
          <div className="bg-[#1E2536] rounded-xl p-5 border border-[#2D3548]">
            <h3 className="text-white font-bold mb-4">📊 Quick Stats</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#A0AEC0]">Win Rate:</span>
                <span className="text-white font-bold">67.8%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A0AEC0]">Total Trades:</span>
                <span className="text-white font-bold">230</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A0AEC0]">Profit Factor:</span>
                <span className="text-white font-bold">2.43</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A0AEC0]">Best Setup:</span>
                <span className="text-[#10B981] font-bold">Breakout</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIChat;