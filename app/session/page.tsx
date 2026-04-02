
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { useExtensionBridge } from "@/hooks/use-extension-bridge";

const PRESET_DURATIONS = [15, 25, 45, 60, 90];
const MODES = [
  {
    id: "focus",
    label: "Focus",
    description: "Gentle reminders",
    color: "rgba(245, 240, 232, 0.5)",
    colorFull: "#f5f0e8",
    bgColor: "rgba(245, 240, 232, 0.08)",
  },
  {
    id: "strict",
    label: "Strict",
    description: "Prompt on distraction",
    color: "rgba(217, 158, 68, 0.7)",
    colorFull: "#d99e44",
    bgColor: "rgba(217, 158, 68, 0.12)",
  },
  {
    id: "zen",
    label: "Zen",
    description: "No interruptions",
    color: "rgba(96, 165, 250, 0.6)",
    colorFull: "#60a5fa",
    bgColor: "rgba(96, 165, 250, 0.1)",
  },
] as const;

type Mode = (typeof MODES)[number]["id"];

export default function SessionPage() {
  const router = useRouter();

  // ── Extension bridge ────────────────────────────────────────
  // Connects this page to the Chrome extension via DOM events.
  // extensionReady: extension is installed and detected on this page
  // status: live data from background.js (tabSwitches, offTaskTime, etc.)
  const {
    extensionReady,
    sessionActive: extensionSessionActive,
    status: extensionStatus,
    startSession: extensionStart,
    stopSession: extensionStop,
  } = useExtensionBridge();

  // ── Timer & session state ───────────────────────────────────
  const [duration, setDuration] = useState(25);
  const [mode, setMode] = useState<Mode>("strict");
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Time editing state
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editHours, setEditHours] = useState("0");
  const [editMinutes, setEditMinutes] = useState("25");
  const [editSeconds, setEditSeconds] = useState("00");
  const hoursInputRef = useRef<HTMLInputElement>(null);
  const minutesInputRef = useRef<HTMLInputElement>(null);
  const secondsInputRef = useRef<HTMLInputElement>(null);

  // Goal setting
  const [sessionGoal, setSessionGoal] = useState("");
  const [showGoalPrompt, setShowGoalPrompt] = useState(false);
  const goalInputRef = useRef<HTMLInputElement>(null);

  // ── Stats ───────────────────────────────────────────────────
  // Prefer real extension data when connected; fall back to local state.
  // offTaskTime from extension is in seconds; convert to minutes for display.
  const [localTabSwitches, setLocalTabSwitches] = useState(0);
  const [localOffTaskTime, setLocalOffTaskTime] = useState(0);

  const tabSwitches = extensionReady
    ? (extensionStatus?.tabSwitches ?? localTabSwitches)
    : localTabSwitches;

  const offTaskTime = extensionReady
    ? Math.floor((extensionStatus?.offTaskTime ?? 0) / 60)
    : localOffTaskTime;

  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [userInitials, setUserInitials] = useState("U");
  const [isNewUser, setIsNewUser] = useState(true);

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  // Site classification wizard
  const [showClassificationWizard, setShowClassificationWizard] = useState(false);
  const [siteClassifications, setSiteClassifications] = useState<Record<string, boolean>>({});
  const commonSites = [
    { domain: "twitter.com",   icon: "T" },
    { domain: "reddit.com",    icon: "R" },
    { domain: "youtube.com",   icon: "Y" },
    { domain: "facebook.com",  icon: "F" },
    { domain: "instagram.com", icon: "I" },
    { domain: "tiktok.com",    icon: "T" },
    { domain: "netflix.com",   icon: "N" },
    { domain: "twitch.tv",     icon: "W" },
    { domain: "discord.com",   icon: "D" },
    { domain: "linkedin.com",  icon: "L" },
  ];

  const [lastSession, setLastSession] = useState<{
    onTaskRate: number;
    tabSwitches: number;
    offTaskMinutes: number;
    duration: number;
  } | null>(null);

  const [monitoredSites, setMonitoredSites] = useState<string[]>([]);

  const onboardingSteps = [
    {
      title: "Welcome to TaskGuard",
      description:
        "TaskGuard helps you stay focused by monitoring your browsing and gently redirecting you when you drift off-task.",
      highlight: "timer",
    },
    {
      title: "Tab Switches",
      description:
        "This tracks how many times you switch away from your work. Fewer switches = better focus. Most people switch 15+ times in a 25-minute session.",
      highlight: "metrics",
    },
    {
      title: "Choose Your Mode",
      description:
        "Focus mode gives gentle reminders. Strict mode prompts you immediately. Zen mode tracks silently with no interruptions.",
      highlight: "modes",
    },
  ];

  // ── Load saved state on mount ───────────────────────────────
  useEffect(() => {
    const sessions = localStorage.getItem("taskguard_sessions");
    const onboarded = localStorage.getItem("taskguard_onboarded");
    const classified = localStorage.getItem("taskguard_classified");

    if (sessions) {
      try {
        const parsed = JSON.parse(sessions);
        if (parsed?.length > 0) {
          setIsNewUser(false);
          const recent = parsed[parsed.length - 1];
          setLastSession({
            onTaskRate:     recent.onTaskRate ?? 0,
            tabSwitches:    recent.tabSwitches || 0,
            offTaskMinutes: recent.offTaskTime || 0,
            duration:       Math.floor((recent.duration || 0) / 60),
          });
        }
      } catch { /* ignore */ }
    }

    if (!onboarded) setShowOnboarding(true);
    if (onboarded && !classified) setShowClassificationWizard(true);

    const settings = localStorage.getItem("taskguard_settings");
    if (settings) {
      try {
        const parsed = JSON.parse(settings);
        if (parsed.monitoredSites?.length > 0) {
          setMonitoredSites(parsed.monitoredSites.map((s: { domain: string }) => s.domain));
        }
      } catch { /* ignore */ }
    }
  }, []);

  const currentMode = MODES.find((m) => m.id === mode) || MODES[1];

  // Sync timeLeft with duration when not running
  useEffect(() => {
    if (!isRunning) setTimeLeft(duration * 60);
  }, [duration, isRunning]);

  // ── Time editing ────────────────────────────────────────────
  const handleStartTimeEdit = useCallback(() => {
    if (isRunning) return;
    const hours   = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;
    setEditHours(String(hours));
    setEditMinutes(String(minutes).padStart(2, "0"));
    setEditSeconds(String(seconds).padStart(2, "0"));
    setIsEditingTime(true);
  }, [isRunning, timeLeft]);

  const handleTimeEditSubmit = useCallback(() => {
    const h = parseInt(editHours, 10) || 0;
    const m = parseInt(editMinutes, 10) || 0;
    const s = parseInt(editSeconds, 10) || 0;
    const total = h * 3600 + m * 60 + s;
    if (total > 0 && total <= 5 * 3600) {
      setTimeLeft(total);
      setDuration(Math.ceil(total / 60));
    }
    setIsEditingTime(false);
  }, [editHours, editMinutes, editSeconds]);

  const handleTimeEditCancel = useCallback(() => setIsEditingTime(false), []);

  useEffect(() => {
    if (isEditingTime && minutesInputRef.current) {
      minutesInputRef.current.focus();
      minutesInputRef.current.select();
    }
  }, [isEditingTime]);

  // ── Timer countdown ─────────────────────────────────────────
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          // Tell extension session is over
          extensionStop();
          // Save to history
          const sessions = JSON.parse(localStorage.getItem("taskguard_sessions") || "[]");
          sessions.push({
            date:       new Date().toISOString(),
            duration:   duration * 60,
            onTaskRate: Math.round(Math.max(0, 100 - (offTaskTime / duration) * 100)),
            tabSwitches,
            offTaskTime,
            goal:       sessionGoal,
            mode,
          });
          localStorage.setItem("taskguard_sessions", JSON.stringify(sessions));
          setIsNewUser(false);
          return duration * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, duration, tabSwitches, offTaskTime, sessionGoal, mode, extensionStop]);

  useEffect(() => {
    setMounted(true);
    const auth = localStorage.getItem("taskguard_auth");
    if (auth) {
      try {
        const { email } = JSON.parse(auth);
        if (email) setUserInitials(email.charAt(0).toUpperCase());
      } catch { /* ignore */ }
    }
  }, []);

  // ── Session control ─────────────────────────────────────────

  /**
   * Starts the local timer AND signals the extension to begin tracking.
   * Resets local fallback stats before starting.
   */
  const startSession = useCallback(() => {
    setIsRunning(true);
    setSessionStartTime(Date.now());
    setShowGoalPrompt(false);
    // Reset local fallback stats
    setLocalTabSwitches(0);
    setLocalOffTaskTime(0);
    // Signal the extension — content.js forwards this to background.js
    extensionStart();
  }, [extensionStart]);

  /**
   * Toggles session on/off.
   * - If running: stops timer, saves session to localStorage, signals extension stop.
   * - If not running: shows goal prompt before starting.
   */
  const toggleSession = useCallback(() => {
    if (isRunning) {
      setIsRunning(false);
      // Signal extension to stop tracking
      extensionStop();
      // Save completed session
      const sessions = JSON.parse(localStorage.getItem("taskguard_sessions") || "[]");
      sessions.push({
        date:       new Date().toISOString(),
        duration:   duration * 60 - timeLeft,
        onTaskRate: Math.round(Math.max(0, 100 - (offTaskTime / duration) * 100)),
        tabSwitches,
        offTaskTime,
        goal:       sessionGoal,
        mode,
      });
      localStorage.setItem("taskguard_sessions", JSON.stringify(sessions));
      setIsNewUser(false);
      setLocalTabSwitches(0);
      setLocalOffTaskTime(0);
      setTimeLeft(duration * 60);
    } else {
      setShowGoalPrompt(true);
    }
  }, [isRunning, duration, timeLeft, tabSwitches, offTaskTime, sessionGoal, mode, extensionStop]);

  const handleGoalSubmit = () => startSession();

  // ── Onboarding & classification ─────────────────────────────
  const handleOnboardingNext = () => {
    if (onboardingStep < onboardingSteps.length - 1) {
      setOnboardingStep(onboardingStep + 1);
    } else {
      localStorage.setItem("taskguard_onboarded", "true");
      setShowOnboarding(false);
      if (!localStorage.getItem("taskguard_classified")) {
        setShowClassificationWizard(true);
      }
    }
  };

  const toggleSiteClassification = (domain: string) => {
    setSiteClassifications((prev) => ({ ...prev, [domain]: !prev[domain] }));
  };

  const handleClassificationComplete = () => {
    const distractionSites = Object.entries(siteClassifications)
      .filter(([, isDistraction]) => isDistraction)
      .map(([domain]) => ({ domain, isDistraction: true }));
    const existing = localStorage.getItem("taskguard_settings");
    const settings = existing ? JSON.parse(existing) : {};
    settings.monitoredSites = distractionSites;
    localStorage.setItem("taskguard_settings", JSON.stringify(settings));
    localStorage.setItem("taskguard_classified", "true");
    setShowClassificationWizard(false);
  };

  // ── Formatters ──────────────────────────────────────────────
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins  = Math.floor((seconds % 3600) / 60);
    const secs  = seconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress        = ((duration * 60 - timeLeft) / (duration * 60)) * 100;
  const elapsedMinutes  = Math.floor((duration * 60 - timeLeft) / 60);

  // ── Render ──────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex flex-col px-4 sm:px-6 lg:px-12 py-4 sm:py-6 relative"
      style={{ backgroundColor: "#070707" }}
    >
      {/* Ambient mode glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute inset-0 transition-opacity duration-700 ease-in-out"
          style={{ opacity: mode === "focus" ? 1 : 0, background: "radial-gradient(ellipse 720px 520px at 50% 52%, rgba(245,240,232,0.09) 0%, rgba(245,240,232,0.03) 45%, transparent 70%)" }} />
        <div className="absolute inset-0 transition-opacity duration-700 ease-in-out"
          style={{ opacity: mode === "strict" ? 1 : 0, background: "radial-gradient(ellipse 720px 520px at 50% 52%, rgba(217,158,68,0.13) 0%, rgba(217,158,68,0.04) 45%, transparent 70%)" }} />
        <div className="absolute inset-0 transition-opacity duration-700 ease-in-out"
          style={{ opacity: mode === "zen" ? 1 : 0, background: "radial-gradient(ellipse 720px 520px at 50% 52%, rgba(96,165,250,0.11) 0%, rgba(96,165,250,0.03) 45%, transparent 70%)" }} />
      </div>

      {/* Onboarding Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          <div className="relative z-10 w-full max-w-lg p-8 rounded-xl"
            style={{ backgroundColor: "rgba(15,15,15,0.98)", border: "1px solid rgba(245,240,232,0.1)" }}>
            <div className="flex gap-2 mb-6">
              {onboardingSteps.map((_, i) => (
                <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                  style={{ backgroundColor: i <= onboardingStep ? "#f5f0e8" : "rgba(245,240,232,0.15)" }} />
              ))}
            </div>
            <div className="mb-8">
              <h2 className="text-[24px] font-light mb-3" style={{ color: "#f5f0e8" }}>
                {onboardingSteps[onboardingStep].title}
              </h2>
              <p className="text-[14px] leading-relaxed" style={{ color: "rgba(245,240,232,0.6)" }}>
                {onboardingSteps[onboardingStep].description}
              </p>
            </div>
            <div className="mb-8 p-4 rounded-lg"
              style={{ backgroundColor: "rgba(245,240,232,0.03)", border: "1px dashed rgba(245,240,232,0.1)" }}>
              {onboardingStep === 0 && (
                <div className="flex items-center justify-center gap-3">
                  <span className="text-[36px] font-light" style={{ color: "#f5f0e8" }}>25:00</span>
                  <span className="text-[12px] font-mono" style={{ color: "rgba(245,240,232,0.4)" }}>space to start</span>
                </div>
              )}
              {onboardingStep === 1 && (
                <div className="flex items-center justify-center gap-6">
                  <div className="text-center">
                    <span className="block text-[28px] font-light" style={{ color: "#f5f0e8" }}>3</span>
                    <span className="text-[10px] font-mono" style={{ color: "rgba(245,240,232,0.4)" }}>tab switches</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-[28px] font-light" style={{ color: "rgba(252,165,165,0.8)" }}>4m</span>
                    <span className="text-[10px] font-mono" style={{ color: "rgba(245,240,232,0.4)" }}>off-task</span>
                  </div>
                </div>
              )}
              {onboardingStep === 2 && (
                <div className="flex items-center justify-center gap-4">
                  {MODES.map((m) => (
                    <div key={m.id} className="px-3 py-2 rounded-lg text-center" style={{ backgroundColor: m.bgColor }}>
                      <span className="text-[13px] font-medium" style={{ color: m.colorFull }}>{m.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3">
              {onboardingStep > 0 && (
                <button onClick={() => setOnboardingStep(onboardingStep - 1)}
                  className="px-6 py-3 rounded-lg text-[13px] font-medium"
                  style={{ color: "rgba(245,240,232,0.5)", border: "1px solid rgba(245,240,232,0.1)" }}>
                  Back
                </button>
              )}
              <button onClick={handleOnboardingNext}
                className="flex-1 px-6 py-3 rounded-lg text-[13px] font-medium"
                style={{ backgroundColor: "#f5f0e8", color: "#0a0a0a" }}>
                {onboardingStep === onboardingSteps.length - 1 ? "Get Started" : "Next"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Site Classification Wizard */}
      {showClassificationWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          <div className="relative z-10 w-full max-w-lg p-8 rounded-xl"
            style={{ backgroundColor: "rgba(15,15,15,0.98)", border: "1px solid rgba(245,240,232,0.1)" }}>
            <h2 className="text-[24px] font-light mb-2" style={{ color: "#f5f0e8" }}>Personalize Your Focus</h2>
            <p className="text-[14px] mb-6" style={{ color: "rgba(245,240,232,0.5)" }}>
              Which of these sites distract you? Tap to mark as a distraction.
            </p>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {commonSites.map((site) => (
                <button key={site.domain} onClick={() => toggleSiteClassification(site.domain)}
                  className="flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-left"
                  style={{
                    backgroundColor: siteClassifications[site.domain] ? "rgba(252,165,165,0.12)" : "rgba(245,240,232,0.03)",
                    border: `1px solid ${siteClassifications[site.domain] ? "rgba(252,165,165,0.3)" : "rgba(245,240,232,0.08)"}`,
                  }}>
                  <div className="w-8 h-8 rounded-md flex items-center justify-center text-[12px] font-mono"
                    style={{
                      backgroundColor: siteClassifications[site.domain] ? "rgba(252,165,165,0.2)" : "rgba(245,240,232,0.08)",
                      color: siteClassifications[site.domain] ? "rgba(252,165,165,0.9)" : "rgba(245,240,232,0.5)",
                    }}>
                    {site.icon}
                  </div>
                  <span className="text-[13px] font-mono"
                    style={{ color: siteClassifications[site.domain] ? "rgba(252,165,165,0.9)" : "rgba(245,240,232,0.6)" }}>
                    {site.domain}
                  </span>
                  {siteClassifications[site.domain] && (
                    <svg className="w-4 h-4 ml-auto" viewBox="0 0 24 24" fill="none" stroke="rgba(252,165,165,0.8)" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <p className="text-[11px] mb-4" style={{ color: "rgba(245,240,232,0.35)" }}>
              You can always add more sites in Settings later.
            </p>
            <button onClick={handleClassificationComplete}
              className="w-full px-6 py-3 rounded-lg text-[13px] font-medium"
              style={{ backgroundColor: "#f5f0e8", color: "#0a0a0a" }}>
              Continue ({Object.values(siteClassifications).filter(Boolean).length} selected)
            </button>
          </div>
        </div>
      )}

      {/* Goal Setting Modal */}
      {showGoalPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowGoalPrompt(false)} />
          <div className="relative z-10 w-full max-w-md p-8 rounded-xl"
            style={{ backgroundColor: "rgba(15,15,15,0.95)", border: "1px solid rgba(245,240,232,0.1)" }}>
            <h2 className="text-[20px] font-light mb-2" style={{ color: "#f5f0e8" }}>What are you working on?</h2>
            <p className="text-[13px] mb-6" style={{ color: "rgba(245,240,232,0.4)" }}>
              Setting a goal helps you stay accountable during your session.
            </p>
            <input
              ref={goalInputRef}
              type="text"
              value={sessionGoal}
              onChange={(e) => setSessionGoal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleGoalSubmit();
                if (e.key === "Escape") setShowGoalPrompt(false);
              }}
              placeholder="e.g., Research paper, Chapter 5 review..."
              className="w-full px-4 py-3 rounded-lg text-[14px] outline-none mb-4"
              style={{ backgroundColor: "rgba(245,240,232,0.05)", border: "1px solid rgba(245,240,232,0.15)", color: "#f5f0e8" }}
            />
            <div className="flex gap-3">
              <button onClick={() => setShowGoalPrompt(false)}
                className="flex-1 px-4 py-3 rounded-lg text-[13px] font-medium"
                style={{ backgroundColor: "transparent", color: "rgba(245,240,232,0.5)", border: "1px solid rgba(245,240,232,0.1)" }}>
                Cancel
              </button>
              <button onClick={handleGoalSubmit}
                className="flex-1 px-4 py-3 rounded-lg text-[13px] font-medium"
                style={{ backgroundColor: currentMode.colorFull, color: "#070707" }}>
                Start Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className={`transition-all duration-700 ease-out ${mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
        <AppHeader currentPage="session" userInitials={userInitials} />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-8">
        <div
          className={`w-full max-w-6xl transition-all duration-700 ease-out ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          style={{ transitionDelay: "150ms" }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_240px] gap-6 sm:gap-8 lg:gap-10 items-start lg:items-center">

            {/* Left Column - Session Controls */}
            <div className="flex flex-col gap-8">
              {/* Quick Duration Presets */}
              <div className="flex flex-col gap-3">
                <span className="text-[11px] font-mono uppercase tracking-[0.25em]" style={{ color: "rgba(245,240,232,0.4)" }}>
                  Quick Set
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {PRESET_DURATIONS.map((d) => (
                    <button key={d}
                      onClick={() => { if (!isRunning) { setDuration(d); setTimeLeft(d * 60); } }}
                      className={`px-3 py-1.5 text-[13px] font-mono rounded-md transition-all duration-200 ${isRunning ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                      style={{
                        color: duration === d ? "#f5f0e8" : "rgba(245,240,232,0.4)",
                        backgroundColor: duration === d ? "rgba(245,240,232,0.12)" : "transparent",
                        border: duration === d ? "1px solid rgba(245,240,232,0.2)" : "1px solid transparent",
                      }}
                      disabled={isRunning}>
                      {d}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode Selection */}
              <div className="flex flex-col gap-3">
                <span className="text-[11px] font-mono uppercase tracking-[0.25em]" style={{ color: "rgba(245,240,232,0.4)" }}>
                  Mode
                </span>
                <div className="flex flex-col gap-2">
                  {MODES.map((m) => (
                    <button key={m.id} onClick={() => !isRunning && setMode(m.id)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-md transition-all duration-300 ${isRunning ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                      style={{
                        backgroundColor: mode === m.id ? m.bgColor : "transparent",
                        border: mode === m.id ? `1px solid ${m.color}` : "1px solid transparent",
                      }}
                      disabled={isRunning}>
                      <div className="flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full transition-all duration-300"
                          style={{ backgroundColor: mode === m.id ? m.colorFull : "rgba(245,240,232,0.2)" }} />
                        <span className="text-[13px] font-mono"
                          style={{ color: mode === m.id ? m.colorFull : "rgba(245,240,232,0.4)" }}>
                          {m.label}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono" style={{ color: "rgba(245,240,232,0.25)" }}>
                        {m.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Monitored Sites */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: "rgba(245,240,232,0.3)" }}>
                    Monitored sites
                  </span>
                  <Link href="/settings" className="text-[10px] font-mono hover:opacity-100" style={{ color: "rgba(245,240,232,0.35)" }}>
                    Edit
                  </Link>
                </div>
                {monitoredSites.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5" style={{ color: "rgba(245,240,232,0.25)" }}>
                    {monitoredSites.slice(0, 3).map((site) => (
                      <span key={site} className="text-[10px] font-mono px-2 py-1 rounded"
                        style={{ backgroundColor: "rgba(245,240,232,0.04)" }}>
                        {site}
                      </span>
                    ))}
                    {monitoredSites.length > 3 && (
                      <span className="text-[10px] font-mono px-2 py-1 rounded"
                        style={{ backgroundColor: "rgba(245,240,232,0.04)" }}>
                        +{monitoredSites.length - 3}
                      </span>
                    )}
                  </div>
                ) : (
                  <Link href="/settings"
                    className="flex items-center gap-2 text-[11px] font-mono px-3 py-2 rounded-lg transition-all duration-200"
                    style={{ backgroundColor: "rgba(245,240,232,0.03)", color: "rgba(245,240,232,0.4)", border: "1px dashed rgba(245,240,232,0.1)" }}>
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add sites to monitor
                  </Link>
                )}
              </div>
            </div>

            {/* Center Column - Timer */}
            <div className="flex flex-col items-center gap-6">
              {isRunning && sessionGoal && (
                <div className="text-center px-4 py-2 rounded-lg"
                  style={{ backgroundColor: "rgba(245,240,232,0.03)", border: "1px solid rgba(245,240,232,0.06)" }}>
                  <span className="text-[12px] font-mono" style={{ color: "rgba(245,240,232,0.5)" }}>
                    Working on: <span style={{ color: "rgba(245,240,232,0.8)" }}>{sessionGoal}</span>
                  </span>
                </div>
              )}

              {/* Progress Ring */}
              <div className="relative">
                <svg className="w-48 h-48 sm:w-64 sm:h-64 lg:w-72 lg:h-72 -rotate-90" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(245,240,232,0.06)" strokeWidth="2" />
                  <circle cx="100" cy="100" r="90" fill="none" stroke={currentMode.color} strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 90}
                    strokeDashoffset={2 * Math.PI * 90 * (1 - progress / 100)}
                    className="transition-all duration-1000 ease-linear"
                    style={{ filter: isRunning ? `drop-shadow(0 0 8px ${currentMode.color})` : "none" }} />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {isEditingTime ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex items-center gap-1">
                        <input ref={hoursInputRef} type="text" inputMode="numeric" value={editHours}
                          onChange={(e) => setEditHours(e.target.value.replace(/\D/g, "").slice(0, 2))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleTimeEditSubmit();
                            if (e.key === "Escape") handleTimeEditCancel();
                            if (e.key === "ArrowRight" || (e.key === "Tab" && !e.shiftKey)) { e.preventDefault(); minutesInputRef.current?.focus(); minutesInputRef.current?.select(); }
                          }}
                          className="w-16 sm:w-20 text-[40px] sm:text-[56px] lg:text-[64px] font-light text-center bg-transparent outline-none"
                          style={{ color: "#f5f0e8" }} maxLength={2} />
                        <span className="text-[40px] sm:text-[56px] lg:text-[64px] font-light" style={{ color: "rgba(245,240,232,0.3)" }}>:</span>
                        <input ref={minutesInputRef} type="text" inputMode="numeric" value={editMinutes}
                          onChange={(e) => setEditMinutes(e.target.value.replace(/\D/g, "").slice(0, 2))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleTimeEditSubmit();
                            if (e.key === "Escape") handleTimeEditCancel();
                            if (e.key === "ArrowRight" || (e.key === "Tab" && !e.shiftKey)) { e.preventDefault(); secondsInputRef.current?.focus(); secondsInputRef.current?.select(); }
                            if (e.key === "ArrowLeft" || (e.key === "Tab" && e.shiftKey)) { e.preventDefault(); hoursInputRef.current?.focus(); hoursInputRef.current?.select(); }
                          }}
                          className="w-16 sm:w-20 text-[40px] sm:text-[56px] lg:text-[64px] font-light text-center bg-transparent outline-none"
                          style={{ color: "#f5f0e8" }} maxLength={2} />
                        <span className="text-[40px] sm:text-[56px] lg:text-[64px] font-light" style={{ color: "rgba(245,240,232,0.3)" }}>:</span>
                        <input ref={secondsInputRef} type="text" inputMode="numeric" value={editSeconds}
                          onChange={(e) => setEditSeconds(e.target.value.replace(/\D/g, "").slice(0, 2))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleTimeEditSubmit();
                            if (e.key === "Escape") handleTimeEditCancel();
                            if (e.key === "ArrowLeft" || (e.key === "Tab" && e.shiftKey)) { e.preventDefault(); minutesInputRef.current?.focus(); minutesInputRef.current?.select(); }
                          }}
                          className="w-16 sm:w-20 text-[40px] sm:text-[56px] lg:text-[64px] font-light text-center bg-transparent outline-none"
                          style={{ color: "#f5f0e8" }} maxLength={2} />
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider" style={{ color: "rgba(245,240,232,0.3)" }}>
                        <span className="w-16 sm:w-20 text-center">hrs</span>
                        <span className="w-4" />
                        <span className="w-16 sm:w-20 text-center">min</span>
                        <span className="w-4" />
                        <span className="w-16 sm:w-20 text-center">sec</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={handleTimeEditCancel} className="px-4 py-1.5 text-[12px] font-mono rounded-md"
                          style={{ color: "rgba(245,240,232,0.5)" }}>Cancel</button>
                        <button onClick={handleTimeEditSubmit} className="px-4 py-1.5 text-[12px] font-mono rounded-md"
                          style={{ backgroundColor: "rgba(245,240,232,0.1)", color: "#f5f0e8" }}>Set Time</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={isRunning ? toggleSession : handleStartTimeEdit}
                      className="group cursor-pointer flex flex-col items-center">
                      <span className="text-[48px] sm:text-[64px] lg:text-[80px] font-light tracking-tight leading-none transition-all duration-300 group-hover:opacity-80"
                        style={{ color: isRunning ? currentMode.colorFull : "#f5f0e8" }}>
                        {formatTime(timeLeft)}
                      </span>
                      {isRunning ? (
                        <span className="text-[11px] font-mono mt-2 uppercase tracking-widest" style={{ color: currentMode.color }}>
                          {mode} mode
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ color: "rgba(245,240,232,0.4)" }}>
                          click to edit
                        </span>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Start/Stop Button */}
              <div className="flex flex-col items-center gap-4">
                <span className="text-[12px] font-mono tracking-wider" style={{ color: "rgba(245,240,232,0.3)" }}>
                  {isRunning ? "press space to pause" : isEditingTime ? "enter to confirm" : "click timer to edit"}
                </span>
                <button onClick={toggleSession}
                  className="px-8 py-3 rounded-lg text-[14px] font-medium transition-all duration-300"
                  style={{
                    backgroundColor: isRunning ? "transparent" : currentMode.colorFull,
                    color:           isRunning ? currentMode.colorFull : "#070707",
                    border:          isRunning ? `1px solid ${currentMode.color}` : "none",
                    boxShadow:       !isRunning ? `0 0 20px ${currentMode.color}` : "none",
                  }}>
                  {isRunning ? "End Session" : "Start Session"}
                </button>

                {/* Extension not detected warning */}
                {!extensionReady && (
                  <p className="text-[11px] font-mono text-center" style={{ color: "rgba(245,240,232,0.2)" }}>
                    Extension not detected — install TaskGuard for real tracking
                  </p>
                )}
              </div>
            </div>

            {/* Right Column - Live Stats & Last Session */}
            <div className="flex flex-col gap-8">
              {isRunning && (
                <div className="flex flex-col gap-4 p-4 rounded-lg transition-all duration-300"
                  style={{ backgroundColor: currentMode.bgColor, border: `1px solid ${currentMode.color}` }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: currentMode.color }}>
                      Current Session
                    </span>
                    {/* Extension live indicator */}
                    {extensionReady && (
                      <span className="flex items-center gap-1.5 text-[9px] font-mono" style={{ color: "rgba(74,222,128,0.7)" }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        ext. live
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[28px] font-light" style={{ color: "#f5f0e8" }}>{tabSwitches}</span>
                      <span className="text-[10px] font-mono" style={{ color: "rgba(245,240,232,0.35)" }}>tab switches</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[28px] font-light" style={{ color: "#f5f0e8" }}>{offTaskTime}m</span>
                      <span className="text-[10px] font-mono" style={{ color: "rgba(245,240,232,0.35)" }}>off-task</span>
                    </div>
                  </div>

                  {offTaskTime > 0 && sessionGoal && (
                    <div className="text-[11px] font-mono p-2 rounded"
                      style={{ backgroundColor: "rgba(0,0,0,0.2)", color: "rgba(245,240,232,0.6)" }}>
                      {offTaskTime}m off-task — still working on {sessionGoal}?
                    </div>
                  )}

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono" style={{ color: "rgba(245,240,232,0.35)" }}>elapsed</span>
                      <span className="text-[10px] font-mono" style={{ color: "rgba(245,240,232,0.5)" }}>
                        {elapsedMinutes}m / {duration}m
                      </span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(245,240,232,0.1)" }}>
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${progress}%`, backgroundColor: currentMode.colorFull }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Last Session Summary */}
              <div className="flex flex-col gap-4">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: "rgba(245,240,232,0.35)" }}>
                  Last Session
                </span>
                {lastSession ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-end justify-between">
                      <div className="flex flex-col gap-1">
                        <span className="text-[36px] font-light leading-none" style={{ color: "rgba(245,240,232,0.9)" }}>
                          {lastSession.onTaskRate}%
                        </span>
                        <span className="text-[10px] font-mono" style={{ color: "rgba(245,240,232,0.35)" }}>on-task rate</span>
                      </div>
                      <div className="flex flex-col gap-1 items-end" style={{ color: "rgba(245,240,232,0.35)" }}>
                        <span className="text-[11px] font-mono">{lastSession.duration}m session</span>
                      </div>
                    </div>
                    <div className="h-px w-full" style={{ backgroundColor: "rgba(245,240,232,0.08)" }} />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[20px] font-light" style={{ color: "rgba(245,240,232,0.7)" }}>{lastSession.tabSwitches}</span>
                        <span className="text-[10px] font-mono" style={{ color: "rgba(245,240,232,0.3)" }}>tab switches</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[20px] font-light" style={{ color: "rgba(245,240,232,0.7)" }}>{lastSession.offTaskMinutes}m</span>
                        <span className="text-[10px] font-mono" style={{ color: "rgba(245,240,232,0.3)" }}>off-task</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 py-8 px-4 rounded-lg text-center"
                    style={{ backgroundColor: "rgba(245,240,232,0.02)", border: "1px dashed rgba(245,240,232,0.1)" }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "rgba(245,240,232,0.05)" }}>
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="rgba(245,240,232,0.3)" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>
                    <p className="text-[12px] font-mono leading-relaxed" style={{ color: "rgba(245,240,232,0.4)" }}>
                      Complete your first session<br />to see stats here
                    </p>
                  </div>
                )}
              </div>

              {/* Mode tip */}
              <div className="flex flex-col gap-2 p-3 rounded-lg"
                style={{ backgroundColor: "rgba(245,240,232,0.02)", border: "1px solid rgba(245,240,232,0.05)" }}>
                <span className="text-[9px] font-mono uppercase tracking-[0.15em]" style={{ color: "rgba(245,240,232,0.3)" }}>
                  {mode} mode
                </span>
                <p className="text-[11px] leading-relaxed" style={{ color: "rgba(245,240,232,0.4)" }}>
                  {mode === "focus"  && "Gentle nudges when you drift to distracting sites. Perfect for light work."}
                  {mode === "strict" && "You'll be prompted before accessing distracting sites, giving you a moment to reconsider."}
                  {mode === "zen"    && "Complete silence. No interruptions, no tracking. Just you and your work."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Status Bar */}
      <footer
        className={`flex items-center justify-between py-4 transition-all duration-700 ease-out ${mounted ? "opacity-100" : "opacity-0"}`}
        style={{ transitionDelay: "300ms" }}
      >
        <div className="flex items-center gap-6">
          <span className="text-[11px] font-mono" style={{ color: "rgba(245,240,232,0.25)" }}>
            TaskGuard v0.1.0
          </span>
          <span className="flex items-center gap-2 text-[11px] font-mono" style={{ color: "rgba(245,240,232,0.25)" }}>
            <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? "animate-pulse" : ""}`}
              style={{ backgroundColor: isRunning ? currentMode.colorFull : "rgba(245,240,232,0.3)" }} />
            {isRunning ? "session active" : "ready"}
          </span>
          {/* Extension connection status */}
          <span className="flex items-center gap-2 text-[11px] font-mono"
            style={{ color: extensionReady ? "rgba(74,222,128,0.5)" : "rgba(245,240,232,0.15)" }}>
            <span className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: extensionReady ? "rgba(74,222,128,0.6)" : "rgba(245,240,232,0.15)" }} />
            {extensionReady ? "extension connected" : "extension not detected"}
          </span>
        </div>
      </footer>
    </div>
  );
}