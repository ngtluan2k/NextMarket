// src/components/ProductCard.tsx
import React from "react";

export interface Product {
  id: number;
  name: string;
  price: number;
  image?: string;
}

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  return (
    <div className="border rounded-lg overflow-hidden shadow hover:shadow-lg transition">
      <img
        src={product.image || "https://via.placeholder.com/300x200"}
        alt={product.name}
        className="w-full h-40 object-cover"
      />
      <div className="p-3">
        <h3 className="font-medium">{product.name}</h3>
        <p className="text-cyan-700 font-semibold">{product.price.toLocaleString()}₫</p>
      </div>
    </div>
  );
};

export default ProductCard;
