"use client";

import { useState, type FormEvent } from "react";
import { browserApi } from "@/lib/browser-api";

export default function ContactForm() {
  const [values, setValues] = useState({ name: "", email: "", orderId: "", message: "" });
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setError("");
    setBusy(true);
    try {
      await browserApi("/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      setNotice("Your message has been recorded. Keep your order number handy if you need to follow up.");
      setValues({ name: "", email: "", orderId: "", message: "" });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not send your message.");
    } finally {
      setBusy(false);
    }
  }

  const field = "mt-1 w-full border border-black/20 px-3 py-3 text-sm";
  return <form onSubmit={submit} className="mt-8 space-y-5">
    <div className="grid gap-5 sm:grid-cols-2">
      <label className="block text-sm">Name<input required minLength={2} maxLength={80} autoComplete="name" value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} className={field} /></label>
      <label className="block text-sm">Email<input required type="email" maxLength={120} autoComplete="email" value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} className={field} /></label>
    </div>
    <label className="block text-sm">Order number <span className="text-mist">(optional)</span><input maxLength={40} value={values.orderId} onChange={(event) => setValues({ ...values, orderId: event.target.value })} className={field} /></label>
    <label className="block text-sm">How can we help?<textarea required minLength={20} maxLength={3000} rows={6} value={values.message} onChange={(event) => setValues({ ...values, message: event.target.value })} className={field} /></label>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {notice && <p role="status" className="text-sm text-green-800">{notice}</p>}
    <button disabled={busy} className="bg-black px-6 py-3 text-sm text-white disabled:opacity-50">{busy ? "Sending…" : "Send message"}</button>
  </form>;
}
