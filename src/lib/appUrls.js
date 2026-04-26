export const PUBLIC_SITE_URL = stripTrailingSlash(
  process.env.REACT_APP_PUBLIC_SITE_URL || 'https://marketflowjournal.com'
);
export const APP_URL = stripTrailingSlash(
  process.env.REACT_APP_APP_URL || PUBLIC_SITE_URL
);

const PUBLIC_HOST = getUrlHost(PUBLIC_SITE_URL);
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
  return hostname === PUBLIC_HOST || hostname === `www.${PUBLIC_HOST}`;
}

export function hasDedicatedAppDomain() {
  return Boolean(APP_HOST && PUBLIC_HOST && APP_HOST !== PUBLIC_HOST);
}

export function getAppOrigin() {
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
