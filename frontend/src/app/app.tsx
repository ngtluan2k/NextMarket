import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
// import { AuthForm } from './components/AuthForm';
import { ProductList } from './components/ProductList';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { CartProvider } from './context/CartContext';
import { Cart } from './components/Cart';
import { message } from 'antd';
// import EveryMartHeader from './components/Navbar';
import Home from './page/Home';
import CategoryPage from './page/CategoryPage';

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
      <CartProvider>
        {contextHolder}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catepage" element={<CategoryPage />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/category/:slug/explore" element={<CategoryPage />} />
          <Route path="/home" element={<Home />} />
          <Route path="/home" element={<ProductList />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="*" element={<Navigate to="/" />} />
          <Route path="/cart" element={<Cart showMessage={showMessage}/>} />
        </Routes>
      </CartProvider>
      ?
    </>
  );
};

export default App;
