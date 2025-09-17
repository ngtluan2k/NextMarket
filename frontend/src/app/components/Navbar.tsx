import React, { useEffect, useState } from "react";
import {
  Search, Home, Smile, ShoppingCart, MapPin, Store,
  CreditCard, Receipt, BadgeDollarSign,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

import LoginModal, { LoginPayload } from "./LoginModal";
import AccountMenu, { Me } from "./AccountMenu";


export type HeaderLabels = {
  logoSrc?: string;
  brandTagline?: string;
  searchPlaceholder?: string;
  searchButton?: string;
  home?: string;
  account?: string;
  cart?: string;
  categories?: string[];
  deliveryPrefix?: string;
  address?: string;
  qa1?: string;
  qa2?: string;
  qa3?: string;
  qa4?: string;
};

const DEFAULT_LABELS: Required<HeaderLabels> = {
  logoSrc: "/logo.png",
  brandTagline: "Gì Cũng Có ",
  searchPlaceholder: "Mo hinh Anime gia re",
  searchButton: "Tim kiem",
  home: "Trang chu",
  account: "Tài khoản",
  cart: "Giỏ hàng",
  categories: ["dien gia dung", "me va be", "dien thoai", "the thao", "lam dep"],
  deliveryPrefix: "Giao đến:",
  address: "H.Son Ha, TT.Di Lang, Quang Ngai",
  qa1: "Ưu đãi thẻ, ví",
  qa2: "Đóng tiền, nạp thẻ",
  qa3: "Mua trước trả sau",
  qa4: "Bán hàng cùng EveryMart",
};

export default function EveryMartHeader({
  labels,
  onLogin,
}: {
  labels?: HeaderLabels;
  onLogin?: (payload: LoginPayload) => Promise<void> | void;
}) {
  const L = { ...DEFAULT_LABELS, ...(labels || {}) };
  const [query, setQuery] = useState("");
  const [openLogin, setOpenLogin] = useState(false);
  const [me, setMe] = useState<Me | null>(null);

  const { cart } = useCart();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const navigate = useNavigate();

  // Đọc trạng thái đăng nhập từ localStorage
  useEffect(() => {
    const raw = localStorage.getItem("everymart.me");
    if (raw) {
      try {
        setMe(JSON.parse(raw));
      } catch (err) {
        console.error("Failed to parse user from localStorage:", err);
      }
    }
  }, []);

  // Lưu trạng thái user khi thay đổi
  useEffect(() => {
    if (me) localStorage.setItem("everymart.me", JSON.stringify(me));
    else localStorage.removeItem("everymart.me");
  }, [me]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("everymart.me");
    setMe(null);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("search:", query);
  };

  return (
    <header className="w-full bg-white">
      <div className="mx-auto max-w-screen-2xl px-4">
        {/* Row 1 */}
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 py-3">
          {/* Brand */}
          <a href="/" className="flex flex-col items-center gap-1 shrink-0" aria-label="EveryMart home">
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
            <div className="text-xs md:text-sm font-semibold text-cyan-800">{L.brandTagline}</div>
          </a>

          {/* Search */}
          <form onSubmit={onSubmit} className="w-full">
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
              <AccountMenu me={me} onLogout={handleLogout} className="px-0" />
            ) : (
              <button
                type="button"
                onClick={() => setOpenLogin(true)}
                className="group flex items-center gap-2 px-3 text-slate-700"
              >
                <span className="rounded-lg p-2 transition group-hover:text-cyan-700">
                  <Smile className="h-5 w-5" />
                </span>
                <span className="hidden md:inline">{L.account}</span>
              </button>
            )}

            {/* Cart button SPA */}
            <button
              type="button"
              onClick={() => navigate("/cart")}
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

        {/* Row 2 */}
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center mt-[-20px] gap-4 pb-2">
          <div />
          <div className="w-full px-20 ml-8">
            <ul className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm font-normal text-slate-500 pl-20">
              {L.categories.map((item) => (
                <li key={item}>
                  <a href="#" className="no-underline hover:text-cyan-700">{item}</a>
                </li>
              ))}
            </ul>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm text-slate-600">
            <MapPin className="h-4 w-4 text-slate-500" />
            <span>{L.deliveryPrefix}</span>
            <a href="#" className="truncate max-w-[320px] font-medium underline">{L.address}</a>
          </div>
        </div>

        <div className="border-b border-slate-200" />
      </div>

      {/* Quick features */}
      <div className="mx-auto max-w-screen-2xl px-4">
        <div className="flex flex-wrap items-stretch gap-0 border-t border-slate-200 pt-2 text-sm text-slate-700 divide-x divide-slate-200">
          <a href="#" className="group flex items-center gap-2 px-3 py-2 self-stretch">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-amber-400 text-white">
              <CreditCard className="h-3.5 w-3.5" />
            </span>
            <span className="font-medium group-hover:text-cyan-700">{L.qa1}</span>
          </a>
          <a href="#" className="group flex items-center gap-2 px-3 py-2 self-stretch">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-green-500 text-white">
              <Receipt className="h-3.5 w-3.5" />
            </span>
            <span className="font-medium group-hover:text-cyan-700">{L.qa2}</span>
          </a>
          <a href="#" className="group flex items-center gap-2 px-3 py-2 self-stretch">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-indigo-500 text-white">
              <BadgeDollarSign className="h-3.5 w-3.5" />
            </span>
            <span className="font-medium group-hover:text-cyan-700">{L.qa3}</span>
          </a>
          <a href="seller-dashboard" className="group flex items-center gap-2 px-3 py-2 self-stretch">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-rose-500 text-white">
              <Store className="h-3.5 w-3.5" />
            </span>
            <span className="font-medium group-hover:text-cyan-700">{L.qa4}</span>
          </a>
        </div>
      </div>

      {/* Modal Đăng nhập */}
      <LoginModal
        open={openLogin}
        onClose={() => setOpenLogin(false)}
        onLogin={async (data) => {
          try {
            const res = await fetch("http://localhost:3000/users/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Login thất bại");

            localStorage.setItem("token", json.access_token);
            localStorage.setItem("user", JSON.stringify(json.data));
            setMe(json.data);
            setOpenLogin(false);
          } catch (err: any) {
            alert(err.message);
          }
        }}
      />
    </header>
  );
}
