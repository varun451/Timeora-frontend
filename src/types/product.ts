export type Gender = "men" | "women";

export interface WatchLook { dial: string; case: string; strap: string }

export interface ProductSpecs {
  caseMaterial?: string; strapMaterial?: string; dialColor?: string;
  movement?: string; waterResistance?: string; warranty?: string;
}

export interface Product {
  id: string; slug: string; name: string; brand: string; category: string; gender: Gender;
  /** List price in INR before discount. */
  price: number; discountPercent: number; rating: number; reviewCount: number; stock: number;
  isNew: boolean; isBestSeller: boolean; look: WatchLook;
  description?: string; specs?: ProductSpecs; images?: string[];
}
