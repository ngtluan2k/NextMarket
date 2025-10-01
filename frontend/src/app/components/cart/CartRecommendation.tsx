import React from "react";
import { Card, Typography, Button, Image } from "antd";
import { Product } from "../../types/product";

const { Title, Text } = Typography;

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
          {products.map((p) => (
            <Card key={p.id} style={{ minWidth: 160, textAlign: "center" }}>
              <Image
                // src={p.media.}
                width={120}
                height={120}
                preview={false}
                style={{ borderRadius: 6, objectFit: "cover" }}
              />
              <Text>{p.name}</Text>
              <br />
              <Text strong style={{ color: "red" }}>
                {p.listPrice}đ
              </Text>
              <Button
                type="primary"
                size="small"
                style={{ marginTop: 8 }}
                onClick={() => onAddToCart?.(p)}
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
