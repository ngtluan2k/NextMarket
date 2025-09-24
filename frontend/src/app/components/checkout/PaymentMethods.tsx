// src/components/checkout/PaymentMethods.tsx
import React from "react";
import { Card, Radio, Typography, Button, Tag } from "antd";
import { PlusOutlined } from "@ant-design/icons";

const { Text } = Typography;

export type PaymentMethodType =
  | "cod"
  | "viettel_money"
  | "momo"
  | "zalopay"
  | "vnpay_qr"
  | "card";

type PMeta = {
  label: string;
  desc?: string;
  // Dùng badge chữ thay cho logo để khỏi phụ thuộc asset.
  // Nếu bạn có ảnh logo, truyền vào qua props.icons để override.
  badgeText?: string;
  badgeBg?: string;
};

const META: Record<PaymentMethodType, PMeta> = {
  cod: { label: "Thanh toán tiền mặt", badgeText: "₫", badgeBg: "#e6f4ff" },
  viettel_money: { label: "Viettel Money", badgeText: "VT", badgeBg: "#ffebe6" },
  momo: { label: "Ví Momo", badgeText: "mo", badgeBg: "#ffe6f1" },
  zalopay: { label: "Ví ZaloPay", badgeText: "ZP", badgeBg: "#e6f7ff" },
  vnpay_qr: {
    label: "VNPAY",
    desc: "Quét Mã QR từ ứng dụng ngân hàng",
    badgeText: "VN",
    badgeBg: "#fff1f0",
  },
  card: {
    label: "Thẻ tín dụng/ Ghi nợ",
    badgeText: "CC",
    badgeBg: "#f6ffed",
  },
};

export type SavedCard = {
  id: string;
  brand: "Visa" | "Mastercard" | "JCB" | string;
  last4: string;
  exp: string; // MM/YY
};

type IconsOverride = Partial<Record<PaymentMethodType, React.ReactNode>>;

type Props = {
  selected: PaymentMethodType;
  onChange: (m: PaymentMethodType) => void;

  /** hiển thị các method nào (mặc định tất cả) */
  methods?: PaymentMethodType[];

  /** disable từng method nếu cần */
  disabled?: Partial<Record<PaymentMethodType, boolean>>;

  /** override icon/logo cho từng method (ví dụ <img src="/momo.svg" />) */
  icons?: IconsOverride;

  /** thẻ đã lưu – hiện nút "Thêm thẻ mới" dưới khi chọn card */
  savedCards?: SavedCard[];
  onAddCard?: () => void;
};

const BrandPill: React.FC<{ text: string }> = ({ text }) => (
  <span
    style={{
      border: "1px solid #e5e7eb",
      borderRadius: 6,
      padding: "2px 6px",
      fontSize: 12,
      fontWeight: 500,
      lineHeight: 1.2,
    }}
  >
    {text}
  </span>
);

const LogoBadge: React.FC<{ bg: string; text: string }> = ({ bg, text }) => (
  <div
    style={{
      width: 28,
      height: 28,
      borderRadius: 6,
      background: bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 12,
      fontWeight: 700,
      color: "#333",
    }}
  >
    {text}
  </div>
);

const Row: React.FC<{
  value: PaymentMethodType;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
  leftIcon?: React.ReactNode;
  label: string;
  desc?: string;
  right?: React.ReactNode;
}> = ({ value, selected, disabled, onSelect, leftIcon, label, desc, right }) => {
  return (
    <div
      role="button"
      onClick={() => !disabled && onSelect()}
      style={{
        display: "grid",
        gridTemplateColumns: "24px 32px 1fr auto",
        gap: 12,
        alignItems: "center",
        padding: "10px 12px",
        borderRadius: 10,
        border: selected ? "1px solid #1677ff" : "1px solid #f0f0f0",
        background: selected ? "rgba(22,119,255,0.06)" : "transparent",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        marginBottom: 8,
      }}
    >
      <Radio
        value={value}
        checked={selected}
        onChange={() => !disabled && onSelect()}
        disabled={disabled}
      />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        {leftIcon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 500 }}>{label}</div>
        {desc && (
          <div style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>{desc}</div>
        )}
      </div>
      {right}
    </div>
  );
};

const PaymentMethods: React.FC<Props> = ({
  selected,
  onChange,
  methods = ["cod", "viettel_money", "momo", "zalopay", "vnpay_qr", "card"],
  disabled = {},
  icons = {},
  savedCards = [],
  onAddCard,
}) => {
  return (
    <Card title="Chọn hình thức thanh toán" styles={{ body: { paddingTop: 12 } }}>
      {methods.map((m) => {
        const meta = META[m];
        const customIcon = icons[m];
        const leftIcon =
          customIcon ??
          (meta.badgeText ? (
            <LogoBadge bg={meta.badgeBg!} text={meta.badgeText} />
          ) : null);

        // cột phải
        let right: React.ReactNode = null;
        if (m === "card") {
          right = (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <BrandPill text="VISA" />
              <BrandPill text="Mastercard" />
              <BrandPill text="JCB" />
            </div>
          );
        }

        return (
          <Row
            key={m}
            value={m}
            selected={selected === m}
            disabled={disabled[m]}
            onSelect={() => onChange(m)}
            leftIcon={leftIcon}
            label={meta.label}
            desc={meta.desc}
            right={right}
          />
        );
      })}

      {/* khu vực thẻ khi chọn "card" */}
      {selected === "card" && (
        <div style={{ marginTop: 12, paddingLeft: 68 }}>
          {savedCards.length > 0 && (
            <div style={{ marginBottom: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {savedCards.map((c) => (
                <Tag key={c.id} style={{ padding: "4px 8px" }}>
                  {c.brand} •••• {c.last4} — {c.exp}
                </Tag>
              ))}
            </div>
          )}
          <Button icon={<PlusOutlined />} onClick={onAddCard}>
            Thêm thẻ mới
          </Button>
        </div>
      )}
    </Card>
  );
};

export default PaymentMethods;
