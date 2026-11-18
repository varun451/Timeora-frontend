"use client";

import { useEffect, useState, useCallback } from "react";
import AdminNav from "@/components/admin/AdminNav";
import WatchFace from "@/components/ui/WatchFace";
import { browserApi, BrowserApiError } from "@/lib/browser-api";
import { formatINR } from "@/lib/utils";
import type { Product } from "@/types/product";
import type { User } from "@/types/user";

interface AdminProductItem extends Product {
  seller?: {
    id: string;
    storeName: string;
    ownerName: string;
    slug: string;
  };
  status: "approved" | "pending" | "rejected" | "draft";
  availability: "active" | "hidden";
  rejectionReason?: string;
  createdAt: string;
}

interface ProductListResponse {
  items: AdminProductItem[];
  total: number;
  page: number;
  pages: number;
}

export default function AdminProductApprovalsPage() {
  const [accessForbidden, setAccessForbidden] = useState(false);
  const [products, setProducts] = useState<AdminProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [inspectingProduct, setInspectingProduct] = useState<AdminProductItem | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionBusy, setActionBusy] = useState(false);

  const loadPending = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await browserApi<ProductListResponse>("/admin/products?status=pending");
      setProducts(res.items);
    } catch (err) {
      if (err instanceof BrowserApiError && (err.status === 401 || err.status === 403)) {
        setAccessForbidden(true);
      } else {
        setError(err instanceof Error ? err.message : "Failed to load approval queue");
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
        void loadPending();
      })
      .catch(() => {
        if (active) setAccessForbidden(true);
      });
    return () => {
      active = false;
    };
  }, [loadPending]);

  async function handleApprove(id: string) {
    if (!confirm("Approve this watch for public listing in the shop?")) return;
    setActionBusy(true);
    setError("");
    setNotice("");
    try {
      await browserApi(`/admin/products/${id}/approve`, { method: "POST" });
      setNotice("Watch approved successfully and published to catalogue.");
      setInspectingProduct(null);
      void loadPending();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleReject(e: React.FormEvent) {
    e.preventDefault();
    if (!rejectingId || rejectReason.trim().length < 5) {
      setError("Please specify a rejection reason of at least 5 characters.");
      return;
    }

    setActionBusy(true);
    setError("");
    setNotice("");
    try {
      await browserApi(`/admin/products/${rejectingId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });
      setNotice("Watch rejected and feedback returned to the vendor.");
      setRejectingId(null);
      setRejectReason("");
      setInspectingProduct(null);
      void loadPending();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rejection failed");
    } finally {
      setActionBusy(false);
    }
  }

  if (accessForbidden) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl">Access restricted</h1>
        <p className="mt-3 text-sm text-mist">Super Admin privileges required to review product submissions.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-mist">Store administration</p>
          <h1 className="mt-1 font-display text-4xl">Product approvals queue</h1>
        </div>
      </div>

      <AdminNav />

      {notice && <p role="status" className="mb-6 border border-green-200 bg-green-50 p-4 text-sm text-green-800">{notice}</p>}
      {error && <p role="alert" className="mb-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="py-12 text-center text-sm text-mist">Loading approval queue…</p>
      ) : products.length === 0 ? (
        <div className="border border-black/10 bg-stone p-12 text-center">
          <p className="text-mist text-sm">No watches pending approval. The catalog queue is clean!</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-black/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone text-xs uppercase tracking-wider text-charcoal border-b border-black/10">
              <tr>
                <th className="px-4 py-3 font-medium">Watch</th>
                <th className="px-4 py-3 font-medium">Seller Store</th>
                <th className="px-4 py-3 font-medium">Brand & Specs</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {products.map((p) => {
                const hasImage = p.images && p.images.length > 0;
                return (
                  <tr key={p.id} className="hover:bg-stone/40">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-14 bg-stone border border-black/10 shrink-0 overflow-hidden relative flex items-center justify-center">
                          {hasImage ? (
                            <img src={p.images![0]} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="scale-50 origin-center">
                              <WatchFace look={p.look} label={p.name} />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-charcoal line-clamp-1">{p.name}</p>
                          <p className="text-[11px] text-mist">{p.category} · {p.gender}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-xs">
                      <p className="font-medium text-black">{p.seller?.storeName ?? "Direct"}</p>
                      <p className="text-mist">{p.seller?.ownerName}</p>
                    </td>

                    <td className="px-4 py-3.5 text-xs text-mist">
                      <p className="font-medium text-black">{p.brand}</p>
                      <p>{p.specs?.movement || "Movement not specified"}</p>
                    </td>

                    <td className="px-4 py-3.5 text-xs font-medium">
                      {formatINR(p.price)}
                      {p.discountPercent > 0 && <span className="ml-1 text-[10px] text-green-700">(-{p.discountPercent}%)</span>}
                    </td>

                    <td className="px-4 py-3.5 text-xs font-mono">{p.stock} units</td>

                    <td className="px-4 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => setInspectingProduct(p)}
                        className="text-xs underline text-mist hover:text-black"
                      >
                        Inspect
                      </button>
                      <button
                        disabled={actionBusy}
                        onClick={() => handleApprove(p.id)}
                        className="bg-black text-white px-3 py-1 text-xs uppercase tracking-wider hover:opacity-90 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        disabled={actionBusy}
                        onClick={() => {
                          setRejectingId(p.id);
                          setRejectReason("");
                        }}
                        className="border border-red-300 text-red-700 px-3 py-1 text-xs uppercase tracking-wider hover:bg-red-50 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Inspect Modal */}
      {inspectingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl bg-white p-6 sm:p-8 max-h-[90vh] overflow-y-auto border border-black/20">
            <div className="flex items-start justify-between pb-4 border-b border-black/10">
              <div>
                <span className="text-xs uppercase tracking-wider text-mist">Watch Inspection</span>
                <h2 className="font-display text-2xl mt-1">{inspectingProduct.name}</h2>
                <p className="text-xs text-mist">
                  Submitted by <strong>{inspectingProduct.seller?.storeName}</strong>
                </p>
              </div>
              <button onClick={() => setInspectingProduct(null)} className="text-mist hover:text-black text-lg font-bold">
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-6 text-sm">
              {/* Image Preview Gallery */}
              {inspectingProduct.images && inspectingProduct.images.length > 0 && (
                <div>
                  <h3 className="font-display text-base border-b border-black/10 pb-1 mb-3">Submitted Photos</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {inspectingProduct.images.map((img, i) => (
                      <div key={i} className="aspect-square border border-black/10 bg-stone overflow-hidden">
                        <img src={img} alt="Watch" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {inspectingProduct.description && (
                <div>
                  <h3 className="font-display text-base border-b border-black/10 pb-1 mb-2">Description</h3>
                  <p className="text-xs text-mist leading-relaxed bg-stone p-3">{inspectingProduct.description}</p>
                </div>
              )}

              {/* Specs */}
              <div>
                <h3 className="font-display text-base border-b border-black/10 pb-1 mb-3">Specifications</h3>
                <dl className="grid grid-cols-2 gap-3 text-xs">
                  <div><span className="text-mist">Movement:</span> {inspectingProduct.specs?.movement || "N/A"}</div>
                  <div><span className="text-mist">Case Material:</span> {inspectingProduct.specs?.caseMaterial || "N/A"}</div>
                  <div><span className="text-mist">Strap Material:</span> {inspectingProduct.specs?.strapMaterial || "N/A"}</div>
                  <div><span className="text-mist">Dial Colour:</span> {inspectingProduct.specs?.dialColor || "N/A"}</div>
                  <div><span className="text-mist">Water Resistance:</span> {inspectingProduct.specs?.waterResistance || "N/A"}</div>
                  <div><span className="text-mist">Warranty:</span> {inspectingProduct.specs?.warranty || "N/A"}</div>
                </dl>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-black/10 flex justify-end gap-3">
              <button
                onClick={() => setInspectingProduct(null)}
                className="bg-stone px-4 py-2 text-xs uppercase tracking-wider"
              >
                Close
              </button>
              <button
                disabled={actionBusy}
                onClick={() => {
                  setRejectingId(inspectingProduct.id);
                  setInspectingProduct(null);
                }}
                className="border border-red-300 text-red-700 px-4 py-2 text-xs uppercase tracking-wider hover:bg-red-50"
              >
                Reject
              </button>
              <button
                disabled={actionBusy}
                onClick={() => handleApprove(inspectingProduct.id)}
                className="bg-black text-white px-5 py-2 text-xs uppercase tracking-wider hover:opacity-90"
              >
                Approve & Publish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white p-6 border border-black/20">
            <h2 className="font-display text-xl text-red-900">Reject Watch Listing</h2>
            <p className="mt-2 text-xs text-mist">
              Specify the reason for rejection. The seller will see this feedback in their dashboard and can rectify the listing.
            </p>
            <form onSubmit={handleReject} className="mt-4 space-y-4">
              <textarea
                required
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Incomplete movement specifications; image quality is blurry or watermark present."
                className="w-full border border-black/20 p-2.5 text-xs outline-none focus:border-red-600"
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRejectingId(null)}
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

