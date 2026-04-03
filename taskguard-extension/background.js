// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

/**
 * Default list of domains classified as distracting.
 * Users can extend this list via the web app's Settings page,
 * which writes to chrome.storage.local under "distractingDomains".
 */
const DEFAULT_DISTRACTING_DOMAINS = [
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

/**
 * Storage keys used across the extension and web app.
 * Centralizing these prevents key mismatch bugs.
 */
const STORAGE_KEYS = {
  SESSION_ACTIVE: "sessionActive",         // boolean
  SESSION_START:  "sessionStart",          // ISO timestamp string
  SESSION_END:    "sessionEnd",            // ISO timestamp string | null
  TAB_SWITCHES:   "tabSwitches",           // number
  OFF_TASK_TIME:  "offTaskTime",           // seconds (number)
  PROMPT_COUNT:   "promptCount",           // number
  PROMPT_RETURNS: "promptReturns",         // number (chose "Return to Study")
  EVENTS_LOG:     "eventsLog",             // array of event objects
  PAST_SESSIONS:  "pastSessions",          // array of completed session summaries
  DISTRACTING_DOMAINS: "distractingDomains", // string[] (user-customizable)
};

// ─────────────────────────────────────────────────────────────
// STATE (in-memory, resets if service worker is killed)
// Persisted state lives in chrome.storage.local
// ─────────────────────────────────────────────────────────────

let state = {
  sessionActive: false,
  sessionStart: null,        // Date object
  lastActiveTab: null,       // { tabId, domain, timestamp }
  distractingDomains: [...DEFAULT_DISTRACTING_DOMAINS],
  pendingOverlay: null,      // { tabId, domain } | null
  sessionMode: "strict",     // "focus" | "strict" | "zen"
  // zen = track silently, no overlay; focus/strict = show overlay
};

// ─────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────

/**
 * Extracts the root domain from a full URL string.
 * Strips subdomains (e.g. "www.") for consistent classification.
 *
 * @param {string} url - Full URL (e.g. "https://www.youtube.com/watch?v=...")
 * @returns {string} Root domain (e.g. "youtube.com") or "" if invalid
 *
 * @example
 * extractDomain("https://www.reddit.com/r/programming") // → "reddit.com"
 * extractDomain("chrome://newtab/")                     // → ""
 */
function extractDomain(url) {
  try {
    const { hostname } = new URL(url);
    // Remove leading "www." to normalize domain
    return hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/**
 * Checks whether a given domain is in the user's distraction list.
 *
 * @param {string} domain - Root domain (e.g. "youtube.com")
 * @returns {boolean} True if domain is classified as distracting
 */
function isDistracting(domain) {
  return state.distractingDomains.some(
    (d) => domain === d || domain.endsWith(`.${d}`)
  );
}

/**
 * Returns the current UTC timestamp as an ISO 8601 string.
 * @returns {string} e.g. "2026-04-02T14:30:00.000Z"
 */
function now() {
  return new Date().toISOString();
}

/**
 * Computes elapsed seconds between two ISO timestamp strings.
 *
 * @param {string} start - ISO timestamp
 * @param {string} end   - ISO timestamp
 * @returns {number} Elapsed time in seconds (floored)
 */
function elapsedSeconds(start, end) {
  return Math.floor((new Date(end) - new Date(start)) / 1000);
}

// ─────────────────────────────────────────────────────────────
// STORAGE MANAGER
// ─────────────────────────────────────────────────────────────

/**
 * Reads one or more keys from chrome.storage.local.
 *
 * @param {string | string[]} keys - Key(s) to retrieve
 * @returns {Promise<Object>} Object with requested key-value pairs
 */
async function storageGet(keys) {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, resolve);
  });
}

/**
 * Writes key-value pairs to chrome.storage.local.
 *
 * @param {Object} data - Key-value pairs to store
 * @returns {Promise<void>}
 */
async function storageSet(data) {
  return new Promise((resolve) => {
    chrome.storage.local.set(data, resolve);
  });
}

/**
 * Atomically increments a numeric value in chrome.storage.local.
 *
 * @param {string} key    - Storage key to increment
 * @param {number} [by=1] - Amount to increment by
 * @returns {Promise<number>} New value after increment
 */
async function storageIncrement(key, by = 1) {
  const result = await storageGet(key);
  const newValue = (result[key] || 0) + by;
  await storageSet({ [key]: newValue });
  return newValue;
}

