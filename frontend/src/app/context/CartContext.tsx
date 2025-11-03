import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem } from '../types/cart';
interface CartContextType {
  cart: CartItem[];
  addToCart: (
    productId: number,
    quantity?: number,
    variantId?: number,
    type?: 'bulk' | 'subscription' | 'normal' | 'flash_sale',
    isGroup?: boolean,
    pricingRuleId?: number | null,
  ) => Promise<void>;
  removeFromCart: (
    productId: number,
    variantId?: number,
    type?: 'bulk' | 'subscription' | 'normal' | 'flash_sale'
  ) => Promise<void>;
  updateQuantity: (
    productId: number,
    quantity: number,
    variantId?: number,
    type?: 'bulk' | 'subscription' | 'normal' | 'flash_sale',
  ) => Promise<void>;
  clearCart: () => void;
  loadCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart phải được sử dụng trong CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('token')
  );

  const loadCart = async () => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      setCart([]);
      return;
    }
    try {
      const response = await fetch('http://localhost:3000/cart', {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setCart(data.items);
      } else {
        setCart([]);
      }
    } catch (error) {
      console.error('Failed to load cart', error);
      setCart([]);
    }
  };
  useEffect(() => {
    loadCart();
  }, [token]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        setToken(e.newValue || null);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentToken = localStorage.getItem('token');
      if (currentToken !== token) {
        setToken(currentToken);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [token]);

  const addToCart = async (
    productId: number,
    quantity = 1,
    variantId?: number,
    type?: 'bulk' | 'subscription' | 'normal' | 'flash_sale',
    isGroup = false
  ) => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      throw new Error('Vui lòng đăng nhập để thêm vào giỏ hàng');
    }
    try {
      const response = await fetch('http://localhost:3000/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({ productId, quantity, variantId, type, isGroup }),
      });
      if (response.ok) {
        await loadCart();
      } else {
        throw new Error('Không thể thêm vào giỏ hàng');
      }
    } catch (error) {
      console.error('Không thể thêm vào giỏ hàng:', error);
      throw new Error('Không thể thêm vào giỏ hàng');
    }
  };

  const removeFromCart = async (
    productId: number,
    variantId?: number,
    type?: 'bulk' | 'subscription' | 'normal' | 'flash_sale'
  ) => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      alert('Vui lòng đăng nhập để xóa khỏi giỏ hàng');
      return;
    }
    try {
      const response = await fetch(
        `http://localhost:3000/cart/remove/${productId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentToken}`,
          },
          body: JSON.stringify({ variantId, type }),
        }
      );
      if (response.ok) {
        await loadCart();
      }
    } catch (error) {
      alert('Không thể xóa khỏi giỏ hàng');
      console.error('Không thể xóa khỏi giỏ hàng:', error);
    }
  };

  const updateQuantity = async (
    productId: number,
    quantity: number,
    variantId?: number,
    type?: 'bulk' | 'subscription' | 'normal' | 'flash_sale'
  ) => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      alert('Vui lòng đăng nhập để cập nhật số lượng');
      return;
    }
    try {
      const response = await fetch('http://localhost:3000/cart/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({ productId, quantity, variantId, type }),
      });
      if (response.ok) {
        await loadCart();
      }
    } catch (error) {
      alert('Không thể cập nhật số lượng');
      console.error('Không thể cập nhật số lượng:', error);
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        loadCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
