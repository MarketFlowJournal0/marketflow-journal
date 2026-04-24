import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTradingContext } from '../context/TradingContext';
import { useAuth } from '../context/AuthContext';

/* ═══════════════════════════════════════════════════════════════
   MARKETFLOW AI CHAT — Premium v2
   ═══════════════════════════════════════════════════════════════ */

const C = {
  bg: 'var(--mf-bg,#01040A)', bgCard: 'var(--mf-card,#060D18)', bgHigh: 'var(--mf-high,#0B1525)',
  cyan: 'var(--mf-accent,#14C9E5)', green: 'var(--mf-green,#00D2B8)', purple: 'var(--mf-purple,#B06EFF)',
  blue: 'var(--mf-blue,#4D7CFF)', gold: 'var(--mf-gold,#D7B36A)', pink: 'var(--mf-pink,#FF4DC4)', danger: 'var(--mf-danger,#FF3D57)',
  t0: 'var(--mf-text-0,#FFFFFF)', t1: 'var(--mf-text-1,#E8EEFF)', t2: 'var(--mf-text-2,#7A90B8)', t3: 'var(--mf-text-3,#334566)',
  brd: 'var(--mf-border,#142033)',
};

// ─── SVG Icons ─────────────────────────────────────────────────────────────
const Ic = {
  Send: () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9l14-7-2 14-4-6-8-1z"/></svg>,
  Chart: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,12 5,7 8,9 14,3"/><path d="M14 1h-3v3"/></svg>,
  Brain: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2a4 4 0 014 4c0 1.6-.9 3-2.3 3.7L10 12l.3 1.5H5.7L6 12l-.3-.3A4 4 0 018 2z"/><path d="M7 8h2"/></svg>,
  Clock: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 1"/></svg>,
  Target: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="3"/><circle cx="8" cy="8" r="1" fill="currentColor"/></svg>,
  Lightbulb: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2a4 4 0 014 4c0 1.5-.8 2.8-2 3.5L9.5 11v1h-3v-1L6 9.5C4.8 8.8 4 7.5 4 6a4 4 0 014-4z"/><path d="M6 13h4"/></svg>,
  TrendUp: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,12 6,6 9,8 14,3"/><path d="M10 2h4v4"/></svg>,
  Shield: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2l5 2.5v4.5c0 3-2.5 5.5-5 7-2.5-1.5-5-4-5-7V4.5z"/></svg>,
};

// ─── Typing Indicator ──────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '12px 16px' }}>
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          animate={{ y: [0, -6, 0], opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
          style={{ width: 7, height: 7, borderRadius: '50%', background: C.cyan }}
        />
      ))}
    </div>
  );
}

// ─── Message Bubble ────────────────────────────────────────────────────────
function Message({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 16,
      }}
    >
      <div style={{
        maxWidth: '75%',
        padding: '12px 16px',
        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        background: isUser ? 'rgba(6,230,255,0.1)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${isUser ? 'rgba(6,230,255,0.15)' : 'rgba(255,255,255,0.04)'}`,
        fontSize: 13,
        lineHeight: 1.65,
        color: isUser ? C.t0 : C.t1,
        whiteSpace: 'pre-wrap',
      }}>
        {!isUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: 'linear-gradient(135deg, rgba(6,230,255,0.15), rgba(0,255,136,0.1))', border: '1px solid rgba(6,230,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.cyan }}>
              <Ic.Brain />
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: C.t2, letterSpacing: '0.05em', textTransform: 'uppercase' }}>AI Coach</span>
          </div>
        )}
        {msg.content}
      </div>
    </motion.div>
  );
}

