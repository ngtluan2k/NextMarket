import type React from 'react';
import { Card, Button, Typography, Image } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface ProductCardProps {
  name: string;
  price: number;
  image?: string;
  productId: number;
  onAddToCart: (productId: number) => void;
  showMessage?: (
    type: 'success' | 'error' | 'warning',
    content: string
  ) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  name,
  price,
  image,
  productId,
  onAddToCart,
  showMessage,
}) => {
  const handleAddToCart = (productId: number) => {
    try {
      onAddToCart(productId);
      showMessage?.('success', `Added ${name} to cart successfully`);
    } catch (error) {
      showMessage?.('error', `Failed to add ${name} to cart`);
    }
  };

  return (
    <Card
      hoverable
      cover={
        <div style={{ height: 240, overflow: 'hidden' }}>
          <Image
            alt={name}
            src={
              image ||
              '/placeholder.svg?height=240&width=240&query=elegant product placeholder'
            }
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            preview={false}
          />
        </div>
      }
      actions={[
        <Button
          key="add-to-cart"
          type="primary"
          icon={<ShoppingCartOutlined />}
          onClick={() => handleAddToCart(productId)}
          style={{ width: '90%' }}
        >
          Add to Cart
        </Button>,
      ]}
      style={{ borderRadius: 12 }}
    >
      <Title
        level={4}
        style={{ margin: '0 0 8px 0', fontSize: '16px' }}
        ellipsis={{ rows: 2 }}
      >
        {name}
      </Title>
      <Text strong style={{ fontSize: '20px', color: '#1890ff' }}>
        ${price}
      </Text>
    </Card>
  );
};