/**
 * Appends an event object to the eventsLog array in storage.
 *
 * @param {Object} event - Event to log (see logTabSwitch, logPromptEvent)
 * @returns {Promise<void>}
 */
async function appendEvent(event) {
  const result = await storageGet(STORAGE_KEYS.EVENTS_LOG);
  const log = result[STORAGE_KEYS.EVENTS_LOG] || [];
  log.push(event);
  await storageSet({ [STORAGE_KEYS.EVENTS_LOG]: log });
}

// ─────────────────────────────────────────────────────────────
// SESSION MANAGER
// ─────────────────────────────────────────────────────────────

/**
 * Starts a new study session. Resets all session metrics in storage,
 * updates in-memory state, and fires an alarm to auto-end the session
 * if a duration is specified.
 *
 * @param {number} [durationMinutes=0] - Auto-end after N minutes; 0 = no auto-end
 * @param {string} [mode="strict"]     - Session mode: "focus" | "strict" | "zen"
 * @returns {Promise<void>}
 */
async function startSession(durationMinutes = 0, mode = "strict") {
  const startTime = now();
  state.sessionActive = true;
  state.sessionStart = startTime;
  state.lastActiveTab = null;
  state.sessionMode = mode; // store for use in handleTabSwitch

  // Reset all session metrics in storage
  await storageSet({
    [STORAGE_KEYS.SESSION_ACTIVE]: true,
    [STORAGE_KEYS.SESSION_START]:  startTime,
    [STORAGE_KEYS.SESSION_END]:    null,
    [STORAGE_KEYS.TAB_SWITCHES]:   0,
    [STORAGE_KEYS.OFF_TASK_TIME]:  0,
    [STORAGE_KEYS.PROMPT_COUNT]:   0,
    [STORAGE_KEYS.PROMPT_RETURNS]: 0,
    [STORAGE_KEYS.EVENTS_LOG]:     [],
  });

  // Set auto-end alarm if duration provided
  if (durationMinutes > 0) {
    chrome.alarms.create("sessionEnd", { delayInMinutes: durationMinutes });
  }

  // Initialize tracking from whichever tab is already active.
  // Without this, dwell time doesn't start until the first tab switch event —
  // so a distracting tab that was open before the session started is invisible
  // to the tracker, and the overlay never fires for it.
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab?.url) {
      const activeDomain = extractDomain(activeTab.url);
      if (activeDomain) {
        state.lastActiveTab = { tabId: activeTab.id, domain: activeDomain, timestamp: startTime };
        // Show overlay immediately if session is starting on a distracting site
        if (isDistracting(activeDomain)) {
          chrome.tabs.sendMessage(activeTab.id, {
            type: "SHOW_DISTRACTION_PROMPT",
            domain: activeDomain,
          }).catch(() => {
            // Tab may not have content script yet — safe to ignore
          });
        }
      }
    }
  } catch {
    // chrome.tabs.query can fail in restricted contexts — safe to ignore
  }

  console.log(`[TaskGuard] Session started at ${startTime}`);
}

/**
 * Ends the current study session. Computes final off-task time for
 * the last active tab, saves a session summary to pastSessions, and
 * resets active session state.
 *
 * @returns {Promise<Object>} Session summary object
 */
async function endSession() {
  if (!state.sessionActive) return null;

  const endTime = now();
  state.sessionActive = false;

  // Flush dwell time for the last active tab before ending
  if (state.lastActiveTab) {
    await flushDwellTime(endTime);
  }

  // Read final metrics
  const result = await storageGet([
    STORAGE_KEYS.SESSION_START,
    STORAGE_KEYS.TAB_SWITCHES,
    STORAGE_KEYS.OFF_TASK_TIME,
    STORAGE_KEYS.PROMPT_COUNT,
    STORAGE_KEYS.PROMPT_RETURNS,
    STORAGE_KEYS.EVENTS_LOG,
  ]);

  const summary = {
    id:           Date.now().toString(),
    startTime:    result[STORAGE_KEYS.SESSION_START],
    endTime,
    duration:     elapsedSeconds(result[STORAGE_KEYS.SESSION_START], endTime),
    tabSwitches:  result[STORAGE_KEYS.TAB_SWITCHES]   || 0,
    offTaskTime:  result[STORAGE_KEYS.OFF_TASK_TIME]  || 0,
    promptCount:  result[STORAGE_KEYS.PROMPT_COUNT]   || 0,
    promptReturns:result[STORAGE_KEYS.PROMPT_RETURNS] || 0,
  };

  // Persist summary to session history
  const historyResult = await storageGet(STORAGE_KEYS.PAST_SESSIONS);
  const history = historyResult[STORAGE_KEYS.PAST_SESSIONS] || [];
  history.push(summary);

  await storageSet({
    [STORAGE_KEYS.SESSION_ACTIVE]: false,
    [STORAGE_KEYS.SESSION_END]:    endTime,
    [STORAGE_KEYS.PAST_SESSIONS]:  history,
  });

  chrome.alarms.clear("sessionEnd");
  state.lastActiveTab = null;
  state.pendingOverlay = null;

  console.log("[TaskGuard] Session ended:", summary);
  return summary;
}

