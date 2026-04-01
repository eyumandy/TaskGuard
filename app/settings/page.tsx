"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";

// Default monitored sites
const DEFAULT_SITES = [
  { domain: "twitter.com", isDistraction: true },
  { domain: "reddit.com", isDistraction: true },
  { domain: "youtube.com", isDistraction: true },
  { domain: "facebook.com", isDistraction: true },
  { domain: "instagram.com", isDistraction: true },
  { domain: "tiktok.com", isDistraction: true },
  { domain: "netflix.com", isDistraction: true },
  { domain: "twitch.tv", isDistraction: true },
];

// Preset duration options
const PRESET_DURATIONS = [15, 25, 45, 60, 90];

export default function SettingsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [userInitials, setUserInitials] = useState("U");
  const [userEmail, setUserEmail] = useState("");

  // Settings state
  const [notificationLevel, setNotificationLevel] = useState<"gentle" | "moderate" | "aggressive">("moderate");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [customPresets, setCustomPresets] = useState<number[]>([25, 45]);
  const [newPreset, setNewPreset] = useState("");
  const [monitoredSites, setMonitoredSites] = useState(DEFAULT_SITES);
  const [newSite, setNewSite] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<"notifications" | "sessions" | "sites" | "account">("notifications");

  useEffect(() => {
    const auth = localStorage.getItem("taskguard_auth");
    if (!auth) {
      router.push("/login");
      return;
    }

    try {
      const { email } = JSON.parse(auth);
      if (email) {
        setUserInitials(email.charAt(0).toUpperCase());
        setUserEmail(email);
      }
    } catch {
      // Ignore
    }

    // Load saved settings
    const savedSettings = localStorage.getItem("taskguard_settings");
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        if (settings.notificationLevel) setNotificationLevel(settings.notificationLevel);
        if (settings.soundEnabled !== undefined) setSoundEnabled(settings.soundEnabled);
        if (settings.customPresets) setCustomPresets(settings.customPresets);
        if (settings.monitoredSites) setMonitoredSites(settings.monitoredSites);
      } catch {
        // Ignore
      }
    }

    setMounted(true);
  }, [router]);

  // Save settings whenever they change
  const saveSettings = useCallback(() => {
    const settings = {
      notificationLevel,
      soundEnabled,
      customPresets,
      monitoredSites,
    };
    localStorage.setItem("taskguard_settings", JSON.stringify(settings));
  }, [notificationLevel, soundEnabled, customPresets, monitoredSites]);

  useEffect(() => {
    if (mounted) {
      saveSettings();
    }
  }, [mounted, saveSettings]);

  const addPreset = () => {
    const value = parseInt(newPreset);
    if (value > 0 && value <= 180 && !customPresets.includes(value)) {
      setCustomPresets([...customPresets, value].sort((a, b) => a - b));
      setNewPreset("");
    }
  };

  const removePreset = (preset: number) => {
    setCustomPresets(customPresets.filter((p) => p !== preset));
  };

  const addSite = () => {
    const domain = newSite.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "");
    if (domain && !monitoredSites.find((s) => s.domain === domain)) {
      setMonitoredSites([...monitoredSites, { domain, isDistraction: true }]);
      setNewSite("");
    }
  };

  const removeSite = (domain: string) => {
    setMonitoredSites(monitoredSites.filter((s) => s.domain !== domain));
  };

  const toggleSiteType = (domain: string) => {
    setMonitoredSites(monitoredSites.map((s) => (s.domain === domain ? { ...s, isDistraction: !s.isDistraction } : s)));
  };

  const handleDeleteAccount = () => {
    localStorage.removeItem("taskguard_auth");
    localStorage.removeItem("taskguard_settings");
    localStorage.removeItem("taskguard_sessions");
    localStorage.removeItem("taskguard_onboarded");
    localStorage.removeItem("taskguard_classified");
    router.push("/");
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#070707" }}>
        <div
          className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "rgba(245, 240, 232, 0.2)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-4 sm:px-8 lg:px-12 py-4 sm:py-6" style={{ backgroundColor: "#070707" }}>
      <AppHeader currentPage="settings" userInitials={userInitials} />

      {/* Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-[22px] sm:text-[26px] font-light tracking-tight" style={{ color: "#f5f0e8" }}>
            Settings
          </h1>
          <p className="text-[13px] mt-1" style={{ color: "rgba(245, 240, 232, 0.4)" }}>
            Customize your TaskGuard experience
          </p>
        </div>

        {/* Tab Navigation */}
        <div
          className="inline-flex gap-0.5 p-1 rounded-full mb-8"
          style={{ backgroundColor: "rgba(245, 240, 232, 0.04)" }}
        >
          {(["notifications", "sessions", "sites", "account"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-1.5 text-[12px] font-medium capitalize rounded-full transition-all duration-200"
              style={{
                backgroundColor: activeTab === tab ? "rgba(245, 240, 232, 0.1)" : "transparent",
                color: activeTab === tab ? "#f5f0e8" : "rgba(245, 240, 232, 0.4)",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="space-y-4">
              <div
                className="p-5 rounded-2xl"
                style={{ backgroundColor: "rgba(245, 240, 232, 0.02)", border: "1px solid rgba(245, 240, 232, 0.05)" }}
              >
                <h3 className="text-[14px] font-medium mb-1" style={{ color: "#f5f0e8" }}>
                  Notification Intensity
                </h3>
                <p className="text-[12px] mb-5" style={{ color: "rgba(245, 240, 232, 0.4)" }}>
                  How aggressively should TaskGuard remind you?
                </p>

                <div className="space-y-2">
                  {[
                    { id: "gentle", label: "Gentle", desc: "Subtle visual indicator, no sounds" },
                    { id: "moderate", label: "Moderate", desc: "Noticeable prompt after 30 seconds" },
                    { id: "aggressive", label: "Aggressive", desc: "Immediate full-screen overlay" },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setNotificationLevel(option.id as typeof notificationLevel)}
                      className="w-full flex items-center justify-between p-3.5 rounded-xl transition-all duration-200 text-left"
                      style={{
                        backgroundColor: notificationLevel === option.id ? "rgba(245, 240, 232, 0.06)" : "transparent",
                        border: `1px solid ${notificationLevel === option.id ? "rgba(245, 240, 232, 0.12)" : "rgba(245, 240, 232, 0.04)"}`,
                      }}
                    >
                      <div>
                        <span
                          className="block text-[13px]"
                          style={{ color: notificationLevel === option.id ? "#f5f0e8" : "rgba(245, 240, 232, 0.6)" }}
                        >
                          {option.label}
                        </span>
                        <span className="text-[11px]" style={{ color: "rgba(245, 240, 232, 0.3)" }}>
                          {option.desc}
                        </span>
                      </div>
                      <div
                        className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                        style={{ borderColor: notificationLevel === option.id ? "#f5f0e8" : "rgba(245, 240, 232, 0.15)" }}
                      >
                        {notificationLevel === option.id && (
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#f5f0e8" }} />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div
                className="p-5 rounded-2xl"
                style={{ backgroundColor: "rgba(245, 240, 232, 0.02)", border: "1px solid rgba(245, 240, 232, 0.05)" }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[14px] font-medium" style={{ color: "#f5f0e8" }}>
                      Sound Effects
                    </h3>
                    <p className="text-[12px] mt-0.5" style={{ color: "rgba(245, 240, 232, 0.4)" }}>
                      Audio cues for session start/end
                    </p>
                  </div>
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="w-11 h-6 rounded-full p-0.5 transition-all duration-200"
                    style={{ backgroundColor: soundEnabled ? "rgba(134, 239, 172, 0.25)" : "rgba(245, 240, 232, 0.08)" }}
                  >
                    <div
                      className="w-5 h-5 rounded-full transition-all duration-200"
                      style={{
                        backgroundColor: soundEnabled ? "#86efac" : "rgba(245, 240, 232, 0.35)",
                        transform: soundEnabled ? "translateX(20px)" : "translateX(0)",
                      }}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sessions Tab */}
          {activeTab === "sessions" && (
            <div
              className="p-5 rounded-2xl"
              style={{ backgroundColor: "rgba(245, 240, 232, 0.02)", border: "1px solid rgba(245, 240, 232, 0.05)" }}
            >
              <h3 className="text-[14px] font-medium mb-1" style={{ color: "#f5f0e8" }}>
                Duration Presets
              </h3>
              <p className="text-[12px] mb-5" style={{ color: "rgba(245, 240, 232, 0.4)" }}>
                Save your favorite session lengths
              </p>

              <div className="flex flex-wrap gap-2 mb-5">
                {PRESET_DURATIONS.map((preset) => (
                  <div
                    key={preset}
                    className="px-3 py-1.5 rounded-lg text-[12px] font-mono"
                    style={{ backgroundColor: "rgba(245, 240, 232, 0.04)", color: "rgba(245, 240, 232, 0.45)" }}
                  >
                    {preset}m
                  </div>
                ))}
                {customPresets
                  .filter((p) => !PRESET_DURATIONS.includes(p))
                  .map((preset) => (
                    <div
                      key={preset}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-mono"
                      style={{ backgroundColor: "rgba(245, 240, 232, 0.08)", color: "#f5f0e8" }}
                    >
                      {preset}m
                      <button onClick={() => removePreset(preset)} className="opacity-50 hover:opacity-100 transition-opacity">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="number"
                  value={newPreset}
                  onChange={(e) => setNewPreset(e.target.value)}
                  placeholder="Minutes"
                  min="1"
                  max="180"
                  className="flex-1 px-3 py-2 rounded-lg text-[13px] font-mono outline-none transition-all duration-200"
                  style={{
                    backgroundColor: "rgba(245, 240, 232, 0.03)",
                    border: "1px solid rgba(245, 240, 232, 0.08)",
                    color: "#f5f0e8",
                  }}
                  onKeyDown={(e) => e.key === "Enter" && addPreset()}
                />
                <button
                  onClick={addPreset}
                  className="px-4 py-2 rounded-lg text-[12px] font-medium transition-all duration-200"
                  style={{ backgroundColor: "rgba(245, 240, 232, 0.08)", color: "#f5f0e8" }}
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Sites Tab */}
          {activeTab === "sites" && (
            <div
              className="p-5 rounded-2xl"
              style={{ backgroundColor: "rgba(245, 240, 232, 0.02)", border: "1px solid rgba(245, 240, 232, 0.05)" }}
            >
              <h3 className="text-[14px] font-medium mb-1" style={{ color: "#f5f0e8" }}>
                Monitored Sites
              </h3>
              <p className="text-[12px] mb-5" style={{ color: "rgba(245, 240, 232, 0.4)" }}>
                TaskGuard tracks time spent on these sites
              </p>

              <div className="flex gap-2 mb-5">
                <input
                  type="text"
                  value={newSite}
                  onChange={(e) => setNewSite(e.target.value)}
                  placeholder="e.g., twitter.com"
                  className="flex-1 px-3 py-2 rounded-lg text-[13px] font-mono outline-none transition-all duration-200"
                  style={{
                    backgroundColor: "rgba(245, 240, 232, 0.03)",
                    border: "1px solid rgba(245, 240, 232, 0.08)",
                    color: "#f5f0e8",
                  }}
                  onKeyDown={(e) => e.key === "Enter" && addSite()}
                />
                <button
                  onClick={addSite}
                  className="px-4 py-2 rounded-lg text-[12px] font-medium transition-all duration-200"
                  style={{ backgroundColor: "rgba(245, 240, 232, 0.08)", color: "#f5f0e8" }}
                >
                  Add
                </button>
              </div>

              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {monitoredSites.map((site) => (
                  <div
                    key={site.domain}
                    className="flex items-center justify-between p-2.5 rounded-lg"
                    style={{ backgroundColor: "rgba(245, 240, 232, 0.02)" }}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-[13px] font-mono" style={{ color: "rgba(245, 240, 232, 0.65)" }}>
                        {site.domain}
                      </span>
                      <button
                        onClick={() => toggleSiteType(site.domain)}
                        className="px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wide transition-all duration-200"
                        style={{
                          backgroundColor: site.isDistraction ? "rgba(252, 165, 165, 0.12)" : "rgba(134, 239, 172, 0.12)",
                          color: site.isDistraction ? "rgba(252, 165, 165, 0.8)" : "rgba(134, 239, 172, 0.8)",
                        }}
                      >
                        {site.isDistraction ? "distraction" : "productive"}
                      </button>
                    </div>
                    <button
                      onClick={() => removeSite(site.domain)}
                      className="p-1 rounded transition-all duration-200 hover:bg-white/5"
                      style={{ color: "rgba(245, 240, 232, 0.25)" }}
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Account Tab */}
          {activeTab === "account" && (
            <div className="space-y-4">
              <div
                className="p-5 rounded-2xl"
                style={{ backgroundColor: "rgba(245, 240, 232, 0.02)", border: "1px solid rgba(245, 240, 232, 0.05)" }}
              >
                <h3 className="text-[14px] font-medium mb-4" style={{ color: "#f5f0e8" }}>
                  Account Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <span
                      className="block text-[10px] font-mono uppercase tracking-wider mb-0.5"
                      style={{ color: "rgba(245, 240, 232, 0.35)" }}
                    >
                      Email
                    </span>
                    <span className="text-[14px]" style={{ color: "#f5f0e8" }}>
                      {userEmail}
                    </span>
                  </div>
                </div>
              </div>

              <div
                className="p-5 rounded-2xl"
                style={{ backgroundColor: "rgba(252, 165, 165, 0.03)", border: "1px solid rgba(252, 165, 165, 0.08)" }}
              >
                <h3 className="text-[14px] font-medium mb-1" style={{ color: "rgba(252, 165, 165, 0.9)" }}>
                  Danger Zone
                </h3>
                <p className="text-[12px] mb-4" style={{ color: "rgba(245, 240, 232, 0.4)" }}>
                  Permanently delete your account and all data
                </p>

                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 rounded-lg text-[12px] font-medium transition-all duration-200"
                    style={{ backgroundColor: "rgba(252, 165, 165, 0.1)", color: "rgba(252, 165, 165, 0.8)" }}
                  >
                    Delete Account
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-[12px]" style={{ color: "rgba(245, 240, 232, 0.5)" }}>
                      Are you sure?
                    </span>
                    <button
                      onClick={handleDeleteAccount}
                      className="px-4 py-2 rounded-lg text-[12px] font-medium transition-all duration-200"
                      style={{ backgroundColor: "rgba(252, 165, 165, 0.2)", color: "rgba(252, 165, 165, 0.9)" }}
                    >
                      Yes, delete
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 rounded-lg text-[12px] font-medium transition-all duration-200"
                      style={{ backgroundColor: "rgba(245, 240, 232, 0.05)", color: "rgba(245, 240, 232, 0.5)" }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
