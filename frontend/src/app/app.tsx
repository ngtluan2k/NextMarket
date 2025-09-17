// src/App.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { CartProvider } from './context/CartContext';
import { Cart } from './components/Cart';
import { message } from 'antd';
import EveryMartHeader from './components/Navbar';
import Home from './page/Home';
import { ProductForm } from './components/AddProduct';
import CategoryPage from './page/CategoryPage';
import { SellerRegistration } from './components/register_seller/SellerRegistrastion';
import { SellerDashboard } from './components/register_seller/SellerDashboard';
import ProductDetailPage from './page/ProductDetailPage';
const App: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();

  const showMessage = (
    type: 'success' | 'error' | 'warning',
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
        <Route path="/seller-registration" element={<SellerRegistration />} />
        <Route path="/seller-dashboard" element={<SellerDashboard />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/add_product" element={<ProductForm />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/products/slug/:slug" element={<ProductDetailPage />} />
        <Route path="/cart" element={<Cart showMessage={showMessage} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </CartProvider>
  );
};

export default App;
