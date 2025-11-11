import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthContextType } from '../types/auth';
import { Me } from '../types/user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [me, setMe] = useState<Me | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const BE_BASE_URL = import.meta.env.VITE_BE_BASE_URL;

  // Hàm lấy thông tin người dùng và địa chỉ
  const fetchUserData = async (token: string) => {
    try {
      // Lấy thông tin người dùng từ /users/me
      const userRes = await fetch(`${BE_BASE_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!userRes.ok) throw new Error('Token expired');
      const userJson = await userRes.json();
      const user = userJson.data;

      // Lấy danh sách địa chỉ từ /users/:id/addresses
      const addressRes = await fetch(
        `${BE_BASE_URL}/users/${user.id}/addresses`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const addresses = (await addressRes.json()) || [];

      // Cập nhật me với thông tin người dùng và địa chỉ
      setMe({ ...user, addresses });
      setToken(token);
      localStorage.setItem('user', JSON.stringify({ ...user, addresses }));
    } catch (err) {
      console.warn('fetchUserData error', err);
      logout(); // Xóa nếu token hết hạn hoặc lỗi
    }
  };

  // Kiểm tra token khi app khởi động
  useEffect(() => {
    const tokenStr = localStorage.getItem('token');
    if (tokenStr) {
      fetchUserData(tokenStr);
    }
  }, []);

  const login = (user: Me, token: string) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    setMe(user);
    setToken(token);
    // Gọi fetchUserData để đảm bảo thông tin đầy đủ (bao gồm địa chỉ)
    fetchUserData(token);
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch(`${BE_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (err) {
      console.error('Logout failed', err);
    } finally {
      // Xóa localStorage và state frontend
      localStorage.removeItem('user');
      localStorage.removeItem('access_token');
      localStorage.removeItem('token');
      localStorage.removeItem('cart');
      setMe(null);
      setToken(null);
    }
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
