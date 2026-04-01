"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [dataConsent, setDataConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!dataConsent) {
      setError("You must agree to data collection to continue");
      return;
    }

    setIsLoading(true);

    // Simulate signup - in real app would call auth API
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // For demo purposes, accept any valid form
    localStorage.setItem("taskguard_auth", JSON.stringify({ email, dataConsent }));
    router.push("/session");

    setIsLoading(false);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ backgroundColor: "#070707" }}
    >
      {/* Logo */}
      <Link href="/" className="mb-12">
        <Image
          src="/images/logo.png"
          alt="TaskGuard"
          width={180}
          height={54}
          className="h-14 w-auto"
          style={{
            filter: "brightness(0) invert(1)",
            opacity: 0.9,
          }}
        />
      </Link>

      {/* Signup Card */}
      <div
        className="w-full max-w-sm p-8 rounded-xl"
        style={{
          backgroundColor: "rgba(15, 15, 15, 0.8)",
          border: "1px solid rgba(245, 240, 232, 0.08)",
        }}
      >
        <h1
          className="text-[24px] font-light mb-2 text-center"
          style={{ color: "#f5f0e8" }}
        >
          Create account
        </h1>
        <p
          className="text-[13px] text-center mb-8"
          style={{ color: "rgba(245, 240, 232, 0.4)" }}
        >
          Start building better focus habits today
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div
              className="text-[12px] text-center py-2 px-3 rounded-lg"
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                color: "#ef4444",
                border: "1px solid rgba(239, 68, 68, 0.2)",
              }}
            >
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label
              className="text-[11px] font-mono uppercase tracking-[0.2em]"
              style={{ color: "rgba(245, 240, 232, 0.4)" }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-lg text-[14px] outline-none transition-all duration-200"
              style={{
                backgroundColor: "rgba(245, 240, 232, 0.04)",
                border: "1px solid rgba(245, 240, 232, 0.1)",
                color: "#f5f0e8",
              }}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              className="text-[11px] font-mono uppercase tracking-[0.2em]"
              style={{ color: "rgba(245, 240, 232, 0.4)" }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="w-full px-4 py-3 rounded-lg text-[14px] outline-none transition-all duration-200"
              style={{
                backgroundColor: "rgba(245, 240, 232, 0.04)",
                border: "1px solid rgba(245, 240, 232, 0.1)",
                color: "#f5f0e8",
              }}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              className="text-[11px] font-mono uppercase tracking-[0.2em]"
              style={{ color: "rgba(245, 240, 232, 0.4)" }}
            >
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              className="w-full px-4 py-3 rounded-lg text-[14px] outline-none transition-all duration-200"
              style={{
                backgroundColor: "rgba(245, 240, 232, 0.04)",
                border: "1px solid rgba(245, 240, 232, 0.1)",
                color: "#f5f0e8",
              }}
              required
            />
          </div>

          {/* Data Consent Checkbox */}
          <div className="flex items-start gap-3 mt-2">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                id="dataConsent"
                checked={dataConsent}
                onChange={(e) => setDataConsent(e.target.checked)}
                className="sr-only"
              />
              <button
                type="button"
                onClick={() => setDataConsent(!dataConsent)}
                className="w-5 h-5 rounded flex items-center justify-center transition-all duration-200"
                style={{
                  backgroundColor: dataConsent
                    ? "#f5f0e8"
                    : "rgba(245, 240, 232, 0.04)",
                  border: dataConsent
                    ? "1px solid #f5f0e8"
                    : "1px solid rgba(245, 240, 232, 0.2)",
                }}
              >
                {dataConsent && (
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="#070707"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
            </div>
            <label
              htmlFor="dataConsent"
              className="text-[12px] leading-relaxed cursor-pointer"
              style={{ color: "rgba(245, 240, 232, 0.5)" }}
            >
              I agree to usage data being collected for research purposes. This
              helps us improve TaskGuard and understand focus patterns.
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 py-3.5 rounded-lg text-[14px] font-medium transition-all duration-200 disabled:opacity-50"
            style={{
              backgroundColor: "#f5f0e8",
              color: "#070707",
            }}
          >
            {isLoading ? "Creating account..." : "Create Account"}
          </button>
        </form>
      </div>

      {/* Sign In Link */}
      <p
        className="mt-6 text-[13px]"
        style={{ color: "rgba(245, 240, 232, 0.4)" }}
      >
        Already have an account?{" "}
        <Link
          href="/login"
          className="underline underline-offset-2 transition-colors duration-200"
          style={{ color: "rgba(245, 240, 232, 0.7)" }}
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
