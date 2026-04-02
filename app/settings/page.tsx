/**
 * File: app/settings/page.tsx
 * Purpose: Settings page for managing monitored distraction domains.
 *          Allows users to add, remove, and classify sites as distracting
 *          or productive. Settings are persisted to localStorage.
 * Author: TaskGuard Team — UF HCI Course Project 2026
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";

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

export default function SettingsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [userInitials, setUserInitials] = useState("U");
  const [monitoredSites, setMonitoredSites] = useState(DEFAULT_SITES);
  const [newSite, setNewSite] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem("taskguard_auth");
    if (!auth) {
      router.push("/login");
      return;
    }
    try {
      const { email } = JSON.parse(auth);
      if (email) setUserInitials(email.charAt(0).toUpperCase());
    } catch {}

    const savedSettings = localStorage.getItem("taskguard_settings");
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        if (settings.monitoredSites) setMonitoredSites(settings.monitoredSites);
      } catch {}
    }
    setMounted(true);
  }, [router]);

  const saveSettings = useCallback(() => {
    localStorage.setItem("taskguard_settings", JSON.stringify({ monitoredSites }));
  }, [monitoredSites]);

  useEffect(() => {
    if (mounted) saveSettings();
  }, [mounted, saveSettings]);

  const addSite = () => {
    const raw = newSite.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0];
    if (!raw || monitoredSites.some((s) => s.domain === raw)) return;
    setMonitoredSites([...monitoredSites, { domain: raw, isDistraction: true }]);
    setNewSite("");
  };

  const removeSite = (domain: string) => {
    setMonitoredSites(monitoredSites.filter((s) => s.domain !== domain));
  };

  const toggleSiteType = (domain: string) => {
    setMonitoredSites(
      monitoredSites.map((s) =>
        s.domain === domain ? { ...s, isDistraction: !s.isDistraction } : s
      )
    );
  };

  const clearAllData = () => {
    localStorage.clear();
    router.push("/login");
  };

  return (
    <div
      className="min-h-screen flex flex-col px-4 sm:px-6 lg:px-12 py-4 sm:py-6"
      style={{ backgroundColor: "#070707" }}
    >
      <div className={`transition-all duration-700 ease-out ${mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
        <AppHeader currentPage="settings" userInitials={userInitials} />
      </div>

      <main
        className={`flex-1 max-w-2xl mx-auto w-full py-8 transition-all duration-700 ease-out ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        style={{ transitionDelay: "150ms" }}
      >
        <div className="mb-10">
          <h1 className="text-[28px] font-light mb-2" style={{ color: "#f5f0e8" }}>
            Settings
          </h1>
          <p className="text-[13px]" style={{ color: "rgba(245, 240, 232, 0.4)" }}>
            Customize which sites TaskGuard monitors during your sessions.
          </p>
        </div>

        {/* Monitored Sites */}
        <div
          className="p-6 rounded-2xl mb-6"
          style={{ backgroundColor: "rgba(245, 240, 232, 0.02)", border: "1px solid rgba(245, 240, 232, 0.06)" }}
        >
          <h2 className="text-[15px] font-medium mb-1" style={{ color: "#f5f0e8" }}>
            Monitored Sites
          </h2>
          <p className="text-[12px] mb-6" style={{ color: "rgba(245, 240, 232, 0.4)" }}>
            TaskGuard tracks time spent on these domains during active sessions. Toggle a site between{" "}
            <span style={{ color: "rgba(252, 165, 165, 0.8)" }}>distraction</span> and{" "}
            <span style={{ color: "rgba(134, 239, 172, 0.8)" }}>productive</span> to reflect how you use it.
          </p>

          <div className="flex gap-2 mb-5">
            <input
              type="text"
              value={newSite}
              onChange={(e) => setNewSite(e.target.value)}
              placeholder="e.g., twitter.com"
              className="flex-1 px-3 py-2.5 rounded-lg text-[13px] font-mono outline-none"
              style={{
                backgroundColor: "rgba(245, 240, 232, 0.03)",
                border: "1px solid rgba(245, 240, 232, 0.08)",
                color: "#f5f0e8",
              }}
              onKeyDown={(e) => e.key === "Enter" && addSite()}
            />
            <button
              onClick={addSite}
              className="px-5 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200"
              style={{ backgroundColor: "rgba(245, 240, 232, 0.08)", color: "#f5f0e8" }}
            >
              Add
            </button>
          </div>

          <div className="space-y-1.5 max-h-80 overflow-y-auto">
            {monitoredSites.map((site) => (
              <div
                key={site.domain}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg"
                style={{ backgroundColor: "rgba(245, 240, 232, 0.02)" }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[13px] font-mono" style={{ color: "rgba(245, 240, 232, 0.7)" }}>
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
            {monitoredSites.length === 0 && (
              <p className="text-center text-[12px] font-mono py-6" style={{ color: "rgba(245, 240, 232, 0.25)" }}>
                No sites added yet. Type a domain above and press Enter.
              </p>
            )}
          </div>
        </div>

        {/* Reset Data */}
        <div
          className="p-6 rounded-2xl"
          style={{ backgroundColor: "rgba(245, 240, 232, 0.02)", border: "1px solid rgba(245, 240, 232, 0.06)" }}
        >
          <h2 className="text-[15px] font-medium mb-1" style={{ color: "#f5f0e8" }}>
            Reset Data
          </h2>
          <p className="text-[12px] mb-5" style={{ color: "rgba(245, 240, 232, 0.4)" }}>
            Clears all session history and settings. Useful for resetting between evaluation sessions.
          </p>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-5 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200"
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.08)",
                color: "rgba(252, 165, 165, 0.8)",
                border: "1px solid rgba(239, 68, 68, 0.15)",
              }}
            >
              Clear All Data
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-mono" style={{ color: "rgba(245, 240, 232, 0.5)" }}>
                Are you sure?
              </span>
              <button
                onClick={clearAllData}
                className="px-4 py-2 rounded-lg text-[12px] font-medium"
                style={{ backgroundColor: "rgba(239, 68, 68, 0.15)", color: "rgba(252, 165, 165, 0.9)" }}
              >
                Yes, clear everything
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-lg text-[12px] font-medium"
                style={{ color: "rgba(245, 240, 232, 0.4)", border: "1px solid rgba(245, 240, 232, 0.08)" }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}