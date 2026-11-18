import Link from "next/link";
import LiveClock from "@/components/ui/LiveClock";
import ProductCard from "@/components/products/ProductCard";
import NewsletterForm from "@/components/store/NewsletterForm";
import { getBestSellers, getNewArrivals } from "@/services/product-service";
import type { Product } from "@/types/product";

export const dynamic = "force-dynamic";

function Section({ title, href, products }: { title: string; href: string; products: Product[] }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="mb-8 flex items-end justify-between">
        <h2 className="font-display text-3xl sm:text-4xl">{title}</h2>
        <Link href={href} className="text-sm underline underline-offset-4 hover:text-gold">View all</Link>
      </div>
      {products.length === 0 ? (
        <p className="text-mist">No watches here yet. Check back soon.</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </section>
  );
}

const assurances = [
  { title: "Considered materials", detail: "Compare case, strap and dial specifications on every watch." },
  { title: "A two-year warranty", detail: "Every Timeora watch is covered by a two-year warranty." },
  { title: "Secure online checkout", detail: "Complete your payment securely with Razorpay before your order is confirmed." },
];

export default async function HomePage() {
  const [best, fresh] = await Promise.all([getBestSellers(), getNewArrivals()]);
  return (
    <>
      <section className="bg-charcoal text-stone">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24">
          <div>
            <h1 className="font-display text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">Made to keep time, and to be handed down.</h1>
            <p className="mt-6 max-w-md text-stone/75">Automatic movements, sapphire crystal and a two-year warranty on every Timeora watch.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="bg-gold px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-white">Shop the collection</Link>
              <Link href="/about" className="border border-stone/40 px-6 py-3 text-sm transition-colors hover:border-gold hover:text-gold">Read our story</Link>
            </div>
          </div>
          <div className="mx-auto aspect-square w-full max-w-md"><LiveClock /></div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 pt-16 sm:px-6 md:grid-cols-2">
        {[{ t: "Men's watches", h: "/shop?gender=men", d: "Divers, chronographs and dress automatics." }, { t: "Women's watches", h: "/shop?gender=women", d: "Slim cases and quartz movements for daily wear." }].map((c) => (
          <Link key={c.t} href={c.h} className="group flex min-h-56 flex-col justify-end bg-stone p-8 transition-colors hover:bg-charcoal hover:text-stone">
            <h2 className="font-display text-3xl">{c.t}</h2>
            <p className="mt-1 text-sm text-mist group-hover:text-stone/70">{c.d}</p>
          </Link>
        ))}
      </section>

      <Section title="Best sellers" href="/shop?sort=popular" products={best} />
      <div className="bg-stone">
        <Section title="New arrivals" href="/shop?sort=newest" products={fresh} />
      </div>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-20 sm:px-6 md:grid-cols-2">
        <h2 className="font-display text-4xl leading-tight">We make fewer watches, and we finish each one by hand.</h2>
        <p className="max-w-prose leading-7 text-mist">Timeora began with one idea: a watch should still run, and still look right, long after the trend that sold it has passed. Every model is tested for accuracy and water resistance before it ships, and every one is covered by a two-year warranty.</p>
      </section>

      <section className="bg-charcoal py-16 text-stone">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 md:grid-cols-3">
          {assurances.map((item) => (
            <div key={item.title}>
              <h2 className="font-display text-2xl">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-stone/70">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <h2 className="font-display text-3xl">New releases, before anyone else</h2>
        <NewsletterForm />
      </section>
    </>
  );
}
