import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import StatusBadge from '../../../components/campaign/StatusBadge';
import RegisterModal from '../../../components/campaign/RegisterModal';
import { storeService } from '../../../../service/store.service';
import { productService, Product } from '../../../../service/product.service';
import {
  Campaign,
  getCampaignDetailForStore,
  registerStoreForCampaign,
  RegisteredProduct,
} from '../../../../service/campaign.service';

/* ============ BackButton đẹp ============ */
function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
      aria-label="Quay lại"
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      Quay lại
    </button>
  );
}

/* ============ Helpers chung ============ */
function formatVNDD(n?: number | string | null) {
  if (n == null || n === '') return '';
  const v = typeof n === 'string' ? Number(n) : n;
  if (Number.isNaN(v)) return '';
  return v.toLocaleString('vi-VN') + '₫';
}

// Chuyển đổi URL thành tuyệt đối nếu cần thiết
function toAbsoluteUrl(url: string) {
  if (url && !url.startsWith('http')) {
    return `${window.location.origin}${url}`;
  }
  return url;
}

type RegisteredStats = { products: number; variants: number; minPrice?: number; maxPrice?: number };
function computeRegisteredStats(items: RegisteredProduct[]): RegisteredStats {
  const prices: number[] = [];
  let variants = 0;
  items.forEach((p) => {
    if (p.base_price != null && !Number.isNaN(Number(p.base_price))) prices.push(Number(p.base_price));
    (p.variants || []).forEach((v) => {
      if (v.price != null && !Number.isNaN(Number(v.price))) prices.push(Number(v.price));
      variants++;
    });
  });
  prices.sort((a, b) => a - b);
  return { products: items.length, variants, minPrice: prices[0], maxPrice: prices[prices.length - 1] };
}

