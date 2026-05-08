import { useEffect, useRef } from 'react';

const CURSOR_CLASS = 'mf-custom-cursor-enabled';
const VISIBLE_CLASS = 'mf-custom-cursor-visible';
const INTERACTIVE_CLASS = 'mf-custom-cursor-interactive';
const CLICKING_CLASS = 'mf-custom-cursor-clicking';
const INTERACTIVE_SELECTOR = [
  'a',
  'button',
  'input',
  'textarea',
  'select',
  'label',
  'summary',
  '[role="button"]',
  '[data-cursor="interactive"]',
].join(',');

export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const canUseCustomCursor = window.matchMedia?.('(pointer: fine)').matches
      && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!canUseCustomCursor) return undefined;

    const root = document.documentElement;
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return undefined;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let isDown = false;
    let frameId = 0;
    let clickTimer = 0;

    root.classList.add(CURSOR_CLASS);

    const render = () => {
      dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%) scale(${isDown ? 0.72 : 1})`;
      ring.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%) scale(${isDown ? 0.82 : 1})`;
      frameId = window.requestAnimationFrame(render);
    };

    const setInteractiveState = (target) => {
      const interactive = target instanceof Element && Boolean(target.closest(INTERACTIVE_SELECTOR));
      root.classList.toggle(INTERACTIVE_CLASS, interactive);
    };

    const handlePointerMove = (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
      root.classList.add(VISIBLE_CLASS);
      setInteractiveState(event.target);
    };

    const handlePointerDown = () => {
      isDown = true;
      root.classList.remove(CLICKING_CLASS);
      // Force a reflow so the click ripple restarts on fast repeated clicks.
      void root.offsetWidth;
      root.classList.add(CLICKING_CLASS);
      window.clearTimeout(clickTimer);
      clickTimer = window.setTimeout(() => root.classList.remove(CLICKING_CLASS), 520);
    };

    const handlePointerUp = () => {
      isDown = false;
    };

    const handlePointerLeave = () => {
      root.classList.remove(VISIBLE_CLASS, INTERACTIVE_CLASS);
    };

    const handlePointerEnter = () => {
      root.classList.add(VISIBLE_CLASS);
    };

    frameId = window.requestAnimationFrame(render);
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });
    window.addEventListener('blur', handlePointerLeave);
    document.addEventListener('mouseleave', handlePointerLeave);
    document.addEventListener('mouseenter', handlePointerEnter);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(clickTimer);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('blur', handlePointerLeave);
      document.removeEventListener('mouseleave', handlePointerLeave);
      document.removeEventListener('mouseenter', handlePointerEnter);
      root.classList.remove(CURSOR_CLASS, VISIBLE_CLASS, INTERACTIVE_CLASS, CLICKING_CLASS);
    };
  }, []);

  return (
    <>
      <style>{`
        @media (pointer: fine) {
          html.${CURSOR_CLASS},
          html.${CURSOR_CLASS} * {
            cursor: none !important;
          }

          .mf-custom-cursor-dot,
          .mf-custom-cursor-ring {
            position: fixed;
            top: 0;
            left: 0;
            pointer-events: none;
            z-index: 2147483647;
            opacity: 0;
            will-change: transform, opacity, width, height;
          }

          .mf-custom-cursor-dot {
            width: 6px;
            height: 6px;
            border-radius: 999px;
            background: linear-gradient(135deg, #DCE4EF 0%, #14C9E5 52%, #00D2B8 100%);
            box-shadow: 0 0 14px rgba(20, 201, 229, 0.42);
            transition: opacity 140ms ease, width 180ms ease, height 180ms ease, background 180ms ease;
          }

          .mf-custom-cursor-ring {
            width: 30px;
            height: 30px;
            border-radius: 999px;
            border: 1px solid rgba(220, 228, 239, 0.34);
            background:
              radial-gradient(circle at center, rgba(20, 201, 229, 0.09), transparent 58%),
              rgba(1, 6, 13, 0.08);
            box-shadow:
              0 0 0 1px rgba(20, 201, 229, 0.08),
              0 10px 34px rgba(0, 0, 0, 0.18);
            backdrop-filter: blur(1px);
            transition: opacity 140ms ease, width 180ms ease, height 180ms ease, border-color 180ms ease, background 180ms ease, box-shadow 180ms ease;
          }

          .mf-custom-cursor-ring::after {
            content: '';
            position: absolute;
            inset: -1px;
            border-radius: inherit;
            border: 1px solid rgba(20, 201, 229, 0);
            opacity: 0;
            transform: scale(0.72);
          }

          html.${VISIBLE_CLASS} .mf-custom-cursor-dot,
          html.${VISIBLE_CLASS} .mf-custom-cursor-ring {
            opacity: 1;
          }

          html.${INTERACTIVE_CLASS} .mf-custom-cursor-dot {
            width: 4px;
            height: 4px;
            background: #E8EEFF;
          }

          html.${INTERACTIVE_CLASS} .mf-custom-cursor-ring {
            width: 44px;
            height: 44px;
            border-color: rgba(20, 201, 229, 0.62);
            background:
              radial-gradient(circle at center, rgba(0, 210, 184, 0.13), transparent 58%),
              rgba(1, 6, 13, 0.12);
            box-shadow:
              0 0 0 1px rgba(220, 228, 239, 0.12),
              0 0 26px rgba(20, 201, 229, 0.22);
          }

          html.${CLICKING_CLASS} .mf-custom-cursor-dot {
            width: 9px;
            height: 9px;
          }

          html.${CLICKING_CLASS} .mf-custom-cursor-ring::after {
            animation: mf-custom-cursor-click 520ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }

          @keyframes mf-custom-cursor-click {
            0% {
              opacity: 0.72;
              transform: scale(0.62);
              border-color: rgba(220, 228, 239, 0.72);
            }
            58% {
              opacity: 0.26;
              border-color: rgba(20, 201, 229, 0.48);
            }
            100% {
              opacity: 0;
              transform: scale(1.9);
              border-color: rgba(0, 210, 184, 0);
            }
          }
        }
      `}</style>
      <div ref={ringRef} className="mf-custom-cursor-ring" aria-hidden="true" />
      <div ref={dotRef} className="mf-custom-cursor-dot" aria-hidden="true" />
    </>
  );
}
