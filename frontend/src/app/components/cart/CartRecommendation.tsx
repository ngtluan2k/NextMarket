import React from "react";
import { Card, Typography, Button, Image } from "antd";

const { Title, Text } = Typography;

export interface Product {
  id: number;
  name: string;
  price: number;
  img: string;
}

interface CartRecommendationProps {
  products?: Product[];
  onAddToCart?: (product: Product) => void;
}

export const CartRecommendation: React.FC<CartRecommendationProps> = ({
  products = [],
  onAddToCart,
}) => {
  return (
    <Card style={{ marginTop: 24 }}>
      <Title level={4}>Sản phẩm mua kèm</Title>

      {products.length === 0 ? (
        <Text type="secondary">Chưa có sản phẩm gợi ý</Text>
      ) : (
        <div style={{ display: "flex", gap: 16, overflowX: "auto" }}>
          {products.map((sp) => (
            <Card key={sp.id} style={{ minWidth: 160, textAlign: "center" }}>
              <Image
                src={sp.img}
                width={120}
                height={120}
                preview={false}
                style={{ borderRadius: 6, objectFit: "cover" }}
              />
              <Text>{sp.name}</Text>
              <br />
              <Text strong style={{ color: "red" }}>
                {sp.price.toLocaleString()}đ
              </Text>
              <Button
                type="primary"
                size="small"
                style={{ marginTop: 8 }}
                onClick={() => onAddToCart?.(sp)}
              >
                Thêm vào giỏ
              </Button>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
};
