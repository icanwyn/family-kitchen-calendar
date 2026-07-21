"use client";

import { signIn } from "next-auth/react";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function getCallbackUrl(): string {
  if (typeof window === "undefined") return "/";
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("callbackUrl");
    if (!raw) return "/";
    // Only allow same-origin relative paths (prevent open redirect)
    if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
    const url = new URL(raw, window.location.origin);
    if (url.origin === window.location.origin) {
      return `${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    /* ignore */
  }
  return "/";
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState("/");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCallbackUrl(getCallbackUrl());
    setReady(true);
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        username: username.trim(),
        password,
        redirect: false,
        callbackUrl,
      });

      if (!res) {
        setError("Could not reach the sign-in service. Check your connection.");
        setLoading(false);
        return;
      }

      if (res.error) {
        setError("Invalid username or password.");
        setLoading(false);
        return;
      }

      // Full navigation is more reliable on iPad Safari than client router alone
      const target = callbackUrl || "/";
      if (typeof window !== "undefined") {
        window.location.assign(target);
        return;
      }
      router.push(target);
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] min-h-screen items-center justify-center px-4 py-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-sky-200/50 blur-3xl" />
        <div className="absolute -right-16 bottom-20 h-80 w-80 rounded-full bg-violet-200/40 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md rounded-3xl border border-slate-300 bg-white p-6 shadow-2xl shadow-slate-900/15 sm:p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-700 to-indigo-800 text-2xl shadow-lg shadow-sky-800/30">
            🗓️
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Family Kitchen Calendar
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-700">
            Sign in to view your private family hub
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4" method="post">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-800">
              Username
            </span>
            <input
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-medium text-slate-900 outline-none transition focus:border-sky-600 focus:ring-4 focus:ring-sky-100"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              name="username"
              inputMode="text"
              required
              // Avoid autoFocus on iOS — can break first paint / keyboard
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-800">
              Password
            </span>
            <input
              type="password"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-medium text-slate-900 outline-none transition focus:border-sky-600 focus:ring-4 focus:ring-sky-100"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              name="password"
              required
            />
          </label>

          {error && (
            <p
              role="alert"
              className="rounded-xl bg-rose-100 px-3 py-2 text-sm font-bold text-rose-800"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !ready}
            className="w-full rounded-xl bg-sky-700 py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-700/25 transition hover:bg-sky-800 disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs font-medium text-slate-600">
          Private family calendar — access requires a login.
        </p>
        <noscript>
          <p className="mt-4 text-center text-sm font-semibold text-rose-700">
            JavaScript is required for this app. Enable JavaScript in Safari
            Settings and reload.
          </p>
        </noscript>
      </div>
    </div>
  );
}
