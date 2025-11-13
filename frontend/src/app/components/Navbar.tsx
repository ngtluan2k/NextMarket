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
  Menu,
  ChevronDown,
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
import { Drawer, Dropdown } from 'antd';
import { fetchCategoriesAPI } from '../../service/category.service';

export type HeaderLabels = {
  logoSrc?: string;
  brandTagline?: string;
  searchPlaceholder?: string;
  searchButton?: string;
  home?: string;
  cart?: string;
  deliveryPrefix?: string;
  address?: string;
  qa1?: string;
  qa2?: string;
  qa3?: string;
  qa4?: string;
};

const DEFAULT_LABELS: Required<HeaderLabels> = {
  logoSrc: '/logo.png',
  brandTagline: 'Gì Cũng Có ',
  searchPlaceholder: 'Mo hinh Anime gia re',
  searchButton: 'Tìm kiếm',
  home: 'Trang chủ',
  cart: 'Giỏ hàng',
  deliveryPrefix: 'Giao đến:',
  address: 'Thêm địa chỉ',
  qa1: 'Ưu đãi thẻ, ví',
  qa2: 'Đóng tiền, nạp thẻ',
  qa3: 'Mua trước trả sau',
  qa4: 'Bán hàng cùng EveryMart',
};

export interface ProductSuggestion {
  id: number;
  name: string;
  slug: string;
  brand?: { name: string };
  media?: { url: string; is_primary: boolean }[];
}

export interface Category {
  id: string | number;
  name: string;
  slug?: string;
  iconUrl: string;
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  
  const { cart } = useCart();
  const totalItems = cart.length;
  const navigate = useNavigate();
  const { me, login, logout } = useAuth();
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  // Lấy danh sách categories từ API
  useEffect(() => {
    let cancelled = false;

    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        setCategoriesError(null);
        const rawData = await fetchCategoriesAPI();

        if (!Array.isArray(rawData)) {
          throw new Error('Dữ liệu danh mục không hợp lệ');
        }

        // Lọc danh mục cha (không có parent_id)
        const parents = rawData.filter((it: any) => !it.parent_id);
        
        const toImageUrl = (url?: string) => {
          if (!url) return 'https://via.placeholder.com/43x43?text=%3F';
          if (url.startsWith('http')) return url;
          return `http://localhost:3000${url}`;
        };

        const mapped: Category[] = parents.map((it: any) => ({
          id: it.id,
          name: it.name,
          slug: it.slug || String(it.id),
          iconUrl: toImageUrl(it.image),
        }));

        if (!cancelled) setCategories(mapped);
      } catch (e: any) {
        if (!cancelled) setCategoriesError(e.message || 'Không tải được danh mục');
      } finally {
        if (!cancelled) setCategoriesLoading(false);
      }
    };

    fetchCategories();
    return () => {
      cancelled = true;
    };
  }, []);

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
              localStorage.removeItem('user');
              logout();
            }
          })
          .catch(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            logout();
          });
      } catch (err) {
        console.error('Error parsing user data:', err);
        localStorage.removeItem('token');
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

  const handleAddressSelect = (address: UserAddress) => {
    setSelectedAddress(address);
  };

  const handleCategoryClick = (category: Category) => {
    navigate(`/category/${category.slug}`, {
      state: { title: category.name },
    });
    setMobileMenuOpen(false);
  };

  // Mobile menu content
  const mobileMenuContent = (
    <div className="p-4">
      <div className="mb-6">
  {/* Header bấm để mở/đóng */}
  <button
    type="button"
    onClick={() => setMobileCategoriesOpen((prev) => !prev)}
    className="flex w-full items-center justify-between py-2"
  >
    <h3 className="font-bold text-lg">Danh mục</h3>
    <ChevronDown
      className={`h-4 w-4 transition-transform ${
        mobileCategoriesOpen ? 'rotate-180' : ''
      }`}
    />
  </button>

  {/* Nội dung chỉ hiện khi open */}
  {mobileCategoriesOpen && (
    <>
      {categoriesLoading ? (
        <div className="grid grid-cols-2 gap-2 mt-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="p-2 bg-gray-50 rounded text-sm animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : categoriesError ? (
        <div className="text-red-500 text-sm mt-2">{categoriesError}</div>
      ) : (
        <div className="grid grid-cols-2 gap-2 mt-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category)}
              className="p-2 bg-gray-50 rounded text-sm hover:bg-cyan-50 hover:text-cyan-700 text-left"
            >
              {category.name}
            </button>
          ))}
        </div>
      )}
    </>
  )}