/* ============ RegisteredProductsDetail Component ============ */
function RegisteredProductsDetail({ items }: { items: RegisteredProduct[] }) {
  const [q, setQ] = useState('');
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [view, setView] = useState<'table' | 'list'>('table');

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        (p.variants || []).some((v) => v.variant_name.toLowerCase().includes(s))
    );
  }, [items, q]);

  const stats = useMemo(() => computeRegisteredStats(filtered), [filtered]);
  const toggle = (id: number) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="space-y-3">
      {/* Stats + controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
          <span className="px-2 py-1 rounded bg-gray-100">SP: <b>{stats.products}</b></span>
          <span className="px-2 py-1 rounded bg-gray-100">Biến thể: <b>{stats.variants}</b></span>
          {typeof stats.minPrice === 'number' && typeof stats.maxPrice === 'number' && (
            <span className="px-2 py-1 rounded bg-gray-100">
              Giá: <b>{formatVNDD(stats.minPrice)}</b> – <b>{formatVNDD(stats.maxPrice)}</b>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Lọc theo tên SP/biến thể..."
              className="w-[220px] rounded-lg border px-4 py-2 pl-8 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <svg className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" viewBox="0 0 24 24" fill="none">
              <path d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <div className="flex rounded-lg border overflow-hidden">
            <button
              onClick={() => setView('table')}
              className={`px-2.5 py-1.5 text-sm ${view === 'table' ? 'bg-sky-50 text-sky-700' : 'bg-white text-gray-700'}`}
            >
              Bảng
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-2.5 py-1.5 text-sm ${view === 'list' ? 'bg-sky-50 text-sky-700' : 'bg-white text-gray-700'}`}
            >
              Danh sách
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-sm text-gray-500">Không khớp kết quả.</div>
      ) : view === 'table' ? (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-3 py-2">Sản phẩm</th>
                <th className="text-left px-3 py-2">Biến thể</th>
                <th className="text-left px-3 py-2">Giá</th>
                <th className="text-left px-3 py-2">Giá SP gốc</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const vs =
                  p.variants && p.variants.length > 0
                    ? p.variants
                    : [{ id: 0, variant_name: '—', price: p.base_price ?? '' }];
                return vs.map((v, idx) => (
                  <tr key={`${p.id}:${v.id || idx}`} className="border-t">
                    <td className="px-3 py-2 align-top"><div className="font-medium">{p.name}</div></td>
                    <td className="px-3 py-2 align-top">{v.variant_name}</td>
                    <td className="px-3 py-2 align-top">{formatVNDD(v.price as any)}</td>
                    <td className="px-3 py-2 align-top">{p.base_price != null ? formatVNDD(p.base_price as any) : '—'}</td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <div key={p.id} className="border rounded-xl">
              <button onClick={() => toggle(p.id)} className="w-full flex items-center justify-between px-3 py-2">
                <div className="text-left">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-gray-500">
                    Giá gốc: {p.base_price != null ? formatVNDD(p.base_price as any) : '—'}
                  </div>
                </div>
                <span className="text-xs text-gray-500">{p.variants?.length || 0} biến thể</span>
              </button>
              {expanded[p.id] && (
                <div className="px-3 pb-3">
                  {p.variants && p.variants.length > 0 ? (
                    <ul className="text-sm list-disc pl-5 space-y-1">
                      {p.variants.map((v) => (
                        <li key={v.id} className="flex items-center gap-2">
                          <span className="text-gray-700">{v.variant_name}</span>
                          <span className="text-gray-500">— {formatVNDD(v.price)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-gray-500">Không có biến thể — dùng giá gốc.</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================ Component chính ============================ */
export default function StoreCampaignDetail({
  campaignId,
  onBack,
}: {
  campaignId: number;
  onBack: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [registered, setRegistered] = useState(false);
  const [registeredProducts, setRegisteredProducts] = useState<RegisteredProduct[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [storeId, setStoreId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // hiển thị banner nếu có & ảnh load ok
  const [showBanner, setShowBanner] = useState<boolean>(false);
  useEffect(() => setShowBanner(!!campaign?.banner_url), [campaign]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const s = await storeService.getMyStore();
        if (!s) throw new Error('Không tìm thấy cửa hàng.');
        setStoreId(s.id);

        const { campaign: detailCampaign, registeredStore } = await getCampaignDetailForStore(campaignId);
        setCampaign(detailCampaign);
        setRegistered(!!registeredStore);

        if (registeredStore?.products) {
          const map = new Map<number, RegisteredProduct>();
          (registeredStore.products as any[]).forEach((p) => {
            const pid = p.product.id;
            if (!map.has(pid)) {
              map.set(pid, {
                id: pid,
                name: p.product.name,
                base_price: p.product.base_price ? Number(p.product.base_price) : undefined,
                variants: [],
              });
            }
            if (p.variant) {
              map.get(pid)!.variants!.push({
                id: p.variant.id,
                variant_name: p.variant.variant_name,
                price: Number(p.variant.price),
              });
            }
          });
          setRegisteredProducts(Array.from(map.values()));
        }

        const prods = await productService.getStoreProducts(s.id);
        setProducts((prods || []).filter((p) => p.status === 'active'));
      } catch (e: any) {
        setError(e?.message || 'Đã có lỗi xảy ra.');
      } finally {
        setLoading(false);
      }
    })();
  }, [campaignId]);

  const onConfirmRegister = async (items: { productId: number; variantId?: number }[]) => {
    if (!campaign || !storeId) return;
    await registerStoreForCampaign(campaign.id, items);
    setRegistered(true);

    // Cập nhật UI tối thiểu
    const chosen: RegisteredProduct[] = [];
    items.forEach((it) => {
      const p = products.find((pp) => pp.id === it.productId);
      if (!p) return;
      let rp = chosen.find((c) => c.id === p.id);
      if (!rp) {
        rp = { id: p.id, name: p.name, base_price: p.base_price ? Number(p.base_price) : undefined, variants: [] };
        chosen.push(rp);
      }
      if (it.variantId) {
        const v = p.variants?.find((vv) => vv.id === it.variantId);
        if (v) rp.variants!.push({ id: v.id, variant_name: v.variant_name, price: Number(v.price) });
      }
    });
    setRegisteredProducts(chosen);
    setModalOpen(false);
  };

  if (loading) return <div className="p-6 text-sm text-gray-500">Đang tải...</div>;
  if (error) return <div className="p-6 text-sm text-red-600">{error}</div>;
  if (!campaign) return <div className="p-6">Không có dữ liệu</div>;

  const canRegister = campaign.status !== 'ended';

  return (
    <div className="px-3 sm:px-6 pt-2 sm:pt-3 pb-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <BackButton onClick={onBack} />
      </div>

      
      <div className="mt-3 rounded-2xl bg-white shadow-sm overflow-hidden">
        {showBanner ? (
          <img
            src={toAbsoluteUrl(campaign.banner_url as string)}  
            alt={campaign.name}
            className="w-full h-40 sm:h-48 object-cover"
            onError={() => setShowBanner(false)}  
          />
        ) : (
          <div className="h-12 bg-gradient-to-r from-sky-50 to-indigo-50 border-b border-gray-100" />
        )}

        <div className="p-4 sm:p-5 space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <h3 className="text-xl font-semibold">{campaign.name}</h3>
            <StatusBadge status={campaign.status as any} />
          </div>

          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path d="M7 2v3M17 2v3M3.5 9h17M6 13h4M6 17h12M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2"/>
              </svg>
              {dayjs(campaign.starts_at).format('DD/MM/YYYY')} – {dayjs(campaign.ends_at).format('DD/MM/YYYY')}
            </div>
            {(campaign as any).budget && (
              <div className="text-gray-600">
                Ngân sách: <span className="font-medium">{formatVNDD((campaign as any).budget)}</span>
              </div>
            )}
          </div>

          {campaign.description && (
            <p className="text-sm text-gray-700 leading-relaxed">{campaign.description}</p>
          )}

          <hr className="my-2" />

          {registered ? (
            <div>
              <h4 className="font-semibold mb-2">Sản phẩm đã đăng ký</h4>
              {registeredProducts.length > 0 ? (
                <RegisteredProductsDetail items={registeredProducts} />
              ) : (
                <div className="text-sm text-gray-500">Chưa có sản phẩm.</div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-sm text-gray-500">Chưa đăng ký. Hãy chọn sản phẩm/biến thể để tham gia.</div>
              <button
                onClick={() => setModalOpen(true)}
                disabled={!canRegister}
                className={`px-4 py-2 rounded-lg text-sm ${
                  canRegister ? 'bg-sky-600 text-white hover:bg-sky-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                Đăng ký tham gia
              </button>
            </div>
          )}
        </div>
      </div>

      <RegisterModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={onConfirmRegister}
        products={products}
      />
    </div>
  );
}
