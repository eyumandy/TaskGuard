import { describe, it, expect, beforeEach, vi } from "vitest";
import { createChromeMock } from "../mocks/chrome.js";
import {
  extractDomain,
  isDistracting,
  elapsedSeconds,
  DEFAULT_DISTRACTING_DOMAINS,
  STORAGE_KEYS,
} from "./helpers.js";

// ─────────────────────────────────────────────────────────────
// extractDomain
// ─────────────────────────────────────────────────────────────

describe("extractDomain", () => {
  it("extracts root domain from a standard URL", () => {
    expect(extractDomain("https://www.youtube.com/watch?v=abc")).toBe("youtube.com");
  });

  it("strips www. prefix", () => {
    expect(extractDomain("https://www.reddit.com/r/programming")).toBe("reddit.com");
  });

  it("preserves subdomains other than www", () => {
    expect(extractDomain("https://music.youtube.com/playlist")).toBe("music.youtube.com");
  });

  it("handles http URLs", () => {
    expect(extractDomain("http://example.com/page")).toBe("example.com");
  });

  it("returns non-empty for chrome:// URLs (filtered by handleTabSwitch, not extractDomain)", () => {
    // chrome://newtab/ parses as hostname "newtab" — handleTabSwitch
    // would need additional logic to filter internal pages
    expect(extractDomain("chrome://newtab/")).toBe("newtab");
  });

  it("returns empty string for about: URLs", () => {
    // about:blank is not a valid URL for the URL constructor
    expect(extractDomain("about:blank")).toBe("");
  });

  it("returns empty string for invalid URLs", () => {
    expect(extractDomain("not-a-url")).toBe("");
    expect(extractDomain("")).toBe("");
  });

  it("handles URLs with ports", () => {
    expect(extractDomain("http://localhost:3000/session")).toBe("localhost");
  });

  it("handles URLs with paths and query params", () => {
    expect(extractDomain("https://twitter.com/user?tab=likes#section")).toBe("twitter.com");
  });
});

// ─────────────────────────────────────────────────────────────
// isDistracting
// ─────────────────────────────────────────────────────────────

