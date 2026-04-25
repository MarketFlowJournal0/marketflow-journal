import React, { useState } from 'react';

const SUPPORT_EMAIL = 'support@marketflowjournal.com';

const PAGE_DATA = {
  changelog: {
    eyebrow: 'Product',
    title: 'Changelog',
    subtitle: 'A clear record of what is live in MarketFlow Journal.',
    sections: [
      {
        title: 'Current release',
        items: [
          'Landing page restored to a calmer professional structure.',
          'New MF branding applied across public and journal surfaces.',
          'Reports, alerts, API access, backtest sessions and Elite tooling are represented according to current product access.',
        ],
      },
      {
        title: 'Quality standard',
        items: [
          'No fake client counters, invented volume, false ratings or unsupported competitor claims.',
          'Plan descriptions must match actual journal routing and access.',
        ],
      },
    ],
  },
  roadmap: {
    eyebrow: 'Product',
    title: 'Roadmap',
    subtitle: 'The next MarketFlow priorities, written without overpromising.',
    sections: [
      {
        title: 'Near term',
        items: [
          'Sharper import reliability across broker CSV, Excel and raw table formats.',
          'More polished backtest sessions with replay-style review and stronger session history.',
          'Deeper analytics and psychology links so every chart is tied to the same trade stream.',
        ],
      },
      {
        title: 'Exploration',
        items: [
          'Mobile app experience beyond the current web/PWA foundation.',
          'Broker connectivity improvements where secure integrations are technically available.',
        ],
      },
    ],
  },
  docs: {
    eyebrow: 'Resources',
    title: 'Documentation',
    subtitle: 'The operating guide for using MarketFlow like a daily trading desk.',
    sections: [
      {
        title: 'Core workflow',
        items: [
          'Import or add trades, then verify the base fields: symbol, side, date, entry, exit, P&L and account.',
          'Review the dashboard by account scope before going deeper into analytics, psychology and equity.',
          'Close each trading day with notes, routine checks and a short review action.',
        ],
      },
      {
        title: 'Plan access',
        items: [
          'Starter focuses on the core journal, dashboard, import, calendar and one backtest session.',
          'Pro adds advanced analytics, psychology, equity, broker desk, reports and more backtest sessions.',
          'Elite adds AI assistant access, alerts, API access, unlimited accounts and Elite tooling.',
        ],
      },
    ],
  },
  import: {
    eyebrow: 'Resources',
    title: 'Import Guide',
    subtitle: 'Clean trade data starts with a predictable import process.',
    sections: [
      {
        title: 'Supported inputs',
        items: [
          'CSV files from brokers, prop dashboards or spreadsheets.',
          'Excel files for manually maintained journals.',
          'JSON and pasted tables for flexible migration workflows.',
        ],
      },
      {
        title: 'Mapping standard',
        items: [
          'Map the essentials first: symbol, side, entry, exit, P&L, date, time and account.',
          'Create missing columns during import only when the field will help your review workflow.',
          'Validate rows before saving so bad data does not pollute analytics.',
        ],
      },
    ],
  },
  tutorials: {
    eyebrow: 'Resources',
    title: 'Tutorials',
    subtitle: 'Workflow lessons for building repeatable review habits.',
    sections: [
      {
        title: 'Suggested workflows',
        items: [
          'First setup: create account, choose plan, complete checkout, import a sample and verify dashboard metrics.',
          'Weekly review: compare analytics, calendar, psychology and equity to identify one process improvement.',
          'Prop-style review: monitor drawdown context, reports, alerts and account discipline without implying prop firm partnerships.',
        ],
      },
    ],
  },
  terms: {
    eyebrow: 'Legal',
    title: 'Terms of Service',
    subtitle: 'The practical rules for using MarketFlow Journal.',
    sections: [
      {
        title: 'Service purpose',
        items: [
          'MarketFlow Journal is a SaaS trading journal for tracking, reviewing and improving trading activity.',
          'It is a journaling and analytics product, not financial advice and not a guarantee of trading results.',
        ],
      },
      {
        title: 'Billing and access',
        items: [
          'Subscriptions, trials and payment methods are handled by Stripe.',
          'Billing starts after the 14-day trial unless cancelled.',
          'Access depends on active Stripe subscription status. Failed, cancelled or unpaid subscriptions may lose journal access.',
        ],
      },
      {
        title: 'Refund policy',
        items: [
          `Refund requests are handled by support within a 7-day window after the first paid charge. Contact ${SUPPORT_EMAIL} with your account email and invoice context.`,
        ],
      },
    ],
  },
  privacy: {
    eyebrow: 'Legal',
    title: 'Privacy Policy',
    subtitle: 'How MarketFlow handles account, journal and billing data.',
    sections: [
      {
        title: 'Data used to operate the product',
        items: [
          'Account details, subscription state and journal data are stored to operate the service.',
          'Payment information is processed by Stripe. MarketFlow does not store raw card details.',
          'Support requests may include your email, category, subject and message so we can answer properly.',
        ],
      },
      {
        title: 'User control',
        items: [
          'Users can export journal backups and delete trade data from the product.',
          `Privacy requests can be sent to ${SUPPORT_EMAIL}.`,
        ],
      },
    ],
  },
};

