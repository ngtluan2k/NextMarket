// src/hooks/useAuth.ts
import { useEffect, useState } from 'react';
export type UserData = {
  id: number;
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
};

export function useAuth() {
  const [user, setUser] = useState<UserData | null>(null);
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) setUser(JSON.parse(userData));
  }, []);

  const login = (userData: UserData, token: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('everymart.me', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('everymart.me');
    setUser(null);
  };

  return { user, login, logout };
}
