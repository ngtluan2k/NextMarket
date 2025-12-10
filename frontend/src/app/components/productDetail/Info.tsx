import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Stars from '../productDetail/Stars';
import { TIKI_RED, vnd } from '../../types/productDetail';

export type VariantInfo = {
  id: number;
  sku: string;
  variant_name: string;
  price: number;
  stock: number;
  inventories?: Inventory[];
};

export type Inventory = {
  id: number;
  variant_sku: string;
  location: string;
  quantity: number;
  used_quantity: number;
};

export type PricingRule = {
  id: number;
  type: 'bulk' | 'subscription' | 'normal' | 'flash_sale';
  min_quantity: number;
  price: number;
  cycle?: string;
  starts_at?: string;
  ends_at?: string;
  name: string;
  status?: string;
  variant_sku?: string | null;
  sold?: number;
  remaining_quantity?: number;
  is_available: false | true;
  schedule?: {
    id: number;
    name: string;
    starts_at: string;
    ends_at: string;
  };
};

export type Brand = {
  id: number;
  name: string;
};

export type Category = {
  id: number;
  name: string;
};

export type Product = {
  id: number;
  name: string;
  slug: string;
  short_description?: string;
  description?: string;
  status: string;
  base_price: number;
  listPrice?: number;
  avg_rating?: string | number;
  review_count?: number;
  media?: { url: string }[];
  variants: VariantInfo[];
  pricing_rules?: PricingRule[];
  brand?: Brand;
  categories?: Category[];
};

