export const PUBLIC_SITE_URL = 'https://marketflowjournal.com';
export const APP_URL = 'https://app.marketflowjournal.com';

export function isLocalAppHost(hostname = getHostname()) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '';
}

export function isPreviewHost(hostname = getHostname()) {
  return hostname.endsWith('.vercel.app');
}

export function isAppHost(hostname = getHostname()) {
  return hostname === 'app.marketflowjournal.com' || isLocalAppHost(hostname) || isPreviewHost(hostname);
}

export function isPublicSiteHost(hostname = getHostname()) {
  return hostname === 'marketflowjournal.com' || hostname === 'www.marketflowjournal.com';
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

function getHostname() {
  if (typeof window === 'undefined') return '';
  return window.location.hostname;
}
