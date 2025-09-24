// src/components/checkout/ShippingMethod.tsx
import React from "react";
import { Card, Radio, Tag, Typography, Image } from "antd";
const { Text } = Typography;

export type CheckoutItem = {
  id: number;
  name: string;
  image?: string;
  quantity: number;
  /** Có thể là number hoặc string từ API */
  price: number | string;
  /** giá cũ (để gạch) nếu có – cũng có thể là string */
  oldPrice?: number | string;
};

export type ShippingMethodType = "economy" | "fast";

type Props = {
  items: CheckoutItem[];
  selected: ShippingMethodType;
  onChange: (m: ShippingMethodType) => void;

  etaLabel?: string;
  storeName?: string;
  saving?: number | null;
  /** phí ship hiện tại */
  shippingFee?: number | string | null;
  /** phí ship cũ để gạch (ví dụ 32.700đ) */
  shippingFeeOld?: number | string | null;

  methodLabel?: string;
  badgeLabel?: string;
};

/** Ép về số an toàn */
const toNum = (v: number | string | null | undefined) => {
  if (v === null || v === undefined) return null;
  const n = typeof v === "string" ? Number((v as string).replace(/[^\d.-]/g, "")) : v;
  return Number.isFinite(n) ? (n as number) : null;
};

/** Format VND (có đ) – hiển thị rỗng nếu không hợp lệ */
const fmt = (v?: number | string | null) => {
  const n = toNum(v);
  return n === null ? "" : `${n.toLocaleString("vi-VN")} đ`;
};

export const ShippingMethod: React.FC<Props> = ({
  items,
  selected,
  onChange,
  etaLabel,
  storeName,
  saving,
  shippingFee,
  shippingFeeOld,
  methodLabel = "Giao tiết kiệm",
  badgeLabel = "GIAO TIẾT KIỆM",
}) => {
  return (
    <Card title="Chọn hình thức giao hàng" styles={{ body: { paddingTop: 12 } }}>
      <Radio.Group
        value={selected}
        onChange={(e) => onChange(e.target.value as ShippingMethodType)}
        style={{ width: "100%" }}
      >
        <Card
          size="small"
          style={{
            marginBottom: 12,
            border: selected === "economy" ? "1px solid #1677ff" : "1px solid #f0f0f0",
            background: selected === "economy" ? "rgba(22,119,255,0.06)" : "transparent",
          }}
          bodyStyle={{ padding: 12 }}
        >
          <div className="flex items-center gap-8">
            <Radio value="economy">{methodLabel}</Radio>
            {typeof saving === "number" && saving > 0 && (
              <Text type="secondary" style={{ color: "#52c41a" }}>
                -{Math.round(saving / 1000)}K
              </Text>
            )}
          </div>
        </Card>
      </Radio.Group>

      <Card size="small" type="inner" style={{ marginTop: 8 }} bodyStyle={{ padding: 12 }}>
        {etaLabel && (
          <div className="flex items-center gap-2 mb-10" style={{ fontWeight: 500 }}>
            📦 <span style={{ color: "#1677ff" }}>{etaLabel}</span>
          </div>
        )}

        <div
          className="grid grid-cols-[1fr_260px] gap-12"
          style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 12 }}
        >
          {/* Trái: danh sách sản phẩm */}
          <div>
            {badgeLabel && (
              <Text type="secondary" style={{ fontWeight: 500 }}>
                {badgeLabel}
              </Text>
            )}

            {items.map((it) => {
              const p = toNum(it.price);
              const op = toNum(it.oldPrice);
              return (
                <div
                  key={it.id}
                  className="items-center"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "56px 1fr auto",
                    gap: 12,
                    marginTop: 12,
                  }}
                >
                  <Image
                    src={it.image}
                    alt={it.name}
                    width={56}
                    height={56}
                    style={{ borderRadius: 8, objectFit: "cover" }}
                    preview={false}
                    fallback="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='56' height='56'/>"
                  />

                  {/* Tên + SL */}
                  <div style={{ lineHeight: 1.4 }}>
                    <Text ellipsis style={{ maxWidth: 320 }}>
                      {it.name}
                    </Text>
                    <div>
                      <Text type="secondary">SL: x{it.quantity}</Text>
                    </div>
                  </div>

                  {/* GIÁ BÊN PHẢI */}
                  <div className="text-right" style={{ minWidth: 110 }}>
                    {op !== null && p !== null && op > p && (
                      <Text
                        delete
                        type="secondary"
                        style={{ display: "block", fontSize: 12, lineHeight: 1 }}
                      >
                        {fmt(op)}
                      </Text>
                    )}
                    <Text strong style={{ color: "#cf1322", fontSize: 16 }}>
                      {fmt(p)}
                    </Text>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Phải: phí ship + cửa hàng */}
          <div className="flex flex-col gap-2">
            {(toNum(shippingFee) !== null || toNum(shippingFeeOld) !== null) && (
              <div className="flex items-center gap-10">
                {toNum(shippingFeeOld) !== null && toNum(shippingFeeOld)! > 0 && (
                  <Text delete type="secondary">{fmt(shippingFeeOld)}</Text>
                )}

                {toNum(shippingFee) === 0 ? (
                  <Tag color="green">MIỄN PHÍ</Tag>
                ) : (
                  toNum(shippingFee) !== null && <Text strong>{fmt(shippingFee)}</Text>
                )}
              </div>
            )}

            {storeName && (
              <div
                style={{
                  background: "#f5f5f5",
                  border: "1px solid #eee",
                  borderRadius: 8,
                  padding: "8px 12px",
                }}
              >
                <div className="flex items-center gap-10">
                  🚚
                  <div>
                    <Text>Được giao bởi</Text>
                    <div style={{ fontWeight: 600 }}>{storeName}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Link mã shop (tuỳ chọn) */}
        <div
          className="flex items-center gap-2 mt-12"
          style={{ color: "#1677ff", cursor: "pointer" }}
        >
          🧾 Thêm mã khuyến mãi của Shop
          <div style={{ marginLeft: "auto", color: "#999" }}>›</div>
        </div>
      </Card>
    </Card>
  );
};
