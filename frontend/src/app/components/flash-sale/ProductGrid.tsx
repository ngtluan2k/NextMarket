// components/flash-sale/product-grid.tsx
import { Flame } from "lucide-react";

import type { FlashSaleProduct } from "./types";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
  products: FlashSaleProduct[];
}

export function ProductGrid({ products }: ProductGridProps) {
  return (
    <div className="bg-white px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex items-center gap-2 md:mb-6 md:gap-3">
          <Flame className="h-5 w-5 text-red-600 md:h-7 md:w-7" />
          <h2 className="text-xl font-black text-gray-900 md:text-2xl">
            Sản phẩm hot
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 lg:gap-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
