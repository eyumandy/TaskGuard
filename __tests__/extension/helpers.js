/**
 * Pure functions extracted from background.js and content.js for testing.
 *
 * These are direct copies of the logic in the extension files.
 * The extension files are not ES modules (Chrome MV3 classic service worker),
 * so we mirror the functions here to make them importable by Vitest.
 */

// ─── Constants (from background.js) ────────────────────────

export const DEFAULT_DISTRACTING_DOMAINS = [
  "youtube.com",
  "twitter.com",
  "x.com",
  "reddit.com",
  "instagram.com",
  "facebook.com",
  "tiktok.com",
  "netflix.com",
  "twitch.tv",
  "discord.com",
  "snapchat.com",
  "pinterest.com",
  "9gag.com",
  "buzzfeed.com",
  "tumblr.com",
];

export const STORAGE_KEYS = {
  SESSION_ACTIVE: "sessionActive",
  SESSION_START: "sessionStart",
  SESSION_END: "sessionEnd",
  TAB_SWITCHES: "tabSwitches",
  OFF_TASK_TIME: "offTaskTime",
  PROMPT_COUNT: "promptCount",
  PROMPT_RETURNS: "promptReturns",
  EVENTS_LOG: "eventsLog",
  PAST_SESSIONS: "pastSessions",
  DISTRACTING_DOMAINS: "distractingDomains",
};

// ─── Pure functions (from background.js) ───────────────────

export function extractDomain(url) {
  try {
    const { hostname } = new URL(url);
    return hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function isDistracting(domain, distractingDomains = DEFAULT_DISTRACTING_DOMAINS) {
  return distractingDomains.some((d) => domain === d || domain.endsWith(`.${d}`));
}

export function elapsedSeconds(start, end) {
  return Math.floor((new Date(end) - new Date(start)) / 1000);
}

// ─── Pure functions (from content.js) ──────────────────────

export function formatTime(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}
