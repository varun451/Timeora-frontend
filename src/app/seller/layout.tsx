"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Boxes,
  ExternalLink,
  LogOut,
  PlusCircle,
  UserRound,
} from "lucide-react";
import { browserApi, BrowserApiError } from "@/lib/browser-api";
import type { User } from "@/types/user";

interface SellerProfile {
  store: {
    id: string;
    storeName: string;
    slug: string;
    ownerName: string;
    status: "active" | "suspended";
    commissionBps: number;
  };
}

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [store, setStore] = useState<SellerProfile["store"] | null>(null);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkAuth() {
      try {
        const currentUser = await browserApi<User>("/auth/me");
        if (!active) return;
        setUser(currentUser);

        if (currentUser.role !== "seller" && currentUser.role !== "super_admin" && currentUser.role !== "admin") {
          setForbidden(true);
          return;
        }

        const dashboard = await browserApi<SellerProfile>("/seller/dashboard");
        if (active) setStore(dashboard.store);
      } catch (err) {
        if (!active) return;
        if (err instanceof BrowserApiError && err.status === 401) {
          router.replace("/login?next=/seller");
          return;
        }
        setForbidden(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    void checkAuth();
    return () => {
      active = false;
    };
  }, [router]);

  async function logout() {
    try {
      await browserApi("/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } catch {
      router.replace("/login");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-white text-sm text-mist">
        Authenticating seller portal…
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
        <h1 className="font-display text-3xl">Seller Access Required</h1>
        <p className="mt-2 max-w-md text-sm text-mist">
          You must be an approved, active seller on Timeora to access the vendor dashboard.
        </p>
        <div className="mt-6 flex gap-4">
          <Link href="/account/become-seller" className="bg-black px-6 py-2.5 text-xs uppercase tracking-wider text-white">
            Apply to Become a Seller &rarr;
          </Link>
          <Link href="/account" className="border border-black/20 px-5 py-2.5 text-xs uppercase tracking-wider">
            My Account
          </Link>
        </div>
      </div>
    );
  }

  const navLinks = [
    { href: "/seller", label: "Dashboard", icon: BarChart3, active: pathname === "/seller" },
    {
      href: "/seller/products",
      label: "My Products",
      icon: Boxes,
      active: pathname.startsWith("/seller/products") && pathname !== "/seller/products/new",
    },
    { href: "/seller/products/new", label: "Add Product", icon: PlusCircle, active: pathname === "/seller/products/new" },
    { href: "/seller/sales", label: "Sales History", icon: BarChart3, active: pathname === "/seller/sales" },
    { href: "/seller/profile", label: "Profile", icon: UserRound, active: pathname === "/seller/profile" },
  ];

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-white lg:flex-row">
      <aside className="flex shrink-0 flex-col border-b border-black/10 bg-white lg:w-56 lg:border-b-0 lg:border-r">
        <div className="border-b border-black/10 px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-gold">Vendor Portal</p>
        </div>

        {store && (
          <div className="border-b border-black/10 bg-stone/50 px-5 py-3">
            <p className="truncate text-xs font-semibold text-charcoal">{store.storeName}</p>
            <p className="mt-0.5 truncate text-[11px] text-mist">Vendor Account</p>
          </div>
        )}

        <nav aria-label="Vendor navigation" className="flex gap-1 overflow-x-auto p-2 lg:flex-col lg:gap-1 lg:p-3">
          {navLinks.map(({ href, label, icon: Icon, active }) => (
            <Link
              key={label}
              href={href}
              className={`flex shrink-0 items-center gap-3 px-3 py-2.5 text-[11px] uppercase tracking-wider transition-colors ${
                active ? "bg-black font-medium text-white" : "text-charcoal hover:bg-stone"
              }`}
            >
              <Icon size={16} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto hidden border-t border-black/10 p-3 lg:block">
          <Link
            href="/shop"
            className="flex items-center gap-3 px-3 py-2.5 text-[11px] uppercase tracking-wider text-mist transition-colors hover:text-black"
          >
            <ExternalLink size={16} />
            <span>View Storefront</span>
          </Link>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-[11px] uppercase tracking-wider text-charcoal transition-colors hover:bg-stone"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:px-8 lg:py-5">
        <div className="mx-auto w-full max-w-7xl">{children}</div>
        <div className="mt-8 border-t border-black/10 pt-3 lg:hidden">
          <button onClick={logout} className="flex items-center gap-2 py-2 text-xs uppercase tracking-wider text-mist">
            <LogOut size={15} />
            Logout
          </button>
        </div>
        <span className="sr-only">Signed in as {user?.name}</span>
      </main>
    </div>
  );
}
