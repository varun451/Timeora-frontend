"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { Trash2, Upload, UploadCloud, X } from "lucide-react";
import WatchFace from "@/components/ui/WatchFace";
import { browserApi } from "@/lib/browser-api";
import type { Gender, ProductSpecs, WatchLook } from "@/types/product";

interface InitialWatchData {
  id?: string;
  name?: string;
  description?: string;
  brand?: string;
  category?: string;
  gender?: Gender;
  price?: number;
  discountPercent?: number;
  stock?: number;
  sku?: string;
  specs?: ProductSpecs;
  images?: string[];
  look?: WatchLook;
  availability?: "active" | "hidden";
}

export default function WatchForm({
  initialData,
  mode = "create",
}: {
  initialData?: InitialWatchData;
  mode?: "create" | "edit";
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  // Fields
  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [brand, setBrand] = useState(initialData?.brand ?? "Timeora");
  const [category, setCategory] = useState(initialData?.category ?? (mode === "create" ? "" : "Automatic"));
  const [gender, setGender] = useState<Gender>(initialData?.gender ?? "men");
  const [price, setPrice] = useState<number>(initialData?.price ?? (mode === "create" ? 0 : 15000));
  const [discountPercent, setDiscountPercent] = useState<number>(initialData?.discountPercent ?? 0);
  const [stock, setStock] = useState<number>(initialData?.stock ?? (mode === "create" ? 0 : 5));
  const [sku, setSku] = useState(initialData?.sku ?? "");

  // Specs
  const [caseMaterial, setCaseMaterial] = useState(initialData?.specs?.caseMaterial ?? "316L Stainless Steel");
  const [strapMaterial, setStrapMaterial] = useState(initialData?.specs?.strapMaterial ?? "Top-grain Leather");
  const [dialColor, setDialColor] = useState(initialData?.specs?.dialColor ?? "Midnight Black");
  const [movement, setMovement] = useState(initialData?.specs?.movement ?? "Automatic Mechanical");
  const [waterResistance, setWaterResistance] = useState(initialData?.specs?.waterResistance ?? "50 m");
  const [warranty, setWarranty] = useState(initialData?.specs?.warranty ?? "2 years");

  // Images
  const [images, setImages] = useState<string[]>(initialData?.images ?? []);
  const [urlInput, setUrlInput] = useState("");
  const [draggingImages, setDraggingImages] = useState(false);

  // Look fallback
  const [dialLook, setDialLook] = useState(initialData?.look?.dial ?? "#1f2022");
  const [caseLook, setCaseLook] = useState(initialData?.look?.case ?? "#b9b9b4");
  const [strapLook, setStrapLook] = useState(initialData?.look?.strap ?? "#111111");

  async function uploadFiles(files: FileList | File[]) {
    if (files.length === 0) return;

    const maxImages = mode === "create" ? 5 : 10;
    const slotsAvailable = maxImages - images.length;
    if (slotsAvailable <= 0) {
      setError(`You can upload a maximum of ${maxImages} images.`);
      return;
    }
    if (files.length > slotsAvailable) {
      setError(`You can add ${slotsAvailable} more image${slotsAvailable === 1 ? "" : "s"}.`);
      return;
    }

    setUploading(true);
    setError("");
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
          throw new Error(`File ${file.name} must be a JPG, PNG, or WebP image.`);
        }
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`File ${file.name} exceeds 5MB size limit.`);
        }

        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const res = await browserApi<{ url: string }>("/seller/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64 }),
        });

        setImages((prev) => [...prev, res.url]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploading(false);
    }
  }

  async function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files) await uploadFiles(e.target.files);
    e.target.value = "";
  }

  function handleImageDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDraggingImages(false);
    void uploadFiles(e.dataTransfer.files);
  }

  function addImageUrl() {
    if (!urlInput.trim()) return;
    if (images.length >= 10) {
      setError("You can upload a maximum of 10 images.");
      return;
    }
    setImages((prev) => [...prev, urlInput.trim()]);
    setUrlInput("");
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (mode === "create" && images.length === 0) {
      setError("Please upload at least one product image.");
      return;
    }
    setSubmitting(true);

    const payload = {
      name,
      description,
      brand,
      category,
      gender,
      price: Number(price),
      discountPercent: Number(discountPercent),
      stock: Number(stock),
      sku: sku.trim() || undefined,
      specs: {
        caseMaterial: caseMaterial.trim() || undefined,
        strapMaterial: strapMaterial.trim() || undefined,
        dialColor: dialColor.trim() || undefined,
        movement: movement.trim() || undefined,
        waterResistance: waterResistance.trim() || undefined,
        warranty: warranty.trim() || undefined,
      },
      images,
      look: {
        dial: dialLook,
        case: caseLook,
        strap: strapLook,
      },
    };

    try {
      if (mode === "create") {
        await browserApi("/seller/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await browserApi(`/seller/products/${initialData?.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      router.push("/seller/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save watch details.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-sm border border-black/20 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-gold";
  const labelClass = "block text-sm font-medium";

  return (
    <form onSubmit={handleSubmit} className={mode === "create" ? "space-y-6" : "max-w-4xl space-y-10"}>
      {mode === "create" ? (
        <>
          {error && <p role="alert" className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
          <div className="grid gap-5 xl:grid-cols-[1.2fr_0.9fr]">
            <section className="space-y-5 rounded-md border border-black/10 bg-white p-5 sm:p-6">
              <div>
                <label htmlFor="product-name" className="block text-sm font-medium">
                  Product Name <span className="text-red-600">*</span>
                </label>
                <input
                  id="product-name"
                  required
                  minLength={2}
                  maxLength={120}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Titan Classic Watch"
                  className={inputClass}
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="product-category" className="block text-sm font-medium">
                    Category <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="product-category"
                    required
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setGender(e.target.value.toLowerCase() as Gender);
                    }}
                    className={inputClass}
                  >
                    <option value="" disabled>Select category</option>
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="product-price" className="block text-sm font-medium">
                    Price (₹) <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="product-price"
                    required
                    type="number"
                    min={0}
                    step="1"
                    value={price || ""}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    placeholder="e.g. 4000"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="product-stock" className="block text-sm font-medium">
                    Stock Quantity <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="product-stock"
                    required
                    type="number"
                    min={0}
                    step="1"
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    placeholder="e.g. 10"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="product-description" className="block text-sm font-medium">
                    Description <span className="text-red-600">*</span>
                  </label>
                  <span className="text-xs text-mist">{description.length} / 300</span>
                </div>
                <textarea
                  id="product-description"
                  required
                  maxLength={300}
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Write a short description about the watch..."
                  className={`${inputClass} resize-y`}
                />
              </div>

            </section>

            <section className="rounded-md border border-black/10 bg-white p-5 sm:p-6">
              <label htmlFor="create-image-upload" className="mb-3 block text-sm font-medium">
                Product Images <span className="text-red-600">*</span>
              </label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDraggingImages(true);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDraggingImages(false);
                }}
                onDrop={handleImageDrop}
                className={`flex min-h-48 flex-col items-center justify-center rounded-md border border-dashed px-4 py-6 text-center transition-colors ${
                  draggingImages ? "border-gold bg-amber-50/50" : "border-black/20 bg-stone/20"
                }`}
              >
                <label htmlFor="create-image-upload" className="flex cursor-pointer flex-col items-center">
                  <UploadCloud size={34} strokeWidth={1.6} className="text-black" />
                  <span className="mt-3 text-sm font-medium">
                    {uploading ? "Uploading images..." : "Upload Watch Images"}
                  </span>
                  <span className="mt-1 text-xs text-mist">Drag &amp; drop or click to browse</span>
                  <span className="mt-3 rounded-full bg-[#fbf2e3] px-3 py-1 text-[10px] text-[#805c2e]">
                    JPG, PNG, WebP&nbsp; · &nbsp;Max 5 images
                  </span>
                </label>
                <input
                  id="create-image-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  disabled={uploading || images.length >= 5}
                  onChange={handleFileUpload}
                  className="sr-only"
                />
              </div>

              {images.length > 0 && (
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {images.map((image, index) => (
                    <div key={`${image}-${index}`} className="group relative aspect-square overflow-hidden rounded-md border border-black/10 bg-stone/40">
                      <Image
                        src={image}
                        alt={`Product image ${index + 1}`}
                        fill
                        unoptimized
                        className="object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        aria-label={`Remove product image ${index + 1}`}
                        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-red-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="flex flex-col-reverse justify-end gap-3 border-t border-black/10 pt-4 sm:flex-row sm:pt-5">
            <Link
              href="/seller/products"
              className="inline-flex min-h-11 items-center justify-center border border-black/30 bg-white px-7 text-xs font-medium uppercase tracking-wider transition-colors hover:bg-stone"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || uploading}
              className="inline-flex min-h-11 items-center justify-center gap-2 bg-black px-7 text-xs font-medium uppercase tracking-wider text-white transition-colors hover:bg-charcoal disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Adding product..." : "Add Product"}
            </button>
          </div>
        </>
      ) : (
        <>
          {error && <p role="alert" className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      {/* 1. Identification & Classification */}
      <div className="space-y-4 bg-white p-6 border border-black/10">
        <h2 className="font-display text-xl pb-2 border-b border-black/10">1. Watch Identity</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelClass}>
              Watch Name / Model Title *
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Chronos Automatic 41mm"
                className={inputClass}
              />
            </label>
          </div>
          <div>
            <label className={labelClass}>
              Brand *
              <input
                required
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Timeora, Vacheron, Omega"
                className={inputClass}
              />
            </label>
          </div>
          <div>
            <label className={labelClass}>
              Category *
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputClass}
              >
                <option value="Automatic">Automatic</option>
                <option value="Chronograph">Chronograph</option>
                <option value="Dress">Dress</option>
                <option value="Diver">Diver</option>
                <option value="Quartz">Quartz</option>
                <option value="Skeleton">Skeleton</option>
                <option value="Vintage">Vintage</option>
              </select>
            </label>
          </div>
          <div>
            <label className={labelClass}>
              Gender Category *
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                className={inputClass}
              >
                <option value="men">Men</option>
                <option value="women">Women</option>
              </select>
            </label>
          </div>
          <div>
            <label className={labelClass}>
              SKU / Reference ID (Optional)
              <input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. TIM-CHR-01"
                className={inputClass}
              />
            </label>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>
              Product Description
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the craftsmanship, history, dial architecture, and finish of this watch."
                className={inputClass}
              />
            </label>
          </div>
        </div>
      </div>

      {/* 2. Pricing & Inventory */}
      <div className="space-y-4 bg-white p-6 border border-black/10">
        <h2 className="font-display text-xl pb-2 border-b border-black/10">2. Pricing & Stock</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>
              List Price (INR ₹) *
              <input
                required
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className={inputClass}
              />
            </label>
          </div>
          <div>
            <label className={labelClass}>
              Discount Percentage (%)
              <input
                type="number"
                min={0}
                max={90}
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                className={inputClass}
              />
            </label>
            <span className="text-[11px] text-mist mt-1 block">
              Final Selling Price: ₹{Math.round(price * (1 - discountPercent / 100)).toLocaleString("en-IN")}
            </span>
          </div>
          <div>
            <label className={labelClass}>
              Units in Stock *
              <input
                required
                type="number"
                min={0}
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className={inputClass}
              />
            </label>
          </div>
        </div>
      </div>

      {/* 3. Watch Specifications */}
      <div className="space-y-4 bg-white p-6 border border-black/10">
        <h2 className="font-display text-xl pb-2 border-b border-black/10">3. Technical Specifications</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              Case Material
              <input
                value={caseMaterial}
                onChange={(e) => setCaseMaterial(e.target.value)}
                placeholder="e.g. 316L Stainless Steel, Titanium"
                className={inputClass}
              />
            </label>
          </div>
          <div>
            <label className={labelClass}>
              Strap / Bracelet Material
              <input
                value={strapMaterial}
                onChange={(e) => setStrapMaterial(e.target.value)}
                placeholder="e.g. Italian Calfskin, Solid Link Bracelet"
                className={inputClass}
              />
            </label>
          </div>
          <div>
            <label className={labelClass}>
              Dial Colour
              <input
                value={dialColor}
                onChange={(e) => setDialColor(e.target.value)}
                placeholder="e.g. Sunray Navy Blue, Polar White"
                className={inputClass}
              />
            </label>
          </div>
          <div>
            <label className={labelClass}>
              Movement Calibre
              <input
                value={movement}
                onChange={(e) => setMovement(e.target.value)}
                placeholder="e.g. Swiss ETA 2824-2, Calibre 16 Automatic"
                className={inputClass}
              />
            </label>
          </div>
          <div>
            <label className={labelClass}>
              Water Resistance
              <input
                value={waterResistance}
                onChange={(e) => setWaterResistance(e.target.value)}
                placeholder="e.g. 50 m / 5 ATM, 300 m Diver"
                className={inputClass}
              />
            </label>
          </div>
          <div>
            <label className={labelClass}>
              Warranty Period
              <input
                value={warranty}
                onChange={(e) => setWarranty(e.target.value)}
                placeholder="e.g. 2 years international warranty"
                className={inputClass}
              />
            </label>
          </div>
        </div>
      </div>

      {/* 4. Product Photography & Gallery */}
      <div className="space-y-4 bg-white p-6 border border-black/10">
        <h2 className="font-display text-xl pb-2 border-b border-black/10">4. Watch Photography</h2>
        <p className="text-xs text-mist">
          Upload high-resolution timepiece imagery. The first photo acts as the primary catalogue cover.
        </p>

        {/* Upload Buttons */}
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 bg-stone hover:bg-black/10 border border-black/20 px-4 py-2.5 text-xs uppercase tracking-wider cursor-pointer transition-colors">
            <Upload size={14} />
            <span>{uploading ? "Uploading Image…" : "Upload Watch Photo"}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={uploading}
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {/* Direct URL input */}
          <div className="flex items-center gap-2">
            <input
              type="url"
              placeholder="Or paste image URL"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="border border-black/20 px-3 py-2 text-xs w-64 outline-none"
            />
            <button
              type="button"
              onClick={addImageUrl}
              className="bg-black text-white px-3 py-2 text-xs uppercase tracking-wider"
            >
              Add URL
            </button>
          </div>
        </div>

        {/* Image Gallery */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-black/10">
            {images.map((img, idx) => (
              <div key={idx} className="relative aspect-square border border-black/10 bg-stone overflow-hidden group">
                <Image
                  src={img}
                  alt={`Watch preview ${idx + 1}`}
                  fill
                  unoptimized
                  className="object-cover"
                />
                <div className="absolute top-1 left-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5">
                  {idx === 0 ? "Primary Cover" : `#${idx + 1}`}
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 bg-red-600 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove image"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Procedural SVG Dial Palette Fallback */}
      <div className="space-y-4 bg-white p-6 border border-black/10">
        <h2 className="font-display text-xl pb-2 border-b border-black/10">5. Procedural Dial Visual Palette</h2>
        <p className="text-xs text-mist">
          Timeora procedurally renders a dynamic SVG watch dial whenever product photographs are loading or unavailable. Select the dominant tones of this timepiece.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-charcoal mb-1">Dial Colour Tone</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={dialLook}
                  onChange={(e) => setDialLook(e.target.value)}
                  className="w-9 h-9 border border-black/20 p-0.5 cursor-pointer"
                />
                <span className="font-mono text-xs">{dialLook}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-charcoal mb-1">Case / Bezel Metal Tone</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={caseLook}
                  onChange={(e) => setCaseLook(e.target.value)}
                  className="w-9 h-9 border border-black/20 p-0.5 cursor-pointer"
                />
                <span className="font-mono text-xs">{caseLook}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-charcoal mb-1">Strap Tone</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={strapLook}
                  onChange={(e) => setStrapLook(e.target.value)}
                  className="w-9 h-9 border border-black/20 p-0.5 cursor-pointer"
                />
                <span className="font-mono text-xs">{strapLook}</span>
              </div>
            </div>
          </div>

          <div className="sm:col-span-2 flex flex-col items-center justify-center p-4 bg-stone border border-black/10">
            <span className="text-[10px] uppercase tracking-wider text-mist mb-2">Live Procedural Preview</span>
            <div className="w-36 h-48">
              <WatchFace
                look={{ dial: dialLook, case: caseLook, strap: strapLook }}
                label={name || "Preview Watch"}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Submission Footer */}
      <div className="flex items-center justify-between border-t border-black/10 pt-6">
        <Link href="/seller/products" className="text-xs uppercase tracking-wider text-mist hover:text-black">
          Cancel & Return
        </Link>
        <button
          type="submit"
          disabled={submitting}
          className="bg-black text-white px-8 py-3 text-xs uppercase tracking-wider hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {submitting ? "Updating Watch…" : "Update Watch"}
        </button>
      </div>
        </>
      )}
    </form>
  );
}
