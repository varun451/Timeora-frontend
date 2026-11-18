"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BrowserApiError, browserApi } from "@/lib/browser-api";
import type { Gender, Product, ProductSpecs, WatchLook } from "@/types/product";

import type { User } from "@/types/user";
type Screen = "checking" | "sign-in" | "forbidden" | "form";

const input = "mt-1 w-full border border-black/20 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-gold";
const label = "block text-sm font-medium";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

function readNumber(value: FormDataEntryValue | null, label: string) {
  const result = Number(value);
  if (!Number.isFinite(result)) throw new Error(`${label} must be a valid number.`);
  return result;
}

function optionalText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || undefined;
}

function LoginForm({ onSuccess }: { onSuccess: (user: User) => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const data = new FormData(event.currentTarget);

    try {
      const user = await browserApi<User>("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: String(data.get("email") ?? ""), password: String(data.get("password") ?? "") }),
      });
      onSuccess(user);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mx-auto max-w-md border border-black/10 bg-stone p-6 sm:p-8">
      <h2 className="font-display text-3xl">Admin sign in</h2>
      <p className="mt-2 text-sm leading-6 text-mist">Sign in with an administrator account to add a watch to the catalogue.</p>
      <form className="mt-6 space-y-4" onSubmit={submit}>
        <label className={label} htmlFor="admin-email">Email
          <input className={input} id="admin-email" name="email" type="email" autoComplete="email" required />
        </label>
        <label className={label} htmlFor="admin-password">Password
          <input className={input} id="admin-password" name="password" type="password" autoComplete="current-password" required />
        </label>
        {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
        <button className="w-full bg-black px-5 py-3 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50" disabled={pending} type="submit">
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </section>
  );
}

function WatchForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const values = new FormData(event.currentTarget);

    try {
      const specs: ProductSpecs = {
        caseMaterial: optionalText(values.get("caseMaterial")),
        strapMaterial: optionalText(values.get("strapMaterial")),
        dialColor: optionalText(values.get("dialColor")),
        movement: optionalText(values.get("movement")),
        waterResistance: optionalText(values.get("waterResistance")),
        warranty: optionalText(values.get("warranty")),
      };
      const look: WatchLook = {
        dial: String(values.get("dial") ?? ""),
        case: String(values.get("case") ?? ""),
        strap: String(values.get("strap") ?? ""),
      };
      const product = {
        name: String(values.get("name") ?? "").trim(),
        description: String(values.get("description") ?? "").trim(),
        brand: String(values.get("brand") ?? "").trim(),
        category: String(values.get("category") ?? "").trim(),
        gender: String(values.get("gender") ?? "men") as Gender,
        price: readNumber(values.get("price"), "Price"),
        discountPercent: readNumber(values.get("discountPercent"), "Discount"),
        stock: readNumber(values.get("stock"), "Stock"),
        // This screen creates storefront watches, so successful submissions
        // are always public and the redirect below can never lead to a 404.
        published: true,
        look,
        specs: Object.fromEntries(Object.entries(specs).filter(([, value]) => value)) as ProductSpecs,
        images: String(values.get("images") ?? "").split(/\r?\n|,/).map((url) => url.trim()).filter(Boolean),
      };
      const created = await browserApi<Product>("/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      });

      router.push(`/products/${encodeURIComponent(created.slug)}`);
      router.refresh();
    } catch (cause) {
      setError(errorMessage(cause));
      setPending(false);
    }
  }

  return (
    <form className="mx-auto max-w-4xl space-y-8" onSubmit={submit}>
      <section className="border border-black/10 p-5 sm:p-8">
        <h2 className="font-display text-2xl">Watch details</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className={label} htmlFor="watch-name">Name
            <input className={input} id="watch-name" name="name" maxLength={120} required />
          </label>
          <label className={label} htmlFor="watch-brand">Brand
            <input className={input} id="watch-brand" name="brand" maxLength={60} required />
          </label>
          <label className={label} htmlFor="watch-category">Category
            <input className={input} id="watch-category" name="category" maxLength={60} placeholder="e.g. Dress, Dive" required />
          </label>
          <label className={label} htmlFor="watch-gender">For
            <select className={input} defaultValue="men" id="watch-gender" name="gender">
              <option value="men">Men</option><option value="women">Women</option>
            </select>
          </label>
          <label className={`${label} sm:col-span-2`} htmlFor="watch-description">Description
            <textarea className={input} id="watch-description" name="description" maxLength={4000} rows={5} />
          </label>
        </div>
      </section>

      <section className="border border-black/10 p-5 sm:p-8">
        <h2 className="font-display text-2xl">Price and availability</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          <label className={label} htmlFor="watch-price">List price (₹)
            <input className={input} id="watch-price" name="price" type="number" min="0" step="1" required />
          </label>
          <label className={label} htmlFor="watch-discount">Discount (%)
            <input className={input} defaultValue="0" id="watch-discount" name="discountPercent" type="number" min="0" max="90" step="1" required />
          </label>
          <label className={label} htmlFor="watch-stock">Stock
            <input className={input} id="watch-stock" name="stock" type="number" min="0" step="1" required />
          </label>
        </div>
        <p className="mt-5 text-sm text-mist">This watch will be published to the storefront as soon as it is added.</p>
      </section>

      <section className="border border-black/10 p-5 sm:p-8">
        <h2 className="font-display text-2xl">Visuals and specifications</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          <label className={label} htmlFor="watch-dial">Dial colour
            <input className="mt-2 h-11 w-full cursor-pointer border border-black/20 bg-white p-1" defaultValue="#1f2022" id="watch-dial" name="dial" type="color" />
          </label>
          <label className={label} htmlFor="watch-case">Case colour
            <input className="mt-2 h-11 w-full cursor-pointer border border-black/20 bg-white p-1" defaultValue="#b9b9b4" id="watch-case" name="case" type="color" />
          </label>
          <label className={label} htmlFor="watch-strap">Strap colour
            <input className="mt-2 h-11 w-full cursor-pointer border border-black/20 bg-white p-1" defaultValue="#111111" id="watch-strap" name="strap" type="color" />
          </label>
          <label className={label} htmlFor="watch-case-material">Case material
            <input className={input} id="watch-case-material" name="caseMaterial" maxLength={60} />
          </label>
          <label className={label} htmlFor="watch-strap-material">Strap material
            <input className={input} id="watch-strap-material" name="strapMaterial" maxLength={60} />
          </label>
          <label className={label} htmlFor="watch-dial-colour">Dial material/colour
            <input className={input} id="watch-dial-colour" name="dialColor" maxLength={40} />
          </label>
          <label className={label} htmlFor="watch-movement">Movement
            <input className={input} id="watch-movement" name="movement" maxLength={60} />
          </label>
          <label className={label} htmlFor="watch-water-resistance">Water resistance
            <input className={input} id="watch-water-resistance" name="waterResistance" maxLength={40} />
          </label>
          <label className={label} htmlFor="watch-warranty">Warranty
            <input className={input} id="watch-warranty" name="warranty" maxLength={60} />
          </label>
          <label className={`${label} sm:col-span-3`} htmlFor="watch-images">Image URLs
            <textarea className={input} id="watch-images" name="images" placeholder="One image URL per line (optional)" rows={3} />
          </label>
        </div>
      </section>

      {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
      <button className="bg-black px-6 py-3 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50" disabled={pending} type="submit">
        {pending ? "Adding watch…" : "Add watch"}
      </button>
    </form>
  );
}

export default function AddWatchPanel() {
  const [screen, setScreen] = useState<Screen>("checking");
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    browserApi<User>("/auth/me")
      .then((current) => {
        if (!active) return;
        setUser(current);
        setScreen(current.role === "super_admin" || current.role === "admin" ? "form" : "forbidden");
      })
      .catch((cause: unknown) => {
        if (!active) return;
        if (cause instanceof BrowserApiError && cause.status === 401) setScreen("sign-in");
        else {
          setError(errorMessage(cause));
          setScreen("sign-in");
        }
      });
    return () => { active = false; };
  }, []);

  function loginSucceeded(current: User) {
    setUser(current);
    setError(null);
    setScreen(current.role === "super_admin" || current.role === "admin" ? "form" : "forbidden");
  }

  if (screen === "checking") return <p className="py-10 text-sm text-mist" aria-live="polite">Checking your access…</p>;
  if (screen === "forbidden") return (
    <section className="mx-auto max-w-md border border-black/10 bg-stone p-6 sm:p-8">
      <h2 className="font-display text-3xl">Admin access required</h2>
      <p className="mt-2 text-sm leading-6 text-mist">{user?.email ?? "This account"} is not allowed to add watches.</p>
    </section>
  );
  if (screen === "sign-in") return <><LoginForm onSuccess={loginSucceeded} />{error && <p className="mx-auto mt-4 max-w-md text-sm text-red-700" role="alert">{error}</p>}</>;
  return <WatchForm />;
}