export default function Info({
  product,
  selectedVariantId,
  setSelectedVariantId,
  onVariantNameClick,
  quantity,
  setQuantity,
  calculatedPrice,
  maxQuantity,
  setCalculatedPrice,
  selectedType,
  setSelectedType,
  selectedRuleId,
  setSelectedRuleId,
}: {
  product?: Product;
  selectedVariantId: number | null;
  setSelectedVariantId: (id: number) => void;
  onVariantNameClick?: (variantId: number) => void;
  quantity: number;
  setQuantity: (qty: number) => void;
  calculatedPrice: number;
  setCalculatedPrice: (price: number) => void;
  maxQuantity: number;
  selectedType?: 'bulk' | 'subscription' | 'normal' | 'flash_sale';
  setSelectedType: (
    type?: 'bulk' | 'subscription' | 'normal' | 'flash_sale'
  ) => void;
  selectedRuleId: number | null;
  setSelectedRuleId: (id: number | null) => void;
}) {
  const navigate = useNavigate();
  const pricingRules = product?.pricing_rules ?? [];

  /** --------------------- State --------------------- */
  // const [selectedRuleId, setSelectedRuleId] = useState<number | null>(null);
  const selectedRule = pricingRules.find((r) => r.id === selectedRuleId);

  /** --------------------- Selected Variant --------------------- */
  const selectedVariant = useMemo(
    () =>
      product?.variants.find((v: VariantInfo) => v.id === selectedVariantId),
    [product, selectedVariantId]
  );
  useEffect(() => {
    if (selectedRule) {
      setCalculatedPrice(Number(selectedRule.price));
      setSelectedType(selectedRule.type); // lưu bulk/subscription
    } else if (selectedVariant) {
      setCalculatedPrice(selectedVariant.price ?? product?.base_price ?? 0);
      setSelectedType(undefined);
    }
  }, [
    selectedRule,
    selectedVariant,
    product,
    setCalculatedPrice,
    setSelectedType,
  ]);

  useEffect(() => {
    // console.log('🧩 [Info] selectedRuleId (prop):', selectedRuleId);
  }, [selectedRuleId]);

  /** --------------------- Stock & Max Quantity --------------------- */
  const stock = selectedVariant?.stock ?? 0;
  const maxQty = Math.min(stock, maxQuantity);

  /** --------------------- Price & Discount --------------------- */
  const listPrice = Number(product?.listPrice ?? product?.base_price ?? 0);
  const discount =
    listPrice > calculatedPrice
      ? Math.round(((listPrice - calculatedPrice) / listPrice) * 100)
      : 0;

  /** --------------------- Rating --------------------- */
  const rating = Number(product?.avg_rating ?? 0);
  const reviewsCount = product?.review_count ?? 0;

  /** --------------------- Brand --------------------- */
  const brandName = product?.brand?.name ?? '';

  /** --------------------- Applied Pricing Rules --------------------- */
  const applicablePricingRules: PricingRule[] = useMemo(() => {
    if (!product?.pricing_rules || !selectedVariant) return [];

    const now = new Date();
    return product.pricing_rules
      .filter((r: PricingRule) => {
        // Filter by variant SKU
        if (r.variant_sku && r.variant_sku !== selectedVariant.sku)
          return false;

        // Check time range
        const start = new Date(r.starts_at ?? 0);
        const end = new Date(r.ends_at ?? 8640000000000000);
        if (now < start || now > end) return false;

        // Check quantity
        if (r.type === 'bulk') return quantity >= r.min_quantity;
        if (r.type === 'subscription')
          return quantity >= r.min_quantity && quantity % r.min_quantity === 0;

        return false;
      })
      .sort((a, b) => b.min_quantity - a.min_quantity);
  }, [product?.pricing_rules, selectedVariant, quantity]);

  /** --------------------- Auto-select rule --------------------- */
  useEffect(() => {
    const now = new Date();

    // Nếu user đã tự chọn, không override
    if (
      selectedRuleId &&
      !applicablePricingRules.every((r) => r.id !== selectedRuleId)
    )
      return;

    const flashSale = product?.pricing_rules?.find(
      (r) =>
        r.type === 'flash_sale' &&
        r.status === 'active' && // 👈 thêm
        r.is_available === true &&
        (!r.variant_sku || r.variant_sku === selectedVariant?.sku) &&
        new Date(r?.schedule?.starts_at ?? 0) <= now &&
        new Date(r?.schedule?.ends_at ?? 8640000000000000) >= now
    );

    if (flashSale) {
      setSelectedRuleId(flashSale.id);
    } else {
      setSelectedRuleId(applicablePricingRules[0]?.id ?? null);
    }
  }, [
    applicablePricingRules,
    product?.pricing_rules,
    selectedVariant,
    selectedRuleId,
  ]);

  /** --------------------- Final Price -> set state cha --------------------- */
  useEffect(() => {
    if (selectedVariant) {
      const price: number = selectedRuleId
        ? product?.pricing_rules?.find((r) => r.id === selectedRuleId)?.price ??
          selectedVariant.price ??
          product?.base_price ??
          0
        : applicablePricingRules[0]?.price ??
          selectedVariant.price ??
          product?.base_price ??
          0;

      setCalculatedPrice(price); // set state cha
    }
  }, [
    selectedVariant,
    selectedRuleId,
    applicablePricingRules,
    product,
    setCalculatedPrice,
  ]);

  /** --------------------- Handlers --------------------- */
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(1, Math.min(Number(e.target.value), maxQty));
    setQuantity(value);
  };

  /** --------------------- Render --------------------- */
  if (!product) return null;

  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
      {/* Tag */}
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded border border-emerald-500 px-2 py-[2px] font-medium text-emerald-600">
          30 NGÀY ĐỔI TRẢ
        </span>
        <span className="rounded border border-sky-500 px-2 py-[2px] font-medium text-sky-600">
          CHÍNH HÃNG
        </span>
        {brandName && (
          <span className="text-slate-500">
            Thương hiệu:{' '}
            <button
              type="button"
              onClick={() =>
                navigate(`/brands/${product.brand?.id ?? brandName}`)
              }
              className="text-sky-700 hover:underline"
            >
              {brandName}
            </button>
          </span>
        )}
      </div>

      {/* Product Name */}
      <h1 className="text-[22px] font-semibold leading-snug text-slate-900">
        {product.name}
      </h1>

      {/* Rating */}
      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
        <span className="flex items-center gap-1 text-slate-700">
          <Stars value={rating} />
          <span className="ml-1 text-slate-500">
            {rating} ({reviewsCount} đánh giá)
          </span>
        </span>
      </div>

      {/* Price */}
      <div className="mt-3 flex items-end gap-3">
        <div
          className="text-[28px] font-bold leading-none"
          style={{ color: TIKI_RED }}
        >
          {new Intl.NumberFormat('vi-VN').format(calculatedPrice)}
        </div>
        {listPrice && listPrice !== calculatedPrice && (
          <div className="text-slate-400 line-through">{vnd(listPrice)}</div>
        )}
        {discount > 0 && (
          <span className="rounded-full bg-rose-50 px-2 py-[2px] text-sm font-semibold text-rose-600">
            -{discount}%
          </span>
        )}
      </div>

      {/* Variant selection */}
      {product.variants.length > 1 && (
        <div className="mt-3 flex gap-2 flex-wrap">
          {product.variants.map((v: VariantInfo) => (
            <button
              key={v.id}
              className={`px-3 py-1 border rounded ${
                v.id === selectedVariantId
                  ? 'border-blue-500 text-blue-600'
                  : 'border-gray-300'
              }`}
              onClick={() => {
                setSelectedVariantId(v.id);
                // Trigger gallery scroll to variant's first image
                onVariantNameClick?.(v.id);
              }}
            >
              {v.variant_name} ({vnd(v.price)})
            </button>
          ))}
        </div>
      )}

      {/* Quantity */}
      {/* <div className="mt-2 flex items-center gap-2">
        <span>Số lượng:</span>
        <input
          type="number"
          min={1}
          max={maxQty || 1}
          value={quantity}
          onChange={handleQuantityChange}
          className="border px-2 py-1 rounded w-20"
        />
        {quantity === maxQty && maxQty > 0 && (
          <span className="px-2 py-0.5 text-xs rounded-full bg-rose-100 text-rose-700 font-medium">
            Đã đạt tối đa
          </span>
        )}
      </div> */}

      {/* Pricing Rules */}
      {pricingRules.length > 0 && (
        <div className="mt-2 text-sm text-slate-500">
          <span className="font-medium">Dịch vụ:</span>
          <div className="mt-1 flex gap-2 flex-wrap">
            {pricingRules
              .filter(
                (r) => !r.variant_sku || r.variant_sku === selectedVariant?.sku
              )
              .sort((a, b) => a.min_quantity - b.min_quantity)
              .map((r) => {
                console.log('Pricing rule debug:', r);

                const now = new Date();

                const isValid = (() => {
                  const now = new Date();

                  // ❗ Rule tắt thì auto skip
                  if (r.status !== 'active' || r.is_available === false)
                    return false;

                  // 🔥 FLASH SALE dùng schedule object
                  if (r.type === 'flash_sale') {
                    const schedule = r.schedule;
                    if (!schedule) return false;

                    const start = schedule.starts_at
                      ? new Date(schedule.starts_at)
                      : null;
                    const end = schedule.ends_at
                      ? new Date(schedule.ends_at)
                      : null;

                    if (!start || !end) return false;

                    return now >= start && now <= end;
                  }

                  // 🟢 Các rule khác dùng root dates
                  const start = r.starts_at ? new Date(r.starts_at) : null;
                  const end = r.ends_at ? new Date(r.ends_at) : null;

                  const inTimeRange =
                    (!start || now >= start) && (!end || now <= end);
                  if (!inTimeRange) return false;

                  // 📌 Phụ thuộc rule type
                  if (r.type === 'bulk') return quantity >= r.min_quantity;

                  if (r.type === 'subscription')
                    return (
                      quantity >= r.min_quantity &&
                      quantity % r.min_quantity === 0
                    );

                  return true;
                })();

                const isActive = selectedRuleId === r.id;

                return (
                  <button
                    key={r.id}
                    className={`px-2 py-1 rounded border transition-colors
                      ${
                        isActive
                          ? 'border-blue-500 bg-blue-50 text-blue-600 font-semibold'
                          : isValid
                          ? r.type === 'flash_sale'
                            ? 'border-amber-500 bg-amber-50 text-amber-600'
                            : 'border-rose-500 bg-rose-50 text-rose-600'
                          : 'border-gray-300 text-gray-400 cursor-not-allowed'
                      }`}
                    disabled={!isValid}
                    onClick={() => setSelectedRuleId(r.id)}
                  >
                    {r.type === 'flash_sale' && <span>🔥 </span>}
                    {r.name} — {r.min_quantity}+ : {vnd(r.price)}
                    {r.type === 'flash_sale' && isValid && (
                      <span className="ml-1 text-red-500">(Đang diễn ra)</span>
                    )}
                  </button>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
