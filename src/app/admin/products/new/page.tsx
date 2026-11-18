import type { Metadata } from "next";
import AddWatchPanel from "@/components/admin/AddWatchPanel";
import AdminNav from "@/components/admin/AdminNav";

export const metadata: Metadata = { title: "Add a watch" };

export default function NewWatchPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-mist">Catalogue administration</p>
          <h1 className="mt-1 font-display text-4xl">Add a watch</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-mist">
            The watch is saved in the backend catalogue, then appears in the storefront through the product API.
          </p>
        </div>
      </div>
      <AdminNav />
      <div className="mt-6"><AddWatchPanel /></div>
    </div>
  );
}
