import Image from "next/image";
import Link from "next/link";

const cols = [
  { title: "Shop", items: [["All watches", "/shop"], ["Men", "/shop?gender=men"], ["Women", "/shop?gender=women"]] },
  { title: "Help", items: [["Contact us", "/contact"], ["FAQ", "/faq"], ["Shipping", "/shipping-policy"], ["Returns and refunds", "/return-policy"]] },
  { title: "Company", items: [["Our story", "/about"], ["Privacy policy", "/privacy-policy"], ["Terms and conditions", "/terms"]] },
];

export default function Footer() {
  return (
    <footer className="bg-black text-stone">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Image src="/timeora-logo.png" alt="Timeora" width={1152} height={768} className="h-[80px] w-[120px] object-contain object-left" />
          <p className="mt-3 max-w-xs text-sm text-stone/70">Considered watches, delivered across India with a two-year warranty.</p>
          <Link href="/contact" className="mt-5 inline-block text-sm underline underline-offset-4 hover:text-gold">Get in touch</Link>
        </div>
        {cols.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <h2 className="font-display text-lg">{c.title}</h2>
            <ul className="mt-3 space-y-2 text-sm text-stone/70">
              {c.items.map(([label, href]) => (
                <li key={label}><Link href={href} className="hover:text-gold">{label}</Link></li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <p className="border-t border-white/10 py-5 text-center text-xs text-stone/50">© {new Date().getFullYear()} Timeora. All rights reserved.</p>
    </footer>
  );
}
