"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/applications", label: "Seller Applications" },
  { href: "/admin/sellers", label: "Sellers" },
  { href: "/admin/users", label: "Customers" },
  { href: "/admin/products/approvals", label: "Product Approvals" },
  { href: "/admin/products/new", label: "Add Watch" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-1 border-b border-black/10 pb-4 mb-8 text-sm">
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-4 py-2 text-xs uppercase tracking-wider transition-colors ${
              isActive
                ? "bg-black text-white"
                : "bg-stone text-charcoal hover:bg-black/10"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
