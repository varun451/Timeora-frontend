"use client";

import { useState } from "react";
import WatchFace from "@/components/ui/WatchFace";
import type { WatchLook } from "@/types/product";

export default function ProductGallery({
  images = [],
  look,
  name,
}: {
  images?: string[];
  look: WatchLook;
  name: string;
}) {
  const [selected, setSelected] = useState(0);
  const hasImages = images && images.length > 0;

  return (
    <div className="space-y-4">
      {/* Main Showcase */}
      <div className="aspect-square bg-stone flex items-center justify-center overflow-hidden border border-black/10 relative">
        {hasImages ? (
          <img
            src={images[selected] || images[0]}
            alt={name}
            className="w-full h-full object-cover transition-all duration-300"
          />
        ) : (
          <div className="px-24 py-8 w-full h-full flex items-center justify-center">
            <WatchFace look={look} label={name} />
          </div>
        )}
      </div>

      {/* Thumbnails if multiple images exist */}
      {hasImages && images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelected(idx)}
              className={`w-16 h-16 shrink-0 border overflow-hidden transition-all ${
                selected === idx
                  ? "border-black ring-1 ring-black"
                  : "border-black/20 opacity-70 hover:opacity-100"
              }`}
            >
              <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

