import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const QUESTIONS = {
  experience: {
    label: 'Niveau de trading',
    emoji: '📊',
    options: {
      beginner:     { label: 'Débutant',       emoji: '🌱' },
      intermediate: { label: 'Intermédiaire',  emoji: '📈' },
      advanced:     { label: 'Avancé',         emoji: '🎯' },
      professional: { label: 'Professionnel',  emoji: '👑' },
    },
  },
  market: {
    label: 'Marchés tradés',
    emoji: '🌍',
    options: {
      forex:   { label: 'Forex',    emoji: '💱' },
      indices: { label: 'Indices',  emoji: '📉' },
      crypto:  { label: 'Crypto',   emoji: '₿'  },
      stocks:  { label: 'Actions',  emoji: '🏦' },
      futures: { label: 'Futures',  emoji: '⚡' },
      options: { label: 'Options',  emoji: '🔧' },
    },
  },
  style: {
    label: 'Style de trading',
    emoji: '⏱',
    options: {
      scalping:   { label: 'Scalping',     emoji: '⚡' },
      daytrading: { label: 'Day Trading',  emoji: '☀️' },
      swing:      { label: 'Swing',        emoji: '🌊' },
      position:   { label: 'Position',     emoji: '🏔️' },
    },
  },
  goal: {
    label: 'Objectif principal',
    emoji: '🎯',
    options: {
      improve:    { label: 'Améliorer performances', emoji: '🚀' },
      prop:       { label: 'Challenge prop firm',    emoji: '🏆' },
      consistent: { label: 'Devenir consistent',     emoji: '🎯' },
      manage:     { label: 'Gérer plusieurs comptes',emoji: '💼' },
    },
  },
  platform: {
    label: 'Plateforme utilisée',
    emoji: '💻',
    options: {
      mt4:         { label: 'MetaTrader 4',  emoji: '📟' },
      mt5:         { label: 'MetaTrader 5',  emoji: '📟' },
      ctrader:     { label: 'cTrader',       emoji: '💹' },
      tradingview: { label: 'TradingView',   emoji: '📊' },
      ninjatrader: { label: 'NinjaTrader',   emoji: '🥷' },
      other:       { label: 'Autre',         emoji: '🔧' },
    },
  },
};

const COLORS = ['#06E6FF', '#00FF88', '#B06EFF', '#FF4DC4', '#FFD700', '#FF6B35'];

function BarChart({ data, total, colors }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {data.map((item, i) => {
        const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
        const width = max > 0 ? (item.count / max) * 100 : 0;
        return (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 22, fontSize: 14, textAlign: 'center', flexShrink: 0 }}>
              {item.emoji}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#C0D8F8' }}>{item.label}</span>
                <span style={{ fontSize: 12, color: colors[i % colors.length], fontWeight: 700 }}>
                  {pct}% <span style={{ color: '#334566', fontWeight: 400 }}>({item.count})</span>
                </span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${width}%`,
                  background: `linear-gradient(90deg, ${colors[i % colors.length]}, ${colors[(i+1) % colors.length]})`,
                  borderRadius: 4,
                  transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                  boxShadow: `0 0 8px ${colors[i % colors.length]}44`,
                }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function OnboardingStats({ onBack }) {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [total,   setTotal]   = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('onboarding')
          .not('onboarding', 'is', null);

        if (error) throw error;

        const responses = data.map(r => r.onboarding).filter(Boolean);
        setTotal(responses.length);

        // Calculer les stats pour chaque question
        const computed = {};
        Object.keys(QUESTIONS).forEach(qKey => {
          const q = QUESTIONS[qKey];
          const counts = {};
          Object.keys(q.options).forEach(optKey => { counts[optKey] = 0; });

          responses.forEach(r => {
            const val = r[qKey];
            if (!val) return;
            if (Array.isArray(val)) {
              val.forEach(v => { if (counts[v] !== undefined) counts[v]++; });
            } else {
              if (counts[val] !== undefined) counts[val]++;
            }
          });

          // Trier du + au - fréquent
          computed[qKey] = Object.entries(counts)
            .map(([id, count]) => ({
              id,
              count,
              label: q.options[id]?.label || id,
              emoji: q.options[id]?.emoji || '•',
            }))
            .sort((a, b) => b.count - a.count);
        });

        setStats(computed);
      } catch (err) {
        console.error('Stats error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div style={{
      minHeight: '100vh', background: '#060912',
      fontFamily: "'Inter', sans-serif", color: '#E8EEFF',
      padding: '0 24px 60px',
    }}>
      <style>{`
        .os-card {
          background: linear-gradient(145deg, rgba(13,21,38,0.95), rgba(10,15,28,0.98));
          border: 1px solid #142038;
          border-radius: 18px;
          padding: 24px;
          position: relative;
          overflow: hidden;
        }
        .os-card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(6,230,255,0.3), transparent);
        }
        @media (max-width: 768px) { .os-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      {/* Header */}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 0 36px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={onBack} style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid #142038',
          borderRadius: 10, color: '#7A90B8', cursor: 'pointer',
          padding: '8px 16px', fontSize: 13, fontWeight: 600,
          fontFamily: 'inherit', transition: 'all 0.18s',
        }}>← Retour</button>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-0.4px' }}>
            📋 Données Onboarding
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#3A5070' }}>
            {loading ? 'Chargement...' : `${total} réponse${total > 1 ? 's' : ''} collectée${total > 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#3A5070' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          Chargement des données...
        </div>
      ) : total === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#3A5070' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
          <div style={{ fontSize: 16, color: '#7A90B8', fontWeight: 600 }}>Aucune donnée onboarding pour l'instant</div>
          <div style={{ fontSize: 13, marginTop: 8 }}>Les réponses apparaîtront ici après les premières inscriptions.</div>
        </div>
      ) : (
        <div className="os-grid" style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {Object.entries(QUESTIONS).map(([qKey, q], qi) => {
            const data = stats?.[qKey] || [];
            const qTotal = data.reduce((s, d) => s + d.count, 0);
            const top = data[0];
            return (
              <div key={qKey} className="os-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `rgba(${qi % 2 === 0 ? '6,230,255' : '0,255,136'},0.1)`,
                    border: `1px solid rgba(${qi % 2 === 0 ? '6,230,255' : '0,255,136'},0.2)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, flexShrink: 0,
                  }}>{q.emoji}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{q.label}</div>
                    {top && (
                      <div style={{ fontSize: 11, color: '#3A5070', marginTop: 2 }}>
                        Top : <span style={{ color: COLORS[0], fontWeight: 600 }}>{top.emoji} {top.label}</span>
                        <span style={{ color: '#2A4060' }}> ({qTotal > 0 ? Math.round((top.count / qTotal) * 100) : 0}%)</span>
                      </div>
                    )}
                  </div>
                </div>
                <BarChart data={data} total={qTotal} colors={COLORS} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}