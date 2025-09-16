// src/app.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthForm } from './components/AuthForm';
import { ProductList } from './components/ProductList';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { SellerRegistration } from './components/register_seller/SellerRegistrastion';
import { SellerDashboard } from './components/register_seller/SellerDashboard';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AuthForm />} />
      <Route path="/home" element={<ProductList />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/seller-registration" element={<SellerRegistration />} />
      <Route path="/seller-dashboard" element={<SellerDashboard />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;
