"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { browserApi, BrowserApiError } from "@/lib/browser-api";
import { useStore } from "@/components/store/StoreProvider";
import type { Product } from "@/types/product";

export function ProductActions({ product }: { product: Product }) {
  const { addToCart } = useStore();
  const router = useRouter();
  const [message, setMessage] = useState("");

  const add = (goToCheckout = false) => {
    if (!addToCart(product)) {
      setMessage(`Only ${product.stock} available. Your cart may already contain the remaining stock.`);
      return;
    }
    if (goToCheckout) {
      router.push("/checkout");
      return;
    }
    setMessage("Added to your cart.");
  };

  return (
    <div>
      <div className="mt-8 flex gap-3">
        <button onClick={() => add()} disabled={product.stock === 0} className="flex-1 bg-black py-3 text-sm text-white disabled:opacity-40">Add to cart</button>
        <button onClick={() => add(true)} disabled={product.stock === 0} className="flex-1 border border-black py-3 text-sm disabled:opacity-40">Buy now</button>
      </div>
      <p className="mt-2 min-h-5 text-xs text-mist" aria-live="polite">{message}</p>
    </div>
  );
}

export function WishlistButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");
  const toggle = async () => {
    setMessage("");
    try {
      await browserApi(`/wishlist/${encodeURIComponent(productId)}`, {
        method: saved ? "DELETE" : "POST",
      });
      setSaved(!saved);
      setMessage(saved ? "Removed from wishlist." : "Saved to wishlist.");
    } catch (error) {
      if (error instanceof BrowserApiError && error.status === 401) {
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      setMessage(error instanceof Error ? error.message : "Could not update your wishlist.");
    }
  };

  return (
    <div className="mt-3">
      <button onClick={toggle} aria-pressed={saved} className="inline-flex items-center gap-2 text-sm underline underline-offset-4">
        <Heart size={16} className={saved ? "fill-gold text-gold" : ""} /> {saved ? "Saved to wishlist" : "Add to wishlist"}
      </button>
      <p className="mt-1 min-h-5 text-xs text-mist" aria-live="polite">{message}</p>
    </div>
  );
}
