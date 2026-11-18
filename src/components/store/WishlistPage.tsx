"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ProductCard from "@/components/products/ProductCard";
import { browserApi, BrowserApiError } from "@/lib/browser-api";
import type { Product } from "@/types/product";

export default function WishlistPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [message, setMessage] = useState("Loading your wishlist…");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    browserApi<Product[]>("/wishlist").then((result) => {
      if (!active) return;
      setProducts(result);
      setMessage(result.length ? "" : "Your wishlist is empty.");
    }).catch((error: unknown) => {
      if (!active) return;
      setMessage(error instanceof BrowserApiError && error.status === 401
        ? "Sign in to view your wishlist."
        : error instanceof Error ? error.message : "Could not load your wishlist.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function remove(productId: string) {
    try {
      await browserApi(`/wishlist/${encodeURIComponent(productId)}`, { method: "DELETE" });
      setProducts((current) => current.filter((product) => product.id !== productId));
      if (products.length === 1) setMessage("Your wishlist is empty.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update your wishlist.");
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <p className="text-sm"><Link href="/account" className="underline">My account</Link></p>
      <h1 className="mt-3 font-display text-4xl">My wishlist</h1>
      {message && <div className="py-12 text-center text-sm text-mist">
        <p>{message}</p>
        {!loading && message === "Sign in to view your wishlist." && <Link href="/login?next=%2Faccount%2Fwishlist" className="mt-4 inline-block underline">Sign in</Link>}
        {!loading && products.length === 0 && !message.includes("Sign in") && <Link href="/shop" className="mt-4 inline-block underline">Explore watches</Link>}
      </div>}
      {products.length > 0 && <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
        {products.map((product) => <div key={product.id}>
          <ProductCard product={product} />
          <button onClick={() => remove(product.id)} className="mt-3 text-sm underline underline-offset-4">Remove from wishlist</button>
        </div>)}
      </div>}
    </div>
  );
}
