import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthContextType } from '../types/auth';
import { Me } from '../types/user';


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [me, setMe] = useState<Me | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // 🔹 Hàm gọi /me để verify token
  const fetchMe = async (token: string) => {
    try {
      const res = await fetch('http://localhost:3000/users/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Token expired');
      const json = await res.json();
      setMe(json.data); // lấy dữ liệu profile từ backend
      setToken(token);
    } catch (err) {
      console.warn('fetchMe error', err);
      logout(); // xoá nếu token hết hạn hoặc lỗi
    }
  };

  // 🔹 Khi app load, thử lấy token từ localStorage và gọi /me để kiểm tra
  useEffect(() => {
    const tokenStr = localStorage.getItem('token');
    if (tokenStr) {
      fetchMe(tokenStr);
    }
  }, []);

  const login = (user: Me, token: string) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    setMe(user);
    setToken(token);
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('cart');
    setMe(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ me, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
