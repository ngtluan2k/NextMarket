import React, { useState, useEffect } from 'react';
import {
  Search,
  Home,
  Smile,
  ShoppingCart,
  Store,
  CreditCard,
  Receipt,
  BadgeDollarSign,
  MapPin,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import LoginModal, { LoginPayload } from './LoginModal';
import AccountMenu from './AccountMenu';
import AddressModal from '../page/AddressModal';
import debounce from 'lodash.debounce';
import { userApi } from '../api/api';
import { UserAddress } from '../types/user';
import { JoinGroupModal } from './JoinGroupModal';
export type HeaderLabels = {
  logoSrc?: string;
  brandTagline?: string;
  searchPlaceholder?: string;
  searchButton?: string;
  home?: string;
  cart?: string;
  categories?: string[];
  deliveryPrefix?: string;
  address?: string;
  qa1?: string;
  qa2?: string;
  qa3?: string;
  qa4?: string;
  qa5?: string;
};

const DEFAULT_LABELS: Required<HeaderLabels> = {
  logoSrc: '/logo.png',
  brandTagline: 'Gì Cũng Có ',
  searchPlaceholder: 'Mo hinh Anime gia re',
  searchButton: 'Tìm kiếm',
  home: 'Trang chủ',
  cart: 'Giỏ hàng',
  categories: [
    'Điện gia dụng',
    'Mẹ và bé',
    'Điện thoại',
    'Thể thao',
    'Làm đẹp',
  ],
  deliveryPrefix: 'Giao đến:',
  address: 'Thêm địa chỉ',
  qa1: 'Ưu đãi thẻ, ví',
  qa2: 'Đóng tiền, nạp thẻ',
  qa3: 'Mua trước trả sau',
  qa4: 'Bán hàng cùng EveryMart',
  qa5: 'Nhập mã để tham gia mua nhóm',
};

export interface ProductSuggestion {
  id: number;
  name: string;
  slug: string;
  brand?: { name: string };
  media?: { url: string; is_primary: boolean }[];
}

export default function EveryMartHeader({ labels }: { labels?: HeaderLabels }) {
  const L = { ...DEFAULT_LABELS, ...(labels || {}) };
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [openLogin, setOpenLogin] = useState(false);
  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null);
  const { cart } = useCart();
  const totalItems = cart.length;
  const navigate = useNavigate();
  const { me, login, logout } = useAuth();

  const [groupJoinCode, setGroupJoinCode] = useState('');
  const [joiningGroup, setJoiningGroup] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Lấy danh sách địa chỉ của người dùng
  useEffect(() => {
    const fetchAddresses = async () => {
      if (me?.user_id) {
        try {
          const data = await userApi.getAddresses(me.user_id);
          setAddresses(data);
          // Chọn địa chỉ mặc định nếu có
          const defaultAddress =
            data.find((addr: UserAddress) => addr.isDefault) || data[0];
          setSelectedAddress(defaultAddress || null);
        } catch (err) {
          console.error('Lỗi khi lấy địa chỉ:', err);
        }
      }
    };
    fetchAddresses();
  }, [me]);

  const handleGoSeller = async (e: React.MouseEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      setOpenLogin(true);
      return;
    }
    try {
      const res = await fetch(
        'http://localhost:3000/stores/my-store?includeDeleted=true',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const json = await res.json();
      const store = json?.data || null;

      if (store && store.is_deleted) {
        let waitDays = 30;
        if (store.deleted_at) {
          const msSinceDelete =
            Date.now() - new Date(store.deleted_at).getTime();
          const daysSinceDelete = Math.floor(
            msSinceDelete / (1000 * 60 * 60 * 24)
          );
          waitDays = Math.max(30 - daysSinceDelete, 0);
        }
        alert(
          `Store này đã bị xóa. Vui lòng liên hệ admin để khôi phục hoặc đợi ${waitDays} ngày.`
        );
        return;
      }

      if (store) {
        navigate('/myStores');
      } else {
        navigate('/seller-registration');
      }
    } catch {
      navigate('/seller-registration');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user && !me) {
      try {
        const userData = JSON.parse(user);
        fetch('http://localhost:3000/users/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
          .then((res) => res.json())
          .then((json) => {
            if (json.data) {
              login(json.data, token);
            } else {
              localStorage.removeItem('token');
              localStorage.removeItem('access_token');
              localStorage.removeItem('user');
              logout();
            }
          })
          .catch(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
            logout();
          });
      } catch (err) {
        console.error('Error parsing user data:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        logout();
      }
    }
  }, [me, login, logout]);

  const fetchSuggestions = async (q: string) => {
    if (!q) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggestions(true);
    try {
      const res = await fetch(
        `http://localhost:3000/products/search?q=${encodeURIComponent(
          q
        )}&limit=5`
      );
      const json = await res.json();
      setSuggestions(json.data || []);
    } catch (err) {
      console.error(err);
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const debouncedFetch = debounce(fetchSuggestions, 300);

  useEffect(() => {
    debouncedFetch(query);
    return () => {
      debouncedFetch.cancel();
    };
  }, [query]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    navigate(`/search?q=${encodeURIComponent(query)}`);
    setSuggestions([]);
  };

  const handleOpenJoinModal = (e?: React.MouseEvent) => {
    e?.preventDefault?.();
    setShowJoinModal(true);
  };
  const handleCloseJoinModal = () => setShowJoinModal(false);
  const handleAddressSelect = (address: UserAddress) => {
    setSelectedAddress(address);
  };

  return (
    <header className="w-full bg-white">
      <div className="mx-auto max-w-screen-2xl px-4">
        {/* Row 1 */}
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 py-3">
          {/* Brand */}
          <a
            href="/"
            className="flex flex-col items-center gap-1 shrink-0"
            aria-label="EveryMart home"
          >
            {L.logoSrc ? (
              <img
                src={L.logoSrc}
                alt="EveryMart"
                className="h-12 md:h-14 lg:h-16 w-auto object-contain select-none"
                decoding="async"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-600 text-white">
                <Store className="h-7 w-7" />
              </div>
            )}
            <div className="text-xs md:text-sm font-semibold text-cyan-800">
              {L.brandTagline}
            </div>
          </a>

          {/* Search */}
          <form onSubmit={onSubmit} className="w-full relative">
            <div className="relative flex h-12 w-full items-center rounded-2xl border border-slate-300 bg-white focus-within:border-cyan-600">
              <Search className="pointer-events-none absolute left-3 h-5 w-5 text-slate-400" />
              <input
                className="flex-1 bg-transparent pl-10 pr-3 text-[15px] outline-none placeholder:text-slate-400"
                placeholder={L.searchPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search"
              />
              <button
                type="submit"
                className="h-full shrink-0 rounded-r-2xl border-l border-slate-300 px-4 text-sm font-medium text-cyan-700 hover:bg-cyan-50 active:bg-cyan-100"
              >
                {L.searchButton}
              </button>

              {suggestions.length > 0 && (
                <ul className="absolute top-full left-0 right-0 bg-white border border-slate-300 shadow-lg rounded-b-md z-50 max-h-60 overflow-auto">
                  {suggestions.map((p) => (
                    <li
                      key={p.id}
                      className="px-3 py-2 cursor-pointer hover:bg-slate-100 flex items-center gap-2"
                      onClick={() => {
                        navigate(`/products/slug/${p.slug}`);
                        setQuery('');
                        setSuggestions([]);
                      }}
                    >
                      {p.media?.[0]?.url &&
                        (() => {
                          const rawUrl = p.media[0].url;
                          const imageUrl = rawUrl.startsWith('http')
                            ? rawUrl
                            : `http://localhost:3000/${rawUrl.replace(
                              /^\/+/,
                              ''
                            )}`;
                          return (
                            <img
                              src={imageUrl}
                              alt={p.name}
                              className="h-6 w-6 object-cover rounded"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  'https://via.placeholder.com/40x40?text=No+Img';
                              }}
                            />
                          );
                        })()}
                      <span>{p.name}</span>
                      {p.brand?.name && (
                        <span className="text-xs text-slate-500">
                          ({p.brand.name})
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </form>

          {/* Actions */}
          <nav className="flex items-center gap-0 divide-x divide-slate-200 text-sm text-slate-700">
            <a href="/" className="group flex items-center gap-2 px-3">
              <span className="rounded-lg p-2 transition group-hover:text-cyan-700">
                <Home className="h-5 w-5" />
              </span>
              <span className="hidden md:inline">{L.home}</span>
            </a>

            {me ? (
              <AccountMenu className="px-0" />
            ) : (
              <button
                type="button"
                onClick={() => setOpenLogin(true)}
                className="group flex items-center gap-2 px-3 text-slate-700"
              >
                <span className="rounded-lg p-2 transition group-hover:text-cyan-700">
                  <Smile className="h-5 w-5" />
                </span>
                <span className="hidden md:inline">Đăng nhập</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate('/cart')}
              className="group relative flex items-center gap-2 px-3"
            >
              <span className="rounded-lg border border-slate-200 p-2 transition group-hover:border-cyan-600 group-hover:text-cyan-700">
                <ShoppingCart className="h-5 w-5" />
              </span>
              <span className="hidden md:inline">{L.cart}</span>
              {totalItems > 0 && (
                <span className="absolute right-1.5 -top-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-semibold leading-none text-white shadow-sm">
                  {totalItems}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Row 2: Categories and Address */}
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center mt-[-20px] gap-4 pb-2">
          <div />
          <div className="w-full px-20 ml-8">
            <ul className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm font-normal text-slate-500 pl-20">
              {L.categories.map((item) => (
                <li key={item}>
                  <a href="#" className="no-underline hover:text-cyan-700">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm text-slate-600">
            <MapPin className="h-4 w-4 text-slate-500" />
            <span>{L.deliveryPrefix}</span>
            <button
              onClick={() => setIsAddressModalVisible(true)}
              className="truncate max-w-[320px] font-medium underline"
            >
              {selectedAddress
                ? `${selectedAddress.street}, ${selectedAddress.ward}, ${selectedAddress.district} ${selectedAddress.province}`
                : L.address}
            </button>
          </div>
        </div>

        <div className="border-b border-slate-200" />
      </div>

      {/* Quick features */}
      <div className="mx-auto max-w-screen-2xl px-4">
        <div className="flex flex-wrap items-stretch gap-0 border-t border-slate-200 pt-2 text-sm text-slate-700 divide-x divide-slate-200">
          <a
            href="#"
            className="group flex items-center gap-2 px-3 py-2 self-stretch"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-amber-400 text-white">
              <CreditCard className="h-3.5 w-3.5" />
            </span>
            <span className="font-medium group-hover:text-cyan-700">
              {L.qa1}
            </span>
          </a>
          <a
            href="#"
            className="group flex items-center gap-2 px-3 py-2 self-stretch"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-green-500 text-white">
              <Receipt className="h-3.5 w-3.5" />
            </span>
            <span className="font-medium group-hover:text-cyan-700">
              {L.qa2}
            </span>
          </a>
          <a
            href="#"
            className="group flex items-center gap-2 px-3 py-2 self-stretch"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-indigo-500 text-white">
              <BadgeDollarSign className="h-3.5 w-3.5" />
            </span>
            <span className="font-medium group-hover:text-cyan-700">
              {L.qa3}
            </span>
          </a>
          <a
            href="myStores"
            onClick={handleGoSeller}
            className="group flex items-center gap-2 px-3 py-2 self-stretch"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-rose-500 text-white">
              <Store className="h-3.5 w-3.5" />
            </span>
            <span className="font-medium group-hover:text-cyan-700">
              {L.qa4}
            </span>
          </a>
          <a
            href="#"
            onClick={handleOpenJoinModal}
            className="group flex items-center gap-2 px-3 py-2 self-stretch"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-cyan-600 text-white">
              <Users className="h-3.5 w-3.5" />
            </span>
            <span className="font-medium group-hover:text-cyan-700">
              {L.qa5}
            </span>
          </a>
        </div>
      </div>

      <JoinGroupModal open={showJoinModal} onClose={handleCloseJoinModal} />



      {/* Login Modal */}
      <LoginModal
        open={openLogin}
        onClose={() => setOpenLogin(false)}
        onLogin={async (data: LoginPayload) => {
          try {
            const res = await fetch('http://localhost:3000/users/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || 'Login thất bại');

            login(json.data, json.access_token);
            const profileRes = await fetch('http://localhost:3000/users/me', {
              headers: {
                Authorization: `Bearer ${json.access_token}`,
              },
            });
            const profileJson = await profileRes.json();
            if (profileRes.ok) {
              login(profileJson.data, json.access_token);
            }

            setOpenLogin(false);
          } catch (err: any) {
            alert(err.message);
          }
        }}
      />

      {/* Address Modal */}
      <AddressModal
        visible={isAddressModalVisible}
        onClose={() => setIsAddressModalVisible(false)}
        onSelect={handleAddressSelect}
        currentAddressId={selectedAddress?.id}
      />
    </header>
  );
}