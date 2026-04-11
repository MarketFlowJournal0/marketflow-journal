import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

/* ── Logo icon ── */
const LOGO_ICON = "/logo192.png";

/* ── Knowledge base for smart responses ── */
const KNOWLEDGE = {
  pricing: {
    keywords: ['price', 'cost', 'how much', 'plan', 'starter', 'pro', 'elite', 'subscription', 'pay', 'pricing', 'fee', 'fees'],
    response: "MarketFlow Journal offers 3 plans:\n\n\u2022 Starter: $15/mo or $11/mo annually\n\u2022 Pro: $22/mo or $15/mo annually\n\u2022 Elite: $38/mo or $27/mo annually\n\nAll plans include a free trial. You can manage your subscription in Account Settings.",
  },
  import: {
    keywords: ['import', 'csv', 'upload', 'upload', 'broker', 'mt4', 'mt5', 'metatrader', 'export', 'trades', 'load'],
    response: "You can import your trades in several ways:\n\n\u2022 Universal CSV Import (All Trades page) - compatible with any broker\n\u2022 MetaTrader 4/5 auto-sync via our EA (Connections > Brokers)\n\u2022 Manual trade entry\n\nThe CSV importer auto-detects separators and maps columns automatically.",
  },
  ai: {
    keywords: ['ai', 'intelligence', 'coach', 'analysis', 'analyze', 'pattern', 'bias', 'psychology'],
    response: "MarketFlow Journal includes powerful AI tools:\n\n\u2022 AI Coach - analyzes your trading patterns and psychological biases\n\u2022 Psychology dashboard - tracks emotional patterns and performance\n\u2022 Smart trade analysis with pattern recognition\n\nI'm here to help you right now too!",
  },
  backtest: {
    keywords: ['backtest', 'back test', 'historical', 'strategy', 'test'],
    response: "The Backtest module lets you test strategies on historical data with visual charts. Access it from the Trading section in the sidebar.",
  },
  cancel: {
    keywords: ['cancel', 'refund', 'unsubscribe', 'stop'],
    response: "You can cancel your subscription anytime from Account Settings > Manage Plan. You'll keep access until the end of your billing period.\n\nFor refund requests, please contact our support team.",
  },
  support: {
    keywords: ['support', 'help', 'problem', 'bug', 'error', 'issue', 'contact', 'email'],
    response: "I can help with most questions! For specific issues:\n\n\u2022 Technical bugs or feature requests: use the Support page\n\u2022 Account issues: check Account Settings\n\u2022 General questions: just ask me!\n\nYou can also reach us at marketflowjournal0@gmail.com",
  },
  prop: {
    keywords: ['prop', 'ftmo', 'the5%ers', 'topstep', 'funding', 'funded', 'firm', 'challenge'],
    response: "MarketFlow Journal is designed with prop firm traders in mind. You can:\n\n\u2022 Track multiple prop firm accounts\n\u2022 Monitor challenge progress\n\u2022 Generate prop firm-style reports\n\u2022 Track rules compliance (drawdown, daily loss, etc.)",
  },
  features: {
    keywords: ['feature', 'functionality', 'what can', 'capable', 'offer', 'offers'],
    response: "MarketFlow Journal features:\n\n\u2022 Complete trade journal with analytics\n\u2022 Universal CSV import from any broker\n\u2022 MT4/MT5 auto-sync\n\u2022 AI Trade Coach & Psychology analysis\n\u2022 Visual backtesting\n\u2022 Equity curve tracking\n\u2022 Calendar view\n\u2022 Multi-account support\n\u2022 Prop firm tracking\n\u2022 PDF report exports",
  },
  account: {
    keywords: ['account', 'login', 'signin', 'register', 'signup', 'sign in', 'sign up'],
    response: "You can sign up with:\n\n\u2022 Email & password\n\u2022 Google account\n\u2022 GitHub account\n\nAfter signup, you'll go through onboarding and can choose your plan. Your account settings are accessible from the sidebar.",
  },
};

