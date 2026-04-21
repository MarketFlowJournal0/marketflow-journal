import React, { useEffect, useRef } from 'react';

function parseRgb(value, fallback) {
  const parts = String(value || '')
    .split(',')
    .map((part) => Number.parseFloat(part.trim()))
    .filter((part) => Number.isFinite(part));

  if (parts.length >= 3) return parts.slice(0, 3);
  return fallback;
}

function rgba(rgb, alpha) {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

function readPalette() {
  const style = getComputedStyle(document.documentElement);
  return {
    accent: parseRgb(style.getPropertyValue('--mf-accent-rgb'), [110, 127, 153]),
    border: parseRgb(style.getPropertyValue('--mf-border-rgb'), [32, 41, 50]),
    text: parseRgb(style.getPropertyValue('--mf-text-1-rgb'), [219, 226, 234]),
  };
}

export default function JournalAmbientBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const context = canvas.getContext('2d');
    if (!context) return undefined;

    let animationFrame = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = 0;
    let palette = readPalette();

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawGrid = () => {
      const horizontalGap = width < 900 ? 84 : 104;
      const verticalGap = width < 900 ? 72 : 88;

      context.strokeStyle = rgba(palette.border, 0.12);
      context.lineWidth = 1;

      for (let y = verticalGap * 0.5; y < height; y += verticalGap) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.stroke();
      }

      context.strokeStyle = rgba(palette.border, 0.06);
      for (let x = horizontalGap * 0.5; x < width; x += horizontalGap) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, height);
        context.stroke();
      }
    };

    const drawGuideLine = (offset, alpha, thickness) => {
      const baseY = height * offset;
      const amplitude = Math.max(12, height * 0.018);
      const step = Math.max(90, width / 8);

      context.beginPath();
      for (let x = -step; x <= width + step; x += step) {
        const phase = (frame * 0.0025) + (x * 0.0065) + (offset * 8);
        const y = baseY + Math.sin(phase) * amplitude;
        if (x === -step) context.moveTo(x, y);
        else context.lineTo(x, y);
      }

      context.strokeStyle = rgba(palette.accent, alpha);
      context.lineWidth = thickness;
      context.stroke();
    };

    const drawGlows = () => {
      const upperGlow = context.createRadialGradient(width * 0.18, height * 0.14, 0, width * 0.18, height * 0.14, width * 0.5);
      upperGlow.addColorStop(0, rgba(palette.accent, 0.06));
      upperGlow.addColorStop(1, 'rgba(0,0,0,0)');
      context.fillStyle = upperGlow;
      context.fillRect(0, 0, width, height);

      const lowerGlow = context.createRadialGradient(width * 0.8, height * 0.82, 0, width * 0.8, height * 0.82, width * 0.45);
      lowerGlow.addColorStop(0, rgba(palette.text, 0.035));
      lowerGlow.addColorStop(1, 'rgba(0,0,0,0)');
      context.fillStyle = lowerGlow;
      context.fillRect(0, 0, width, height);
    };

    const draw = () => {
      frame += 1;
      if (frame % 180 === 0) {
        palette = readPalette();
      }

      context.clearRect(0, 0, width, height);
      drawGrid();
      drawGuideLine(0.24, 0.09, 1.2);
      drawGuideLine(0.54, 0.05, 1);
      drawGuideLine(0.74, 0.035, 0.8);
      drawGlows();
      animationFrame = window.requestAnimationFrame(draw);
    };

    const observer = new MutationObserver(() => {
      palette = readPalette();
    });

    resize();
    draw();

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'style'],
    });

    window.addEventListener('resize', resize);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      observer.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.82,
      }}
    />
  );
}
