import type React from 'react';
import { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Typography,
  Button,
  Badge,
  Spin,
  Empty,
  message,
} from 'antd';
import { ShoppingOutlined } from '@ant-design/icons';
import { ProductCard } from './ProductCard';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

interface Product {
  id: number;
  uuid: string;
  name: string;
  price: number;
  image?: string;
}

export const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart, cart } = useCart();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const showMessage = (
    type: 'success' | 'error' | 'warning',
    content: string
  ) => {
    messageApi.open({
      type,
      content,
    });
  };

  useEffect(() => {
<<<<<<< HEAD
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:3000/products', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Unauthorized');
        }

        const data = await res.json();
        setProducts(
          data.data.map((p: any) => ({
            ...p,
            price: p.base_price,
            image:
              p.media?.find((m: any) => m.is_primary)?.url || p.media?.[0]?.url,
          }))
        );
      } catch (err) {
        console.error('Fetch products error:', err);
        showMessage('error', 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleAddToCart = async (productId: number) => {
    // eslint-disable-next-line no-useless-catch
    try {
      await addToCart(productId);
    } catch (error) {
      throw error;
    }
  };
=======
const fetchProducts = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:3000/products", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Unauthorized");

    const data = await res.json();

    const products = (data.data || data).map((p: any) => ({
      id: p.id,
      uuid: p.uuid,
      name: p.name,
      price: Number(p.base_price || 0),
      image: p.media?.find((m: any) => m.is_primary)?.url,
    }));

    setProducts(products);
  } catch (err) {
    console.error("Fetch products error:", err);
  }
};

>>>>>>> a7ed62425b572e13be474147b8ed61db58b15377

  const handleOpenCart = () => {
    navigate('/cart');
  };
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: '24px' }}>
      {contextHolder}
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 32,
          }}
        >
          <div>
            <Title level={1} style={{ margin: 0 }}>
              Featured Products
            </Title>
            <Paragraph style={{ fontSize: '16px', margin: '8px 0 0 0' }}>
              Discover our curated collection of premium items
            </Paragraph>
          </div>
          <Badge count={cartItemCount} showZero>
            <Button
              type="primary"
              size="large"
              icon={<ShoppingOutlined />}
              style={{ borderRadius: 8 }}
              onClick={() => handleOpenCart()}
            >
              View Cart
            </Button>
          </Badge>
        </div>

        {products.length > 0 ? (
          <Row gutter={[24, 24]}>
            {products.map((product) => (
              <Col key={product.id} xs={24} sm={12} md={8} lg={6}>
                <ProductCard
                  name={product.name}
                  price={product.price}
                  image={product.image}
                  productId={product.id}
                  onAddToCart={handleAddToCart}
                  showMessage={showMessage}
                />
              </Col>
            ))}
          </Row>
        ) : (
          <Empty
            description="No products available at the moment"
            style={{ padding: '64px 0' }}
          />
        )}
      </div>
    </div>
  );
};
