const OFFICIAL_APP_URL = 'https://app.marketflowjournal.com';
const OFFICIAL_SITE_URL = 'https://www.marketflowjournal.com';

const PUBLIC_HOSTS = new Set(['marketflowjournal.com', 'www.marketflowjournal.com']);
const OFFICIAL_APP_HOST = 'app.marketflowjournal.com';

function getAppBaseUrl() {
  return normalizeBaseUrl(
    process.env.NEXT_PUBLIC_APP_URL
      || process.env.APP_URL
      || process.env.REACT_APP_APP_URL
      || OFFICIAL_APP_URL,
    OFFICIAL_APP_URL,
    'app'
  );
}

function getPublicSiteBaseUrl() {
  return normalizeBaseUrl(
    process.env.NEXT_PUBLIC_SITE_URL
      || process.env.PUBLIC_SITE_URL
      || process.env.REACT_APP_SITE_URL
      || process.env.REACT_APP_PUBLIC_SITE_URL
      || OFFICIAL_SITE_URL,
    OFFICIAL_SITE_URL,
    'public'
  );
}

function normalizeBaseUrl(rawUrl, fallbackUrl, surface) {
  try {
    const parsed = new URL(rawUrl || fallbackUrl);
    const host = parsed.hostname.toLowerCase();

    if (!['http:', 'https:'].includes(parsed.protocol)) return fallbackUrl;
    if (surface === 'app' && PUBLIC_HOSTS.has(host)) return fallbackUrl;
    if (surface === 'public' && (host === OFFICIAL_APP_HOST || host.startsWith('app.'))) return fallbackUrl;

    if (surface === 'public' && host === 'marketflowjournal.com') {
      parsed.hostname = 'www.marketflowjournal.com';
    }

    parsed.pathname = '';
    parsed.search = '';
    parsed.hash = '';
    return parsed.toString().replace(/\/+$/, '');
  } catch (_) {
    return fallbackUrl;
  }
}

module.exports = {
  OFFICIAL_APP_URL,
  OFFICIAL_SITE_URL,
  getAppBaseUrl,
  getPublicSiteBaseUrl,
};