// ─────────────────────────────────────────────────────────────
// TAB TRACKER
// ─────────────────────────────────────────────────────────────

/**
 * Flushes dwell time for the previously active tab into storage.
 * If the tab was on a distracting domain, its dwell time is added
 * to the offTaskTime accumulator.
 *
 * @param {string} switchTimestamp - ISO timestamp when the switch occurred
 * @returns {Promise<void>}
 */
async function flushDwellTime(switchTimestamp) {
  if (!state.lastActiveTab) return;

  const dwell = elapsedSeconds(state.lastActiveTab.timestamp, switchTimestamp);

  if (dwell > 0 && isDistracting(state.lastActiveTab.domain)) {
    await storageIncrement(STORAGE_KEYS.OFF_TASK_TIME, dwell);
  }
}

/**
 * Handles a tab switch event. Flushes dwell time for the previous tab,
 * increments the tab switch counter, logs the event, and updates state.
 * Notifies content.js if the new tab is on a distracting domain.
 *
 * @param {number} tabId    - ID of the newly active tab
 * @param {string} url      - URL of the newly active tab
 * @returns {Promise<void>}
 */
async function handleTabSwitch(tabId, url) {
  if (!state.sessionActive) return;

  const domain = extractDomain(url);
  const timestamp = now();

  // Ignore internal browser pages (chrome://, about:, etc.)
  if (!domain) return;

  // Same domain — user navigated within the same site (e.g. clicking a
  // YouTube video while already on YouTube, or following a link on a study
  // site). Treat as continuous dwell, not a new visit.
  //
  // This also deduplicates the onCommitted + onUpdated double-fire that
  // occurs when both listeners are registered for the same navigation:
  // the second call arrives with the same domain so it exits here cleanly.
  if (state.lastActiveTab?.domain === domain) return;

  // Flush dwell time for previous tab
  await flushDwellTime(timestamp);

  // Only count a "tab switch" when the user navigates TO a distracting domain.
  // Counting every tab activation is noisy and not meaningful — switching between
  // two study tabs shouldn't penalize the user. The metric we care about is:
  // "how many times did you pull up a distracting site this session?"
  if (state.lastActiveTab !== null && isDistracting(domain)) {
    await storageIncrement(STORAGE_KEYS.TAB_SWITCHES);
  }

  // Log the tab switch event
  await appendEvent({
    type:      "tab_switch",
    timestamp,
    tabId,
    domain,
    distracting: isDistracting(domain),
  });

  // Update last active tab in memory
  state.lastActiveTab = { tabId, domain, timestamp };

  // Notify content.js to show distraction overlay if needed.
  //
  // Zen mode tracks silently — no overlay, no interruption. The visit counter
  // and off-task time still accumulate so the dashboard shows real stats.
  // Focus and Strict both show the overlay (identical behaviour for now).
  //
  // Root cause of the "popup lost" bug:
  //   onCommitted fires at navigation COMMIT time — before the new page
  //   loads and content.js is injected. sendMessage therefore fails silently.
  //   onUpdated fires after the page is fully loaded (content.js ready), but
  //   the same-domain guard returns early before reaching this code.
  //
  // Fix: set pendingOverlay now, attempt sendMessage immediately (succeeds for
  // tab switches where content.js is already loaded), and clear it on success.
  // onUpdated watches for pendingOverlay and retries once the page finishes
  // loading — without going through handleTabSwitch (no double counting).
  if (isDistracting(domain) && state.sessionMode !== "zen") {
    state.pendingOverlay = { tabId, domain };
    try {
      await chrome.tabs.sendMessage(tabId, {
        type: "SHOW_DISTRACTION_PROMPT",
        domain,
      });
      // Success: content.js was already loaded (tab switch, not URL change)
      state.pendingOverlay = null;
    } catch {
      // sendMessage failed: content.js not injected yet (page still loading).
      // Leave pendingOverlay set — onUpdated will retry after page load.
    }
  }
}

