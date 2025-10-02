import React, { useState, useEffect, useRef } from 'react';
import { validateProduct, mapErrors, firstErrorStep } from "../../../validation/productValidator";
import { Trash2 } from 'lucide-react';


export const ProductForm: React.FC = () => {
  const [brands, setBrands] = useState<{ id: number; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>(
    []
  );
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const getErr = (path: string) => errors[path];
  interface ProductFormState {
    name: string;
    short_description?: string;
    description?: string;
    base_price: number;
    brandId: number;
    categories: number[];
    media: {
      media_type: string;
      url: string;
      is_primary?: boolean;
      sort_order?: number;
      file?: File;
    }[];
    variants: {
      sku: string;
      variant_name: string;
      price: number;
      stock: number;
      barcode?: string;
    }[];
    inventory: {
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

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('http://localhost:3000/brands', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) =>
        setBrands(
          (data.data || []).map((b: any) => ({
            id: Number(b.id),
            name: b.name,
          }))
        )
      );
    fetch('http://localhost:3000/categories', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) =>
        setCategories(
          (data.data || []).map((c: any) => ({
            id: Number(c.id),
            name: c.name,
          }))
        )
      );
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleCategoryChange = (id: number) => {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(id)
        ? prev.categories.filter((c) => c !== id)
        : [...prev.categories, id],
    }));
  };

  const addMedia = () =>
    setForm((prev) => ({
      ...prev,
      media: [
        ...prev.media,
        {
          media_type: 'image',
          url: '',
          is_primary: false,
          sort_order: prev.media.length + 1,
        },
      ],
    }));
  const addVariant = () =>
    setForm((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        { sku: '', variant_name: '', price: 0, stock: 0 },
      ],
    }));
  const addInventory = () =>
    setForm((prev) => ({
      ...prev,
      inventory: [
        ...prev.inventory,
        {
          variant_sku: '',
          variant_id: undefined,
          product_id: undefined,
          location: '',
          quantity: 0,
        },
      ],
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
        },
      ],
    }));
    
    const coverFileRef = useRef<HTMLInputElement | null>(null);
  const smallFileRefs = useRef<Array<HTMLInputElement | null>>([]);

const openCoverPicker = () => coverFileRef.current?.click();
const openSmallPicker = (i: number) => smallFileRefs.current[i]?.click();

const addSmallSlot = () => {
  setForm((prev) => {
    const media = [...prev.media];
    // đảm bảo luôn có slot cover ở index 0
    if (media.length === 0) media.push({ media_type: 'image', url: '', sort_order: 1 });
    media.push({ media_type: 'image', url: '', sort_order: media.length + 1 });
    media.forEach((m, idx) => (m.sort_order = idx + 1));
    return { ...prev, media };
  });
};

const removeMediaAt = (i: number) => {
  setForm((prev) => {
    const media = prev.media.filter((_, idx) => idx !== i);
    media.forEach((m, idx) => (m.sort_order = idx + 1));
    return { ...prev, media };
  });
};

// Chọn/đổi ảnh cover (index 0)
const onCoverPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  setForm((prev) => {
    const media = [...prev.media];
    if (media.length === 0) media.push({ media_type: 'image', url, file, sort_order: 1 });
    else media[0] = { ...media[0], media_type: 'image', url, file, sort_order: 1 };
    media.forEach((m, idx) => (m.sort_order = idx + 1));
    return { ...prev, media };
  });
  e.target.value = '';
};
const displayDate = (v?: string | Date) => {
  if (!v) return '—';
  if (typeof v === 'string') return v;
  // v là Date
  try {
    return v.toISOString().slice(0, 10); // yyyy-mm-dd
  } catch {
    return String(v);
  }
};

