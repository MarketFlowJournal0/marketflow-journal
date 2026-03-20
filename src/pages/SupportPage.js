import React, { useState } from 'react';

const FAQS = [
  { q: 'Comment importer mes trades MetaTrader ?', a: 'Va dans Fichier → Export CSV dans MT4/MT5, puis glisse-dépose le fichier dans MarketFlow. L\'import prend moins de 30 secondes. Nous reconnaissons automatiquement les formats MT4, MT5 et cTrader.' },
  { q: 'L\'AI Coach est-il vraiment utile pour les débutants ?', a: 'Oui, c\'est même là qu\'il est le plus efficace. Pour les débutants, il guide sur la gestion du risque et l\'identification des erreurs les plus coûteuses. Pour les traders avancés, il détecte des patterns subtils.' },
  { q: 'Puis-je utiliser MarketFlow avec une prop firm ?', a: 'Absolument. MarketFlow est conçu pour les prop traders — FTMO, The5%ers, MyForexFunds, E8, TopStep. Le rapport PDF exportable est formaté pour être envoyé directement aux prop firms.' },
  { q: 'Est-ce que mes données sont sécurisées ?', a: 'Tes données sont chiffrées AES-256 en transit et au repos. Nous sommes conformes RGPD. Tes données ne sont jamais revendues ni partagées. Tu peux exporter ou supprimer ton compte à tout moment.' },
  { q: 'Comment annuler mon abonnement ?', a: 'Tu peux annuler à tout moment depuis Paramètres → Gérer l\'abonnement. L\'accès reste actif jusqu\'à la fin de la période en cours.' },
];

const inputStyle = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
  color: '#E8EEFF', fontSize: 14, fontFamily: 'inherit', outline: 'none',
  boxSizing: 'border-box', transition: 'border-color 0.2s',
};

const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 700,
  color: '#3A5070', textTransform: 'uppercase',
  letterSpacing: '0.08em', marginBottom: 7,
};

function ContactForm({ user }) {
  const [form, setForm] = useState({
    name: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    category: 'general',
    subject: '',
    message: '',
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.message.trim()) { setError('Le message est requis.'); return; }
    setSending(true); setError('');
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, plan: user?.user_metadata?.plan || 'unknown' }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
    } catch {
      setError('Erreur lors de l\'envoi. Réessaie ou écris-nous directement.');
    } finally {
      setSending(false);
    }
  };

  if (sent) return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        background: 'linear-gradient(135deg,#06E6FF,#00FF88)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 28, margin: '0 auto 20px',
        boxShadow: '0 0 30px rgba(0,255,136,0.4)',
      }}>✓</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Message envoyé !</div>
      <div style={{ fontSize: 14, color: '#7A90B8', lineHeight: 1.7 }}>
        Merci ! On te répond sous 24h à <span style={{ color: '#06E6FF' }}>{form.email}</span>.
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Nom</label>
          <input style={inputStyle} placeholder="Ton nom" value={form.name} onChange={set('name')} />
        </div>
        <div>
          <label style={labelStyle}>Email <span style={{ color: '#06E6FF' }}>*</span></label>
          <input style={inputStyle} type="email" placeholder="ton@email.com" value={form.email} onChange={set('email')} required />
        </div>
      </div>
      <div>
        <label style={labelStyle}>Catégorie</label>
        <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.category} onChange={set('category')}>
          <option value="general">Question générale</option>
          <option value="billing">Facturation / Abonnement</option>
          <option value="technical">Problème technique</option>
          <option value="feature">Suggestion de feature</option>
          <option value="other">Autre</option>
        </select>
      </div>
      <div>
        <label style={labelStyle}>Sujet</label>
        <input style={inputStyle} placeholder="Résumé de ta demande..." value={form.subject} onChange={set('subject')} />
      </div>
      <div>
        <label style={labelStyle}>Message <span style={{ color: '#06E6FF' }}>*</span></label>
        <textarea
          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6, minHeight: 120 }}
          placeholder="Décris ta demande en détail..."
          value={form.message}
          onChange={set('message')}
          required
          rows={5}
        />
      </div>
      {error && (
        <div style={{
          padding: '10px 14px', borderRadius: 8,
          background: 'rgba(255,61,87,0.08)', border: '1px solid rgba(255,61,87,0.25)',
          color: '#FF5570', fontSize: 13,
        }}>⚠️ {error}</div>
      )}
      <button
        type="submit"
        disabled={sending}
        style={{
          padding: '14px', borderRadius: 11, border: 'none',
          background: 'linear-gradient(135deg,#06E6FF,#00FF88)',
          color: '#060912', fontSize: 14, fontWeight: 800,
          cursor: sending ? 'not-allowed' : 'pointer',
          opacity: sending ? 0.6 : 1,
          transition: 'all 0.2s', fontFamily: 'inherit',
        }}
      >
        {sending ? '⏳ Envoi en cours...' : '✉️ Envoyer le message'}
      </button>
    </form>
  );
}

