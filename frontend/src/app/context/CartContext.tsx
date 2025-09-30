import { message } from 'antd';
import React, { createContext, useContext, useState, useEffect } from 'react';

interface Inventory {
  id: number;
  quantity: number;
  location?: string;
}

interface Variant {
  id: number;
  variant_name: string;
  price: number;
  stock: number;
  inventories?: Inventory[]; // kho nằm trong variant
}

interface Product {
  id: number;
  name: string;
  base_price: number;
  url: string;
  media: { url: string; is_primary?: boolean } | { url: string; is_primary?: boolean }[];
  status: 'draft' | 'deleted' | 'active';
  store?: { id: number; name: string };
  variants?: Variant[]; // variants nằm trong product
}

interface CartItem {
  id: number;
  productId: number;
  quantity: number;
  price: number;
  product: Product;
  variant?: Variant; // variant đang chọn
}


interface CartContextType {
  cart: CartItem[];
  addToCart: (productId: number, quantity?: number, variantId?: number) => Promise<void>;
  removeFromCart: (productId: number, variantId?: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number, variantId?: number) => Promise<void>;
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
  // NEW: Track token state to react to changes
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));

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
        // console.log("value inside cart: "+JSON.stringify(data.items))
        setCart(data.items);
      } else {
        setCart([]);
      }
    } catch (error) {
      console.error('Failed to load cart', error);
      setCart([]);
    }
  };

  // NEW: Load cart when token changes (handles login/logout)
  useEffect(() => {
    loadCart();
  }, [token]);

  // NEW: Listen for cross-tab storage changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        setToken(e.newValue || null);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // NEW: Poll localStorage for same-tab changes (every 1 second)
  useEffect(() => {
    const interval = setInterval(() => {
      const currentToken = localStorage.getItem('token');
      if (currentToken !== token) {
        setToken(currentToken);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [token]);

  const addToCart = async (productId: number, quantity = 1, variantId?: number) => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      message.warning('Vui lòng đăng nhập để thêm vào giỏ hàng');
      return;
    }
    try {
      const response = await fetch('http://localhost:3000/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({ productId, quantity, variantId }),
      });
      if (response.ok) {
        await loadCart();
      }
    } catch (error) {
      message.warning('Không thể thêm vào giỏ hàng');
      console.error('Không thể thêm vào giỏ hàng:', error);
    }
  };

  const removeFromCart = async (productId: number, variantId?: number) => {
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
          body: JSON.stringify({ variantId }),
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

  const updateQuantity = async (productId: number, quantity: number, variantId?: number) => {
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
        body: JSON.stringify({ productId, quantity, variantId }),
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

  // REMOVED: Original useEffect on mount, now handled by token changes

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