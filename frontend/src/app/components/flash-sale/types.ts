import type { ComponentType } from "react";

export type LucideIcon = ComponentType<{ className?: string }>;

export interface Category {
  id: string;
  name: string;
  /** optional key để map icon ở client, VD: "Smartphone" | "Laptop" ... */
  iconKey?: string | null;
}

export interface Product {
  id: string | number;
  name: string;
  image: string;
  originalPrice: number;
  salePrice: number;
  discount: number; // %
  rating: number;   // 0..5
  sold: number;
  categoryId?: string | null;
}

export interface FlashSaleMeta {
  endAt: string | number | Date;
  stats?: Array<{ label: string; value: string }>;
}
