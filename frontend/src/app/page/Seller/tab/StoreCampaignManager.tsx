import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import StatusBadge, { CampaignStatus } from '../../../components/campaign/StatusBadge';
import RegisterModal from '../../../components/campaign/RegisterModal';
import { storeService } from '../../../../service/store.service';
import { productService, Product } from '../../../../service/product.service';
import { getPendingCampaigns, registerStoreForCampaign, Campaign } from '../../../../service/campaign.service';

// Hàm chuyển đổi URL thành URL tuyệt đối
function toAbsoluteUrl(url: string) {
  return `http://localhost:3000${url}`;
}

export default function StoreCampaignManager({
  onSelectCampaign,
}: {
  onSelectCampaign?: (id: number) => void;
}) {
  const [store, setStore] = useState<any>(null);
  const [level, setLevel] = useState<'basic' | 'premium' | string>('basic');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [registeredIds, setRegisteredIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | CampaignStatus>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [registerFor, setRegisterFor] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const s = await storeService.getMyStore();
        if (!s) return;
        setStore(s);
        const currentLevel = s.storeLevels?.[0]?.level || 'basic';
        setLevel(currentLevel);

        const list = await getPendingCampaigns();
        setCampaigns(list);

        const ids = list
          .filter((c: any) => c.stores?.some((st: any) => st.store?.id === s.id && st.status === 'approved'))
          .map((c: any) => c.id);
        setRegisteredIds(ids);

        const prods = await productService.getStoreProducts(s.id);
        setProducts(Array.isArray(prods) ? prods : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    let data = [...campaigns];
    if (s) {
      data = data.filter(
        (c) =>
          c.name.toLowerCase().includes(s) ||
          (c.description || '').toLowerCase().includes(s)
      );
    }
    if (tab !== 'all') data = data.filter((c) => c.status === tab);
    return data;
  }, [campaigns, search, tab]);

  const handleConfirmRegister = async (items: { productId: number; variantId?: number }[]) => {
    if (registerFor == null) return;
    await registerStoreForCampaign(registerFor, items);
    setRegisteredIds((prev) => Array.from(new Set([...prev, registerFor])));
    setRegisterFor(null);
  };

  if (!store) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Đang tải thông tin cửa hàng...
      </div>
    );
  }

  if ((level || '').toLowerCase() !== 'premium') {
    return (
      <div className="p-8 bg-white rounded-xl shadow-sm text-center">
        <h2 className="text-lg font-semibold">
          Cửa hàng của bạn hiện là gói:{' '}
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-sm">
            {level}
          </span>
        </h2>
        <p className="mt-2 text-gray-600">
          Chỉ cửa hàng <span className="font-medium">Premium</span> mới có thể tham gia chiến dịch quảng cáo.
        </p>
        <button className="mt-4 px-4 py-2 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600">
          Nâng cấp lên Premium
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý Chiến dịch Cửa hàng</h1>
          <div className="text-sm text-gray-500 mt-1">
            {store?.name ?? '—'}
          </div>
        </div>

        <div className="w-full sm:w-auto flex items-center gap-2">
          <div className="relative w-full sm:w-80">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm tên/mô tả..."
              className="w-full rounded-lg border px-5 py-2 pl-9 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" viewBox="0 0 24 24" fill="none">
              <path d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>

          <div className="flex rounded-lg border overflow-hidden">
            <button
              onClick={() => setTab('all')}
              className={`px-3 py-2 text-sm ${tab === 'all' ? 'bg-sky-50 text-sky-700' : 'bg-white text-gray-700'}`}
            >Tất cả</button>
            <button
              onClick={() => setTab('active')}
              className={`px-3 py-2 text-sm ${tab === 'active' ? 'bg-sky-50 text-sky-700' : 'bg-white text-gray-700'}`}
            >Đang diễn ra</button>
            <button
              onClick={() => setTab('pending')}
              className={`px-3 py-2 text-sm ${tab === 'pending' ? 'bg-sky-50 text-sky-700' : 'bg-white text-gray-700'}`}
            >Sắp diễn ra</button>
            <button
              onClick={() => setTab('ended')}
              className={`px-3 py-2 text-sm ${tab === 'ended' ? 'bg-sky-50 text-sky-700' : 'bg-white text-gray-700'}`}
            >Kết thúc</button>
          </div>
        </div>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="text-sm text-gray-500">Đang tải...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((c) => (
            <div key={c.id} className="h-full">
              <div
                className="h-full min-h-[300px] rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition flex flex-col cursor-pointer"
                onClick={() => onSelectCampaign?.(c.id)}
              >
                {c.banner_url && (
                  <img
                    src={toAbsoluteUrl(c.banner_url)}
                    alt={c.name}
                    className="w-full h-full object-contain"  // Cập nhật object-contain để ảnh không bị cắt
                  />
                )}

                <div className="p-4 flex-1 flex flex-col space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold line-clamp-2">{c.name}</div>
                    <StatusBadge status={c.status as CampaignStatus} />
                  </div>

                  <div className="text-xs text-gray-500 line-clamp-2">
                    {c.description || 'Không có mô tả'}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                      <path d="M7 2v3M17 2v3M3.5 9h17M6 13h4M6 17h12M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    {dayjs(c.starts_at).format('DD/MM/YYYY')} – {dayjs(c.ends_at).format('DD/MM/YYYY')}
                  </div>

                  <div className="mt-auto pt-2 flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); onSelectCampaign?.(c.id); }}
                      className="flex-1 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm"
                    >
                      Chi tiết
                    </button>
                    <button
                      disabled={registeredIds.includes(c.id) || c.status === 'ended'}
                      onClick={(e) => { e.stopPropagation(); setRegisterFor(c.id); }}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                        registeredIds.includes(c.id) || c.status === 'ended'
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-sky-600 text-white hover:bg-sky-700'
                      }`}
                    >
                      {registeredIds.includes(c.id) ? 'Đã đăng ký' : 'Đăng ký'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-sm text-gray-500 col-span-full">
              Không có chiến dịch phù hợp.
            </div>
          )}
        </div>
      )}

      {/* Modal đăng ký */}
      <RegisterModal
        open={registerFor != null}
        onClose={() => setRegisterFor(null)}
        onConfirm={handleConfirmRegister}
        products={products}
      />
    </div>
  );
}
