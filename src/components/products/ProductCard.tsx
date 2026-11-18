import Link from "next/link";
import WatchFace from "@/components/ui/WatchFace";
import { finalPrice, formatINR } from "@/lib/utils";
import type { Product } from "@/types/product";

export default function ProductCard({ product }: { product: Product }) {
  const sold = product.stock === 0;
  const low = product.stock > 0 && product.stock <= 5;
  const hasImage = product.images && product.images.length > 0;

  return (
    <article className="group">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-stone transition-colors group-hover:bg-[#e9e9e5] flex items-center justify-center">
          {hasImage ? (
            <img
              src={product.images![0]}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="px-12 py-6 w-full h-full flex items-center justify-center">
              <WatchFace look={product.look} label={product.name} />
            </div>
          )}

          {product.discountPercent > 0 && (
            <span className="absolute left-3 top-3 bg-black px-2 py-1 text-xs text-white z-10">
              {product.discountPercent}% off
            </span>
          )}
          {(sold || low) && (
            <span className="absolute bottom-3 left-3 text-xs text-mist bg-white/80 px-2 py-0.5 z-10">
              {sold ? "Sold out" : `Only ${product.stock} left`}
            </span>
          )}
        </div>
        <div className="mt-4">
          <div>
            <p className="text-sm text-mist">{product.category}</p>
            <h3 className="font-display text-lg leading-snug">{product.name}</h3>
          </div>
        </div>
        <p className="mt-1 text-sm">
          <span className="font-medium">{formatINR(finalPrice(product))}</span>
          {product.discountPercent > 0 && <span className="ml-2 text-mist line-through">{formatINR(product.price)}</span>}
        </p>
      </Link>
    </article>
  );
}
