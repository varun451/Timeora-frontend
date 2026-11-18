"use client";

import { useEffect, useState, useCallback } from "react";
import AdminNav from "@/components/admin/AdminNav";
import { browserApi, BrowserApiError } from "@/lib/browser-api";
import type { Seller, SellerStatus } from "@/types/seller";
import type { User } from "@/types/user";

type SellerListResponse = {
  items: Seller[];
  total: number;
  page: number;
  pages: number;
};

export default function AdminSellersPage() {
  const [accessForbidden, setAccessForbidden] = useState(false);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [statusFilter, setStatusFilter] = useState<"" | SellerStatus>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Commission Modal
  const [commissionSeller, setCommissionSeller] = useState<Seller | null>(null);
  const [commissionRatePercent, setCommissionRatePercent] = useState<number>(10);

  // Suspension Modal
  const [suspendingSeller, setSuspendingSeller] = useState<Seller | null>(null);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [actionBusy, setActionBusy] = useState(false);

  const loadSellers = useCallback(async (status: string) => {
    setLoading(true);
    setError("");
    try {
      const query = status ? `?status=${status}` : "";
      const res = await browserApi<SellerListResponse>(`/admin/sellers${query}`);
      setSellers(res.items);
    } catch (err) {
      if (err instanceof BrowserApiError && (err.status === 401 || err.status === 403)) {
        setAccessForbidden(true);
      } else {
        setError(err instanceof Error ? err.message : "Failed to load sellers");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    browserApi<User>("/auth/me")
      .then((account) => {
        if (!active) return;
        if (account.role !== "super_admin" && account.role !== "admin") {
          setAccessForbidden(true);
          return;
        }
        void loadSellers(statusFilter);
      })
      .catch(() => {
        if (active) setAccessForbidden(true);
      });
    return () => {
      active = false;
    };
  }, [loadSellers, statusFilter]);

  async function handleActivate(sellerId: string) {
    if (!confirm("Reactivate this seller? Their products will immediately reappear in the shop catalogue.")) {
      return;
    }
    setActionBusy(true);
    setNotice("");
    setError("");
    try {
      await browserApi(`/admin/sellers/${sellerId}/activate`, { method: "POST" });
      setNotice("Seller reactivated successfully and catalogue products restored.");
      void loadSellers(statusFilter);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to activate seller");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleSuspend(e: React.FormEvent) {
    e.preventDefault();
    if (!suspendingSeller || suspensionReason.trim().length < 5) {
      setError("Please provide a suspension reason of at least 5 characters.");
      return;
    }

    setActionBusy(true);
    setNotice("");
    setError("");
    try {
      await browserApi(`/admin/sellers/${suspendingSeller.id}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: suspensionReason }),
      });
      setNotice(`Seller '${suspendingSeller.storeName}' suspended and products hidden.`);
      setSuspendingSeller(null);
      setSuspensionReason("");
      void loadSellers(statusFilter);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to suspend seller");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleSaveCommission(e: React.FormEvent) {
    e.preventDefault();
    if (!commissionSeller) return;

    setActionBusy(true);
    setNotice("");
    setError("");
    try {
      const commissionBps = Math.round(commissionRatePercent * 100);
      await browserApi(`/admin/sellers/${commissionSeller.id}/commission`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commissionBps }),
      });
      setNotice(`Commission for '${commissionSeller.storeName}' updated to ${commissionRatePercent}%.`);
      setCommissionSeller(null);
      void loadSellers(statusFilter);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update commission");
    } finally {
      setActionBusy(false);
    }
  }

  if (accessForbidden) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl">Access restricted</h1>
        <p className="mt-3 text-sm text-mist">
          Super Administrator privileges are required to manage sellers.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-mist">Store administration</p>
          <h1 className="mt-1 font-display text-4xl">Sellers directory</h1>
        </div>
      </div>

      <AdminNav />

      {notice && <p role="status" className="mb-6 border border-green-200 bg-green-50 p-4 text-sm text-green-800">{notice}</p>}
      {error && <p role="alert" className="mb-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-black/10 pb-3 mb-6">
        {[
          { label: "All Sellers", value: "" },
          { label: "Active", value: "active" },
          { label: "Suspended", value: "suspended" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value as "" | SellerStatus)}
            className={`px-3 py-1.5 text-xs uppercase tracking-wider transition-colors ${
              statusFilter === tab.value
                ? "bg-black text-white font-medium"
                : "text-mist hover:text-black bg-stone"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-mist">Loading sellers…</p>
      ) : sellers.length === 0 ? (
        <div className="border border-black/10 bg-stone p-12 text-center">
          <p className="text-mist text-sm">No registered sellers found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-black/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone text-xs uppercase tracking-wider text-charcoal border-b border-black/10">
              <tr>
                <th className="px-4 py-3 font-medium">Store & Slug</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Products</th>
                <th className="px-4 py-3 font-medium">Commission</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 bg-white">
              {sellers.map((s) => (
                <tr key={s.id} className="hover:bg-stone/50">
                  <td className="px-4 py-3.5">
                    <p className="font-medium text-charcoal">{s.storeName}</p>
                    <p className="text-xs font-mono text-mist">/{s.slug}</p>
                  </td>
                  <td className="px-4 py-3.5 text-xs">{s.ownerName}</td>
                  <td className="px-4 py-3.5 text-xs text-mist">
                    <p>{s.email}</p>
                    <p>{s.phone}</p>
                  </td>
                  <td className="px-4 py-3.5 text-xs font-medium">
                    {s.productCount ?? 0} watches
                  </td>
                  <td className="px-4 py-3.5 text-xs">
                    {s.commissionBps !== undefined ? `${(s.commissionBps / 100).toFixed(1)}%` : "Default (10%)"}
                    <button
                      onClick={() => {
                        setCommissionSeller(s);
                        setCommissionRatePercent(s.commissionBps !== undefined ? s.commissionBps / 100 : 10);
                      }}
                      className="ml-2 text-gold underline text-[11px]"
                    >
                      Edit
                    </button>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] uppercase tracking-wider border font-medium ${
                        s.status === "active"
                          ? "bg-green-50 text-green-800 border-green-200"
                          : "bg-red-50 text-red-800 border-red-200"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right space-x-2">
                    {s.status === "active" ? (
                      <button
                        disabled={actionBusy}
                        onClick={() => {
                          setSuspendingSeller(s);
                          setSuspensionReason("");
                        }}
                        className="border border-red-300 text-red-700 px-2.5 py-1 text-[11px] uppercase tracking-wider hover:bg-red-50 disabled:opacity-50"
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        disabled={actionBusy}
                        onClick={() => handleActivate(s.id)}
                        className="bg-black text-white px-2.5 py-1 text-[11px] uppercase tracking-wider hover:opacity-90 disabled:opacity-50"
                      >
                        Reactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Commission Modal */}
      {commissionSeller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm bg-white p-6 border border-black/20">
            <h2 className="font-display text-xl">Set Platform Commission</h2>
            <p className="mt-1 text-xs text-mist">
              Specify the commission rate for <strong>{commissionSeller.storeName}</strong>. This rate applies to future watch sales.
            </p>
            <form onSubmit={handleSaveCommission} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">
                  Commission Percentage (%)
                </label>
                <input
                  required
                  type="number"
                  step="0.1"
                  min="0"
                  max="50"
                  value={commissionRatePercent}
                  onChange={(e) => setCommissionRatePercent(Number(e.target.value))}
                  className="w-full border border-black/20 p-2 text-sm outline-none focus:border-gold"
                />
                <span className="text-[11px] text-mist mt-1 block">
                  Example: 10% on a ₹10,000 watch yields ₹1,000 platform fee & ₹9,000 seller payout.
                </span>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCommissionSeller(null)}
                  className="bg-stone px-4 py-2 text-xs uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionBusy}
                  className="bg-black text-white px-4 py-2 text-xs uppercase tracking-wider hover:opacity-90"
                >
                  Save Rate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Suspend Modal */}
      {suspendingSeller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white p-6 border border-black/20">
            <h2 className="font-display text-xl text-red-900">Suspend Seller Account</h2>
            <p className="mt-2 text-xs text-mist">
              Suspending <strong>{suspendingSeller.storeName}</strong> will immediately hide all their listed watches from the shop and block their seller dashboard access.
            </p>
            <form onSubmit={handleSuspend} className="mt-4 space-y-4">
              <textarea
                required
                rows={3}
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                placeholder="Reason for suspension (e.g. Terms violation, customer delivery complaints)"
                className="w-full border border-black/20 p-2.5 text-xs outline-none focus:border-red-600"
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSuspendingSeller(null)}
                  className="bg-stone px-4 py-2 text-xs uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionBusy}
                  className="bg-red-700 text-white px-4 py-2 text-xs uppercase tracking-wider hover:bg-red-800 disabled:opacity-50"
                >
                  Confirm Suspension
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

