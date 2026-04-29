export const PUBLIC_SITE_URL = stripTrailingSlash(
  normalizePublicSiteUrl(process.env.REACT_APP_PUBLIC_SITE_URL || 'https://www.marketflowjournal.com')
);
export const APP_URL = stripTrailingSlash(
  process.env.REACT_APP_APP_URL || 'https://app.marketflowjournal.com'
);
const ENABLE_DEDICATED_APP_DOMAIN = String(process.env.REACT_APP_ENABLE_APP_DOMAIN || '').toLowerCase() === 'true';

const PUBLIC_HOST = getUrlHost(PUBLIC_SITE_URL);
const PUBLIC_APEX_HOST = PUBLIC_HOST.replace(/^www\./, '');
const APP_HOST = getUrlHost(APP_URL);

export function isLocalAppHost(hostname = getHostname()) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '';
}

export function isPreviewHost(hostname = getHostname()) {
  return hostname.endsWith('.vercel.app');
}

export function isAppHost(hostname = getHostname()) {
  return hostname === APP_HOST || isLocalAppHost(hostname) || isPreviewHost(hostname);
}

export function isPublicSiteHost(hostname = getHostname()) {
  return hostname === PUBLIC_HOST
    || hostname === PUBLIC_APEX_HOST
    || hostname === `www.${PUBLIC_APEX_HOST}`;
}

export function isDedicatedAppHost(hostname = getHostname()) {
  return Boolean(hasDedicatedAppDomain() && APP_HOST && hostname === APP_HOST);
}

export function hasDedicatedAppDomain() {
  return Boolean(ENABLE_DEDICATED_APP_DOMAIN && APP_HOST && PUBLIC_HOST && APP_HOST !== PUBLIC_HOST);
}

export function getAppOrigin() {
  if (!hasDedicatedAppDomain()) {
    if (typeof window !== 'undefined' && (isLocalAppHost(window.location.hostname) || isPreviewHost(window.location.hostname))) {
      return window.location.origin;
    }
    return PUBLIC_SITE_URL;
  }
  if (typeof window === 'undefined') return APP_URL;
  if (isAppHost(window.location.hostname)) return window.location.origin;
  return APP_URL;
}

export function getPublicSiteOrigin() {
  if (typeof window === 'undefined') return PUBLIC_SITE_URL;
  if (isLocalAppHost(window.location.hostname) || isPreviewHost(window.location.hostname)) {
    return window.location.origin;
  }
  return PUBLIC_SITE_URL;
}

export function appUrl(path = '/') {
  return `${getAppOrigin()}${normalizePath(path)}`;
}

export function publicSiteUrl(path = '/') {
  return `${getPublicSiteOrigin()}${normalizePath(path)}`;
}

function normalizePath(path) {
  if (!path) return '/';
  return path.startsWith('/') ? path : `/${path}`;
}

function stripTrailingSlash(url) {
  return String(url || '').replace(/\/+$/, '');
}

function normalizePublicSiteUrl(url) {
  const clean = stripTrailingSlash(url);
  try {
    const parsed = new URL(clean);
    if (parsed.hostname === 'marketflowjournal.com') {
      parsed.hostname = 'www.marketflowjournal.com';
      return parsed.toString().replace(/\/+$/, '');
    }
  } catch (_) {}
  return clean;
}

function getHostname() {
  if (typeof window === 'undefined') return '';
  return window.location.hostname;
}

function getUrlHost(url) {
  try {
    return new URL(url).hostname;
  } catch (_) {
    return '';
  }
}
