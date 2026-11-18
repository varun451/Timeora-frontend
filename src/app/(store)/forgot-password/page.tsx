"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { browserApi } from "@/lib/browser-api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await browserApi<{ message: string }>("/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not process request.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-4xl">Reset password</h1>
      <p className="mt-2 text-sm text-mist">
        Enter the email address associated with your account and we will generate a secure reset link.
      </p>

      {submitted ? (
        <div className="mt-8 border border-black/10 bg-stone p-6">
          <h2 className="font-display text-xl">Check your inbox</h2>
          <p className="mt-2 text-sm text-mist leading-relaxed">
            If an account exists for <strong className="text-black">{email}</strong>, password reset instructions have been dispatched. The reset link is valid for 30 minutes.
          </p>
          <div className="mt-6 flex gap-4">
            <Link href="/login" className="bg-black px-5 py-2.5 text-sm text-white inline-block">
              Return to sign in
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-5">
          <label className="block text-sm font-medium">
            Email address
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1 w-full border border-black/20 bg-white px-3 py-3 text-sm outline-none transition-colors focus:border-gold"
            />
          </label>
          {error && <p role="alert" className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-black px-4 py-3 text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Sending instructions…" : "Send reset instructions"}
          </button>
          <p className="text-center text-sm text-mist">
            Remember your password?{" "}
            <Link href="/login" className="text-black underline">
              Sign in
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}

