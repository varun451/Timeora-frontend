import { z } from "zod";

export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
  q: z.string().trim().max(80).optional(),
  category: z.string().max(60).optional(),
  brand: z.string().max(60).optional(),
  gender: z.enum(["men", "women"]).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  inStock: z.enum(["true", "1"]).optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "popular"]).default("newest"),
});
export type ProductQuery = z.infer<typeof productQuerySchema>;

/** Turns raw URL params into a validated query. Empty form fields are ignored; invalid input falls back to defaults. */
export function parseQuery(raw: Record<string, string | string[] | undefined>): ProductQuery {
  const clean = Object.fromEntries(Object.entries(raw).filter(([, v]) => typeof v === "string" && v !== ""));
  const r = productQuerySchema.safeParse(clean);
  return r.success ? r.data : productQuerySchema.parse({});
}
