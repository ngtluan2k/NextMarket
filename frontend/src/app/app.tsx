// src/App.tsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { CartProvider } from "./context/CartContext";
import { Cart } from "./components/Cart";
import { message } from "antd";
import EveryMartHeader from "./components/Navbar";
import Home from "./page/Home";
import CategoryPage from "./page/CategoryPage";
import ProductForm from "./components/AddProduct";

const App: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();

  const showMessage = (
    type: "success" | "error" | "warning",
    content: string
  ) => {
    messageApi.open({
      type,
      content,
    });
  };

  return (
    <CartProvider>
      {contextHolder}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />

        {/* Trang danh mục dùng slug */}
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/add_product" element={<ProductForm />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </CartProvider>
  );
};

export default App;
