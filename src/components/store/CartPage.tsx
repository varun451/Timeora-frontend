"use client";

import Link from "next/link";
import { useStore } from "@/components/store/StoreProvider";
import { finalPrice, formatINR } from "@/lib/utils";
import WatchFace from "@/components/ui/WatchFace";

export default function CartPage() {
  const { items, hydrated, error, setQuantity, removeFromCart } = useStore();
  if (!hydrated) return <div className="mx-auto max-w-7xl px-4 py-20">Loading your cart…</div>;
  const subtotal = items.reduce((sum, line) => sum + finalPrice(line.product) * line.quantity, 0);
  const shipping = subtotal >= 10_000 || subtotal === 0 ? 0 : 99;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl">Your cart</h1>
      {error && <p role="status" className="mt-3 text-sm text-amber-800">{error}</p>}
      {items.length === 0 ? (
        <div className="py-20 text-center"><p className="font-display text-2xl">Your cart is empty</p><Link href="/shop" className="mt-4 inline-block bg-black px-6 py-3 text-sm text-white">Explore watches</Link></div>
      ) : (
        <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_320px]">
          <ul className="divide-y divide-black/10 border-y border-black/10">
            {items.map(({ product, quantity }) => (
              <li key={product.id} className="grid grid-cols-[96px_1fr] gap-4 py-5 sm:grid-cols-[120px_1fr_auto]">
                <Link href={`/products/${product.slug}`} className="flex aspect-[4/5] items-center justify-center overflow-hidden bg-stone p-3">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} className="h-full w-full object-contain" />
                  ) : (
                    <WatchFace look={product.look} label={product.name} />
                  )}
                </Link>
                <div>
                  <p className="text-xs text-mist">{product.brand}</p>
                  <Link href={`/products/${product.slug}`} className="font-display text-xl">{product.name}</Link>
                  <p className="mt-1 text-sm">{formatINR(finalPrice(product))}</p>
                  {product.stock === 0 && <p className="mt-2 text-xs text-red-700">Currently out of stock. Remove this item to continue.</p>}
                  {quantity > product.stock && product.stock > 0 && <p className="mt-2 text-xs text-red-700">Only {product.stock} left. Update the quantity to continue.</p>}
                  <div className="mt-3 flex items-center gap-3 text-sm">
                    <label>Qty <select aria-label={`Quantity for ${product.name}`} value={quantity} onChange={(event) => setQuantity(product.id, Number(event.target.value))} className="ml-1 border border-black/20 px-2 py-1">
                      {Array.from({ length: Math.max(quantity, Math.min(product.stock, 10)) }, (_, index) => index + 1).map((count) => <option key={count} value={count}>{count}</option>)}
                    </select></label>
                    <button onClick={() => removeFromCart(product.id)} className="underline underline-offset-4">Remove</button>
                  </div>
                </div>
                <p className="col-start-2 text-sm font-medium sm:col-start-auto">{formatINR(finalPrice(product) * quantity)}</p>
              </li>
            ))}
          </ul>
          <aside className="h-fit border border-black/10 p-5">
            <h2 className="font-display text-2xl">Order summary</h2>
            <div className="mt-5 space-y-3 text-sm">
              <p className="flex justify-between"><span>Subtotal</span><span>{formatINR(subtotal)}</span></p>
              <p className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? "Complimentary" : formatINR(shipping)}</span></p>
              <p className="flex justify-between border-t border-black/10 pt-3 font-medium"><span>Total</span><span>{formatINR(subtotal + shipping)}</span></p>
            </div>
            <Link href="/checkout" className={`mt-6 block bg-black px-4 py-3 text-center text-sm text-white ${items.some((line) => line.product.stock < line.quantity || line.product.stock === 0) ? "pointer-events-none opacity-40" : ""}`} aria-disabled={items.some((line) => line.product.stock < line.quantity || line.product.stock === 0)}>
              Continue to checkout
            </Link>
            <p className="mt-3 text-xs leading-5 text-mist">Final price and availability are confirmed securely when your online payment is processed.</p>
          </aside>
        </div>
      )}
    </div>
  );
}
