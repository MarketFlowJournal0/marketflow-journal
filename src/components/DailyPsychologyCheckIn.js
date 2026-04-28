import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { shade } from '../lib/colorAlpha';
import {
  DAILY_PSYCHOLOGY_QUESTIONS,
  createPsychologyCheckin,
  getDefaultPsychologyAnswers,
  getPsychologyCheckinStatus,
  getPsychologyDateKey,
  savePsychologyCheckinStatus,
  upsertPsychologyCheckin,
} from '../lib/psychologyCheckins';

const C = {
  accent: 'var(--mf-accent,#14C9E5)',
  green: 'var(--mf-green,#00D2B8)',
  warn: 'var(--mf-warn,#FFB31A)',
  danger: 'var(--mf-danger,#FF3D57)',
  bg: 'var(--mf-bg,#01040A)',
  card: 'var(--mf-card,#060D18)',
  text0: 'var(--mf-text-0,#FFFFFF)',
  text1: 'var(--mf-text-1,#E8EEFF)',
  text2: 'var(--mf-text-2,#7A90B8)',
  text3: 'var(--mf-text-3,#334566)',
  border: 'var(--mf-border,#142033)',
  borderHi: 'var(--mf-border-hi,#1F2F47)',
};

function getMsUntilNextMidnight() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 1, 0);
  return Math.max(1000, next.getTime() - now.getTime());
}

function choiceTone(questionId, optionId) {
  if (['poor', 'drained', 'stressed', 'none', 'impulsive'].includes(optionId)) return C.danger;
  if (['light', 'low', 'reactive', 'rough', 'uncertain'].includes(optionId)) return C.warn;
  if (questionId === 'riskControl' || questionId === 'planReadiness') return C.green;
  return C.accent;
}

function computePreviewScore(answers) {
  const scores = DAILY_PSYCHOLOGY_QUESTIONS.map((question) => {
    const option = question.options.find((item) => item.id === answers[question.id]);
    return Number(option?.score || 70);
  });
  return Math.round(scores.reduce((sum, value) => sum + value, 0) / Math.max(1, scores.length));
}

