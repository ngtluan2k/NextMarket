import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthContextType } from '../types/auth';
import { Me } from '../types/user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [me, setMe] = useState<Me | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const BE_BASE_URL = import.meta.env.VITE_BE_BASE_URL;

  // Lazy load addresses only when needed
  const loadAddresses = async (userId: number, token: string) => {
    try {
      console.time('📍 [Auth] Load Addresses');
      const addressRes = await fetch(`${BE_BASE_URL}/users/${userId}/addresses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const addresses = (await addressRes.json()) || [];
      console.timeEnd('📍 [Auth] Load Addresses');
      
      setMe(prev => prev ? { ...prev, addresses } : null);
      localStorage.setItem('user', JSON.stringify({ ...me, addresses }));
    } catch (err) {
      console.warn('Load addresses error:', err);
    }
  };

  // Optimized token validation - validate JWT structure without API call
  const validateToken = (token: string) => {
    try {
      // Basic JWT structure validation
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT structure');
      }
      
      // Decode payload to check expiration
      const payload = JSON.parse(atob(parts[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Check if token is expired
      if (payload.exp && payload.exp < currentTime) {
        throw new Error('Token expired');
      }
      
      // Token is valid, use cached user data
      const cachedUser = localStorage.getItem('user');
      if (cachedUser) {
        setMe(JSON.parse(cachedUser));
        setToken(token);
      }
    } catch (err) {
      console.warn('Token validation failed:', err);
      logout();
    }
  };

  // Kiểm tra token khi app khởi động
  useEffect(() => {
    const tokenStr = localStorage.getItem('token');
    const cachedUser = localStorage.getItem('user');
    
    if (tokenStr && cachedUser) {
      // Use cached data immediately, validate token in background
      setMe(JSON.parse(cachedUser));
      setToken(tokenStr);
      validateToken(tokenStr); // Background validation
    }
  }, []);

  const login = (user: Me, token: string) => {
    console.time('💾 [Auth] Login State Update');
    
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    setMe(user);
    setToken(token);
    
    console.timeEnd('💾 [Auth] Login State Update');
    
    // Don't fetch additional data immediately
    // Let components request addresses when needed
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
    <AuthContext.Provider value={{ me, token, login, logout, loadAddresses: () => loadAddresses(me?.id || 0, token || '') }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
