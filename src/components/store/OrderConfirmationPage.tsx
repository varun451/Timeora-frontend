"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { browserApi } from "@/lib/browser-api";
import { formatINR } from "@/lib/utils";
import WatchFace from "@/components/ui/WatchFace";
import type { Order } from "@/types/order";

export default function OrderConfirmationPage({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    browserApi<Order>(`/orders/${encodeURIComponent(orderId)}`).then((result) => {
      if (active) setOrder(result);
    }).catch((requestError: unknown) => {
      if (active) setError(requestError instanceof Error ? requestError.message : "Could not load this order.");
    });
    return () => { active = false; };
  }, [orderId]);

  if (error) return <div className="mx-auto max-w-xl px-4 py-20 text-center"><h1 className="font-display text-3xl">Order unavailable</h1><p className="mt-3 text-sm text-mist">{error}</p><Link href="/account/orders" className="mt-5 inline-block underline">View your orders</Link></div>;
  if (!order) return <div className="mx-auto max-w-3xl px-4 py-20">Loading order details…</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-sm uppercase tracking-[0.16em] text-gold">Order placed</p>
      <h1 className="mt-2 font-display text-4xl">Thank you for your order.</h1>
      <p className="mt-3 text-sm text-mist">Order #{order.id.slice(-8).toUpperCase()} · {new Date(order.createdAt).toLocaleDateString("en-IN")}</p>
      <div className="mt-8 border-y border-black/10 py-5">
        <h2 className="font-display text-2xl">Items</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {order.items.map((item, index) => (
            <li key={`${item.productId}-${index}`} className="grid grid-cols-[88px_1fr_auto] items-center gap-4">
              <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-stone p-2">
                {item.images?.[0] ? (
                  <img src={item.images[0]} alt={item.name} className="h-full w-full object-contain" />
                ) : (
                  <WatchFace look={{ dial: "#1c1c1c", case: "#b08d57", strap: "#252525" }} label={item.name} />
                )}
              </div>
              <span>{item.name} × {item.quantity}</span>
              <span>{formatINR(item.unitPrice * item.quantity)}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-6 grid gap-8 sm:grid-cols-2">
        <div><h2 className="font-display text-xl">Delivering to</h2><address className="mt-2 text-sm not-italic leading-6 text-mist">{order.shippingAddress.name}<br />{order.shippingAddress.line1}{order.shippingAddress.line2 && <><br />{order.shippingAddress.line2}</>}<br />{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}<br />{order.shippingAddress.phone}</address></div>
        <div><h2 className="font-display text-xl">Payment</h2><p className="mt-2 text-sm text-mist">{order.paymentMethod === "razorpay" ? `Razorpay · ${order.paymentStatus}` : "Cash on delivery"} · {order.status}</p><p className="mt-3 text-sm font-medium">{order.paymentMethod === "razorpay" && order.paymentStatus === "paid" ? "Paid" : "Total due"}: {formatINR(order.total)}</p></div>
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/account/orders" className="bg-black px-5 py-3 text-sm text-white">View my orders</Link>
        <Link href="/shop" className="border border-black px-5 py-3 text-sm">Continue shopping</Link>
      </div>
    </div>
  );
}