</div>

      
      <div className="border-t pt-4">
        <h3 className="font-bold text-lg mb-3">Tiện ích</h3>
        <div className="space-y-2">
          <a href="#" className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
            <CreditCard className="h-4 w-4 text-amber-500" />
            <span>{L.qa1}</span>
          </a>
          <a href="#" className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
            <Receipt className="h-4 w-4 text-green-500" />
            <span>{L.qa2}</span>
          </a>
          <a href="#" className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
            <BadgeDollarSign className="h-4 w-4 text-indigo-500" />
            <span>{L.qa3}</span>
          </a>
          <a 
            href="myStores" 
            onClick={handleGoSeller}
            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded"
          >
            <Store className="h-4 w-4 text-rose-500" />
            <span>{L.qa4}</span>
          </a>
        </div>
      </div>

      {/* Address section for mobile */}
      <div className="border-t pt-4 mt-4">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-slate-500" />
          <span>{L.deliveryPrefix}</span>
        </div>
        <button
          onClick={() => {
            setIsAddressModalVisible(true);
            setMobileMenuOpen(false);
          }}
          className="text-sm text-left mt-2 text-cyan-600 font-medium truncate w-full"
        >
          {selectedAddress
            ? `${selectedAddress.street}, ${selectedAddress.ward}, ${selectedAddress.district}`
            : L.address}
        </button>
      </div>
    </div>
  );

  return (
    <header className="w-full bg-white shadow-sm">
      <div className="mx-auto max-w-screen-2xl px-3 sm:px-4">
        {/* Row 1 - Main Header */}
        <div className="flex items-center justify-between gap-3 py-2 sm:py-3">
          {/* Logo and Mobile Menu */}
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {/* Mobile Menu Button - Hidden on desktop */}
            <button 
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Brand Logo */}
            <a
              href="/"
              className="flex items-center gap-2 shrink-0"
              aria-label="EveryMart home"
            >
              {L.logoSrc ? (
                <img
                  src={L.logoSrc}
                  alt="EveryMart"
                  className="h-8 sm:h-10 md:h-12 lg:h-14 w-auto object-contain select-none"
                  decoding="async"
                />
              ) : (
                <div className="flex h-8 sm:h-10 md:h-12 items-center justify-center rounded-lg bg-cyan-600 text-white">
                  <Store className="h-5 sm:h-6 w-5 sm:w-6" />
                </div>
              )}
              <div className="hidden xs:block text-xs sm:text-sm font-semibold text-cyan-800">
                {L.brandTagline}
              </div>
            </a>
          </div>

          {/* Search Bar - Hidden on mobile, visible on tablet and up */}
          <div className="hidden sm:block flex-1 max-w-2xl mx-4">
            <form onSubmit={onSubmit} className="w-full relative">
              <div className="relative flex h-10 sm:h-12 w-full items-center rounded-xl sm:rounded-2xl border border-slate-300 bg-white focus-within:border-cyan-600">
                <Search className="pointer-events-none absolute left-3 h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                <input
                  className="flex-1 bg-transparent pl-9 sm:pl-10 pr-3 text-sm sm:text-[15px] outline-none placeholder:text-slate-400"
                  placeholder={L.searchPlaceholder}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search"
                />
                <button
                  type="submit"
                  className="h-full shrink-0 rounded-r-xl sm:rounded-r-2xl border-l border-slate-300 px-3 sm:px-4 text-sm font-medium text-cyan-700 hover:bg-cyan-50 active:bg-cyan-100"
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
                        <span className="text-sm">{p.name}</span>
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
          </div>

          {/* Actions */}
          <nav className="flex items-center gap-1 sm:gap-2 text-slate-700 flex-shrink-0">
            {/* Home - Hidden on mobile */}
            <a href="/" className="hidden sm:flex items-center gap-1 sm:gap-2 px-2 sm:px-3 group">
              <span className="rounded-lg p-1 sm:p-2 transition group-hover:text-cyan-700">
                <Home className="h-4 w-4 sm:h-5 sm:w-5" />
              </span>
              <span className="hidden md:inline text-sm">{L.home}</span>
            </a>

            {/* Account */}
            {me ? (
              <div className="px-1 sm:px-2">
                <AccountMenu />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setOpenLogin(true)}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 text-slate-700 group"
              >
                <span className="rounded-lg p-1 sm:p-2 transition group-hover:text-cyan-700">
                  <Smile className="h-4 w-4 sm:h-5 sm:w-5" />
                </span>
                <span className="hidden md:inline text-sm">Đăng nhập</span>
              </button>
            )}

            {/* Cart */}
            <button
              type="button"
              onClick={() => navigate('/cart')}
              className="relative flex items-center gap-1 sm:gap-2 px-2 sm:px-3 group"
            >
              <span className="rounded-lg border border-slate-200 p-1 sm:p-2 transition group-hover:border-cyan-600 group-hover:text-cyan-700">
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
              </span>
              <span className="hidden md:inline text-sm">{L.cart}</span>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 sm:right-1.5 sm:-top-1.5 inline-flex h-4 w-4 sm:h-5 sm:min-w-[20px] items-center justify-center rounded-full bg-rose-500 text-[10px] sm:text-[11px] font-semibold leading-none text-white shadow-sm">
                  {totalItems}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Mobile Search - Visible only on mobile */}
        <div className="sm:hidden pb-2">
          <form onSubmit={onSubmit} className="w-full relative">
            <div className="relative flex h-10 w-full items-center rounded-xl border border-slate-300 bg-white focus-within:border-cyan-600">
              <Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />
              <input
                className="flex-1 bg-transparent pl-10 pr-3 text-sm outline-none placeholder:text-slate-400"
                placeholder={L.searchPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search"
              />
              <button
                type="submit"
                className="h-full shrink-0 rounded-r-xl border-l border-slate-300 px-3 text-sm font-medium text-cyan-700 hover:bg-cyan-50"
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
                      <span className="text-sm">{p.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Quick features - Hidden on mobile */}
      <div className="hidden md:block mx-auto max-w-screen-2xl px-4">
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
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <Drawer
        title="Menu"
        placement="left"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        width={300}
      >
        {mobileMenuContent}
      </Drawer>

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