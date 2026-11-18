import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-display text-5xl">Page not found</h1>
      <p className="mt-3 text-mist">The page you’re looking for has moved or doesn’t exist.</p>
      <Link href="/shop" className="mt-6 inline-block bg-black px-6 py-3 text-sm text-white">Browse watches</Link>
    </div>
  );
}
