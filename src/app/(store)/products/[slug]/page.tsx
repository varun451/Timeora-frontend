import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductCard from "@/components/products/ProductCard";
import { ProductActions, WishlistButton } from "@/components/products/ProductActions";
import ProductGallery from "@/components/products/ProductGallery";
import { finalPrice, formatINR } from "@/lib/utils";
import { getProductBySlug, getRelated } from "@/services/product-service";

type Props = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProductBySlug((await params).slug);
  if (!p) return { title: "Watch not found" };
  return {
    title: p.name,
    description: p.description?.slice(0, 160),
    alternates: { canonical: `/products/${p.slug}` },
    openGraph: { title: p.name, description: p.description?.slice(0, 160) },
  };
}

export default async function ProductPage({ params }: Props) {
  const p = await getProductBySlug((await params).slug);
  if (!p) notFound();
  const related = await getRelated(p);
  const specs: Array<[string, string | undefined]> = [
    ["Case material", p.specs?.caseMaterial],
    ["Strap material", p.specs?.strapMaterial],
    ["Dial colour", p.specs?.dialColor],
    ["Movement", p.specs?.movement],
    ["Water resistance", p.specs?.waterResistance],
    ["Warranty", p.specs?.warranty],
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="grid gap-12 md:grid-cols-2">
        <ProductGallery images={p.images} look={p.look} name={p.name} />

        <div>
          <p className="text-sm text-mist">
            {p.brand} · {p.category}
          </p>
          <h1 className="mt-1 font-display text-4xl">{p.name}</h1>
          <p className="mt-4 text-2xl">
            {formatINR(finalPrice(p))}
            {p.discountPercent > 0 && (
              <span className="ml-3 text-base text-mist line-through">{formatINR(p.price)}</span>
            )}
          </p>
          <p className={`mt-2 text-sm ${p.stock > 0 ? "text-charcoal" : "text-mist"}`}>
            {p.stock === 0 ? "Sold out" : p.stock <= 5 ? `Only ${p.stock} left` : "In stock"}
          </p>
          <p className="mt-6 max-w-prose leading-7 text-mist">{p.description}</p>
          <ProductActions product={p} />
          <WishlistButton productId={p.id} />
          <dl className="mt-10 divide-y divide-black/10 border-y border-black/10 text-sm">
            {specs
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="flex justify-between py-3">
                  <dt className="text-mist">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
          </dl>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-8 font-display text-3xl">You may also like</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
            {related.map((r) => (
              <ProductCard key={r.id} product={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
