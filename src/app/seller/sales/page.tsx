"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Coins, Package, Search } from "lucide-react";
import { browserApi } from "@/lib/browser-api";
import { formatINR } from "@/lib/utils";
import WatchFace from "@/components/ui/WatchFace";
import type { WatchLook } from "@/types/product";

type Range = "7d" | "30d" | "90d" | "all";

interface SalesResponse {
  items: Array<{
    orderId: string;
    productId: string;
    product: string;
    image: string;
    quantity: number;
    amount: number;
    date: string;
  }>;
  total: number;
  page: number;
  pages: number;
  metrics: {
    productsSold: number;
    totalEarnings: number;
  };
}

const defaultLook: WatchLook = { dial: "#1f2022", case: "#b9b9b4", strap: "#111111" };

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatRange(range: Range) {
  if (range === "all") return "All time";
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - Number(range.slice(0, -1)) + 1);
  return `${formatDate(start.toISOString())} – ${formatDate(end.toISOString())}`;
}

export default function SellerSalesPage() {
  const [range, setRange] = useState<Range>("30d");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [retryToken, setRetryToken] = useState(0);
  const [data, setData] = useState<SalesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ range, page: String(page), limit: "10" });
    if (search) params.set("q", search);
    browserApi<SalesResponse>(`/seller/sales?${params.toString()}`)
      .then((response) => {
        if (active) setData(response);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Could not load sales history.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [range, page, search, retryToken]);

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-3 text-xs text-mist">
          <Link href="/seller" className="hover:text-black">Overview</Link>
          <span aria-hidden="true">&gt;</span>
          <span className="font-medium text-charcoal">Sales History</span>
        </div>
        <h1 className="mt-2 font-display text-4xl text-black">Sales History</h1>
        <p className="mt-1 text-sm text-mist">Track your sold products and earnings.</p>
      </header>

      <section aria-label="Sales summary" className="grid gap-4 md:grid-cols-2">
        <div className="flex min-h-24 items-center gap-5 border border-black/10 bg-white px-5 py-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[#fbf6ed] text-[#a87936]">
            <Package size={27} strokeWidth={1.8} />
          </span>
          <div>
            <p className="text-sm text-charcoal">Total Products Sold</p>
            <p className="mt-1 font-display text-3xl leading-none text-black">
              {loading && !data ? "—" : data?.metrics.productsSold ?? 0}
            </p>
          </div>
        </div>
        <div className="flex min-h-24 items-center gap-5 border border-black/10 bg-white px-5 py-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[#fbf6ed] text-[#a87936]">
            <Coins size={29} strokeWidth={1.8} />
          </span>
          <div>
            <p className="text-sm text-charcoal">Total Earnings</p>
            <p className="mt-1 font-display text-3xl leading-none text-gold">
              {loading && !data ? "—" : formatINR(data?.metrics.totalEarnings ?? 0)}
            </p>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <label className="relative flex min-h-10 items-center gap-3 border border-black/10 bg-white px-3 text-xs text-charcoal">
          <CalendarDays size={16} />
          <span className="sr-only">Date range</span>
          <select
            value={range}
            onChange={(event) => {
              setLoading(true);
              setError("");
              setRange(event.target.value as Range);
              setPage(1);
            }}
            className="min-w-40 cursor-pointer appearance-none bg-transparent pr-5 outline-none"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">{formatRange("30d")}</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
          <span aria-hidden="true" className="pointer-events-none absolute right-3">⌄</span>
        </label>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            setLoading(true);
            setError("");
            setPage(1);
            setSearch(searchInput.trim());
          }}
          className="flex min-h-10 w-full items-center gap-2 border border-black/10 bg-white px-3 sm:w-72"
        >
          <Search size={16} className="shrink-0 text-charcoal" />
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by product or order ID..."
            aria-label="Search by product or order ID"
            className="min-w-0 flex-1 bg-transparent text-xs outline-none"
          />
        </form>
      </div>

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span>{error}</span>
          <button
            onClick={() => {
              setLoading(true);
              setError("");
              setRetryToken((current) => current + 1);
            }}
            className="font-medium underline underline-offset-2"
          >
            Try again
          </button>
        </div>
      )}

      <div className="overflow-x-auto border border-black/10 bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-black/10 bg-stone text-[11px] uppercase tracking-wider text-charcoal">
            <tr>
              <th className="px-5 py-3 font-medium">Order ID</th>
              <th className="px-5 py-3 font-medium">Product</th>
              <th className="px-5 py-3 font-medium">Quantity</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10">
            {loading && !data ? (
              <tr><td colSpan={5} className="px-5 py-12 text-center text-xs text-mist">Loading sales history…</td></tr>
            ) : data?.items.length ? (
              data.items.map((sale) => (
                <tr key={`${sale.orderId}-${sale.productId}`} className="transition-colors hover:bg-stone/20">
                  <td className="px-5 py-3">
                    <span className="rounded-md bg-stone px-3 py-2 text-xs font-medium text-charcoal">#{sale.orderId}</span>
                  </td>
                  <td className="px-5 py-2">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-10 shrink-0">
                        {sale.image ? (
                          <Image src={sale.image} alt="" fill unoptimized className="object-contain" />
                        ) : (
                          <WatchFace look={defaultLook} label={sale.product} />
                        )}
                      </div>
                      <span className="font-medium text-charcoal">{sale.product}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">{sale.quantity}</td>
                  <td className="px-5 py-3 font-medium">{formatINR(sale.amount)}</td>
                  <td className="px-5 py-3 text-charcoal">{formatDate(sale.date)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center">
                  <p className="text-sm text-charcoal">{search ? "No sales match your search." : "No sales in this date range yet."}</p>
                  <p className="mt-1 text-xs text-mist">Your sold products will appear here once orders are placed.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && (
        <footer className="flex flex-wrap items-center justify-between gap-4 text-xs text-mist">
          <p>
            Showing {data.total === 0 ? 0 : (page - 1) * 10 + 1}–{Math.min(page * 10, data.total)} of {data.total} orders
          </p>
          <nav aria-label="Sales history pages" className="flex items-center gap-2">
            <button
              onClick={() => {
                setLoading(true);
                setPage((current) => Math.max(1, current - 1));
              }}
              disabled={page <= 1 || loading}
              aria-label="Previous page"
              className="flex h-9 w-9 items-center justify-center border border-black/10 bg-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="flex h-9 min-w-9 items-center justify-center bg-black px-3 text-white">{page}</span>
            <button
              onClick={() => {
                setLoading(true);
                setPage((current) => Math.min(data.pages, current + 1));
              }}
              disabled={page >= data.pages || loading}
              aria-label="Next page"
              className="flex h-9 w-9 items-center justify-center border border-black/10 bg-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </nav>
        </footer>
      )}
    </div>
  );
}
