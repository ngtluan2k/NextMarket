// src/components/ProductList.tsx
import React, { useEffect, useState } from 'react';
import { ProductCard } from './ProductCard';
import { useNavigate } from 'react-router-dom';

interface Product {
  id: number;
  uuid: string;
  name: string;
  base_price: number;
  image?: string;
}

export const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [hasStore, setHasStore] = useState<boolean>(false); // 👈 lưu trạng thái user có cửa hàng chưa
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem("token");

        // lấy danh sách sản phẩm
        const res = await fetch("http://localhost:3000/products", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Unauthorized");
        }

        const data = await res.json();
        setProducts(data.data);

        // gọi API check store
        const resStore = await fetch("http://localhost:3000/stores/check-seller", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (resStore.ok) {
          const storeData = await resStore.json();
          setHasStore(!!storeData); // nếu có dữ liệu cửa hàng → true
        }
      } catch (err) {
        console.error("Fetch products/store error:", err);
      }
    };

    fetchProducts();
  }, []);

  const handleButtonClick = () => {
    if (hasStore) {
      navigate("/seller-dashboard");
    } else {
      navigate("/seller-registration");
    }
  };

  return (
    <div className="container mt-4">
      {/* Button đăng ký hoặc xem cửa hàng */}
      <div className="mb-3 d-flex justify-content-end">
        <button className="btn btn-primary" onClick={handleButtonClick}>
          {hasStore ? "Xem cửa hàng" : "Đăng kí trở thành người bán hàng"}
        </button>
      </div>

      <div className="row">
        {products.map(product => (
          <div key={product.id} className="col-6 col-md-3">
            <ProductCard
              name={product.name}
              base_price={product.base_price}
              image={product.image}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
