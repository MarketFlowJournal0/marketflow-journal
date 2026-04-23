import React, { useState, useRef, useEffect } from 'react';

const LOGO_SIMPLE = '/logo192.png';
const LOGO_FULL = '/logo192.png';

const FAQ_ANSWERS = [
  {
    keywords: ['import', 'mt4', 'mt5', 'ctrader', 'csv', 'metatrader'],
    answer: "📥 **Trade Import**\n\nYou can import your trades in 3 ways:\n• **MT4/MT5** → File > Export as CSV > drag and drop into MFJ\n• **cTrader** → History > Export CSV\n• **Excel/CSV** → Direct import from the Dashboard\n\nImport takes less than 30 seconds ✅",
  },
  {
    keywords: ['price', 'pricing', 'subscription', 'plan', 'starter', 'pro', 'elite', 'cost', 'how much'],
    answer: "💳 **Our Plans**\n\n• **Starter** — $15/month (or $11 annually)\n• **Pro** — $22/month (or $15 annually) ⭐\n• **Elite** — $38/month (or $27 annually)\n\nAll plans use a card-backed 14-day activation flow before the first paid renewal.",
  },
  {
    keywords: ['ai', 'coach', 'intelligence', 'artificial', 'analysis'],
    answer: "🧠 **AI Trade Coach**\n\nOur AI analyzes your trades after each session and:\n• Detects your recurring biases (FOMO, revenge trading…)\n• Correlates your emotional state with your P&L\n• Generates personalized recommendations every week\n\nAvailable on **Pro** and **Elite** plans.",
  },
  {
    keywords: ['backtest', 'backtesting', 'strategy', 'history'],
    answer: "🔄 **Visual Backtesting**\n\nThe Backtest module lets you:\n• Test your strategies on historical data\n• Visualize the simulated equity curve\n• Calculate Sharpe, max drawdown, CAGR\n\nAvailable on **Pro** and **Elite** plans.",
  },
  {
    keywords: ['cancel', 'cancellation', 'unsubscribe', 'unsubscription', 'refund'],
    answer: "❌ **Cancellation**\n\nYou can cancel your subscription at any time from **Settings > Manage Subscription**.\n\nAccess remains active until the end of the current period. No refunds for periods already started.",
  },
  {
    keywords: ['security', 'data', 'gdpr', 'privacy', 'encryption'],
    answer: "🔒 **Security & Privacy**\n\nAccount, subscription, and journal data are used to operate the product. Export and deletion controls are available from the journal flow.",
  },
  {
    keywords: ['prop', 'ftmo', 'funded', 'challenge', 'pdf', 'report'],
    answer: "📄 **Prop Firms**\n\nMarketFlow is perfect for prop traders!\n• **PDF report** export formatted for prop firms\n• Real-time drawdown rule tracking\n• Performance analysis by session\n\nCompatible with FTMO, The5%ers, E8, TopStep and more.",
  },
  {
    keywords: ['trial', 'free', 'free', 'trial', 'test'],
    answer: "🎁 **Free Trial**\n\nAll plans use a **14-day trial window** with billing details shown before activation.\n\nYou get access to all features of your chosen plan during the trial period 🚀",
  },
  {
    keywords: ['bug', 'problem', 'error', 'not working', 'not working', 'bug'],
    answer: "🐛 **Report a Bug**\n\nTo help us resolve issues quickly:\n1. Describe the problem in detail\n2. Specify the steps to reproduce it\n3. Indicate your browser and OS\n\nSend all that to **marketflowjournal0@gmail.com** or use the form below 👇",
  },
  {
    keywords: ['received', 'receive', 'receive', 'journal', 'email', 'mail', 'newsletter', 'receive', 'send', 'sent'],
    answer: "📬 **Delivery Issue**\n\nIf you haven't received an email from us:\n1. Check your **spam / junk folder**\n2. Add **marketflowjournal0@gmail.com** to your contacts\n3. Verify that your account email address is correct\n\nIf the issue persists, contact us directly 👇",
  },
  {
    keywords: ['account', 'password', 'login', 'connect', 'login', 'access', 'forgotten'],
    answer: "🔑 **Login Issue**\n\nIf you can't log in:\n1. Click **\"Forgot Password\"** on the login page\n2. Check your spam for the reset email\n3. Make sure you're using the correct email address\n\nStill stuck? Email us at **marketflowjournal0@gmail.com**.",
  },
  {
    keywords: ['payment', 'invoice', 'card', 'credit card', 'billing', 'billing', 'charge'],
    answer: "💳 **Payment & Billing**\n\nPayments are securely processed via **Stripe**.\n\n• Invoices are automatically sent by email\n• You can download your invoices from **Settings > Subscription**\n• For any payment disputes, contact us at **marketflowjournal0@gmail.com**",
  },
];

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'bot',
  text: "👋 Hi! I'm the **MarketFlow** assistant.\n\nI can help you with:\n• 📊 Features & Analytics\n• 💳 Subscriptions & Pricing\n• 📥 Trade Import\n• 🔒 Security & Privacy\n• 📬 Delivery Issues\n• 🔑 Login & Account\n\nHow can I help you?",
  time: new Date(),
};

