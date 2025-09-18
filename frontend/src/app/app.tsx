'use client';
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { CartProvider } from './context/CartContext';
import { Cart } from './components/Cart';
import { message } from 'antd';
import Home from './page/Home';
import CategoryPage from './page/CategoryPage';
import AccountLayout from './page/account/AccountLayout';
import { SellerRegistration } from './components/register_seller/SellerRegistrastion';
import { SellerDashboard } from './components/register_seller/SellerDashboard';
import ProductDetailPage from './page/ProductDetailPage';
import NotificationsPage from './page/account/NotificationsPage';
import ReturnsPage from './page/account/ReturnsPage';
import OrdersPage from './page/account/OrdersPage';
import ProfilePage from './page/account/ProfilePage';
import ProductList from './components/ProductList';
import SellerMainLayout from './page/Seller/MainLayout';
import { ProductForm } from './components/AddProduct';

// import AuthForm from "./components/auth/AuthForm";
const App: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();

  const showMessage = (
    type: 'success' | 'error' | 'warning',
    content: string
  ) => {
    // Localize message content based on type
    const localizedContent = {
      success: content, // Assuming content is already localized in components
      error: `Lỗi: ${content}`,
      warning: `Cảnh báo: ${content}`,
    }[type];

    messageApi.open({
      type,
      content: localizedContent,
    });
  };

  return (
    <CartProvider>
      {contextHolder}
      <Routes>
        {/* <Route path="/login" element={<AuthForm />} /> */}
        <Route path="*" element={<Navigate to="/" />} />
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/seller-registration" element={<SellerRegistration />} />
        <Route path="/seller-dashboard" element={<SellerDashboard />} />
        <Route path="/catepage" element={<CategoryPage />} />
        <Route path="/add_product" element={<ProductForm />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/products/slug/:slug" element={<ProductDetailPage />} />
        <Route path="/cart" element={<Cart showMessage={showMessage} />} />
        <Route path="/test/home" element={<ProductList />} />

        {/* Account Routes */}
        <Route path="/account" element={<AccountLayout />}>
          <Route index element={<Navigate to="profile" replace />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="returns" element={<ReturnsPage />} />
        </Route>

        {/* Seller Routes */}
        <Route path="/seller-registration" element={<SellerRegistration />} />
        {/* <Route path="/seller-dashboard" element={<SellerDashboard />} /> */}
        <Route path="/myStores" element={<SellerMainLayout />} />
        {/* <Route path="/add_product" element={<ProductForm />} /> */}

        {/* Admin Route */}
        <Route path="/admin" element={<AdminDashboard />} />

        {/* Authentication Route */}
        {/* <Route path="/auth" element={<AuthForm />} /> */}

        {/* Catch-all Route */}
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/seller-registration" element={<SellerRegistration />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/products/slug/:slug" element={<ProductDetailPage />} />
        <Route path="/cart" element={<Cart showMessage={showMessage} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </CartProvider>
  );
};

export default App;
