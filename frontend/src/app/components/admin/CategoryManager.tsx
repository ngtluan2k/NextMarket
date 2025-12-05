// src/components/admin/CategoryManager.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import {
  Plus,
  Pencil,
  Trash2,
  Image as ImageIcon,
  X,
  Search,
  UploadCloud,
  CheckCircle2,
} from 'lucide-react';

/**
 * Category Manager – Tailwind UI
 * - axios gọi API backend của bạn
 * - Tự tạo slug (bỏ dấu), autocomplete danh mục cha (search tiếng Việt không dấu)
 * - Preview ảnh, upload multipart/form-data
 * - Badge Root/Child, tìm kiếm, toast
 *
 * Backend endpoints:
 *   GET    /categories
 *   POST   /categories                 (multipart: name, parent_id?, image?)
 *   PUT    /categories/:id             (multipart: name?, parent_id?, image?)
 *   DELETE /categories/:id
 */

type ApiCategory = {
  id: number;
  name: string;
  slug: string;
  image?: string;
  parent?: ApiCategory | null;
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  image?: string; // absolute URL
  parentId?: number | null;
};

const API_BASE = import.meta.env.VITE_BE_BASE_URL;

/* ================= Helpers ================= */

const toAbsolute = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
};

const stripAccents = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/** CHUẨN HOÁ TIẾNG VIỆT (không dấu + lower + trim, gộp khoảng trắng) */
const normalizeVN = (s: string) =>
  stripAccents(s || '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const toSlug = (s: string) =>
  normalizeVN(s)
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

/** join class tiện dụng */
function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(' ');
}

/* ================= API layer (axios) ================= */

async function apiList(token?: string): Promise<Category[]> {
  const res = await axios.get(`${API_BASE}/categories`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  const rows: ApiCategory[] = res.data?.data ?? res.data ?? [];
  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    image: toAbsolute(c.image),
    parentId: c.parent?.id ?? null,
  }));
}

async function apiCreate(
  payload: {
    name: string;
    slug: string;
    imageFile?: File | null;
    parentId?: number | null;
  },
  token?: string
): Promise<void> {
  const fd = new FormData();
  fd.append('name', payload.name);
  // Nếu backend nhận slug tuỳ chọn thì mở dòng dưới:
  // fd.append("slug", payload.slug);
  if (payload.parentId) fd.append('parent_id', String(payload.parentId));
  if (payload.imageFile) fd.append('image', payload.imageFile);

  await axios.post(`${API_BASE}/categories`, fd, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'multipart/form-data',
    },
  });
}

async function apiUpdate(
  id: number,
  payload: {
    name?: string;
    slug?: string;
    imageFile?: File | null;
    parentId?: number | null;
  },
  token?: string
): Promise<void> {
  const fd = new FormData();
  if (payload.name) fd.append('name', payload.name);
  if (payload.parentId !== undefined && payload.parentId !== null)
    fd.append('parent_id', String(payload.parentId));
  if (payload.parentId === null) fd.append('parent_id', ''); // clear parent
  if (payload.imageFile) fd.append('image', payload.imageFile);

  await axios.put(`${API_BASE}/categories/${id}`, fd, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'multipart/form-data',
    },
  });
}

