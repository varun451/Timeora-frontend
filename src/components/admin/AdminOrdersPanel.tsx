"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { BrowserApiError, browserApi } from "@/lib/browser-api";
import { formatINR } from "@/lib/utils";
import type { Order } from "@/types/order";

import type { User } from "@/types/user";
type Screen = "checking" | "sign-in" | "forbidden" | "orders";
type StatusFilter = "" | Order["status"];
type OrderPage = { items: Order[]; total: number; page: number; pages: number };

const nextStatus: Partial<Record<Order["status"], Order["status"]>> = {
  pending: "confirmed",
  confirmed: "processing",
  processing: "shipped",
  shipped: "delivered",
};

const labelClass = "block text-sm font-medium";
const inputClass = "mt-1 w-full border border-black/20 bg-white px-3 py-2.5 text-sm";

function messageOf(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

export default function AdminOrdersPanel() {
  const [screen, setScreen] = useState<Screen>("checking");
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [updating, setUpdating] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [credentials, setCredentials] = useState({ email: "", password: "" });

  const loadOrders = useCallback(async (requestedPage: number, requestedStatus: StatusFilter) => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(requestedPage), limit: "25" });
    if (requestedStatus) params.set("status", requestedStatus);
    try {
      const result = await browserApi<OrderPage>(`/orders?${params}`);
      setOrders(result.items);
      setPage(result.page);
      setPages(result.pages);
      setTotal(result.total);
    } catch (requestError) {
      if (requestError instanceof BrowserApiError && requestError.status === 403) {
        setScreen("forbidden");
      } else {
        setError(messageOf(requestError));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const acceptUser = useCallback((account: User) => {
    setUser(account);
    if (account.role !== "super_admin" && account.role !== "admin") {
      setScreen("forbidden");
      return;
    }
    setScreen("orders");
    void loadOrders(1, "");
  }, [loadOrders]);

  useEffect(() => {
    let active = true;
    browserApi<User>("/auth/me").then((account) => {
      if (active) acceptUser(account);
    }).catch((requestError: unknown) => {
      if (!active) return;
      if (requestError instanceof BrowserApiError && requestError.status === 401) {
        setScreen("sign-in");
        return;
      }
      setError(messageOf(requestError));
      setScreen("sign-in");
    });
    return () => { active = false; };
  }, [acceptUser]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setAuthenticating(true);
    try {
      const account = await browserApi<User>("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      acceptUser(account);
    } catch (requestError) {
      setError(messageOf(requestError));
    } finally {
      setAuthenticating(false);
    }
  }

  async function advance(order: Order) {
    const status = nextStatus[order.status];
    if (!status || (order.paymentMethod === "razorpay" && order.paymentStatus !== "paid")) return;
    setUpdating(order.id);
    setNotice("");
    setError("");
    try {
      const updated = await browserApi<Order>(`/orders/${encodeURIComponent(order.id)}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setOrders((current) => current.map((item) => item.id === updated.id ? updated : item));
      setNotice(`Order #${updated.id.slice(-8).toUpperCase()} marked ${updated.status}.`);
    } catch (requestError) {
      setError(messageOf(requestError));
    } finally {
      setUpdating("");
    }
  }

  if (screen === "checking") return <p className="py-12 text-center text-sm text-mist">Checking administrator access…</p>;

  if (screen === "sign-in") return (
    <section className="mx-auto max-w-md border border-black/10 bg-stone p-6 sm:p-8">
      <h2 className="font-display text-3xl">Admin sign in</h2>
      <p className="mt-2 text-sm leading-6 text-mist">Sign in with an administrator account to manage orders.</p>
      <form className="mt-6 space-y-4" onSubmit={signIn}>
        <label className={labelClass}>Email
          <input className={inputClass} type="email" autoComplete="email" required value={credentials.email} onChange={(event) => setCredentials((current) => ({ ...current, email: event.target.value }))} />
        </label>
        <label className={labelClass}>Password
          <input className={inputClass} type="password" autoComplete="current-password" required value={credentials.password} onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))} />
        </label>
        {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
        <button disabled={authenticating} className="w-full bg-black px-5 py-3 text-sm text-white disabled:opacity-50">{authenticating ? "Signing in…" : "Sign in"}</button>
      </form>
    </section>
  );

  if (screen === "forbidden") return (
    <section className="mx-auto max-w-xl border border-black/10 p-8 text-center">
      <h2 className="font-display text-3xl">Administrator access required</h2>
      <p className="mt-3 text-sm text-mist">Sign in with an administrator account to view and fulfil orders.</p>
      {user && <p className="mt-3 text-xs text-mist">Currently signed in as {user.email}.</p>}
    </section>
  );

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-sm text-mist">Signed in as {user?.email}</p>
          <p className="mt-1 text-sm">{total} {total === 1 ? "order" : "orders"}</p>
        </div>
        <label className="text-sm">Filter by status
          <select value={statusFilter} onChange={(event) => {
            const value = event.target.value as StatusFilter;
            setStatusFilter(value);
            void loadOrders(1, value);
          }} className="ml-2 border border-black/20 bg-white px-3 py-2">
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
      </div>

      {error && <p role="alert" className="mt-5 border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {notice && <p role="status" className="mt-5 border border-green-200 bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
      {loading && <p role="status" className="py-8 text-center text-sm text-mist">Loading orders…</p>}
      {!loading && orders.length === 0 && <p className="py-16 text-center text-sm text-mist">No orders found.</p>}

      <ul className="mt-6 space-y-4">
        {orders.map((order) => {
          const next = nextStatus[order.status];
          const awaitingPayment = order.paymentMethod === "razorpay" && order.paymentStatus !== "paid";
          return <li key={order.id} className="border border-black/10 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl">Order #{order.id.slice(-8).toUpperCase()}</h2>
                <p className="mt-1 text-xs text-mist">{new Date(order.createdAt).toLocaleString("en-IN")}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">{formatINR(order.total)}</p>
                <p className="mt-1 text-xs capitalize text-mist">{order.paymentMethod === "razorpay" ? `Razorpay · ${order.paymentStatus}` : "Cash on delivery"}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-5 border-t border-black/10 pt-5 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-medium">Items</h3>
                <ul className="mt-2 space-y-1 text-sm text-mist">
                  {order.items.map((item, index) => <li key={`${item.productId}-${index}`}>{item.name} × {item.quantity} · {formatINR(item.unitPrice * item.quantity)}</li>)}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-medium">Ship to</h3>
                <address className="mt-2 text-sm not-italic leading-6 text-mist">
                  {order.shippingAddress.name} · {order.shippingAddress.phone}<br />
                  {order.shippingAddress.line1}{order.shippingAddress.line2 && `, ${order.shippingAddress.line2}`}<br />
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
                </address>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-4">
              <p className="text-sm">Status: <span className="font-medium capitalize">{order.status}</span></p>
              {awaitingPayment
                ? <p className="text-xs text-amber-800">Awaiting verified payment; fulfilment is locked.</p>
                : next
                  ? <button disabled={updating === order.id} onClick={() => void advance(order)} className="bg-black px-4 py-2.5 text-sm text-white disabled:opacity-50">
                    {updating === order.id ? "Updating…" : `Mark ${next}`}
                  </button>
                  : <span className="text-xs text-mist">No further status updates</span>}
            </div>
          </li>;
        })}
      </ul>

      {pages > 1 && <nav aria-label="Order pages" className="mt-8 flex items-center justify-center gap-6 text-sm">
        <button disabled={page <= 1 || loading} onClick={() => void loadOrders(page - 1, statusFilter)} className="underline disabled:opacity-40">Previous</button>
        <span>Page {page} of {pages}</span>
        <button disabled={page >= pages || loading} onClick={() => void loadOrders(page + 1, statusFilter)} className="underline disabled:opacity-40">Next</button>
      </nav>}

      <p className="mt-8 text-sm"><Link href="/admin/products/new" className="underline">Add a watch to the catalogue</Link></p>
    </section>
  );
}
