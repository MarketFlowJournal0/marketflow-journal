import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getOnboardingAnswers, getOnboardingMeta } from '../lib/onboarding';

const QUESTIONS = {
  experience: {
    label: 'Trading Level',
    emoji: 'LVL',
    options: {
      beginner:     { label: 'Beginner',       emoji: 'B' },
      intermediate: { label: 'Intermediate',   emoji: 'I' },
      advanced:     { label: 'Advanced',       emoji: 'A' },
      professional: { label: 'Professional',   emoji: 'P' },
    },
  },
  market: {
    label: 'Traded Markets',
    emoji: 'MKT',
    options: {
      forex:   { label: 'Forex',   emoji: 'FX' },
      indices: { label: 'Indices', emoji: 'IDX' },
      crypto:  { label: 'Crypto',  emoji: 'CRY' },
      stocks:  { label: 'Stocks',  emoji: 'STK' },
      futures: { label: 'Futures', emoji: 'FUT' },
      options: { label: 'Options', emoji: 'OPT' },
    },
  },
  style: {
    label: 'Trading Style',
    emoji: 'STY',
    options: {
      scalping:   { label: 'Scalping',    emoji: 'SCL' },
      daytrading: { label: 'Day Trading', emoji: 'DAY' },
      swing:      { label: 'Swing',       emoji: 'SWG' },
      position:   { label: 'Position',    emoji: 'POS' },
    },
  },
  goal: {
    label: 'Main Goal',
    emoji: 'GOAL',
    options: {
      improve:    { label: 'Improve Performance',     emoji: 'IMP' },
      prop:       { label: 'Prop Firm Challenge',     emoji: 'PROP' },
      consistent: { label: 'Become Consistent',       emoji: 'CONS' },
      manage:     { label: 'Manage Multiple Accounts',emoji: 'MULTI' },
    },
  },
  platform: {
    label: 'Platform Used',
    emoji: 'PLAT',
    options: {
      mt4:         { label: 'MetaTrader 4', emoji: 'MT4' },
      mt5:         { label: 'MetaTrader 5', emoji: 'MT5' },
      ctrader:     { label: 'cTrader',      emoji: 'CTR' },
      tradingview: { label: 'TradingView',  emoji: 'TV' },
      ninjatrader: { label: 'NinjaTrader',  emoji: 'NT' },
      other:       { label: 'Other',        emoji: 'OTH' },
    },
  },
};

