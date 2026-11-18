"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2 } from "lucide-react";
import WatchFace from "@/components/ui/WatchFace";
import { browserApi } from "@/lib/browser-api";
import { formatINR } from "@/lib/utils";
import type { Product } from "@/types/product";

interface SellerProduct extends Product {
  status: "approved" | "pending" | "rejected" | "draft";
  availability: "active" | "hidden";
  rejectionReason?: string;
  sku?: string;
  createdAt: string;
}

interface ProductListResponse {
  items: SellerProduct[];
  total: number;
  page: number;
  pages: number;
}

export default function SellerProductsPage() {
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [inventoryFilter, setInventoryFilter] = useState<"all" | "active" | "out-of-stock">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [stockUpdating, setStockUpdating] = useState<string | null>(null);

  const fetchProducts = useCallback(() => {
    const params = new URLSearchParams();
    params.set("limit", "100");
    if (search) params.set("q", search);
    return browserApi<ProductListResponse>(`/seller/products?${params.toString()}`);
  }, [search]);

  const loadProducts = useCallback(async () => {
    try {
      const res = await fetchProducts();
      setProducts(res.items);
      setPage(1);
      setSelectedProducts([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load watches");
    } finally {
      setLoading(false);
    }
  }, [fetchProducts]);

  useEffect(() => {
    let active = true;
    fetchProducts().then((res) => {
      if (active) setProducts(res.items);
    }).catch((err: unknown) => {
      if (active) setError(err instanceof Error ? err.message : "Failed to load watches");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [fetchProducts]);

  async function toggleAvailability(p: SellerProduct) {
    const nextAvailability = p.availability === "active" ? "hidden" : "active";
    try {
      await browserApi(`/seller/products/${p.id}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availability: nextAvailability }),
      });
      setProducts((prev) =>
        prev.map((item) => (item.id === p.id ? { ...item, availability: nextAvailability } : item)),
      );
      setNotice(`Updated '${p.name}' visibility to ${nextAvailability}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not toggle availability");
    }
  }

  async function handleQuickStock(productId: string, newStock: number) {
    if (newStock < 0) return;
    setStockUpdating(productId);
    try {
      await browserApi(`/seller/products/${productId}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: newStock }),
      });
      setProducts((prev) =>
        prev.map((item) => (item.id === productId ? { ...item, stock: newStock } : item)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update stock");
    } finally {
      setStockUpdating(null);
    }
  }

  async function handleDelete(productId: string, name: string) {
    if (!confirm(`Are you sure you want to delete '${name}'? This cannot be undone.`)) {
      return;
    }
    try {
      await browserApi(`/seller/products/${productId}`, { method: "DELETE" });
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setSelectedProducts((prev) => prev.filter((id) => id !== productId));
      setPage(1);
      setNotice(`Deleted '${name}' successfully.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete watch");
    }
  }

  const filteredProducts = products.filter((product) => {
    if (inventoryFilter === "active") {
      return product.status === "approved" && product.availability === "active" && product.stock > 0;
    }
    if (inventoryFilter === "out-of-stock") return product.stock === 0;
    return true;
  });
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const visibleProducts = filteredProducts.slice((page - 1) * pageSize, page * pageSize);
  const pageProductIds = visibleProducts.map((product) => product.id);
  const allVisibleSelected = pageProductIds.length > 0 && pageProductIds.every((id) => selectedProducts.includes(id));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs text-mist">Products</p>
          <h1 className="mt-1 font-display text-4xl">My Products</h1>
          <p className="mt-1 text-xs text-mist">Manage your watch listings on Timeora.</p>
        </div>
        <Link
          href="/seller/products/new"
          className="flex items-center gap-2 bg-black px-4 py-2.5 text-xs uppercase tracking-wider text-white transition-colors hover:bg-charcoal"
        >
          <Plus size={14} />
          <span>Add Product</span>
        </Link>
      </div>

      {notice && <p role="status" className="border border-green-200 bg-green-50 p-4 text-sm text-green-800">{notice}</p>}
      {error && <p role="alert" className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2" aria-label="Filter products">
          {[
            { label: "All", value: "all" as const, count: products.length },
            {
              label: "Active",
              value: "active" as const,
              count: products.filter(
                (product) =>
                  product.status === "approved" &&
                  product.availability === "active" &&
                  product.stock > 0,
              ).length,
            },
            {
              label: "Out of Stock",
              value: "out-of-stock" as const,
              count: products.filter((product) => product.stock === 0).length,
            },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setInventoryFilter(tab.value);
                setPage(1);
              }}
              className={`border px-4 py-2 text-xs transition-colors ${
                inventoryFilter === tab.value
                  ? "border-black bg-black text-white"
                  : "border-black/10 bg-white text-charcoal hover:border-black/40"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setLoading(true);
            setError("");
            setPage(1);
            void loadProducts();
          }}
          className="flex w-full items-center gap-2 border border-black/10 bg-white px-3 py-2.5 sm:w-64"
        >
          <Search size={16} className="shrink-0 text-charcoal" />
          <input
            type="search"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-xs outline-none"
            aria-label="Search products"
          />
        </form>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-mist">Loading your watches…</div>
      ) : filteredProducts.length === 0 ? (
        <div className="border border-black/10 bg-white p-12 text-center">
          <p className="text-sm text-mist">
            {products.length === 0 ? "You haven’t added any products yet." : "No products match this filter."}
          </p>
          <Link
            href="/seller/products/new"
            className="mt-4 inline-block bg-black px-4 py-2 text-xs uppercase tracking-wider text-white"
          >
            Add your first product &rarr;
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto border border-black/10 bg-white">
          <table className="w-full min-w-[790px] text-left text-sm">
            <thead className="border-b border-black/10 bg-stone text-[11px] uppercase tracking-wider text-charcoal">
              <tr>
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label="Select all products on this page"
                    checked={allVisibleSelected}
                    onChange={(event) => {
                      setSelectedProducts((current) =>
                        event.target.checked
                          ? [...new Set([...current, ...pageProductIds])]
                          : current.filter((id) => !pageProductIds.includes(id)),
                      );
                    }}
                    className="h-4 w-4 accent-black"
                  />
                </th>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {visibleProducts.map((p) => {
                const hasImage = p.images && p.images.length > 0;
                const productStatus = p.stock === 0
                  ? "Out of Stock"
                  : p.status !== "approved"
                    ? p.status
                    : p.availability === "active"
                      ? "Active"
                      : "Hidden";
                return (
                  <tr key={p.id} className="transition-colors hover:bg-stone/30">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Select ${p.name}`}
                        checked={selectedProducts.includes(p.id)}
                        onChange={(event) =>
                          setSelectedProducts((current) =>
                            event.target.checked
                              ? [...current, p.id]
                              : current.filter((id) => id !== p.id),
                          )
                        }
                        className="h-4 w-4 accent-black"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-3">
                        <div className="relative flex h-14 w-12 shrink-0 items-center justify-center overflow-hidden bg-white">
                          {hasImage ? (
                            <img
                              src={p.images![0]}
                              alt={p.name}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <div className="h-full w-full">
                              <WatchFace look={p.look} label={p.name} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="line-clamp-1 font-medium text-charcoal">{p.name}</p>
                          <p className="mt-0.5 text-xs capitalize text-mist">{p.gender}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 font-medium">{formatINR(p.price)}</td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        aria-label={`Stock for ${p.name}`}
                        defaultValue={p.stock}
                        disabled={stockUpdating === p.id}
                        onBlur={(event) => {
                          const value = Number(event.target.value);
                          if (value !== p.stock) void handleQuickStock(p.id, value);
                        }}
                        className={`w-12 bg-transparent text-sm outline-none focus-visible:ring-1 focus-visible:ring-gold ${
                          p.stock === 0 ? "text-red-700" : "text-charcoal"
                        }`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleAvailability(p)}
                        className={`rounded-full px-3 py-1 text-[11px] font-medium normal-case tracking-normal ${
                          productStatus === "Active"
                            ? "bg-green-100 text-green-800"
                            : productStatus === "Out of Stock" || productStatus === "rejected"
                              ? "bg-red-100 text-red-700"
                              : productStatus === "pending"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-stone text-charcoal"
                        }`}
                        title={`Click to ${p.availability === "active" ? "hide" : "activate"} this product`}
                      >
                        {productStatus}
                      </button>
                      {p.discountPercent > 0 && (
                        <span className="ml-2 text-[10px] text-green-700">{p.discountPercent}% off</span>
                      )}
                    </td>

                    <td className="space-x-2 px-4 py-3 text-right">
                      <Link
                        href={`/seller/products/${p.id}/edit`}
                        className="inline-flex items-center gap-1.5 border border-black/50 px-3 py-1.5 text-xs transition-colors hover:bg-black hover:text-white"
                        title="Edit watch details"
                      >
                        <Pencil size={13} />
                        <span>Edit</span>
                      </Link>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        className="inline-flex items-center justify-center border border-red-300 p-1.5 text-red-600 transition-colors hover:bg-red-50"
                        title="Delete watch"
                        aria-label={`Delete ${p.name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && filteredProducts.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-mist">
          <p>
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredProducts.length)} of{" "}
            {filteredProducts.length} products
          </p>
          <nav aria-label="Product pages" className="flex items-center gap-2">
            <button
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              aria-label="Previous page"
              className="flex h-9 w-9 items-center justify-center border border-black/10 bg-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="flex h-9 min-w-9 items-center justify-center bg-black px-3 text-white">{page}</span>
            <button
              onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
              disabled={page === pageCount}
              aria-label="Next page"
              className="flex h-9 w-9 items-center justify-center border border-black/10 bg-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
