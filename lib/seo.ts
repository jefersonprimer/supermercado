const configuredSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://fanfarfarmacia.vercel.app");

export const siteUrl = new URL(configuredSiteUrl);

export function absoluteUrl(path: string): string {
  return new URL(path, siteUrl).toString();
}
