import type { Metadata } from "next";
import AdminOrdersPanel from "@/components/admin/AdminOrdersPanel";
import AdminNav from "@/components/admin/AdminNav";

export const metadata: Metadata = { title: "Manage orders" };

export default function AdminOrdersPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-mist">Store administration</p>
          <h1 className="mt-1 font-display text-4xl">Manage orders</h1>
        </div>
      </div>
      <AdminNav />
      <div className="mt-6"><AdminOrdersPanel /></div>
    </div>
  );
}
