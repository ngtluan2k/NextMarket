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
    media: { url: string; is_primary?: boolean }
  };
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (productId: number, quantity?: number) => Promise<void>;
  removeFromCart: (productId: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  refreshCart: () => Promise<void>;
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

  const refreshCart = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log("Token đang gửi:", token);
      const response = await fetch('http://localhost:3000/cart', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      console.log("Status:", response.status);
      if (response.ok) {
        const data = await response.json();
        setCart(
          data.map((item: any) => ({
            ...item,
            product: { ...item.product, price: item.product.base_price },
          }))
        );
      }
    } catch (error) {
      console.error('Không thể lấy giỏ hàng:', error);
    }
  };

  const addToCart = async (productId: number, quantity = 1) => {
    try {
      const response = await fetch('http://localhost:3000/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ productId, quantity }),
      });
      if (response.ok) {
        await refreshCart();
      }
    } catch (error) {
      console.error('Không thể thêm vào giỏ hàng:', error);
    }
  };

  const removeFromCart = async (productId: number) => {
    try {
      const response = await fetch(
        `http://localhost:3000/cart/remove/${productId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      if (response.ok) {
        await refreshCart();
      }
    } catch (error) {
      console.error('Không thể xóa khỏi giỏ hàng:', error);
    }
  };

  const updateQuantity = async (productId: number, quantity: number) => {
    try {
      const response = await fetch('http://localhost:3000/cart/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ productId, quantity }),
      });
      if (response.ok) {
        await refreshCart();
      }
    } catch (error) {
      console.error('Không thể cập nhật số lượng:', error);
    }
  };

  useEffect(() => {
    refreshCart();
  }, []);

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQuantity, refreshCart }}
    >
      {children}
    </CartContext.Provider>
  );
};
