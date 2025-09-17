import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { CartProvider } from './context/CartContext';
import { Cart } from './components/Cart';
import Home from './page/Home';
import CategoryPage from './page/CategoryPage';
import ProductForm from './components/AddProduct';
import { SellerRegistration } from './components/register_seller/SellerRegistrastion';

import { message } from 'antd';
import SellerMainLayout from './page/Seller/MainLayout';
import { Settings } from './components/register_seller/SellerDashboard';

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
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/seller-registration" element={<SellerRegistration />} />
        <Route path="/seller-dashboard" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" />} />
        <Route path="/" element={<Home showMessage={showMessage} />} />
        <Route path="/catepage" element={<CategoryPage />} />
        <Route path="/cart" element={<Cart showMessage={showMessage} />} />
        <Route path="/home" element={<Home />} />
        {/* Trang danh mục dùng slug */}
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/add_product" element={<ProductForm />} />
        <Route path="*" element={<Navigate to="/" />} />
        <Route path="/myStores" element={<SellerMainLayout />} />
      </Routes>
    </CartProvider>
  );
};

export default App;