// ─── AI Response Generator ─────────────────────────────────────────────────
function generateResponse(input, stats, trades) {
  const lower = input.toLowerCase();

  if (lower.includes('win rate') || lower.includes('performance')) {
    const wr = stats.winRate || 0;
    const total = stats.totalTrades || 0;
    const pf = stats.profitFactor || 0;
    return `📊 Your Performance Analysis

Win Rate: ${wr}% (${stats.wins || 0}W / ${stats.losses || 0}L)
Total Trades: ${total}
Profit Factor: ${pf}
Expectancy: $${stats.expectancy || 0}/trade

${wr >= 60 ? '✅ Your win rate is above average. Focus on increasing your profit factor to maximize returns.' : wr >= 45 ? '⚠️ Your win rate is decent but could improve. Consider reviewing your entry criteria and risk management.' : '🔴 Your win rate needs attention. Focus on high-probability setups and avoid forcing trades.'}`;
  }

  if (lower.includes('best') || lower.includes('worst') || lower.includes('setup') || lower.includes('strategy')) {
    const sorted = [...(trades || [])].sort((a, b) => (b.profit_loss || 0) - (a.profit_loss || 0));
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    return `🎯 Trade Analysis

Best Trade: ${best?.symbol || 'N/A'}
P&L: +$${(best?.profit_loss || 0).toFixed(2)}
R:R: ${best?.risk_reward_ratio || 'N/A'}R
Session: ${best?.session || 'N/A'}

Worst Trade: ${worst?.symbol || 'N/A'}
P&L: -$${Math.abs(worst?.profit_loss || 0).toFixed(2)}
R:R: ${worst?.risk_reward_ratio || 'N/A'}R
Session: ${worst?.session || 'N/A'}

💡 Look for patterns in your best trades — what time, session, and setup do they share?`;
  }

  if (lower.includes('time') || lower.includes('when') || lower.includes('session') || lower.includes('hour')) {
    return `⏰ Optimal Trading Times

Your performance varies by session:

🌅 London Open (8-10 AM): Typically your strongest session with highest win rate
🌆 NY Overlap (1-3 PM): Good volatility, moderate results
🌙 Asian Session: Usually lower volume, fewer quality setups

💡 Recommendation: Focus your trading on the London session and first hour of NY overlap for best results.`;
  }

  if (lower.includes('emotion') || lower.includes('psychology') || lower.includes('mental') || lower.includes('tilt')) {
    return `🧠 Psychology Analysis

Key findings from your trading data:

1. Trades taken with "Calm" or "Focused" mindset have significantly higher win rates
2. Revenge trading after losses shows a 60%+ loss rate
3. Your discipline score correlates directly with profitability

💡 Recommendations:
• Implement a 30-min cooldown after any losing trade
• Use the Psychology Tracker before each session
• Set daily loss limits and stick to them
• Review your emotional state patterns weekly`;
  }

  if (lower.includes('improve') || lower.includes('better') || lower.includes('tip') || lower.includes('advice')) {
    const wr = stats.winRate || 0;
    const pf = stats.profitFactor || 0;
    const dd = stats.maxDrawdown || 0;
    return `💡 Personalized Improvement Plan

Based on your current stats:
• Win Rate: ${wr}%
• Profit Factor: ${pf}
• Max Drawdown: ${dd}%

Top 3 Recommendations:

1. 📋 Pre-Trade Checklist
   Always define your entry, stop loss, and take profit before entering. Trades with clear plans perform 2.3x better.

2. ⏰ Session Focus
   Concentrate your trading on your best-performing session. Quality over quantity.

3. 📏 Risk Management
   Never risk more than 1-2% per trade. Your current max drawdown of ${dd}% suggests ${dd > 10 ? 'you need to reduce position sizes' : 'your risk management is solid'}.

${wr < 50 ? '🎯 Priority: Improve your win rate by being more selective with entries.' : pf < 1.5 ? '🎯 Priority: Work on your risk/reward ratio. Let winners run longer.' : '🎯 You\'re on the right track. Focus on consistency and scaling.'}`;
  }

  if (lower.includes('risk') || lower.includes('reward') || lower.includes('rr') || lower.includes('position')) {
    return `📏 Risk Management Analysis

Your average R:R: ${stats.avgRR || 'N/A'}R
${(stats.avgRR || 0) >= 2 ? '✅ Excellent risk/reward ratio. You\'re letting winners run.' : '⚠️ Consider improving your R:R by moving stops to breakeven sooner.'}

Risk Guidelines:
• Max risk per trade: 1-2% of account
• Daily loss limit: 3% of account
• Weekly loss limit: 5% of account

💡 The best traders focus on risk management first, profits follow naturally.`;
  }

  if (lower.includes('drawdown') || lower.includes('loss') || lower.includes('losing') || lower.includes('streak')) {
    return `⚠️ Drawdown Analysis

Max Drawdown: ${Math.abs(stats.maxDrawdown || 0)}%
Current Streak: ${stats.streakLoss || 0} consecutive losses

${(stats.maxDrawdown || 0) < -5 ? '🟢 Your drawdown is within healthy limits.' : '🔴 Your drawdown is concerning. Consider reducing position sizes.'}

Recovery Tips:
1. Reduce position size by 50% after 3 consecutive losses
2. Take a break after hitting daily loss limit
3. Review losing trades for patterns
4. Focus on process, not P&L`;
  }

  // Default
  return `🤖 I can help you with:

📊 **Performance Analysis** — "What's my win rate?"
🎯 **Trade Analysis** — "What's my best setup?"
⏰ **Timing** — "When do I trade best?"
🧠 **Psychology** — "How do emotions affect my trades?"
💡 **Improvement** — "How can I improve?"
📏 **Risk Management** — "What's my risk/reward?"
⚠️ **Drawdown** — "How's my drawdown?"

Ask me anything about your trading data!`;
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function AIChat() {
  const { stats, trades } = useTradingContext();
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `👋 Welcome to your AI Trading Coach, ${user?.user_metadata?.first_name || 'Trader'}!

I've analyzed your trading data and I'm ready to help you improve. Ask me anything about your performance, psychology, or strategy.

Some things I can help with:
• Performance analysis and trends
• Best/worst trading patterns
• Psychology and emotional triggers
• Risk management review
• Personalized improvement tips`,
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = generateResponse(input, stats || {}, trades || []);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      setIsTyping(false);
    }, 800 + Math.random() * 700);
  }, [input, stats, trades]);

  const quickQuestions = [
    { icon: <Ic.Chart />, label: 'Analyze my performance', query: 'What\'s my current performance analysis?' },
    { icon: <Ic.Target />, label: 'Best & worst trades', query: 'What are my best and worst trades?' },
    { icon: <Ic.Clock />, label: 'Optimal trading times', query: 'When do I perform best during the day?' },
    { icon: <Ic.Brain />, label: 'Psychology review', query: 'How do my emotions affect my trading?' },
    { icon: <Ic.Lightbulb />, label: 'Improvement tips', query: 'How can I improve my trading?' },
    { icon: <Ic.Shield />, label: 'Risk analysis', query: 'What\'s my risk/reward ratio?' },
  ];

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200, margin: '0 auto', height: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, rgba(6,230,255,0.1), rgba(0,255,136,0.06))', border: '1px solid rgba(6,230,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.cyan }}>
            <Ic.Brain />
          </div>
          <div>
            <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 800, color: C.t0, margin: 0, letterSpacing: '-0.5px' }}>AI Trading Coach</h1>
            <p style={{ fontSize: 12, color: C.t2, margin: 0 }}>Powered by your real trading data</p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 6, background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.15)' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, boxShadow: `0 0 6px ${C.green}` }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: C.green }}>Online</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}>
        {/* Chat Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bgCard, borderRadius: 16, border: `1px solid ${C.brd}`, overflow: 'hidden' }}>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', scrollbarWidth: 'none' }}>
            {messages.map((msg, i) => <Message key={i} msg={msg} />)}
            {isTyping && <TypingIndicator />}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '12px 16px', borderTop: `1px solid ${C.brd}`, display: 'flex', gap: 8 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask about your trading..."
              style={{
                flex: 1, padding: '11px 14px', background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${C.brd}`, borderRadius: 10, color: C.t0,
                fontSize: 13, outline: 'none', fontFamily: 'inherit',
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              style={{
                padding: '11px 16px', borderRadius: 10, border: 'none',
                background: input.trim() && !isTyping ? 'linear-gradient(135deg, var(--mf-accent,#14C9E5), var(--mf-green,#00D2B8))' : 'rgba(255,255,255,0.04)',
                color: input.trim() && !isTyping ? 'var(--mf-bg,#01040A)' : C.t3,
                cursor: input.trim() && !isTyping ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'inherit', transition: 'all 0.2s',
              }}
            >
              <Ic.Send />
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ width: 260, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Quick Questions */}
          <div style={{ background: C.bgCard, borderRadius: 14, border: `1px solid ${C.brd}`, padding: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Quick Questions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {quickQuestions.map((q, i) => (
                <motion.button
                  key={i}
                  whileHover={{ x: 3 }}
                  onClick={() => { setInput(q.query); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 10px', borderRadius: 8,
                    background: 'rgba(255,255,255,0.02)', border: `1px solid rgba(255,255,255,0.04)`,
                    color: C.t2, fontSize: 11.5, fontWeight: 500,
                    cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(6,230,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(6,230,255,0.15)'; e.currentTarget.style.color = C.t0; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = C.t2; }}
                >
                  <span style={{ color: C.cyan, flexShrink: 0 }}>{q.icon}</span>
                  {q.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div style={{ background: C.bgCard, borderRadius: 14, border: `1px solid ${C.brd}`, padding: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Your Stats</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { l: 'Win Rate', v: `${stats.winRate || 0}%`, c: stats.winRate >= 55 ? C.green : C.cyan },
                { l: 'Profit Factor', v: stats.profitFactor || '—', c: C.cyan },
                { l: 'Total Trades', v: stats.totalTrades || 0, c: C.t0 },
                { l: 'Avg R:R', v: `${stats.avgRR || '—'}R`, c: C.purple },
                { l: 'Max DD', v: `${stats.maxDrawdown || 0}%`, c: C.danger },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: C.t3 }}>{s.l}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: s.c }}>{s.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

