"use client";

import { useEffect, useState, useCallback } from "react";
import AdminNav from "@/components/admin/AdminNav";
import { browserApi, BrowserApiError } from "@/lib/browser-api";
import type { ApplicationStatus, SellerApplication } from "@/types/seller";
import type { User } from "@/types/user";

type ApplicationListResponse = {
  items: SellerApplication[];
  total: number;
  page: number;
  pages: number;
};

export default function AdminApplicationsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [accessForbidden, setAccessForbidden] = useState(false);
  const [applications, setApplications] = useState<SellerApplication[]>([]);
  const [statusFilter, setStatusFilter] = useState<"" | ApplicationStatus>("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Inspect detail modal
  const [inspectApp, setInspectApp] = useState<SellerApplication | null>(null);

  // Reject modal
  const [rejectingAppId, setRejectingAppId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionBusy, setActionBusy] = useState(false);

  const loadApplications = useCallback(async (status: string) => {
    setLoading(true);
    setError("");
    try {
      const query = status ? `?status=${status}` : "";
      const res = await browserApi<ApplicationListResponse>(`/admin/applications${query}`);
      setApplications(res.items);
    } catch (err) {
      if (err instanceof BrowserApiError && (err.status === 401 || err.status === 403)) {
        setAccessForbidden(true);
      } else {
        setError(err instanceof Error ? err.message : "Failed to load seller applications");
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
        setUser(account);
        if (account.role !== "super_admin" && account.role !== "admin") {
          setAccessForbidden(true);
          return;
        }
        void loadApplications(statusFilter);
      })
      .catch(() => {
        if (active) setAccessForbidden(true);
      });
    return () => {
      active = false;
    };
  }, [loadApplications, statusFilter]);

  async function handleApprove(id: string) {
    if (!confirm("Are you sure you want to approve this seller application? The user will immediately receive seller portal access.")) {
      return;
    }
    setActionBusy(true);
    setNotice("");
    setError("");
    try {
      await browserApi(`/admin/applications/${id}/approve`, { method: "POST" });
      setNotice("Seller application approved successfully. Seller account is now active.");
      setInspectApp(null);
      void loadApplications(statusFilter);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not approve application");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleReject(e: React.FormEvent) {
    e.preventDefault();
    if (!rejectingAppId || rejectionReason.trim().length < 5) {
      setError("Please provide a reason of at least 5 characters.");
      return;
    }

    setActionBusy(true);
    setNotice("");
    setError("");
    try {
      await browserApi(`/admin/applications/${rejectingAppId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectionReason }),
      });
      setNotice("Application rejected and notice recorded.");
      setRejectingAppId(null);
      setRejectionReason("");
      setInspectApp(null);
      void loadApplications(statusFilter);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reject application");
    } finally {
      setActionBusy(false);
    }
  }

  if (accessForbidden) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl">Access restricted</h1>
        <p className="mt-3 text-sm text-mist">
          Super Administrator privileges are required to view and review seller applications.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-mist">Store administration</p>
          <h1 className="mt-1 font-display text-4xl">Seller applications</h1>
        </div>
      </div>

      <AdminNav />

      {notice && <p role="status" className="mb-6 border border-green-200 bg-green-50 p-4 text-sm text-green-800">{notice}</p>}
      {error && <p role="alert" className="mb-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-black/10 pb-3 mb-6">
        {[
          { label: "Pending Review", value: "pending" },
          { label: "Approved", value: "approved" },
          { label: "Rejected", value: "rejected" },
          { label: "All Applications", value: "" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value as "" | ApplicationStatus)}
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
        <p className="py-12 text-center text-sm text-mist">Loading seller applications…</p>
      ) : applications.length === 0 ? (
        <div className="border border-black/10 bg-stone p-12 text-center">
          <p className="text-mist text-sm">No seller applications found in this view.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-black/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone text-xs uppercase tracking-wider text-charcoal border-b border-black/10">
              <tr>
                <th className="px-4 py-3 font-medium">Store & Owner</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">PAN</th>
                <th className="px-4 py-3 font-medium">Bank (Last 4)</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 bg-white">
              {applications.map((app) => (
                <tr key={app.id} className="hover:bg-stone/50">
                  <td className="px-4 py-3.5">
                    <p className="font-medium text-charcoal">{app.storeName}</p>
                    <p className="text-xs text-mist">{app.ownerName}</p>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-mist">
                    <p>{app.email}</p>
                    <p>{app.phone}</p>
                  </td>
                  <td className="px-4 py-3.5 text-xs font-mono">{app.kyc.pan}</td>
                  <td className="px-4 py-3.5 text-xs">
                    {app.bankDetails.bankName} (•••{app.bankDetails.accountNumberLast4})
                  </td>
                  <td className="px-4 py-3.5 text-xs text-mist">
                    {new Date(app.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] uppercase tracking-wider border font-medium ${
                        app.status === "approved"
                          ? "bg-green-50 text-green-800 border-green-200"
                          : app.status === "rejected"
                            ? "bg-red-50 text-red-800 border-red-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}
                    >
                      {app.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right space-x-2">
                    <button
                      onClick={() => setInspectApp(app)}
                      className="text-xs underline text-mist hover:text-black"
                    >
                      Inspect
                    </button>
                    {app.status === "pending" && (
                      <>
                        <button
                          disabled={actionBusy}
                          onClick={() => handleApprove(app.id)}
                          className="bg-black text-white px-2.5 py-1 text-[11px] uppercase tracking-wider hover:opacity-90 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          disabled={actionBusy}
                          onClick={() => {
                            setRejectingAppId(app.id);
                            setRejectionReason("");
                          }}
                          className="border border-red-300 text-red-700 px-2.5 py-1 text-[11px] uppercase tracking-wider hover:bg-red-50 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Inspect Application Modal */}
      {inspectApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl bg-white p-6 sm:p-8 max-h-[90vh] overflow-y-auto border border-black/20">
            <div className="flex items-start justify-between pb-4 border-b border-black/10">
              <div>
                <span className="text-xs uppercase tracking-wider text-mist">Application Review</span>
                <h2 className="font-display text-2xl mt-1">{inspectApp.storeName}</h2>
              </div>
              <button
                onClick={() => setInspectApp(null)}
                className="text-mist hover:text-black text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-6 text-sm">
              <section>
                <h3 className="font-display text-base border-b border-black/10 pb-1 mb-3">Owner & Contact</h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><span className="text-mist">Owner:</span> <strong className="text-black">{inspectApp.ownerName}</strong></div>
                  <div><span className="text-mist">Email:</span> {inspectApp.email}</div>
                  <div><span className="text-mist">Phone:</span> {inspectApp.phone}</div>
                  <div><span className="text-mist">Submitted:</span> {new Date(inspectApp.createdAt).toLocaleString()}</div>
                </div>
                {inspectApp.description && (
                  <p className="mt-2 text-xs text-mist bg-stone p-2">{inspectApp.description}</p>
                )}
              </section>

              <section>
                <h3 className="font-display text-base border-b border-black/10 pb-1 mb-3">Business Address</h3>
                <p className="text-xs leading-relaxed">
                  {inspectApp.businessAddress.line1}
                  {inspectApp.businessAddress.line2 ? `, ${inspectApp.businessAddress.line2}` : ""}
                  <br />
                  {inspectApp.businessAddress.city}, {inspectApp.businessAddress.state} - {inspectApp.businessAddress.pincode}
                </p>
              </section>

              <section>
                <h3 className="font-display text-base border-b border-black/10 pb-1 mb-3">Statutory & Tax KYC</h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><span className="text-mist">PAN Number:</span> <strong className="font-mono text-black">{inspectApp.kyc.pan}</strong></div>
                  <div><span className="text-mist">GSTIN:</span> <span className="font-mono">{inspectApp.kyc.gstin || "Not provided"}</span></div>
                </div>
              </section>

              <section>
                <h3 className="font-display text-base border-b border-black/10 pb-1 mb-3">Bank Details (Encrypted at rest)</h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><span className="text-mist">Account Holder:</span> {inspectApp.bankDetails.accountHolderName}</div>
                  <div><span className="text-mist">Bank Name:</span> {inspectApp.bankDetails.bankName}</div>
                  <div><span className="text-mist">Account Number:</span> ••••••••{inspectApp.bankDetails.accountNumberLast4}</div>
                  <div><span className="text-mist">IFSC Code:</span> <span className="font-mono">{inspectApp.bankDetails.ifscCode}</span></div>
                </div>
              </section>

              {inspectApp.status === "rejected" && (
                <div className="border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                  <strong>Rejection Reason:</strong> {inspectApp.rejectionReason}
                </div>
              )}
            </div>

            <div className="mt-8 pt-4 border-t border-black/10 flex justify-end gap-3">
              <button
                onClick={() => setInspectApp(null)}
                className="bg-stone px-4 py-2 text-xs uppercase tracking-wider text-charcoal hover:bg-black/10"
              >
                Close
              </button>
              {inspectApp.status === "pending" && (
                <>
                  <button
                    disabled={actionBusy}
                    onClick={() => {
                      setRejectingAppId(inspectApp.id);
                      setInspectApp(null);
                    }}
                    className="border border-red-300 text-red-700 px-4 py-2 text-xs uppercase tracking-wider hover:bg-red-50"
                  >
                    Reject
                  </button>
                  <button
                    disabled={actionBusy}
                    onClick={() => handleApprove(inspectApp.id)}
                    className="bg-black text-white px-5 py-2 text-xs uppercase tracking-wider hover:opacity-90"
                  >
                    Approve Application
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingAppId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white p-6 border border-black/20">
            <h2 className="font-display text-xl text-red-900">Reject Seller Application</h2>
            <p className="mt-2 text-xs text-mist">
              Please specify the reason for rejection. This feedback will be displayed to the customer so they can rectify their details.
            </p>
            <form onSubmit={handleReject} className="mt-4 space-y-4">
              <textarea
                required
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Invalid PAN card number format; business address does not match submitted records."
                className="w-full border border-black/20 p-2.5 text-xs outline-none focus:border-red-600"
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRejectingAppId(null)}
                  className="bg-stone px-4 py-2 text-xs uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionBusy}
                  className="bg-red-700 text-white px-4 py-2 text-xs uppercase tracking-wider hover:bg-red-800 disabled:opacity-50"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

