// src/app.tsx
import React from 'react';
import { Routes, Route, Navigate, } from 'react-router-dom';

import { ProductList } from './components/ProductList';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { message } from 'antd';
import AccountLayout from "./page/account/AccountLayout";
import Home from './page/Home';
import CategoryPage from './page/CategoryPage';

import ProfilePage from './page/account/ProfilePage';
import NotificationsPage from './page/account/NotificationsPage';
import OrdersPage from './page/account/OrdersPage';
import ReturnsPage from './page/account/ReturnsPage';
import ProductDetailPage from './page/ProductDetailPage';
import AddressBook from './components/account/AddressBook';
import AddressCreatePage from './page/account/AddressCreatePage';
import StoreLayout from './page/StoreLayout';

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
   <>
      <Routes>
        {/* <Route path="/" element={<AuthForm />} /> */}
        <Route path="/" element={<Home />} />
        <Route path='/catepage' element={<CategoryPage/>}/>
        <Route path="/home" element={<Home />} />
        <Route path="/home" element={<ProductList />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/" />} />
        <Route path="/product/:slug" element={<ProductDetailPage />} />


        {/* Account layout + routes con */}
        <Route path="/account" element={<AccountLayout />}>
          <Route index element={<Navigate to="profile" replace />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="returns" element={<ReturnsPage />} /> 
          <Route path="addresses" element={<AddressBook />} />       {/* danh sách + nút Thêm */}
          <Route path="addresses/create" element={<AddressCreatePage />} /> {/* form riêng */}  
         </Route>

         <Route path="/store/:slug" element={<StoreLayout />}>
       
        </Route>
      </Routes>

      

      </>
  );
};

export default App;
