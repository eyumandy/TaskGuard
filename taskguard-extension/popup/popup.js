// ─────────────────────────────────────────────────────────────
// DOM REFERENCES
// ─────────────────────────────────────────────────────────────

const btnMain       = document.getElementById("btnMain");
const btnLabel      = document.getElementById("btnLabel");
const sessionBadge  = document.getElementById("sessionBadge");
const stateIdle     = document.getElementById("stateIdle");
const statsGrid     = document.getElementById("statsGrid");
const statTimer     = document.getElementById("statTimer");
const statSwitches  = document.getElementById("statSwitches");
const statOffTask   = document.getElementById("statOffTask");
const statPrompts   = document.getElementById("statPrompts");

// ─────────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────────

/** Holds the setInterval ID for stat polling — null when not polling */
let pollInterval = null;

/** Tracks session start time locally for the live timer display */
let sessionStartTime = null;

// ─────────────────────────────────────────────────────────────
// FORMAT HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * Converts total elapsed seconds into a HH:MM:SS or MM:SS string.
 * Used for the live session timer display.
 *
 * @param {number} totalSeconds - Elapsed seconds since session start
 * @returns {string} Formatted time string e.g. "01:23" or "1:02:45"
 *
 * @example
 * formatTimer(75)   // → "01:15"
 * formatTimer(3725) // → "1:02:05"
 */
function formatTimer(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/**
 * Converts off-task seconds into a compact display string.
 *
 * @param {number} seconds - Off-task seconds
 * @returns {string} e.g. "0m", "4m 30s", "1h 2m"
 *
 * @example
 * formatOffTask(0)    // → "0m"
 * formatOffTask(270)  // → "4m 30s"
 * formatOffTask(3720) // → "1h 2m"
 */
function formatOffTask(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

// ─────────────────────────────────────────────────────────────
// UI RENDERERS
// ─────────────────────────────────────────────────────────────

/**
 * Renders the idle (no session) state.
 * Shows the prompt copy, hides the stats grid, resets the button.
 *
 * @returns {void}
 */
function renderIdle() {
  stateIdle.hidden    = false;
  statsGrid.hidden    = true;
  sessionBadge.hidden = true;

  btnLabel.textContent = "Start Session";
  btnMain.className    = "btn-primary";
  btnMain.disabled     = false;
  btnMain.onclick      = handleStart;
}

/**
 * Renders the active session state.
 * Hides the idle copy, shows the stats grid and live badge,
 * changes the button to "End Session", and kicks off stat polling.
 *
 * @param {Object} status           - Status object from GET_STATUS response
 * @param {string} status.sessionStart - ISO timestamp of session start
 * @param {number} status.tabSwitches  - Current tab switch count
 * @param {number} status.offTaskTime  - Current off-task seconds
 * @param {number} status.promptCount  - Current prompt count
 * @returns {void}
 */
function renderActive(status) {
  stateIdle.hidden    = true;
  statsGrid.hidden    = false;
  sessionBadge.hidden = false;

  sessionStartTime = new Date(status.sessionStart);

  btnLabel.textContent = "End Session";
  btnMain.className    = "btn-primary active";
  btnMain.disabled     = false;
  btnMain.onclick      = handleStop;

  // Immediately update stats before first poll tick
  updateStats({
    tabSwitches: status.tabSwitches,
    offTaskTime: status.offTaskTime,
    promptCount: status.promptCount,
  });

  startPolling();
}

/**
 * Updates the four stat cards with the latest values from storage.
 * Also recalculates and updates the live session timer.
 *
 * @param {Object} data             - Storage data snapshot
 * @param {number} data.tabSwitches - Current tab switch count
 * @param {number} data.offTaskTime - Current off-task seconds
 * @param {number} data.promptCount - Current prompt count
 * @returns {void}
 */
function updateStats(data) {
  const elapsed = sessionStartTime
    ? Math.floor((Date.now() - sessionStartTime.getTime()) / 1000)
    : 0;

  statTimer.textContent    = formatTimer(elapsed);
  statSwitches.textContent = data.tabSwitches  ?? 0;
  statOffTask.textContent  = formatOffTask(data.offTaskTime ?? 0);
  statPrompts.textContent  = data.promptCount  ?? 0;
}

// ─────────────────────────────────────────────────────────────
// POLLING
// ─────────────────────────────────────────────────────────────

/**
 * Starts a 1-second polling interval that reads live stats from
 * chrome.storage.local and updates the stat cards.
 * Clears any existing interval before starting a new one.
 *
 * @returns {void}
 */
function startPolling() {
  stopPolling();
  pollInterval = setInterval(() => {
    chrome.storage.local.get(
      ["tabSwitches", "offTaskTime", "promptCount"],
      (data) => updateStats(data)
    );
  }, 1000);
}

/**
 * Stops the stat polling interval.
 * Safe to call even if polling wasn't active.
 *
 * @returns {void}
 */
function stopPolling() {
  if (pollInterval !== null) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

// ─────────────────────────────────────────────────────────────
// BUTTON HANDLERS
// ─────────────────────────────────────────────────────────────

/**
 * Handles the "Start Session" button click.
 * Sends START_SESSION to background.js then switches UI to active state.
 *
 * @returns {void}
 */
function handleStart() {
  btnMain.disabled     = true;
  btnLabel.textContent = "Starting…";

  chrome.runtime.sendMessage({ type: "START_SESSION" }, (response) => {
    if (response?.success) {
      // Fetch fresh status to populate stats correctly
      chrome.runtime.sendMessage({ type: "GET_STATUS" }, (status) => {
        renderActive(status);
      });
    } else {
      // Re-enable button if something went wrong
      renderIdle();
    }
  });
}

/**
 * Handles the "End Session" button click.
 * Stops polling, sends END_SESSION to background.js, then switches to idle.
 *
 * @returns {void}
 */
function handleStop() {
  btnMain.disabled     = true;
  btnLabel.textContent = "Ending…";
  stopPolling();

  chrome.runtime.sendMessage({ type: "END_SESSION" }, (response) => {
    if (response?.success) {
      renderIdle();
    } else {
      // Re-enable if something went wrong
      renderActive({ sessionStart: sessionStartTime?.toISOString() });
    }
  });
}

// ─────────────────────────────────────────────────────────────
// INITIALIZATION
// ─────────────────────────────────────────────────────────────

/**
 * Entry point — runs when popup is opened.
 * Asks background.js for the current session status and renders
 * the appropriate UI state (idle or active).
 *
 * @returns {void}
 */
function initPopup() {
  // Disable button while loading status
  btnMain.disabled = true;

  chrome.runtime.sendMessage({ type: "GET_STATUS" }, (status) => {
    if (status?.sessionActive) {
      renderActive(status);
    } else {
      renderIdle();
    }
  });
}

// Run on popup open
initPopup();