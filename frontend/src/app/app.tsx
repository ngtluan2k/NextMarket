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
import AddressBook from './components/account/AddressBook';
import AddressCreatePage from './page/account/AddressCreatePage';
import StoreLayout from './page/StoreLayout';
import StoreAllProductsTab from './components/store/storetab/StoreAllProductsTab';
import StoreHomeTab from './components/store/storetab/StoreHomeTab';
import StoreProfileTab from './components/store/storetab/StoreProfileTab';
import CartPage from './page/CartPage';
import CheckoutPayment from './page/CheckoutPayment';
import OrderSuccess from './page/OrderSuccess';

// import AuthForm from "./components/auth/AuthForm";
const App: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();

  const showMessage = (
    type: 'success' | 'error' | 'warning',
    content: string
  ) => {
    // Localize message content based on type
    const localizedContent = {
      success: content,
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
        <Route path="/" element={<Home showMessage={showMessage} />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/seller-registration" element={<SellerRegistration />} />
        <Route path="/seller-dashboard" element={<SellerDashboard />} />
        <Route path="/catepage" element={<CategoryPage />} />
        <Route path="/add_product" element={<ProductForm />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/products/slug/:slug" element={<ProductDetailPage showMessage={showMessage}/>} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/test/home" element={<ProductList />} />

        {/* <Route path="/cart" element={<Cart showMessage={showMessage} />} />  */}
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
        <Route path="/store/:slug" element={<StoreLayout />}>
          {/* index = /store/:slug  → Cửa Hàng */}
          <Route index element={<StoreHomeTab />} />

          {/* /store/:slug/all → Tất Cả Sản Phẩm */}
          <Route path="all" element={<StoreAllProductsTab />} />
          <Route path="profile" element={<StoreProfileTab />} />
        </Route>
        {/* Seller Routes */}
        {/* <Route path="/seller-registration" element={<SellerRegistration />} /> */}
        {/* <Route path="/seller-dashboard" element={<SellerDashboard />} /> */}
        <Route path="/myStores" element={<SellerMainLayout />} />
        {/* <Route path="/add_product" element={<ProductForm />} /> */}
        <Route path="/checkout" element={<CheckoutPayment />} />
        <Route path="/order/success" element={<OrderSuccess />} />
        {/* Catch-all Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </CartProvider>
  );
};

export default App;