export default function SupportPage({ user, onBack }) {
  const [openFaq, setOpenFaq] = useState(null);

  const plan = user?.user_metadata?.plan || 'starter';
  const responseTime = plan === 'elite' ? '< 2h' : plan === 'pro' ? '< 12h' : '< 24h';
  const priority = plan === 'elite' ? '🔴 Prioritaire' : plan === 'pro' ? '🟡 Standard' : '🟢 Normal';

  return (
    <div style={{
      minHeight: '100vh', background: '#060912',
      fontFamily: "'Inter',sans-serif", color: '#E8EEFF',
      padding: '0 24px 60px',
    }}>
      <style>{`
        .sp-faq-item { border: 1px solid #142038; border-radius: 12px; overflow: hidden; background: rgba(13,21,38,0.7); }
        .sp-faq-q { padding: 18px 22px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; font-size: 15px; font-weight: 600; color: #E8EEFF; user-select: none; transition: color 0.2s; }
        .sp-faq-q:hover { color: #06E6FF; }
        .sp-faq-a { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
        .sp-faq-a.open { max-height: 200px; }
        .sp-faq-a-inner { padding: 0 22px 18px; font-size: 14px; color: #8BA3CC; line-height: 1.75; }
        .sp-card { background: linear-gradient(145deg,rgba(13,21,38,0.9),rgba(10,15,28,0.95)); border: 1px solid #142038; border-radius: 16px; padding: 28px; }
        .sp-form-card { background: linear-gradient(145deg,rgba(12,20,34,0.98),rgba(9,14,26,0.99)); border: 1px solid rgba(6,230,255,0.12); border-radius: 20px; padding: 32px; position: relative; overflow: hidden; }
        .sp-form-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg,transparent,rgba(6,230,255,0.5),rgba(0,255,136,0.4),transparent); }
        @media (max-width: 768px) { .sp-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      {/* Header */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 0 40px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={onBack}
          style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid #142038',
            borderRadius: 10, color: '#7A90B8', cursor: 'pointer',
            padding: '8px 16px', fontSize: 13, fontWeight: 600,
            fontFamily: 'inherit', transition: 'all 0.18s',
          }}
        >
          ← Retour
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
            Centre de support
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#3A5070' }}>
            {priority} · Réponse estimée {responseTime}
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="sp-grid" style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 32, alignItems: 'start' }}>

        {/* Colonne gauche */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Infos contact */}
          <div className="sp-card">
            <div style={{ fontSize: 12, fontWeight: 700, color: '#06E6FF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
              Nous contacter
            </div>
            {[
              { icon: '📧', label: 'Email support', value: 'support@marketflowjournal.com', href: 'mailto:support@marketflowjournal.com' },
              { icon: '💬', label: 'Discord communauté', value: 'discord.gg/Cvh6H8yK8m', href: 'https://discord.gg/Cvh6H8yK8m' },
            ].map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: i === 0 ? 12 : 0 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 9,
                  background: 'rgba(6,230,255,0.08)', border: '1px solid rgba(6,230,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0,
                }}>{c.icon}</div>
                <div>
                  <div style={{ fontSize: 10, color: '#3A5070', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{c.label}</div>
                  <a href={c.href} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#06E6FF', textDecoration: 'none', fontWeight: 600 }}>{c.value}</a>
                </div>
              </div>
            ))}
            <div style={{
              marginTop: 16, padding: '10px 14px', borderRadius: 10,
              background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.15)',
              fontSize: 12, color: '#7A90B8', lineHeight: 1.6,
            }}>
              ⏱ Réponse estimée : <strong style={{ color: '#00FF88' }}>{responseTime}</strong> — Plan <strong style={{ color: '#fff', textTransform: 'capitalize' }}>{plan}</strong>
            </div>
          </div>

          {/* FAQ */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#3A5070', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              Questions fréquentes
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {FAQS.map((f, i) => (
                <div key={i} className="sp-faq-item">
                  <div className="sp-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <span>{f.q}</span>
                    <span style={{
                      color: '#3A5070', fontSize: 20, transition: 'transform 0.25s',
                      display: 'inline-block',
                      transform: openFaq === i ? 'rotate(45deg)' : 'none',
                    }}>+</span>
                  </div>
                  <div className={`sp-faq-a${openFaq === i ? ' open' : ''}`}>
                    <div className="sp-faq-a-inner">{f.a}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Colonne droite : formulaire */}
        <div className="sp-form-card">
          <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Envoie-nous un message</div>
          <div style={{ fontSize: 12, color: '#3A5070', marginBottom: 24 }}>On répond à toutes les demandes, sans exception.</div>
          <ContactForm user={user} />
        </div>

      </div>
    </div>
  );
}