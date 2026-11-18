"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-display text-3xl">We couldn’t load this page</h1>
      <p className="mt-3 text-mist">Check that the backend server is running (and BACKEND_URL is correct), then try again.</p>
      <button onClick={reset} className="mt-6 bg-black px-6 py-3 text-sm text-white">Try again</button>
    </div>
  );
}
