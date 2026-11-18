"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { BadgeCheck, CalendarDays, Save, Store, UserRound } from "lucide-react";
import { browserApi } from "@/lib/browser-api";

interface SellerProfile {
  id: string;
  ownerName: string;
  email: string;
  phone: string;
  storeName: string;
  businessAddress: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    pincode: string;
  };
  status: "active" | "suspended";
  memberSince: string;
}

const fieldClass =
  "mt-1.5 w-full rounded-sm border border-black/20 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-gold";

function addressText(profile: SellerProfile) {
  const { line1, line2, city, state, pincode } = profile.businessAddress;
  return [line1, line2, [city, state, pincode].filter(Boolean).join(", ")]
    .filter(Boolean)
    .join("\n");
}

function addressFields(value: string): SellerProfile["businessAddress"] {
  const [line1 = "", line2 = "", location = ""] = value.split("\n");
  const parts = location.split(",").map((part) => part.trim());
  const pincode = /^\d{6}$/.test(parts.at(-1) ?? "") ? parts.pop() ?? "" : "";
  return {
    line1: line1.trim(),
    line2: line2.trim(),
    city: parts[0] ?? "",
    state: parts[1] ?? "",
    pincode,
  };
}

export default function SellerProfilePage() {
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    browserApi<SellerProfile>("/seller/profile")
      .then((response) => {
        if (!active) return;
        setProfile(response);
        setAddress(addressText(response));
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Could not load your profile.");
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
    if (!profile) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const updated = await browserApi<SellerProfile>("/seller/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerName: profile.ownerName,
          email: profile.email,
          phone: profile.phone,
          storeName: profile.storeName,
          businessAddress: addressFields(address),
        }),
      });
      setProfile(updated);
      setAddress(addressText(updated));
      setNotice("Your vendor profile has been updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update your profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="py-20 text-center text-sm text-mist">Loading vendor profile…</div>;
  }

  if (!profile) {
    return (
      <div role="alert" className="border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {error || "Could not load your vendor profile."}
      </div>
    );
  }

  const detailRows = [
    { label: "Vendor ID", value: `VDR${profile.id.slice(-4).toUpperCase()}`, icon: UserRound },
    {
      label: "Member Since",
      value: new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" })
        .format(new Date(profile.memberSince)),
      icon: CalendarDays,
    },
    { label: "Shop Name", value: profile.storeName, icon: Store },
  ];

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-3 text-xs text-mist">
          <Link href="/seller" className="hover:text-black">Overview</Link>
          <span aria-hidden="true">&gt;</span>
          <span className="font-medium text-charcoal">Profile</span>
        </div>
        <h1 className="mt-2 font-display text-4xl text-black">Profile</h1>
        <p className="mt-1 text-sm text-mist">Manage your vendor account details.</p>
      </header>

      {error && <p role="alert" className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="border border-green-200 bg-green-50 p-3 text-sm text-green-800">{notice}</p>}

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.9fr]">
        <form onSubmit={saveProfile} className="rounded-md border border-black/10 bg-white p-5 sm:p-6">
          <h2 className="font-display text-xl">Personal Information</h2>
          <div className="mb-5 mt-3 flex justify-center">
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-[#fbf6ed] text-[#a87936]">
              <Store size={42} strokeWidth={1.6} />
              <span aria-hidden="true" className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-black text-white">
                <span className="text-sm">+</span>
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-medium">
              Vendor Name <span className="text-red-600">*</span>
              <input
                required
                minLength={2}
                maxLength={100}
                value={profile.ownerName}
                onChange={(event) => setProfile({ ...profile, ownerName: event.target.value })}
                className={fieldClass}
              />
            </label>
            <label className="block text-xs font-medium">
              Email <span className="text-red-600">*</span>
              <input
                required
                type="email"
                maxLength={120}
                value={profile.email}
                onChange={(event) => setProfile({ ...profile, email: event.target.value })}
                className={fieldClass}
              />
            </label>
            <label className="block text-xs font-medium">
              Phone Number <span className="text-red-600">*</span>
              <input
                required
                type="tel"
                value={profile.phone}
                onChange={(event) => setProfile({ ...profile, phone: event.target.value })}
                className={fieldClass}
              />
            </label>
            <label className="block text-xs font-medium">
              Shop Name <span className="text-red-600">*</span>
              <input
                required
                minLength={2}
                maxLength={100}
                value={profile.storeName}
                onChange={(event) => setProfile({ ...profile, storeName: event.target.value })}
                className={fieldClass}
              />
            </label>
            <label className="block text-xs font-medium sm:col-span-2">
              Address
              <textarea
                rows={3}
                required
                maxLength={350}
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder={"Address line 1\nAddress line 2\nCity, State, PIN code"}
                className={`${fieldClass} resize-y`}
              />
            </label>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-10 items-center gap-2 bg-black px-5 text-xs text-white transition-colors hover:bg-charcoal disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={15} />
              {saving ? "Updating..." : "Update Profile"}
            </button>
          </div>
        </form>

        <section className="rounded-md border border-black/10 bg-white p-5 sm:p-6">
          <h2 className="font-display text-xl">Account Details</h2>
          <div className="mt-5 space-y-3">
            {detailRows.map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex min-h-[54px] items-center gap-4 rounded-md bg-[#faf8f5] px-4 py-3">
                <Icon size={18} strokeWidth={1.8} className="shrink-0 text-[#a87936]" />
                <span className="text-xs text-charcoal">{label}</span>
                <span className="ml-auto max-w-[58%] truncate text-right text-xs font-medium text-charcoal">{value}</span>
              </div>
            ))}
            <div className="flex min-h-[54px] items-center gap-4 rounded-md bg-[#faf8f5] px-4 py-3">
              <BadgeCheck size={19} strokeWidth={1.8} className="shrink-0 text-[#a87936]" />
              <span className="text-xs text-charcoal">Account Status</span>
              <span
                className={`ml-auto rounded-full px-3 py-1 text-[11px] font-medium ${
                  profile.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"
                }`}
              >
                {profile.status === "active" ? "Active" : "Suspended"}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
