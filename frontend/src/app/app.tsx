<<<<<<< HEAD
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
=======
// src/app.tsx
import React from 'react';
import { Routes, Route, Navigate, } from 'react-router-dom';
import { AuthForm } from './components/AuthForm';
import { ProductList } from './components/ProductList';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { SellerRegistration } from './components/register_seller/SellerRegistrastion';
import { SellerDashboard } from './components/register_seller/SellerDashboard';
import { CartProvider } from './context/CartContext';
import { Cart } from './components/Cart';
import { message } from 'antd';
import EveryMartHeader from './components/Navbar';
import Home from './page/Home';
import CategoryPage from './page/CategoryPage';
>>>>>>> origin/main

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
<<<<<<< HEAD
    <CartProvider>
      {contextHolder}
=======
    <Routes>
      <Route path="/" element={<AuthForm />} />
      <Route path="/home" element={<ProductList />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/seller-registration" element={<SellerRegistration />} />
      <Route path="/seller-dashboard" element={<SellerDashboard />} />
      <Route path="*" element={<Navigate to="/" />} />
        {/* <Route path="/" element={<AuthForm />} /> */}
        <Route path="/" element={<Home />} />
        <Route path='/catepage' element={<CategoryPage/>}/>
>>>>>>> origin/main

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />

        {/* Trang danh mục dùng slug */}
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/add_product" element={<ProductForm />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
<<<<<<< HEAD
    </CartProvider>
=======
>>>>>>> origin/main
  );
};

export default App;
