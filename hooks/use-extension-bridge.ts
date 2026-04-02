"use client";

import { useState, useEffect, useCallback } from "react";

interface ExtensionStatus {
  sessionActive: boolean;
  sessionStart:  string | null;
  tabSwitches:   number;
  offTaskTime:   number;
  promptCount:   number;
}

interface UseExtensionBridge {
  extensionReady: boolean;
  sessionActive:  boolean;
  status:         ExtensionStatus | null;
  startSession:   (mode?: string) => void;
  stopSession:    () => void;
}

export function useExtensionBridge(): UseExtensionBridge {
  const [extensionReady, setExtensionReady] = useState(false);
  const [sessionActive,  setSessionActive]  = useState(false);
  const [status,         setStatus]         = useState<ExtensionStatus | null>(null);

  useEffect(() => {
    // Check if extension is already ready (content script may have
    // fired taskguard:ready before this component mounted)
    window.dispatchEvent(new CustomEvent("taskguard:requestStatus"));

    // Extension signals it is installed and running
    const onReady = () => setExtensionReady(true);

    // Extension confirms session started
    const onStarted = () => setSessionActive(true);

    // Extension confirms session stopped
    const onStopped = () => setSessionActive(false);

    // Extension responds to status requests
    const onStatus = (e: Event) => {
      const detail = (e as CustomEvent<ExtensionStatus>).detail;
      if (detail) {
        setExtensionReady(true);
        setSessionActive(detail.sessionActive);
        setStatus(detail);
      }
    };

    window.addEventListener("taskguard:ready",   onReady);
    window.addEventListener("taskguard:started", onStarted);
    window.addEventListener("taskguard:stopped", onStopped);
    window.addEventListener("taskguard:status",  onStatus);

    // Poll status every 2 seconds to keep web app in sync
    const poll = setInterval(() => {
      window.dispatchEvent(new CustomEvent("taskguard:requestStatus"));
    }, 2000);

    return () => {
      window.removeEventListener("taskguard:ready",   onReady);
      window.removeEventListener("taskguard:started", onStarted);
      window.removeEventListener("taskguard:stopped", onStopped);
      window.removeEventListener("taskguard:status",  onStatus);
      clearInterval(poll);
    };
  }, []);

  const startSession = useCallback((mode: string = "strict") => {
    window.dispatchEvent(new CustomEvent("taskguard:start", { detail: { mode } }));
  }, []);

  const stopSession = useCallback(() => {
    window.dispatchEvent(new CustomEvent("taskguard:stop"));
  }, []);

  return { extensionReady, sessionActive, status, startSession, stopSession };
}