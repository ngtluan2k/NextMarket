import { useState, useEffect } from 'react';

export const useUserId = () => {
  const [userId, setUserId] = useState<number>(() => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user).user_id : 0;
  });

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'user') {
        const newUser = e.newValue ? JSON.parse(e.newValue) : null;
        setUserId(newUser ? newUser.user_id : 0);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return userId;
};