export default function DailyPsychologyCheckIn({ user, enabled = true }) {
  const userId = user?.id || user?.email || 'guest';
  const [open, setOpen] = useState(false);
  const [dateKey, setDateKey] = useState(() => getPsychologyDateKey());
  const [answers, setAnswers] = useState(() => getDefaultPsychologyAnswers());
  const [note, setNote] = useState('');

  const previewScore = useMemo(() => computePreviewScore(answers), [answers]);

  useEffect(() => {
    if (!enabled || !userId) {
      setOpen(false);
      return undefined;
    }

    let timeoutId;
    const checkToday = () => {
      const todayKey = getPsychologyDateKey();
      setDateKey(todayKey);
      const status = getPsychologyCheckinStatus(userId, todayKey);
      if (!status) {
        setAnswers(getDefaultPsychologyAnswers());
        setNote('');
        setOpen(true);
      }
    };

    const scheduleNextCheck = () => {
      timeoutId = window.setTimeout(() => {
        checkToday();
        scheduleNextCheck();
      }, getMsUntilNextMidnight());
    };

    checkToday();
    scheduleNextCheck();

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [enabled, userId]);

  const updateAnswer = (questionId, optionId) => {
    setAnswers((current) => ({ ...current, [questionId]: optionId }));
  };

  const saveCheckin = () => {
    const checkin = createPsychologyCheckin({
      userId,
      dateKey,
      answers,
      note,
      skipped: false,
    });
    upsertPsychologyCheckin(userId, checkin);
    setOpen(false);
  };

  const skipToday = () => {
    const skipped = createPsychologyCheckin({
      userId,
      dateKey,
      answers,
      note: '',
      skipped: true,
    });
    upsertPsychologyCheckin(userId, skipped);
    savePsychologyCheckinStatus(userId, dateKey, 'skipped');
    setOpen(false);
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 4000,
            display: 'grid',
            placeItems: 'center',
            padding: 22,
            background: 'rgba(1,4,10,0.72)',
            backdropFilter: 'blur(18px)',
          }}
        >
          <motion.section
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            style={{
              width: 'min(760px, 100%)',
              maxHeight: 'min(86vh, 820px)',
              overflow: 'auto',
              borderRadius: 28,
              border: `1px solid ${shade(C.accent, 0.18)}`,
              background: `linear-gradient(145deg, ${shade(C.card, 0.98)}, rgba(2,7,14,0.98))`,
              boxShadow: `0 34px 120px rgba(0,0,0,0.72), 0 0 70px ${shade(C.accent, 0.08)}`,
              color: C.text1,
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                background: `radial-gradient(circle at 18% 0%, ${shade(C.accent, 0.16)}, transparent 36%), radial-gradient(circle at 84% 10%, ${shade(C.green, 0.12)}, transparent 32%)`,
              }}
            />
            <div style={{ position: 'relative', zIndex: 1, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 18, marginBottom: 18 }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: C.accent, boxShadow: `0 0 18px ${shade(C.accent, 0.7)}` }} />
                    <span style={{ color: C.text3, fontSize: 10, fontWeight: 900, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
                      Daily psychology check-in
                    </span>
                  </div>
                  <h2 style={{ margin: 0, color: C.text0, fontSize: 30, lineHeight: 1.02, letterSpacing: '-0.06em', fontWeight: 950 }}>
                    Quick mental scan before execution.
                  </h2>
                  <p style={{ margin: '10px 0 0', color: C.text2, fontSize: 13, lineHeight: 1.7, maxWidth: 540 }}>
                    Opens once per day after midnight. Your choices and note feed the Psychology score for today.
                  </p>
                </div>
                <div style={{ minWidth: 96, textAlign: 'right' }}>
                  <div style={{ color: C.text3, fontSize: 10, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    Preview
                  </div>
                  <div style={{ color: previewScore >= 70 ? C.green : previewScore >= 48 ? C.warn : C.danger, fontSize: 36, fontWeight: 950, lineHeight: 1, letterSpacing: '-0.08em' }}>
                    {previewScore}
                  </div>
                  <div style={{ color: C.text3, fontSize: 11, fontWeight: 800 }}>/100</div>
                </div>
              </div>

              <div style={{ display: 'grid', gap: 13 }}>
                {DAILY_PSYCHOLOGY_QUESTIONS.map((question, index) => (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, delay: index * 0.035 }}
                    style={{
                      padding: 13,
                      borderRadius: 18,
                      border: `1px solid ${shade(C.borderHi, 0.72)}`,
                      background: 'rgba(255,255,255,0.025)',
                    }}
                  >
                    <div style={{ color: C.text1, fontSize: 13, fontWeight: 900, marginBottom: 10 }}>
                      {question.label}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(126px, 1fr))', gap: 8 }}>
                      {question.options.map((option) => {
                        const selected = answers[question.id] === option.id;
                        const tone = choiceTone(question.id, option.id);
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => updateAnswer(question.id, option.id)}
                            style={{
                              minHeight: 44,
                              borderRadius: 13,
                              border: `1px solid ${selected ? shade(tone, 0.46) : 'rgba(255,255,255,0.07)'}`,
                              background: selected
                                ? `linear-gradient(135deg, ${shade(tone, 0.18)}, rgba(255,255,255,0.03))`
                                : 'rgba(255,255,255,0.025)',
                              color: selected ? tone : C.text2,
                              fontFamily: 'inherit',
                              fontSize: 11.5,
                              fontWeight: 850,
                              cursor: 'pointer',
                              boxShadow: selected ? `0 12px 28px ${shade(tone, 0.11)}` : 'none',
                              transition: 'all 0.16s ease',
                            }}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </div>

              <label style={{ display: 'grid', gap: 9, marginTop: 15 }}>
                <span style={{ color: C.text3, fontSize: 10, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                  Context note
                </span>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={4}
                  placeholder="Describe what you feel, what could affect discipline, and what MarketFlow should remember for today's psychology score."
                  style={{
                    width: '100%',
                    resize: 'vertical',
                    borderRadius: 18,
                    border: `1px solid ${shade(C.accent, 0.16)}`,
                    background: 'rgba(1,4,10,0.64)',
                    color: C.text1,
                    padding: '13px 14px',
                    fontFamily: 'inherit',
                    fontSize: 13,
                    lineHeight: 1.65,
                    outline: 'none',
                  }}
                />
                <span style={{ color: C.text3, fontSize: 11, lineHeight: 1.5 }}>
                  This note is scored too: clarity, preparation, stress signals, and discipline signals all affect the final psychology score.
                </span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={skipToday}
                  style={{
                    border: `1px solid ${shade(C.borderHi, 0.72)}`,
                    background: 'rgba(255,255,255,0.025)',
                    color: C.text2,
                    borderRadius: 14,
                    padding: '12px 15px',
                    fontFamily: 'inherit',
                    fontSize: 12,
                    fontWeight: 850,
                    cursor: 'pointer',
                  }}
                >
                  Skip today
                </button>
                <button
                  type="button"
                  onClick={saveCheckin}
                  style={{
                    border: `1px solid ${shade(C.green, 0.34)}`,
                    background: `linear-gradient(135deg, ${C.accent}, ${C.green})`,
                    color: C.bg,
                    borderRadius: 15,
                    padding: '13px 18px',
                    fontFamily: 'inherit',
                    fontSize: 12,
                    fontWeight: 950,
                    cursor: 'pointer',
                    boxShadow: `0 18px 44px ${shade(C.green, 0.18)}`,
                  }}
                >
                  Save check-in
                </button>
              </div>
            </div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
