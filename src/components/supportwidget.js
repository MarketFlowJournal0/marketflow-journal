import React, { useState, useRef, useEffect } from 'react';

// ─── FAQ réponses automatiques ────────────────────────────────────────────────
const FAQ_ANSWERS = [
  {
    keywords: ['import', 'mt4', 'mt5', 'ctrader', 'csv', 'metatrader'],
    answer: "📥 **Import de trades**\n\nTu peux importer tes trades de 3 façons :\n• **MT4/MT5** → Fichier > Exporter en CSV > glisser-déposer dans MFJ\n• **cTrader** → Historique > Export CSV\n• **Excel/CSV** → Import direct depuis le Dashboard\n\nL'import prend moins de 30 secondes ✅",
  },
  {
    keywords: ['prix', 'tarif', 'abonnement', 'plan', 'starter', 'pro', 'elite', 'coût', 'combien'],
    answer: "💳 **Nos plans**\n\n• **Starter** — $15/mois (ou $11 annuel)\n• **Pro** — $22/mois (ou $15 annuel) ⭐\n• **Elite** — $38/mois (ou $27 annuel)\n\nTous les plans incluent **14 jours gratuits**, sans carte bancaire 🎉",
  },
  {
    keywords: ['ai', 'coach', 'intelligence', 'artificielle', 'analyse'],
    answer: "🧠 **AI Trade Coach**\n\nNotre IA analyse tes trades après chaque session et :\n• Détecte tes biais récurrents (FOMO, revenge trading…)\n• Corrèle ton état émotionnel avec ton P&L\n• Génère des recommandations personnalisées chaque semaine\n\nDisponible sur les plans **Pro** et **Elite**.",
  },
  {
    keywords: ['backtest', 'backtesting', 'stratégie', 'historique'],
    answer: "🔄 **Backtesting visuel**\n\nLe module Backtest te permet de :\n• Tester tes stratégies sur données historiques\n• Visualiser l'equity curve simulée\n• Calculer Sharpe, max drawdown, CAGR\n\nDisponible sur les plans **Pro** et **Elite**.",
  },
  {
    keywords: ['annuler', 'annulation', 'résilier', 'résiliation', 'remboursement'],
    answer: "❌ **Annulation**\n\nTu peux annuler ton abonnement à tout moment depuis **Paramètres > Gérer l'abonnement**.\n\nL'accès reste actif jusqu'à la fin de la période en cours. Aucun remboursement pour les périodes entamées.",
  },
  {
    keywords: ['sécurité', 'données', 'rgpd', 'confidentialité', 'chiffrement'],
    answer: "🔒 **Sécurité & RGPD**\n\nTes données sont :\n• Chiffrées AES-256 en transit et au repos\n• Hébergées dans l'UE (Supabase EU)\n• Jamais vendues ni partagées\n\nTu peux exporter ou supprimer ton compte à tout moment.",
  },
  {
    keywords: ['prop', 'ftmo', 'funded', 'challenge', 'pdf', 'rapport'],
    answer: "📄 **Prop Firms**\n\nMarketFlow est parfait pour les prop traders !\n• Export **rapport PDF** formaté pour les prop firms\n• Suivi des règles de drawdown en temps réel\n• Analyse des performances par session\n\nCompatible FTMO, The5%ers, E8, TopStep et plus.",
  },
  {
    keywords: ['essai', 'gratuit', 'free', 'trial', 'tester'],
    answer: "🎁 **Essai gratuit**\n\nOui ! Tous les plans incluent **14 jours d'essai gratuit**, sans carte bancaire requise.\n\nTu as accès à toutes les fonctionnalités du plan choisi pendant la période d'essai 🚀",
  },
  {
    keywords: ['bug', 'problème', 'erreur', 'marche pas', 'fonctionne pas'],
    answer: "🐛 **Signaler un bug**\n\nPour nous aider à résoudre rapidement :\n1. Décris le problème en détail\n2. Précise les étapes pour le reproduire\n3. Indique ton navigateur et OS\n\nEnvoie tout ça à **support@marketflowjournal.com** ou utilise le formulaire 👇",
  },
];

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'bot',
  text: "👋 Bonjour ! Je suis l'assistant **MarketFlow**.\n\nJe peux répondre à tes questions sur :\n• 📊 Fonctionnalités & Analytics\n• 💳 Abonnements & Pricing\n• 📥 Import de trades\n• 🔒 Sécurité & RGPD\n\nComment puis-je t'aider ?",
  time: new Date(),
};

const QUICK_QUESTIONS = [
  '💳 Voir les prix',
  '📥 Importer mes trades',
  '🧠 AI Coach ?',
  '🎁 Essai gratuit ?',
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
  return "Je n'ai pas de réponse précise à cette question 🤔\n\nMais notre équipe est là pour toi ! Envoie-nous un email à **support@marketflowjournal.com**.\n\n⏱ Réponse garantie sous **24h ouvrées**.";
}

