import Link from "next/link";
import ProductCard from "@/components/products/ProductCard";
import { getFilterOptions, parseQuery, queryProducts } from "@/services/product-service";

export const metadata = { title: "Shop all watches" };
export const dynamic = "force-dynamic";

const field = "mt-1 w-full border border-black/15 bg-white px-3 py-2 text-sm";

export default async function ShopPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams;
  const q = parseQuery(raw);
  const [{ items, total, page, pages }, { brands }] = await Promise.all([queryProducts(q), getFilterOptions()]);
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(raw)) if (typeof v === "string" && v && k !== "page") sp.set(k, v);
    sp.set("page", String(p));
    return `/shop?${sp}`;
  };
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl">Shop all watches</h1>
      <p className="mt-1 text-sm text-mist">{total} {total === 1 ? "watch" : "watches"}</p>
      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside>
          <form action="/shop" className="space-y-3">
            <label className="block text-xs font-medium">Search
              <input name="q" type="search" defaultValue={q.q} className={field} />
            </label>
            <label className="block text-xs font-medium">Sort by
              <select name="sort" defaultValue={q.sort} className={field}>
                <option value="newest">Newest</option>
                <option value="price_asc">Price, low to high</option><option value="price_desc">Price, high to low</option>
              </select>
            </label>
            <label className="block text-xs font-medium">Category
              <select name="gender" defaultValue={q.gender ?? ""} className={field}>
                <option value="">All</option><option value="men">Men</option><option value="women">Women</option>
              </select>
            </label>
            <label className="block text-xs font-medium">Brand
              <select name="brand" defaultValue={q.brand ?? ""} className={field}><option value="">All</option>{brands.map((b) => <option key={b}>{b}</option>)}</select>
            </label>
            <div>
              <p className="text-xs font-medium">Price (₹)</p>
              <div className="mt-1 flex gap-2">
                <label className="block min-w-0 flex-1 text-xs">Min ₹
                  <input name="minPrice" type="number" min={0} defaultValue={q.minPrice} className="mt-1 w-full border border-black/15 bg-white px-3 py-2 text-sm" />
                </label>
                <label className="block min-w-0 flex-1 text-xs">Max ₹
                  <input name="maxPrice" type="number" min={0} defaultValue={q.maxPrice} className="mt-1 w-full border border-black/15 bg-white px-3 py-2 text-sm" />
                </label>
              </div>
            </div>
            <label className="flex items-center gap-2 py-1 text-xs">
              <input type="checkbox" name="inStock" value="true" defaultChecked={!!q.inStock} className="accent-blue-600" /> In stock only
            </label>
            <button className="w-full bg-black py-3 text-sm text-white hover:bg-charcoal">Apply</button>
            <Link href="/shop" className="block text-center text-xs underline underline-offset-2">Clear all</Link>
          </form>
        </aside>
        <div>
          {items.length === 0 ? (
            <div className="py-20 text-center"><p className="font-display text-2xl">No watches match these filters</p><Link href="/shop" className="mt-4 inline-block underline">Clear filters</Link></div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 xl:grid-cols-3">{items.map((p) => <ProductCard key={p.id} product={p} />)}</div>
          )}
          {pages > 1 && (
            <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-6 text-sm">
              {page > 1 && <Link href={href(page - 1)} className="underline">Previous</Link>}
              <span>Page {page} of {pages}</span>
              {page < pages && <Link href={href(page + 1)} className="underline">Next</Link>}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
