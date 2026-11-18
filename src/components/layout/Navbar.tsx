"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useStore } from "@/components/store/StoreProvider";

const links = [
  { href: "/shop", label: "Shop all" },
  { href: "/shop?gender=men", label: "Men" },
  { href: "/shop?gender=women", label: "Women" },
  { href: "/account/orders", label: "Track order" },
  { href: "/about", label: "Our story" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { itemCount, hydrated } = useStore();
  const icon = "rounded p-2 transition-colors hover:bg-stone";
  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-white/95 backdrop-blur">
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <button className={`${icon} md:hidden`} onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? "Close menu" : "Open menu"}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
        <Link href="/" aria-label="Timeora home" className="shrink-0">
          <Image src="/timeora-logo.png" alt="Timeora" width={1152} height={768} className="h-[52px] w-[78px] object-contain" />
        </Link>
        <ul className="ml-8 hidden gap-6 text-sm md:flex">
          {links.map((l) => (
            <li key={l.href}><Link href={l.href} className="py-2 hover:text-gold">{l.label}</Link></li>
          ))}
        </ul>
        <form action="/shop" role="search" className="ml-auto hidden items-center border-b border-black/30 focus-within:border-gold sm:flex">
          <label htmlFor="nav-search" className="sr-only">Search watches</label>
          <input id="nav-search" name="q" type="search" placeholder="Search watches" className="w-44 bg-transparent py-1.5 text-sm outline-none lg:w-60" />
          <button type="submit" aria-label="Search" className="p-1.5"><Search size={16} /></button>
        </form>
        <div className="ml-auto flex items-center sm:ml-2">
          <Link href="/account" className={icon} aria-label="Account"><User size={20} /></Link>
          <Link href="/account/wishlist" className={icon} aria-label="Wishlist"><Heart size={20} /></Link>
          <Link href="/cart" className={`${icon} relative`} aria-label={`Cart${hydrated ? `, ${itemCount} items` : ""}`}>
            <ShoppingBag size={20} />
            {hydrated && itemCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] text-black">{itemCount}</span>}
          </Link>
        </div>
      </nav>
      {open && (
        <div id="mobile-menu" className="border-t border-black/10 bg-white px-4 py-4 md:hidden">
          <form action="/shop" role="search" className="mb-4 flex border-b border-black/30">
            <label htmlFor="m-search" className="sr-only">Search watches</label>
            <input id="m-search" name="q" type="search" placeholder="Search watches" className="w-full py-2 text-sm outline-none" />
            <button type="submit" aria-label="Search" className="p-2"><Search size={16} /></button>
          </form>
          <ul className="space-y-1">
            {links.map((l) => (
              <li key={l.href}><Link href={l.href} onClick={() => setOpen(false)} className="block py-2 text-lg font-display">{l.label}</Link></li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
