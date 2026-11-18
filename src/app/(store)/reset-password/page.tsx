"use client";

import Link from "next/link";
import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { browserApi } from "@/lib/browser-api";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Reset token is missing from the URL. Please check the link from your email.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      await browserApi<{ message: string }>("/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset password.");
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="font-display text-4xl">Invalid link</h1>
        <p className="mt-3 text-sm text-mist">
          This password reset link is invalid or incomplete. Please request a new link from the forgot password page.
        </p>
        <Link href="/forgot-password" className="mt-6 inline-block bg-black px-5 py-2.5 text-sm text-white">
          Request reset link
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-4xl">Set new password</h1>
      <p className="mt-2 text-sm text-mist">Choose a strong password with at least 8 characters.</p>

      {success ? (
        <div className="mt-8 border border-black/10 bg-stone p-6">
          <h2 className="font-display text-xl">Password updated</h2>
          <p className="mt-2 text-sm text-mist">
            Your password has been changed successfully. All previous active sessions have been signed out.
          </p>
          <div className="mt-6">
            <Link href="/login" className="bg-black px-5 py-2.5 text-sm text-white inline-block">
              Sign in with new password
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-5">
          <label className="block text-sm font-medium">
            New password
            <input
              required
              type="password"
              minLength={8}
              maxLength={100}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full border border-black/20 bg-white px-3 py-3 text-sm outline-none transition-colors focus:border-gold"
            />
          </label>
          <label className="block text-sm font-medium">
            Confirm new password
            <input
              required
              type="password"
              minLength={8}
              maxLength={100}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 w-full border border-black/20 bg-white px-3 py-3 text-sm outline-none transition-colors focus:border-gold"
            />
          </label>
          {error && <p role="alert" className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-black px-4 py-3 text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Updating password…" : "Reset password"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 py-16 text-sm text-mist">Loading…</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

