// src/components/admin/brandManager.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  UploadCloud,
  Image as ImageIcon,
  X,
  CheckCircle2,
} from 'lucide-react';

/**
 * Brand Manager – Tailwind UI
 * - Giao diện trùng bản trong canvas
 * - Dùng API thật qua axios, tự động fallback sang MOCK nếu API lỗi để xem UI ngay
 * - Tìm kiếm, modal thêm/sửa, upload + preview logo, toast thông báo
 */

const API_BASE = import.meta.env.VITE_BE_BASE_URL;;

export type Brand = {
  id: number;
  name: string;
  description?: string;
  logo_url?: string; // relative, absolute hoặc data URI (mock)
};

const toAbsolute = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${API_BASE}${url}`;
};

const normalizeVN = (s: string) =>
  (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(' ');
}

/* ================= MOCK FALLBACK ================= */
let useMock = false;

function svgLogo(letter: string, color: string) {
  const safeLetter = (letter || '?').slice(0, 1).toUpperCase();
  const svg = `<?xml version='1.0' encoding='UTF-8'?>
  <svg xmlns='http://www.w3.org/2000/svg' width='240' height='140'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0' stop-color='${color}' stop-opacity='0.85'/>
        <stop offset='1' stop-color='#ffffff' stop-opacity='0.2'/>
      </linearGradient>
    </defs>
    <rect width='100%' height='100%' rx='16' fill='url(#g)'/>
    <circle cx='60' cy='70' r='34' fill='white' fill-opacity='0.85'/>
    <text x='60' y='78' text-anchor='middle' font-family='Inter,Arial' font-size='28' font-weight='700' fill='${color}'>${safeLetter}</text>
    <text x='120' y='78' text-anchor='middle' font-family='Inter,Arial' font-size='14' fill='#0f172a'>Brand</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

let mockId = 1000;
const mockDB: Brand[] = [
  {
    id: ++mockId,
    name: 'Apple',
    description: 'Thiết bị cao cấp',
    logo_url: svgLogo('A', '#16a34a'),
  },
  {
    id: ++mockId,
    name: 'Samsung',
    description: 'Điện tử Hàn Quốc',
    logo_url: svgLogo('S', '#0284c7'),
  },
  {
    id: ++mockId,
    name: 'Xiaomi',
    description: 'Giá tốt, nhiều mẫu',
    logo_url: svgLogo('X', '#f97316'),
  },
];

async function fileToDataURL(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(f);
  });
}

/* ================= API (axios + fallback) ================= */
async function apiList(token?: string): Promise<Brand[]> {
  if (useMock) return mockDB;
  try {
    const res = await axios.get(`${API_BASE}/brands`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    const data = res.data?.data ?? res.data ?? [];
    return data;
  } catch {
    console.warn('/brands unreachable, using MOCK DATA.');
    useMock = true;
    return mockDB;
  }
}

async function apiCreate(fd: FormData, token?: string): Promise<void> {
  if (!useMock) {
    try {
      await axios.post(`${API_BASE}/brands`, fd, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Content-Type': 'multipart/form-data',
        },
      });
      return;
    } catch {
      console.warn('POST /brands failed, switching to MOCK.');
      useMock = true;
    }
  }
  const name = String(fd.get('name') || '');
  const description = String(fd.get('description') || '');
  let logo_url = '';
  const logo = fd.get('logo');
  if (logo instanceof File) logo_url = await fileToDataURL(logo);
  mockDB.unshift({ id: ++mockId, name, description, logo_url });
}

async function apiUpdate(
  id: number,
  fd: FormData,
  token?: string
): Promise<void> {
  if (!useMock) {
    try {
      await axios.put(`${API_BASE}/brands/${id}`, fd, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Content-Type': 'multipart/form-data',
        },
      });
      return;
    } catch {
      console.warn('PUT /brands failed, switching to MOCK.');
      useMock = true;
    }
  }
  const target = mockDB.find((b) => b.id === id);
  if (!target) return;
  const name = fd.get('name');
  const description = fd.get('description');
  const logo = fd.get('logo');
  if (typeof name === 'string' && name) target.name = name;
  if (typeof description === 'string') target.description = description;
  if (logo instanceof File) target.logo_url = await fileToDataURL(logo);
}

