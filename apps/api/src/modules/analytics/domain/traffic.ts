/* Privacy-first analytics rules. Only daily aggregate counters are stored:
   page path, a referrer category, an optional country code supplied by a
   trusted edge, and a count. No IP address, cookie, user agent or visitor
   identifier is kept, so artists never see personal data. */

const BOT = /bot|crawl|spider|slurp|preview|fetch|monitor|headless|lighthouse|python|curl|wget|httpclient|facebookexternalhit|embedly|discordbot|whatsapp|telegram/i;
const GROUPS: [string, RegExp][] = [
  ["search", /(^|\.)(google|bing|duckduckgo|yahoo|ecosia|yandex|baidu|brave|startpage)\./],
  ["social", /(^|\.)(instagram|facebook|fb|x|twitter|t|tiktok|pinterest|bsky|tumblr|reddit|threads|linkedin|youtube|discord|mastodon|whatsapp|telegram)\./],
  ["art", /(^|\.)(artstation|deviantart|behance|dribbble|cara|ko-fi|patreon|vgen|pixiv|newgrounds)\./],
];

/** Requests without a user agent or from known automated clients are not counted. */
export const isAutomated = (agent: string) => !agent || BOT.test(agent);

export function referrerCategory(host: string | undefined, self: string[]) {
  if (!host) return "direct";
  const h = host.toLowerCase();
  if (self.some((s) => h === s || h.endsWith("." + s))) return "internal";
  return GROUPS.find(([, re]) => re.test(h + "."))?.[0] ?? "other";
}

/** Drops query, fragment and trailing slashes; bounds the stored length. */
export const countedPath = (path: string) =>
  path.split(/[?#]/)[0].replace(/\/+$/, "").slice(0, 200) || "/";

/** Free plans see 30 days; advanced analytics up to a year. */
export const reportWindow = (advanced: boolean, requested: number) => {
  const max = advanced ? 365 : 30;
  return { max, days: Math.min(max, requested) };
};