function getSmartResponse(message, userData, trades, profile) {
  const lower = message.toLowerCase();

  // Check knowledge base
  for (const [, entry] of Object.entries(KNOWLEDGE)) {
    if (entry.keywords.some(kw => lower.includes(kw))) {
      return entry.response;
    }
  }

  // Personal data queries
  if (lower.includes('my trades') || lower.includes('my trade') || lower.includes('how many') || lower.includes('how much')) {
    if (trades && trades.length > 0) {
      const wins = trades.filter(t => t.pnl > 0).length;
      const losses = trades.filter(t => t.pnl <= 0).length;
      const totalPnl = trades.reduce((s, t) => s + (t.pnl || 0), 0);
      const wr = ((wins / trades.length) * 100).toFixed(1);
      return `Here are your stats:\n\n\u2022 Total trades: ${trades.length}\n\u2022 Wins: ${wins} | Losses: ${losses}\n\u2022 Win rate: ${wr}%\n\u2022 Total P&L: $${totalPnl.toFixed(2)}\n\nWant me to analyze anything specific?`;
    }
    return "I don't see any trades in your journal yet. Import your trades via All Trades > Import to get started!";
  }

  if (lower.includes('win rate') || lower.includes('performance')) {
    if (trades && trades.length > 0) {
      const wins = trades.filter(t => t.pnl > 0).length;
      const wr = ((wins / trades.length) * 100).toFixed(1);
      const totalPnl = trades.reduce((s, t) => s + (t.pnl || 0), 0);
      const avgWin = trades.filter(t => t.pnl > 0).reduce((s, t) => s + t.pnl, 0) / (wins || 1);
      const avgLoss = Math.abs(trades.filter(t => t.pnl <= 0).reduce((s, t) => s + t.pnl, 0) / ((trades.length - wins) || 1));
      return `Your performance:\n\n\u2022 Win rate: ${wr}%\n\u2022 Avg win: $${avgWin.toFixed(2)}\n\u2022 Avg loss: $${avgLoss.toFixed(2)}\n\u2022 Total P&L: $${totalPnl.toFixed(2)}\n\n${parseFloat(wr) >= 55 ? 'Great win rate! Keep it up.' : 'Focus on improving your entry timing.'}`;
    }
    return "No trade data yet. Import your trades first!";
  }

  if (lower.includes('best') || lower.includes('worst') || lower.includes('top') || lower.includes('biggest loss') || lower.includes('best trade')) {
    if (trades && trades.length > 0) {
      const sorted = [...trades].sort((a, b) => (b.pnl || 0) - (a.pnl || 0));
      const best = sorted[0];
      const worst = sorted[sorted.length - 1];
      return `Your best trade: ${best.symbol || 'N/A'} - $${(best.pnl || 0).toFixed(2)}\nYour worst trade: ${worst.symbol || 'N/A'} - $${(worst.pnl || 0).toFixed(2)}`;
    }
    return "No trades to analyze yet.";
  }

  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey') || lower.includes('greetings') || lower.includes('good morning')) {
    const name = userData?.user_metadata?.first_name || userData?.email?.split('@')[0] || 'Trader';
    return `Hey ${name}! I'm your MarketFlow AI assistant. I have access to all your trading data and can help with:\n\n\u2022 Trade analysis & stats\n\u2022 Performance insights\n\u2022 Platform questions\n\u2022 Technical support\n\nWhat can I help you with?`;
  }

  if (lower.includes('thank')) {
    return "Happy to help! Let me know if you need anything else.";
  }

  // Default - intelligent fallback
  return "I can help you with:\n\n\u2022 Your trading stats & performance\n\u2022 Platform features & how-to\n\u2022 Pricing & subscription info\n\u2022 Import & broker connections\n\u2022 Technical support\n\nTry asking about your win rate, best trades, or any feature!";
}