// ─────────────────────────────────────────────────────────────
// CHROME EVENT LISTENERS
// ─────────────────────────────────────────────────────────────

/**
 * Fires when the user switches to a different tab.
 * Retrieves the active tab's URL and delegates to handleTabSwitch.
 */
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab.url) {
      await handleTabSwitch(tabId, tab.url);
    }
  } catch (err) {
    console.warn("[TaskGuard] onActivated error:", err);
  }
});

/**
 * Fires when a tab's URL changes (navigation within the same tab).
 * Only handles committed navigations to avoid tracking redirects mid-flight.
 */
chrome.webNavigation
  ? chrome.webNavigation.onCommitted.addListener(async ({ tabId, url, frameId }) => {
      // Only track top-level frame navigations (frameId 0 = main frame)
      if (frameId !== 0) return;
      try {
        const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (activeTabs[0]?.id === tabId) {
          await handleTabSwitch(tabId, url);
        }
      } catch (err) {
        console.warn("[TaskGuard] onCommitted error:", err);
      }
    })
  : null;

/**
 * Fires when a tab finishes loading (status: "complete").
 *
 * We no longer call handleTabSwitch from here — that caused double-counting
 * alongside onCommitted. Instead this listener has one job: retry a pending
 * overlay for in-tab URL changes where sendMessage failed earlier because
 * content.js wasn't injected yet when onCommitted fired.
 *
 * Tab switches (onActivated) and URL changes (onCommitted) both call
 * handleTabSwitch for state/counting. This listener ONLY handles the case
 * where the overlay send needs to be deferred until the page is loaded.
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete" || !tab.url) return;
  if (!state.sessionActive) return;

  // Check if there's a pending overlay for this exact tab + domain.
  // If so, content.js is now loaded — retry the send.
  if (
    state.pendingOverlay?.tabId === tabId &&
    state.pendingOverlay?.domain === extractDomain(tab.url)
  ) {
    try {
      const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTabs[0]?.id === tabId) {
        await chrome.tabs.sendMessage(tabId, {
          type: "SHOW_DISTRACTION_PROMPT",
          domain: state.pendingOverlay.domain,
        });
        state.pendingOverlay = null;
      }
    } catch (err) {
      console.warn("[TaskGuard] onUpdated overlay retry failed:", err);
    }
  }
});

/**
 * Fires when a Chrome alarm triggers (used for auto-ending sessions).
 */
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "sessionEnd") {
    await endSession();
  }
});

// ─────────────────────────────────────────────────────────────
// MESSAGE HANDLER
// Receives messages from popup.js and content.js
// ─────────────────────────────────────────────────────────────