const COLORS = ['#14C9E5', '#00D2B8', '#DCE4EF', '#6885FF', '#D7B36A', '#DF5F7A'];

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
  const [recentResponses, setRecentResponses] = useState([]);
  const [insights, setInsights] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('email, plan, onboarding')
          .not('onboarding', 'is', null);

        if (error) throw error;

        const responses = data
          .map((row) => ({
            email: row.email || '',
            plan: row.plan || 'trial',
            answers: getOnboardingAnswers(row.onboarding),
            meta: getOnboardingMeta(row.onboarding),
            classified: row.onboarding?.classified || {},
            analytics: row.onboarding?.analytics || {},
            recommendations: row.onboarding?.recommendations || {},
          }))
          .filter((row) => Object.values(row.answers || {}).some((value) => (Array.isArray(value) ? value.length > 0 : Boolean(value))));
        setTotal(responses.length);
        setRecentResponses(
          [...responses]
            .sort((left, right) => new Date(right.meta?.completedAt || 0) - new Date(left.meta?.completedAt || 0))
            .slice(0, 8)
        );

        const segments = {};
        const recommendedPlans = {};
        let complexityTotal = 0;
        let complexityCount = 0;
        let professionalSignalTotal = 0;

        responses.forEach((row) => {
          const segment = row.analytics?.traderSegment || 'unclassified';
          const recommendedPlan = row.recommendations?.initialPlan || row.meta?.summary?.recommendedPlan || 'starter';
          segments[segment] = (segments[segment] || 0) + 1;
          recommendedPlans[recommendedPlan] = (recommendedPlans[recommendedPlan] || 0) + 1;
          if (typeof row.analytics?.complexityScore === 'number') {
            complexityTotal += row.analytics.complexityScore;
            complexityCount += 1;
          }
          professionalSignalTotal += row.analytics?.professionalSignals || 0;
        });

        const sortEntries = (source) => Object.entries(source)
          .map(([id, count]) => ({ id, label: id.replace(/_/g, ' '), count, emoji: 'MF' }))
          .sort((a, b) => b.count - a.count);

        setInsights({
          avgComplexity: complexityCount ? Math.round(complexityTotal / complexityCount) : 0,
          professionalSignalTotal,
          segments: sortEntries(segments),
          recommendedPlans: sortEntries(recommendedPlans),
        });

        // Calculate stats for each question
        const computed = {};
        Object.keys(QUESTIONS).forEach(qKey => {
          const q = QUESTIONS[qKey];
          const counts = {};
          Object.keys(q.options).forEach(optKey => { counts[optKey] = 0; });

          responses.forEach(r => {
            const val = r.answers?.[qKey];
            if (!val) return;
            if (Array.isArray(val)) {
              val.forEach(v => { if (counts[v] !== undefined) counts[v]++; });
            } else {
              if (counts[val] !== undefined) counts[val]++;
            }
          });

          // Sort from most to least frequent
          computed[qKey] = Object.entries(counts)
            .map(([id, count]) => ({
              id,
              count,
              label: q.options[id]?.label || id,
              emoji: q.options[id]?.emoji || '-',
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
      minHeight: '100vh', background: '#01040A',
      fontFamily: "'Inter', sans-serif", color: '#E8EEFF',
      padding: '0 24px 60px',
    }}>
      <style>{`
        .os-card {
          background: linear-gradient(145deg, rgba(6,13,24,0.95), rgba(2,5,11,0.98));
          border: 1px solid #142038;
          border-radius: 18px;
          padding: 24px;
          position: relative;
          overflow: hidden;
        }
        .os-card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(20,201,229,0.25), transparent);
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
        }}>Back</button>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-0.4px' }}>Onboarding Data</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#3A5070' }}>
            {loading ? 'Loading...' : `${total} response${total > 1 ? 's' : ''} collected`}
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#3A5070' }}>
          Loading data...
        </div>
      ) : total === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#3A5070' }}>
          <div style={{ fontSize: 16, color: '#7A90B8', fontWeight: 600 }}>No onboarding data yet</div>
          <div style={{ fontSize: 13, marginTop: 8 }}>Responses will appear here after the first sign-ups.</div>
        </div>
      ) : (
        <div className="os-grid" style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="os-card" style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <div style={{ padding: 16, borderRadius: 14, background: 'rgba(20,201,229,0.06)', border: '1px solid rgba(20,201,229,0.14)' }}>
                <div style={{ fontSize: 10, color: '#7A90B8', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 800 }}>Average complexity</div>
                <div style={{ marginTop: 8, fontSize: 30, color: '#14C9E5', fontWeight: 900 }}>{insights?.avgComplexity || 0}/100</div>
              </div>
              <div style={{ padding: 16, borderRadius: 14, background: 'rgba(0,210,184,0.06)', border: '1px solid rgba(0,210,184,0.14)' }}>
                <div style={{ fontSize: 10, color: '#7A90B8', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 800 }}>Top segment</div>
                <div style={{ marginTop: 10, fontSize: 15, color: '#E8EEFF', fontWeight: 800, textTransform: 'capitalize' }}>{insights?.segments?.[0]?.label || 'No segment'}</div>
                <div style={{ marginTop: 4, fontSize: 12, color: '#00D2B8' }}>{insights?.segments?.[0]?.count || 0} trader profiles</div>
              </div>
              <div style={{ padding: 16, borderRadius: 14, background: 'rgba(215,179,106,0.06)', border: '1px solid rgba(215,179,106,0.14)' }}>
                <div style={{ fontSize: 10, color: '#7A90B8', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 800 }}>Professional signals</div>
                <div style={{ marginTop: 8, fontSize: 30, color: '#D7B36A', fontWeight: 900 }}>{insights?.professionalSignalTotal || 0}</div>
              </div>
            </div>
          </div>

          <div className="os-card">
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Trader segments</div>
            <BarChart data={insights?.segments || []} total={total} colors={COLORS} />
          </div>

          <div className="os-card">
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Plan recommendations</div>
            <BarChart data={insights?.recommendedPlans || []} total={total} colors={COLORS} />
          </div>

          {Object.entries(QUESTIONS).map(([qKey, q], qi) => {
            const data = stats?.[qKey] || [];
            const qTotal = data.reduce((s, d) => s + d.count, 0);
            const top = data[0];
            return (
              <div key={qKey} className="os-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `rgba(${qi % 2 === 0 ? '20,201,229' : '0,210,184'},0.1)`,
                    border: `1px solid rgba(${qi % 2 === 0 ? '20,201,229' : '0,210,184'},0.2)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, flexShrink: 0,
                  }}>{q.emoji}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{q.label}</div>
                    {top && (
                      <div style={{ fontSize: 11, color: '#3A5070', marginTop: 2 }}>
                        Top: <span style={{ color: COLORS[0], fontWeight: 600 }}>{top.emoji} {top.label}</span>
                        <span style={{ color: '#2A4060' }}> ({qTotal > 0 ? Math.round((top.count / qTotal) * 100) : 0}%)</span>
                      </div>
                    )}
                  </div>
                </div>
                <BarChart data={data} total={qTotal} colors={COLORS} />
              </div>
            );
          })}

          <div className="os-card" style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Latest onboarding responses</div>
                <div style={{ fontSize: 12, color: '#3A5070', marginTop: 4 }}>Recent submissions currently stored in the database.</div>
              </div>
              <div style={{ padding: '6px 10px', borderRadius: 999, background: 'rgba(20,201,229,0.08)', border: '1px solid rgba(20,201,229,0.16)', fontSize: 11, color: '#14C9E5', fontWeight: 700 }}>
                {recentResponses.length} shown
              </div>
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              {recentResponses.map((response, index) => {
                const answers = response.answers || {};
                const meta = response.meta || {};
                return (
                  <div key={`${response.email}-${index}`} style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid #142038' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#E8EEFF' }}>{response.email || 'Unknown user'}</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ padding: '4px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.04)', border: '1px solid #1B2A44', fontSize: 10.5, color: '#7A90B8' }}>
                          {response.plan}
                        </span>
                        <span style={{ padding: '4px 8px', borderRadius: 999, background: 'rgba(0,210,184,0.08)', border: '1px solid rgba(0,210,184,0.16)', fontSize: 10.5, color: '#00D2B8' }}>
                          {meta.completedAt ? new Date(meta.completedAt).toLocaleDateString('fr-FR') : 'No date'}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {Object.entries(answers).map(([key, value]) => (
                        <span key={key} style={{ padding: '6px 9px', borderRadius: 999, background: 'rgba(255,255,255,0.03)', border: '1px solid #142033', fontSize: 11, color: '#C0D8F8' }}>
                          <strong style={{ color: '#14C9E5' }}>{key}</strong>: {Array.isArray(value) ? value.join(', ') : value}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