const QUICK_QUESTIONS = [
  '💳 See pricing',
  '📥 Import my trades',
  '📬 Email not received',
  '🎁 Free trial?',
];

function formatText(text) {
  return text.split('\n').map((line, i, arr) => {
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return (
      <span key={i}>
        {parts.map((part, j) =>
          j % 2 === 1
            ? <strong key={j} style={{ color: '#fff', fontWeight: 700 }}>{part}</strong>
            : part
        )}
        {i < arr.length - 1 && <br />}
      </span>
    );
  });
}

function getBotAnswer(input) {
  const lower = input.toLowerCase();
  for (const faq of FAQ_ANSWERS) {
    if (faq.keywords.some(k => lower.includes(k))) {
      return faq.answer;
    }
  }
  return "I don't have a precise answer to that question 🤔\n\nBut our team is here for you! Send us an email at **marketflowjournal0@gmail.com**.\n\n⏱ Guaranteed response within **24 business hours**.";
}

export default function SupportWidget({ onOpenPage }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  const sendMessage = (text) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: text.trim(), time: new Date() }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'bot', text: getBotAnswer(text), time: new Date() }]);
    }, 900 + Math.random() * 500);
  };

  const fmtTime = (d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <style>{`
        .mfw-btn {
          position:fixed; bottom:28px; right:28px; z-index:9000;
          width:56px; height:56px; border-radius:50%;
          background:linear-gradient(135deg,var(--mf-accent,#06E6FF),var(--mf-green,#00FF88));
          border:none; cursor:pointer;
          display:flex; align-items:center; justify-content:center;
          box-shadow:0 4px 24px rgba(6,230,255,0.5);
          transition:transform 0.2s, box-shadow 0.2s;
          animation:mfw-pulse 2.5s ease-in-out infinite;
          padding:0; overflow:hidden;
        }
        .mfw-btn:hover { transform:scale(1.1); box-shadow:0 6px 32px rgba(6,230,255,0.7); }
        @keyframes mfw-pulse {
          0%,100% { box-shadow:0 4px 24px rgba(6,230,255,0.5),0 0 0 0 rgba(var(--mf-accent-rgb, 6, 230, 255),0.3); }
          50% { box-shadow:0 4px 24px rgba(6,230,255,0.5),0 0 0 10px rgba(6,230,255,0); }
        }
        .mfw-panel {
          position:fixed; bottom:96px; right:28px; z-index:9001;
          width:360px; max-height:560px;
          display:flex; flex-direction:column;
          border-radius:20px; overflow:hidden;
          background:#070D1A;
          border:1px solid rgba(6,230,255,0.18);
          box-shadow:0 24px 80px rgba(0,0,0,0.8),0 0 0 1px rgba(6,230,255,0.06);
          animation:mfw-in 0.25s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes mfw-in {
          from { opacity:0; transform:translateY(20px) scale(0.95); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        .mfw-head {
          padding:14px 16px;
          background:linear-gradient(135deg,rgba(6,230,255,0.1),rgba(0,255,136,0.05));
          border-bottom:1px solid rgba(6,230,255,0.1);
          display:flex; align-items:center; gap:11px;
          flex-shrink:0; position:relative;
        }
        .mfw-head::before {
          content:''; position:absolute; top:0; left:0; right:0; height:1px;
          background:linear-gradient(90deg,transparent,var(--mf-accent,#06E6FF),var(--mf-green,#00FF88),transparent);
        }
        .mfw-av {
          width:40px; height:40px; border-radius:50%;
          background:linear-gradient(135deg,rgba(var(--mf-accent-rgb, 6, 230, 255),0.14),rgba(var(--mf-green-rgb, 0, 255, 136),0.14));
          border:1.5px solid rgba(var(--mf-accent-rgb, 6, 230, 255),0.3);
          display:flex; align-items:center; justify-content:center;
          flex-shrink:0; overflow:hidden;
          box-shadow:0 0 14px rgba(var(--mf-accent-rgb, 6, 230, 255),0.25);
        }
        .mfw-dot {
          width:7px; height:7px; border-radius:50%;
          background:var(--mf-green,#00FF88); box-shadow:0 0 5px var(--mf-green,#00FF88);
          animation:mfw-blink 1.5s ease infinite;
        }
        @keyframes mfw-blink { 0%,100%{opacity:1;} 50%{opacity:0.25;} }
        .mfw-msgs {
          flex:1; overflow-y:auto;
          padding:14px; display:flex; flex-direction:column; gap:10px;
        }
        .mfw-msgs::-webkit-scrollbar{width:3px;}
        .mfw-msgs::-webkit-scrollbar-thumb{background:rgba(6,230,255,0.15);border-radius:2px;}
        .mfw-bubble {
          max-width:86%; padding:9px 13px;
          border-radius:14px; font-size:13px; line-height:1.65;
          animation:mfw-pop 0.18s ease;
        }
        @keyframes mfw-pop { from{opacity:0;transform:scale(0.92);} to{opacity:1;transform:scale(1);} }
        .mfw-bubble.bot {
          background:rgba(255,255,255,0.05);
          border:1px solid rgba(255,255,255,0.06);
          color:#C0D8F8; align-self:flex-start;
          border-bottom-left-radius:4px;
        }
        .mfw-bubble.user {
          background:linear-gradient(135deg,rgba(6,230,255,0.16),rgba(0,255,136,0.1));
          border:1px solid rgba(6,230,255,0.18);
          color:#E4FEFF; align-self:flex-end;
          border-bottom-right-radius:4px;
        }
        .mfw-ts { font-size:10px; color:#2A4060; margin-top:2px; }
        .mfw-typing {
          display:flex; align-items:center; gap:4px;
          padding:10px 13px;
          background:rgba(255,255,255,0.04);
          border:1px solid rgba(255,255,255,0.05);
          border-radius:14px; border-bottom-left-radius:4px;
          width:fit-content;
        }
        .mfw-typing span {
          width:5px; height:5px; border-radius:50%;
          background:var(--mf-accent,#06E6FF);
          animation:mfw-tb 0.9s ease infinite;
        }
        .mfw-typing span:nth-child(2){animation-delay:0.15s;background:#00DDFF;}
        .mfw-typing span:nth-child(3){animation-delay:0.3s;background:var(--mf-green,#00FF88);}
        @keyframes mfw-tb{0%,60%,100%{transform:translateY(0);opacity:0.4;}30%{transform:translateY(-5px);opacity:1;}}
        .mfw-quick {
          padding:8px 12px 6px;
          display:flex; flex-wrap:wrap; gap:5px;
          border-top:1px solid rgba(255,255,255,0.04);
          flex-shrink:0;
        }
        .mfw-qbtn {
          padding:4px 10px; border-radius:20px;
          border:1px solid rgba(6,230,255,0.18);
          background:rgba(6,230,255,0.05);
          color:#6AB8CC; font-size:11px; font-weight:600;
          cursor:pointer; transition:all 0.15s; font-family:inherit;
        }
        .mfw-qbtn:hover{background:rgba(6,230,255,0.12);border-color:rgba(var(--mf-accent-rgb, 6, 230, 255),0.35);color:var(--mf-accent,#06E6FF);}
        .mfw-foot {
          padding:10px 13px;
          border-top:1px solid rgba(255,255,255,0.05);
          background:rgba(4,8,18,0.9);
          flex-shrink:0;
        }
        .mfw-row { display:flex; gap:7px; align-items:flex-end; }
        .mfw-ta {
          flex:1; padding:9px 12px;
          border-radius:10px;
          background:rgba(255,255,255,0.04);
          border:1px solid rgba(255,255,255,0.07);
          color:#C0D8F8; font-size:13px; font-family:inherit;
          outline:none; resize:none;
          min-height:38px; max-height:90px; line-height:1.5;
          transition:border-color 0.2s;
        }
        .mfw-ta:focus{border-color:rgba(var(--mf-accent-rgb, 6, 230, 255),0.3);}
        .mfw-ta::placeholder{color:#2A4060;}
        .mfw-send {
          width:36px; height:36px; border-radius:9px;
          border:none; background:linear-gradient(135deg,var(--mf-accent,#06E6FF),var(--mf-green,#00FF88));
          color:#060912; cursor:pointer; flex-shrink:0;
          display:flex; align-items:center; justify-content:center;
          transition:all 0.2s;
        }
        .mfw-send:hover{transform:scale(1.08);box-shadow:0 4px 14px rgba(var(--mf-accent-rgb, 6, 230, 255),0.45);}
        .mfw-send:disabled{opacity:0.35;cursor:not-allowed;transform:none;}
        .mfw-link {
          text-align:center; padding:7px 0 0;
          font-size:10.5px; color:#2A4060;
        }
        .mfw-link button {
          background:none; border:none; color:var(--mf-accent,#06E6FF);
          font-size:10.5px; cursor:pointer; font-family:inherit;
          text-decoration:underline; padding:0;
        }
        .mfw-link button:hover{color:var(--mf-green,#00FF88);}
        .mfw-x {
          margin-left:auto; background:none; border:none;
          color:#2A4060; cursor:pointer; font-size:17px;
          line-height:1; padding:3px; transition:color 0.2s;
        }
        .mfw-x:hover{color:#7ACCDD;}
        @media(max-width:480px){
          .mfw-panel{width:calc(100vw - 32px);left:16px;bottom:78px;}
          .mfw-btn{left:16px;bottom:16px;}
        }
      `}</style>

      {/* Button */}
      <button className="mfw-btn" onClick={() => setOpen(o => !o)} aria-label="MarketFlow Support">
        {open ? (
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#060912" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#060912" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="mfw-panel">
          {/* Header */}
          <div className="mfw-head">
            <div className="mfw-av">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--mf-accent,#06E6FF)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#fff', letterSpacing: '-0.2px' }}>
                MarketFlow Assistant
              </div>
              <div style={{ fontSize: 10.5, color: '#6AB8CC', display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                <div className="mfw-dot" />
                Online · Replies instantly
              </div>
            </div>
            <button className="mfw-x" onClick={() => setOpen(false)}>✕</button>
          </div>

          {/* Messages */}
          <div className="mfw-msgs">
            {messages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div className={`mfw-bubble ${msg.role}`}>{formatText(msg.text)}</div>
                <div className="mfw-ts" style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  {fmtTime(msg.time)}
                </div>
              </div>
            ))}
            {typing && <div className="mfw-typing"><span/><span/><span/></div>}
            <div ref={bottomRef} />
          </div>

          {/* Quick questions */}
          {messages.length <= 2 && !typing && (
            <div className="mfw-quick">
              {QUICK_QUESTIONS.map((q, i) => (
                <button key={i} className="mfw-qbtn" onClick={() => sendMessage(q)}>{q}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="mfw-foot">
            <form onSubmit={e => { e.preventDefault(); sendMessage(input); }}>
              <div className="mfw-row">
                <textarea
                  ref={inputRef}
                  className="mfw-ta"
                  placeholder="Ask your question…"
                  value={input}
                  rows={1}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
                  }}
                />
                <button type="submit" className="mfw-send" disabled={!input.trim() || typing}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#060912" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
            </form>
            <div className="mfw-link">
              Need human help?{' '}
              <button onClick={() => { setOpen(false); onOpenPage?.('support'); }}>
                Full support →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