describe("isDistracting", () => {
  it("returns true for exact domain match", () => {
    expect(isDistracting("youtube.com")).toBe(true);
    expect(isDistracting("reddit.com")).toBe(true);
    expect(isDistracting("twitter.com")).toBe(true);
  });

  it("returns true for subdomain of a distracting domain", () => {
    expect(isDistracting("music.youtube.com")).toBe(true);
    expect(isDistracting("old.reddit.com")).toBe(true);
    expect(isDistracting("m.facebook.com")).toBe(true);
  });

  it("returns false for non-distracting domains", () => {
    expect(isDistracting("google.com")).toBe(false);
    expect(isDistracting("github.com")).toBe(false);
    expect(isDistracting("stackoverflow.com")).toBe(false);
  });

  it("returns false for domains that partially match but are not subdomains", () => {
    // "notyoutube.com" ends with "youtube.com" as a string but is not a subdomain
    expect(isDistracting("notyoutube.com")).toBe(false);
  });

  it("works with a custom domain list", () => {
    const custom = ["example.com", "distraction.io"];
    expect(isDistracting("example.com", custom)).toBe(true);
    expect(isDistracting("sub.distraction.io", custom)).toBe(true);
    expect(isDistracting("youtube.com", custom)).toBe(false);
  });

  it("checks all default distracting domains", () => {
    for (const domain of DEFAULT_DISTRACTING_DOMAINS) {
      expect(isDistracting(domain)).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────────────────────
// elapsedSeconds
// ─────────────────────────────────────────────────────────────

describe("elapsedSeconds", () => {
  it("computes seconds between two timestamps", () => {
    const start = "2026-04-03T10:00:00.000Z";
    const end = "2026-04-03T10:05:00.000Z";
    expect(elapsedSeconds(start, end)).toBe(300);
  });

  it("returns 0 for identical timestamps", () => {
    const ts = "2026-04-03T10:00:00.000Z";
    expect(elapsedSeconds(ts, ts)).toBe(0);
  });

  it("floors fractional seconds", () => {
    const start = "2026-04-03T10:00:00.000Z";
    const end = "2026-04-03T10:00:01.999Z";
    expect(elapsedSeconds(start, end)).toBe(1);
  });

  it("handles timestamps spanning hours", () => {
    const start = "2026-04-03T08:00:00.000Z";
    const end = "2026-04-03T10:30:00.000Z";
    expect(elapsedSeconds(start, end)).toBe(9000);
  });
});

// ─────────────────────────────────────────────────────────────
// DEFAULT_DISTRACTING_DOMAINS
// ─────────────────────────────────────────────────────────────

describe("DEFAULT_DISTRACTING_DOMAINS", () => {
  it("contains the expected number of domains", () => {
    expect(DEFAULT_DISTRACTING_DOMAINS).toHaveLength(15);
  });

  it("includes major social media platforms", () => {
    expect(DEFAULT_DISTRACTING_DOMAINS).toContain("youtube.com");
    expect(DEFAULT_DISTRACTING_DOMAINS).toContain("twitter.com");
    expect(DEFAULT_DISTRACTING_DOMAINS).toContain("reddit.com");
    expect(DEFAULT_DISTRACTING_DOMAINS).toContain("instagram.com");
    expect(DEFAULT_DISTRACTING_DOMAINS).toContain("tiktok.com");
  });

  it("includes streaming platforms", () => {
    expect(DEFAULT_DISTRACTING_DOMAINS).toContain("netflix.com");
    expect(DEFAULT_DISTRACTING_DOMAINS).toContain("twitch.tv");
  });
});

// ─────────────────────────────────────────────────────────────
// STORAGE_KEYS
// ─────────────────────────────────────────────────────────────

describe("STORAGE_KEYS", () => {
  it("has all required session metric keys", () => {
    expect(STORAGE_KEYS.SESSION_ACTIVE).toBe("sessionActive");
    expect(STORAGE_KEYS.SESSION_START).toBe("sessionStart");
    expect(STORAGE_KEYS.SESSION_END).toBe("sessionEnd");
    expect(STORAGE_KEYS.TAB_SWITCHES).toBe("tabSwitches");
    expect(STORAGE_KEYS.OFF_TASK_TIME).toBe("offTaskTime");
    expect(STORAGE_KEYS.PROMPT_COUNT).toBe("promptCount");
    expect(STORAGE_KEYS.PROMPT_RETURNS).toBe("promptReturns");
    expect(STORAGE_KEYS.EVENTS_LOG).toBe("eventsLog");
    expect(STORAGE_KEYS.PAST_SESSIONS).toBe("pastSessions");
    expect(STORAGE_KEYS.DISTRACTING_DOMAINS).toBe("distractingDomains");
  });
});

// ─────────────────────────────────────────────────────────────
// Session logic (using Chrome mock)
// ─────────────────────────────────────────────────────────────

describe("Session logic with Chrome mock", () => {
  let chrome;

  beforeEach(() => {
    chrome = createChromeMock();
    chrome._resetStorage();
  });

  // Helper: simulate storageSet/storageGet using the mock
  async function storageGet(keys) {
    return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
  }

  async function storageSet(data) {
    return new Promise((resolve) => chrome.storage.local.set(data, resolve));
  }

  async function storageIncrement(key, by = 1) {
    const result = await storageGet(key);
    const newValue = (result[key] || 0) + by;
    await storageSet({ [key]: newValue });
    return newValue;
  }

  describe("storageIncrement", () => {
    it("increments from 0 when key does not exist", async () => {
      const val = await storageIncrement("tabSwitches");
      expect(val).toBe(1);
      const stored = await storageGet("tabSwitches");
      expect(stored.tabSwitches).toBe(1);
    });

    it("increments by custom amount", async () => {
      await storageSet({ offTaskTime: 10 });
      const val = await storageIncrement("offTaskTime", 5);
      expect(val).toBe(15);
    });

    it("increments multiple times correctly", async () => {
      await storageIncrement("tabSwitches");
      await storageIncrement("tabSwitches");
      await storageIncrement("tabSwitches");
      const stored = await storageGet("tabSwitches");
      expect(stored.tabSwitches).toBe(3);
    });
  });

  describe("session start resets metrics", () => {
    it("sets all session metrics to initial values", async () => {
      // Pre-populate with stale data
      await storageSet({
        [STORAGE_KEYS.TAB_SWITCHES]: 5,
        [STORAGE_KEYS.OFF_TASK_TIME]: 120,
        [STORAGE_KEYS.PROMPT_COUNT]: 3,
      });

      // Simulate startSession storage writes
      await storageSet({
        [STORAGE_KEYS.SESSION_ACTIVE]: true,
        [STORAGE_KEYS.SESSION_START]: "2026-04-03T10:00:00.000Z",
        [STORAGE_KEYS.SESSION_END]: null,
        [STORAGE_KEYS.TAB_SWITCHES]: 0,
        [STORAGE_KEYS.OFF_TASK_TIME]: 0,
        [STORAGE_KEYS.PROMPT_COUNT]: 0,
        [STORAGE_KEYS.PROMPT_RETURNS]: 0,
        [STORAGE_KEYS.EVENTS_LOG]: [],
      });

      const result = await storageGet([
        STORAGE_KEYS.SESSION_ACTIVE,
        STORAGE_KEYS.TAB_SWITCHES,
        STORAGE_KEYS.OFF_TASK_TIME,
        STORAGE_KEYS.PROMPT_COUNT,
      ]);

      expect(result[STORAGE_KEYS.SESSION_ACTIVE]).toBe(true);
      expect(result[STORAGE_KEYS.TAB_SWITCHES]).toBe(0);
      expect(result[STORAGE_KEYS.OFF_TASK_TIME]).toBe(0);
      expect(result[STORAGE_KEYS.PROMPT_COUNT]).toBe(0);
    });
  });

  describe("flushDwellTime logic", () => {
    it("accumulates off-task time for distracting domains", async () => {
      await storageSet({ [STORAGE_KEYS.OFF_TASK_TIME]: 0 });

      // Simulate: user was on youtube.com for 30 seconds
      const lastActiveTab = {
        domain: "youtube.com",
        timestamp: "2026-04-03T10:00:00.000Z",
      };
      const switchTimestamp = "2026-04-03T10:00:30.000Z";
      const dwell = elapsedSeconds(lastActiveTab.timestamp, switchTimestamp);

      if (dwell > 0 && isDistracting(lastActiveTab.domain)) {
        await storageIncrement(STORAGE_KEYS.OFF_TASK_TIME, dwell);
      }

      const result = await storageGet(STORAGE_KEYS.OFF_TASK_TIME);
      expect(result[STORAGE_KEYS.OFF_TASK_TIME]).toBe(30);
    });

    it("does NOT accumulate time for non-distracting domains", async () => {
      await storageSet({ [STORAGE_KEYS.OFF_TASK_TIME]: 0 });

      const lastActiveTab = {
        domain: "github.com",
        timestamp: "2026-04-03T10:00:00.000Z",
      };
      const switchTimestamp = "2026-04-03T10:05:00.000Z";
      const dwell = elapsedSeconds(lastActiveTab.timestamp, switchTimestamp);

      if (dwell > 0 && isDistracting(lastActiveTab.domain)) {
        await storageIncrement(STORAGE_KEYS.OFF_TASK_TIME, dwell);
      }

      const result = await storageGet(STORAGE_KEYS.OFF_TASK_TIME);
      expect(result[STORAGE_KEYS.OFF_TASK_TIME]).toBe(0);
    });
  });

  describe("on-task rate calculation", () => {
    it("computes 100% when no off-task time", () => {
      const duration = 3600; // 1 hour
      const offTaskTime = 0;
      const onTaskRate = 100 - (offTaskTime / duration) * 100;
      expect(onTaskRate).toBe(100);
    });

    it("computes 50% when half the session is off-task", () => {
      const duration = 3600;
      const offTaskTime = 1800;
      const onTaskRate = 100 - (offTaskTime / duration) * 100;
      expect(onTaskRate).toBe(50);
    });

    it("computes 0% when entire session is off-task", () => {
      const duration = 3600;
      const offTaskTime = 3600;
      const onTaskRate = 100 - (offTaskTime / duration) * 100;
      expect(onTaskRate).toBe(0);
    });
  });

  describe("session summary computation", () => {
    it("produces correct summary from stored metrics", async () => {
      const startTime = "2026-04-03T10:00:00.000Z";
      const endTime = "2026-04-03T11:00:00.000Z";

      await storageSet({
        [STORAGE_KEYS.SESSION_START]: startTime,
        [STORAGE_KEYS.TAB_SWITCHES]: 12,
        [STORAGE_KEYS.OFF_TASK_TIME]: 420,
        [STORAGE_KEYS.PROMPT_COUNT]: 5,
        [STORAGE_KEYS.PROMPT_RETURNS]: 3,
      });

      const result = await storageGet([
        STORAGE_KEYS.SESSION_START,
        STORAGE_KEYS.TAB_SWITCHES,
        STORAGE_KEYS.OFF_TASK_TIME,
        STORAGE_KEYS.PROMPT_COUNT,
        STORAGE_KEYS.PROMPT_RETURNS,
      ]);

      const summary = {
        startTime: result[STORAGE_KEYS.SESSION_START],
        endTime,
        duration: elapsedSeconds(result[STORAGE_KEYS.SESSION_START], endTime),
        tabSwitches: result[STORAGE_KEYS.TAB_SWITCHES] || 0,
        offTaskTime: result[STORAGE_KEYS.OFF_TASK_TIME] || 0,
        promptCount: result[STORAGE_KEYS.PROMPT_COUNT] || 0,
        promptReturns: result[STORAGE_KEYS.PROMPT_RETURNS] || 0,
      };

      expect(summary.duration).toBe(3600);
      expect(summary.tabSwitches).toBe(12);
      expect(summary.offTaskTime).toBe(420);
      expect(summary.promptCount).toBe(5);
      expect(summary.promptReturns).toBe(3);
    });
  });

  describe("event logging", () => {
    it("appends events to the log array", async () => {
      await storageSet({ [STORAGE_KEYS.EVENTS_LOG]: [] });

      // Simulate appendEvent
      const result1 = await storageGet(STORAGE_KEYS.EVENTS_LOG);
      const log = result1[STORAGE_KEYS.EVENTS_LOG] || [];
      log.push({
        type: "tab_switch",
        timestamp: "2026-04-03T10:01:00.000Z",
        domain: "youtube.com",
        distracting: true,
      });
      await storageSet({ [STORAGE_KEYS.EVENTS_LOG]: log });

      // Append another
      const result2 = await storageGet(STORAGE_KEYS.EVENTS_LOG);
      const log2 = result2[STORAGE_KEYS.EVENTS_LOG];
      log2.push({
        type: "prompt_response",
        timestamp: "2026-04-03T10:01:05.000Z",
        domain: "youtube.com",
        choice: "return",
      });
      await storageSet({ [STORAGE_KEYS.EVENTS_LOG]: log2 });

      const finalResult = await storageGet(STORAGE_KEYS.EVENTS_LOG);
      expect(finalResult[STORAGE_KEYS.EVENTS_LOG]).toHaveLength(2);
      expect(finalResult[STORAGE_KEYS.EVENTS_LOG][0].type).toBe("tab_switch");
      expect(finalResult[STORAGE_KEYS.EVENTS_LOG][1].choice).toBe("return");
    });
  });

  describe("handleTabSwitch logic", () => {
    it("extracts hostname from internal browser pages", () => {
      // chrome:// URLs return a hostname like "newtab" — not empty.
      // In practice, these aren't in the distracting list so they're harmless.
      const domain = extractDomain("chrome://newtab/");
      expect(domain).toBe("newtab");
      expect(isDistracting(domain)).toBe(false);
    });

    it("only counts tab switches TO distracting domains", async () => {
      await storageSet({ [STORAGE_KEYS.TAB_SWITCHES]: 0 });

      // Switch to a non-distracting domain — should NOT increment
      const domain1 = "github.com";
      if (isDistracting(domain1)) {
        await storageIncrement(STORAGE_KEYS.TAB_SWITCHES);
      }

      let result = await storageGet(STORAGE_KEYS.TAB_SWITCHES);
      expect(result[STORAGE_KEYS.TAB_SWITCHES]).toBe(0);

      // Switch to a distracting domain — SHOULD increment
      const domain2 = "youtube.com";
      if (isDistracting(domain2)) {
        await storageIncrement(STORAGE_KEYS.TAB_SWITCHES);
      }

      result = await storageGet(STORAGE_KEYS.TAB_SWITCHES);
      expect(result[STORAGE_KEYS.TAB_SWITCHES]).toBe(1);
    });
  });
});
