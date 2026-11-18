import { BackendError, backendGet } from "@/lib/backend";
import { parseQuery, type ProductQuery } from "@/lib/product-query";
import type { Product } from "@/types/product";

export { parseQuery };

export type ProductPage = { items: Product[]; total: number; page: number; pages: number };

export const queryProducts = (q: ProductQuery) => backendGet<ProductPage>("/products", q);

export async function getProductBySlug(slug: string) {
  try {
    return await backendGet<Product>(`/products/${encodeURIComponent(slug)}`);
  } catch (e) {
    if (e instanceof BackendError && e.status === 404) return null;
    throw e;
  }
}

export const getRelated = (p: Product, limit = 4) => backendGet<Product[]>(`/products/${encodeURIComponent(p.slug)}/related`, { limit });

export const getFilterOptions = () => backendGet<{ categories: string[]; brands: string[] }>("/products/filters");

export const getBestSellers = async (limit = 4) => (await queryProducts({ ...parseQuery({}), sort: "popular", limit })).items;
export const getNewArrivals = async (limit = 4) => (await queryProducts({ ...parseQuery({}), sort: "newest", limit })).items;
