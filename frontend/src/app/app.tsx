"use client"
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { message } from "antd";

import { AdminDashboard } from "./components/admin/AdminDashboard";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";

import Home from "./page/Home";
import CategoryPage from "./page/CategoryPage";
import AccountLayout from "./page/account/AccountLayout";
import { SellerRegistration } from "./components/register_seller/SellerRegistration";
import {SellerDashboard }from './components/register_seller/SellerDashboard';
import ProductDetailPage from "./page/ProductDetailPage";
import NotificationsPage from "./page/account/NotificationsPage";
import ReturnsPage from "./page/account/ReturnsPage";
import OrdersPage from "./page/account/OrdersPage";
import ProfilePage from "./page/account/ProfilePage";
import ProductList from './components/ProductList';
import SellerMainLayout from './page/Seller/MainLayout';
import { ProductForm } from "./components/AddProduct";
import StoreManagerDetail from "./components/admin/StoreManagerDetail";
import AddressBook from "./components/account/AddressBook";
import AddressCreatePage from "./page/account/AddressCreatePage";
import StoreLayout from "./page/StoreLayout";
import StoreAllProductsTab from "./components/store/storetab/StoreAllProductsTab";
import StoreHomeTab from "./components/store/storetab/StoreHomeTab";
import StoreProfileTab from "./components/store/storetab/StoreProfileTab";
import CheckoutPayment from "./page/CheckoutPayment";
import OrderSuccess from "./page/OrderSuccess";
import FeaturedBrandsPage from "./components/FeaturedBrands";
import BrandPage from "./page/BrandPage";
import SearchPage from "./page/SearchPage";
import CartPage from "./page/CartPage";
import OtpVerifyPage from "./page/OtpVerify";

interface CartProps {
  showMessage: (type: "success" | "error" | "warning", content: string) => void;
}

const App: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();

  const showMessage: CartProps["showMessage"] = (type, content) => {
    const localizedContent = {
      success: content,
      error: `Lỗi: ${content}`,
      warning: `Cảnh báo: ${content}`,
    }[type];

    messageApi.open({ type, content: localizedContent });
  };

  return (
    <AuthProvider>
      <CartProvider>
        {contextHolder}
        <Routes>
          {/* Home & General */}
          <Route path="/" element={<Home />} />
          <Route path="/catepage" element={<CategoryPage />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/products/slug/:slug" element={<ProductDetailPage showMessage={showMessage}/>} />
          <Route path="/cart" element={<CartPage showMessage={showMessage} />} />
          <Route path="/test/home" element={<ProductList />} />
          <Route path="/checkout" element={<CheckoutPayment />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route path="/add_product" element={<ProductForm />} />

          {/* Admin */}
          <Route path="/admin" element={<AdminDashboard />} />

          {/* Seller */}
          <Route path="/seller-registration" element={<SellerRegistration />} />
          <Route path="/seller-dashboard" element={<SellerDashboard />} />
          <Route path="/myStores" element={<SellerMainLayout />} />

          {/* Account Routes */}
          <Route path="/account" element={<AccountLayout />}>
            <Route index element={<Navigate to="profile" replace />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="returns" element={<ReturnsPage />} />
            <Route path="addresses" element={<AddressBook />} />      
            <Route path="addresses/create" element={<AddressCreatePage />} /> 
          </Route>

          {/* Store Routes */}
          <Route path="/stores/slug/:slug" element={<StoreLayout />}>
            <Route index element={<StoreHomeTab />} />
            <Route path="/stores/slug/:slug/all" element={<StoreAllProductsTab />} />
            <Route path="/stores/slug/:slug/profile" element={<StoreProfileTab />} /> 
          </Route>

        {/* Catch-all Route */}
        {/* <Route path="/" element={<Home />} /> */}
        {/* <Route path="/home" element={<Home />} /> */}
        {/* <Route path="/seller-registration" element={<SellerRegistration />} /> */}
        {/* <Route path="/category/:slug" element={<CategoryPage />} /> */}
        {/* <Route path="/admin" element={<AdminDashboard />} /> */}
        {/* <Route path="/products/slug/:slug" element={<ProductDetailPage />} /> */}
        {/* <Route path="/cart" element={<Cart showMessage={showMessage} />} /> */}
        {/* <Route path="*" element={<Navigate to="/" replace />} /> */}
        <Route path="/admin/stores/:id" element={<StoreManagerDetail />} />
        {/* Brands */}
          <Route path="/brands" element={<FeaturedBrandsPage />} />
          <Route path="/brands/:brandId" element={<BrandPage />} />

          {/* Search */}
          <Route path="/search" element={<SearchPage />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route path="/verify-otp" element={<OtpVerifyPage />} />
      </Routes>
    </CartProvider>
    </AuthProvider>
  );
};

export default App;