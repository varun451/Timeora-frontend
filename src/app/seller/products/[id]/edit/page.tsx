"use client";

import { use, useEffect, useState } from "react";
import WatchForm from "@/components/seller/WatchForm";
import { browserApi } from "@/lib/browser-api";
import type { Product } from "@/types/product";

export default function EditSellerProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    browserApi<Product>(`/seller/products/${id}`)
      .then((data) => {
        if (active) setProduct(data);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Failed to load watch");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return <div className="py-20 text-center text-sm text-mist">Loading watch details…</div>;
  }

  if (error || !product) {
    return (
      <div className="border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {error || "Watch not found."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-black/10 pb-6">
        <p className="text-xs uppercase tracking-widest text-gold font-medium">Edit Timepiece</p>
        <h1 className="font-display text-4xl mt-1">Edit {product.name}</h1>
        <p className="text-xs text-mist mt-1 max-w-xl">
          Modify your watch details, pricing, stock, or photography. Changes are published to the storefront immediately.
        </p>
      </div>

      <WatchForm mode="edit" initialData={product} />
    </div>
  );
}
