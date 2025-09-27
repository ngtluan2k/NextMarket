import React from "react";
import { Card, Radio, Button, Tag } from "antd";
import {
  CreditCardOutlined,
  MobileOutlined,
  WalletOutlined,
  QrcodeOutlined,
  HomeOutlined,
  DollarOutlined,
} from "@ant-design/icons";

export type PaymentMethodType = string;

export type SavedCard = {
  id: string | number;
  brand: string;
  last4: string;
  exp: string;
};

export type PaymentMethodResponse = {
  id: number;
  uuid: string;
  name: string;
  type: string;
  config: Record<string, any>;
  enabled: boolean;
  createdAt: string;
};

type Props = {
  selected: PaymentMethodType;
  onChange: (m: PaymentMethodType) => void;
  methods: PaymentMethodResponse[];
  savedCards?: SavedCard[];
};

// Map icon cho từng loại
const getPaymentIcon = (type: string) => {
  switch (type) {
    case "cod":
      return <HomeOutlined style={{ fontSize: 20, color: "#1677ff" }} />;
    case "momo":
      return <MobileOutlined style={{ fontSize: 20, color: "#e83e8c" }} />;
    case "zalopay":
      return <WalletOutlined style={{ fontSize: 20, color: "#00b4ff" }} />;
    case "vnpay":
      return <QrcodeOutlined style={{ fontSize: 20, color: "#d32f2f" }} />;
    case "viettel_money":
      return <DollarOutlined style={{ fontSize: 20, color: "#ff9800" }} />;
    case "card":
      return <CreditCardOutlined style={{ fontSize: 20, color: "#4caf50" }} />;
    default:
      return <WalletOutlined style={{ fontSize: 20, color: "#999" }} />;
  }
};

const PaymentMethods: React.FC<Props> = ({
  selected,
  onChange,
  methods,
  savedCards = [],
}) => {
  return (
    <Card title="Chọn hình thức thanh toán" styles={{ body: { paddingTop: 12 } }}>
      {methods.map((m) => (
        <div
          key={m.id}
          role="button"
          onClick={() => onChange(m.type)}
          style={{
            display: "flex",
            alignItems: "center",
            padding: "10px 12px",
            borderRadius: 10,
            border: selected === m.type ? "1px solid #1677ff" : "1px solid #f0f0f0",
            background: selected === m.type ? "rgba(22,119,255,0.06)" : "transparent",
            marginBottom: 8,
            cursor: "pointer",
          }}
        >
          <Radio value={m.type} checked={selected === m.type} />
          <span style={{ marginLeft: 12, marginRight: 8 }}>{getPaymentIcon(m.type)}</span>
          <span style={{ fontWeight: 500 }}>{m.name}</span>
        </div>
      ))}

      {selected === "card" && (
        <div style={{ marginTop: 12, paddingLeft: 30 }}>
          {savedCards.length > 0 && (
            <div style={{ marginBottom: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {savedCards.map((c) => (
                <Tag key={c.id} style={{ padding: "4px 8px" }}>
                  {c.brand} •••• {c.last4} — {c.exp}
                </Tag>
              ))}
            </div>
          )}
          <Button type="dashed" icon={<CreditCardOutlined />}>
            Thêm thẻ mới
          </Button>
        </div>
      )}
    </Card>
  );
};

export default PaymentMethods;