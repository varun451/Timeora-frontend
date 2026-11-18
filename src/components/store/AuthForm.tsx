"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { browserApi } from "@/lib/browser-api";

export default function AuthForm({ mode, next = "/account" }: { mode: "login" | "register"; next?: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isRegister = mode === "register";
  const destination = next.startsWith("/") && !next.startsWith("//") ? next : "/account";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await browserApi(`/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isRegister ? { name, email, password, phone: phone || undefined } : { email, password }),
      });

      router.replace(isRegister ? destination : "/account");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  const field = "mt-1 w-full border border-black/20 bg-white px-3 py-3 text-sm outline-none transition-colors focus:border-gold";
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-4xl">{isRegister ? "Create your account" : "Welcome back"}</h1>
      <p className="mt-2 text-sm text-mist">{isRegister ? "Save your favourites and keep track of orders." : "Sign in to view your account and orders."}</p>
      <form onSubmit={submit} className="mt-8 space-y-5">
        {isRegister && (
          <>
            <label className="block text-sm font-medium">
              Full name
              <input required minLength={2} maxLength={80} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className={field} />
            </label>
            <label className="block text-sm font-medium">
              Phone number (optional)
              <input type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+91 98765 43210" className={field} />
            </label>
          </>
        )}
        <label className="block text-sm font-medium">
          Email address
          <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className={field} />
        </label>
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium" htmlFor="auth-password">Password</label>
            {!isRegister && (
              <Link href="/forgot-password" className="text-xs text-mist hover:text-black underline">
                Forgot password?
              </Link>
            )}
          </div>
          <input id="auth-password" required type="password" minLength={isRegister ? 8 : 1} maxLength={100} autoComplete={isRegister ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} className={field} />
        </div>
        {error && <p role="alert" className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button disabled={busy} className="w-full bg-black px-4 py-3 text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50">{busy ? "Please wait…" : isRegister ? "Create account" : "Sign in"}</button>
      </form>
      <p className="mt-6 text-sm text-mist">
        {isRegister ? "Already have an account? " : "New to Timeora? "}
        <Link className="text-black underline" href={isRegister ? `/login?next=${encodeURIComponent(destination)}` : `/register?next=${encodeURIComponent(destination)}`}>
          {isRegister ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}