// Chọn/đổi ảnh nhỏ (index >= 1)
const onSmallPicked = (e: React.ChangeEvent<HTMLInputElement>, i: number) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  setForm((prev) => {
    const media = [...prev.media];
    if (i < media.length) {
      media[i] = { ...media[i], media_type: 'image', url, file, sort_order: i + 1 };
    } else {
      media.push({ media_type: 'image', url, file, sort_order: media.length + 1 });
    }
    media.forEach((m, idx) => (m.sort_order = idx + 1));
    return { ...prev, media };
  });
  e.target.value = '';
};

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    const newMedia = [...form.media];
    newMedia[index] = { ...newMedia[index], file, url: previewUrl };
    setForm({ ...form, media: newMedia });
  };

  const submitForm = async (isDraft: boolean) => {
    try {
      setErrors({});
  
      // 1) Ghép stock cho variants theo inventory
      const variantsWithStock = form.variants.map((v) => {
        const totalStock = form.inventory
          .filter((inv) => inv.variant_sku === v.sku)
          .reduce((sum, inv) => sum + Number(inv.quantity || 0), 0);
        return { ...v, stock: totalStock };
      });
  
      const dataForValidate = { ...form, variants: variantsWithStock };
  
      // 3) Validate (publish: bắt buộc đủ, draft: thoải mái)
      const result = validateProduct(dataForValidate, isDraft ? "draft" : "publish");
  
      // Nếu Publish mà fail -> hiển thị lỗi + nhảy tới step chứa lỗi đầu tiên
      if (!isDraft && !result.success) {
        const mapped = mapErrors(result.error.errors);
        setErrors(mapped);
        const keys = Object.keys(mapped);
        setStep(firstErrorStep(keys));
        return; // chặn submit
      }
  
      // 4) Build FormData + gọi API
      const token = localStorage.getItem('token');
      const url = isDraft
        ? 'http://localhost:3000/products'
        : 'http://localhost:3000/products/publish';
  
      const fd = new FormData();
      fd.append('name', String(form.name || ''));
      fd.append('short_description', String(form.short_description || ''));
      fd.append('description', String(form.description || ''));
      fd.append('base_price', Number(form.base_price || 0).toString());
      fd.append('brandId', Number(form.brandId || 0).toString());
      fd.append('categories', JSON.stringify(form.categories || []));
      fd.append('variants', JSON.stringify(variantsWithStock || []));
      fd.append('inventory', JSON.stringify(form.inventory || []));
      fd.append('pricing_rules', JSON.stringify(form.pricing_rules || []));
  
      (form.media || []).forEach((m) => m.file && fd.append('media', m.file));
  
      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
  
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit product');
  
      alert(isDraft ? 'Product saved as draft!' : 'Product published successfully!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const toLocalISODate = (d: Date) => {
    const off = d.getTimezoneOffset();
    return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
  };
  const todayStr = toLocalISODate(new Date());
  
  // timestamp 00:00:00 local (dùng so sánh ngày)
  const startOfTodayTs = (() => {
    const t = new Date(); t.setHours(0, 0, 0, 0);
    return t.getTime();
  })();
  
  const dayTs = (v: any) => {
    if (!v) return NaN;
    const d = v instanceof Date ? v : new Date(v);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  
  // set / clear lỗi cho 1 field
  const setFieldError = (key: string, msg?: string) =>
    setErrors((prev) => {
      const next = { ...prev };
      if (msg) next[key] = msg;
      else delete next[key];
      return next;
    });
  
  // Step navigation
  const nextStep = () => setStep((prev) => Math.min(prev + 1, 5));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  return (
    <form
       noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submitForm(false); // Publish
      }}
      className="max-w-5xl mx-auto p-6 space-y-6 bg-white shadow-md rounded-md"
    >
      {' '}
      <h2 className="text-2xl font-bold text-center mb-6">Create Product</h2>
      {/* Step Indicators */}
      <div className="flex justify-between mb-6">
        {[1, 2, 3, 4, 5].map((s) => (
          <div
            key={s}
            className={`flex-1 text-center py-2 border-b-2 ${
              step === s ? 'border-blue-600 font-semibold' : 'border-gray-300'
            }`}
          >
            Step {s}
          </div>
        ))}
      </div>
      {/* Step Content */}
      {step === 1 && (
        <section className="space-y-4">
          <h3 className="font-semibold text-lg">Product Info</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Product Name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {getErr("name") && <p className="text-sm text-red-600 mt-1">{getErr("name")}</p>}
            </div>
            <div>
              <label className="block font-medium mb-1">
                Short Description
              </label>
              <input
                name="short_description"
                value={form.short_description}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-medium mb-1">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Base Price</label>
              <input
                type="number"
                name="base_price"
                value={form.base_price}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {getErr("base_price") && <p className="text-sm text-red-600 mt-1">{getErr("base_price")}</p>}
            </div>
            <div>
              <label className="block font-medium mb-1">Brand</label>
              <select
                name="brandId"
                value={form.brandId}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    brandId: Number(e.target.value),
                  }))
                }
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>-- Select Brand --</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              {getErr("brandId") && <p className="text-sm text-red-600 mt-1">{getErr("brandId")}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="block font-medium mb-1">Categories</label>
              <div className="flex flex-wrap gap-3">
                {categories.map((c) => (
                  <label key={c.id} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={form.categories.includes(c.id)}
                      onChange={() => handleCategoryChange(c.id)}
                      className="w-4 h-4"
                    />{' '}
                    {c.name}
                  </label>
                ))}
              </div>
              {getErr("categories") && <p className="text-sm text-red-600 mt-1">{getErr("categories")}</p>}
            </div>
          </div>
        </section>
        
      )}
      {step === 2 && (
        <section className="space-y-4">
          <h3 className="font-semibold text-lg">Media</h3>

          <div className="space-y-4">
            {/* ẢNH LỚN (cover)  */}
            <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50 h-80 w-80">
              {form.media[0]?.url ? (
                <>
                  <img
                    src={form.media[0].url}
                    alt="cover"
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={openCoverPicker}
                    title="Click để đổi ảnh"
                  />
                  {getErr("media.0.url") && <p className="text-sm text-red-600 mt-2">{getErr("media.0.url")}</p>}
                  <span className="absolute left-2 top-2 text-xs bg-black/60 text-white px-2 py-1 rounded">
                    Cover
                  </span>
                  <button
                    type="button"
                    onClick={() => removeMediaAt(0)}
                    className="absolute right-2 top-2 bg-white/90 px-2 py-1 rounded shadow text-sm"
                    title="Remove"
                  >
                    ×
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={openCoverPicker}
                  className="w-full h-full flex flex-col items-center justify-center text-gray-600 hover:text-black"
                >
                  <div className="text-5xl leading-none">+</div>
                  <div className="text-sm mt-1">Thêm ảnh đại diện</div>
                </button>
              )}

              <input
                ref={coverFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onCoverPicked}
              />
            </div>
            {getErr("media.0.url") && (
              <p className="text-sm text-red-600">{getErr("media.0.url")}</p>
            )}

            {/* HÀNG THUMBNAIL BÊN DƯỚI (cuộn ngang) */}
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {form.media.slice(1).map((m, idx) => {
                const i = idx + 1; 
                return (
                  <div
                    key={i}
                    className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden border border-gray-200 bg-gray-50"
                  >
                    {m.url ? (
                      <>
                        <img
                          src={m.url}
                          alt={`media-${i}`}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => openSmallPicker(i)}
                          title="Click để đổi ảnh"
                        />
                        <button
                          type="button"
                          onClick={() => removeMediaAt(i)}
                          className="absolute right-1 top-1 bg-white/90 px-1.5 leading-none rounded shadow"
                          title="Remove"
                        >
                          ×
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openSmallPicker(i)}
                        className="w-full h-full flex flex-col items-center justify-center text-gray-600 hover:text-black"
                        title="Chọn ảnh"
                      >
                        <span className="text-2xl leading-none">+</span>
                        <span className="text-[11px] mt-0.5">Thêm ảnh</span>
                      </button>
                    )}

                    <input
                      ref={(el) => {
                        smallFileRefs.current[i] = el;
                      }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => onSmallPicked(e, i)}
                    />
                  </div>
                );
              })}

              {/* Ô thêm slot ở cuối hàng */}
              <button
                type="button"
                onClick={addSmallSlot}
                className="w-20 h-20 shrink-0 rounded-xl border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-gray-600 hover:text-black"
                title="Thêm khung ảnh"
              >
                <span className="text-2xl leading-none">+</span>
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            * Ảnh lớn phía trên là ảnh đại diện. Hàng bên dưới là thumbnail có thể cuộn ngang.
          </p>
        </section>
      )}
      {step === 3 && (
        <section className="space-y-4">
          <h3 className="font-semibold text-lg">Variants &amp; Inventory</h3>

          {/* Lỗi chung */}
          {getErr("variants") && <p className="text-sm text-red-600">{getErr("variants")}</p>}
          {getErr("inventory") && <p className="text-sm text-red-600">{getErr("inventory")}</p>}

          {/* Variants */}
          {form.variants.map((v, i) => {
            const totalStock = form.inventory
              .filter((inv) => inv.variant_sku === v.sku)
              .reduce((sum, inv) => sum + Number(inv.quantity || 0), 0);

            return (
              <div key={i} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-3">
                {/* SKU */}
                <div className="space-y-1">
                <label className="block text-sm font-medium">SKU</label>
                  <input
                    placeholder="SKU"
                    value={v.sku}
                    onChange={(e) => {
                      const newVar = [...form.variants];
                      newVar[i].sku = e.target.value;
                      setForm({ ...form, variants: newVar });
                    }}
                    className={`px-3 py-2 border rounded-md w-full ${getErr(`variants.${i}.sku`) ? 'border-red-500 focus:ring-red-400' : 'focus:ring-blue-500'}`}
                  />
                  {getErr(`variants.${i}.sku`) && (
                    <p className="text-xs text-red-600">{getErr(`variants.${i}.sku`)}</p>
                  )}
                </div>

                {/* Name */}
                <div className="space-y-1">
                <label className="block text-sm font-medium">Variant Name</label>
                  <input
                    placeholder="Name"
                    value={v.variant_name}
                    onChange={(e) => {
                      const newVar = [...form.variants];
                      newVar[i].variant_name = e.target.value;
                      setForm({ ...form, variants: newVar });
                    }}
                    className={`px-3 py-2 border rounded-md w-full ${getErr(`variants.${i}.variant_name`) ? 'border-red-500 focus:ring-red-400' : 'focus:ring-blue-500'}`}
                  />
                  {getErr(`variants.${i}.variant_name`) && (
                    <p className="text-xs text-red-600">{getErr(`variants.${i}.variant_name`)}</p>
                  )}
                </div>

                {/* Price */}
                <div className="space-y-1">
                <label className="block text-sm font-medium">Price</label>
                  <input
                    type="number"
                    placeholder="Price"
                    value={v.price}
                    onChange={(e) => {
                      const newVar = [...form.variants];
                      newVar[i].price = +e.target.value;
                      setForm({ ...form, variants: newVar });
                    }}
                    className={`px-3 py-2 border rounded-md w-full ${getErr(`variants.${i}.price`) ? 'border-red-500 focus:ring-red-400' : 'focus:ring-blue-500'}`}
                  />
                  {getErr(`variants.${i}.price`) && (
                    <p className="text-xs text-red-600">{getErr(`variants.${i}.price`)}</p>
                  )}
                </div>

                {/* Stock (read-only) */}
                <div>
                <label className="block text-sm font-medium">Total Stock (auto)</label>
                  <input
                    type="number"
                    placeholder="Stock"
                    value={totalStock}
                    readOnly
                    className="px-3 py-2 border rounded-md bg-gray-100 w-full"
                  />
                </div>

                {/* Barcode */}
                <div>
                <label className="block text-sm font-medium">Barcode (tuỳ chọn)</label>
                <div className="flex  items-center gap-2">
                  <input
                    placeholder="Barcode"
                    value={v.barcode || ''}
                    onChange={(e) => {
                      const newVar = [...form.variants];
                      newVar[i].barcode = e.target.value;
                      setForm({ ...form, variants: newVar });
                    }}
                    className="px-3 py-2 border rounded-md w-full"
                  />
                  <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            variants: prev.variants.filter((_, idx) => idx !== i),
                          }))
                        }
                        className="inline-flex items-center justify-center p-1 text-red-600 hover:text-red-700 cursor-pointer bg-transparent"
                        aria-label="Remove variant"
                        title="Remove"
                      >
                        <Trash2 size={20} />
                      </button>
                      </div>
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={addVariant}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add Variant
          </button>

          {/* Inventory */}
          {form.inventory.map((inv, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
              {/* Variant SKU */}
              <div className="space-y-1">
              <label className="block text-sm font-medium">Variant SKU</label>
                <input
                  placeholder="Variant SKU"
                  value={inv.variant_sku}
                  onChange={(e) => {
                    const newInv = [...form.inventory];
                    newInv[i].variant_sku = e.target.value;
                    setForm({ ...form, inventory: newInv });
                  }}
                  className={`px-3 py-2 border rounded-md w-full ${getErr(`inventory.${i}.variant_sku`) ? 'border-red-500 focus:ring-red-400' : 'focus:ring-blue-500'}`}
                />
                {getErr(`inventory.${i}.variant_sku`) && (
                  <p className="text-xs text-red-600">{getErr(`inventory.${i}.variant_sku`)}</p>
                )}
              </div>

              {/* Location */}
              <div className="space-y-1">
              <label className="block text-sm font-medium">Location</label>
                <input
                  placeholder="Location"
                  value={inv.location}
                  onChange={(e) => {
                    const newInv = [...form.inventory];
                    newInv[i].location = e.target.value;
                    setForm({ ...form, inventory: newInv });
                  }}
                  className={`px-3 py-2 border rounded-md w-full ${getErr(`inventory.${i}.location`) ? 'border-red-500 focus:ring-red-400' : 'focus:ring-blue-500'}`}
                />
                {getErr(`inventory.${i}.location`) && (
                  <p className="text-xs text-red-600">{getErr(`inventory.${i}.location`)}</p>
                )}
              </div>

              {/* Quantity */}
              <div className="space-y-1">
              <label className="block text-sm font-medium">Quantity</label>
              <div className="flex  items-center gap-2">
                <input
                  type="number"
                  placeholder="Quantity"
                  value={inv.quantity}
                  onChange={(e) => {
                    const newInv = [...form.inventory];
                    newInv[i].quantity = +e.target.value;
                    setForm({ ...form, inventory: newInv });
                  }}
                  className={`px-3 py-2 border rounded-md w-full ${getErr(`inventory.${i}.quantity`) ? 'border-red-500 focus:ring-red-400' : 'focus:ring-blue-500'}`}
                />
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      inventory: prev.inventory.filter((_, idx) => idx !== i),
                    }))
                  }
                  className="inline-flex items-center justify-center p-1 text-red-600 hover:text-red-700 cursor-pointer bg-transparent"
                  aria-label="Remove inventory row"
                  title="Remove"
                >
                  <Trash2 size={20} />
                </button>
                </div>
                {getErr(`inventory.${i}.quantity`) && (
                  <p className="text-xs text-red-600">{getErr(`inventory.${i}.quantity`)}</p>
                )}
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addInventory}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add Inventory
          </button>
        </section>
      )}
      {step === 4 && (
          <section className="space-y-4">
            <h3 className="font-semibold text-lg">Pricing Rules</h3>

            {(form.pricing_rules || []).map((pr, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-2 items-start">

                <div className="md:col-span-2 min-w-0">
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <input
                    placeholder="e.g. bulk / tier"
                    value={pr.type}
                    onChange={(e) => {
                      const newPR = [...form.pricing_rules];
                      newPR[i].type = e.target.value;
                      setForm({ ...form, pricing_rules: newPR });
                    }}
                    className={`w-full h-11 px-3 border rounded-lg focus:outline-none ${
                      getErr(`pricing_rules.${i}.type`)
                        ? 'border-red-500 focus:ring-2 focus:ring-red-400'
                        : 'border-gray-300 focus:ring-2 focus:ring-blue-500'
                    }`}
                  />
                  {getErr(`pricing_rules.${i}.type`) && (
                    <p className="mt-1 text-xs text-red-600">{getErr(`pricing_rules.${i}.type`)}</p>
                  )}
                </div>

                <div className="md:col-span-2 min-w-0">
                  <label className="block text-sm font-medium mb-1">Min Qty</label>
                  <input
                    type="number"
                    placeholder="e.g. 10"
                    value={pr.min_quantity}
                    onChange={(e) => {
                      const newPR = [...form.pricing_rules];
                      newPR[i].min_quantity = +e.target.value;
                      setForm({ ...form, pricing_rules: newPR });
                    }}
                    className={`w-full h-11 px-3 border rounded-lg focus:outline-none ${
                      getErr(`pricing_rules.${i}.min_quantity`)
                        ? 'border-red-500 focus:ring-2 focus:ring-red-400'
                        : 'border-gray-300 focus:ring-2 focus:ring-blue-500'
                    }`}
                  />
                  {getErr(`pricing_rules.${i}.min_quantity`) && (
                    <p className="mt-1 text-xs text-red-600">{getErr(`pricing_rules.${i}.min_quantity`)}</p>
                  )}
                </div>

                <div className="md:col-span-2 min-w-0">
                  <label className="block text-sm font-medium mb-1">Price</label>
                  <input
                    type="number"
                    placeholder="e.g. 99000"
                    value={pr.price}
                    onChange={(e) => {
                      const newPR = [...form.pricing_rules];
                      newPR[i].price = +e.target.value;
                      setForm({ ...form, pricing_rules: newPR });
                    }}
                    className={`w-full h-11 px-3 border rounded-lg focus:outline-none ${
                      getErr(`pricing_rules.${i}.price`)
                        ? 'border-red-500 focus:ring-2 focus:ring-red-400'
                        : 'border-gray-300 focus:ring-2 focus:ring-blue-500'
                    }`}
                  />
                  {getErr(`pricing_rules.${i}.price`) && (
                    <p className="mt-1 text-xs text-red-600">{getErr(`pricing_rules.${i}.price`)}</p>
                  )}
                </div>

                <div className="md:col-span-6 min-w-0 grid grid-cols-5 gap-x-3 items-start">
          {/* Cycle: 1/5 */}
          <div className="col-span-1 min-w-0">
            <label className="block text-sm font-medium mb-1">Cycle</label>
            <input
              placeholder="e.g. monthly"
              value={pr.cycle}
              onChange={(e) => {
                const newPR = [...form.pricing_rules];
                newPR[i].cycle = e.target.value;
                setForm({ ...form, pricing_rules: newPR });
              }}
              className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Starts: 2/5 (không có span đệm) */}
          <div className="col-span-2 min-w-0">
            <label className="block text-sm font-medium mb-1">Starts</label>
            <input
                type="date"
                value={pr.starts_at as string}
                min={todayStr}
                onChange={(e) => {
                  const value = e.target.value; 
                  const newPR = [...form.pricing_rules];
                  newPR[i] = { ...newPR[i], starts_at: value };
                  setForm({ ...form, pricing_rules: newPR });

                  // validate như trước
                  const s = dayTs(value);
                  if (!Number.isFinite(s) || s < startOfTodayTs) {
                    setFieldError(`pricing_rules.${i}.starts_at`, "Ngày bắt đầu không được trước hôm nay");
                  } else {
                    setFieldError(`pricing_rules.${i}.starts_at`);
                  }

                  const eTs = dayTs(newPR[i].ends_at);
                  if (newPR[i].ends_at) {
                    if (!Number.isFinite(eTs) || eTs < startOfTodayTs) {
                      setFieldError(`pricing_rules.${i}.ends_at`, "Ngày kết thúc không được trước hôm nay");
                    } else if (eTs < s) {
                      setFieldError(`pricing_rules.${i}.ends_at`, "Ngày kết thúc phải ≥ ngày bắt đầu");
                    } else {
                      setFieldError(`pricing_rules.${i}.ends_at`);
                    }
                  }
                }}
                className="w-full min-w-0 h-11 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            {getErr(`pricing_rules.${i}.starts_at`) && (
              <p className="text-xs text-red-600">{getErr(`pricing_rules.${i}.starts_at`)}</p>
            )}
          </div>

          {/* Ends: 2/5 + icon xoá bên ngoài input */}
          <div className="col-span-2 min-w-0">
            <label className="block text-sm font-medium mb-1">Ends</label>
            <div className="flex items-center gap-2">
              <input
                  type="date"
                  value={pr.ends_at as string}
                  min={(pr.starts_at as string) || todayStr}
                  onChange={(e) => {
                    const value = e.target.value;
                    const newPR = [...form.pricing_rules];
                    newPR[i] = { ...newPR[i], ends_at: value };
                    setForm({ ...form, pricing_rules: newPR });

                    const s = dayTs(newPR[i].starts_at);
                    const eTs = dayTs(value);
                    if (!Number.isFinite(eTs) || eTs < startOfTodayTs) {
                      setFieldError(`pricing_rules.${i}.ends_at`, "Ngày kết thúc không được trước hôm nay");
                    } else if (Number.isFinite(s) && eTs < s) {
                      setFieldError(`pricing_rules.${i}.ends_at`, "Ngày kết thúc phải ≥ ngày bắt đầu");
                    } else {
                      setFieldError(`pricing_rules.${i}.ends_at`);
                    }
                  }}
                  className={`w-full min-w-0 h-11 px-3 border rounded-lg focus:outline-none ${
                    getErr(`pricing_rules.${i}.ends_at`)
                      ? 'border-red-500 focus:ring-2 focus:ring-red-400'
                      : 'border-gray-300 focus:ring-2 focus:ring-blue-500'
                  }`}
                />
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    pricing_rules: prev.pricing_rules.filter((_, idx) => idx !== i),
                  }))
                }
                className="shrink-0 inline-flex items-center justify-center p-1 text-red-600 hover:text-red-700"
                title="Remove"
                aria-label="Remove pricing rule"
              >
                <Trash2 size={20} />
              </button>
            </div>
            {getErr(`pricing_rules.${i}.ends_at`) && (
              <p className="text-xs text-red-600">{getErr(`pricing_rules.${i}.ends_at`)}</p>
            )}
          </div>
        </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addPricingRule}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Pricing Rule
            </button>
          </section>
        )}


      {step === 5 && (
        <section className="space-y-6">
          <h3 className="font-semibold text-lg">Review &amp; Confirm</h3>

          {/* Quick edit pills */}
          <div className="flex flex-wrap gap-2 text-sm">
            <button type="button" onClick={() => setStep(1)} className="px-3 py-1 rounded border hover:bg-gray-50">Edit Step 1</button>
            <button type="button" onClick={() => setStep(2)} className="px-3 py-1 rounded border hover:bg-gray-50">Edit Step 2</button>
            <button type="button" onClick={() => setStep(3)} className="px-3 py-1 rounded border hover:bg-gray-50">Edit Step 3</button>
            <button type="button" onClick={() => setStep(4)} className="px-3 py-1 rounded border hover:bg-gray-50">Edit Step 4</button>
          </div>

          {/* Summary top: Product & Media */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold">Product Info</h4>
              <div className="text-sm space-y-1">
                <div><span className="font-medium">Name:</span> {form.name || "—"}</div>
                <div><span className="font-medium">Base price:</span> {Number(form.base_price) || 0}</div>
                <div><span className="font-medium">Brand:</span> {(brands.find((b) => b.id === form.brandId) || {}).name || "—"}</div>
                <div><span className="font-medium">Categories:</span> {(categories.filter((c) => (form.categories || []).includes(c.id)).map((c) => c.name).join(", ")) || "—"}</div>
              </div>
              <div>
                <h5 className="font-semibold">Short Description</h5>
                <p className="text-sm whitespace-pre-wrap text-gray-800">{form.short_description || "—"}</p>
              </div>
              <div>
                <h5 className="font-semibold">Description</h5>
                <p className="text-sm whitespace-pre-wrap text-gray-800">{form.description || "—"}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Media</h4>

              {/* Cover lớn giống Step 2 nhưng đọc-only */}
              <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50 h-64 w-64">
                {form.media?.[0]?.url ? (
                  <img
                    src={form.media[0].url}
                    alt="cover"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    No cover
                  </div>
                )}
              </div>

              {/* Hàng thumbnail bên dưới */}
              <div className="flex items-center gap-2 overflow-x-auto">
                {(form.media || [])
                  .slice(1)
                  .filter((m) => m?.url)
                  .map((m, i) => (
                    <img
                      key={i}
                      src={m.url}
                      alt={`m-${i}`}
                      className="w-16 h-16 shrink-0 rounded-xl border border-gray-200 object-cover"
                    />
                  ))}

                {!((form.media || []).slice(1).filter((m) => m?.url).length) && (
                  <span className="text-sm text-gray-400">No extra images</span>
                )}
              </div>
            </div>
          </div>

          {/* Variants */}
          <div>
            <h4 className="font-semibold mb-2">Variants</h4>
            {(form.variants || []).length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 border">SKU</th>
                      <th className="p-2 border">Name</th>
                      <th className="p-2 border">Price</th>
                      <th className="p-2 border">Stock</th>
                      <th className="p-2 border">Barcode</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(form.variants || []).map((v, i) => {
                      const stock = (form.inventory || [])
                        .filter((inv) => inv.variant_sku === v.sku)
                        .reduce((s, inv) => s + Number(inv.quantity || 0), 0);
                      return (
                        <tr key={i}>
                          <td className="p-2 border">{v.sku || "—"}</td>
                          <td className="p-2 border">{v.variant_name || "—"}</td>
                          <td className="p-2 border">{Number(v.price) || 0}</td>
                          <td className="p-2 border">{stock}</td>
                          <td className="p-2 border">{v.barcode || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No variants added.</p>
            )}
          </div>

          {/* Inventory */}
          <div>
            <h4 className="font-semibold mb-2">Inventory</h4>
            {(form.inventory || []).length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 border">Variant SKU</th>
                      <th className="p-2 border">Location</th>
                      <th className="p-2 border">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(form.inventory || []).map((inv, i) => (
                      <tr key={i}>
                        <td className="p-2 border">{inv.variant_sku || "—"}</td>
                        <td className="p-2 border">{inv.location || "—"}</td>
                        <td className="p-2 border">{Number(inv.quantity) || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No inventory rows.</p>
            )}
          </div>

          {/* Pricing Rules */}
          <div>
            <h4 className="font-semibold mb-2">Pricing Rules</h4>
            {(form.pricing_rules || []).length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 border">Type</th>
                      <th className="p-2 border">Min Qty</th>
                      <th className="p-2 border">Price</th>
                      <th className="p-2 border">Cycle</th>
                      <th className="p-2 border">Starts</th>
                      <th className="p-2 border">Ends</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(form.pricing_rules || []).map((pr, i) => (
                      <tr key={i}>
                        <td className="p-2 border">{pr.type || "—"}</td>
                        <td className="p-2 border">{Number(pr.min_quantity) || 0}</td>
                        <td className="p-2 border">{Number(pr.price) || 0}</td>
                        <td className="p-2 border">{pr.cycle || "—"}</td>
                        <td className="p-2 border">{displayDate(pr.starts_at)}</td>
                        <td className="p-2 border">{displayDate(pr.ends_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No pricing rules.</p>
            )}
          </div>

          <div className="text-xs text-gray-500">
            Kiểm tra lại thông tin trước khi Publish. Bạn có thể quay lại các bước để chỉnh sửa bằng các nút "Edit Step" ở trên.
          </div>
        </section>
      )}
      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6 gap-2">
        {step > 1 && (
          <button
            type="button"
            onClick={prevStep}
            className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
          >
            Previous
          </button>
        )}
        {step < 5 && (
          <button
            type="button"
            onClick={nextStep}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Next
          </button>
        )}
        {step === 5 && (
          <div className="flex gap-2">
            <button
              type="submit"
              onClick={() => submitForm(false)}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Publish
            </button>

            <button
              type="button"
              onClick={() => submitForm(true)} // Save Draft
              className="px-6 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
            >
              Save Draft
            </button>
          </div>
        )}
      </div>
    </form>
  );
};
