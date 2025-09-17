import React, { useEffect, useRef, useState } from 'react';
import {
  Smile,
  User,
  Package,
  LifeBuoy,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { ShopOutlined } from '@ant-design/icons';

export type Me = { username: string };

export default function AccountMenu({
  me,
  onLogout,
  className = '',
}: {
  me: Me;
  onLogout: () => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Đóng khi click ra ngoài
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Đóng khi nhấn ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {/* Nút mở menu */}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="group flex items-center gap-2 px-3 text-slate-700"
      >
        <span className="rounded-lg p-2 transition group-hover:text-cyan-700">
          <Smile className="h-5 w-5" />
        </span>

        <span className="hidden md:inline truncate max-w-[180px]">
          Xin chào, {me.username}
        </span>
        <ChevronDown
          className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Menu */}
      <div
        className={`absolute right-0 z-[120] mt-2 w-64 origin-top-right rounded-xl bg-white p-2 shadow-xl ring-1 ring-black/5
        transition-all duration-150 ${
          open
            ? 'opacity-100 scale-100'
            : 'pointer-events-none opacity-0 scale-95'
        }`}
      >
        <a
          href="/account"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50"
        >
          <User className="h-4 w-4 text-slate-500" />
          Thông tin tài khoản
        </a>
        <a
          href="/orders"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50"
        >
          <Package className="h-4 w-4 text-slate-500" />
          Đơn hàng của tôi
        </a>
        <a
          href="/support"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50"
        >
          <LifeBuoy className="h-4 w-4 text-slate-500" />
          Trung tâm hỗ trợ
        </a>
        <a
          href="/myStores"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50"
        >
          <ShopOutlined className="h-4 w-4 text-slate-500" />
          Cửa hàng của tôi
        </a>

        <button
          onClick={() => {
            setOpen(false);
            onLogout();
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50"
        >
          <LogOut className="h-4 w-4 text-slate-500" />
          Đăng xuất
        </button>
      </div>
    </div>
  );
}
