"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { browserApi, BrowserApiError } from "@/lib/browser-api";
import { finalPrice, formatINR } from "@/lib/utils";
import { useStore } from "@/components/store/StoreProvider";
import WatchFace from "@/components/ui/WatchFace";
import type { Order, RazorpayCheckoutOrder, ShippingAddress } from "@/types/order";

import type { User } from "@/types/user";
type PaymentConfig = { enabled: boolean; keyId: string | null; currency: string };
type CreatedOrder = Order & { razorpay?: RazorpayCheckoutOrder };

interface RazorpaySuccess {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface PendingPaymentVerification {
  orderId: string;
  response: RazorpaySuccess;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: "payment.failed", callback: (response: { error?: { description?: string } }) => void) => void;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string; contact: string };
  notes: { app_order_id: string };
  theme: { color: string };
  modal: { ondismiss: () => void };
  handler: (response: RazorpaySuccess) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

const initialAddress: ShippingAddress = { name: "", line1: "", line2: "", city: "", state: "", pincode: "", phone: "" };
const field = "mt-1 w-full border border-black/20 px-3 py-3 text-sm";
let razorpayScriptPromise: Promise<void> | null = null;

function loadRazorpayCheckout() {
  if (typeof window === "undefined") return Promise.reject(new Error("Online checkout is only available in a browser."));
  if (window.Razorpay) return Promise.resolve();
  if (razorpayScriptPromise) return razorpayScriptPromise;
  razorpayScriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      if (window.Razorpay) resolve();
      else {
        razorpayScriptPromise = null;
        reject(new Error("Razorpay Checkout did not initialize."));
      }
    };
    script.onerror = () => {
      script.remove();
      razorpayScriptPromise = null;
      reject(new Error("Could not load Razorpay Checkout. Check your connection and try again."));
    };
    document.head.appendChild(script);
  });
  return razorpayScriptPromise;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, hydrated, clearCart } = useStore();
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [address, setAddress] = useState(initialAddress);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>({ enabled: false, keyId: null, currency: "INR" });
  const [paymentConfigLoading, setPaymentConfigLoading] = useState(true);
  const [paymentConfigError, setPaymentConfigError] = useState("");
  const [pendingVerification, setPendingVerification] = useState<PendingPaymentVerification | null>(null);

  useEffect(() => {
    let active = true;
    browserApi<User>("/auth/me")
      .then((current) => {
        if (!active) return;
        setUser(current);
        setAddress((previous) => ({ ...previous, name: previous.name || current.name }));
      })
      .catch((requestError) => {
        if (!active || (requestError instanceof BrowserApiError && requestError.status === 401)) return;
        setError(requestError instanceof Error ? requestError.message : "Could not load your account.");
      })
      .finally(() => { if (active) setAuthChecked(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    browserApi<PaymentConfig>("/payments/config")
      .then((config) => { if (active) setPaymentConfig(config); })
      .catch((requestError: unknown) => {
        if (active) setPaymentConfigError(requestError instanceof Error ? requestError.message : "Online payment options could not be loaded.");
      })
      .finally(() => { if (active) setPaymentConfigLoading(false); });
    return () => { active = false; };
  }, []);

  if (!hydrated || !authChecked) return <div className="mx-auto max-w-7xl px-4 py-20">Preparing checkout…</div>;
  if (!user) {
    return <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="font-display text-3xl">Sign in to continue</h1>
      <p className="mt-3 text-sm text-mist">Your order will be connected to your Timeora account.</p>
      <Link href="/login?next=%2Fcheckout" className="mt-6 inline-block bg-black px-6 py-3 text-sm text-white">Sign in</Link>
      <p className="mt-4 text-sm"><Link href="/register?next=%2Fcheckout" className="underline">Create an account</Link></p>
    </div>;
  }
  if (items.length === 0) {
    return <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="font-display text-3xl">Your cart is empty</h1>
      <Link href="/shop" className="mt-6 inline-block underline">Return to the shop</Link>
    </div>;
  }

  const subtotal = items.reduce((sum, line) => sum + finalPrice(line.product) * line.quantity, 0);
  const shippingFee = subtotal >= 10_000 ? 0 : 99;

  async function verifyPayment(orderId: string, response: RazorpaySuccess) {
    setPendingVerification({ orderId, response });
    setBusy(true);
    setError("");
    try {
      await browserApi<Order>("/payments/razorpay/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, ...response }),
      });
      setPendingVerification(null);
      clearCart();
      router.replace(`/checkout/confirmation/${orderId}`);
    } catch (verificationError) {
      setError(verificationError instanceof Error
        ? `We could not confirm this payment yet. Order ${orderId.slice(-8).toUpperCase()} remains pending. Retry verification or contact support. ${verificationError.message}`
        : `We could not confirm this payment yet. Order ${orderId.slice(-8).toUpperCase()} remains pending. Retry verification or contact support.`);
    } finally {
      setBusy(false);
    }
  }

  async function placeOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (!paymentConfig.enabled || !paymentConfig.keyId) {
        throw new Error("Online payment is unavailable. Please try again later or contact support.");
      }
      await loadRazorpayCheckout();

      const order = await browserApi<CreatedOrder>("/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map(({ product, quantity }) => ({ productId: product.id, quantity })),
          shippingAddress: address,
          paymentMethod: "razorpay",
        }),
      });

      const checkout = order.razorpay;
      if (!checkout || !window.Razorpay) throw new Error("Razorpay did not return checkout details. Please contact support before retrying.");
      let cancellationStarted = false;
      let verificationStarted = false;
      const cancelPendingOrder = async (reason: string) => {
        if (cancellationStarted || verificationStarted) return;
        cancellationStarted = true;
        try {
          await browserApi(`/orders/${encodeURIComponent(order.id)}/cancel`, { method: "POST" });
          setError(reason);
        } catch (cancelError) {
          setError(cancelError instanceof Error
            ? `Payment was not completed and the pending order could not be cancelled: ${cancelError.message}`
            : "Payment was not completed. Your order is still pending; contact support before retrying.");
        } finally {
          setBusy(false);
        }
      };

      const razorpay = new window.Razorpay({
        key: checkout.keyId,
        amount: checkout.amount,
        currency: checkout.currency,
        name: "TIMEORA",
        description: "Premium watch order",
        order_id: checkout.id,
        prefill: { name: address.name, email: user?.email ?? "", contact: address.phone },
        notes: { app_order_id: order.id },
        theme: { color: "#b08d57" },
        modal: {
          ondismiss: () => { void cancelPendingOrder("Payment window closed. Your order was cancelled and the cart is ready to retry."); },
        },
        handler: (response) => {
          verificationStarted = true;
          void verifyPayment(order.id, response);
        },
      });
      razorpay.on("payment.failed", () => {
        void cancelPendingOrder("Payment failed. Your order was cancelled and your cart is ready to retry.");
      });
      razorpay.open();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not place your order.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl">Checkout</h1>
      <p className="mt-2 text-sm text-mist">Signed in as {user.email}</p>
      <form onSubmit={placeOrder} className="mt-8 grid gap-12 lg:grid-cols-[1fr_360px]">
        <section>
          <h2 className="font-display text-2xl">Delivery address</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm sm:col-span-2">Full name<input required minLength={2} maxLength={80} autoComplete="name" value={address.name} onChange={(event) => setAddress({ ...address, name: event.target.value })} className={field} /></label>
            <label className="block text-sm sm:col-span-2">Address line 1<input required minLength={3} maxLength={120} autoComplete="address-line1" value={address.line1} onChange={(event) => setAddress({ ...address, line1: event.target.value })} className={field} /></label>
            <label className="block text-sm sm:col-span-2">Address line 2 <span className="text-mist">(optional)</span><input maxLength={120} autoComplete="address-line2" value={address.line2} onChange={(event) => setAddress({ ...address, line2: event.target.value })} className={field} /></label>
            <label className="block text-sm">City<input required minLength={2} maxLength={60} autoComplete="address-level2" value={address.city} onChange={(event) => setAddress({ ...address, city: event.target.value })} className={field} /></label>
            <label className="block text-sm">State<input required minLength={2} maxLength={60} autoComplete="address-level1" value={address.state} onChange={(event) => setAddress({ ...address, state: event.target.value })} className={field} /></label>
            <label className="block text-sm">PIN code<input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="postal-code" value={address.pincode} onChange={(event) => setAddress({ ...address, pincode: event.target.value })} className={field} /></label>
            <label className="block text-sm">Phone number<input required type="tel" minLength={10} maxLength={15} autoComplete="tel" value={address.phone} onChange={(event) => setAddress({ ...address, phone: event.target.value })} className={field} /></label>
          </div>
          <fieldset className="mt-8 border border-black/10 p-4">
            <legend className="px-2 font-display text-xl">Payment</legend>
            <p className="text-sm"><strong>Pay online with Razorpay <span className="text-xs text-gold">TEST MODE</span></strong></p>
            <p className="mt-2 text-sm text-mist">Complete your payment securely before the order is confirmed.</p>
            {paymentConfigLoading && <p className="mt-3 text-xs text-mist" role="status">Checking online payment availability…</p>}
            {!paymentConfigLoading && !paymentConfig.enabled && <p className="mt-3 text-xs text-amber-800" role="status">Online payment is not configured. Add Razorpay Test Mode keys to the backend to enable checkout.{paymentConfigError ? ` ${paymentConfigError}` : ""}</p>}
          </fieldset>
          {error && <p role="alert" className="mt-5 text-sm text-red-700">{error}</p>}
          {pendingVerification && <button type="button" disabled={busy} onClick={() => void verifyPayment(pendingVerification.orderId, pendingVerification.response)} className="mt-4 block text-sm underline disabled:opacity-50">Retry payment verification</button>}
          <button disabled={busy || paymentConfigLoading || !paymentConfig.enabled || !paymentConfig.keyId} className="mt-6 w-full bg-black px-4 py-3 text-sm text-white disabled:opacity-50 sm:w-auto">{busy ? "Please wait…" : "Pay securely with Razorpay"}</button>
        </section>
        <aside className="h-fit border border-black/10 p-5">
          <h2 className="font-display text-2xl">Order summary</h2>
          <ul className="mt-4 space-y-3 border-b border-black/10 pb-4 text-sm">
            {items.map(({ product, quantity }) => (
              <li key={product.id} className="grid grid-cols-[64px_1fr_auto] items-center gap-3">
                <div className="flex aspect-square items-center justify-center overflow-hidden bg-stone p-1">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} className="h-full w-full object-contain" />
                  ) : (
                    <WatchFace look={product.look} label={product.name} />
                  )}
                </div>
                <span>{product.name} × {quantity}</span>
                <span>{formatINR(finalPrice(product) * quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-3 text-sm">
            <p className="flex justify-between"><span>Subtotal</span><span>{formatINR(subtotal)}</span></p>
            <p className="flex justify-between"><span>Shipping</span><span>{shippingFee ? formatINR(shippingFee) : "Complimentary"}</span></p>
            <p className="flex justify-between border-t border-black/10 pt-3 font-medium"><span>Total to pay</span><span>{formatINR(subtotal + shippingFee)}</span></p>
          </div>
          <p className="mt-4 text-xs leading-5 text-mist">Stock and current prices are verified by the store when you place the order.</p>
        </aside>
      </form>
    </div>
  );
}
