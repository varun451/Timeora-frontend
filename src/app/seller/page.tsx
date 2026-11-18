"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Coins, Package, Pencil, Plus } from "lucide-react";
import WatchFace from "@/components/ui/WatchFace";
import { browserApi } from "@/lib/browser-api";
import { formatINR } from "@/lib/utils";
import type { WatchLook } from "@/types/product";

interface DashboardData {
  store: {
    storeName: string;
    ownerName: string;
    commissionBps: number;
  };
  metrics: {
    totalProducts: number;
    totalEarnings: number;
    totalOrders: number;
  };
  recentWatches: Array<{
    id: string;
    name: string;
    price: number;
    stock: number;
    images: string[];
    look?: WatchLook;
  }>;
  recentOrders?: Array<{
    id: string;
    items: Array<{ name: string; quantity: number }>;
    total: number;
    createdAt: string;
  }>;
}

const defaultLook: WatchLook = { dial: "#1f2022", case: "#b9b9b4", strap: "#111111" };

export default function SellerDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    browserApi<DashboardData>("/seller/dashboard")
      .then((response) => {
        if (active) setData(response);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Could not load dashboard data.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <div className="py-20 text-center text-sm text-mist">Loading vendor dashboard…</div>;
  }

  if (error || !data) {
    return <div role="alert" className="border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error || "Could not load vendor data."}</div>;
  }

  const sales = data.recentOrders ?? [];
  const watches = data.recentWatches.slice(0, 5);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-gold">Overview</p>
          <h1 className="mt-1 font-display text-3xl text-black sm:text-4xl">Vendor Dashboard</h1>
          <p className="mt-1 text-xs text-mist">
            Signed in as <span className="font-medium text-charcoal">{data.store.ownerName || data.store.storeName}</span>
          </p>
        </div>
        <Link
          href="/seller/products/new"
          className="inline-flex items-center gap-2 bg-black px-4 py-2.5 text-[11px] uppercase tracking-wider text-white transition-colors hover:bg-charcoal"
        >
          <Plus size={14} />
          Add Product
        </Link>
      </div>

      <section aria-label="Vendor summary" className="grid gap-4 md:grid-cols-2">
        <div className="flex min-h-24 items-center justify-between border border-black/10 bg-white px-5 py-4">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-charcoal">My Products</p>
            <p className="mt-1 font-display text-3xl leading-none text-black">{data.metrics.totalProducts}</p>
          </div>
          <Package size={21} strokeWidth={1.7} className="text-black" />
        </div>
        <div className="flex min-h-24 items-center justify-between border border-black/10 bg-white px-5 py-4">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-charcoal">Total Earnings</p>
            <p className="mt-1 font-display text-3xl leading-none text-gold">{formatINR(data.metrics.totalEarnings)}</p>
          </div>
          <Coins size={21} strokeWidth={1.7} className="text-gold" />
        </div>
      </section>

      <section id="sales" className="scroll-mt-24 border border-black/10 bg-white p-3 sm:p-4">
        <h2 className="mb-2 font-display text-2xl">Recent Sales</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-xs">
            <thead className="bg-stone text-[10px] uppercase tracking-wider text-charcoal">
              <tr>
                <th className="px-4 py-2 font-medium">Product</th>
                <th className="px-4 py-2 font-medium">Quantity Sold</th>
                <th className="px-4 py-2 font-medium">Earnings</th>
                <th className="px-4 py-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {sales.map((sale) => (
                <tr key={sale.id}>
                  <td className="px-4 py-3 font-medium">{sale.items.map((item) => item.name).join(", ")}</td>
                  <td className="px-4 py-3">{sale.items.reduce((quantity, item) => quantity + item.quantity, 0)}</td>
                  <td className="px-4 py-3">{formatINR(sale.total)}</td>
                  <td className="px-4 py-3">{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(sale.createdAt))}</td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-7 text-center text-xs text-mist">
                    No sales to show yet. Your completed sales will appear here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="border border-black/10 bg-white p-3 sm:p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl">My Products</h2>
          <Link href="/seller/products" className="shrink-0 text-xs text-gold underline underline-offset-2 hover:text-black">
            View all &rarr;
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-xs">
            <thead className="bg-stone text-[10px] uppercase tracking-wider text-charcoal">
              <tr>
                <th className="px-4 py-2 font-medium">Product</th>
                <th className="px-4 py-2 font-medium">Price</th>
                <th className="px-4 py-2 font-medium">Stock</th>
                <th className="px-4 py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {watches.map((watch) => (
                <tr key={watch.id}>
                  <td className="px-4 py-1.5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-9 shrink-0">
                        <WatchFace look={watch.look ?? defaultLook} label={watch.name} />
                      </div>
                      <span className="font-medium">{watch.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2">{formatINR(watch.price)}</td>
                  <td className="px-4 py-2">{watch.stock}</td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/seller/products/${watch.id}/edit`}
                      className="inline-flex items-center gap-1 border border-black/50 px-3 py-1.5 text-[10px] uppercase tracking-wider transition-colors hover:bg-black hover:text-white"
                    >
                      <Pencil size={12} />
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
              {watches.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-7 text-center text-xs text-mist">
                    You haven’t added any products yet.{" "}
                    <Link href="/seller/products/new" className="text-gold underline underline-offset-2">Add your first product</Link>.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
