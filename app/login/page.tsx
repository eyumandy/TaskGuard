"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Simulate login - in real app would call auth API
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // For demo purposes, accept any credentials
    if (email && password) {
      localStorage.setItem("taskguard_auth", JSON.stringify({ email }));
      router.push("/session");
    } else {
      setError("Please enter your email and password");
    }
    
    setIsLoading(false);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
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

      {/* Login Card */}
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
          Welcome back
        </h1>
        <p
          className="text-[13px] text-center mb-8"
          style={{ color: "rgba(245, 240, 232, 0.4)" }}
        >
          Sign in to continue your focus journey
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
              placeholder="Enter your password"
              className="w-full px-4 py-3 rounded-lg text-[14px] outline-none transition-all duration-200"
              style={{
                backgroundColor: "rgba(245, 240, 232, 0.04)",
                border: "1px solid rgba(245, 240, 232, 0.1)",
                color: "#f5f0e8",
              }}
              required
            />
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
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>

      {/* Sign Up Link */}
      <p
        className="mt-6 text-[13px]"
        style={{ color: "rgba(245, 240, 232, 0.4)" }}
      >
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="underline underline-offset-2 transition-colors duration-200"
          style={{ color: "rgba(245, 240, 232, 0.7)" }}
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
