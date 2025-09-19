import React, { createContext, useContext, useEffect, useState } from 'react';

export type Me = {
  id: number;
  email: string;
  full_name?: string;
  roles?: string[];
  permissions?: string[];
};

type AuthContextType = {
  me: Me | null;
  token: string | null;
  login: (user: Me, token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [me, setMe] = useState<Me | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const tokenStr = localStorage.getItem('token');
    if (userStr && tokenStr) {
      try {
        setMe(JSON.parse(userStr));
        setToken(tokenStr);
      } catch {  // eslint-disable-next-line no-empty
}
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