function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', category: 'general', subject: '', message: '' });
  const [state, setState] = useState({ sending: false, sent: false, error: '' });
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setState({ sending: true, sent: false, error: '' });
    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Unable to send support request.');
      setState({ sending: false, sent: true, error: '' });
      setForm({ name: '', email: '', category: 'general', subject: '', message: '' });
    } catch (error) {
      setState({ sending: false, sent: false, error: error.message || 'Unable to send support request.' });
    }
  };

  return (
    <form className="pub-form" onSubmit={submit}>
      <div className="pub-form-grid">
        <label>Name<input value={form.name} onChange={update('name')} placeholder="Your name" /></label>
        <label>Email<input type="email" required value={form.email} onChange={update('email')} placeholder="you@email.com" /></label>
      </div>
      <label>Category<select value={form.category} onChange={update('category')}><option value="general">General</option><option value="billing">Billing</option><option value="technical">Technical</option><option value="privacy">Privacy</option></select></label>
      <label>Subject<input value={form.subject} onChange={update('subject')} placeholder="How can we help?" /></label>
      <label>Message<textarea required value={form.message} onChange={update('message')} placeholder="Describe the issue with enough context for support..." rows={6} /></label>
      {state.error && <div className="pub-error">{state.error}</div>}
      {state.sent && <div className="pub-success">Message sent. Support will reply from {SUPPORT_EMAIL}.</div>}
      <button type="submit" disabled={state.sending}>{state.sending ? 'Sending...' : 'Send support request'}</button>
    </form>
  );
}

