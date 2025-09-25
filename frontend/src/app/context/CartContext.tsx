import React, { createContext, useContext, useState, useEffect } from 'react';

interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  product: {
    id: number;
    name: string;
    base_price: number;
    url: string;
    media: { url: string; is_primary?: boolean };
  };
  variant?: {
    id: number;
    variant_name: string;
    price: number;
    stock: number;
  };
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

  const loadCart = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setCart([]);
      return;
    }
    try {
      const response = await fetch('http://localhost:3000/cart', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        // 👉 FIX HERE: Use data.items instead of data directly
        setCart(data.items);
      } else {
        setCart([]);
      }
    } catch (error) {
      console.error('Failed to load cart', error);
      setCart([]);
    }
  };

  const addToCart = async (productId: number, quantity = 1, variantId?: number) => {
    try {
      const response = await fetch('http://localhost:3000/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ productId, quantity, variantId }),
      });
      if (response.ok) {
        await loadCart();
      }
    } catch (error) {
      alert('Không thể thêm vào giỏ hàng');
      console.error('Không thể thêm vào giỏ hàng:', error);
    }
  };

  const removeFromCart = async (productId: number, variantId?: number) => {
    try {
      const response = await fetch(
        `http://localhost:3000/cart/remove/${productId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
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
    try {
      const response = await fetch('http://localhost:3000/cart/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadCart();
    } else {
      setCart([]);
    }
  }, []);

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