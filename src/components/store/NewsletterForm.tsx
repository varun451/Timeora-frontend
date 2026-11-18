"use client";

import { useState, type FormEvent } from "react";
import { browserApi } from "@/lib/browser-api";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setBusy(true);
    try {
      await browserApi("/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setMessage("Your email has been added to the release list.");
      setEmail("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not subscribe. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return <>
    <form onSubmit={subscribe} className="mt-6 flex flex-col gap-3 sm:flex-row">
      <label htmlFor="nl-email" className="sr-only">Email address</label>
      <input id="nl-email" type="email" required maxLength={120} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="flex-1 border border-black/20 px-4 py-3 text-sm" />
      <button disabled={busy} className="bg-black px-6 py-3 text-sm text-white disabled:opacity-50">{busy ? "Joining…" : "Subscribe"}</button>
    </form>
    <p aria-live="polite" className="mt-3 min-h-4 text-xs text-mist">{message || "Join the list for updates about new releases."}</p>
  </>;
}
