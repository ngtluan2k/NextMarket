// src/components/ProductList.tsx
import React, { useEffect, useState } from 'react';
import { ProductCard } from './ProductCard';

interface Product {
  id: number;
  uuid: string;
  name: string;
  price: number;
  image?: string;
}

export const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
const fetchProducts = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:3000/products", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Unauthorized");

    const data = await res.json();

    const products = (data.data || data).map((p: any) => ({
      id: p.id,
      uuid: p.uuid,
      name: p.name,
      price: Number(p.base_price || 0),
      image: p.media?.find((m: any) => m.is_primary)?.url,
    }));

    setProducts(products);
  } catch (err) {
    console.error("Fetch products error:", err);
  }
};


  fetchProducts();
}, []);



  return (
    <div className="container mt-4">
      <div className="row">
        {products.map(product => (
          <div key={product.id} className="col-6 col-md-3">
            <ProductCard
              name={product.name}
              price={product.price}
              image={product.image}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
