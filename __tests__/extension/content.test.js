import { describe, it, expect } from "vitest";
import { formatTime } from "./helpers.js";

// ─────────────────────────────────────────────────────────────
// formatTime
// ─────────────────────────────────────────────────────────────

describe("formatTime", () => {
  it("formats seconds under a minute", () => {
    expect(formatTime(0)).toBe("0s");
    expect(formatTime(1)).toBe("1s");
    expect(formatTime(45)).toBe("45s");
    expect(formatTime(59)).toBe("59s");
  });

  it("formats exact minutes", () => {
    expect(formatTime(60)).toBe("1m");
    expect(formatTime(120)).toBe("2m");
    expect(formatTime(300)).toBe("5m");
  });

  it("formats minutes and seconds", () => {
    expect(formatTime(90)).toBe("1m 30s");
    expect(formatTime(270)).toBe("4m 30s");
    expect(formatTime(61)).toBe("1m 1s");
  });

  it("formats hours and minutes", () => {
    expect(formatTime(3600)).toBe("1h 0m");
    expect(formatTime(3720)).toBe("1h 2m");
    expect(formatTime(7200)).toBe("2h 0m");
    expect(formatTime(5400)).toBe("1h 30m");
  });

  it("drops seconds when in hour range", () => {
    // formatTime(3661) = 1h 1m (ignores the extra second)
    expect(formatTime(3661)).toBe("1h 1m");
  });
});