async function apiDelete(id: number, token?: string): Promise<void> {
  await axios.delete(`${API_BASE}/categories/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

/* ================= Small UI atoms ================= */

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
      {children}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 p-10 text-center">
      <ImageIcon className="h-10 w-10 text-slate-300" />
      <h4 className="mt-3 text-base font-semibold text-slate-900">
        Chưa có danh mục
      </h4>
      <p className="mt-1 text-sm text-slate-600">
        Hãy thêm danh mục mới để bắt đầu quản lý.
      </p>
    </div>
  );
}

/* ================= Modal ================= */

/* ================= Modal ================= */
function CategoryModal({
  open,
  onClose,
  onSubmit,
  initial,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    data: {
      name: string;
      slug: string;
      parentId: number | null;
      imageFile: File | null;
    },
    id?: number
  ) => Promise<void>;
  initial?: Category | null;
  categories: Category[];
}) {
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name || '');
  const [slug, setSlug] = useState(initial?.slug || '');
  const [parentId, setParentId] = useState<number | null>(
    initial?.parentId ?? null
  );
  const [parentQuery, setParentQuery] = useState('');
  const [showParentList, setShowParentList] = useState(false); // NEW
  const [imagePreview, setImagePreview] = useState<string>(
    initial?.image || ''
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // sinh slug theo tên
  useEffect(() => {
    setSlug(toSlug(name));
  }, [name]);

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setName(initial?.name || '');
        setSlug(initial?.slug || '');
        setParentId(initial?.parentId ?? null);
        setParentQuery('');
        setShowParentList(false);
        setImagePreview(initial?.image || '');
        setImageFile(null);
        setSaving(false);
      }, 200);
    }
  }, [open, initial]);

  // Autocomplete:
  // - Khi chưa gõ gì (parentQuery rỗng), show top danh mục (tối đa 8).
  // - Khi gõ, lọc theo không dấu.
  // - Loại chính danh mục đang sửa.
  const candidates = useMemo(() => {
    const pool = initial
      ? categories.filter((c) => c.id !== initial.id)
      : categories;
    const nq = normalizeVN(parentQuery);
    const uniq = new Map<number, Category>();

    pool.forEach((c) => {
      const hit = nq ? normalizeVN(c.name).includes(nq) : true; // chưa gõ => show tất cả
      if (hit) uniq.set(c.id, c);
    });

    // Sắp xếp tên tăng dần cho dễ nhìn
    const arr = Array.from(uniq.values()).sort((a, b) =>
      a.name.localeCompare(b.name, 'vi')
    );

    return arr.slice(0, 8);
  }, [parentQuery, categories, initial]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pickImage = (f: File) => {
    setImageFile(f);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(String(reader.result));
    reader.readAsDataURL(f);
  };

  const submit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSubmit(
      { name: name.trim(), slug, parentId: parentId ?? null, imageFile },
      initial?.id
    );
    setSaving(false);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-[min(680px,100%)] rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-lg font-semibold text-slate-900">
            {isEdit ? 'Sửa danh mục' : 'Thêm danh mục'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-5">
          {/* Info */}
          <div className="sm:col-span-3 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Tên danh mục
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập tên"
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Slug</label>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="Tự tạo từ tên, có thể chỉnh"
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </div>

            {/* Danh mục cha */}
            <div className="relative">
              <label className="text-sm font-medium text-slate-700">
                Danh mục cha
              </label>
              <div className="mt-1 flex items-center gap-2">
                <div className="relative w-full">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    value={parentQuery}
                    onChange={(e) => setParentQuery(e.target.value)}
                    onFocus={() => setShowParentList(true)} // NEW
                    onBlur={() =>
                      setTimeout(() => setShowParentList(false), 120)
                    } // NEW
                    placeholder="Tìm theo tên… (focus để hiện danh sách)"
                    className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-24 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                  {parentId !== null && (
                    <button
                      type="button"
                      className="absolute right-2 top-1.5 rounded-md border px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-50"
                      onClick={() => {
                        setParentId(null);
                        setParentQuery('');
                        setShowParentList(true); // mở lại danh sách top khi bỏ chọn
                      }}
                    >
                      Bỏ chọn
                    </button>
                  )}
                </div>
              </div>

              {showParentList && candidates.length > 0 && (
                <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border bg-white shadow">
                  {candidates.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()} // giữ focus tới khi click xong
                      onClick={() => {
                        setParentId(c.id);
                        setParentQuery(c.name);
                        setShowParentList(false);
                      }}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
                    >
                      <span>{c.name}</span>
                      <span className="text-xs text-slate-400">#{c.id}</span>
                    </button>
                  ))}
                </div>
              )}

              {parentId !== null && (
                <div className="mt-2 text-xs text-slate-600">
                  Đã chọn cha: <b>#{parentId}</b>
                </div>
              )}
            </div>
          </div>

          {/* Image */}
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-slate-700">Ảnh</label>
            <div className="mt-1 flex flex-col items-center justify-center rounded-2xl border border-slate-300 bg-slate-50 p-3">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="preview"
                  className="h-36 w-full rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-36 w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 text-slate-400">
                  <ImageIcon className="h-8 w-8" />
                  <span className="mt-1 text-xs">Chưa chọn ảnh</span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) pickImage(f);
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                type="button"
                className="mt-3 inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm text-slate-700 hover:bg-white"
              >
                <UploadCloud className="h-4 w-4" /> Chọn ảnh
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
            {saving ? 'Đang lưu…' : isEdit ? 'Lưu thay đổi' : 'Tạo danh mục'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= Main ================= */

const CategoryManager: React.FC = () => {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
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
      console.error('Fetch categories failed:', e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // tests nhỏ đảm bảo helper chạy đúng
    const slugCases = [
      { input: 'Điện thoại mới 2025!!!', expect: 'dien-thoai-moi-2025' },
      { input: 'Ốp   lưng', expect: 'op-lung' },
      { input: '   Hello   World  ', expect: 'hello-world' },
    ];
    slugCases.forEach((c) =>
      console.assert(toSlug(c.input) === c.expect, `toSlug failed: ${c.input}`)
    );

    // test tìm kiếm không dấu
    console.assert(
      normalizeVN('Điện tử').includes(normalizeVN('dien')),
      'normalizeVN search failed'
    );
  }, []); // eslint-disable-line

  const filtered = useMemo(() => {
    const nq = normalizeVN(query);
    if (!nq) return items;
    return items.filter(
      (x) =>
        normalizeVN(x.name).includes(nq) || normalizeVN(x.slug).includes(nq)
    );
  }, [items, query]);

  const parentName = (cat: Category) =>
    items.find((x) => x.id === cat.parentId)?.name || '-';

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (c: Category) => {
    setEditing(c);
    setModalOpen(true);
  };

  const onSubmit = async (
    data: {
      name: string;
      slug: string;
      parentId: number | null;
      imageFile: File | null;
    },
    id?: number
  ) => {
    try {
      if (id) {
        await apiUpdate(
          id,
          {
            name: data.name,
            parentId: data.parentId,
            imageFile: data.imageFile,
          },
          token
        );
        await load();
        setToast('Đã cập nhật danh mục');
      } else {
        await apiCreate(
          {
            name: data.name,
            slug: data.slug,
            parentId: data.parentId ?? undefined,
            imageFile: data.imageFile,
          },
          token
        );
        await load();
        setToast('Đã tạo danh mục mới');
      }
    } catch (e) {
      console.error('Save failed:', e);
      setToast('Lỗi khi lưu danh mục');
    } finally {
      setTimeout(() => setToast(''), 1500);
    }
  };

  const onDelete = async (id: number) => {
    if (!confirm('Xóa danh mục này?')) return;
    try {
      await apiDelete(id, token);
      await load();
      setToast('Đã xóa danh mục');
    } catch (e) {
      console.error('Delete failed:', e);
      setToast('Lỗi khi xóa danh mục');
    } finally {
      setTimeout(() => setToast(''), 1200);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Category Manager
          </h2>
          <p className="text-sm text-slate-600">
            Quản lý danh mục và mối quan hệ cha/con.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-700"
        >
          <Plus className="h-4 w-4" /> Thêm danh mục
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên hoặc slug"
            className="w-72 rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          />
        </div>
        <div className="text-xs text-slate-500">{filtered.length} kết quả</div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-2 text-left font-medium">ID</th>
              <th className="px-4 py-2 text-left font-medium">Tên</th>
              <th className="px-4 py-2 text-left font-medium">Slug</th>
              <th className="px-4 py-2 text-left font-medium">Danh mục cha</th>
              <th className="px-4 py-2 text-left font-medium">Ảnh</th>
              <th className="px-4 py-2 text-right font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  Đang tải…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6">
                  <EmptyState />
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-4 py-2">{c.id}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">
                        {c.name}
                      </span>
                      {c.parentId ? <Chip>Child</Chip> : <Chip>Root</Chip>}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{c.slug}</td>
                  <td className="px-4 py-2">{parentName(c)}</td>
                  <td className="px-4 py-2">
                    {c.image ? (
                      <img
                        src={c.image}
                        alt={c.name}
                        className="h-10 w-16 rounded object-cover"
                      />
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="rounded-lg border px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                        onClick={() => openEdit(c)}
                      >
                        <Pencil className="mr-1 inline h-3.5 w-3.5" /> Sửa
                      </button>
                      <button
                        className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
                        onClick={() => onDelete(c.id)}
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

      {modalOpen && (
        <CategoryModal
          key={editing?.id ?? 'create'}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={onSubmit}
          initial={editing}
          categories={items}
        />
      )}
    </div>
  );
};

export default CategoryManager;
