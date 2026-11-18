import type { Metadata } from "next";
import WatchForm from "@/components/seller/WatchForm";

export const metadata: Metadata = {
  title: "Add product | Seller Dashboard",
};

export default function NewSellerProductPage() {
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-3 text-xs text-mist">
          <span>Products</span>
          <span aria-hidden="true">&gt;</span>
          <span className="font-medium text-charcoal">Add Product</span>
        </div>
        <h1 className="mt-2 font-display text-4xl">Add Product</h1>
        <p className="mt-1 text-sm text-mist">List a new watch on Timeora.</p>
      </div>

      <WatchForm mode="create" />
    </div>
  );
}
