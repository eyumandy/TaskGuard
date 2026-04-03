# TaskGuard

> A behavior-aware browser extension and companion web app for reducing task-switching during academic study sessions.

**University of Florida — HCI Course Project, Spring 2026**  
Whitnie Ojie-Ahamiojie · Rocco Tammone · Anthony Cao · Yumandy Espinosa

---

## Table of Contents

- [Project Overview](#project-overview)
- [System Architecture](#system-architecture)
- [Prerequisites](#prerequisites)
- [Part 1 — Web App Setup](#part-1--web-app-setup)
- [Part 2 — Chrome Extension Setup](#part-2--chrome-extension-setup)
- [Using TaskGuard](#using-taskguard)
- [Key Metric: On-Task Rate](#key-metric-on-task-rate)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)

---

## Project Overview

TaskGuard is a two-component system designed to help students stay focused during study sessions:

1. **Chrome Extension** — runs silently in the browser, tracks tab switches, classifies domains as on-task or off-task, and surfaces a reflective distraction prompt when a user visits a distracting site mid-session.
2. **Next.js Web App** — provides the landing page, session dashboard (start/stop sessions, live timer, real-time stats), and session history. The webapp communicates with the extension via `chrome.storage.local`.

The system does **not** block distracting sites — it instead shows a prompt asking the user to reflect before continuing, preserving user autonomy while encouraging mindful behavior.

---

## System Architecture

```
┌─────────────────────────────────┐       ┌──────────────────────────────────┐
│        Chrome Extension         │       │         Next.js Web App           │
│  taskguard-extension/           │       │  http://localhost:3000            │
│                                 │◄─────►│                                  │
│  background.js  (service worker)│       │  /            Landing page        │
│  content.js     (overlay inject)│       │  /session     Session dashboard   │
│  popup/         (toolbar popup) │       │  /history     Past sessions       │
│  manifest.json  (MV3 config)    │       │  /login       Authentication      │
└─────────────────────────────────┘       │  /signup      Registration        │
         chrome.storage.local             └──────────────────────────────────┘
```

Both components share state through `chrome.storage.local`. The webapp reads live session data from the extension and the extension reads user domain preferences set in the webapp.

---

## Prerequisites

Before running anything, make sure you have the following installed:

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | v18+ | [nodejs.org](https://nodejs.org) |
| pnpm | v8+ | `npm install -g pnpm` |
| Google Chrome | Any recent | Extension requires Chrome (not Chromium-based forks) |

---

## Part 1 — Web App Setup

### 1. Install dependencies

```bash
# From the project root: TaskGuard/
pnpm install
```

### 2. Start the development server

```bash
pnpm dev
```

The app will be available at **[http://localhost:3000](http://localhost:3000)**.

> **Note:** The extension is configured to communicate with `localhost:3000` via the `externally_connectable` field in `manifest.json`. Keep this port when running locally.

### 3. Build for production (optional)

```bash
pnpm build
pnpm start
```

---

## Part 2 — Chrome Extension Setup

The extension is **not** published to the Chrome Web Store — it must be loaded manually as an unpacked extension. This takes about 30 seconds.

### Step 1 — Open Chrome Extensions

In Chrome, navigate to:

```
chrome://extensions
```

### Step 2 — Enable Developer Mode

Toggle **Developer mode** on using the switch in the **top-right corner** of the extensions page.

### Step 3 — Load the extension

1. Click **"Load unpacked"** (appears after enabling Developer mode)
2. In the file picker, navigate to and select the `taskguard-extension/` folder inside the project:

```
TaskGuard/
└── taskguard-extension/   ← select this folder
    ├── background.js
    ├── content.js
    ├── manifest.json
    ├── icons/
    └── popup/
```

3. Click **Select Folder**

### Step 4 — Verify installation

You should now see the **TaskGuard** extension card on `chrome://extensions` with no errors. The shield icon will appear in your Chrome toolbar. Click it to open the popup.

> **If you see an error:** Make sure you selected the `taskguard-extension/` subfolder, not the root `TaskGuard/` project folder.

### Reloading after changes

If you modify any extension files, click the **refresh icon** on the TaskGuard card at `chrome://extensions` to reload.

---

## Using TaskGuard

### Full flow (grader walkthrough)

1. **Open the web app** at [http://localhost:3000](http://localhost:3000) — you'll land on the animated landing page.
2. **Navigate to `/session`** — this is the study session dashboard.
3. **Start a session** — select a duration (or use a quick preset) and optionally set a session goal. Click **Start Session**.
4. **Trigger the distraction prompt** — with an active session running, open a new tab and navigate to a distracting site (e.g., `youtube.com`, `reddit.com`, `twitter.com`). The extension will inject a fullscreen overlay prompt.
5. **Respond to the prompt** — choose **"Return to Study"** (returns to previous tab) or **"Continue Anyway"** (dismisses and logs the choice).
6. **End the session** — return to `/session` and click **End Session**. A summary card displays your on-task rate, tab switches, and off-task time.
7. **Review history** — navigate to `/history` to see past session records.

### Default distracting domains

The extension ships with a default list that includes:

`youtube.com` · `reddit.com` · `twitter.com` · `instagram.com` · `tiktok.com` · `facebook.com` · `netflix.com` · `twitch.tv`

---

## Key Metric: On-Task Rate

TaskGuard's primary behavioral measure is **on-task rate**, defined as:

```
on-task rate (%) = 100 - (offTaskTime / sessionDuration × 100)
```

| Term | Definition |
|------|-----------|
| `offTaskTime` | Cumulative seconds spent on classified distracting domains during the session |
| `sessionDuration` | Total elapsed session time in seconds |

A session with zero time on distracting sites yields an on-task rate of **100%**. This metric is displayed live on the session dashboard and stored in session history.

---

## Project Structure

```
TaskGuard/
│
├── app/                          # Next.js App Router pages
│   ├── page.tsx                  # Landing page (/)
│   ├── layout.tsx                # Root layout & metadata
│   ├── globals.css               # Global styles
│   ├── session/
│   │   └── page.tsx              # Active session dashboard (/session)
│   ├── history/
│   │   └── page.tsx              # Session history (/history)
│   ├── settings/
│   │   └── page.tsx              # Domain settings (/settings)
│   ├── login/
│   │   └── page.tsx              # Login page (/login)
│   └── signup/
│       └── page.tsx              # Sign up page (/signup)
│
├── components/
│   ├── ascii-water.tsx           # Full-screen ASCII water animation (landing bg)
│   ├── hero-panel.tsx            # Landing page hero content panel
│   ├── app-header.tsx            # Shared top navigation header
│   ├── nav-bar.tsx               # In-app navigation bar
│   ├── status-bar.tsx            # Live session status bar
│   ├── theme-provider.tsx        # Dark theme context provider
│   └── ui/                       # shadcn/ui primitive components
│
├── hooks/
│   ├── use-extension-bridge.ts   # Hook for reading/writing chrome.storage.local
│   ├── use-mobile.ts             # Responsive breakpoint hook
│   └── use-toast.ts              # Toast notification hook
│
├── lib/
│   └── utils.ts                  # Shared utility functions (cn, formatTime, etc.)
│
├── public/
│   └── images/
│       ├── logo.png              # TaskGuard wordmark
│       ├── shieldlogo.png        # Shield icon
│       ├── gradient.png          # Landing page gradient asset
│       └── source.png            # Misc asset
│
├── styles/
│   └── globals.css               # Tailwind base + CSS variable overrides
│
├── taskguard-extension/          # Chrome Extension (Manifest V3)
│   ├── manifest.json             # Extension config, permissions, entry points
│   ├── background.js             # Service worker: session logic, tab tracking,
│   │                             #   domain classification, storage management
│   ├── content.js                # Content script: distraction overlay injection
│   ├── icons/
│   │   ├── icon16.png
│   │   ├── icon48.png
│   │   └── icon128.png
│   └── popup/
│       ├── popup.html            # Toolbar popup UI
│       ├── popup.js              # Popup logic: start/end session, live stats
│       └── popup.css             # Popup styles
│
├── next.config.mjs               # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
├── postcss.config.mjs            # PostCSS / Tailwind config
├── components.json               # shadcn/ui registry config
├── package.json                  # Project metadata & scripts
└── pnpm-lock.yaml                # Lockfile
```

---

## Tech Stack

### Web App
| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui (New York style) |
| Package Manager | pnpm |

### Chrome Extension
| Layer | Technology |
|-------|-----------|
| Manifest | Version 3 (MV3) |
| Background | Service Worker (`background.js`) |
| Content Scripts | Vanilla JS (`content.js`) |
| Storage | `chrome.storage.local` |
| Permissions | `tabs`, `storage`, `scripting`, `alarms`, `webNavigation` |

---

*University of Florida · HCI Course · Spring 2026*