"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { browserApi, BrowserApiError } from "@/lib/browser-api";
import { formatINR } from "@/lib/utils";
import type { Order } from "@/types/order";

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState("Loading your orders…");
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState("");

  useEffect(() => {
    let active = true;
    browserApi<Order[]>("/orders/mine").then((result) => {
      if (!active) return;
      setOrders(result);
      setMessage(result.length ? "" : "You have not placed any orders yet.");
    }).catch((error: unknown) => {
      if (!active) return;
      setMessage(error instanceof BrowserApiError && error.status === 401
        ? "Sign in to view your orders."
        : error instanceof Error ? error.message : "Could not load your orders.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function cancelOrder(orderId: string) {
    if (!window.confirm("Cancel this order? A completed online payment cannot be cancelled here.")) return;
    setCancelling(orderId);
    setMessage("");
    try {
      const updated = await browserApi<Order>(`/orders/${encodeURIComponent(orderId)}/cancel`, { method: "POST" });
      setOrders((current) => current.map((order) => order.id === updated.id ? updated : order));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not cancel this order.");
    } finally {
      setCancelling("");
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <p className="text-sm"><Link href="/account" className="underline">My account</Link></p>
      <h1 className="mt-3 font-display text-4xl">My orders</h1>
      {message && <div className="py-12 text-center text-sm text-mist">
        <p>{message}</p>
        {!loading && message === "Sign in to view your orders." && <Link href="/login?next=%2Faccount%2Forders" className="mt-4 inline-block underline">Sign in</Link>}
        {!loading && orders.length === 0 && !message.includes("Sign in") && <Link href="/shop" className="mt-4 inline-block underline">Explore watches</Link>}
      </div>}
      <ul className="mt-6 divide-y divide-black/10 border-y border-black/10">
        {orders.map((order) => <li key={order.id} className="flex flex-wrap items-center justify-between gap-4 py-5">
          <div>
            <p className="font-medium">Order #{order.id.slice(-8).toUpperCase()}</p>
            <p className="mt-1 text-xs text-mist">{new Date(order.createdAt).toLocaleDateString("en-IN")} · {order.items.length} {order.items.length === 1 ? "item" : "items"}</p>
            <p className="mt-1 text-sm capitalize">{order.status} · {order.paymentMethod === "razorpay" ? `Razorpay (${order.paymentStatus})` : "Cash on delivery"}</p>
          </div>
          <div className="flex items-center gap-5">
            <p className="text-sm">{formatINR(order.total)}</p>
            <Link href={`/checkout/confirmation/${order.id}`} className="text-sm underline">View order</Link>
            {["pending", "confirmed"].includes(order.status) && <button disabled={cancelling === order.id} onClick={() => cancelOrder(order.id)} className="text-sm underline disabled:opacity-50">{cancelling === order.id ? "Cancelling…" : "Cancel"}</button>}
          </div>
        </li>)}
      </ul>
      {message && !loading && !message.includes("Sign in") && <p role="status" className="mt-4 text-sm text-red-700">{message}</p>}
    </div>
  );
}
