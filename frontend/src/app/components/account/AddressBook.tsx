import React, { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

export type Address = {
  id: string;
  fullName: string;
  company?: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  addressLine: string;
  note?: string;
  kind: "home" | "company";
  isDefault?: boolean;
};

const API_BASE = "/api/addresses";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.status === 204 ? (undefined as unknown as T) : res.json();
}

export default function AddressBook({ className = "" }: { className?: string }) {
  const [items, setItems] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await request<Address[]>(API_BASE, { method: "GET" });
        setItems(data ?? []);
      } catch (e: any) {
        setErr(e?.message ?? "Không tải được sổ địa chỉ");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setDefault = async (id: string) => {
    await request(`${API_BASE}/${id}/default`, { method: "PATCH" });
    setItems((prev) => prev.map((x) => ({ ...x, isDefault: x.id === id })));
  };

  const removeAddress = async (id: string) => {
    await request<void>(`${API_BASE}/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((x) => x.id !== id));
  };

  return (
    <div className={className}>
      <h2 className="text-xl font-semibold mb-3">Sổ địa chỉ</h2>

      {/* Ô "Thêm địa chỉ mới" giống ảnh – bấm để điều hướng */}
      <button
        type="button"
        onClick={() => navigate("/account/addresses/create")}
        className="w-full rounded-md border border-dashed py-6 grid place-items-center text-slate-600 hover:bg-slate-50"
      >
        <span className="inline-flex items-center gap-2 text-sky-600">
          <Plus className="h-5 w-5" />
          <span className="underline">Thêm địa chỉ mới</span>
        </span>
      </button>

      
      {loading && <div className="mt-3 text-sm text-slate-500">Đang tải…</div>}

      {/* Danh sách địa chỉ (nếu có) */}
      <div className="mt-3 space-y-3">
        {items.map((it) => (
          <div key={it.id} className="flex items-start justify-between rounded-md border p-4">
            <div>
              <div className="font-medium">{it.fullName}</div>
              <div className="text-sm text-gray-600">
                Địa chỉ: {it.addressLine}, {it.ward}, {it.district}, {it.province}
              </div>
              <div className="text-sm text-gray-600">Điện thoại: {it.phone}</div>
              {it.isDefault && (
                <div className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-green-600">
                  ● Địa chỉ mặc định
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {!it.isDefault && (
                <button
                  onClick={() => setDefault(it.id)}
                  className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                >
                  <Star className="h-3 w-3" /> Mặc định
                </button>
              )}
              <button
                onClick={() => navigate(`/account/addresses/${it.id}/edit`)}
                className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
              >
                <Pencil className="h-3 w-3" /> Sửa
              </button>
              <button
                onClick={() => removeAddress(it.id)}
                className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3 w-3" /> Xóa
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}