async function apiDelete(id: number, token?: string): Promise<void> {
  if (!useMock) {
    try {
      await axios.delete(`${API_BASE}/brands/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      return;
    } catch {
      console.warn('DELETE /brands failed, switching to MOCK.');
      useMock = true;
    }
  }
  const idx = mockDB.findIndex((b) => b.id === id);
  if (idx >= 0) mockDB.splice(idx, 1);
}

/* ================= Modal (Tailwind, giống canvas) ================= */
function BrandModal({
  open,
  onClose,
  onSubmit,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    payload: { name: string; description: string; logoFile: File | null },
    id?: number
  ) => Promise<void>;
  initial?: Brand | null;
}) {
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [logoPreview, setLogoPreview] = useState<string>(
    toAbsolute(initial?.logo_url)
  );
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setName(initial?.name || '');
        setDescription(initial?.description || '');
        setLogoPreview(toAbsolute(initial?.logo_url));
        setLogoFile(null);
        setSaving(false);
      }, 200);
    }
  }, [open, initial]);

  const fileRef = useRef<HTMLInputElement>(null);
  const pickImage = (f: File) => {
    setLogoFile(f);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(String(reader.result));
    reader.readAsDataURL(f);
  };

  const submit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSubmit(
      { name: name.trim(), description: description.trim(), logoFile },
      initial?.id
    );
    setSaving(false);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-[min(640px,100%)] rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-lg font-semibold text-slate-900">
            {isEdit ? 'Sửa thương hiệu' : 'Thêm thương hiệu'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-5">
          {/* Left fields */}
          <div className="sm:col-span-3 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Tên thương hiệu
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập tên"
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                Mô tả
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả ngắn"
                rows={4}
                className="mt-1 w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </div>
          </div>

          {/* Right: logo */}
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-slate-700">Logo</label>
            <div className="mt-1 flex flex-col items-center justify-center rounded-2xl border border-slate-300 bg-slate-50 p-3">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="preview"
                  className="h-36 w-full rounded-xl object-contain bg-white"
                />
              ) : (
                <div className="flex h-36 w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 text-slate-400">
                  <ImageIcon className="h-8 w-8" />
                  <span className="mt-1 text-xs">Chưa chọn logo</span>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) pickImage(f);
                }}
              />
              <button
                onClick={() => fileRef.current?.click()}
                type="button"
                className="mt-3 inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm text-slate-700 hover:bg-white"
              >
                <UploadCloud className="h-4 w-4" /> Chọn logo
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t p-4">
          <button
            onClick={onClose}
            className="rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            Hủy
          </button>
          <button
            onClick={submit}
            disabled={!name.trim() || saving}
            className={clsx(
              'inline-flex items-center gap-2 rounded-xl bg-sky-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700',
              saving && 'opacity-60'
            )}
          >
            {saving ? 'Đang lưu…' : isEdit ? 'Lưu thay đổi' : 'Tạo thương hiệu'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= Main ================= */
export default function BrandManager() {
  const [items, setItems] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [toast, setToast] = useState<string>('');

  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('token') || undefined
      : undefined;

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiList(token);
      setItems(data);
    } catch (e) {
      console.error('Fetch brands failed:', e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // test nhỏ: normalizeVN phải khớp tìm kiếm không dấu
    console.assert(
      normalizeVN('ĐiỆn Thoại!').includes('dien'),
      'normalizeVN failed'
    );
  }, []); // eslint-disable-line

  const filtered = useMemo(() => {
    const nq = normalizeVN(query);
    if (!nq) return items;
    return items.filter(
      (b) =>
        normalizeVN(b.name).includes(nq) ||
        normalizeVN(b.description || '').includes(nq)
    );
  }, [items, query]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (b: Brand) => {
    setEditing(b);
    setModalOpen(true);
  };

  const onSubmit = async (
    data: { name: string; description: string; logoFile: File | null },
    id?: number
  ) => {
    try {
      const fd = new FormData();
      if (data.name) fd.append('name', data.name);
      if (data.description !== undefined)
        fd.append('description', data.description);
      if (data.logoFile) fd.append('logo', data.logoFile);

      if (id) {
        await apiUpdate(id, fd, token);
        setToast('Đã cập nhật thương hiệu');
      } else {
        await apiCreate(fd, token);
        setToast('Đã tạo thương hiệu mới');
      }
      await load();
    } catch (e) {
      console.error('Save brand failed:', e);
      setToast('Lỗi khi lưu thương hiệu');
    } finally {
      setTimeout(() => setToast(''), 1500);
    }
  };

  const onDelete = async (id: number) => {
    if (!confirm('Xóa thương hiệu này?')) return;
    try {
      await apiDelete(id, token);
      await load();
      setToast('Đã xóa thương hiệu');
    } catch (e) {
      console.error('Delete brand failed:', e);
      setToast('Lỗi khi xóa thương hiệu');
    } finally {
      setTimeout(() => setToast(''), 1200);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      {useMock && (
        <div className="mb-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Đang hiển thị <b>dữ liệu mô phỏng</b> vì không kết nối được API. Bạn
          vẫn có thể thêm/sửa/xóa tạm thời để xem giao diện.
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Brand Manager</h2>
          <p className="text-sm text-slate-600">Quản lý thương hiệu và logo.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-700"
        >
          <Plus className="h-4 w-4" /> Thêm thương hiệu
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên hoặc mô tả"
            className="w-72 rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          />
        </div>
        <div className="text-xs text-slate-500">{filtered.length} kết quả</div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full table-fixed text-sm">
          <colgroup>
            <col style={{ width: '80px' }} />
            <col style={{ width: '24%' }} />
            <col />
            <col style={{ width: '140px' }} />
            <col style={{ width: '160px' }} />
          </colgroup>
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-2 text-left font-medium whitespace-nowrap">
                ID
              </th>
              <th className="px-4 py-2 text-left font-medium whitespace-nowrap">
                Tên
              </th>
              <th className="px-4 py-2 text-left font-medium whitespace-nowrap">
                Mô tả
              </th>
              <th className="px-4 py-2 text-left font-medium whitespace-nowrap">
                Logo
              </th>
              <th className="px-4 py-2 text-right font-medium whitespace-nowrap">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  Đang tải…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6">
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 p-10 text-center">
                    <ImageIcon className="h-10 w-10 text-slate-300" />
                    <h4 className="mt-3 text-base font-semibold text-slate-900">
                      Chưa có thương hiệu
                    </h4>
                    <p className="mt-1 text-sm text-slate-600">
                      Hãy thêm thương hiệu mới để bắt đầu quản lý.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((b) => (
                <tr key={b.id} className="border-t">
                  <td className="px-4 py-2 align-middle">{b.id}</td>
                  <td className="px-4 py-2 align-middle font-medium text-slate-900">
                    {b.name}
                  </td>
                  <td className="px-4 py-2 align-middle text-slate-600">
                    {b.description || <span className="text-slate-400">-</span>}
                  </td>
                  <td className="px-4 py-2 align-middle">
                    {b.logo_url ? (
                      <img
                        src={toAbsolute(b.logo_url)}
                        alt={b.name}
                        className="h-10 w-16 rounded object-contain bg-white"
                      />
                    ) : (
                      <span className="text-slate-400">No logo</span>
                    )}
                  </td>
                  <td className="px-4 py-2 align-middle">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="rounded-lg border px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                        onClick={() => openEdit(b)}
                      >
                        <Pencil className="mr-1 inline h-3.5 w-3.5" /> Sửa
                      </button>
                      <button
                        className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
                        onClick={() => onDelete(b.id)}
                      >
                        <Trash2 className="mr-1 inline h-3.5 w-3.5" /> Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {toast && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 rounded-xl bg-slate-900/90 px-3 py-2 text-sm text-white shadow-lg">
          <CheckCircle2 className="h-4 w-4" /> {toast}
        </div>
      )}

      <BrandModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={async ({ name, description, logoFile }, id) => {
          const fd = new FormData();
          if (name) fd.append('name', name);
          fd.append('description', description || '');
          if (logoFile) fd.append('logo', logoFile);
          await onSubmit({ name, description, logoFile }, id);
        }}
        initial={editing}
      />
    </div>
  );
}
