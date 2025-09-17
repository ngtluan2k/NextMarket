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
import AccountLayout from "./page/account/AccountLayout";
import { AuthForm } from './components/AuthForm';
import { SellerRegistration } from './components/register_seller/SellerRegistrastion';
import { SellerDashboard } from './components/register_seller/SellerDashboard';
import ProductDetailPage from "./page/ProductDetailPage";
import NotificationsPage from "./page/account/NotificationsPage";
import ReturnsPage from "./page/account/ReturnsPage";
import OrdersPage from "./page/account/OrdersPage";
import ProfilePage from "./page/account/ProfilePage";
import ProductList from './components/ProductList';

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
        <Route path="/login" element={<AuthForm />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/seller-registration" element={<SellerRegistration />} />
        <Route path="/seller-dashboard" element={<SellerDashboard />} />
        <Route path="*" element={<Navigate to="/" />} />
        <Route path="/" element={<Home />} />
        <Route path='/catepage' element={<CategoryPage/>}/>
        <Route path="/add_product" element={<ProductForm />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/category/:slug/explore" element={<CategoryPage />} />
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/products/slug/:slug" element={<ProductDetailPage />} />
        <Route path="/cart" element={<Cart showMessage={showMessage} />} />
        <Route path="/product/:slug" element={<ProductDetailPage />} />
        <Route path="/account" element={<AccountLayout />}>
          <Route index element={<Navigate to="profile" replace />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="returns" element={<ReturnsPage />} /> 
        </Route>
        <Route path="/test/home" element={<ProductList />} />
      </Routes>
    </CartProvider>
  );
};

export default App;
