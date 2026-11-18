import type { Product } from "@/types/product";

export const cn = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

export const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export const finalPrice = (p: Pick<Product, "price" | "discountPercent">) =>
  Math.round(p.price * (1 - p.discountPercent / 100));