export default function PublicInfoPage({ page = 'docs' }) {
  const data = page === 'contact'
    ? {
      eyebrow: 'Legal',
      title: 'Contact',
      subtitle: `Reach MarketFlow support at ${SUPPORT_EMAIL}.`,
      sections: [
        { title: 'Support', items: [`Email: ${SUPPORT_EMAIL}`, 'For billing, access or import issues, include your account email and the steps that led to the issue.'] },
      ],
    }
    : PAGE_DATA[page] || PAGE_DATA.docs;

  return (
    <div className="pub-shell">
      <style>{`
        .pub-shell{min-height:100vh;background:radial-gradient(circle at 74% 8%,rgba(20,201,229,.11),transparent 34%),radial-gradient(circle at 10% 88%,rgba(0,210,184,.075),transparent 32%),linear-gradient(135deg,#000308,#030914 44%,#01040A);color:#DCE7F2;font-family:'Inter',sans-serif;position:relative;overflow:hidden;padding:34px 24px 80px;}
        .pub-shell::before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(90deg,rgba(148,163,184,.035) 0 1px,transparent 1px 120px),linear-gradient(115deg,transparent 0 30%,rgba(255,255,255,.03) 31%,transparent 32% 100%);opacity:.24;pointer-events:none;}
        .pub-wrap{position:relative;z-index:1;max-width:980px;margin:0 auto;}
        .pub-nav{display:flex;justify-content:space-between;align-items:center;margin-bottom:72px;}
        .pub-brand{display:flex;align-items:center;gap:12px;color:#fff;text-decoration:none;font-weight:900;letter-spacing:-.04em;font-family:'Space Grotesk',sans-serif;font-size:20px;}
        .pub-brand img{width:42px;height:42px;border-radius:13px;object-fit:cover;box-shadow:0 18px 38px rgba(0,0,0,.42),0 0 32px rgba(20,201,229,.14);}
        .pub-nav a:last-child{color:#9FB1CA;text-decoration:none;font-size:13px;font-weight:800;border:1px solid rgba(220,228,239,.08);border-radius:999px;padding:10px 15px;background:rgba(255,255,255,.025);}
        .pub-card{border:1px solid rgba(220,228,239,.08);background:linear-gradient(145deg,rgba(13,23,38,.72),rgba(4,9,18,.86));border-radius:28px;padding:42px;box-shadow:0 30px 90px rgba(0,0,0,.38);position:relative;overflow:hidden;}
        .pub-card::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 82% 0%,rgba(20,201,229,.11),transparent 38%);pointer-events:none;}
        .pub-eyebrow{position:relative;color:#14C9E5;text-transform:uppercase;letter-spacing:.18em;font-size:11px;font-weight:900;margin-bottom:14px;}
        .pub-title{position:relative;font-family:'Space Grotesk',sans-serif;font-size:clamp(38px,7vw,76px);line-height:.98;letter-spacing:-.07em;color:#F7FAFC;margin:0 0 18px;}
        .pub-sub{position:relative;color:#8EA0B8;font-size:17px;line-height:1.75;max-width:680px;margin:0 0 34px;}
        .pub-section{position:relative;border-top:1px solid rgba(220,228,239,.07);padding-top:24px;margin-top:24px;}
        .pub-section h2{font-size:18px;color:#F7FAFC;margin:0 0 14px;font-family:'Space Grotesk',sans-serif;}
        .pub-section ul{list-style:none;margin:0;padding:0;display:grid;gap:12px;}
        .pub-section li{color:#9FB1CA;line-height:1.7;font-size:14px;display:flex;gap:11px;align-items:flex-start;}
        .pub-section li::before{content:'';width:7px;height:7px;border-radius:50%;background:#00D2B8;box-shadow:0 0 12px rgba(0,210,184,.55);flex:0 0 auto;margin-top:8px;}
        .pub-form{position:relative;display:grid;gap:14px;margin-top:26px;}
        .pub-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;}
        .pub-form label{display:grid;gap:7px;color:#8EA0B8;text-transform:uppercase;letter-spacing:.11em;font-size:10px;font-weight:900;}
        .pub-form input,.pub-form select,.pub-form textarea{width:100%;border:1px solid rgba(220,228,239,.08);background:rgba(255,255,255,.035);border-radius:13px;color:#F7FAFC;padding:13px 14px;font:500 14px 'Inter',sans-serif;outline:none;text-transform:none;letter-spacing:0;}
        .pub-form textarea{resize:vertical;line-height:1.6;}
        .pub-form button{border:0;border-radius:14px;padding:14px 18px;background:linear-gradient(135deg,#DCE4EF,#14C9E5,#00D2B8);color:#01040A;font-weight:900;cursor:pointer;}
        .pub-form button:disabled{opacity:.55;cursor:not-allowed;}
        .pub-error,.pub-success{border-radius:12px;padding:12px 14px;font-size:13px;line-height:1.55;}
        .pub-error{border:1px solid rgba(255,77,106,.26);background:rgba(255,77,106,.08);color:#FF8DA1;}
        .pub-success{border:1px solid rgba(0,210,184,.24);background:rgba(0,210,184,.08);color:#75F6E6;}
        @media(max-width:700px){.pub-card{padding:28px 22px;border-radius:22px}.pub-form-grid{grid-template-columns:1fr}.pub-nav{margin-bottom:42px}}
      `}</style>
      <div className="pub-wrap">
        <nav className="pub-nav">
          <a className="pub-brand" href="/"><img src="/logo-mark.png" alt="" />MarketFlow</a>
          <a href="/">Back to site</a>
        </nav>
        <main className="pub-card">
          <div className="pub-eyebrow">{data.eyebrow}</div>
          <h1 className="pub-title">{data.title}</h1>
          <p className="pub-sub">{data.subtitle}</p>
          {data.sections.map((section) => (
            <section className="pub-section" key={section.title}>
              <h2>{section.title}</h2>
              <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul>
            </section>
          ))}
          {page === 'contact' && <ContactForm />}
        </main>
      </div>
    </div>
  );
}
