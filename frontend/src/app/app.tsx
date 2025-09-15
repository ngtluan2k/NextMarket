// src/app.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthForm } from './components/AuthForm';
import { ProductList } from './components/ProductList';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { CartProvider } from './context/CartContext';
import { Cart } from './components/Cart';
import { message } from 'antd';
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
        <Route path="/" element={<AuthForm />} />
        <Route path="/home" element={<ProductList />} />
        <Route path="/cart" element={<Cart showMessage={showMessage} />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </CartProvider>
  );
};

export default App;
