// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

/** ID applied to overlay elements so we can find and remove them safely */
const OVERLAY_ID  = "taskguard-overlay";
const BACKDROP_ID = "taskguard-backdrop";

// ─────────────────────────────────────────────────────────────
// UTILITY
// ─────────────────────────────────────────────────────────────

/**
 * Converts a number of seconds into a human-readable string.
 *
 * @param {number} seconds - Total seconds to format
 * @returns {string} e.g. "4 mins", "1 hr 2 mins", "30 secs"
 *
 * @example
 * formatTime(90)   // → "1 min 30 secs"
 * formatTime(3600) // → "1 hr 0 mins"
 * formatTime(45)   // → "45 secs"
 */
function formatTime(seconds) {
  if (seconds < 60) return `${seconds} secs`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return secs > 0 ? `${mins} min ${secs} secs` : `${mins} mins`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hrs} hr ${remainMins} mins`;
}

// ─────────────────────────────────────────────────────────────
// OVERLAY MANAGEMENT
// ─────────────────────────────────────────────────────────────

/**
 * Removes the overlay and backdrop from the DOM if they exist.
 * Safe to call even if the overlay was never injected.
 *
 * @returns {void}
 */
function removeOverlay() {
  document.getElementById(OVERLAY_ID)?.remove();
  document.getElementById(BACKDROP_ID)?.remove();
}

/**
 * Builds and injects the distraction prompt overlay into the current page.
 * Styles are all inline to avoid conflicts with the host page's CSS.
 * Matches the TaskGuard web app's black/white minimal design system.
 *
 * @param {string} domain      - The distracting domain (e.g. "youtube.com")
 * @param {number} offTaskTime - Cumulative off-task seconds this session
 * @returns {void}
 */
function createOverlay(domain, offTaskTime) {
  // Don't stack multiple overlays
  if (document.getElementById(OVERLAY_ID)) return;

  // ── Backdrop (dimmed background) ──────────────────────────
  const backdrop = document.createElement("div");
  backdrop.id = BACKDROP_ID;
  Object.assign(backdrop.style, {
    position:        "fixed",
    inset:           "0",
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    backdropFilter:  "blur(4px)",
    zIndex:          "2147483646", // just below the modal
    animation:       "tg-fade-in 0.2s ease",
  });

  // ── Modal card ────────────────────────────────────────────
  const modal = document.createElement("div");
  modal.id = OVERLAY_ID;
  Object.assign(modal.style, {
    position:        "fixed",
    top:             "50%",
    left:            "50%",
    transform:       "translate(-50%, -50%) scale(0.96)",
    zIndex:          "2147483647",
    backgroundColor: "#ffffff",
    color:           "#0a0a0a",
    borderRadius:    "12px",
    boxShadow:       "0 24px 60px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.12)",
    padding:         "32px 28px 24px",
    width:           "340px",
    fontFamily:      "'Geist', 'Inter', system-ui, sans-serif",
    boxSizing:       "border-box",
    animation:       "tg-slide-in 0.22s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
  });

  // ── Header row (icon + title) ─────────────────────────────
  const header = document.createElement("div");
  Object.assign(header.style, {
    display:        "flex",
    alignItems:     "center",
    gap:            "10px",
    marginBottom:   "6px",
  });

  // Warning icon
  const icon = document.createElement("div");
  icon.textContent = "⚠️";
  icon.style.fontSize = "20px";

  // Title
  const title = document.createElement("p");
  title.textContent = "Taking a Break?";
  Object.assign(title.style, {
    margin:     "0",
    fontSize:   "17px",
    fontWeight: "700",
    color:      "#0a0a0a",
    lineHeight: "1.2",
  });

  header.appendChild(icon);
  header.appendChild(title);

  // ── Domain pill ───────────────────────────────────────────
  const domainPill = document.createElement("div");
  domainPill.textContent = domain;
  Object.assign(domainPill.style, {
    display:         "inline-block",
    backgroundColor: "#f4f4f5",
    color:           "#52525b",
    fontSize:        "12px",
    fontWeight:      "500",
    padding:         "3px 10px",
    borderRadius:    "999px",
    marginBottom:    "16px",
    fontFamily:      "monospace",
  });

  // ── Off-task time stat ────────────────────────────────────
  const statBox = document.createElement("div");
  Object.assign(statBox.style, {
    backgroundColor: "#fafafa",
    border:          "1px solid #e4e4e7",
    borderRadius:    "8px",
    padding:         "12px 16px",
    marginBottom:    "20px",
    display:         "flex",
    justifyContent:  "space-between",
    alignItems:      "center",
  });

  const statLabel = document.createElement("span");
  statLabel.textContent = "Off-task time this session";
  Object.assign(statLabel.style, {
    fontSize: "13px",
    color:    "#71717a",
  });

  const statValue = document.createElement("span");
  statValue.textContent = formatTime(offTaskTime);
  Object.assign(statValue.style, {
    fontSize:   "14px",
    fontWeight: "700",
    color:      "#0a0a0a",
  });

  statBox.appendChild(statLabel);
  statBox.appendChild(statValue);

  // ── Body text ─────────────────────────────────────────────
  const body = document.createElement("p");
  body.textContent = "You're in an active study session. Do you want to stay on track?";
  Object.assign(body.style, {
    margin:       "0 0 20px 0",
    fontSize:     "13.5px",
    color:        "#52525b",
    lineHeight:   "1.55",
  });

  // ── Buttons ───────────────────────────────────────────────
  const buttonRow = document.createElement("div");
  Object.assign(buttonRow.style, {
    display: "flex",
    gap:     "10px",
  });

  // "Return to Study" — primary (black)
  const returnBtn = document.createElement("button");
  returnBtn.textContent = "Return to Study";
  Object.assign(returnBtn.style, {
    flex:            "1",
    padding:         "10px 0",
    backgroundColor: "#0a0a0a",
    color:           "#ffffff",
    border:          "none",
    borderRadius:    "8px",
    fontSize:        "13.5px",
    fontWeight:      "600",
    cursor:          "pointer",
    fontFamily:      "inherit",
    transition:      "opacity 0.15s ease",
  });
  returnBtn.onmouseenter = () => (returnBtn.style.opacity = "0.85");
  returnBtn.onmouseleave = () => (returnBtn.style.opacity = "1");

  // "Continue Anyway" — secondary (ghost)
  const continueBtn = document.createElement("button");
  continueBtn.textContent = "Continue Anyway";
  Object.assign(continueBtn.style, {
    flex:            "1",
    padding:         "10px 0",
    backgroundColor: "transparent",
    color:           "#52525b",
    border:          "1px solid #e4e4e7",
    borderRadius:    "8px",
    fontSize:        "13.5px",
    fontWeight:      "500",
    cursor:          "pointer",
    fontFamily:      "inherit",
    transition:      "background-color 0.15s ease",
  });
  continueBtn.onmouseenter = () => (continueBtn.style.backgroundColor = "#f4f4f5");
  continueBtn.onmouseleave = () => (continueBtn.style.backgroundColor = "transparent");

  buttonRow.appendChild(returnBtn);
  buttonRow.appendChild(continueBtn);

  // ── Assemble modal ────────────────────────────────────────
  modal.appendChild(header);
  modal.appendChild(domainPill);
  modal.appendChild(statBox);
  modal.appendChild(body);
  modal.appendChild(buttonRow);

  // ── Inject keyframe animations ────────────────────────────
  if (!document.getElementById("taskguard-styles")) {
    const style = document.createElement("style");
    style.id = "taskguard-styles";
    style.textContent = `
      @keyframes tg-fade-in {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      @keyframes tg-slide-in {
        from { opacity: 0; transform: translate(-50%, -50%) scale(0.92); }
        to   { opacity: 1; transform: translate(-50%, -50%) scale(1);    }
      }
      @keyframes tg-slide-out {
        from { opacity: 1; transform: translate(-50%, -50%) scale(1);    }
        to   { opacity: 0; transform: translate(-50%, -50%) scale(0.94); }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(backdrop);
  document.body.appendChild(modal);

  // ── Button handlers ───────────────────────────────────────
  returnBtn.addEventListener("click",   () => handleReturnToStudy(domain));
  continueBtn.addEventListener("click", () => handleContinue(domain));
}

// ─────────────────────────────────────────────────────────────
// BUTTON HANDLERS
// ─────────────────────────────────────────────────────────────

/**
 * Handles the "Return to Study" button click.
 * Notifies background.js to log the choice, then navigates back
 * to the previous page (or closes the tab if no history).
 *
 * @param {string} domain - The distracting domain the user was on
 * @returns {void}
 */
function handleReturnToStudy(domain) {
  chrome.runtime.sendMessage(
    { type: "PROMPT_RESPONSE", choice: "return", domain },
    () => {
      removeOverlay();
      // Go back to previous page; if no history, do nothing
      if (window.history.length > 1) {
        window.history.back();
      }
    }
  );
}

/**
 * Handles the "Continue Anyway" button click.
 * Notifies background.js to log the choice, then dismisses the overlay.
 * The user remains on the distracting page — autonomy is preserved.
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
// MESSAGE LISTENER
// ─────────────────────────────────────────────────────────────

/**
 * Listens for messages from background.js.
 *
 * Handled message types:
 *   SHOW_DISTRACTION_PROMPT
 *     Payload: { domain: string }
 *     Action:  Fetches current off-task time from storage, then renders overlay
 *
 *   REMOVE_OVERLAY
 *     Payload: (none)
 *     Action:  Removes overlay if present (e.g. session ended externally)
 *
 * @param {Object}   message    - Incoming message from background.js
 * @param {Object}   _sender    - Sender info (unused)
 * @param {Function} sendResponse - Callback (unused here)
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "SHOW_DISTRACTION_PROMPT") {
    // Fetch current off-task time to display in the overlay
    chrome.storage.local.get("offTaskTime", (result) => {
      const offTaskTime = result.offTaskTime || 0;
      createOverlay(message.domain, offTaskTime);
    });
    sendResponse({ received: true });
  }

  if (message.type === "REMOVE_OVERLAY") {
    removeOverlay();
    sendResponse({ received: true });
  }
});