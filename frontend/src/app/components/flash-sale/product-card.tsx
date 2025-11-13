// components/flash-sale/product-card.tsx
interface Product {
  id: number;
  name: string;
  image: string;
  rating: number;
  reviews: number;
  originalPrice: number;
  salePrice: number;
  discount: number;
  badge: string;
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition-all hover:-translate-y-1 hover:border-red-300 hover:shadow-lg">
      {/* image */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
        <img
          src={product.image || "/placeholder.svg"}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
        />

        <span className="absolute left-2 top-2 rounded-md bg-gradient-to-r from-red-500 to-orange-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
          {product.badge}
        </span>

        {product.discount > 0 && (
          <span className="absolute right-2 top-2 rounded-md bg-red-600 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">
            -{product.discount}%
          </span>
        )}
      </div>

      {/* info */}
      <div className="flex flex-1 flex-col px-3 pb-3 pt-2">
        <h3 className="line-clamp-2 min-h-[32px] text-xs font-medium text-gray-800 md:text-sm">
          {product.name}
        </h3>

        <div className="mt-1 flex items-center gap-1 text-[11px] text-gray-500">
          <span className="text-yellow-400">★</span>
          <span className="font-semibold text-gray-700">
            {product.rating.toFixed(1)}
          </span>
          <span>({product.reviews})</span>
        </div>

        <div className="mt-2 flex items-end gap-1.5">
          <span className="text-base font-bold text-red-600">
            {formatPrice(product.salePrice)}
          </span>
          <span className="mb-[2px] text-[11px] text-gray-400 line-through">
            {formatPrice(product.originalPrice)}
          </span>
        </div>

        <button className="mt-2 w-full rounded-md bg-red-500 py-1.5 text-xs font-semibold text-white transition-all hover:bg-red-600 active:scale-95 md:text-sm">
          Mua ngay
        </button>
      </div>
    </div>
  );
}
