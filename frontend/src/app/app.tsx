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

import AffiliateGate from './page/affiliate/user';
import AffiliateRegister from './page/affiliate/user/register';
import AffiliateLinks from './page/affiliate/user/dashboard/tab/affiliateLinks';
import { AffiliateDashboardLayout } from './page/affiliate/user/dashboard/MainLayout';
import { AffiliateDashboard } from '../app/page/affiliate/user/dashboard/tab/affiliateDashboard';
import AffiliateResource from '../app/page/affiliate/user/dashboard/tab/affiliateResource';
import AffiliateSettings from '../app/page/affiliate/user/dashboard/tab/affiliateSettings';
import AffiliateNoti from '../app/page/affiliate/user/dashboard/tab/affiliateNoti';
import AffiliateTransaction from '../app/page/affiliate/user/dashboard/tab/affiliateTransaction';
import Support from '../app/page/affiliate/user/dashboard/tab/support';
import AffiliateLinkResolver from './page/AffiliateLinkResolver';
import { ProductForm } from './components/AddProduct';
import StoreManagerDetail from './components/admin/StoreManagerDetail';
import AddressBook from './components/account/AddressBook';
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
import { MySubscriptionsPage } from './page/account/MySubscriptionPage';
import StoreOwnerVoucherManager from '../app/components/seller/StoreOwnerVoucherManager';
import AffiliateRulesManager from './page/affiliate/admin/AffiliateRulesManager'
import OrderDetailPage from './page/account/OrderDetailPage';
import GroupOrders from './components/group_orders/GroupOrders';
import GroupOrderDetail from './components/group_orders/components/GroupOrderDetail';
import GroupJoin from './components/group_orders/components/GroupJoin';
import ShopXuPage from './components/account/ShopXuPage';
import FlashSalePage from './page/FlashSalePage';

import AccountVoucher from './page/account/AccountVoucher';
import StoreCampaignDetail from './page/Seller/tab/StoreCampaignDetail';
import StoreCampaignManager from './page/Seller/tab/StoreCampaignManager';
import Dashboard from './page/Seller/tab/StoreOwnerDashboard';
import AdminCampaignStoreProductsWrapper from './components/admin/AdminCampaignStoreProductsWrapper';
import PublicCampaignPageWrapper from './components/PublicCampaignPageWrapper';
import CampaignAdPopup from './components/CampaignAdPopup';

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
          <Route path="/campaign/:id" element={<PublicCampaignPageWrapper />} />

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

          <Route
            path="/admin/affiliate-rules"
            element={<AffiliateRulesManager />}
          />
          <Route path="/admin/stores/:id" element={<StoreManagerDetail />} />

          {/* Seller */}
          <Route path="/seller-registration" element={<SellerRegistration />} />
          {/* <Route path="/seller-dashboard" element={<SellerDashboard />} /> */}
          <Route path="/myStores" element={<SellerMainLayout />} />
          <Route path="/storeVoucher" element={<StoreOwnerVoucherManager />} />

          <Route path="/flash-sale" element={<FlashSalePage />} />

          {/* Account Routes */}
          <Route path="/account" element={<AccountLayout />}>
            <Route index element={<Navigate to="profile" replace />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="/account/orders/:id" element={<OrderDetailPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="returns" element={<ReturnsPage />} />
            <Route path="addresses" element={<AddressBook />} />
            {/* <Route path="addresses/create" element={<AddressCreatePage />} /> */}
            <Route path="xu" element={<ShopXuPage />} />
            <Route path="subscription" element={<MySubscriptionsPage />} />
            <Route path="vouchers" element={<AccountVoucher />} />
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

          <Route path="/store" element={<SellerMainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="campaigns" element={<StoreCampaignManager />} />
          </Route>
          {/* Brands */}
          <Route path="/brands" element={<FeaturedBrandsPage />} />
          <Route path="/brands/:brandId" element={<BrandPage />} />

          {/* Search */}
          <Route path="/search" element={<SearchPage />} />
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
          <Route
            path="/group-orders/store/:storeId/create"
            element={<GroupOrders />}
          />
          <Route
            path="/group-orders/:id/detail"
            element={<GroupOrderDetail />}
          />
          <Route path="/group/:uuid" element={<GroupJoin />} />
        </Routes>
        <CampaignAdPopup />
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
