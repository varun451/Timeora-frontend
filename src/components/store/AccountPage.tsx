"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { browserApi, BrowserApiError } from "@/lib/browser-api";
import type { User } from "@/types/user";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  // Change password state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);

  useEffect(() => {
    let active = true;
    browserApi<User>("/auth/me")
      .then((current) => {
        if (!active) return;
        setUser(current);
        setName(current.name);
        setPhone(current.phone ?? "");
      })
      .catch((error: unknown) => {
        if (!active) return;
        setMessage(
          error instanceof BrowserApiError && error.status === 401
            ? "Sign in to access your account."
            : error instanceof Error
              ? error.message
              : "Could not load your account.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setBusy(true);
    try {
      const updated = await browserApi<User>("/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      setUser(updated);
      setName(updated.name);
      setPhone(updated.phone ?? "");
      setMessage("Your profile has been updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update your profile.");
    } finally {
      setBusy(false);
    }
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setPasswordMessage("");
    setPasswordError("");
    setPasswordBusy(true);
    try {
      await browserApi<{ message: string }>("/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setPasswordMessage("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setShowPasswordChange(false);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Could not change password.");
    } finally {
      setPasswordBusy(false);
    }
  }

  async function logout() {
    try {
      await browserApi("/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not sign out.");
    }
  }

  if (loading) return <div className="mx-auto max-w-7xl px-4 py-20 text-sm text-mist">Loading your account…</div>;

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl">Your Timeora account</h1>
        <p className="mt-3 text-sm text-mist">{message}</p>
        <Link href="/login?next=%2Faccount" className="mt-6 inline-block bg-black px-6 py-3 text-sm text-white">
          Sign in
        </Link>
        <p className="mt-4 text-sm">
          <Link href="/register?next=%2Faccount" className="underline">
            Create an account
          </Link>
        </p>
      </div>
    );
  }

  const isSuperAdmin = user.role === "super_admin" || user.role === "admin";
  const isSeller = user.role === "seller";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">My account</h1>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm text-mist">{user.email}</span>
            <span className="bg-stone px-2 py-0.5 text-xs uppercase tracking-wider text-charcoal border border-black/10">
              {isSuperAdmin ? "Super Admin" : isSeller ? "Seller" : "Customer"}
            </span>
          </div>
        </div>

        {/* Shortcut banners for privileged roles */}
        <div className="flex gap-3">
          {isSeller && (
            <Link href="/seller" className="bg-gold px-4 py-2 text-xs uppercase tracking-wider text-black font-medium">
              Seller Dashboard &rarr;
            </Link>
          )}
        </div>
      </div>

      <div className="mt-10 grid gap-10 md:grid-cols-[1fr_220px]">
        <div className="space-y-8">
          <form onSubmit={saveProfile} className="space-y-5 border border-black/10 p-6 bg-white">
            <h2 className="font-display text-xl">Personal details</h2>
            <label className="block text-sm font-medium">
              Full name
              <input
                required
                minLength={2}
                maxLength={80}
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1 w-full border border-black/20 px-3 py-2.5 text-sm outline-none focus:border-gold"
              />
            </label>
            <label className="block text-sm font-medium">
              Email address
              <input
                value={user.email}
                readOnly
                className="mt-1 w-full border border-black/10 bg-stone px-3 py-2.5 text-sm text-mist cursor-not-allowed"
              />
            </label>
            <label className="block text-sm font-medium">
              Phone number
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+91 98765 43210"
                className="mt-1 w-full border border-black/20 px-3 py-2.5 text-sm outline-none focus:border-gold"
              />
            </label>
            {message && <p role="status" className="text-sm text-mist">{message}</p>}
            <button
              disabled={busy}
              className="bg-black px-6 py-2.5 text-sm text-white disabled:opacity-50 transition-opacity hover:opacity-90"
            >
              {busy ? "Saving…" : "Save changes"}
            </button>
          </form>

          {/* Change password section */}
          <div className="border border-black/10 p-6 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl">Security & Password</h2>
                <p className="text-xs text-mist mt-1">Update your password to keep your account safe.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                className="text-xs underline underline-offset-4"
              >
                {showPasswordChange ? "Cancel" : "Change password"}
              </button>
            </div>

            {passwordMessage && <p className="mt-3 text-sm text-green-700">{passwordMessage}</p>}

            {showPasswordChange && (
              <form onSubmit={handleChangePassword} className="mt-5 space-y-4 border-t border-black/10 pt-4">
                <label className="block text-sm font-medium">
                  Current password
                  <input
                    required
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="mt-1 w-full border border-black/20 px-3 py-2 text-sm outline-none focus:border-gold"
                  />
                </label>
                <label className="block text-sm font-medium">
                  New password (8+ characters)
                  <input
                    required
                    type="password"
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1 w-full border border-black/20 px-3 py-2 text-sm outline-none focus:border-gold"
                  />
                </label>
                {passwordError && <p className="text-xs text-red-700">{passwordError}</p>}
                <button
                  type="submit"
                  disabled={passwordBusy}
                  className="bg-black px-5 py-2 text-xs uppercase tracking-wider text-white disabled:opacity-50"
                >
                  {passwordBusy ? "Updating…" : "Update password"}
                </button>
              </form>
            )}
          </div>
        </div>

        <nav aria-label="Account navigation" className="space-y-4 border-t border-black/10 pt-5 text-sm md:border-l md:border-t-0 md:pl-6 md:pt-0">
          <Link href="/account/orders" className="block py-1 hover:text-gold transition-colors">
            My orders
          </Link>
          <Link href="/account/wishlist" className="block py-1 hover:text-gold transition-colors">
            My wishlist
          </Link>
          {!isSeller && !isSuperAdmin && (
            <Link
              href="/account/become-seller"
              className="block py-1 text-gold font-medium hover:underline"
            >
              Become a Seller &rarr;
            </Link>
          )}
          <button onClick={logout} className="block py-1 text-mist hover:text-red-700 transition-colors">
            Sign out
          </button>
        </nav>
      </div>
    </div>
  );
}
