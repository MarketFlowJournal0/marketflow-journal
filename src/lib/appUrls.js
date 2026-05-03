const DEFAULT_SITE_URL = 'https://marketflowjournal.com';
const DEFAULT_APP_URL = 'https://app.marketflowjournal.com';

export const PUBLIC_SITE_URL = stripTrailingSlash(
  process.env.REACT_APP_SITE_URL
  || process.env.REACT_APP_PUBLIC_SITE_URL
  || DEFAULT_SITE_URL
);
export const SITE_URL = PUBLIC_SITE_URL;
export const APP_URL = stripTrailingSlash(
  process.env.REACT_APP_APP_URL || DEFAULT_APP_URL
);

const PUBLIC_HOST = normalizeHostname(getUrlHost(PUBLIC_SITE_URL));
const PUBLIC_APEX_HOST = PUBLIC_HOST.replace(/^www\./, '');
const APP_HOST = normalizeHostname(getUrlHost(APP_URL));

export const DOMAIN_SURFACES = {
  APP: 'app',
  MARKETING: 'marketing',
};

export function getDomainSurface(hostname = getHostname()) {
  return isAppHost(hostname) ? DOMAIN_SURFACES.APP : DOMAIN_SURFACES.MARKETING;
}

export function shouldRenderApp(hostname = getHostname()) {
  return getDomainSurface(hostname) === DOMAIN_SURFACES.APP;
}

export function shouldRenderMarketing(hostname = getHostname()) {
  return getDomainSurface(hostname) === DOMAIN_SURFACES.MARKETING;
}

export function isLocalAppHost(hostname = getHostname()) {
  const host = normalizeHostname(hostname);
  return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '';
}

export function isPreviewHost(hostname = getHostname()) {
  const host = normalizeHostname(hostname);
  return host.endsWith('.vercel.app');
}

export function isConfiguredAppHost(hostname = getHostname()) {
  const host = normalizeHostname(hostname);
  return Boolean(host && (host === APP_HOST || host.startsWith('app.')));
}

export function isAppHost(hostname = getHostname()) {
  return isConfiguredAppHost(hostname) || isLocalAppHost(hostname) || isPreviewHost(hostname);
}

export function isPublicSiteHost(hostname = getHostname()) {
  const host = normalizeHostname(hostname);
  return host === PUBLIC_HOST
    || host === PUBLIC_APEX_HOST
    || host === `www.${PUBLIC_APEX_HOST}`;
}

export function isDedicatedAppHost(hostname = getHostname()) {
  return isAppHost(hostname);
}

export function hasDedicatedAppDomain() {
  return Boolean(APP_HOST && PUBLIC_HOST && APP_HOST !== PUBLIC_HOST);
}

export function getAppOrigin() {
  if (typeof window !== 'undefined' && isAppHost(window.location.hostname)) {
    return window.location.origin;
  }
  return APP_URL;
}

export function getPublicSiteOrigin() {
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

function normalizeHostname(hostname) {
  return String(hostname || '').trim().toLowerCase().replace(/^\[|\]$/g, '');
}
