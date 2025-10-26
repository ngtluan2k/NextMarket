'use client';
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { message } from 'antd';
import { SellerRegistration } from './components/register_seller/SellerRegistration';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import Home from './page/Home';
import CategoryPage from './page/CategoryPage';
import AccountLayout from './page/account/AccountLayout';
// import {SellerDashboard }from './components/register_seller/SellerDashboard';
import ProductDetailPage from './page/ProductDetailPage';
import NotificationsPage from './page/account/NotificationsPage';
import ReturnsPage from './page/account/ReturnsPage';
import OrdersPage from './page/account/OrdersPage';
import ProfilePage from './page/account/ProfilePage';
import ProductList from './components/ProductList';
import SellerMainLayout from './page/Seller/MainLayout';


import AffiliateGate from './page/affiliate';
import AffiliateRegister from './page/affiliate/register';
import AffiliateLinks from './page/affiliate/dashboard/tab/affiliateLinks';
import { AffiliateDashboardLayout } from './page/affiliate/dashboard/MainLayout';
import { AffiliateDashboard } from './page/affiliate/dashboard/tab/affiliateDashboard';
import AffiliateResource from './page/affiliate/dashboard/tab/affiliateResource';
import AffiliateSettings from './page/affiliate/dashboard/tab/affiliateSettings';
import AffiliateNoti from './page/affiliate/dashboard/tab/affiliateNoti';
import AffiliateTransaction from './page/affiliate/dashboard/tab/affiliateTransaction';
import Support from './page/affiliate/dashboard/tab/support';
import AffiliateLinkResolver from './page/AffiliateLinkResolver';
import { ProductForm } from './components/AddProduct';
import StoreManagerDetail from './components/admin/StoreManagerDetail';
import AddressBook from './components/account/AddressBook';
import AddressCreatePage from './page/account/AddressCreatePage';
import StoreLayout from './page/StoreLayout';
import StoreAllProductsTab from './components/store/storetab/StoreAllProductsTab';
import StoreHomeTab from './components/store/storetab/StoreHomeTab';
import StoreProfileTab from './components/store/storetab/StoreProfileTab';
import CheckoutPayment from './page/CheckoutPayment';
import OrderSuccess from './page/OrderSuccess';
import FeaturedBrandsPage from './components/FeaturedBrands';
import BrandPage from './page/BrandPage';
import SearchPage from './page/SearchPage';
import CartPage from './page/CartPage';
import OtpVerifyPage from './page/OtpVerify';
import TestWallet from './test';
import { MySubscriptionsPage } from './page/account/MySubscriptionPage';
import StoreOwnerVoucherManager from '../app/components/seller/StoreOwnerVoucherManager';
import AffiliateRulesManager from './components/admin/AffiliateRulesManager';

import OrderDetailPage from "./page/account/OrderDetailPage";

import ReviewForm from './test';
import GroupOrders from './components/group_orders/GroupOrders';
import GroupOrderDetail from './components/group_orders/components/GroupOrderDetail';
import GroupJoin from './components/group_orders/components/GroupJoin';

interface CartProps {
  showMessage: (type: 'success' | 'error' | 'warning', content: string) => void;
}

const App: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();

  const showMessage: CartProps['showMessage'] = (type, content) => {
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
          <Route
            path="/products/slug/:slug"
            element={<ProductDetailPage showMessage={showMessage} />}
          />

          <Route
            path="/cart"
            element={<CartPage showMessage={showMessage} />}
          />
          <Route path="/test/home" element={<ProductList />} />
          <Route path="/checkout" element={<CheckoutPayment />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route path="/add_product" element={<ProductForm />} />

          {/* Admin */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/affiliate-rules" element={<AffiliateRulesManager />} />

          {/* Seller */}
          <Route path="/seller-registration" element={<SellerRegistration />} />
          {/* <Route path="/seller-dashboard" element={<SellerDashboard />} /> */}
          <Route path="/myStores" element={<SellerMainLayout />} />
          <Route path="/storeVoucher" element={<StoreOwnerVoucherManager/>} />
          
          {/* Account Routes */}
          <Route path="/account" element={<AccountLayout />}>
            <Route index element={<Navigate to="profile" replace />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="/account/orders/:id" element={<OrderDetailPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="returns" element={<ReturnsPage />} />
            <Route path="addresses" element={<AddressBook />} />
            <Route path="addresses/create" element={<AddressCreatePage />} />
            <Route path="subscription" element={<MySubscriptionsPage />} />
          </Route>

          {/* Store Routes */}
          <Route path="/stores/slug/:slug" element={<StoreLayout />}>
            <Route index element={<StoreHomeTab />} />
            <Route
              path="/stores/slug/:slug/all"
              element={<StoreAllProductsTab />}
            />
            <Route
              path="/stores/slug/:slug/profile"
              element={<StoreProfileTab />}
            />
          </Route>

          <Route path="/admin/stores/:id" element={<StoreManagerDetail />} />
          {/* Brands */}
          <Route path="/brands" element={<FeaturedBrandsPage />} />
          <Route path="/brands/:brandId" element={<BrandPage />} />

          {/* Search */}
          <Route path="/search" element={<SearchPage />} />
          <Route path="/test" element={<TestWallet />} />
          <Route path="/test1" element={<ReviewForm />} />
          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route path="/verify-otp" element={<OtpVerifyPage />} />

          <Route path="/affiliate" element={<AffiliateGate />} />
          <Route path="/affiliate/register" element={<AffiliateRegister />} />
          <Route element={<AffiliateDashboardLayout />}>
            <Route
              path="/affiliate/dashboard"
              element={<AffiliateDashboard />}
            />
            <Route
              path="/affiliate/dashboard/links"
              element={<AffiliateLinks />}
            />
            <Route
              path="/affiliate/dashboard/payments"
              element={<AffiliateTransaction />}
            />
            <Route
              path="/affiliate/dashboard/resource"
              element={<AffiliateResource />}
            />
            <Route
              path="/affiliate/dashboard/setting"
              element={<AffiliateSettings />}
            />
            <Route
              path="/affiliate/dashboard/notifications"
              element={<AffiliateNoti />}
            />

            <Route path="/affiliate/dashboard/support" element={<Support />} />
          </Route>
          <Route path="/product/:id" element={<AffiliateLinkResolver />} />
          <Route path="/group-orders/store/:storeId/create" element={<GroupOrders />} />
          <Route
            path="/group-orders/:id/detail"
            element={<GroupOrderDetail />}
          />
          <Route path="/group/:uuid" element={<GroupJoin />} />
        </Routes>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
