import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const PAGE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

  :root {
    --lp-bg: #04070d;
    --lp-bg-2: #09101c;
    --lp-card: rgba(10, 16, 27, 0.78);
    --lp-card-strong: rgba(12, 20, 34, 0.92);
    --lp-border: rgba(125, 150, 190, 0.16);
    --lp-border-strong: rgba(125, 150, 190, 0.26);
    --lp-text: #eef4ff;
    --lp-text-2: #a6b6d6;
    --lp-text-3: #6e81a7;
    --lp-accent: #06e6ff;
    --lp-accent-2: #00ff88;
    --lp-positive: #12e39b;
    --lp-negative: #ff6875;
    --lp-gold: #f4c96b;
    --lp-shadow: 0 24px 90px rgba(0, 0, 0, 0.42);
  }

  * {
    box-sizing: border-box;
  }

  html {
    scroll-behavior: smooth;
  }

  body {
    margin: 0;
    font-family: 'Inter', sans-serif;
    background: var(--lp-bg);
    color: var(--lp-text);
  }

  .lp-page {
    min-height: 100vh;
    background:
      radial-gradient(circle at 12% 12%, rgba(6, 230, 255, 0.08), transparent 24%),
      radial-gradient(circle at 86% 18%, rgba(0, 255, 136, 0.06), transparent 22%),
      linear-gradient(180deg, #04070d 0%, #07101b 38%, #04070d 100%);
    color: var(--lp-text);
    overflow-x: hidden;
  }

  .lp-shell {
    position: relative;
    z-index: 1;
  }

  .lp-nav {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 78px;
    padding: 0 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 50;
    background: rgba(4, 7, 13, 0.48);
    backdrop-filter: blur(18px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    transition: background 0.2s ease, border-color 0.2s ease;
  }

  .lp-nav.scrolled {
    background: rgba(4, 7, 13, 0.92);
    border-bottom-color: var(--lp-border);
  }

  .lp-brand {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    text-decoration: none;
  }

  .lp-brand-mark {
    width: 38px;
    height: 38px;
    border-radius: 11px;
    border: 1px solid rgba(76, 220, 255, 0.2);
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0)),
      rgba(5, 12, 20, 0.92);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.02), 0 18px 40px rgba(0, 0, 0, 0.3);
    overflow: hidden;
  }

  .lp-brand-mark img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: 1px;
  }

  .lp-brand-wordmark {
    display: flex;
    flex-direction: column;
    line-height: 1;
  }

  .lp-brand-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 19px;
    font-weight: 800;
    letter-spacing: -0.04em;
    color: transparent;
  }

  .lp-brand-title em {
    font-style: normal;
    background: linear-gradient(180deg, #f7f9fd 0%, #dce4ef 58%, #95a2b5 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .lp-brand-title span {
    background: linear-gradient(135deg, #8cecff 0%, #1dc9ff 42%, #15c7d7 72%, #0fe2a1 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .lp-brand-sub {
    margin-top: 3px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--lp-text-3);
  }

  .lp-nav-links {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .lp-nav-links a {
    padding: 10px 14px;
    border-radius: 999px;
    color: var(--lp-text-2);
    text-decoration: none;
    font-size: 13px;
    font-weight: 600;
    transition: color 0.18s ease, background 0.18s ease;
  }

  .lp-nav-links a:hover {
    color: var(--lp-text);
    background: rgba(255, 255, 255, 0.04);
  }

  .lp-nav-cta {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .lp-btn-ghost,
  .lp-btn-primary,
  .lp-btn-secondary {
    border-radius: 999px;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
  }

  .lp-btn-ghost {
    height: 42px;
    padding: 0 18px;
    color: var(--lp-text);
    background: transparent;
    border: 1px solid var(--lp-border);
  }

  .lp-btn-ghost:hover,
  .lp-btn-secondary:hover {
    border-color: rgba(6, 230, 255, 0.28);
    color: #cbf8ff;
    transform: translateY(-1px);
  }

  .lp-btn-primary {
    height: 44px;
    padding: 0 20px;
    color: #051018;
    border: none;
    background: linear-gradient(135deg, #8ae9ff 0%, #06e6ff 46%, #00ff88 100%);
    box-shadow: 0 10px 34px rgba(6, 230, 255, 0.22);
  }

  .lp-btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 18px 40px rgba(6, 230, 255, 0.3);
  }

  .lp-btn-secondary {
    height: 46px;
    padding: 0 20px;
    color: var(--lp-text);
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid var(--lp-border);
  }

  .lp-section {
    padding: 108px 32px;
  }

  .lp-section-inner {
    max-width: 1280px;
    margin: 0 auto;
  }

  .lp-hero {
    position: relative;
    min-height: 100vh;
    display: flex;
    align-items: center;
    padding: 126px 32px 72px;
    overflow: hidden;
  }

  .lp-hero-grid {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 1280px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: minmax(0, 0.88fr) minmax(520px, 1.12fr);
    gap: 28px;
    align-items: center;
  }

  .lp-hero-copy {
    max-width: 620px;
  }

  .lp-overline {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 8px 14px;
    border-radius: 999px;
    border: 1px solid rgba(6, 230, 255, 0.18);
    background: rgba(6, 230, 255, 0.06);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: #9fe8ff;
    margin-bottom: 22px;
  }

  .lp-overline::before {
    content: '';
    width: 7px;
    height: 7px;
    border-radius: 999px;
    background: linear-gradient(135deg, #8ae9ff, #00ff88);
    box-shadow: 0 0 16px rgba(6, 230, 255, 0.5);
  }

  .lp-hero-title {
    margin: 0 0 18px;
    font-family: 'Space Grotesk', sans-serif;
    font-size: clamp(46px, 6vw, 84px);
    line-height: 0.96;
    letter-spacing: -0.055em;
    color: var(--lp-text);
  }

  .lp-hero-title span {
    color: #bdf2ff;
  }

  .lp-hero-sub {
    margin: 0 0 26px;
    max-width: 580px;
    color: var(--lp-text-2);
    font-size: 17px;
    line-height: 1.75;
  }

  .lp-hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 18px;
  }

  .lp-hero-note {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
    color: var(--lp-text-3);
    font-size: 12px;
    line-height: 1.7;
  }

  .lp-hero-note strong {
    color: #d6e9ff;
  }

  .lp-trust-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 30px;
  }

  .lp-mini-stat {
    min-width: 160px;
    padding: 15px 16px;
    border-radius: 18px;
    background: rgba(10, 16, 27, 0.58);
    border: 1px solid rgba(125, 150, 190, 0.1);
    backdrop-filter: blur(10px);
  }

  .lp-mini-stat-value {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.04em;
    color: var(--lp-text);
  }

  .lp-mini-stat-label {
    margin-top: 5px;
    font-size: 11px;
    color: var(--lp-text-3);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .lp-candle-layer {
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0.9;
  }

  .lp-candle-fade {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(90deg, rgba(4, 7, 13, 0.95) 0%, rgba(4, 7, 13, 0.32) 24%, rgba(4, 7, 13, 0.12) 54%, rgba(4, 7, 13, 0.82) 100%),
      linear-gradient(180deg, rgba(4, 7, 13, 0.1) 0%, rgba(4, 7, 13, 0.3) 60%, rgba(4, 7, 13, 0.9) 100%);
  }

  .lp-window {
    position: relative;
    border-radius: 30px;
    overflow: hidden;
    border: 1px solid rgba(125, 150, 190, 0.18);
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0)),
      rgba(6, 12, 21, 0.9);
    box-shadow: var(--lp-shadow);
  }

  .lp-window-top {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 56px;
    padding: 0 20px;
    border-bottom: 1px solid rgba(125, 150, 190, 0.12);
    background: rgba(7, 11, 18, 0.92);
  }

  .lp-window-dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.14);
  }

  .lp-window-label {
    margin-left: 10px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--lp-text-3);
  }

  .lp-window-body {
    display: grid;
    grid-template-columns: 178px minmax(0, 1fr);
    min-height: 560px;
  }

  .lp-app-rail {
    padding: 18px 14px;
    border-right: 1px solid rgba(125, 150, 190, 0.12);
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0));
  }

  .lp-app-rail-group {
    margin-top: 18px;
  }

  .lp-app-rail-label {
    margin: 0 0 10px 4px;
    color: var(--lp-text-3);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .lp-app-link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 11px 12px;
    border-radius: 14px;
    color: var(--lp-text-2);
    font-size: 13px;
    font-weight: 600;
    background: transparent;
  }

  .lp-app-link.active {
    color: var(--lp-text);
    background: rgba(6, 230, 255, 0.08);
    border: 1px solid rgba(6, 230, 255, 0.14);
  }

  .lp-app-link-icon {
    width: 28px;
    height: 28px;
    border-radius: 9px;
    border: 1px solid rgba(125, 150, 190, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--lp-text-3);
    background: rgba(255, 255, 255, 0.02);
    flex-shrink: 0;
  }

  .lp-app-link.active .lp-app-link-icon {
    color: #bdf2ff;
    border-color: rgba(6, 230, 255, 0.22);
    background: rgba(6, 230, 255, 0.08);
  }

  .lp-app-main {
    padding: 22px;
  }

  .lp-panel {
    border-radius: 22px;
    border: 1px solid rgba(125, 150, 190, 0.12);
    background: rgba(8, 13, 22, 0.84);
    transition: transform 0.24s ease, border-color 0.24s ease, box-shadow 0.24s ease;
  }

  .lp-panel:hover {
    border-color: rgba(6, 230, 255, 0.18);
  }

  .lp-command-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 16px 18px;
    margin-bottom: 16px;
  }

  .lp-command-copy {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .lp-command-over {
    color: var(--lp-text-3);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .lp-command-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.04em;
    color: var(--lp-text);
  }

  .lp-command-scopes {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .lp-scope-pill,
  .lp-scope-accent {
    padding: 8px 12px;
    border-radius: 999px;
    border: 1px solid rgba(125, 150, 190, 0.12);
    background: rgba(255, 255, 255, 0.02);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--lp-text-2);
  }

  .lp-scope-accent {
    color: #cdfdff;
    border-color: rgba(6, 230, 255, 0.18);
    background: rgba(6, 230, 255, 0.08);
  }

  .lp-hero-panels {
    display: grid;
    grid-template-columns: 1.16fr 0.84fr;
    gap: 16px;
    margin-bottom: 16px;
  }

  .lp-kpi-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 16px;
  }

  .lp-kpi-card {
    padding: 16px;
  }

  .lp-kpi-label {
    font-size: 10px;
    color: var(--lp-text-3);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    font-weight: 700;
  }

  .lp-kpi-value {
    margin-top: 8px;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.04em;
    color: var(--lp-text);
  }

  .lp-kpi-meta {
    margin-top: 7px;
    font-size: 11px;
    color: var(--lp-text-2);
  }

  .lp-positive {
    color: var(--lp-positive);
  }

  .lp-negative {
    color: var(--lp-negative);
  }

  .lp-calendar-preview {
    padding: 16px;
  }

  .lp-calendar-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .lp-calendar-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--lp-text);
  }

  .lp-calendar-meta {
    font-size: 11px;
    color: var(--lp-text-3);
  }

  .lp-calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 8px;
  }

  .lp-day-cell {
    min-height: 74px;
    padding: 10px;
    border-radius: 16px;
    border: 1px solid rgba(125, 150, 190, 0.1);
    background: rgba(255, 255, 255, 0.02);
    transition: transform 0.22s ease, border-color 0.22s ease, background 0.22s ease;
  }

  .lp-day-cell.win {
    background: linear-gradient(180deg, rgba(18, 227, 155, 0.18), rgba(18, 227, 155, 0.08));
    border-color: rgba(18, 227, 155, 0.22);
  }

  .lp-day-cell.loss {
    background: linear-gradient(180deg, rgba(255, 104, 117, 0.16), rgba(255, 104, 117, 0.06));
    border-color: rgba(255, 104, 117, 0.2);
  }

  .lp-day-cell.muted {
    opacity: 0.55;
  }

  .lp-day-number {
    font-size: 11px;
    font-weight: 700;
    color: var(--lp-text-2);
  }

  .lp-day-value {
    margin-top: 14px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    font-weight: 600;
    color: var(--lp-text);
  }

  .lp-day-caption {
    margin-top: 6px;
    font-size: 10px;
    color: var(--lp-text-3);
  }

  .lp-side-stack {
    display: grid;
    gap: 16px;
  }

  .lp-side-card {
    padding: 16px;
  }

  .lp-side-card-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 14px;
  }

  .lp-side-card-title strong {
    font-size: 13px;
    color: var(--lp-text);
  }

  .lp-side-card-title span {
    font-size: 10px;
    color: var(--lp-text-3);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    font-weight: 700;
  }

  .lp-checklist {
    display: grid;
    gap: 10px;
  }

  .lp-check-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 11px 12px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(125, 150, 190, 0.08);
  }

  .lp-check-copy {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .lp-check-bullet {
    width: 18px;
    height: 18px;
    border-radius: 999px;
    border: 1px solid rgba(6, 230, 255, 0.22);
    background: rgba(6, 230, 255, 0.08);
    flex-shrink: 0;
  }

  .lp-check-copy strong {
    display: block;
    font-size: 12px;
    color: var(--lp-text);
  }

  .lp-check-copy span {
    display: block;
    margin-top: 3px;
    font-size: 11px;
    color: var(--lp-text-3);
  }

  .lp-check-badge {
    padding: 6px 9px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #cafbf3;
    background: rgba(18, 227, 155, 0.12);
    border: 1px solid rgba(18, 227, 155, 0.2);
    white-space: nowrap;
  }

  .lp-strip-panel {
    padding: 14px 16px;
  }

  .lp-strip-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 10px;
  }

  .lp-strip-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--lp-text);
  }

  .lp-strip-meta {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--lp-text-3);
  }

  .lp-strip-table {
    display: grid;
    gap: 8px;
  }

  .lp-strip-row {
    display: grid;
    grid-template-columns: 1.4fr 0.75fr 0.75fr 0.9fr;
    gap: 8px;
    align-items: center;
    padding: 10px 12px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(125, 150, 190, 0.08);
    font-size: 11px;
    color: var(--lp-text-2);
  }

  .lp-strip-row strong {
    color: var(--lp-text);
    font-weight: 600;
  }

  .lp-marquee-wrap {
    padding: 24px 0;
    border-top: 1px solid rgba(255, 255, 255, 0.04);
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0)),
      rgba(5, 9, 15, 0.88);
    overflow: hidden;
  }

  .lp-marquee-head {
    max-width: 1280px;
    margin: 0 auto 14px;
    padding: 0 32px;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 10px;
    align-items: baseline;
  }

  .lp-marquee-head strong {
    font-size: 13px;
    color: var(--lp-text);
  }

  .lp-marquee-head span {
    font-size: 12px;
    color: var(--lp-text-3);
  }

  .lp-marquee {
    display: flex;
    width: max-content;
    animation: lpMarquee 36s linear infinite;
  }

  .lp-marquee:hover {
    animation-play-state: paused;
  }

  @keyframes lpMarquee {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
  }

  .lp-marquee-item {
    margin-right: 12px;
    padding: 12px 16px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(125, 150, 190, 0.08);
    color: #dce8ff;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .lp-section-head {
    margin-bottom: 28px;
    max-width: 760px;
  }

  .lp-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 7px 12px;
    border-radius: 999px;
    border: 1px solid rgba(6, 230, 255, 0.14);
    background: rgba(6, 230, 255, 0.05);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #9fe8ff;
    margin-bottom: 16px;
  }

  .lp-section-title {
    margin: 0;
    font-family: 'Space Grotesk', sans-serif;
    font-size: clamp(32px, 4vw, 56px);
    line-height: 1.02;
    letter-spacing: -0.05em;
    color: var(--lp-text);
  }

  .lp-section-desc {
    margin: 16px 0 0;
    color: var(--lp-text-2);
    font-size: 16px;
    line-height: 1.8;
  }

  .lp-transparency-grid,
  .lp-feature-grid,
  .lp-plan-grid,
  .lp-faq-grid,
  .lp-module-grid {
    display: grid;
    gap: 16px;
  }

  .lp-transparency-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .lp-transparency-card,
  .lp-feature-card,
  .lp-module-card,
  .lp-plan-card,
  .lp-faq-card {
    border-radius: 24px;
    border: 1px solid rgba(125, 150, 190, 0.12);
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.025), rgba(255, 255, 255, 0)),
      rgba(10, 16, 27, 0.84);
    box-shadow: 0 18px 60px rgba(0, 0, 0, 0.22);
  }

  .lp-transparency-card {
    padding: 22px;
  }

  .lp-feature-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .lp-feature-card {
    padding: 22px;
    min-height: 226px;
    transition: transform 0.2s ease, border-color 0.2s ease;
  }

  .lp-feature-card:hover,
  .lp-module-card:hover,
  .lp-plan-card:hover {
    transform: translateY(-4px);
    border-color: rgba(6, 230, 255, 0.18);
  }

  .lp-feature-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 18px;
  }

  .lp-icon-chip {
    width: 42px;
    height: 42px;
    border-radius: 14px;
    border: 1px solid rgba(6, 230, 255, 0.14);
    background: rgba(6, 230, 255, 0.08);
    color: #bdf2ff;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .lp-plan-pill {
    padding: 7px 10px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--lp-text-2);
    border: 1px solid rgba(125, 150, 190, 0.1);
    background: rgba(255, 255, 255, 0.02);
  }

  .lp-feature-card h3,
  .lp-module-card h3,
  .lp-transparency-card h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.03em;
    color: var(--lp-text);
  }

  .lp-feature-card p,
  .lp-module-card p,
  .lp-transparency-card p {
    margin: 10px 0 0;
    color: var(--lp-text-2);
    font-size: 14px;
    line-height: 1.75;
  }

  .lp-feature-points {
    margin: 16px 0 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 9px;
  }

  .lp-feature-points li {
    display: flex;
    gap: 10px;
    color: var(--lp-text-2);
    font-size: 13px;
    line-height: 1.6;
  }

  .lp-feature-points li::before {
    content: '';
    width: 7px;
    height: 7px;
    border-radius: 999px;
    margin-top: 7px;
    background: linear-gradient(135deg, #8ae9ff, #00ff88);
    flex-shrink: 0;
  }

  .lp-showcase-grid {
    display: grid;
    grid-template-columns: 1.06fr 0.94fr;
    gap: 16px;
  }

  .lp-screen-card {
    padding: 18px;
    border-radius: 26px;
    border: 1px solid rgba(125, 150, 190, 0.12);
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0)),
      rgba(8, 13, 22, 0.9);
    overflow: hidden;
    position: relative;
    transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
  }

  .lp-screen-card:hover {
    transform: translateY(-5px);
    border-color: rgba(6, 230, 255, 0.2);
    box-shadow: 0 22px 64px rgba(0, 0, 0, 0.28);
  }

  .lp-screen-card:hover .lp-screen-float {
    transform: translateY(-4px);
    border-color: rgba(6, 230, 255, 0.16);
  }

  .lp-screen-card:hover .lp-bar {
    transform: scaleY(1.08) translateY(-2px);
    opacity: 1;
  }

  .lp-screen-card:hover .lp-heat {
    transform: translateY(-2px);
    filter: saturate(1.08);
  }

  .lp-screen-card:hover .lp-ring-progress {
    stroke-dashoffset: 56;
  }

  .lp-screen-card:hover .lp-preview-line-a {
    transform: translateY(-3px);
  }

  .lp-screen-card:hover .lp-preview-line-b {
    transform: translateY(2px);
  }

  .lp-screen-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
  }

  .lp-screen-label {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .lp-screen-label span {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--lp-text-3);
  }

  .lp-screen-label strong {
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.03em;
    color: var(--lp-text);
  }

  .lp-screen-badge {
    padding: 7px 11px;
    border-radius: 999px;
    background: rgba(6, 230, 255, 0.08);
    border: 1px solid rgba(6, 230, 255, 0.16);
    color: #bdf2ff;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .lp-screen-shell {
    display: grid;
    gap: 12px;
  }

  .lp-screen-float {
    transition: transform 0.24s ease, border-color 0.24s ease;
  }

  .lp-preview-metrics {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }

  .lp-preview-metric {
    padding: 14px;
    border-radius: 16px;
    border: 1px solid rgba(125, 150, 190, 0.1);
    background: rgba(255, 255, 255, 0.02);
  }

  .lp-preview-metric span {
    display: block;
    color: var(--lp-text-3);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .lp-preview-metric strong {
    display: block;
    margin-top: 8px;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.03em;
    color: var(--lp-text);
  }

  .lp-preview-grid {
    display: grid;
    grid-template-columns: 1.14fr 0.86fr;
    gap: 12px;
  }

  .lp-chart-panel,
  .lp-card-panel {
    padding: 16px;
    border-radius: 18px;
    border: 1px solid rgba(125, 150, 190, 0.1);
    background: rgba(255, 255, 255, 0.02);
  }

  .lp-chart-bars {
    height: 180px;
    display: flex;
    align-items: flex-end;
    gap: 7px;
  }

  .lp-bar {
    flex: 1;
    border-radius: 8px 8px 2px 2px;
    background: linear-gradient(180deg, rgba(6, 230, 255, 0.85), rgba(6, 230, 255, 0.14));
    transition: transform 0.26s ease, opacity 0.26s ease;
    transform-origin: bottom center;
    opacity: 0.92;
  }

  .lp-bar.negative {
    background: linear-gradient(180deg, rgba(255, 104, 117, 0.9), rgba(255, 104, 117, 0.15));
  }

  .lp-preview-lines {
    position: relative;
    height: 160px;
    overflow: hidden;
  }

  .lp-preview-svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .lp-preview-line-a,
  .lp-preview-line-b {
    transition: transform 0.3s ease;
  }

  .lp-heat-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 8px;
  }

  .lp-heat {
    min-height: 54px;
    border-radius: 14px;
    border: 1px solid rgba(125, 150, 190, 0.08);
    background: rgba(255, 255, 255, 0.02);
    transition: transform 0.24s ease, filter 0.24s ease;
  }

  .lp-heat.good {
    background: linear-gradient(180deg, rgba(18, 227, 155, 0.22), rgba(18, 227, 155, 0.08));
  }

  .lp-heat.mid {
    background: linear-gradient(180deg, rgba(6, 230, 255, 0.16), rgba(6, 230, 255, 0.06));
  }

  .lp-heat.soft {
    background: linear-gradient(180deg, rgba(125, 150, 190, 0.12), rgba(125, 150, 190, 0.04));
  }

  .lp-heat.bad {
    background: linear-gradient(180deg, rgba(255, 104, 117, 0.18), rgba(255, 104, 117, 0.06));
  }

  .lp-ring-wrap {
    display: grid;
    place-items: center;
    min-height: 176px;
  }

  .lp-ring {
    width: 132px;
    height: 132px;
  }

  .lp-ring-track {
    fill: none;
    stroke: rgba(125, 150, 190, 0.12);
    stroke-width: 10;
  }

  .lp-ring-progress {
    fill: none;
    stroke: url(#lpRingGradient);
    stroke-width: 10;
    stroke-linecap: round;
    stroke-dasharray: 240;
    stroke-dashoffset: 68;
    transition: stroke-dashoffset 0.35s ease;
  }

  .lp-ring-center {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 24px;
    font-weight: 700;
    fill: #eef4ff;
    text-anchor: middle;
  }

  .lp-ring-sub {
    font-size: 9px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    fill: #6e81a7;
    text-anchor: middle;
  }

  .lp-module-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .lp-module-card {
    padding: 22px;
    min-height: 220px;
    transition: transform 0.2s ease, border-color 0.2s ease;
  }

  .lp-module-meta {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 18px;
  }

  .lp-module-route,
  .lp-module-level {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--lp-text-3);
  }

  .lp-module-points {
    margin: 16px 0 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 8px;
  }

  .lp-module-points li {
    color: var(--lp-text-2);
    font-size: 13px;
    line-height: 1.6;
  }

  .lp-plan-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .lp-plan-card {
    padding: 24px;
    transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .lp-plan-card.featured {
    border-color: rgba(6, 230, 255, 0.22);
    box-shadow: 0 0 0 1px rgba(6, 230, 255, 0.12), 0 18px 60px rgba(0, 0, 0, 0.24);
  }

  .lp-plan-head {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-start;
    margin-bottom: 18px;
  }

  .lp-plan-name {
    margin: 0;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 24px;
    font-weight: 700;
    letter-spacing: -0.04em;
    color: var(--lp-text);
  }

  .lp-plan-caption {
    margin-top: 7px;
    font-size: 13px;
    color: var(--lp-text-2);
    line-height: 1.65;
  }

  .lp-plan-price {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 42px;
    font-weight: 700;
    letter-spacing: -0.05em;
    color: var(--lp-text);
  }

  .lp-plan-price small {
    font-size: 14px;
    color: var(--lp-text-3);
    letter-spacing: 0;
  }

  .lp-plan-badge {
    padding: 7px 10px;
    border-radius: 999px;
    background: rgba(6, 230, 255, 0.08);
    border: 1px solid rgba(6, 230, 255, 0.16);
    color: #bdf2ff;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .lp-plan-list {
    margin: 0 0 22px;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 10px;
  }

  .lp-plan-list li {
    display: flex;
    gap: 10px;
    color: var(--lp-text-2);
    font-size: 13px;
    line-height: 1.6;
  }

  .lp-plan-list li::before {
    content: '';
    width: 7px;
    height: 7px;
    border-radius: 999px;
    margin-top: 7px;
    background: linear-gradient(135deg, #8ae9ff, #00ff88);
    flex-shrink: 0;
  }

  .lp-pricing-note {
    margin-top: 18px;
    font-size: 12px;
    color: var(--lp-text-3);
    line-height: 1.7;
  }

  .lp-faq-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .lp-faq-card {
    padding: 22px;
  }

  .lp-faq-card h3 {
    margin: 0;
    font-size: 17px;
    font-weight: 700;
    letter-spacing: -0.03em;
    color: var(--lp-text);
  }

  .lp-faq-card p {
    margin: 10px 0 0;
    color: var(--lp-text-2);
    font-size: 14px;
    line-height: 1.75;
  }

  .lp-footer {
    padding: 32px;
    border-top: 1px solid rgba(255, 255, 255, 0.04);
  }

  .lp-footer-inner {
    max-width: 1280px;
    margin: 0 auto;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 18px;
    align-items: center;
  }

  .lp-footer-copy {
    color: var(--lp-text-3);
    font-size: 12px;
    line-height: 1.7;
  }

  .lp-footer-links {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .lp-footer-links a,
  .lp-footer-links button {
    color: var(--lp-text-2);
    background: transparent;
    border: none;
    font: inherit;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    padding: 0;
  }

  .lp-footer-links a:hover,
  .lp-footer-links button:hover {
    color: var(--lp-text);
  }

  @media (max-width: 1200px) {
    .lp-hero-grid,
    .lp-showcase-grid,
    .lp-hero-panels,
    .lp-preview-grid,
    .lp-module-grid,
    .lp-feature-grid,
    .lp-plan-grid,
    .lp-transparency-grid,
    .lp-faq-grid {
      grid-template-columns: 1fr;
    }

    .lp-window-body {
      grid-template-columns: 1fr;
    }

    .lp-app-rail {
      border-right: none;
      border-bottom: 1px solid rgba(125, 150, 190, 0.12);
    }
  }

  @media (max-width: 960px) {
    .lp-nav {
      padding: 0 18px;
    }

    .lp-nav-links {
      display: none;
    }

    .lp-section,
    .lp-hero {
      padding-left: 20px;
      padding-right: 20px;
    }

    .lp-marquee-head {
      padding: 0 20px;
    }

    .lp-kpi-grid,
    .lp-preview-metrics {
      grid-template-columns: 1fr;
    }

    .lp-command-bar {
      flex-direction: column;
      align-items: flex-start;
    }

    .lp-command-scopes {
      justify-content: flex-start;
    }

    .lp-calendar-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }

  @media (max-width: 720px) {
    .lp-nav-cta {
      display: none;
    }

    .lp-hero-grid {
      gap: 20px;
      grid-template-columns: 1fr;
    }

    .lp-hero-title {
      font-size: clamp(38px, 12vw, 56px);
    }

    .lp-window-top {
      padding: 0 16px;
    }

    .lp-window-body,
    .lp-app-main,
    .lp-app-rail,
    .lp-footer {
      padding-left: 16px;
      padding-right: 16px;
    }

    .lp-app-main {
      padding-top: 16px;
      padding-bottom: 16px;
    }

    .lp-strip-row {
      grid-template-columns: 1fr;
    }

    .lp-calendar-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .lp-day-cell {
      min-height: 66px;
    }
  }
`;

const PROP_FIRMS = [
  'FTMO',
  'The5ers',
  'Topstep',
  'FundedNext',
  'Funding Pips',
  'E8 Markets',
  'Blue Guardian',
  'Alpha Capital Group',
];

const TRANSPARENCY_CARDS = [
  {
    title: 'No synthetic social proof',
    copy: 'The landing no longer shows fake user counts, fake trade totals, ratings, or invented reviews. If MarketFlow does not have public proof yet, the page stays quiet.',
    icon: 'shield',
  },
  {
    title: 'No placeholder market tape',
    copy: 'The scrolling market ticker was removed because there is no production-grade real-time feed wired into the landing right now. Better no tape than fake tape.',
    icon: 'pulse',
  },
  {
    title: 'No risky competitor claims',
    copy: 'The old comparison block is gone. The landing now speaks about MarketFlow itself instead of publishing unsupported statements about other platforms.',
    icon: 'balance',
  },
];

const FEATURE_CARDS = [
  {
    title: 'Structured trade ledger',
    plan: 'Starter',
    icon: 'ledger',
    copy: 'Import CSV, XLSX, XLS, TSV, JSON, or paste trade data directly. Review, edit, filter, and organize trades inside a cleaner execution-first workspace.',
    points: ['Universal import desk', 'Editable review table', 'Column mapping and custom columns'],
  },
  {
    title: 'Daily dashboard',
    plan: 'Starter',
    icon: 'dashboard',
    copy: 'Use MarketFlow as a repeatable daily command center, with workflow prompts, scoreboard context, calendar visibility, and account-aware navigation.',
    points: ['Daily workflow dock', 'Plan-aware access', 'Calendar and ranking context'],
  },
  {
    title: 'Analytics Pro',
    plan: 'Pro',
    icon: 'analytics',
    copy: 'Read edge, drawdown, win rate behavior, confluences, long-versus-short behavior, heatmaps, and trade-level patterns from the same trade stream.',
    points: ['Real drawdown and equity linkage', 'Win rate intelligence views', 'Confluence and timing breakdowns'],
  },
  {
    title: 'Psychology and discipline',
    plan: 'Pro',
    icon: 'psychology',
    copy: 'Track mental score, behavioral patterns, discipline, routine quality, and the relationship between state of mind and performance.',
    points: ['Behavior review', 'Session scoring', 'Pattern-oriented psychology panels'],
  },
  {
    title: 'Backtest sessions',
    plan: 'Starter / Pro / Elite',
    icon: 'backtest',
    copy: 'Backtest is unlocked by session count: 1 session on Starter, 5 on Pro, and 25 on Elite. The landing only claims the replay workspace that exists today.',
    points: ['Session library', 'Resume existing work', 'Plan-based session limits'],
  },
  {
    title: 'Reports, alerts, and API',
    plan: 'Pro / Elite',
    icon: 'stack',
    copy: 'Downloadable reports, alert configuration, and API access are shown only where the journal already exposes those modules today.',
    points: ['Report export workspace', 'Alert center', 'Elite API surface'],
  },
];

const MODULES = [
  {
    route: '/dashboard',
    level: 'Starter',
    title: 'Dashboard',
    copy: 'Daily overview, workflow focus, calendar visibility, rank context, and account scope control.',
    points: ['Visible immediately after access', 'Designed for daily use', 'Shared data model with the rest of the journal'],
  },
  {
    route: '/all-trades',
    level: 'Starter',
    title: 'All Trades',
    copy: 'Import, map, clean, and review trades in a simpler execution ledger without forcing a bloated interface.',
    points: ['Universal import formats', 'Custom columns', 'Saved trade review workflow'],
  },
  {
    route: '/calendar',
    level: 'Starter',
    title: 'Calendar',
    copy: 'Month view with real trade days and a deeper day review overlay for the selected session.',
    points: ['Monthly PnL view', 'Daily detail overlay', 'Connected to the same trade stream'],
  },
  {
    route: '/competition',
    level: 'Starter',
    title: 'Competition',
    copy: 'Leaderboard and rank context live inside the journal, refreshed on a daily cadence instead of floating as disconnected marketing.',
    points: ['MarketFlow ranking', 'Dashboard linkage', 'Competitive layer'],
  },
  {
    route: '/analytics-pro',
    level: 'Pro',
    title: 'Analytics Pro',
    copy: 'A deeper read of performance, drawdown, win rate, confluences, long-versus-short, heatmaps, and trade intelligence.',
    points: ['Real drawdown on chart', 'Detailed win rate views', 'Multi-section analytics navigation'],
  },
  {
    route: '/psychology',
    level: 'Pro',
    title: 'Psychology',
    copy: 'Score, mood, routine, confidence, discipline, and behavioral insight panels built around the same trading dataset.',
    points: ['Mental score tracking', 'Behavioral patterns', 'Performance correlation'],
  },
  {
    route: '/equity',
    level: 'Pro',
    title: 'Equity',
    copy: 'Equity curve, drawdown reading, and risk context presented in a dedicated workspace rather than buried inside generic widgets.',
    points: ['Equity focus view', 'Risk awareness', 'Connected data'],
  },
  {
    route: '/backtest',
    level: 'Starter / Pro / Elite',
    title: 'Backtest',
    copy: 'Session-based backtest lab with plan-limited session counts and resumable workflow.',
    points: ['1 / 5 / 25 session limits', 'Resume or start new session', 'Stored session context'],
  },
  {
    route: '/broker-connect',
    level: 'Pro / Elite',
    title: 'Broker Desk',
    copy: 'Broker workspace and Elite execution infrastructure sit inside the product, but the landing avoids claiming unsupported live connectivity.',
    points: ['Broker workspace', 'Elite-only execution desk layer', 'Connection-oriented setup view'],
  },
];

const PLAN_CARDS = [
  {
    id: 'starter',
    priceId: 'price_1T9t9L2Ouddv7uendIMAR6IP',
    name: 'Starter',
    price: '$15',
    featured: false,
    badge: 'Focused journal',
    copy: 'Core MarketFlow workspace with the journal, dashboard, calendar, competition, and one backtest session.',
    features: [
      'Unlimited trade journal',
      'Dashboard and daily workflow',
      'CSV, Excel, and raw data import',
      'Performance calendar',
      'Competition page',
      '1 backtest session',
    ],
  },
  {
    id: 'pro',
    priceId: 'price_1T9t9U2Ouddv7uenfg38PRZ2',
    name: 'Pro',
    price: '$22',
    featured: true,
    badge: 'Most complete review layer',
    copy: 'Adds the deeper review stack: Analytics Pro, psychology, equity, broker desk, more backtest sessions, and report exports.',
    features: [
      'Everything in Starter',
      'Analytics Pro',
      'Psychology tracker',
      'Equity curve and drawdown',
      'Broker desk access',
      '5 backtest sessions',
      'Downloadable reports',
    ],
  },
  {
    id: 'elite',
    priceId: 'price_1T9t9L2Ouddv7uen4DXuOatj',
    name: 'Elite',
    price: '$38',
    featured: false,
    badge: 'Elite unlocks',
    copy: 'Adds the highest-access modules already present in the journal, including alerts, API access, unlimited accounts, and Elite-only tooling.',
    features: [
      'Everything in Pro',
      'AI assistant access',
      'Unlimited accounts',
      'Alerts and notifications',
      'API access',
      '25 backtest sessions',
      'Priority support channel',
    ],
  },
];

const FAQS = [
  {
    question: 'Do you show fake customer metrics on the landing page?',
    answer: 'No. The landing now avoids synthetic user counts, fake trade totals, and made-up testimonials. If there is no public proof yet, MarketFlow does not pretend there is.',
  },
  {
    question: 'Is the scrolling market data strip live?',
    answer: 'Not right now. It was removed from the landing until a production-grade real-time data feed is wired and audited. The page should not simulate a market tape.',
  },
  {
    question: 'Why are prop firm names shown?',
    answer: 'They are shown as examples of well-known prop environments traders care about. The landing does not present them as partnerships, certifications, or official endorsements.',
  },
  {
    question: 'What does the 14-day flow mean?',
    answer: 'The landing keeps the current activation flow: card required, access activated, then the journal unlocks according to the selected plan.',
  },
  {
    question: 'Does the landing only describe live modules?',
    answer: 'That is the goal of this rewrite. The page now focuses on modules already visible in the journal today and avoids future-facing promises unless they are clearly labeled elsewhere.',
  },
  {
    question: 'Why is there no direct competitor table anymore?',
    answer: 'Because unsupported comparison claims are a legal and trust risk. It is safer to remove them than to publish weak or outdated statements about other products.',
  },
];

const HERO_CALENDAR = [
  { day: 'Mon 08', value: null, caption: null, state: 'muted' },
  { day: 'Tue 09', value: '+$420', caption: '2 trades', state: 'win' },
  { day: 'Wed 10', value: '+$285', caption: '1 trade', state: 'win' },
  { day: 'Thu 11', value: '-$96', caption: '1 trade', state: 'loss' },
  { day: 'Fri 12', value: '+$560', caption: '3 trades', state: 'win' },
  { day: 'Mon 15', value: '+$380', caption: 'London', state: 'win' },
  { day: 'Tue 16', value: null, caption: null, state: 'muted' },
  { day: 'Wed 17', value: '+$140', caption: 'US30', state: 'win' },
];

const LEDGER_ROWS = [
  { pair: 'EURUSD', setup: 'London breakout', side: 'Long', pnl: '+$380' },
  { pair: 'BTCUSD', setup: 'NY reclaim', side: 'Short', pnl: '+$650' },
  { pair: 'US30', setup: 'Open drive', side: 'Long', pnl: '+$4,500' },
];

const SHOWCASE_BARS = [42, 58, 46, 72, 68, 80, 62, 88, 70, 76];

function Reveal({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

function Icon({ name, size = 18 }) {
  const shared = {
    width: size,
    height: size,
    viewBox: '0 0 20 20',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.6',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  switch (name) {
    case 'ledger':
      return (
        <svg {...shared}>
          <rect x="3" y="3" width="14" height="14" rx="3" />
          <path d="M6.5 7h7" />
          <path d="M6.5 10h7" />
          <path d="M6.5 13h4.5" />
        </svg>
      );
    case 'dashboard':
      return (
        <svg {...shared}>
          <rect x="3" y="3" width="5.5" height="5.5" rx="1.4" />
          <rect x="11.5" y="3" width="5.5" height="8" rx="1.4" />
          <rect x="3" y="11.5" width="5.5" height="5.5" rx="1.4" />
          <rect x="11.5" y="14" width="5.5" height="3" rx="1.4" />
        </svg>
      );
    case 'analytics':
      return (
        <svg {...shared}>
          <path d="M4 15l3.2-4.2 2.8 2.7 5-6" />
          <path d="M15 4h-3.5V7.5" />
        </svg>
      );
    case 'psychology':
      return (
        <svg {...shared}>
          <path d="M10 3.2c3.1 0 5.6 2.5 5.6 5.6 0 2.5-1.5 4.5-3.8 5.3-.5.2-.8.6-.8 1.1v.8H9v-.8c0-.5-.3-.9-.8-1.1-2.3-.8-3.8-2.8-3.8-5.3 0-3.1 2.5-5.6 5.6-5.6z" />
          <path d="M8 8.4c.4-.9 1.1-1.4 2-1.4 1.2 0 2 1 2 2.1 0 1.4-1.1 2.1-2 2.9" />
          <path d="M10 14.8v.1" />
        </svg>
      );
    case 'backtest':
      return (
        <svg {...shared}>
          <path d="M4 4v12" />
          <path d="M8 16V9" />
          <path d="M12 16V6" />
          <path d="M16 16V11" />
          <path d="M6 6.5l7-3.5v7z" />
        </svg>
      );
    case 'stack':
      return (
        <svg {...shared}>
          <path d="M4 6l6-3 6 3-6 3z" />
          <path d="M4 10l6 3 6-3" />
          <path d="M4 14l6 3 6-3" />
        </svg>
      );
    case 'pulse':
      return (
        <svg {...shared}>
          <path d="M3 10h3l1.6-3.2 2.5 6 2.1-4.4H17" />
        </svg>
      );
    case 'shield':
      return (
        <svg {...shared}>
          <path d="M10 3l5.3 2.2v4.1c0 3.1-2.1 5.8-5.3 7.2-3.2-1.4-5.3-4.1-5.3-7.2V5.2z" />
          <path d="M7.7 9.8l1.6 1.7 3-3.4" />
        </svg>
      );
    case 'balance':
      return (
        <svg {...shared}>
          <path d="M10 4v10" />
          <path d="M5 6h10" />
          <path d="M7 6L4.5 10h5L7 6z" />
          <path d="M13 6l-2.5 4h5L13 6z" />
          <path d="M6 16h8" />
        </svg>
      );
    default:
      return (
        <svg {...shared}>
          <circle cx="10" cy="10" r="5" />
        </svg>
      );
  }
}

function CandleBackdrop() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    let animationFrame = 0;
    let width = 0;
    let height = 0;
    let candles = [];
    let dpr = 1;

    const makeCandle = (x, previousClose = 0.52) => {
      const drift = (Math.random() - 0.5) * 0.18;
      const open = Math.min(0.82, Math.max(0.18, previousClose + drift));
      const close = Math.min(0.82, Math.max(0.18, open + (Math.random() - 0.5) * 0.22));
      const high = Math.min(0.9, Math.max(open, close) + Math.random() * 0.1);
      const low = Math.max(0.1, Math.min(open, close) - Math.random() * 0.1);
      return {
        x,
        width: 8 + Math.random() * 3,
        speed: 0.36 + Math.random() * 0.22,
        open,
        close,
        high,
        low,
      };
    };

    const resize = () => {
      dpr = window.devicePixelRatio || 1;
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      candles = [];
      let x = -60;
      let previous = 0.52;
      while (x < width + 120) {
        const candle = makeCandle(x, previous);
        candles.push(candle);
        previous = candle.close;
        x += 16 + Math.random() * 10;
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      const gridColor = 'rgba(154, 178, 219, 0.07)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 7; i += 1) {
        const y = ((i + 1) / 8) * height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.strokeStyle = gridColor;
        ctx.stroke();
      }

      for (let i = 0; i < 9; i += 1) {
        const x = ((i + 1) / 10) * width;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.strokeStyle = 'rgba(154, 178, 219, 0.035)';
        ctx.stroke();
      }

      ctx.beginPath();
      candles.forEach((candle, index) => {
        const y = height * (1 - candle.close);
        if (index === 0) ctx.moveTo(candle.x, y);
        else ctx.lineTo(candle.x, y);
      });
      ctx.strokeStyle = 'rgba(111, 223, 255, 0.18)';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      candles.forEach((candle, index) => {
        candle.x -= candle.speed;

        if (candle.x < -36) {
          const last = candles[(index - 1 + candles.length) % candles.length];
          const nextX = Math.max(width + 20, last.x + 22);
          const recycled = makeCandle(nextX, last.close);
          candle.x = recycled.x;
          candle.width = recycled.width;
          candle.speed = recycled.speed;
          candle.open = recycled.open;
          candle.close = recycled.close;
          candle.high = recycled.high;
          candle.low = recycled.low;
        }

        const bullish = candle.close >= candle.open;
        const color = bullish ? 'rgba(18, 227, 155, 0.78)' : 'rgba(255, 104, 117, 0.78)';
        const fill = bullish ? 'rgba(18, 227, 155, 0.18)' : 'rgba(255, 104, 117, 0.16)';
        const openY = height * (1 - candle.open);
        const closeY = height * (1 - candle.close);
        const highY = height * (1 - candle.high);
        const lowY = height * (1 - candle.low);
        const bodyTop = Math.min(openY, closeY);
        const bodyHeight = Math.max(4, Math.abs(closeY - openY));

        ctx.beginPath();
        ctx.moveTo(candle.x, highY);
        ctx.lineTo(candle.x, lowY);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = fill;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(candle.x - candle.width / 2, bodyTop, candle.width, bodyHeight, 3);
        ctx.fill();
        ctx.stroke();
      });

      animationFrame = window.requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener('resize', resize);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="lp-candle-layer">
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      <div className="lp-candle-fade" />
    </div>
  );
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="lp-section-head">
      <div className="lp-eyebrow">{eyebrow}</div>
      <h2 className="lp-section-title">{title}</h2>
      <p className="lp-section-desc">{description}</p>
    </div>
  );
}

function HeroWorkspace() {
  return (
    <Reveal delay={0.18}>
      <div className="lp-window">
        <div className="lp-window-top">
          <div className="lp-window-dot" />
          <div className="lp-window-dot" />
          <div className="lp-window-dot" />
          <div className="lp-window-label">Live MarketFlow workspace preview</div>
        </div>
        <div className="lp-window-body">
          <aside className="lp-app-rail">
            <div className="lp-brand" style={{ cursor: 'default' }}>
              <div className="lp-brand-mark">
                <img src="/logo192.png" alt="MarketFlow" />
              </div>
              <div className="lp-brand-wordmark">
                <div className="lp-brand-title">
                  <em>Market</em><span>Flow</span>
                </div>
                <div className="lp-brand-sub">Journal</div>
              </div>
            </div>

            <div className="lp-app-rail-group">
              <div className="lp-app-rail-label">Core</div>
              <div className="lp-app-link active">
                <div className="lp-app-link-icon"><Icon name="dashboard" size={14} /></div>
                Dashboard
              </div>
              <div className="lp-app-link">
                <div className="lp-app-link-icon"><Icon name="ledger" size={14} /></div>
                All Trades
              </div>
              <div className="lp-app-link">
                <div className="lp-app-link-icon"><Icon name="analytics" size={14} /></div>
                Analytics
              </div>
              <div className="lp-app-link">
                <div className="lp-app-link-icon"><Icon name="psychology" size={14} /></div>
                Psychology
              </div>
            </div>

            <div className="lp-app-rail-group">
              <div className="lp-app-rail-label">Plan unlocks</div>
              <div className="lp-app-link">
                <div className="lp-app-link-icon"><Icon name="backtest" size={14} /></div>
                Backtest
              </div>
              <div className="lp-app-link">
                <div className="lp-app-link-icon"><Icon name="stack" size={14} /></div>
                Reports
              </div>
            </div>
          </aside>

          <div className="lp-app-main">
            <div className="lp-panel lp-command-bar">
              <div className="lp-command-copy">
                <div className="lp-command-over">MarketFlow command center</div>
                <div className="lp-command-title">Daily review, account scope, and execution context</div>
              </div>
              <div className="lp-command-scopes">
                <div className="lp-scope-pill">All accounts</div>
                <div className="lp-scope-pill">London</div>
                <div className="lp-scope-accent">Analytics live</div>
              </div>
            </div>

            <div className="lp-kpi-grid">
              <div className="lp-panel lp-kpi-card">
                <div className="lp-kpi-label">Net PnL</div>
                <div className="lp-kpi-value">$8,620</div>
                <div className="lp-kpi-meta"><span className="lp-positive">9 trading days</span> in scope</div>
              </div>
              <div className="lp-panel lp-kpi-card">
                <div className="lp-kpi-label">Win rate</div>
                <div className="lp-kpi-value">68.4%</div>
                <div className="lp-kpi-meta">Rolling and cumulative views</div>
              </div>
              <div className="lp-panel lp-kpi-card">
                <div className="lp-kpi-label">Max drawdown</div>
                <div className="lp-kpi-value">-$920</div>
                <div className="lp-kpi-meta">Linked to equity and analytics</div>
              </div>
            </div>

            <div className="lp-hero-panels">
              <div className="lp-panel lp-calendar-preview">
                <div className="lp-calendar-head">
                  <div className="lp-calendar-title">Calendar review</div>
                  <div className="lp-calendar-meta">Selected month: April</div>
                </div>
                <div className="lp-calendar-grid">
                  {HERO_CALENDAR.map((cell) => (
                    <div key={cell.day} className={`lp-day-cell ${cell.state}`}>
                      <div className="lp-day-number">{cell.day}</div>
                      {cell.value ? <div className="lp-day-value">{cell.value}</div> : <div className="lp-day-value">-</div>}
                      <div className="lp-day-caption">{cell.caption || 'No flow'}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lp-side-stack">
                <div className="lp-panel lp-side-card">
                  <div className="lp-side-card-title">
                    <strong>Workflow</strong>
                    <span>Today</span>
                  </div>
                  <div className="lp-checklist">
                    <div className="lp-check-item">
                      <div className="lp-check-copy">
                        <div className="lp-check-bullet" />
                        <div>
                          <strong>Pre-session notes</strong>
                          <span>Bias, plan, and invalidation</span>
                        </div>
                      </div>
                      <div className="lp-check-badge">Open</div>
                    </div>
                    <div className="lp-check-item">
                      <div className="lp-check-copy">
                        <div className="lp-check-bullet" />
                        <div>
                          <strong>Import last fills</strong>
                          <span>Execution review desk</span>
                        </div>
                      </div>
                      <div className="lp-check-badge">Ready</div>
                    </div>
                    <div className="lp-check-item">
                      <div className="lp-check-copy">
                        <div className="lp-check-bullet" />
                        <div>
                          <strong>Rank snapshot</strong>
                          <span>Leaderboard refresh every 24h</span>
                        </div>
                      </div>
                      <div className="lp-check-badge">Live</div>
                    </div>
                  </div>
                </div>

                <div className="lp-panel lp-strip-panel">
                  <div className="lp-strip-head">
                    <div className="lp-strip-title">Latest execution review</div>
                    <div className="lp-strip-meta">All trades</div>
                  </div>
                  <div className="lp-strip-table">
                    {LEDGER_ROWS.map((row) => (
                      <div key={row.pair + row.setup} className="lp-strip-row">
                        <strong>{row.pair}</strong>
                        <span>{row.setup}</span>
                        <span>{row.side}</span>
                        <strong className={row.pnl.startsWith('-') ? 'lp-negative' : 'lp-positive'}>{row.pnl}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

function ShowcaseScreens() {
  return (
    <div className="lp-showcase-grid">
      <Reveal>
        <div className="lp-screen-card">
          <div className="lp-screen-head">
            <div className="lp-screen-label">
              <span>Execution review</span>
              <strong>All Trades</strong>
            </div>
            <div className="lp-screen-badge">Import and review</div>
          </div>

          <div className="lp-screen-shell">
            <div className="lp-preview-metrics">
              <div className="lp-preview-metric lp-screen-float">
                <span>Imported</span>
                <strong>166 rows</strong>
              </div>
              <div className="lp-preview-metric lp-screen-float">
                <span>Mapped fields</span>
                <strong>Pair, PnL, Date</strong>
              </div>
              <div className="lp-preview-metric lp-screen-float">
                <span>Columns</span>
                <strong>Custom ready</strong>
              </div>
            </div>

            <div className="lp-chart-panel lp-screen-float">
              <div className="lp-strip-head">
                <div className="lp-strip-title">Execution ledger</div>
                <div className="lp-strip-meta">Saved views</div>
              </div>
              <div className="lp-strip-table">
                {[
                  ['EURUSD', 'Breakout', 'Long', '+$380'],
                  ['BTCUSD', 'Reversal', 'Short', '+$650'],
                  ['GBPUSD', 'Pullback', 'Long', '-$120'],
                  ['US30', 'Open drive', 'Long', '+$4,500'],
                ].map((row) => (
                  <div key={row.join('-')} className="lp-strip-row">
                    <strong>{row[0]}</strong>
                    <span>{row[1]}</span>
                    <span>{row[2]}</span>
                    <strong className={String(row[3]).startsWith('-') ? 'lp-negative' : 'lp-positive'}>{row[3]}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="lp-screen-card">
          <div className="lp-screen-head">
            <div className="lp-screen-label">
              <span>Analytics Pro</span>
              <strong>Linked charts and hover motion</strong>
            </div>
            <div className="lp-screen-badge">Same trade stream</div>
          </div>

          <div className="lp-screen-shell">
            <div className="lp-preview-grid">
              <div className="lp-chart-panel lp-screen-float">
                <div className="lp-strip-head">
                  <div className="lp-strip-title">Performance rhythm</div>
                  <div className="lp-strip-meta">PnL sequence</div>
                </div>
                <div className="lp-chart-bars">
                  {SHOWCASE_BARS.map((value, index) => (
                    <div
                      key={String(value) + String(index)}
                      className={`lp-bar ${index === 2 || index === 6 ? 'negative' : ''}`}
                      style={{ height: `${value}%` }}
                    />
                  ))}
                </div>
              </div>

              <div className="lp-card-panel lp-screen-float">
                <div className="lp-strip-head">
                  <div className="lp-strip-title">Win rate read</div>
                  <div className="lp-strip-meta">Advice layer</div>
                </div>
                <div className="lp-ring-wrap">
                  <svg className="lp-ring" viewBox="0 0 120 120">
                    <defs>
                      <linearGradient id="lpRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8ae9ff" />
                        <stop offset="60%" stopColor="#06e6ff" />
                        <stop offset="100%" stopColor="#00ff88" />
                      </linearGradient>
                    </defs>
                    <circle className="lp-ring-track" cx="60" cy="60" r="38" />
                    <circle className="lp-ring-progress" cx="60" cy="60" r="38" transform="rotate(-90 60 60)" />
                    <text className="lp-ring-center" x="60" y="58">68%</text>
                    <text className="lp-ring-sub" x="60" y="76">win rate</text>
                  </svg>
                </div>
              </div>
            </div>

            <div className="lp-preview-grid">
              <div className="lp-card-panel lp-screen-float">
                <div className="lp-strip-head">
                  <div className="lp-strip-title">Drawdown and equity</div>
                  <div className="lp-strip-meta">Real values</div>
                </div>
                <div className="lp-preview-lines">
                  <svg className="lp-preview-svg" viewBox="0 0 400 160" preserveAspectRatio="none">
                    <path
                      className="lp-preview-line-a"
                      d="M0 120 C40 114 80 100 120 84 C160 68 200 62 240 66 C280 70 320 54 360 40 C380 34 390 36 400 28"
                      fill="none"
                      stroke="rgba(18, 227, 155, 0.72)"
                      strokeWidth="3"
                    />
                    <path
                      className="lp-preview-line-b"
                      d="M0 38 C60 42 120 50 170 74 C220 98 270 96 330 74 C360 62 380 56 400 52"
                      fill="none"
                      stroke="rgba(255, 104, 117, 0.62)"
                      strokeWidth="2.6"
                    />
                  </svg>
                </div>
              </div>

              <div className="lp-card-panel lp-screen-float">
                <div className="lp-strip-head">
                  <div className="lp-strip-title">Timing heatmap</div>
                  <div className="lp-strip-meta">Session edges</div>
                </div>
                <div className="lp-heat-grid">
                  {['good', 'mid', 'soft', 'good', 'bad', 'soft', 'good', 'mid', 'good', 'soft'].map((state, index) => (
                    <div key={String(state) + String(index)} className={`lp-heat ${state}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}

export default function LandingPage({ onLogin, onSignup, onSignupWithPlan }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 28);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const goTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  const propLoop = [...PROP_FIRMS, ...PROP_FIRMS];

  return (
    <div className="lp-page">
      <style>{PAGE_STYLES}</style>

      <nav className={`lp-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="lp-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="lp-brand-mark">
            <img src="/logo192.png" alt="MarketFlow" />
          </div>
          <div className="lp-brand-wordmark">
            <div className="lp-brand-title">
              <em>Market</em><span>Flow</span>
            </div>
            <div className="lp-brand-sub">Trading Journal</div>
          </div>
        </div>

        <div className="lp-nav-links">
          <a href="#workspace" onClick={(event) => { event.preventDefault(); goTo('workspace'); }}>Workspace</a>
          <a href="#modules" onClick={(event) => { event.preventDefault(); goTo('modules'); }}>Modules</a>
          <a href="#pricing" onClick={(event) => { event.preventDefault(); goTo('pricing'); }}>Pricing</a>
          <a href="#faq" onClick={(event) => { event.preventDefault(); goTo('faq'); }}>FAQ</a>
        </div>

        <div className="lp-nav-cta">
          <button className="lp-btn-ghost" onClick={onLogin}>Log in</button>
          <button className="lp-btn-primary" onClick={onSignup}>Start trial</button>
        </div>
      </nav>

      <div className="lp-shell">
        <section className="lp-hero">
          <CandleBackdrop />
          <div className="lp-hero-grid">
            <div className="lp-hero-copy">
              <Reveal>
                <div className="lp-overline">Only live product modules are shown here</div>
              </Reveal>

              <Reveal delay={0.05}>
                <h1 className="lp-hero-title">
                  MarketFlow Journal for <span>cleaner execution review</span> and real post-trade discipline.
                </h1>
              </Reveal>

              <Reveal delay={0.1}>
                <p className="lp-hero-sub">
                  MarketFlow is a structured trading journal built around the modules already available in the product today:
                  journal review, dashboard, calendar, analytics, psychology, equity, backtest sessions, reports, alerts,
                  and API access by plan. No fake user counters. No fake market tape. No inflated promises.
                </p>
              </Reveal>

              <Reveal delay={0.14}>
                <div className="lp-hero-actions">
                  <button className="lp-btn-primary" onClick={onSignup}>Start your 14-day flow</button>
                  <button className="lp-btn-secondary" onClick={() => goTo('workspace')}>Explore the workspace</button>
                </div>
              </Reveal>

              <Reveal delay={0.18}>
                <div className="lp-hero-note">
                  <span><strong>Activation flow:</strong> card required, then access opens by plan.</span>
                  <span><strong>Positioning:</strong> built for serious discretionary review, not for fake marketing optics.</span>
                </div>
              </Reveal>

              <Reveal delay={0.22}>
                <div className="lp-trust-row">
                  <div className="lp-mini-stat">
                    <div className="lp-mini-stat-value">Starter / Pro / Elite</div>
                    <div className="lp-mini-stat-label">Plan-based journal access</div>
                  </div>
                  <div className="lp-mini-stat">
                    <div className="lp-mini-stat-value">1 / 5 / 25</div>
                    <div className="lp-mini-stat-label">Backtest sessions by plan</div>
                  </div>
                  <div className="lp-mini-stat">
                    <div className="lp-mini-stat-value">No fake counters</div>
                    <div className="lp-mini-stat-label">Landing rewritten for transparency</div>
                  </div>
                </div>
              </Reveal>
            </div>

            <HeroWorkspace />
          </div>
        </section>

        <section className="lp-marquee-wrap">
          <div className="lp-marquee-head">
            <strong>Prop-style workflows in mind</strong>
            <span>Names shown as widely known prop environments. No official affiliation or endorsement is implied.</span>
          </div>
          <div className="lp-marquee">
            {propLoop.map((name, index) => (
              <div key={name + String(index)} className="lp-marquee-item">{name}</div>
            ))}
          </div>
        </section>

        <section className="lp-section" id="workspace">
          <div className="lp-section-inner">
            <Reveal>
              <SectionHeading
                eyebrow="Workspace"
                title="A landing page that can survive real scrutiny."
                description="The old landing leaned too hard on decorative SaaS tropes, placeholder quotes, and unsupported claims. This version centers the actual workspace, the real modules, and the review flow traders will actually open."
              />
            </Reveal>

            <div className="lp-transparency-grid">
              {TRANSPARENCY_CARDS.map((card, index) => (
                <Reveal key={card.title} delay={index * 0.06}>
                  <div className="lp-transparency-card">
                    <div className="lp-icon-chip" style={{ marginBottom: 16 }}>
                      <Icon name={card.icon} />
                    </div>
                    <h3>{card.title}</h3>
                    <p>{card.copy}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-section" style={{ paddingTop: 36 }}>
          <div className="lp-section-inner">
            <Reveal>
              <SectionHeading
                eyebrow="Screens"
                title="Real product-style previews instead of generic SaaS filler."
                description="The previews below are built around MarketFlow modules and naming, not around fake notebook cards or decorative widgets. Hover them and the analytics surfaces move with a cleaner, more professional motion language."
              />
            </Reveal>

            <ShowcaseScreens />
          </div>
        </section>

        <section className="lp-section" id="modules">
          <div className="lp-section-inner">
            <Reveal>
              <SectionHeading
                eyebrow="Features"
                title="What the journal already exposes today."
                description="Each block below maps to pages or modules already accessible in the current product. If a capability is still too soft or too incomplete, it stays off the landing."
              />
            </Reveal>

            <div className="lp-feature-grid">
              {FEATURE_CARDS.map((feature, index) => (
                <Reveal key={feature.title} delay={index * 0.05}>
                  <div className="lp-feature-card">
                    <div className="lp-feature-top">
                      <div className="lp-icon-chip">
                        <Icon name={feature.icon} />
                      </div>
                      <div className="lp-plan-pill">{feature.plan}</div>
                    </div>
                    <h3>{feature.title}</h3>
                    <p>{feature.copy}</p>
                    <ul className="lp-feature-points">
                      {feature.points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-section" style={{ paddingTop: 36 }}>
          <div className="lp-section-inner">
            <Reveal>
              <SectionHeading
                eyebrow="Live map"
                title="Current page map inside MarketFlow."
                description="This is the product map the landing now follows: pages, plan level, and actual review purpose. No abstract marketing bullets detached from the journal."
              />
            </Reveal>

            <div className="lp-module-grid">
              {MODULES.map((module, index) => (
                <Reveal key={module.route} delay={index * 0.04}>
                  <div className="lp-module-card">
                    <div className="lp-module-meta">
                      <div className="lp-module-route">{module.route}</div>
                      <div className="lp-module-level">{module.level}</div>
                    </div>
                    <h3>{module.title}</h3>
                    <p>{module.copy}</p>
                    <ul className="lp-module-points">
                      {module.points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-section" id="pricing">
          <div className="lp-section-inner">
            <Reveal>
              <SectionHeading
                eyebrow="Pricing"
                title="Plan messaging aligned to what is unlocked in the journal."
                description="No fake urgency, no invented discounts, and no features pushed into the wrong plan. These cards are written to match the current product routing and module access."
              />
            </Reveal>

            <div className="lp-plan-grid">
              {PLAN_CARDS.map((plan, index) => (
                <Reveal key={plan.id} delay={index * 0.06}>
                  <div className={`lp-plan-card ${plan.featured ? 'featured' : ''}`}>
                    <div className="lp-plan-head">
                      <div>
                        <h3 className="lp-plan-name">{plan.name}</h3>
                        <div className="lp-plan-caption">{plan.copy}</div>
                      </div>
                      <div className="lp-plan-badge">{plan.badge}</div>
                    </div>

                    <div className="lp-plan-price">
                      {plan.price} <small>/ month</small>
                    </div>

                    <ul className="lp-plan-list">
                      {plan.features.map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>

                    <button
                      className={plan.featured ? 'lp-btn-primary' : 'lp-btn-secondary'}
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={() => (onSignupWithPlan ? onSignupWithPlan(plan.priceId) : onSignup?.())}
                    >
                      Start {plan.name}
                    </button>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.12}>
              <div className="lp-pricing-note">
                Every paid plan currently starts through the same activation flow with card required. The landing keeps that flow explicit instead of hiding it behind vague trial language.
              </div>
            </Reveal>
          </div>
        </section>

        <section className="lp-section" id="faq">
          <div className="lp-section-inner">
            <Reveal>
              <SectionHeading
                eyebrow="FAQ"
                title="Straight answers, without selling a fantasy."
                description="These are the practical questions a careful buyer should ask before trusting a trading journal landing page."
              />
            </Reveal>

            <div className="lp-faq-grid">
              {FAQS.map((faq, index) => (
                <Reveal key={faq.question} delay={index * 0.04}>
                  <div className="lp-faq-card">
                    <h3>{faq.question}</h3>
                    <p>{faq.answer}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <footer className="lp-footer">
          <div className="lp-footer-inner">
            <div className="lp-footer-copy">
              MarketFlow Journal. Built for structured review, sharper execution, and cleaner accountability.
              <br />
              Prop firm names shown on this page are examples of well-known firms, not partnership claims.
            </div>
            <div className="lp-footer-links">
              <button onClick={() => goTo('workspace')}>Workspace</button>
              <button onClick={() => goTo('modules')}>Modules</button>
              <button onClick={() => goTo('pricing')}>Pricing</button>
              <button onClick={() => goTo('faq')}>FAQ</button>
              <a href="mailto:marketflowjournal0@gmail.com">Contact</a>
              <button onClick={onLogin}>Log in</button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
