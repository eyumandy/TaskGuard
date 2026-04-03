// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

const OVERLAY_ID  = "taskguard-overlay";
const BACKDROP_ID = "taskguard-backdrop";

// ─────────────────────────────────────────────────────────────
// UTILITY
// ─────────────────────────────────────────────────────────────

/**
 * Formats seconds into a concise human-readable string.
 *
 * @param {number} seconds - Total seconds
 * @returns {string} e.g. "45s", "4m 30s", "1h 2m"
 *
 * @example
 * formatTime(45)   // → "45s"
 * formatTime(270)  // → "4m 30s"
 * formatTime(3720) // → "1h 2m"
 */
function formatTime(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

// ─────────────────────────────────────────────────────────────
// OVERLAY MANAGEMENT
// ─────────────────────────────────────────────────────────────

/**
 * Removes the overlay and backdrop from the DOM.
 * Safe to call even if the overlay was never injected.
 *
 * @returns {void}
 */
function removeOverlay() {
  document.getElementById(OVERLAY_ID)?.remove();
  document.getElementById(BACKDROP_ID)?.remove();
}

/**
 * Builds and injects the dark-themed distraction prompt overlay.
 * All styles are inline to avoid conflicts with the host page's CSS.
 * Design matches the TaskGuard web app: #0f0f0f bg, cream text.
 *
 * Overlay contents per proposal spec §4.4:
 *   - "TASKGUARD · ACTIVE SESSION" overline
 *   - "Taking a Break?" heading
 *   - Cumulative off-task time stat row
 *   - Distracting domain pill
 *   - Body copy
 *   - "Return to Study" (primary) and "Continue Anyway" (ghost) buttons
 *
 * @param {string} domain      - Distracting domain e.g. "youtube.com"
 * @param {number} offTaskTime - Cumulative off-task seconds this session
 * @returns {void}
 */
function createOverlay(domain, offTaskTime) {
  // Guard: don't stack multiple overlays
  if (document.getElementById(OVERLAY_ID)) return;

  // ── Inject keyframe animations once per page ──────────────
  if (!document.getElementById("taskguard-styles")) {
    const style = document.createElement("style");
    style.id = "taskguard-styles";
    style.textContent = `
      @keyframes tg-backdrop-in {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      @keyframes tg-modal-in {
        from { opacity: 0; transform: translate(-50%, -48%) scale(0.95); }
        to   { opacity: 1; transform: translate(-50%, -50%) scale(1);    }
      }
    `;
    document.head.appendChild(style);
  }

  // ── Backdrop ──────────────────────────────────────────────
  const backdrop = document.createElement("div");
  backdrop.id = BACKDROP_ID;
  Object.assign(backdrop.style, {
    position:        "fixed",
    inset:           "0",
    backgroundColor: "rgba(0,0,0,0.72)",
    backdropFilter:  "blur(6px)",
    zIndex:          "2147483646",
    animation:       "tg-backdrop-in 0.2s ease forwards",
  });

  // ── Modal card ────────────────────────────────────────────
  const modal = document.createElement("div");
  modal.id = OVERLAY_ID;
  Object.assign(modal.style, {
    position:        "fixed",
    top:             "50%",
    left:            "50%",
    transform:       "translate(-50%, -50%)",
    zIndex:          "2147483647",
    backgroundColor: "#0f0f0f",
    border:          "1px solid rgba(245,240,232,0.1)",
    borderRadius:    "14px",
    boxShadow:       "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(245,240,232,0.04)",
    padding:         "24px",
    width:           "360px",
    fontFamily:      "'Geist','Inter',system-ui,sans-serif",
    boxSizing:       "border-box",
    color:           "rgba(245,240,232,0.9)",
    animation:       "tg-modal-in 0.22s cubic-bezier(0.34,1.56,0.64,1) forwards",
  });

  // ── Overline ──────────────────────────────────────────────
  const overline = document.createElement("p");
  overline.textContent = "TASKGUARD · ACTIVE SESSION";
  Object.assign(overline.style, {
    fontSize:      "9px",
    fontWeight:    "600",
    letterSpacing: "0.18em",
    color:         "rgba(245,240,232,0.25)",
    marginBottom:  "14px",
    fontFamily:    "monospace",
  });

  // ── Title ─────────────────────────────────────────────────
  const title = document.createElement("p");
  title.textContent = "Taking a Break?";
  Object.assign(title.style, {
    fontSize:      "22px",
    fontWeight:    "700",
    letterSpacing: "-0.03em",
    color:         "rgba(245,240,232,0.95)",
    marginBottom:  "16px",
    lineHeight:    "1.1",
  });

  // ── Off-task stat row ─────────────────────────────────────
  const statRow = document.createElement("div");
  Object.assign(statRow.style, {
    display:         "flex",
    justifyContent:  "space-between",
    alignItems:      "center",
    backgroundColor: "rgba(245,240,232,0.04)",
    border:          "1px solid rgba(245,240,232,0.08)",
    borderRadius:    "8px",
    padding:         "11px 14px",
    marginBottom:    "14px",
  });

  const statLabel = document.createElement("span");
  statLabel.textContent = "Off-task time this session";
  Object.assign(statLabel.style, {
    fontSize: "12.5px",
    color:    "rgba(245,240,232,0.4)",
  });

  const statValue = document.createElement("span");
  statValue.textContent = formatTime(offTaskTime);
  Object.assign(statValue.style, {
    fontSize:   "13px",
    fontWeight: "700",
    color:      "rgba(245,240,232,0.9)",
  });

  statRow.appendChild(statLabel);
  statRow.appendChild(statValue);

  // ── Domain pill ───────────────────────────────────────────
  const domainPill = document.createElement("div");
  domainPill.textContent = domain;
  Object.assign(domainPill.style, {
    display:         "inline-block",
    backgroundColor: "rgba(245,240,232,0.06)",
    border:          "1px solid rgba(245,240,232,0.1)",
    color:           "rgba(245,240,232,0.4)",
    fontSize:        "11px",
    padding:         "3px 10px",
    borderRadius:    "999px",
    fontFamily:      "monospace",
    marginBottom:    "18px",
  });

  // ── Body copy ─────────────────────────────────────────────
  const body = document.createElement("p");
  body.textContent = "You navigated to a distracting site. Do you want to return to your study session?";
  Object.assign(body.style, {
    fontSize:     "13px",
    color:        "rgba(245,240,232,0.45)",
    lineHeight:   "1.6",
    marginBottom: "20px",
  });

  // ── Button row ────────────────────────────────────────────
  const btnRow = document.createElement("div");
  Object.assign(btnRow.style, { display: "flex", gap: "8px" });

  // Primary: "Return to Study" — filled cream
  const returnBtn = document.createElement("button");
  returnBtn.textContent = "Return to Study";
  Object.assign(returnBtn.style, {
    flex:            "1",
    padding:         "11px 0",
    backgroundColor: "rgba(245,240,232,0.92)",
    color:           "#0a0a0a",
    border:          "none",
    borderRadius:    "8px",
    fontSize:        "13px",
    fontWeight:      "600",
    cursor:          "pointer",
    fontFamily:      "inherit",
    letterSpacing:   "-0.01em",
    transition:      "opacity 0.15s ease",
  });
  returnBtn.onmouseenter = () => (returnBtn.style.opacity = "0.82");
  returnBtn.onmouseleave = () => (returnBtn.style.opacity = "1");

  // Ghost: "Continue Anyway" — preserves user autonomy per proposal §4.4
  const continueBtn = document.createElement("button");
  continueBtn.textContent = "Continue Anyway";
  Object.assign(continueBtn.style, {
    flex:            "1",
    padding:         "11px 0",
    backgroundColor: "transparent",
    color:           "rgba(245,240,232,0.35)",
    border:          "1px solid rgba(245,240,232,0.1)",
    borderRadius:    "8px",
    fontSize:        "13px",
    fontWeight:      "500",
    cursor:          "pointer",
    fontFamily:      "inherit",
    transition:      "all 0.15s ease",
  });
  continueBtn.onmouseenter = () => {
    continueBtn.style.backgroundColor = "rgba(245,240,232,0.05)";
    continueBtn.style.color           = "rgba(245,240,232,0.6)";
  };
  continueBtn.onmouseleave = () => {
    continueBtn.style.backgroundColor = "transparent";
    continueBtn.style.color           = "rgba(245,240,232,0.35)";
  };

  btnRow.appendChild(returnBtn);
  btnRow.appendChild(continueBtn);

  // ── Assemble and inject ───────────────────────────────────
  modal.appendChild(overline);
  modal.appendChild(title);
  modal.appendChild(statRow);
  modal.appendChild(domainPill);
  modal.appendChild(body);
  modal.appendChild(btnRow);

  document.body.appendChild(backdrop);
  document.body.appendChild(modal);

  returnBtn.addEventListener("click",   () => handleReturnToStudy(domain));
  continueBtn.addEventListener("click", () => handleContinue(domain));
}

// ─────────────────────────────────────────────────────────────
// BUTTON HANDLERS
// ─────────────────────────────────────────────────────────────

/**
 * Handles the "Return to Study" button click.
 * Sends PROMPT_RESPONSE with choice "return" to background.js,
 * removes the overlay, then navigates back to the previous page.
 *
 * @param {string} domain - The distracting domain the user was on
 * @returns {void}
 */
function handleReturnToStudy(domain) {
  chrome.runtime.sendMessage(
    { type: "PROMPT_RESPONSE", choice: "return", domain },
    () => {
      removeOverlay();
      if (window.history.length > 1) window.history.back();
    }
  );
}

/**
 * Handles the "Continue Anyway" button click.
 * Sends PROMPT_RESPONSE with choice "continue" to background.js,
 * then dismisses the overlay. User stays on the distracting page.
 *
 * @param {string} domain - The distracting domain the user chose to stay on
 * @returns {void}
 */
function handleContinue(domain) {
  chrome.runtime.sendMessage(
    { type: "PROMPT_RESPONSE", choice: "continue", domain },
    () => removeOverlay()
  );
}

// ─────────────────────────────────────────────────────────────
// CHROME MESSAGE LISTENER
// Receives messages from background.js
// ─────────────────────────────────────────────────────────────

/**
 * Listens for messages from background.js.
 *
 * SHOW_DISTRACTION_PROMPT: reads live offTaskTime then renders overlay
 * REMOVE_OVERLAY: removes overlay if present (e.g. session ended externally)
 *
 * @param {Object}   message     - Message from background.js
 * @param {Object}   _sender     - Sender info (unused)
 * @param {Function} sendResponse - Callback to acknowledge receipt
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "SHOW_DISTRACTION_PROMPT") {
    chrome.storage.local.get("offTaskTime", (result) => {
      createOverlay(message.domain, result.offTaskTime || 0);
    });
    sendResponse({ received: true });
  }

  if (message.type === "REMOVE_OVERLAY") {
    removeOverlay();
    sendResponse({ received: true });
  }
});

// ─────────────────────────────────────────────────────────────
// WEB APP BRIDGE
// The Next.js web app cannot access chrome APIs directly.
// It fires custom DOM events; this script catches and forwards them
// to background.js via chrome.runtime.sendMessage.
// ─────────────────────────────────────────────────────────────

/**
 * Tells the web app the extension is installed and ready.
 * Fired immediately when this content script loads on the page.
 * The web app listens for this to show "Extension connected" status.
 */
window.dispatchEvent(new CustomEvent("taskguard:ready"));

/**
 * Listens for the web app's Start Session button.
 * Forwards START_SESSION to background.js including the session mode, then
 * fires taskguard:started back to the web app so it can update its UI.
 *
 * @param {CustomEvent} e - detail: { mode: "focus" | "strict" | "zen" }
 *   mode  Controls overlay behaviour in background.js:
 *         "focus" / "strict" → show distraction overlay
 *         "zen"              → silent tracking only, no overlay
 */
window.addEventListener("taskguard:start", (e) => {
  const mode = e.detail?.mode || "strict";
  chrome.runtime.sendMessage({ type: "START_SESSION", mode }, (response) => {
    if (response?.success) {
      window.dispatchEvent(new CustomEvent("taskguard:started"));
    }
  });
});

/**
 * Listens for the web app's Stop Session button.
 * Forwards END_SESSION to background.js, then fires taskguard:stopped
 * back to the web app so it can update its own UI state.
 *
 * The final session summary from background.js (containing accurate
 * tabSwitches, offTaskTime, and promptCount after the last dwell flush)
 * is passed as event detail so SessionPage can patch its localStorage
 * entry with precise final values rather than the last-polled snapshot.
 */
window.addEventListener("taskguard:stop", () => {
  chrome.runtime.sendMessage({ type: "END_SESSION" }, (response) => {
    if (response?.success) {
      window.dispatchEvent(new CustomEvent("taskguard:stopped", {
        detail: response.summary ?? null,
      }));
    }
  });
});

/**
 * Listens for status poll requests from the web app.
 * Fetches current session state from background.js and fires
 * taskguard:status with the full status object as event detail.
 * The web app polls this every 2 seconds to keep its UI in sync.
 */
window.addEventListener("taskguard:requestStatus", () => {
  chrome.runtime.sendMessage({ type: "GET_STATUS" }, (status) => {
    window.dispatchEvent(
      new CustomEvent("taskguard:status", { detail: status })
    );
  });
});

// ─────────────────────────────────────────────────────────────
// DOMAIN SYNC BRIDGE
// The Settings page cannot write to chrome.storage.local directly.
// It dispatches taskguard:updateDomains; this script catches it and
// writes the new list to chrome.storage.local so background.js picks
// it up via loadUserDomains() at the next session start.
// ─────────────────────────────────────────────────────────────

/**
 * Listens for domain list updates from the web app's Settings page.
 * Writes the new distracting-domain list to chrome.storage.local so
 * background.js loadUserDomains() will use them on the next session.
 *
 * @listens taskguard:updateDomains
 * @param {CustomEvent} e - detail: { domains: string[] }
 *   domains  Array of root domain strings, e.g. ["youtube.com", "reddit.com"]
 *            Contains ONLY sites the user classified as distracting (not productive).
 *
 * @fires taskguard:domainsUpdated  Fired after the write completes so the
 *   Settings page can show a confirmation if needed.
 *
 * @example
 * // Dispatched by SettingsPage saveSettings():
 * window.dispatchEvent(new CustomEvent("taskguard:updateDomains", {
 *   detail: { domains: ["youtube.com", "reddit.com"] }
 * }));
 */
window.addEventListener("taskguard:updateDomains", (e) => {
  const domains = e.detail?.domains;
  if (!Array.isArray(domains)) return;

  chrome.storage.local.set({ distractingDomains: domains }, () => {
    console.log("[TaskGuard] distractingDomains synced:", domains);
    window.dispatchEvent(new CustomEvent("taskguard:domainsUpdated"));
  });
});