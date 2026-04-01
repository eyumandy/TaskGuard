"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";

const PRESET_DURATIONS = [15, 25, 45, 60, 90];
const MODES = [
  { 
    id: "focus", 
    label: "Focus", 
    description: "Gentle reminders",
    color: "rgba(245, 240, 232, 0.5)",
    colorFull: "#f5f0e8",
    bgColor: "rgba(245, 240, 232, 0.08)"
  },
  { 
    id: "strict", 
    label: "Strict", 
    description: "Prompt on distraction",
    color: "rgba(217, 158, 68, 0.7)",
    colorFull: "#d99e44",
    bgColor: "rgba(217, 158, 68, 0.12)"
  },
  { 
    id: "zen", 
    label: "Zen", 
    description: "No interruptions",
    color: "rgba(96, 165, 250, 0.6)",
    colorFull: "#60a5fa",
    bgColor: "rgba(96, 165, 250, 0.1)"
  },
] as const;

type Mode = (typeof MODES)[number]["id"];

export default function SessionPage() {
  const router = useRouter();
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

  // Session metrics (simulated - would be real in browser extension)
  const [tabSwitches, setTabSwitches] = useState(0);
  const [offTaskTime, setOffTaskTime] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  
  // User initials for header
  const [userInitials, setUserInitials] = useState("U");

  // Check if user is new (no session history)
  const [isNewUser, setIsNewUser] = useState(true);
  
  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  
  // Site classification wizard
  const [showClassificationWizard, setShowClassificationWizard] = useState(false);
  const [siteClassifications, setSiteClassifications] = useState<Record<string, boolean>>({});
  const commonSites = [
    { domain: "twitter.com", icon: "T" },
    { domain: "reddit.com", icon: "R" },
    { domain: "youtube.com", icon: "Y" },
    { domain: "facebook.com", icon: "F" },
    { domain: "instagram.com", icon: "I" },
    { domain: "tiktok.com", icon: "T" },
    { domain: "netflix.com", icon: "N" },
    { domain: "twitch.tv", icon: "W" },
    { domain: "discord.com", icon: "D" },
    { domain: "linkedin.com", icon: "L" },
  ];
  
  // Last session stats - loaded from localStorage
  const [lastSession, setLastSession] = useState<{
    focusScore: number;
    tabSwitches: number;
    offTaskMinutes: number;
    duration: number;
  } | null>(null);
  
  // Monitored sites - loaded from settings
  const [monitoredSites, setMonitoredSites] = useState<string[]>([]);
  
  // Onboarding steps content
  const onboardingSteps = [
    {
      title: "Welcome to TaskGuard",
      description: "TaskGuard helps you stay focused by monitoring your browsing and gently redirecting you when you drift off-task.",
      highlight: "timer",
    },
    {
      title: "Tab Switches",
      description: "This tracks how many times you switch away from your work. Fewer switches = better focus. Most people switch 15+ times in a 25-minute session.",
      highlight: "metrics",
    },
    {
      title: "Choose Your Mode",
      description: "Focus mode gives gentle reminders. Strict mode prompts you immediately. Zen mode tracks silently with no interruptions.",
      highlight: "modes",
    },
  ];
  
  // Check for existing sessions and onboarding status on mount
  useEffect(() => {
    const sessions = localStorage.getItem("taskguard_sessions");
    const onboarded = localStorage.getItem("taskguard_onboarded");
    const classified = localStorage.getItem("taskguard_classified");
    
    if (sessions) {
      try {
        const parsed = JSON.parse(sessions);
        if (parsed && parsed.length > 0) {
          setIsNewUser(false);
          // Load most recent session
          const recent = parsed[parsed.length - 1];
          setLastSession({
            focusScore: recent.focusScore || 0,
            tabSwitches: recent.tabSwitches || 0,
            offTaskMinutes: recent.offTaskTime || 0,
            duration: Math.floor((recent.duration || 0) / 60),
          });
        }
      } catch {
        // Ignore parse errors
      }
    }
    
    // Show onboarding if user hasn't completed it
    if (!onboarded) {
      setShowOnboarding(true);
    }
    
    // Show site classification if not done yet (after onboarding)
    if (onboarded && !classified) {
      setShowClassificationWizard(true);
    }
    
    // Load monitored sites from settings
    const settings = localStorage.getItem("taskguard_settings");
    if (settings) {
      try {
        const parsed = JSON.parse(settings);
        if (parsed.monitoredSites && parsed.monitoredSites.length > 0) {
          setMonitoredSites(parsed.monitoredSites.map((s: { domain: string }) => s.domain));
        }
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Get current mode config
  const currentMode = MODES.find(m => m.id === mode) || MODES[1];

  // Sync timeLeft with duration when not running
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(duration * 60);
    }
  }, [duration, isRunning]);
  
  // Handle time edit - when user clicks on timer to edit
  const handleStartTimeEdit = useCallback(() => {
    if (isRunning) return;
    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;
    setEditHours(String(hours));
    setEditMinutes(String(minutes).padStart(2, '0'));
    setEditSeconds(String(seconds).padStart(2, '0'));
    setIsEditingTime(true);
  }, [isRunning, timeLeft]);
  
  // Submit time edit
  const handleTimeEditSubmit = useCallback(() => {
    const h = parseInt(editHours, 10) || 0;
    const m = parseInt(editMinutes, 10) || 0;
    const s = parseInt(editSeconds, 10) || 0;
    const totalSeconds = h * 3600 + m * 60 + s;
    if (totalSeconds > 0 && totalSeconds <= 5 * 3600) { // Max 5 hours
      setTimeLeft(totalSeconds);
      setDuration(Math.ceil(totalSeconds / 60));
    }
    setIsEditingTime(false);
  }, [editHours, editMinutes, editSeconds]);
  
  // Cancel time edit
  const handleTimeEditCancel = useCallback(() => {
    setIsEditingTime(false);
  }, []);
  
  // Focus minutes input when editing starts
  useEffect(() => {
    if (isEditingTime && minutesInputRef.current) {
      minutesInputRef.current.focus();
      minutesInputRef.current.select();
    }
  }, [isEditingTime]);
  
  // Timer countdown effect
  useEffect(() => {
    if (!isRunning) return;
    
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          // Session complete - save to history
          const sessions = JSON.parse(localStorage.getItem("taskguard_sessions") || "[]");
          sessions.push({
            date: new Date().toISOString(),
            duration: duration * 60,
            focusScore: Math.max(0, 100 - (tabSwitches * 3) - (offTaskTime * 2)),
            tabSwitches,
            offTaskTime,
            goal: sessionGoal,
            mode: mode,
          });
          localStorage.setItem("taskguard_sessions", JSON.stringify(sessions));
          setIsNewUser(false);
          return duration * 60;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isRunning, duration, tabSwitches, offTaskTime, sessionGoal, mode]);
  
  useEffect(() => {
    setMounted(true);
    
    // Load user initials from auth
    const auth = localStorage.getItem("taskguard_auth");
    if (auth) {
      try {
        const { email } = JSON.parse(auth);
        if (email) {
          setUserInitials(email.charAt(0).toUpperCase());
        }
      } catch {
        // Ignore parse errors
      }
    }
  }, []);
  
  // Start a new session
  const startSession = useCallback(() => {
    setIsRunning(true);
    setSessionStartTime(Date.now());
    setShowGoalPrompt(false);
    
    // Simulate some tab switches and off-task time for demo
    const tabInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        setTabSwitches(prev => prev + 1);
      }
    }, 10000);
    
    const offTaskInterval = setInterval(() => {
      if (Math.random() > 0.8) {
        setOffTaskTime(prev => prev + 1);
      }
    }, 60000);
    
    // Store intervals for cleanup
    return () => {
      clearInterval(tabInterval);
      clearInterval(offTaskInterval);
    };
  }, []);
  
  // Toggle session start/stop
  const toggleSession = useCallback(() => {
    if (isRunning) {
      setIsRunning(false);
      // Save session to history
      const sessions = JSON.parse(localStorage.getItem("taskguard_sessions") || "[]");
      sessions.push({
        date: new Date().toISOString(),
        duration: duration * 60 - timeLeft,
        focusScore: Math.max(0, 100 - (tabSwitches * 3) - (offTaskTime * 2)),
        tabSwitches,
        offTaskTime,
        goal: sessionGoal,
        mode: mode,
      });
      localStorage.setItem("taskguard_sessions", JSON.stringify(sessions));
      setIsNewUser(false);
      
      // Reset metrics
      setTabSwitches(0);
      setOffTaskTime(0);
      setTimeLeft(duration * 60);
    } else {
      // Show goal prompt before starting
      setShowGoalPrompt(true);
    }
  }, [isRunning, duration, timeLeft, tabSwitches, offTaskTime, sessionGoal, mode]);
  
  // Handle goal submit
  const handleGoalSubmit = () => {
    startSession();
  };
  
  // Handle onboarding completion
  const handleOnboardingNext = () => {
    if (onboardingStep < onboardingSteps.length - 1) {
      setOnboardingStep(onboardingStep + 1);
    } else {
      localStorage.setItem("taskguard_onboarded", "true");
      setShowOnboarding(false);
      // Show classification wizard after onboarding
      const classified = localStorage.getItem("taskguard_classified");
      if (!classified) {
        setShowClassificationWizard(true);
      }
    }
  };
  
  // Handle site classification
  const toggleSiteClassification = (domain: string) => {
    setSiteClassifications(prev => ({
      ...prev,
      [domain]: !prev[domain]
    }));
  };
  
  // Complete classification wizard
  const handleClassificationComplete = () => {
    const distractionSites = Object.entries(siteClassifications)
      .filter(([, isDistraction]) => isDistraction)
      .map(([domain]) => ({ domain, isDistraction: true }));
    
    // Save to settings
    const existingSettings = localStorage.getItem("taskguard_settings");
    const settings = existingSettings ? JSON.parse(existingSettings) : {};
    settings.monitoredSites = distractionSites;
    localStorage.setItem("taskguard_settings", JSON.stringify(settings));
    localStorage.setItem("taskguard_classified", "true");
    setShowClassificationWizard(false);
  };

  // Format time as HH:MM:SS or MM:SS depending on duration
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate progress percentage
  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100;

  // Calculate elapsed time
  const elapsedMinutes = Math.floor((duration * 60 - timeLeft) / 60);

  return (
    <div
      className="min-h-screen flex flex-col px-4 sm:px-6 lg:px-12 py-4 sm:py-6 relative"
      style={{ backgroundColor: "#070707" }}
    >
      {/* Onboarding Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          <div 
            className="relative z-10 w-full max-w-lg p-8 rounded-xl"
            style={{ 
              backgroundColor: "rgba(15, 15, 15, 0.98)",
              border: "1px solid rgba(245, 240, 232, 0.1)"
            }}
          >
            {/* Progress dots */}
            <div className="flex gap-2 mb-6">
              {onboardingSteps.map((_, i) => (
                <div
                  key={i}
                  className="h-1 flex-1 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: i <= onboardingStep ? "#f5f0e8" : "rgba(245, 240, 232, 0.15)"
                  }}
                />
              ))}
            </div>
            
            <div className="mb-8">
              <h2 className="text-[24px] font-light mb-3" style={{ color: "#f5f0e8" }}>
                {onboardingSteps[onboardingStep].title}
              </h2>
              <p className="text-[14px] leading-relaxed" style={{ color: "rgba(245, 240, 232, 0.6)" }}>
                {onboardingSteps[onboardingStep].description}
              </p>
            </div>
            
            {/* Visual hint based on step */}
            <div 
              className="mb-8 p-4 rounded-lg"
              style={{ backgroundColor: "rgba(245, 240, 232, 0.03)", border: "1px dashed rgba(245, 240, 232, 0.1)" }}
            >
              {onboardingStep === 0 && (
                <div className="flex items-center justify-center gap-3">
                  <span className="text-[36px] font-light" style={{ color: "#f5f0e8" }}>25:00</span>
                  <span className="text-[12px] font-mono" style={{ color: "rgba(245, 240, 232, 0.4)" }}>space to start</span>
                </div>
              )}
              {onboardingStep === 1 && (
                <div className="flex items-center justify-center gap-6">
                  <div className="text-center">
                    <span className="block text-[28px] font-light" style={{ color: "#f5f0e8" }}>3</span>
                    <span className="text-[10px] font-mono" style={{ color: "rgba(245, 240, 232, 0.4)" }}>tab switches</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-[28px] font-light" style={{ color: "rgba(252, 165, 165, 0.8)" }}>4m</span>
                    <span className="text-[10px] font-mono" style={{ color: "rgba(245, 240, 232, 0.4)" }}>off-task</span>
                  </div>
                </div>
              )}
              {onboardingStep === 2 && (
                <div className="flex items-center justify-center gap-4">
                  {MODES.map((m) => (
                    <div
                      key={m.id}
                      className="px-3 py-2 rounded-lg text-center"
                      style={{ backgroundColor: m.bgColor }}
                    >
                      <span className="text-[13px] font-medium" style={{ color: m.colorFull }}>
                        {m.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              {onboardingStep > 0 && (
                <button
                  onClick={() => setOnboardingStep(onboardingStep - 1)}
                  className="px-6 py-3 rounded-lg text-[13px] font-medium transition-all duration-200"
                  style={{ color: "rgba(245, 240, 232, 0.5)", border: "1px solid rgba(245, 240, 232, 0.1)" }}
                >
                  Back
                </button>
              )}
              <button
                onClick={handleOnboardingNext}
                className="flex-1 px-6 py-3 rounded-lg text-[13px] font-medium transition-all duration-200"
                style={{ backgroundColor: "#f5f0e8", color: "#0a0a0a" }}
              >
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
          <div 
            className="relative z-10 w-full max-w-lg p-8 rounded-xl"
            style={{ 
              backgroundColor: "rgba(15, 15, 15, 0.98)",
              border: "1px solid rgba(245, 240, 232, 0.1)"
            }}
          >
            <h2 className="text-[24px] font-light mb-2" style={{ color: "#f5f0e8" }}>
              Personalize Your Focus
            </h2>
            <p className="text-[14px] mb-6" style={{ color: "rgba(245, 240, 232, 0.5)" }}>
              Which of these sites distract you? Tap to mark as a distraction.
            </p>
            
            <div className="grid grid-cols-2 gap-2 mb-6">
              {commonSites.map((site) => (
                <button
                  key={site.domain}
                  onClick={() => toggleSiteClassification(site.domain)}
                  className="flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-left"
                  style={{
                    backgroundColor: siteClassifications[site.domain] 
                      ? "rgba(252, 165, 165, 0.12)" 
                      : "rgba(245, 240, 232, 0.03)",
                    border: `1px solid ${siteClassifications[site.domain] 
                      ? "rgba(252, 165, 165, 0.3)" 
                      : "rgba(245, 240, 232, 0.08)"}`,
                  }}
                >
                  <div 
                    className="w-8 h-8 rounded-md flex items-center justify-center text-[12px] font-mono"
                    style={{ 
                      backgroundColor: siteClassifications[site.domain]
                        ? "rgba(252, 165, 165, 0.2)"
                        : "rgba(245, 240, 232, 0.08)",
                      color: siteClassifications[site.domain]
                        ? "rgba(252, 165, 165, 0.9)"
                        : "rgba(245, 240, 232, 0.5)"
                    }}
                  >
                    {site.icon}
                  </div>
                  <span 
                    className="text-[13px] font-mono"
                    style={{ 
                      color: siteClassifications[site.domain]
                        ? "rgba(252, 165, 165, 0.9)"
                        : "rgba(245, 240, 232, 0.6)"
                    }}
                  >
                    {site.domain}
                  </span>
                  {siteClassifications[site.domain] && (
                    <svg className="w-4 h-4 ml-auto" viewBox="0 0 24 24" fill="none" stroke="rgba(252, 165, 165, 0.8)" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            
            <p className="text-[11px] mb-4" style={{ color: "rgba(245, 240, 232, 0.35)" }}>
              You can always add more sites in Settings later.
            </p>
            
            <button
              onClick={handleClassificationComplete}
              className="w-full px-6 py-3 rounded-lg text-[13px] font-medium transition-all duration-200"
              style={{ backgroundColor: "#f5f0e8", color: "#0a0a0a" }}
            >
              Continue ({Object.values(siteClassifications).filter(Boolean).length} selected)
            </button>
          </div>
        </div>
      )}
      
      {/* Goal Setting Modal */}
      {showGoalPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowGoalPrompt(false)}
          />
          <div 
            className="relative z-10 w-full max-w-md p-8 rounded-xl"
            style={{ 
              backgroundColor: "rgba(15, 15, 15, 0.95)",
              border: "1px solid rgba(245, 240, 232, 0.1)"
            }}
          >
            <h2 
              className="text-[20px] font-light mb-2"
              style={{ color: "#f5f0e8" }}
            >
              What are you working on?
            </h2>
            <p 
              className="text-[13px] mb-6"
              style={{ color: "rgba(245, 240, 232, 0.4)" }}
            >
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
              style={{
                backgroundColor: "rgba(245, 240, 232, 0.05)",
                border: "1px solid rgba(245, 240, 232, 0.15)",
                color: "#f5f0e8",
              }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowGoalPrompt(false)}
                className="flex-1 px-4 py-3 rounded-lg text-[13px] font-medium transition-all duration-200"
                style={{
                  backgroundColor: "transparent",
                  color: "rgba(245, 240, 232, 0.5)",
                  border: "1px solid rgba(245, 240, 232, 0.1)"
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleGoalSubmit}
                className="flex-1 px-4 py-3 rounded-lg text-[13px] font-medium transition-all duration-200"
                style={{
                  backgroundColor: currentMode.colorFull,
                  color: "#070707",
                }}
              >
                Start Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div
        className={`transition-all duration-700 ease-out ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
        }`}
      >
        <AppHeader currentPage="session" userInitials={userInitials} />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-8">
        <div
          className={`w-full max-w-6xl transition-all duration-700 ease-out ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ transitionDelay: "150ms" }}
        >
          {/* Three Column Layout - stack on mobile, three columns on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_240px] gap-6 sm:gap-8 lg:gap-10 items-start lg:items-center">
            {/* Left Column - Session Controls */}
            <div className="flex flex-col gap-8">
              {/* Quick Duration Presets */}
              <div className="flex flex-col gap-3">
                <span
                  className="text-[11px] font-mono uppercase tracking-[0.25em]"
                  style={{ color: "rgba(245, 240, 232, 0.4)" }}
                >
                  Quick Set
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {PRESET_DURATIONS.map((d) => (
                    <button
                      key={d}
                      onClick={() => {
                        if (!isRunning) {
                          setDuration(d);
                          setTimeLeft(d * 60);
                        }
                      }}
                      className={`px-3 py-1.5 text-[13px] font-mono rounded-md transition-all duration-200 ${
                        isRunning ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                      }`}
                      style={{
                        color: duration === d ? "#f5f0e8" : "rgba(245, 240, 232, 0.4)",
                        backgroundColor: duration === d ? "rgba(245, 240, 232, 0.12)" : "transparent",
                        border: duration === d ? "1px solid rgba(245, 240, 232, 0.2)" : "1px solid transparent",
                      }}
                      disabled={isRunning}
                    >
                      {d}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode Selection - Enhanced with color indicators */}
              <div className="flex flex-col gap-3">
                <span
                  className="text-[11px] font-mono uppercase tracking-[0.25em]"
                  style={{ color: "rgba(245, 240, 232, 0.4)" }}
                >
                  Mode
                </span>
                <div className="flex flex-col gap-2">
                  {MODES.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => !isRunning && setMode(m.id)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-md transition-all duration-300 ${
                        isRunning
                          ? "cursor-not-allowed opacity-50"
                          : "cursor-pointer"
                      }`}
                      style={{
                        backgroundColor:
                          mode === m.id
                            ? m.bgColor
                            : "transparent",
                        border:
                          mode === m.id
                            ? `1px solid ${m.color}`
                            : "1px solid transparent",
                      }}
                      disabled={isRunning}
                    >
                      <div className="flex items-center gap-2.5">
                        {/* Mode color indicator */}
                        <span 
                          className="w-2 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            backgroundColor: mode === m.id ? m.colorFull : "rgba(245, 240, 232, 0.2)",
                          }}
                        />
                        <span
                          className="text-[13px] font-mono"
                          style={{
                            color:
                              mode === m.id
                                ? m.colorFull
                                : "rgba(245, 240, 232, 0.4)",
                          }}
                        >
                          {m.label}
                        </span>
                      </div>
                      <span
                        className="text-[10px] font-mono"
                        style={{ color: "rgba(245, 240, 232, 0.25)" }}
                      >
                        {m.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Blocked Sites Preview */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span
                    className="text-[10px] font-mono uppercase tracking-[0.2em]"
                    style={{ color: "rgba(245, 240, 232, 0.3)" }}
                  >
                    Monitored sites
                  </span>
                  <Link
                    href="/settings"
                    className="text-[10px] font-mono transition-opacity duration-200 hover:opacity-100"
                    style={{ color: "rgba(245, 240, 232, 0.35)" }}
                  >
                    Edit
                  </Link>
                </div>
                {monitoredSites.length > 0 ? (
                  <div
                    className="flex flex-wrap gap-1.5"
                    style={{ color: "rgba(245, 240, 232, 0.25)" }}
                  >
                    {monitoredSites.slice(0, 3).map((site) => (
                      <span
                        key={site}
                        className="text-[10px] font-mono px-2 py-1 rounded"
                        style={{
                          backgroundColor: "rgba(245, 240, 232, 0.04)",
                        }}
                      >
                        {site}
                      </span>
                    ))}
                    {monitoredSites.length > 3 && (
                      <span
                        className="text-[10px] font-mono px-2 py-1 rounded"
                        style={{
                          backgroundColor: "rgba(245, 240, 232, 0.04)",
                        }}
                      >
                        +{monitoredSites.length - 3}
                      </span>
                    )}
                  </div>
                ) : (
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 text-[11px] font-mono px-3 py-2 rounded-lg transition-all duration-200"
                    style={{ 
                      backgroundColor: "rgba(245, 240, 232, 0.03)",
                      color: "rgba(245, 240, 232, 0.4)",
                      border: "1px dashed rgba(245, 240, 232, 0.1)"
                    }}
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add sites to monitor
                  </Link>
                )}
              </div>
            </div>

            {/* Center Column - Timer */}
            <div className="flex flex-col items-center gap-6">
              {/* Session Goal Display (when running) */}
              {isRunning && sessionGoal && (
                <div 
                  className="text-center px-4 py-2 rounded-lg"
                  style={{ 
                    backgroundColor: "rgba(245, 240, 232, 0.03)",
                    border: "1px solid rgba(245, 240, 232, 0.06)"
                  }}
                >
                  <span 
                    className="text-[12px] font-mono"
                    style={{ color: "rgba(245, 240, 232, 0.5)" }}
                  >
                    Working on: <span style={{ color: "rgba(245, 240, 232, 0.8)" }}>{sessionGoal}</span>
                  </span>
                </div>
              )}

              {/* Progress Ring - Now with mode-based colors */}
              <div className="relative">
                <svg
                  className="w-48 h-48 sm:w-64 sm:h-64 lg:w-72 lg:h-72 -rotate-90"
                  viewBox="0 0 200 200"
                >
                  {/* Background circle */}
                  <circle
                    cx="100"
                    cy="100"
                    r="90"
                    fill="none"
                    stroke="rgba(245, 240, 232, 0.06)"
                    strokeWidth="2"
                  />
                  {/* Progress circle - color based on mode */}
                  <circle
                    cx="100"
                    cy="100"
                    r="90"
                    fill="none"
                    stroke={currentMode.color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 90}
                    strokeDashoffset={2 * Math.PI * 90 * (1 - progress / 100)}
                    className="transition-all duration-1000 ease-linear"
                    style={{
                      filter: isRunning ? `drop-shadow(0 0 8px ${currentMode.color})` : 'none'
                    }}
                  />
                </svg>

                {/* Timer Display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {isEditingTime ? (
                    // Editable time inputs
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex items-center gap-1">
                        {/* Hours */}
                        <input
                          ref={hoursInputRef}
                          type="text"
                          inputMode="numeric"
                          value={editHours}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                            setEditHours(val);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleTimeEditSubmit();
                            if (e.key === "Escape") handleTimeEditCancel();
                            if (e.key === "ArrowRight" || (e.key === "Tab" && !e.shiftKey)) {
                              e.preventDefault();
                              minutesInputRef.current?.focus();
                              minutesInputRef.current?.select();
                            }
                          }}
                          className="w-16 sm:w-20 text-[40px] sm:text-[56px] lg:text-[64px] font-light text-center bg-transparent outline-none"
                          style={{ color: "#f5f0e8" }}
                          maxLength={2}
                        />
                        <span className="text-[40px] sm:text-[56px] lg:text-[64px] font-light" style={{ color: "rgba(245, 240, 232, 0.3)" }}>:</span>
                        {/* Minutes */}
                        <input
                          ref={minutesInputRef}
                          type="text"
                          inputMode="numeric"
                          value={editMinutes}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                            setEditMinutes(val);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleTimeEditSubmit();
                            if (e.key === "Escape") handleTimeEditCancel();
                            if (e.key === "ArrowRight" || (e.key === "Tab" && !e.shiftKey)) {
                              e.preventDefault();
                              secondsInputRef.current?.focus();
                              secondsInputRef.current?.select();
                            }
                            if (e.key === "ArrowLeft" || (e.key === "Tab" && e.shiftKey)) {
                              e.preventDefault();
                              hoursInputRef.current?.focus();
                              hoursInputRef.current?.select();
                            }
                          }}
                          className="w-16 sm:w-20 text-[40px] sm:text-[56px] lg:text-[64px] font-light text-center bg-transparent outline-none"
                          style={{ color: "#f5f0e8" }}
                          maxLength={2}
                        />
                        <span className="text-[40px] sm:text-[56px] lg:text-[64px] font-light" style={{ color: "rgba(245, 240, 232, 0.3)" }}>:</span>
                        {/* Seconds */}
                        <input
                          ref={secondsInputRef}
                          type="text"
                          inputMode="numeric"
                          value={editSeconds}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                            setEditSeconds(val);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleTimeEditSubmit();
                            if (e.key === "Escape") handleTimeEditCancel();
                            if (e.key === "ArrowLeft" || (e.key === "Tab" && e.shiftKey)) {
                              e.preventDefault();
                              minutesInputRef.current?.focus();
                              minutesInputRef.current?.select();
                            }
                          }}
                          className="w-16 sm:w-20 text-[40px] sm:text-[56px] lg:text-[64px] font-light text-center bg-transparent outline-none"
                          style={{ color: "#f5f0e8" }}
                          maxLength={2}
                        />
                      </div>
                      {/* Labels */}
                      <div className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider" style={{ color: "rgba(245, 240, 232, 0.3)" }}>
                        <span className="w-16 sm:w-20 text-center">hrs</span>
                        <span className="w-4"></span>
                        <span className="w-16 sm:w-20 text-center">min</span>
                        <span className="w-4"></span>
                        <span className="w-16 sm:w-20 text-center">sec</span>
                      </div>
                      {/* Action buttons */}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={handleTimeEditCancel}
                          className="px-4 py-1.5 text-[12px] font-mono rounded-md transition-all duration-200"
                          style={{ color: "rgba(245, 240, 232, 0.5)" }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleTimeEditSubmit}
                          className="px-4 py-1.5 text-[12px] font-mono rounded-md transition-all duration-200"
                          style={{ backgroundColor: "rgba(245, 240, 232, 0.1)", color: "#f5f0e8" }}
                        >
                          Set Time
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Normal timer display
                    <button
                      onClick={isRunning ? toggleSession : handleStartTimeEdit}
                      className="group cursor-pointer flex flex-col items-center"
                    >
                      <span
                        className="text-[48px] sm:text-[64px] lg:text-[80px] font-light tracking-tight leading-none transition-all duration-300 group-hover:opacity-80"
                        style={{ 
                          color: isRunning ? currentMode.colorFull : "#f5f0e8",
                        }}
                      >
                        {formatTime(timeLeft)}
                      </span>
                      {isRunning ? (
                        <span
                          className="text-[11px] font-mono mt-2 uppercase tracking-widest"
                          style={{ color: currentMode.color }}
                        >
                          {mode} mode
                        </span>
                      ) : (
                        <span
                          className="text-[10px] font-mono mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ color: "rgba(245, 240, 232, 0.4)" }}
                        >
                          click to edit
                        </span>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Action Hint */}
              <div className="flex flex-col items-center gap-4">
                <span
                  className="text-[12px] font-mono tracking-wider"
                  style={{ color: "rgba(245, 240, 232, 0.3)" }}
                >
                  {isRunning ? "press space to pause" : isEditingTime ? "enter to confirm" : "click timer to edit"}
                </span>

                {/* Start/Stop Button - color based on mode */}
                <button
                  onClick={toggleSession}
                  className="px-8 py-3 rounded-lg text-[14px] font-medium transition-all duration-300"
                  style={{
                    backgroundColor: isRunning
                      ? "transparent"
                      : currentMode.colorFull,
                    color: isRunning ? currentMode.colorFull : "#070707",
                    border: isRunning
                      ? `1px solid ${currentMode.color}`
                      : "none",
                    boxShadow: !isRunning ? `0 0 20px ${currentMode.color}` : 'none'
                  }}
                >
                  {isRunning ? "End Session" : "Start Session"}
                </button>
              </div>
            </div>

            {/* Right Column - Live Stats & Last Session */}
            <div className="flex flex-col gap-8">
              {/* Current Session Stats (only show when running) */}
              {isRunning && (
                <div
                  className="flex flex-col gap-4 p-4 rounded-lg transition-all duration-300"
                  style={{
                    backgroundColor: currentMode.bgColor,
                    border: `1px solid ${currentMode.color}`,
                  }}
                >
                  <span
                    className="text-[10px] font-mono uppercase tracking-[0.2em]"
                    style={{ color: currentMode.color }}
                  >
                    Current Session
                  </span>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <span
                        className="text-[28px] font-light"
                        style={{ color: "#f5f0e8" }}
                      >
                        {tabSwitches}
                      </span>
                      <span
                        className="text-[10px] font-mono"
                        style={{ color: "rgba(245, 240, 232, 0.35)" }}
                      >
                        tab switches
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span
                        className="text-[28px] font-light"
                        style={{ color: "#f5f0e8" }}
                      >
                        {offTaskTime}m
                      </span>
                      <span
                        className="text-[10px] font-mono"
                        style={{ color: "rgba(245, 240, 232, 0.35)" }}
                      >
                        off-task
                      </span>
                    </div>
                  </div>

                  {/* Off-task reminder with goal context */}
                  {offTaskTime > 0 && sessionGoal && (
                    <div 
                      className="text-[11px] font-mono p-2 rounded"
                      style={{ 
                        backgroundColor: "rgba(0,0,0,0.2)",
                        color: "rgba(245, 240, 232, 0.6)"
                      }}
                    >
                      {offTaskTime}m off-task — still working on {sessionGoal}?
                    </div>
                  )}

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[10px] font-mono"
                        style={{ color: "rgba(245, 240, 232, 0.35)" }}
                      >
                        elapsed
                      </span>
                      <span
                        className="text-[10px] font-mono"
                        style={{ color: "rgba(245, 240, 232, 0.5)" }}
                      >
                        {elapsedMinutes}m / {duration}m
                      </span>
                    </div>
                    <div
                      className="h-1 rounded-full overflow-hidden"
                      style={{ backgroundColor: "rgba(245, 240, 232, 0.1)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${progress}%`,
                          backgroundColor: currentMode.colorFull,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Last Session Summary */}
              <div className="flex flex-col gap-4">
                <span
                  className="text-[10px] font-mono uppercase tracking-[0.2em]"
                  style={{ color: "rgba(245, 240, 232, 0.35)" }}
                >
                  Last Session
                </span>

                {lastSession ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-end justify-between">
                      <div className="flex flex-col gap-1">
                        <span
                          className="text-[36px] font-light leading-none"
                          style={{ color: "rgba(245, 240, 232, 0.9)" }}
                        >
                          {lastSession.focusScore}%
                        </span>
                        <span
                          className="text-[10px] font-mono"
                          style={{ color: "rgba(245, 240, 232, 0.35)" }}
                        >
                          focus score
                        </span>
                      </div>
                      <div
                        className="flex flex-col gap-1 items-end text-right"
                        style={{ color: "rgba(245, 240, 232, 0.35)" }}
                      >
                        <span className="text-[11px] font-mono">
                          {lastSession.duration}m session
                        </span>
                      </div>
                    </div>

                    <div
                      className="h-px w-full"
                      style={{ backgroundColor: "rgba(245, 240, 232, 0.08)" }}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <span
                          className="text-[20px] font-light"
                          style={{ color: "rgba(245, 240, 232, 0.7)" }}
                        >
                          {lastSession.tabSwitches}
                        </span>
                        <span
                          className="text-[10px] font-mono"
                          style={{ color: "rgba(245, 240, 232, 0.3)" }}
                        >
                          tab switches
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span
                          className="text-[20px] font-light"
                          style={{ color: "rgba(245, 240, 232, 0.7)" }}
                        >
                          {lastSession.offTaskMinutes}m
                        </span>
                        <span
                          className="text-[10px] font-mono"
                          style={{ color: "rgba(245, 240, 232, 0.3)" }}
                        >
                          off-task
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="flex flex-col items-center justify-center gap-3 py-8 px-4 rounded-lg text-center"
                    style={{ 
                      backgroundColor: "rgba(245, 240, 232, 0.02)",
                      border: "1px dashed rgba(245, 240, 232, 0.1)"
                    }}
                  >
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "rgba(245, 240, 232, 0.05)" }}
                    >
                      <svg 
                        className="w-5 h-5" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="rgba(245, 240, 232, 0.3)"
                        strokeWidth="1.5"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>
                    <p 
                      className="text-[12px] font-mono leading-relaxed"
                      style={{ color: "rgba(245, 240, 232, 0.4)" }}
                    >
                      Complete your first session<br />to see stats here
                    </p>
                  </div>
                )}
              </div>

              {/* Quick Tips - Mode specific */}
              <div
                className="flex flex-col gap-2 p-3 rounded-lg"
                style={{
                  backgroundColor: "rgba(245, 240, 232, 0.02)",
                  border: "1px solid rgba(245, 240, 232, 0.05)",
                }}
              >
                <span
                  className="text-[9px] font-mono uppercase tracking-[0.15em]"
                  style={{ color: "rgba(245, 240, 232, 0.3)" }}
                >
                  {mode} mode
                </span>
                <p
                  className="text-[11px] leading-relaxed"
                  style={{ color: "rgba(245, 240, 232, 0.4)" }}
                >
                  {mode === "focus" && "Gentle nudges when you drift to distracting sites. Perfect for light work."}
                  {mode === "strict" && "You'll be prompted before accessing distracting sites, giving you a moment to reconsider."}
                  {mode === "zen" && "Complete silence. No interruptions, no tracking. Just you and your work."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Status Bar */}
      <footer
        className={`flex items-center justify-between py-4 transition-all duration-700 ease-out ${
          mounted ? "opacity-100" : "opacity-0"
        }`}
        style={{ transitionDelay: "300ms" }}
      >
        <div className="flex items-center gap-6">
          <span
            className="text-[11px] font-mono"
            style={{ color: "rgba(245, 240, 232, 0.25)" }}
          >
            TaskGuard v0.1.0
          </span>
          <span
            className="flex items-center gap-2 text-[11px] font-mono"
            style={{ color: "rgba(245, 240, 232, 0.25)" }}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${isRunning ? "animate-pulse-status" : ""}`}
              style={{
                backgroundColor: isRunning
                  ? currentMode.colorFull
                  : "rgba(245, 240, 232, 0.3)",
              }}
            />
            {isRunning ? "session active" : "ready"}
          </span>
        </div>

      </footer>
    </div>
  );
}
