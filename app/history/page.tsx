"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";

interface Session {
  date: string;
  duration: number;
  onTaskRate: number;
  tabSwitches: number;
  offTaskTime: number;
  goal: string;
  mode: string;
}

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function HistoryPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [userInitials, setUserInitials] = useState("U");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [hoveredDay, setHoveredDay] = useState<{ date: string; sessions: number; avgFocus: number; x: number; y: number } | null>(null);

  // Load real sessions from localStorage
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
      }
    } catch {
      // Ignore
    }

    // Load real sessions
    const storedSessions = localStorage.getItem("taskguard_sessions");
    if (storedSessions) {
      try {
        setSessions(JSON.parse(storedSessions));
      } catch {
        // Ignore parse errors
      }
    }

    setMounted(true);
  }, [router]);

  // Generate heatmap data from real sessions
  const heatmapData = useMemo(() => {
    const data: { date: string; sessions: number; avgFocus: number }[] = [];
    const today = new Date();
    
    // Create a map of date -> sessions for quick lookup
    const sessionsByDate = new Map<string, Session[]>();
    sessions.forEach((session) => {
      const dateStr = new Date(session.date).toISOString().split("T")[0];
      if (!sessionsByDate.has(dateStr)) {
        sessionsByDate.set(dateStr, []);
      }
      sessionsByDate.get(dateStr)!.push(session);
    });

    // Generate last 84 days (12 weeks)
    for (let i = 83; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const daySessions = sessionsByDate.get(dateStr) || [];
      const sessionCount = daySessions.length;
      const avgFocus = sessionCount > 0 
        ? Math.round(daySessions.reduce((acc, s) => acc + s.onTaskRate, 0) / sessionCount)
        : 0;

      data.push({ date: dateStr, sessions: sessionCount, avgFocus });
    }

    return data;
  }, [sessions]);

  // Organize heatmap data into weeks (columns)
  const weeks = useMemo(() => {
    const result: typeof heatmapData[] = [];
    let currentWeek: typeof heatmapData = [];

    heatmapData.forEach((day, index) => {
      const date = new Date(day.date);
      const dayOfWeek = date.getDay();

      if (index === 0) {
        for (let i = 0; i < dayOfWeek; i++) {
          currentWeek.push({ date: "", sessions: 0, avgFocus: 0 });
        }
      }

      currentWeek.push(day);

      if (dayOfWeek === 6 || index === heatmapData.length - 1) {
        result.push(currentWeek);
        currentWeek = [];
      }
    });

    return result;
  }, [heatmapData]);

  // Calculate streaks
  const streaks = useMemo(() => {
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    // Check from today backwards for current streak
    const today = new Date();
    for (let i = 0; i < heatmapData.length; i++) {
      const dayData = heatmapData[heatmapData.length - 1 - i];
      if (dayData.sessions > 0) {
        if (i === 0 || currentStreak > 0) {
          currentStreak++;
        }
      } else if (i === 0) {
        // Check if yesterday had sessions (allow one day gap)
        continue;
      } else {
        break;
      }
    }
    
    // Calculate longest streak
    heatmapData.forEach((day) => {
      if (day.sessions > 0) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    });
    
    return { current: currentStreak, longest: longestStreak };
  }, [heatmapData]);

  // Calculate stats from real data
  const stats = useMemo(() => {
    const totalSessions = sessions.length;
    const avgFocus = totalSessions > 0
      ? Math.round(sessions.reduce((acc, s) => acc + s.onTaskRate, 0) / totalSessions)
      : 0;
    
    // Calculate time this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekSessions = sessions.filter(s => new Date(s.date) >= weekAgo);
    const weekMinutes = weekSessions.reduce((acc, s) => acc + Math.floor(s.duration / 60), 0);
    const weekHours = Math.floor(weekMinutes / 60);
    const weekMins = weekMinutes % 60;
    
    return {
      totalSessions,
      avgFocus,
      weekTime: weekHours > 0 ? `${weekHours}h ${weekMins}m` : `${weekMins}m`,
    };
  }, [sessions]);

  const getHeatColor = (sessionCount: number, avgFocus: number) => {
    if (sessionCount === 0) return "rgba(245, 240, 232, 0.04)";
    if (avgFocus >= 85) return "rgba(134, 239, 172, 0.85)";
    if (avgFocus >= 70) return "rgba(134, 239, 172, 0.55)";
    if (avgFocus >= 50) return "rgba(134, 239, 172, 0.35)";
    return "rgba(245, 240, 232, 0.2)";
  };

  // Format session date for display
  const formatSessionDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatSessionTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
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
      <AppHeader currentPage="history" userInitials={userInitials} />

      <main className="flex-1">
        <div className="max-w-5xl mx-auto">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-[24px] sm:text-[28px] font-light tracking-tight" style={{ color: "#f5f0e8" }}>
              Session History
            </h1>
            <p className="text-[13px] mt-1" style={{ color: "rgba(245, 240, 232, 0.4)" }}>
              {sessions.length > 0 ? "Track your focus patterns over time" : "Complete sessions to see your progress"}
            </p>
          </div>

          {sessions.length === 0 ? (
            /* Empty State */
            <div 
              className="flex flex-col items-center justify-center py-20 px-8 rounded-2xl text-center"
              style={{ 
                backgroundColor: "rgba(245, 240, 232, 0.02)", 
                border: "1px dashed rgba(245, 240, 232, 0.1)" 
              }}
            >
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
                style={{ backgroundColor: "rgba(245, 240, 232, 0.05)" }}
              >
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="rgba(245, 240, 232, 0.3)" strokeWidth="1.5">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <h2 className="text-[18px] font-light mb-2" style={{ color: "#f5f0e8" }}>
                No sessions yet
              </h2>
              <p className="text-[14px] max-w-sm mb-6" style={{ color: "rgba(245, 240, 232, 0.4)" }}>
                Start your first focus session to begin tracking your productivity and building better habits.
              </p>
              <Link
                href="/session"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-[14px] font-medium transition-all duration-200"
                style={{ backgroundColor: "#f5f0e8", color: "#0a0a0a" }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Start First Session
              </Link>
            </div>
          ) : (
            <>
              {/* Heatmap & Streaks Row */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_200px] gap-4 mb-6">
                {/* Contribution Heatmap - Large */}
                <div
                  className="p-6 sm:p-8 rounded-2xl relative"
                  style={{ backgroundColor: "rgba(245, 240, 232, 0.02)", border: "1px solid rgba(245, 240, 232, 0.05)" }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[12px] font-mono uppercase tracking-widest" style={{ color: "rgba(245, 240, 232, 0.4)" }}>
                      12 Week Activity
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono" style={{ color: "rgba(245, 240, 232, 0.3)" }}>Less</span>
                      <div className="flex gap-1">
                        {[0.04, 0.2, 0.35, 0.55, 0.85].map((opacity, i) => (
                          <div
                            key={i}
                            className="w-3 h-3 rounded-[4px]"
                            style={{ backgroundColor: i === 0 ? `rgba(245, 240, 232, ${opacity})` : `rgba(134, 239, 172, ${opacity})` }}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-mono" style={{ color: "rgba(245, 240, 232, 0.3)" }}>More</span>
                    </div>
                  </div>

                  {/* Month labels */}
                  <div className="flex gap-1 mb-2 ml-6">
                    {weeks.map((week, i) => {
                      const firstDay = week.find(d => d.date);
                      if (!firstDay || i % 4 !== 0) return <div key={i} className="w-[14px]" />;
                      const month = MONTHS[new Date(firstDay.date).getMonth()];
                      return (
                        <span key={i} className="text-[9px] font-mono w-[56px]" style={{ color: "rgba(245, 240, 232, 0.3)" }}>
                          {month}
                        </span>
                      );
                    })}
                  </div>

                  <div className="overflow-x-auto pb-2">
                    <div className="flex gap-1 min-w-[600px]">
                      {/* Day labels */}
                      <div className="flex flex-col gap-1 pr-2 pt-0">
                        {DAYS.map((day, i) => (
                          <div
                            key={`${day}-${i}`}
                            className="h-[14px] w-4 text-[9px] font-mono flex items-center justify-end"
                            style={{ color: "rgba(245, 240, 232, 0.25)" }}
                          >
                            {i % 2 === 1 ? day : ""}
                          </div>
                        ))}
                      </div>

                      {/* Heatmap Grid - Larger cells */}
                      <div className="flex gap-1 flex-1">
                        {weeks.map((week, weekIndex) => (
                          <div key={weekIndex} className="flex flex-col gap-1">
                            {week.map((day, dayIndex) => (
                              <div
                                key={`${weekIndex}-${dayIndex}`}
                                className="w-[14px] h-[14px] rounded-[4px] transition-all duration-150 cursor-pointer hover:scale-125 hover:z-10"
                                style={{
                                  backgroundColor: day.date ? getHeatColor(day.sessions, day.avgFocus) : "transparent",
                                }}
                                onMouseEnter={(e) => {
                                  if (day.date) {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setHoveredDay({ ...day, x: rect.left, y: rect.bottom });
                                  }
                                }}
                                onMouseLeave={() => setHoveredDay(null)}
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Tooltip */}
                  {hoveredDay && (
                    <div
                      className="fixed px-3 py-2 rounded-lg text-[11px] font-mono z-50 pointer-events-none"
                      style={{
                        left: hoveredDay.x,
                        top: hoveredDay.y + 8,
                        backgroundColor: "rgba(10, 10, 10, 0.95)",
                        border: "1px solid rgba(245, 240, 232, 0.1)",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                      }}
                    >
                      <span style={{ color: "#f5f0e8" }}>
                        {new Date(hoveredDay.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </span>
                      <br />
                      <span style={{ color: hoveredDay.sessions > 0 ? "rgba(134, 239, 172, 0.9)" : "rgba(245, 240, 232, 0.4)" }}>
                        {hoveredDay.sessions > 0 ? `${hoveredDay.sessions} session${hoveredDay.sessions > 1 ? "s" : ""} · ${hoveredDay.avgFocus}% focus` : "No sessions"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Streaks Panel */}
                <div className="flex flex-col gap-3">
                  <div
                    className="flex-1 p-5 rounded-2xl flex flex-col justify-center"
                    style={{ backgroundColor: "rgba(245, 240, 232, 0.02)", border: "1px solid rgba(245, 240, 232, 0.05)" }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="rgba(217, 158, 68, 0.8)" strokeWidth="2">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                      </svg>
                      <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "rgba(245, 240, 232, 0.4)" }}>
                        Current Streak
                      </span>
                    </div>
                    <span className="text-[36px] font-light leading-none" style={{ color: streaks.current > 0 ? "rgba(217, 158, 68, 0.9)" : "rgba(245, 240, 232, 0.3)" }}>
                      {streaks.current}
                    </span>
                    <span className="text-[11px] font-mono mt-1" style={{ color: "rgba(245, 240, 232, 0.35)" }}>
                      {streaks.current === 1 ? "day" : "days"}
                    </span>
                  </div>
                  
                  <div
                    className="flex-1 p-5 rounded-2xl flex flex-col justify-center"
                    style={{ backgroundColor: "rgba(245, 240, 232, 0.02)", border: "1px solid rgba(245, 240, 232, 0.05)" }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="rgba(134, 239, 172, 0.7)" strokeWidth="2">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "rgba(245, 240, 232, 0.4)" }}>
                        Longest Streak
                      </span>
                    </div>
                    <span className="text-[36px] font-light leading-none" style={{ color: streaks.longest > 0 ? "rgba(134, 239, 172, 0.8)" : "rgba(245, 240, 232, 0.3)" }}>
                      {streaks.longest}
                    </span>
                    <span className="text-[11px] font-mono mt-1" style={{ color: "rgba(245, 240, 232, 0.35)" }}>
                      {streaks.longest === 1 ? "day" : "days"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Summary */}
              <div className="grid grid-cols-3 gap-3 mb-8">
                <div
                  className="p-4 rounded-xl text-center"
                  style={{ backgroundColor: "rgba(245, 240, 232, 0.02)", border: "1px solid rgba(245, 240, 232, 0.05)" }}
                >
                  <span className="block text-[28px] sm:text-[32px] font-light" style={{ color: "#f5f0e8" }}>
                    {stats.totalSessions}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "rgba(245, 240, 232, 0.35)" }}>
                    Sessions
                  </span>
                </div>
                <div
                  className="p-4 rounded-xl text-center"
                  style={{ backgroundColor: "rgba(245, 240, 232, 0.02)", border: "1px solid rgba(245, 240, 232, 0.05)" }}
                >
                  <span className="block text-[28px] sm:text-[32px] font-light" style={{ color: stats.avgFocus >= 70 ? "rgba(134, 239, 172, 0.9)" : "#f5f0e8" }}>
                    {stats.avgFocus}%
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "rgba(245, 240, 232, 0.35)" }}>
                    Avg On-Task Rate
                  </span>
                </div>
                <div
                  className="p-4 rounded-xl text-center"
                  style={{ backgroundColor: "rgba(245, 240, 232, 0.02)", border: "1px solid rgba(245, 240, 232, 0.05)" }}
                >
                  <span className="block text-[28px] sm:text-[32px] font-light" style={{ color: "#f5f0e8" }}>
                    {stats.weekTime}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "rgba(245, 240, 232, 0.35)" }}>
                    This Week
                  </span>
                </div>
              </div>

              {/* Session List */}
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-widest" style={{ color: "rgba(245, 240, 232, 0.4)" }}>
                  Recent Sessions
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {sessions.slice().reverse().slice(0, 10).map((session, i) => (
                  <div
                    key={i}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl gap-3 sm:gap-6 transition-all duration-150 hover:bg-white/[0.02]"
                    style={{ backgroundColor: "rgba(245, 240, 232, 0.015)", border: "1px solid rgba(245, 240, 232, 0.04)" }}
                  >
                    <div className="flex-1">
                      <span className="block text-[14px] font-medium" style={{ color: "rgba(245, 240, 232, 0.85)" }}>
                        {session.goal || "Focus session"}
                      </span>
                      <span className="text-[11px] font-mono" style={{ color: "rgba(245, 240, 232, 0.3)" }}>
                        {formatSessionDate(session.date)} at {formatSessionTime(session.date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-6 sm:gap-8">
                      <div className="text-right">
                        <span className="block text-[14px] font-mono tabular-nums" style={{ color: "rgba(245, 240, 232, 0.6)" }}>
                          {Math.floor(session.duration / 60)}m
                        </span>
                      </div>
                      <div className="text-right w-12">
                        <span
                          className="block text-[14px] font-mono tabular-nums"
                          style={{
                            color: session.onTaskRate >= 85 ? "rgba(134, 239, 172, 0.9)" : session.onTaskRate >= 70 ? "rgba(245, 240, 232, 0.7)" : "rgba(252, 165, 165, 0.8)",
                          }}
                        >
                          {session.onTaskRate}%
                        </span>
                      </div>
                      <div className="text-right w-8">
                        <span className="block text-[14px] font-mono tabular-nums" style={{ color: "rgba(245, 240, 232, 0.4)" }}>
                          {session.tabSwitches}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}