"use client";
import { useEffect, useState } from "react";

/** Analog clock showing the visitor's local time. Renders 10:10 until mounted to avoid hydration mismatch. */
export default function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const s = now?.getSeconds() ?? 0;
  const m = now ? now.getMinutes() + s / 60 : 10;
  const h = now ? (now.getHours() % 12) + m / 60 : 10 + 10 / 60;

  return (
    <svg viewBox="0 0 400 400" role="img" aria-label={now ? `Clock showing ${now.toLocaleTimeString()}` : "Clock"} className="h-full w-full">
      <circle cx="200" cy="200" r="190" fill="none" stroke="#b08d57" strokeWidth="1.5" />
      <circle cx="200" cy="200" r="176" fill="#0b0b0c" />
      {Array.from({ length: 60 }, (_, i) => (
        <line key={i} x1="200" y1="32" x2="200" y2={i % 5 === 0 ? 54 : 42} stroke={i % 5 === 0 ? "#f2f2f0" : "#6f6f6b"} strokeWidth={i % 5 === 0 ? 3 : 1} transform={`rotate(${i * 6} 200 200)`} />
      ))}
      <text x="200" y="152" textAnchor="middle" fill="#f2f2f0" fontSize="26" fontFamily="var(--font-display), serif" letterSpacing="6">TIMEORA</text>
      <line x1="200" y1="214" x2="200" y2="110" stroke="#f2f2f0" strokeWidth="8" strokeLinecap="round" transform={`rotate(${h * 30} 200 200)`} />
      <line x1="200" y1="216" x2="200" y2="66" stroke="#f2f2f0" strokeWidth="5" strokeLinecap="round" transform={`rotate(${m * 6} 200 200)`} />
      <line x1="200" y1="230" x2="200" y2="52" stroke="#b08d57" strokeWidth="2" transform={`rotate(${s * 6} 200 200)`} style={{ transition: "transform 0.25s cubic-bezier(.4,2,.6,1)" }} />
      <circle cx="200" cy="200" r="7" fill="#b08d57" />
    </svg>
  );
}