export default function SupportWidget({ onOpenPage }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
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
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'bot',
        text: getBotAnswer(text),
        time: new Date(),
      }]);
    }, 900 + Math.random() * 500);
  };

  const fmtTime = (d) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <style>{`
        .mfw-btn {
          position:fixed; bottom:28px; right:28px; z-index:9000;
          width:56px; height:56px; border-radius:50%;
          background:linear-gradient(135deg,#06E6FF,#00FF88);
          border:none; cursor:pointer;
          display:flex; align-items:center; justify-content:center;
          box-shadow:0 4px 24px rgba(6,230,255,0.5);
          transition:transform 0.2s, box-shadow 0.2s;
          animation:mfw-pulse 2.5s ease-in-out infinite;
        }
        .mfw-btn:hover { transform:scale(1.1); box-shadow:0 6px 32px rgba(6,230,255,0.7); }
        @keyframes mfw-pulse {
          0%,100% { box-shadow:0 4px 24px rgba(6,230,255,0.5),0 0 0 0 rgba(6,230,255,0.3); }
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
          background:linear-gradient(90deg,transparent,#06E6FF,#00FF88,transparent);
        }
        .mfw-av {
          width:38px; height:38px; border-radius:50%;
          background:linear-gradient(135deg,#06E6FF,#00FF88);
          display:flex; align-items:center; justify-content:center;
          font-size:17px; flex-shrink:0;
          box-shadow:0 0 14px rgba(6,230,255,0.35);
        }
        .mfw-dot {
          width:7px; height:7px; border-radius:50%;
          background:#00FF88; box-shadow:0 0 5px #00FF88;
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
          background:#06E6FF;
          animation:mfw-tb 0.9s ease infinite;
        }
        .mfw-typing span:nth-child(2){animation-delay:0.15s;background:#00DDFF;}
        .mfw-typing span:nth-child(3){animation-delay:0.3s;background:#00FF88;}
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
        .mfw-qbtn:hover{background:rgba(6,230,255,0.12);border-color:rgba(6,230,255,0.35);color:#06E6FF;}
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
        .mfw-ta:focus{border-color:rgba(6,230,255,0.3);}
        .mfw-ta::placeholder{color:#2A4060;}
        .mfw-send {
          width:36px; height:36px; border-radius:9px;
          border:none; background:linear-gradient(135deg,#06E6FF,#00FF88);
          color:#060912; cursor:pointer; flex-shrink:0;
          display:flex; align-items:center; justify-content:center;
          transition:all 0.2s;
        }
        .mfw-send:hover{transform:scale(1.08);box-shadow:0 4px 14px rgba(6,230,255,0.45);}
        .mfw-send:disabled{opacity:0.35;cursor:not-allowed;transform:none;}
        .mfw-link {
          text-align:center; padding:7px 0 0;
          font-size:10.5px; color:#2A4060;
        }
        .mfw-link button {
          background:none; border:none; color:#06E6FF;
          font-size:10.5px; cursor:pointer; font-family:inherit;
          text-decoration:underline; padding:0;
        }
        .mfw-link button:hover{color:#00FF88;}
        .mfw-x {
          margin-left:auto; background:none; border:none;
          color:#2A4060; cursor:pointer; font-size:17px;
          line-height:1; padding:3px; transition:color 0.2s;
        }
        .mfw-x:hover{color:#7ACCDD;}
        @media(max-width:480px){
          .mfw-panel{width:calc(100vw - 32px);right:16px;bottom:78px;}
          .mfw-btn{right:16px;bottom:16px;}
        }
      `}</style>

      {/* Bouton */}
      <button className="mfw-btn" onClick={() => setOpen(o => !o)} aria-label="Support MarketFlow">
        {open ? (
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#060912" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        ) : (
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#060912" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="mfw-panel">

          {/* Header */}
          <div className="mfw-head">
            <div className="mfw-av">🧠</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#fff', letterSpacing: '-0.2px' }}>
                Assistant MarketFlow
              </div>
              <div style={{ fontSize: 10.5, color: '#6AB8CC', display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                <div className="mfw-dot" />
                En ligne · Répond instantanément
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
            {typing && (
              <div className="mfw-typing"><span/><span/><span/></div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Questions rapides */}
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
                  placeholder="Pose ta question…"
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
              Besoin d'aide humaine ?{' '}
              <button onClick={() => { setOpen(false); onOpenPage?.('support'); }}>
                Support complet →
              </button>
            </div>
          </div>

        </div>
      )}
    </>
  );
}