/**
 * Central message router for the extension.
 *
 * Supported message types (from popup.js):
 *   START_SESSION   { durationMinutes?: number }  → starts a session
 *   END_SESSION     {}                             → ends the session
 *   GET_STATUS      {}                             → returns current session state
 *
 * Supported message types (from content.js):
 *   PROMPT_RESPONSE { choice: "return" | "continue", domain: string }
 *
 * @param {Object}   message - Message object with a `type` field
 * @param {Object}   _sender - Sender info (unused)
 * @param {Function} sendResponse - Callback to send a response back
 * @returns {boolean} true to keep the channel open for async response
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    switch (message.type) {

      case "START_SESSION": {
        await loadUserDomains(); // Refresh domain list before starting
        await startSession(message.durationMinutes || 0, message.mode || "strict");
        sendResponse({ success: true });
        break;
      }

      case "END_SESSION": {
        const summary = await endSession();
        sendResponse({ success: true, summary });
        break;
      }

      case "GET_STATUS": {
        const result = await storageGet([
          STORAGE_KEYS.SESSION_ACTIVE,
          STORAGE_KEYS.SESSION_START,
          STORAGE_KEYS.TAB_SWITCHES,
          STORAGE_KEYS.OFF_TASK_TIME,
          STORAGE_KEYS.PROMPT_COUNT,
        ]);

        // BUG FIX: flushDwellTime() only runs on the NEXT tab switch, so
        // offTaskTime in storage is stale while the user is actively sitting
        // on a distracting site. Calculate the in-progress dwell right now
        // and add it to the stored value so the web app gets a live counter.
        //
        // The web app polls GET_STATUS every 2 seconds, so this gives a
        // continuously updating off-task time without needing a storage write
        // on every poll tick.
        let realtimeDwell = 0;
        if (
          state.sessionActive &&
          state.lastActiveTab &&
          isDistracting(state.lastActiveTab.domain)
        ) {
          realtimeDwell = elapsedSeconds(state.lastActiveTab.timestamp, now());
        }

        sendResponse({
          sessionActive: result[STORAGE_KEYS.SESSION_ACTIVE] || false,
          sessionStart:  result[STORAGE_KEYS.SESSION_START]  || null,
          tabSwitches:   result[STORAGE_KEYS.TAB_SWITCHES]   || 0,
          offTaskTime:   (result[STORAGE_KEYS.OFF_TASK_TIME] || 0) + realtimeDwell,
          promptCount:   result[STORAGE_KEYS.PROMPT_COUNT]   || 0,
        });
        break;
      }

      case "PROMPT_RESPONSE": {
        // Logs the user's choice when shown a distraction overlay
        await storageIncrement(STORAGE_KEYS.PROMPT_COUNT);
        if (message.choice === "return") {
          await storageIncrement(STORAGE_KEYS.PROMPT_RETURNS);
        }
        await appendEvent({
          type:      "prompt_response",
          timestamp: now(),
          domain:    message.domain,
          choice:    message.choice, // "return" | "continue"
        });
        sendResponse({ success: true });
        break;
      }

      default:
        console.warn("[TaskGuard] Unknown message type:", message.type);
        sendResponse({ success: false, error: "Unknown message type" });
    }
  })();

  return true; // Required: keeps sendResponse channel open for async handlers
});

// ─────────────────────────────────────────────────────────────
// INITIALIZATION
// ─────────────────────────────────────────────────────────────

/**
 * Loads the user's custom distracting domain list from storage.
 * Falls back to DEFAULT_DISTRACTING_DOMAINS if none saved.
 *
 * @returns {Promise<void>}
 */
async function loadUserDomains() {
  const result = await storageGet(STORAGE_KEYS.DISTRACTING_DOMAINS);
  const saved = result[STORAGE_KEYS.DISTRACTING_DOMAINS];
  state.distractingDomains = saved?.length
    ? saved
    : [...DEFAULT_DISTRACTING_DOMAINS];
}

/**
 * Restores session state on service worker startup.
 * Chrome can kill the service worker at any time; this ensures
 * an active session resumes correctly when the worker restarts.
 *
 * @returns {Promise<void>}
 */
async function restoreState() {
  await loadUserDomains();
  const result = await storageGet([
    STORAGE_KEYS.SESSION_ACTIVE,
    STORAGE_KEYS.SESSION_START,
  ]);
  state.sessionActive = result[STORAGE_KEYS.SESSION_ACTIVE] || false;
  state.sessionStart  = result[STORAGE_KEYS.SESSION_START]  || null;

  if (state.sessionActive) {
    console.log("[TaskGuard] Restored active session from storage.");
  }
}

// Run on service worker startup
restoreState();

// ─────────────────────────────────────────────────────────────
// STORAGE CHANGE LISTENER
// Allows the web app to start/stop sessions by writing to
// chrome.storage.local directly. The popup reflects this change
// automatically since it polls storage every second.
// ─────────────────────────────────────────────────────────────

/**
 * Watches for sessionActive changes written by the web app.
 * When the web app sets sessionActive = true, the extension starts
 * tracking. When it sets sessionActive = false, the session ends.
 *
 * This is the bridge between the web app and the extension —
 * no extension ID or message passing required from the web app side.
 */
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;

  if (changes.sessionActive) {
    const { newValue } = changes.sessionActive;
    if (newValue === true && !state.sessionActive) {
      console.log("[TaskGuard] Session started by web app.");
      state.sessionActive = true;
      state.sessionStart  = changes.sessionStart?.newValue || new Date().toISOString();
      state.lastActiveTab = null;
    } else if (newValue === false && state.sessionActive) {
      console.log("[TaskGuard] Session ended by web app.");
      endSession();
    }
  }
});