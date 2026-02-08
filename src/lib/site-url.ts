const DEFAULT_SITE_URL = "http://localhost:3000";

export function getSiteUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return siteUrl && siteUrl.length > 0 ? siteUrl : DEFAULT_SITE_URL;
}

export function getMetadataBase() {
  try {
    return new URL(getSiteUrl());
  } catch {
    return new URL(DEFAULT_SITE_URL);
  }
}
