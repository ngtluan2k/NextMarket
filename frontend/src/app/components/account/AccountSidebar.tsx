import React from "react";
import {
  User, Bell, ClipboardList, RefreshCcw, MapPin, CreditCard,
  MessageSquare, Eye, Heart, Star, Crown, Share2, Wallet,
  BadgePercent, Sparkles, Coins, BookOpen, HelpCircle
} from "lucide-react";
import { Link } from "react-router-dom";

export type AccountMenuItem = {
  key: string;
  label: string;
  icon: React.ReactNode;
  to?: string;        // route nếu dùng react-router
  href?: string;      // nếu muốn dùng link thường
  badge?: string;     // ví dụ: "Thành viên"
};

export type AccountSidebarProps = {
  userName?: string;
  avatarUrl?: string;
  items?: AccountMenuItem[];
  activeKey?: string;
  onSelect?: (key: string) => void;
  className?: string;
};

const DEFAULT_ITEMS: AccountMenuItem[] = [
  { key: "profile",     label: "Thông tin tài khoản",  icon: <User className="h-4 w-4" />, to: "/account" },
  { key: "notice",      label: "Thông báo của tôi",    icon: <Bell className="h-4 w-4" />, to: "/account/notifications" },
  { key: "orders",      label: "Quản lý đơn hàng",     icon: <ClipboardList className="h-4 w-4" />, to: "/account/orders" },
  { key: "returns",     label: "Quản lý đổi trả",      icon: <RefreshCcw className="h-4 w-4" />, to: "/account/returns" },
  { key: "addresses",   label: "Sổ địa chỉ",           icon: <MapPin className="h-4 w-4" />, to: "/account/addresses" },
  { key: "payments",    label: "Thông tin thanh toán", icon: <CreditCard className="h-4 w-4" />, to: "/account/payments" },
  { key: "reviews",     label: "Đánh giá sản phẩm",    icon: <MessageSquare className="h-4 w-4" />, to: "/account/reviews" },
  { key: "viewed",      label: "Sản phẩm bạn đã xem",  icon: <Eye className="h-4 w-4" />, to: "/account/viewed" },
  { key: "favorites",   label: "Sản phẩm yêu thích",   icon: <Heart className="h-4 w-4" />, to: "/account/favorites" },
  { key: "comments",    label: "Nhận xét của tôi",     icon: <Star className="h-4 w-4" />, to: "/account/comments" },
  { key: "share",       label: "Chia sẻ có lời",       icon: <Share2 className="h-4 w-4" />, to: "/account/share" },
  { key: "paylater",    label: "Mua trước trả sau",    icon: <Wallet className="h-4 w-4" />, to: "/account/paylater" },
  { key: "vouchers",    label: "Mã giảm giá",          icon: <BadgePercent className="h-4 w-4" />, to: "/account/vouchers" },
  { key: "bookcare",    label: "BookCare của tôi",     icon: <BookOpen className="h-4 w-4" />, to: "/account/bookcare" },
  { key: "support",     label: "Hỗ trợ khách hàng",    icon: <HelpCircle className="h-4 w-4" />, to: "/account/support" },
];

export default function AccountSidebar({
  userName = "Tài khoản",
  avatarUrl,
  items = DEFAULT_ITEMS,
  activeKey,
  onSelect,
  className = "",
}: AccountSidebarProps) {
  return (
    <aside className={`rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="border-b border-slate-100 p-4">
        <div className="text-xs text-slate-500">Tài khoản của</div>
        <div className="mt-1 flex items-center gap-2">
          <div className="h-8 w-8 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-slate-400">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
          <div className="font-semibold text-slate-900 truncate" title={userName}>{userName}</div>
        </div>
      </div>

      {/* Menu */}
      <ul className="p-2">
        {items.map((it) => {
          const active = it.key === activeKey;
          const content = (
            <span
              className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm
              ${active ? "bg-sky-50 text-sky-700 ring-1 ring-sky-100"
                       : "text-slate-700 hover:bg-slate-50"}`}
              onClick={() => onSelect?.(it.key)}
            >
              <span className="inline-flex items-center gap-2">
                <span className="text-slate-500">{it.icon}</span>
                <span className="truncate">{it.label}</span>
              </span>
              {it.badge && (
                <span className="rounded-full bg-sky-100 px-2 py-[2px] text-[10px] font-semibold text-sky-700">
                  {it.badge}
                </span>
              )}
            </span>
          );

          return (
            <li key={it.key} className="my-0.5">
              {it.to ? (
                <Link to={it.to} className="no-underline">{content}</Link>
              ) : it.href ? (
                <a href={it.href} className="no-underline">{content}</a>
              ) : (
                <button type="button" className="w-full text-left">{content}</button>
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
