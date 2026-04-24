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

function getPalette() {
  const style = getComputedStyle(document.documentElement);

  return {
    accent: parseRgb(style.getPropertyValue('--mf-accent-rgb'), [20, 201, 229]),
    secondary: parseRgb(style.getPropertyValue('--mf-accent-secondary-rgb'), [0, 210, 184]),
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
    let ratio = 1;
    let frame = 0;
    let palette = getPalette();
    const particles = [];
    const lines = [];
    const candles = [];

    const readPalette = () => {
      palette = getPalette();
    };

    const getSceneCounts = () => {
      if (window.innerWidth < 720) return { particleCount: 18, lineCount: 4, candleCount: 10 };
      if (window.innerWidth < 1200) return { particleCount: 28, lineCount: 6, candleCount: 16 };
      return { particleCount: 38, lineCount: 8, candleCount: 24 };
    };

    const resize = () => {
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = Math.max(1, width * ratio);
      canvas.height = Math.max(1, height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const createLine = () => {
      const points = [];
      let x = Math.random() * width;
      let y = Math.random() * height;
      const totalPoints = 7 + Math.floor(Math.random() * 3);

      for (let index = 0; index < totalPoints; index += 1) {
        points.push({ x, y });
        x += 80 + Math.random() * 110;
        y += (Math.random() - 0.5) * 72;
      }

      return {
        points,
        drift: 0.03 + Math.random() * 0.08,
        opacity: 0.012 + Math.random() * 0.026,
        color: Math.random() > 0.72 ? 'secondary' : 'accent',
      };
    };

    const createParticle = () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.16,
      vy: (Math.random() - 0.5) * 0.14,
      radius: 0.8 + Math.random() * 1.4,
      opacity: 0.04 + Math.random() * 0.08,
      color: Math.random() > 0.78 ? 'secondary' : 'accent',
    });

    const createCandle = (startX = Math.random() * width) => ({
      x: startX,
      y: Math.random() * height,
      wick: 34 + Math.random() * 118,
      body: 12 + Math.random() * 38,
      up: Math.random() > 0.42,
      speed: 0.08 + Math.random() * 0.18,
      opacity: 0.018 + Math.random() * 0.04,
    });

    const initialize = () => {
      resize();
      readPalette();
      particles.length = 0;
      lines.length = 0;
      candles.length = 0;

      const { particleCount, lineCount, candleCount } = getSceneCounts();

      for (let index = 0; index < particleCount; index += 1) {
        particles.push(createParticle());
      }

      for (let index = 0; index < lineCount; index += 1) {
        lines.push(createLine());
      }

      for (let index = 0; index < candleCount; index += 1) {
        candles.push(createCandle(Math.random() * width));
      }
    };

    const drawCandles = () => {
      candles.forEach((candle, index) => {
        const tone = candle.up ? palette.secondary : [223, 95, 122];
        candle.x -= candle.speed;

        if (candle.x < -42) {
          candles[index] = createCandle(width + Math.random() * 180);
          return;
        }

        context.strokeStyle = rgba(tone, candle.opacity);
        context.fillStyle = rgba(tone, candle.opacity);
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(candle.x, candle.y - (candle.wick / 2));
        context.lineTo(candle.x, candle.y + (candle.wick / 2));
        context.stroke();
        context.fillRect(candle.x - 4, candle.y - (candle.body / 2), 8, candle.body);
      });
    };

    const drawLines = () => {
      lines.forEach((line) => {
        const tone = line.color === 'secondary' ? palette.secondary : palette.accent;

        line.points.forEach((point, index) => {
          point.x += line.drift;
          point.y += Math.sin((frame * 0.004) + index) * 0.02;

          if (point.x > width + 120) {
            point.x = -120;
            point.y = Math.random() * height;
          }
        });

        context.beginPath();
        context.moveTo(line.points[0].x, line.points[0].y);

        for (let index = 1; index < line.points.length; index += 1) {
          const previous = line.points[index - 1];
          const current = line.points[index];
          const controlX = (previous.x + current.x) / 2;
          const controlY = (previous.y + current.y) / 2;
          context.quadraticCurveTo(previous.x, previous.y, controlX, controlY);
        }

        context.strokeStyle = rgba(tone, line.opacity);
        context.lineWidth = 0.8;
        context.stroke();
      });
    };

    const drawParticles = () => {
      particles.forEach((particle) => {
        const tone = particle.color === 'secondary' ? palette.secondary : palette.accent;

        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < -20 || particle.x > width + 20) particle.vx *= -1;
        if (particle.y < -20 || particle.y > height + 20) particle.vy *= -1;

        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fillStyle = rgba(tone, particle.opacity);
        context.fill();
      });
    };

    const drawConnections = () => {
      for (let left = 0; left < particles.length; left += 1) {
        for (let right = left + 1; right < particles.length; right += 1) {
          const deltaX = particles[left].x - particles[right].x;
          const deltaY = particles[left].y - particles[right].y;
          const distance = Math.sqrt((deltaX * deltaX) + (deltaY * deltaY));

          if (distance > 118) continue;

          const tone = left % 5 === 0 ? palette.secondary : palette.accent;

          context.beginPath();
          context.moveTo(particles[left].x, particles[left].y);
          context.lineTo(particles[right].x, particles[right].y);
          context.strokeStyle = rgba(tone, 0.018 * (1 - (distance / 118)));
          context.lineWidth = 0.45;
          context.stroke();
        }
      }
    };

    const draw = () => {
      frame += 1;

      if (frame % 24 === 0) readPalette();

      context.clearRect(0, 0, width, height);
      drawCandles();
      drawLines();
      drawParticles();
      drawConnections();

      animationFrame = window.requestAnimationFrame(draw);
    };

    const handleResize = () => {
      initialize();
    };

    const observer = new MutationObserver(() => {
      readPalette();
    });

    initialize();
    draw();

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'style'],
    });

    window.addEventListener('resize', handleResize);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
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
        opacity: 0.74,
      }}
    />
  );
}
