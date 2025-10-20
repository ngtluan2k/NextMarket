
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Trash2, Tag, FileText, DollarSign, Building2, ListChecks, X, Search,
  Image as ImageIcon, Upload, MoveLeft, MoveRight, Package, Boxes, Barcode, MapPin, Plus, Minus
} from 'lucide-react';
import { validateProduct, mapErrors } from '../../../validation/productValidator';
import { productService } from '../../../service/product.service';
import type { Product } from '../../page/Seller/tab/StoreInventory';

interface EditProductFormProps {
  product: any;
  onClose: () => void;
  onProductUpdated?: (updatedProduct: Product) => void;
}

export const EditProductForm: React.FC<EditProductFormProps> = ({
  product,
  onClose,
  onProductUpdated,
}) => {
  const [step, setStep] = useState(1);
  const [brands, setBrands] = useState<{ id: number; name: string }[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [deletedMediaIds, setDeletedMediaIds] = useState<number[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const getErr = (path: string) => errors[path];

  // ---- form state (giữ schema cũ) ----
  interface ProductFormState {
    name: string;
    short_description?: string;
    description?: string;
    base_price: number;
    brandId: number;
    categories: number[];
    media: {
      id?: number;
      media_type: string;
      url: string;
      is_primary?: boolean;
      sort_order?: number;
      file?: File;
    }[];
    variants: {
      id?: number;
      sku: string;
      variant_name: string;
      price: number;
      stock: number;
      barcode?: string;
    }[];
    inventory: {
      id?: number;
      variant_sku: string;
      variant_id?: number;
      product_id?: number;
      location: string;
      quantity: number;
      used_quantity?: number;
    }[];
    pricing_rules: {
      type: string;
      min_quantity: number;
      price: number;
      cycle?: string;
      starts_at?: string | Date;
      ends_at?: string | Date;
      variant_sku?: string;
      name?: string;
      status?: 'active' | 'inactive';
    }[];
  }

  const [form, setForm] = useState<ProductFormState>({
    name: '',
    short_description: '',
    description: '',
    base_price: 0,
    brandId: 0,
    categories: [],
    media: [],
    variants: [],
    inventory: [],
    pricing_rules: [],
  });

  // ---------- helpers cho Media ----------
  const multiFileRef = useRef<HTMLInputElement | null>(null);
  const replaceCoverAfterPickRef = useRef(false);

  const reindexSort = (arr: ProductFormState['media']) =>
    arr.map((m, idx) => ({ ...m, sort_order: idx + 1 }));

  const normalizePrimary = (arr: ProductFormState['media']) =>
    arr.map((m, idx) => ({ ...m, is_primary: idx === 0 }));

  const openMultiPickerAppend = () => {
    replaceCoverAfterPickRef.current = false;
    multiFileRef.current?.click();
  };

  const openMultiPickerReplaceCover = () => {
    replaceCoverAfterPickRef.current = true;
    multiFileRef.current?.click();
  };

  const onMultiPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setForm((prev) => {
      let media = [...prev.media];

      if (replaceCoverAfterPickRef.current) {
        const [first, ...rest] = files;
        if (first) {
          const firstUrl = URL.createObjectURL(first);
          if (media.length === 0) {
            media.unshift({
              media_type: 'image',
              url: firstUrl,
              file: first,
              is_primary: true,
              sort_order: 1,
            });
          } else {
            // thay cover
            media[0] = {
              ...media[0],
              media_type: 'image',
              url: firstUrl,
              file: first,
              is_primary: true,
              sort_order: 1,
            };
          }
        }
        rest.forEach((f) =>
          media.push({
            media_type: 'image',
            url: URL.createObjectURL(f),
            file: f,
            is_primary: false,
            sort_order: media.length + 1,
          })
        );
      } else {
        // chỉ append; nếu chưa có cover thì file đầu làm cover
        files.forEach((file, idx) => {
          const url = URL.createObjectURL(file);
          media.push({
            media_type: 'image',
            url,
            file,
            is_primary: media.length === 0 && idx === 0,
            sort_order: media.length + 1,
          });
        });
      }

      replaceCoverAfterPickRef.current = false;
      media = normalizePrimary(reindexSort(media));
      return { ...prev, media };
    });

    e.target.value = '';
  };

  const setAsCover = (i: number) => {
    if (i === 0) return;
    setForm((prev) => {
      const media = [...prev.media];
      const [m] = media.splice(i, 1);
      media.unshift(m);
      return { ...prev, media: normalizePrimary(reindexSort(media)) };
    });
  };

  const moveMedia = (i: number, dir: -1 | 1) => {
    setForm((prev) => {
      const media = [...prev.media];
      const j = i + dir;
      if (j < 0 || j >= media.length) return prev;
      const tmp = media[i];
      media[i] = media[j];
      media[j] = tmp;
      return { ...prev, media: normalizePrimary(reindexSort(media)) };
    });
  };

  const removeMediaAt = (i: number) => {
    setForm((prev) => {
      const media = [...prev.media];
      const removed = media[i];
      if (removed?.id) setDeletedMediaIds((d) => [...d, Number(removed.id)]);
      media.splice(i, 1);
      return { ...prev, media: normalizePrimary(reindexSort(media)) };
    });
  };
  // --------------------------------------------------------

  // Preload brands & categories + map product vào form
  useEffect(() => {
    const token = localStorage.getItem('token');
    (async () => {
      try {
        const [brandsRes, categoriesRes] = await Promise.all([
          fetch('http://localhost:3000/brands', {
            headers: { Authorization: `Bearer ${token}` },
          }).then((r) => r.json()),
          fetch('http://localhost:3000/categories', {
            headers: { Authorization: `Bearer ${token}` },
          }).then((r) => r.json()),
        ]);

        setBrands(brandsRes.data || []);
        setCategories(categoriesRes.data || []);

        if (product) {
          // variants + stock
          const variantsWithStock = (product.variants || []).map((v: any) => {
            const totalStock = (v.inventories || []).reduce(
              (sum: number, inv: any) => sum + Number(inv.quantity || 0),
              0
            );
            return { ...v, stock: totalStock };
          });

          // pricing rules chuẩn hóa
          const pricingRules = (product.pricing_rules || []).map((pr: any) => ({
            ...pr,
            variant_sku: pr.variant_sku || '',
            name: pr.name || '',
            status: pr.status || 'active',
            starts_at: pr.starts_at
              ? new Date(pr.starts_at).toISOString().slice(0, 10)
              : '',
            ends_at: pr.ends_at
              ? new Date(pr.ends_at).toISOString().slice(0, 10)
              : '',
          }));

          // inventory flatten
          const inventoryWithSKU = (product.variants || []).flatMap((v: any) =>
            (v.inventories || []).map((inv: any) => ({
              id: inv.id,
              variant_sku: v.sku,
              variant_id: v.id,
              product_id: product.id,
              location: inv.location,
              quantity: Number(inv.quantity || 0),
              used_quantity: Number(inv.used_quantity || 0),
            }))
          );

          // media: sắp xếp để cover lên đầu
          let media = (product.media || [])
            .filter((m: any) => m.url && m.url !== '')
            .sort((a: any, b: any) => {
              if (!!a.is_primary === !!b.is_primary) {
                return (a.sort_order ?? 0) - (b.sort_order ?? 0);
              }
              return a.is_primary ? -1 : 1;
            });

          media = normalizePrimary(reindexSort(media));

          setForm({
            name: product.name || '',
            short_description: product.short_description || '',
            description: product.description || '',
            base_price: Number(product.base_price || 0),
            brandId: Number(product.brandId || 0),
            categories: (product.categories || []).map((c: any) => c.id),
            media,
            variants: variantsWithStock,
            inventory: inventoryWithSKU,
            pricing_rules: pricingRules,
          });
        }
      } catch (err) {
        console.error('Load brands/categories failed:', err);
      }
    })();
  }, [product]);

  // ---- handlers chung ----
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as any;
    let next: any = value;
    if (type === 'number') next = Number(value);
    if (name === 'brandId') next = Number(value);
    setForm((prev) => ({ ...prev, [name]: next }));
  };

  const handleCategoryChange = (id: number) => {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(id)
        ? prev.categories.filter((c) => c !== id)
        : [...prev.categories, id],
    }));
  };

  const addVariant = () =>
    setForm((prev) => ({
      ...prev,
      variants: [...prev.variants, { sku: '', variant_name: '', price: 0, stock: 0 }],
    }));

  const removeVariantAt = (i: number) =>
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, idx) => idx !== i),
    }));

  const addInventory = () =>
    setForm((prev) => ({
      ...prev,
      inventory: [
        ...prev.inventory,
        { variant_sku: '', variant_id: undefined, product_id: product?.id, location: '', quantity: 0 },
      ],
    }));

  const removeInventoryAt = (i: number) =>
    setForm((prev) => ({
      ...prev,
      inventory: prev.inventory.filter((_, idx) => idx !== i),
    }));

  const addPricingRule = () =>
    setForm((prev) => ({
      ...prev,
      pricing_rules: [
        ...prev.pricing_rules,
        {
          type: '',
          min_quantity: 0,
          price: 0,
          cycle: '',
          starts_at: '',
          ends_at: '',
          variant_sku: '',
          name: '',
          status: 'active',
        },
      ],
    }));

  // tổng stock cho từng variant khi submit
  const variantsWithStock = form.variants.map((v) => {
    const totalStock = form.inventory
      .filter((inv) => inv.variant_sku === v.sku)
      .reduce((sum, inv) => sum + Number(inv.quantity || 0), 0);
    return { ...v, stock: totalStock };
  });

  // ---------- Step 1 UI states ----------
  const [priceText, setPriceText] = useState<string>(
    form.base_price ? new Intl.NumberFormat('vi-VN').format(form.base_price) : ''
  );
  useEffect(() => {
    setPriceText(form.base_price ? new Intl.NumberFormat('vi-VN').format(form.base_price) : '');
  }, [form.base_price]);
  const shortCount = form.short_description?.length ?? 0;

  // Dropdown danh mục dài
  const [catOpen, setCatOpen] = useState(false);
  const [catQuery, setCatQuery] = useState('');
  const catWrapRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!catWrapRef.current) return;
      if (!catWrapRef.current.contains(e.target as Node)) setCatOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);
  const filteredCategories = useMemo(
    () => categories.filter((c: any) => (c.name || '').toLowerCase().includes(catQuery.toLowerCase())),
    [categories, catQuery]
  );
  const selectedCats = useMemo(
    () => categories.filter((c: any) => form.categories.includes(c.id)),
    [categories, form.categories]
  );
  const previewCats = selectedCats.slice(0, 6);
  const remain = selectedCats.length - previewCats.length;

  // đổi text -> number (giữ phân cách nghìn)
  function onPriceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const onlyDigits = e.target.value.replace(/[^0-9]/g, '');
    const n = onlyDigits ? Number(onlyDigits) : 0;
    setPriceText(onlyDigits ? new Intl.NumberFormat('vi-VN').format(n) : '');
    setForm((prev) => ({ ...prev, base_price: n }));
  }

  // toggle danh mục (chips + dropdown)
  function toggleCategory(id: number) {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(id)
        ? prev.categories.filter((c) => c !== id)
        : [...prev.categories, id],
    }));
  }

  // ---------- Submit ----------
  const handleSubmit = async (status: 'draft' | 'active') => {
    try {
      setErrors({});
      setSubmitError(null);
      setSubmitting(true);

      if (status === 'active') {
        const toValidate = { ...form, variants: variantsWithStock };
        const result = validateProduct(toValidate, 'publish');
        if (!result.success) {
          const mapped = mapErrors(result.error.errors);
          setErrors(mapped);
          const keys = Object.keys(mapped);
          const goto =
            keys.find((k) => /^media(\.|$)/.test(k)) ? 2 :
            keys.find((k) => /^variants|^inventory/.test(k)) ? 3 :
            keys.find((k) => /^pricing_rules/.test(k)) ? 4 : 1;
          setStep(goto);
          setSubmitting(false);
          return;
        }
      }

      // Tách media cũ/mới
      const existingMedia = form.media.filter((m) => m.url && !m.file);
      const newMedia = form.media.filter((m) => m.file);

      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('short_description', form.short_description || '');
      fd.append('description', form.description || '');
      fd.append('base_price', String(form.base_price));
      fd.append('brandId', String(form.brandId));
      fd.append('categories', JSON.stringify(form.categories));
      fd.append('variants', JSON.stringify(variantsWithStock));
      fd.append('inventory', JSON.stringify(form.inventory));
      fd.append('pricing_rules', JSON.stringify(form.pricing_rules));
      fd.append('status', status);

      // media_meta: cũ + placeholder cho mới (để giữ order/primary)
      fd.append(
        'media_meta',
        JSON.stringify([
          ...existingMedia.map((m, idx) => ({
            id: m.id || null,
            url: m.url,
            media_type: m.media_type || 'image',
            is_primary: idx === 0,
            sort_order: m.sort_order || idx + 1,
          })),
          ...newMedia.map((m, idx) => ({
            id: null,
            url: '',
            media_type: m.media_type || 'image',
            is_primary: existingMedia.length === 0 && idx === 0,
            sort_order: existingMedia.length + idx + 1,
          })),
        ])
      );

      newMedia.forEach((m) => m.file && fd.append('media', m.file));
      if (deletedMediaIds.length) {
        fd.append('deleted_media_ids', JSON.stringify(deletedMediaIds));
      }

      await productService.updateProduct(product.apiId, fd);

      const updatedProduct: Product = {
        ...product,
        ...form,
        base_price: Number(form.base_price),
        statusApi: status,
      };

      onProductUpdated?.(updatedProduct);
      onClose();
    } catch (err: any) {
      setSubmitError(err?.message || 'Cập nhật thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = () => setStep((s) => Math.min(4, s + 1));
  const prevStep = () => setStep((s) => Math.max(1, s - 1));

  // ---------- UI ----------
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit('active'); // Publish
      }}
      noValidate
      className="space-y-6"
    >
      <div className="flex items-center justify-between pr-16 md:pr-24">
        <h2 className="text-2xl font-bold">Edit Product</h2>

        <nav className="flex items-center gap-3 select-none">
          {[1, 2, 3, 4].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStep(s)}
              aria-current={step === s ? 'step' : undefined}
              aria-label={`Bước ${s}`}
              title={`Bước ${s}`}
              className={[
                'grid place-items-center rounded-full border font-medium transition-all',
                'h-8 w-8 md:h-9 md:w-9',
                step === s
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              ].join(' ')}
            >
              {s}
            </button>
          ))}
        </nav>
      </div>
      {/* STEP 1: Product Info */}
      {step === 1 && (
        <section className="space-y-6">
          <header className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-100 flex items-center justify-center">
              <Tag className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Thông tin sản phẩm</h3>
              <p className="text-sm text-slate-500">Điền những trường cơ bản để người mua hiểu rõ về sản phẩm của bạn.</p>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Trái */}
            <div className="lg:col-span-8 space-y-5">
              {/* Tên */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <FileText className="h-4 w-4 text-slate-500" /> Tên sản phẩm <span className="text-rose-600">*</span>
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ví dụ: Áo thun unisex EveryMart"
                  className={
                    'mt-1 w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200 ' +
                    (getErr('name') ? 'border-rose-400' : 'border-slate-300')
                  }
                />
                {getErr('name') && <p className="mt-1 text-xs text-rose-600">{getErr('name')}</p>}
              </div>

              {/* Mô tả ngắn */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <ListChecks className="h-4 w-4 text-slate-500" /> Mô tả ngắn
                  </label>
                  <span className={`text-xs ${shortCount > 160 ? 'text-rose-600' : 'text-slate-400'}`}>{shortCount}/160</span>
                </div>
                <input
                  name="short_description"
                  value={form.short_description || ''}
                  maxLength={200}
                  onChange={handleChange}
                  placeholder="Tóm tắt 1–2 câu nổi bật (khuyến nghị ≤ 160 ký tự)"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {/* Mô tả chi tiết */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <FileText className="h-4 w-4 text-slate-500" /> Mô tả chi tiết
                </label>
                <textarea
                  name="description"
                  value={form.description || ''}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Nội dung mô tả chi tiết, chất liệu, hướng dẫn sử dụng, bảo hành…"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            {/* Phải */}
            <div className="lg:col-span-4 space-y-5">
              {/* Giá */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <DollarSign className="h-4 w-4 text-slate-500" /> Giá cơ bản <span className="text-rose-600">*</span>
                </label>
                <div className={`mt-1 flex items-center rounded-xl border ${getErr('base_price') ? 'border-rose-400' : 'border-slate-300'} bg-white px-3`}>
                  <span className="text-slate-400">₫</span>
                  <input
                    inputMode="numeric"
                    value={priceText}
                    onChange={onPriceChange}
                    placeholder="0"
                    className="w-full bg-transparent px-2 py-2.5 text-sm outline-none"
                  />
                </div>
                {getErr('base_price') && <p className="mt-1 text-xs text-rose-600">{getErr('base_price')}</p>}
                <p className="mt-1 text-xs text-slate-400">Giá niêm yết chưa bao gồm quy tắc giá / khuyến mãi.</p>
              </div>

              {/* Thương hiệu */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Building2 className="h-4 w-4 text-slate-500" /> Thương hiệu <span className="text-rose-600">*</span>
                </label>
                <select
                  name="brandId"
                  value={form.brandId}
                  onChange={handleChange}
                  className={`mt-1 w-full rounded-xl border ${getErr('brandId') ? 'border-rose-400' : 'border-slate-300'} bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200`}
                >
                  <option value={0}>— Chọn thương hiệu —</option>
                  {brands.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                {getErr('brandId') && <p className="mt-1 text-xs text-rose-600">{getErr('brandId')}</p>}
              </div>

              {/* Danh mục */}
              <div ref={catWrapRef}>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <ListChecks className="h-4 w-4 text-slate-500" /> Danh mục <span className="text-rose-600">*</span>
                </label>

                <div className="mt-2 flex flex-wrap gap-2">
                  {previewCats.map((c: any) => (
                    <span key={c.id} className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700">
                      {c.name}
                      <button type="button" onClick={() => toggleCategory(c.id)} className="text-slate-400 hover:text-rose-600">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                  {remain > 0 && (
                    <button type="button" onClick={() => setCatOpen(true)} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200">
                      +{remain} nữa
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setCatOpen(!catOpen)}
                    className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs md:text-sm text-slate-700 hover:bg-slate-50"
                  >
                    {catOpen ? 'Đóng danh sách' : 'Chọn danh mục'}
                  </button>
                  {selectedCats.length > 0 && (
                    <button type="button" onClick={() => setForm((p) => ({ ...p, categories: [] }))} className="rounded-full bg-rose-50 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-100 border border-rose-200">
                      Xóa tất cả
                    </button>
                  )}
                </div>

                {catOpen && (
                  <div className="relative">
                    <div className="absolute z-30 mt-2 w-[min(28rem,90vw)] rounded-xl border border-slate-200 bg-white shadow-xl">
                      <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2.5">
                        <Search className="h-4 w-4 text-slate-400" />
                        <input value={catQuery} onChange={(e) => setCatQuery(e.target.value)} placeholder="Tìm danh mục…" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" />
                      </div>
                      <ul className="max-h-72 overflow-auto p-2">
                        {filteredCategories.map((c: any) => {
                          const checked = form.categories.includes(c.id);
                          return (
                            <li key={c.id} className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-slate-50">
                              <input type="checkbox" checked={checked} onChange={() => toggleCategory(c.id)} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                              <span className="truncate text-slate-700">{c.name}</span>
                            </li>
                          );
                        })}
                        {filteredCategories.length === 0 && (
                          <li className="px-3 py-6 text-sm text-slate-500">Không có kết quả phù hợp</li>
                        )}
                      </ul>
                      <div className="flex items-center justify-between border-t border-slate-200 px-3 py-2.5 text-xs text-slate-500">
                        <span>Đã chọn: {form.categories.length}</span>
                        <button type="button" onClick={() => setCatOpen(false)} className="rounded-lg bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700">Xong</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {getErr('categories') && <p className="mt-2 text-xs text-rose-600">{getErr('categories')}</p>}
            </div>
          </div>
        </section>
      )}

      {/* STEP 2: Media (đẹp & đồng bộ) */}
      {step === 2 && (
        <section className="space-y-6">
          <header className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-purple-100 flex items-center justify-center">
              <ImageIcon className="h-5 w-5 text-purple-700" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Hình ảnh & Media</h3>
              <p className="text-sm text-slate-500">Chọn ảnh đại diện (cover) và thêm nhiều ảnh phụ để mô tả sản phẩm.</p>
            </div>
          </header>

          {/* Cover card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
            <div className="flex items-start gap-4">
              <div className="relative h-56 w-56 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                {form.media[0]?.url ? (
                  <>
                    <img
                      src={form.media[0].url}
                      alt="cover"
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute left-2 top-2 text-xs bg-black/60 text-white px-2 py-1 rounded">Cover</span>
                    <div className="absolute inset-x-2 bottom-2 flex gap-2">
                      <button
                        type="button"
                        onClick={openMultiPickerReplaceCover}
                        className="inline-flex items-center gap-1 rounded-lg bg-white/95 px-2 py-1 text-xs shadow hover:bg-white"
                        title="Thay cover"
                      >
                        <Upload className="h-3.5 w-3.5" /> Thay ảnh
                      </button>
                      <button
                        type="button"
                        onClick={() => removeMediaAt(0)}
                        className="inline-flex items-center gap-1 rounded-lg bg-white/95 px-2 py-1 text-xs text-rose-600 shadow hover:bg-white"
                        title="Xóa cover"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Xóa
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={openMultiPickerReplaceCover}
                    className="h-full w-full flex flex-col items-center justify-center text-slate-500 hover:text-slate-700"
                    title="Chọn nhiều ảnh; ảnh đầu sẽ làm cover"
                  >
                    <Upload className="h-6 w-6" />
                    <div className="mt-1 text-sm">Chọn ảnh đại diện</div>
                  </button>
                )}
              </div>

              <div className="flex-1 space-y-3">
                <p className="text-sm text-slate-600">
                  Ảnh đầu tiên là ảnh đại diện (cover). Bạn có thể nhấp vào ảnh phụ để đặt làm cover, hoặc dùng nút mũi tên để đổi vị trí.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={openMultiPickerAppend}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
                  >
                    <Plus className="h-4 w-4" /> Thêm ảnh
                  </button>
                  <input
                    ref={multiFileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={onMultiPicked}
                  />
                </div>
                {getErr('media.0.url') && <p className="text-xs text-rose-600">{getErr('media.0.url')}</p>}
              </div>
            </div>
          </div>

          {/* Thumbnails */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
            {form.media.length <= 1 ? (
              <p className="text-sm text-slate-500">Chưa có ảnh phụ. Nhấn “Thêm ảnh”.</p>
            ) : (
              <div className="flex items-stretch gap-3 overflow-x-auto">
                {form.media.slice(1).map((m, idx) => {
                  const i = idx + 1;
                  return (
                    <div key={i} className="group relative w-28 h-28 shrink-0 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                      {m.url && (
                        <>
                          <img
                            src={m.url}
                            alt={`media-${i}`}
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 hidden group-hover:flex items-center justify-center gap-1 bg-black/30">
                            <button
                              type="button"
                              onClick={() => moveMedia(i, -1)}
                              className="rounded-md bg-white/95 p-1 shadow"
                              title="Sang trái"
                            >
                              <MoveLeft className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setAsCover(i)}
                              className="rounded-md bg-white/95 px-2 py-1 text-xs shadow"
                              title="Đặt làm cover"
                            >
                              Cover
                            </button>
                            <button
                              type="button"
                              onClick={() => moveMedia(i, +1)}
                              className="rounded-md bg-white/95 p-1 shadow"
                              title="Sang phải"
                            >
                              <MoveRight className="h-4 w-4" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeMediaAt(i)}
                            className="absolute right-1 top-1 bg-white/95 p-1 rounded shadow"
                            title="Xoá ảnh"
                          >
                            <Trash2 className="h-4 w-4 text-rose-600" />
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <p className="mt-2 text-xs text-slate-400">
              * Gợi ý: Tải ảnh tỷ lệ 1:1 hoặc 4:3, kích thước &gt;= 800px để hiển thị đẹp.
            </p>
          </div>
        </section>
      )}

      {/* STEP 3: Variants & Inventory (đồng bộ UI) */}
      {step === 3 && (
        <section className="space-y-6">
          <header className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-100 flex items-center justify-center">
              <Boxes className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Biến thể & Tồn kho</h3>
              <p className="text-sm text-slate-500">Quản lý SKU, giá biến thể và tổng tồn kho theo từng SKU.</p>
            </div>
          </header>

          {/* Variants List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-slate-800 flex items-center gap-2">
                <Package className="h-4 w-4 text-slate-500" /> Biến thể ({form.variants.length})
              </h4>
              <button
                type="button"
                onClick={addVariant}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" /> Thêm biến thể
              </button>
            </div>

            {form.variants.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">
                Chưa có biến thể. Nhấn “Thêm biến thể”.
              </div>
            )}

            {form.variants.map((v, i) => {
              const totalStock = form.inventory
                .filter((inv) => inv.variant_sku === v.sku)
                .reduce((sum, inv) => sum + Number(inv.quantity || 0), 0);

              return (
                <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-sm font-medium">SKU</label>
                      <input
                        value={v.sku}
                        onChange={(e) => {
                          const next = [...form.variants];
                          next[i].sku = e.target.value;
                          setForm({ ...form, variants: next });
                        }}
                        className={`mt-1 px-3 py-2 border rounded-md w-full ${getErr(`variants.${i}.sku`) ? 'border-rose-400' : 'border-slate-300'}`}
                        placeholder="SKU"
                      />
                      {getErr(`variants.${i}.sku`) && (
                        <p className="text-xs text-rose-600 mt-1">{getErr(`variants.${i}.sku`)}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium">Tên biến thể</label>
                      <input
                        value={v.variant_name}
                        onChange={(e) => {
                          const next = [...form.variants];
                          next[i].variant_name = e.target.value;
                          setForm({ ...form, variants: next });
                        }}
                        className={`mt-1 px-3 py-2 border rounded-md w-full ${getErr(`variants.${i}.variant_name`) ? 'border-rose-400' : 'border-slate-300'}`}
                        placeholder="Ví dụ: Đỏ / XL"
                      />
                      {getErr(`variants.${i}.variant_name`) && (
                        <p className="text-xs text-rose-600 mt-1">{getErr(`variants.${i}.variant_name`)}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium">Giá biến thể</label>
                      <input
                        type="number"
                        value={v.price}
                        onChange={(e) => {
                          const next = [...form.variants];
                          next[i].price = +e.target.value;
                          setForm({ ...form, variants: next });
                        }}
                        className={`mt-1 px-3 py-2 border rounded-md w-full ${getErr(`variants.${i}.price`) ? 'border-rose-400' : 'border-slate-300'}`}
                        placeholder="0"
                      />
                      {getErr(`variants.${i}.price`) && (
                        <p className="text-xs text-rose-600 mt-1">{getErr(`variants.${i}.price`)}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium">Tổng tồn (tự tính)</label>
                      <input
                        type="number"
                        value={totalStock}
                        readOnly
                        className="mt-1 px-3 py-2 border rounded-md bg-slate-100 w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium">Barcode</label>
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          value={v.barcode || ''}
                          onChange={(e) => {
                            const next = [...form.variants];
                            next[i].barcode = e.target.value;
                            setForm({ ...form, variants: next });
                          }}
                          className="px-3 py-2 border rounded-md w-full border-slate-300"
                          placeholder="Tuỳ chọn"
                        />
                        <button
                          type="button"
                          onClick={() => removeVariantAt(i)}
                          className="inline-flex items-center justify-center rounded-md border border-rose-200 p-2 text-rose-600 hover:bg-rose-50"
                          title="Xóa biến thể"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Inventory Table */}
          <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-slate-800 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-500" /> Tồn kho theo vị trí ({form.inventory.length})
                </h4>
                <button
                  type="button"
                  onClick={addInventory}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
                >
                  <Plus className="h-4 w-4" /> Thêm dòng tồn kho
                </button>
              </div>

              {form.inventory.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">
                  Chưa có dòng tồn kho. Nhấn “Thêm dòng tồn kho”.
                </div>
              ) : (
                <div className="space-y-4">
                  {form.inventory.map((inv, i) => (
                    <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Variant SKU */}
                        <div>
                          <label className="block text-sm font-medium">Variant SKU</label>
                          <input
                            value={inv.variant_sku}
                            onChange={(e) => {
                              const next = [...form.inventory];
                              next[i].variant_sku = e.target.value;
                              setForm({ ...form, inventory: next });
                            }}
                            className={`mt-1 w-full rounded-md border px-3 py-2 text-sm ${
                              getErr(`inventory.${i}.variant_sku`) ? 'border-rose-400' : 'border-slate-300'
                            }`}
                            placeholder="SKU liên kết"
                          />
                          {getErr(`inventory.${i}.variant_sku`) && (
                            <p className="mt-1 text-xs text-rose-600">{getErr(`inventory.${i}.variant_sku`)}</p>
                          )}
                        </div>

                        {/* Vị trí */}
                        <div>
                          <label className="block text-sm font-medium">Vị trí</label>
                          <input
                            value={inv.location}
                            onChange={(e) => {
                              const next = [...form.inventory];
                              next[i].location = e.target.value;
                              setForm({ ...form, inventory: next });
                            }}
                            className={`mt-1 w-full rounded-md border px-3 py-2 text-sm ${
                              getErr(`inventory.${i}.location`) ? 'border-rose-400' : 'border-slate-300'
                            }`}
                            placeholder="Kho / Kệ"
                          />
                          {getErr(`inventory.${i}.location`) && (
                            <p className="mt-1 text-xs text-rose-600">{getErr(`inventory.${i}.location`)}</p>
                          )}
                        </div>

                        {/* Số lượng */}
                        <div>
                          <label className="block text-sm font-medium">Số lượng</label>
                          <input
                            type="number"
                            value={inv.quantity}
                            onChange={(e) => {
                              const next = [...form.inventory];
                              next[i].quantity = +e.target.value;
                              setForm({ ...form, inventory: next });
                            }}
                            className={`mt-1 w-full rounded-md border px-3 py-2 text-sm ${
                              getErr(`inventory.${i}.quantity`) ? 'border-rose-400' : 'border-slate-300'
                            }`}
                            placeholder="0"
                          />
                          {getErr(`inventory.${i}.quantity`) && (
                            <p className="mt-1 text-xs text-rose-600">{getErr(`inventory.${i}.quantity`)}</p>
                          )}
                        </div>

                        {/* Remove button */}
                        <div className="flex items-end justify-end">
                          <button
                            type="button"
                            onClick={() => removeInventoryAt(i)}
                            className="inline-flex h-11 items-center justify-center rounded-md border border-rose-200 px-3 text-rose-600 hover:bg-rose-50"
                            title="Xóa dòng"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
        </section>
      )}

      {/* STEP 4: Pricing Rules (đồng bộ UI) */}
      {step === 4 && (
        <section className="space-y-6">
          <header className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-100 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Quy tắc giá</h3>
              <p className="text-sm text-slate-500">Thiết lập giảm giá theo số lượng, chu kỳ, hoặc gắn theo SKU.</p>
            </div>
          </header>

          <div className="flex items-center justify-between">
            <h4 className="font-medium text-slate-800">Tổng: {form.pricing_rules.length} rule</h4>
            <button
              type="button"
              onClick={addPricingRule}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" /> Thêm rule
            </button>
          </div>

          {(form.pricing_rules || []).length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">
              Chưa có rule. Nhấn “Thêm rule”.
            </div>
          )}

          {(form.pricing_rules || []).map((pr, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-start">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <input
                    value={pr.type}
                    onChange={(e) => {
                      const next = [...form.pricing_rules];
                      next[i].type = e.target.value;
                      setForm({ ...form, pricing_rules: next });
                    }}
                    className="w-full h-11 px-3 border rounded-lg focus:outline-none border-slate-300 focus:ring-2 focus:ring-blue-500"
                    placeholder="bulk / tier"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Min Qty</label>
                  <input
                    type="number"
                    value={pr.min_quantity}
                    onChange={(e) => {
                      const next = [...form.pricing_rules];
                      next[i].min_quantity = +e.target.value;
                      setForm({ ...form, pricing_rules: next });
                    }}
                    className="w-full h-11 px-3 border rounded-lg focus:outline-none border-slate-300 focus:ring-2 focus:ring-blue-500"
                    placeholder="10"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Price</label>
                  <input
                    type="number"
                    value={pr.price}
                    onChange={(e) => {
                      const next = [...form.pricing_rules];
                      next[i].price = +e.target.value;
                      setForm({ ...form, pricing_rules: next });
                    }}
                    className="w-full h-11 px-3 border rounded-lg focus:outline-none border-slate-300 focus:ring-2 focus:ring-blue-500"
                    placeholder="99000"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Cycle</label>
                  <input
                    value={pr.cycle || ''}
                    onChange={(e) => {
                      const next = [...form.pricing_rules];
                      next[i].cycle = e.target.value;
                      setForm({ ...form, pricing_rules: next });
                    }}
                    className="w-full h-11 px-3 border rounded-lg focus:outline-none border-slate-300 focus:ring-2 focus:ring-blue-500"
                    placeholder="monthly"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Starts</label>
                  <input
                    type="date"
                    value={(pr.starts_at as string) || ''}
                    onChange={(e) => {
                      const next = [...form.pricing_rules];
                      next[i].starts_at = e.target.value;
                      setForm({ ...form, pricing_rules: next });
                    }}
                    className="w-full h-11 px-3 border rounded-lg focus:outline-none border-slate-300 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Ends</label>
                  <input
                    type="date"
                    value={(pr.ends_at as string) || ''}
                    onChange={(e) => {
                      const next = [...form.pricing_rules];
                      next[i].ends_at = e.target.value;
                      setForm({ ...form, pricing_rules: next });
                    }}
                    className="w-full h-11 px-3 border rounded-lg focus:outline-none border-slate-300 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-sm font-medium mb-1">Variant SKU</label>
                  <input
                    value={pr.variant_sku || ''}
                    onChange={(e) => {
                      const next = [...form.pricing_rules];
                      next[i].variant_sku = e.target.value;
                      setForm({ ...form, pricing_rules: next });
                    }}
                    className="w-full h-11 px-3 border rounded-lg focus:outline-none border-slate-300 focus:ring-2 focus:ring-blue-500"
                    placeholder="Link SKU"
                  />
                </div>

                <div className="md:col-span-4">
                  <label className="block text-sm font-medium mb-1">Rule Name</label>
                  <input
                    value={pr.name || ''}
                    onChange={(e) => {
                      const next = [...form.pricing_rules];
                      next[i].name = e.target.value;
                      setForm({ ...form, pricing_rules: next });
                    }}
                    className="w-full h-11 px-3 border rounded-lg focus:outline-none border-slate-300 focus:ring-2 focus:ring-blue-500"
                    placeholder="Tên hiển thị"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={pr.status || 'active'}
                    onChange={(e) => {
                      const next = [...form.pricing_rules];
                      next[i].status = e.target.value as 'active' | 'inactive';
                      setForm({ ...form, pricing_rules: next });
                    }}
                    className="w-full h-11 px-3 border rounded-lg focus:outline-none border-slate-300 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="flex justify-end self-end md:col-span-1 md:col-start-12 md:justify-self-end">
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        pricing_rules: prev.pricing_rules.filter((_, idx) => idx !== i),
                      }))
                    }
                    className="h-11 w-11 inline-flex items-center justify-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300"
                    title="Remove rule"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Submit error */}
      {submitError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 py-2.5 px-4 text-sm text-rose-700">
          {submitError}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2">
          {step > 1 && (
            <button
              type="button"
              onClick={prevStep}
              className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50"
            >
              Previous
            </button>
          )}
        </div>

        <div className="flex gap-2">
          {step < 4 && (
            <button
              type="button"
              onClick={nextStep}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
            >
              Next
            </button>
          )}

          {step === 4 && (
            <>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {submitting ? 'Publishing…' : 'Publish'}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSubmit('draft')}
                className="px-6 py-2 rounded-xl bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-60"
              >
                {submitting ? 'Saving…' : 'Save Draft'}
              </button>
            </>
          )}
        </div>
      </div>
    </form>
  );
};
