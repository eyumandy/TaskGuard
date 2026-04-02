
const statusDot  = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const statusSub  = document.getElementById("statusSub");

/**
 * Updates the popup UI based on whether a session is currently active.
 *
 * @param {boolean} isActive - Whether a session is running
 * @returns {void}
 */
function render(isActive) {
  if (isActive) {
    statusDot.classList.add("live");
    statusText.classList.add("live");
    statusText.textContent = "Live";
    statusSub.textContent  = "Tracking is active. Tab visits are being logged.";
  } else {
    statusDot.classList.remove("live");
    statusText.classList.remove("live");
    statusText.textContent = "Ready";
    statusSub.textContent  = "Go to the dashboard to start a session.";
  }
}

/**
 * Reads sessionActive from chrome.storage.local and re-renders.
 * Called once on load and then every second via setInterval.
 *
 * @returns {void}
 */
function refresh() {
  chrome.storage.local.get("sessionActive", (result) => {
    render(!!result.sessionActive);
  });
}

// Poll every second so status stays in sync with the web app
refresh();
setInterval(refresh, 1000);