/* ═══════════════════════════════════════════════════════════════
   AI CHATBOT COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function AIChatBot() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [trades, setTrades] = useState([]);
  const [profile, setProfile] = useState(null);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  /* Load user data on open */
  useEffect(() => {
    if (!open || !user) return;
    let mounted = true;

    const loadData = async () => {
      try {
        const { data: p } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (mounted) setProfile(p);
      } catch (_) {}

      try {
        const { data: t } = await supabase
          .from('trades')
          .select('*')
          .eq('user_id', user.id)
          .limit(500);
        if (mounted) setTrades(t || []);
      } catch (_) {}
    };

    loadData();
    return () => { mounted = false; };
  }, [open, user]);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setTyping(true);

    /* Simulate thinking delay */
    await new Promise(r => setTimeout(r, 600 + Math.random() * 800));

    const response = getSmartResponse(userMsg, user, trades, profile);
    setTyping(false);
    setMessages(prev => [...prev, { role: 'bot', text: response }]);
  };

  if (!user) return null;

  return (
    <>
      {/* Toggle button - bottom right */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          width: 52,
          height: 52,
          borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(6,230,255,0.15), rgba(0,255,136,0.1))',
          border: '1px solid rgba(var(--mf-accent-rgb, 6, 230, 255),0.2)',
          cursor: 'pointer',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 24px rgba(6,230,255,0.15), 0 0 0 1px rgba(6,230,255,0.05)',
          backdropFilter: 'blur(12px)',
          overflow: 'hidden',
        }}
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="rgba(6,230,255,0.8)" strokeWidth="2" strokeLinecap="round">
            <line x1="4" y1="4" x2="14" y2="14"/>
            <line x1="14" y1="4" x2="4" y2="14"/>
          </svg>
        ) : (
          <div style={{ width: 28, height: 28, borderRadius: 7, overflow: 'hidden', opacity: 0.85 }}>
            <img src={LOGO_ICON} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }}/>
          </div>
        )}
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              bottom: 80,
              right: 20,
              width: 380,
              height: 520,
              background: '#060C18',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16,
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 12px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.02)',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '14px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexShrink: 0,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9, overflow: 'hidden',
                border: '1px solid rgba(6,230,255,0.15)',
              }}>
                <img src={LOGO_ICON} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 2 }}/>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--mf-text-1,#E8EEFF)' }}>MarketFlow AI</div>
                <div style={{ fontSize: 10, color: 'var(--mf-green,#00FF88)', fontWeight: 500 }}>Online</div>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: 9, color: 'var(--mf-text-3,#334566)', fontWeight: 500 }}>
                {trades.length} trades loaded
              </div>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              scrollbarWidth: 'none',
            }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--mf-text-3,#334566)' }}>
                  <div style={{ fontSize: 28, marginBottom: 12 }}>
                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="rgba(var(--mf-accent-rgb, 6, 230, 255),0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto', display: 'block' }}>
                      <path d="M6 8A3 3 0 019 5h18a3 3 0 013 3v14a3 3 0 01-3 3H15l-6 5V8z"/>
                      <circle cx="13" cy="15" r="1.5" fill="rgba(var(--mf-accent-rgb, 6, 230, 255),0.2)" stroke="none"/>
                      <circle cx="18" cy="15" r="1.5" fill="rgba(var(--mf-accent-rgb, 6, 230, 255),0.2)" stroke="none"/>
                      <circle cx="23" cy="15" r="1.5" fill="rgba(var(--mf-accent-rgb, 6, 230, 255),0.2)" stroke="none"/>
                    </svg>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--mf-text-2,#7A90B8)', marginBottom: 6 }}>Ask me anything</div>
                  <div style={{ fontSize: 11, lineHeight: 1.5 }}>
                    Your stats, performance, platform help, or just chat
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                }}>
                  <div style={{
                    padding: '9px 13px',
                    borderRadius: m.role === 'user' ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
                    background: m.role === 'user' ? 'rgba(6,230,255,0.12)' : 'rgba(255,255,255,0.04)',
                    border: m.role === 'user' ? '1px solid rgba(6,230,255,0.15)' : '1px solid rgba(255,255,255,0.04)',
                    fontSize: 12.5,
                    lineHeight: 1.55,
                    color: m.role === 'user' ? 'var(--mf-text-1,#E8EEFF)' : 'rgba(255,255,255,0.7)',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {m.text}
                  </div>
                </div>
              ))}

              {typing && (
                <div style={{ alignSelf: 'flex-start' }}>
                  <div style={{
                    padding: '9px 13px',
                    borderRadius: '12px 12px 12px 3px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.04)',
                    display: 'flex',
                    gap: 4,
                    alignItems: 'center',
                  }}>
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                        style={{
                          width: 5, height: 5, borderRadius: '50%',
                          background: 'rgba(6,230,255,0.4)',
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div style={{
              padding: '10px 12px',
              borderTop: '1px solid rgba(255,255,255,0.04)',
              display: 'flex',
              gap: 8,
              flexShrink: 0,
            }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Ask anything..."
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 9,
                  color: 'var(--mf-text-1,#E8EEFF)',
                  fontSize: 12.5,
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
              <button
                onClick={send}
                disabled={!input.trim() || typing}
                style={{
                  padding: '9px 14px',
                  background: input.trim() && !typing ? 'linear-gradient(135deg, var(--mf-accent,#06E6FF), var(--mf-green,#00FF88))' : 'rgba(255,255,255,0.04)',
                  border: 'none',
                  borderRadius: 9,
                  cursor: input.trim() && !typing ? 'pointer' : 'default',
                  color: input.trim() && !typing ? 'var(--mf-bg,#030508)' : 'var(--mf-text-3,#334566)',
                  fontWeight: 600,
                  fontSize: 12,
                  transition: 'all 0.15s ease',
                  fontFamily: 'inherit',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 8l12-6-3 14-3-6-6-2z"/>
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

