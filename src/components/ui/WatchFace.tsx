import type { WatchLook } from "@/types/product";

/** SVG stand-in for product photography (Phase 1). Shows the classic 10:10 pose. */
export default function WatchFace({ look, label }: { look: WatchLook; label: string }) {
  const light = ["#ffffff", "#f4ece6", "#e7e4dc", "#e9d5d8"].includes(look.dial);
  const ink = light ? "#1f2022" : "#f2f2f0";
  return (
    <svg viewBox="0 0 200 280" role="img" aria-label={label} className="h-full w-full">
      <rect x="72" y="0" width="56" height="110" rx="10" fill={look.strap} />
      <rect x="72" y="170" width="56" height="110" rx="10" fill={look.strap} />
      <circle cx="100" cy="140" r="62" fill={look.case} />
      <circle cx="100" cy="140" r="54" fill={look.dial} />
      {Array.from({ length: 12 }, (_, i) => (
        <line key={i} x1="100" y1="92" x2="100" y2={i % 3 === 0 ? 102 : 97} stroke={ink} strokeWidth={i % 3 === 0 ? 2.5 : 1.2} transform={`rotate(${i * 30} 100 140)`} />
      ))}
      <line x1="100" y1="140" x2="100" y2="112" stroke={ink} strokeWidth="3" strokeLinecap="round" transform="rotate(-60 100 140)" />
      <line x1="100" y1="140" x2="100" y2="100" stroke={ink} strokeWidth="2" strokeLinecap="round" transform="rotate(60 100 140)" />
      <circle cx="100" cy="140" r="3" fill="#b08d57" />
    </svg>
  );
}
