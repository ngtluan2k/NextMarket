import React, { useState, useRef, useEffect } from "react";
import { Smile, User, Package, LifeBuoy, LogOut, ChevronDown } from "lucide-react";
import { ShopOutlined } from "@ant-design/icons";
import { useAuth } from "../context/AuthContext";

export default function AccountMenu({ className = "" }) {
  const { me, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Click ngoài để đóng menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        className="group flex items-center gap-2 px-3 text-slate-700"
        onClick={() => setOpen((prev) => !prev)} // click vào email hoặc icon toggle
      >
        <span className="rounded-lg p-2 transition group-hover:text-cyan-700">
          <Smile className="h-5 w-5" />
        </span>
        <span className="hidden md:inline truncate max-w-[180px]">
          Xin chào, {me?.full_name}
        </span>
        <ChevronDown className="h-4 w-4 transition" />
      </button>

      {open && (
        <div className="absolute right-0 z-[120] mt-2 w-64 origin-top-right rounded-xl bg-white p-2 shadow-xl ring-1 ring-black/5">
          <a href="/account" className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50">
            <User className="h-4 w-4 text-slate-500" />
            Thông tin tài khoản
          </a>
          <a href="account/orders" className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50">
            <Package className="h-4 w-4 text-slate-500" />
            Đơn hàng của tôi
          </a>
          <a href="/support" className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50">
            <LifeBuoy className="h-4 w-4 text-slate-500" />
            Trung tâm hỗ trợ
          </a>
          <a href="/myStores" className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50">
            <ShopOutlined className="h-4 w-4 text-slate-500" />
            Cửa hàng của tôi
          </a>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 px-3 py-2 hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4 text-slate-500" />
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}
