import React, { useState, useEffect, useRef } from 'react';
import { validateProduct, mapErrors, firstErrorStep } from "../../../validation/productValidator";
import { Trash2 } from 'lucide-react';

export const ProductForm: React.FC = () => {
  const [brands, setBrands] = useState<{ id: number; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
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
    brandId: 4,
    categories: [],
    media: [],
    variants: [],
    inventory: [],
    pricing_rules: [],
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('http://localhost:3000/brands', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) =>
        setBrands((data.data || []).map((b: any) => ({ id: Number(b.id), name: b.name })))
      );
    fetch('http://localhost:3000/categories', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) =>
        setCategories((data.data || []).map((c: any) => ({ id: Number(c.id), name: c.name })))
      );
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
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

  const addVariant = () =>
    setForm((prev) => ({
      ...prev,
      variants: [...prev.variants, { sku: '', variant_name: '', price: 0, stock: 0 }],
    }));

  const addInventory = () =>
    setForm((prev) => ({
      ...prev,
      inventory: [
        ...prev.inventory,
        { variant_sku: '', variant_id: undefined, product_id: undefined, location: '', quantity: 0 },
      ],
    }));

  const addPricingRule = () =>
    setForm((prev) => ({
      ...prev,
      pricing_rules: [
        ...prev.pricing_rules,
        { type: '', min_quantity: 0, price: 0, cycle: '', starts_at: '', ends_at: '', variant_sku: '', name: '', status: 'active' },
      ],
    }));

  // ====== Media helpers: 1 input multiple + cờ thay cover ======
  const multiFileRef = useRef<HTMLInputElement | null>(null);
  const replaceCoverAfterPickRef = useRef(false);

  const openMultiPickerAppend = () => {
    replaceCoverAfterPickRef.current = false;
    multiFileRef.current?.click();
  };

  const openMultiPickerReplaceCover = () => {
    replaceCoverAfterPickRef.current = true;
    multiFileRef.current?.click();
  };

  const reindexSort = (arr: ProductFormState['media']) =>
    arr.map((m, idx) => ({ ...m, sort_order: idx + 1 }));

  const onMultiPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setForm((prev) => {
      let media = [...prev.media];

      if (replaceCoverAfterPickRef.current) {
        // Click từ ô to: file đầu làm/thay cover, các file còn lại append
        const [first, ...rest] = files;
        if (first) {
          const firstUrl = URL.createObjectURL(first);
          if (media.length === 0) {
            media.push({ media_type: 'image', url: firstUrl, file: first, sort_order: 1 });
          } else {
            media[0] = { ...media[0], media_type: 'image', url: firstUrl, file: first, sort_order: 1 };
          }
        }
        rest.forEach((f) => {
          media.push({ media_type: 'image', url: URL.createObjectURL(f), file: f, sort_order: media.length + 1 });
        });
      } else {
        // Click từ ô "+" nhỏ: chỉ append; nếu chưa có cover thì file đầu làm cover
        files.forEach((file, idx) => {
          const url = URL.createObjectURL(file);
          if (media.length === 0 && idx === 0) {
            media.push({ media_type: 'image', url, file, sort_order: 1 });
          } else {
            media.push({ media_type: 'image', url, file, sort_order: media.length + 1 });
          }
        });
      }

      replaceCoverAfterPickRef.current = false;
      return { ...prev, media: reindexSort(media) };
    });

    e.target.value = '';
  };

  const setAsCover = (i: number) => {
    if (i === 0) return;
    setForm((prev) => {
      const media = [...prev.media];
      const [picked] = media.splice(i, 1);
      media.unshift(picked);
      return { ...prev, media: reindexSort(media) };
    });
  };

  const removeMediaAt = (i: number) => {
    setForm((prev) => {
      const media = prev.media.filter((_, idx) => idx !== i);
      return { ...prev, media: reindexSort(media) };
    });
  };

  const submitForm = async (isDraft: boolean) => {
    try {
      setErrors({});

      const variantsWithStock = form.variants.map((v) => {
        const totalStock = form.inventory
          .filter((inv) => inv.variant_sku === v.sku)
          .reduce((sum, inv) => sum + Number(inv.quantity || 0), 0);
        return { ...v, stock: totalStock };
      });

      const dataForValidate = { ...form, variants: variantsWithStock };
      const result = validateProduct(dataForValidate, isDraft ? 'draft' : 'publish');

      if (!isDraft && !result.success) {
        const mapped = mapErrors(result.error.errors);
        setErrors(mapped);
        const keys = Object.keys(mapped);
        setStep(firstErrorStep(keys));
        return;
      }

      const token = localStorage.getItem('token');
      const url = isDraft ? 'http://localhost:3000/products' : 'http://localhost:3000/products/publish';

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

      const res = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit product');

      alert(isDraft ? 'Product saved as draft!' : 'Product published successfully!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Step navigation
  const nextStep = () => setStep((prev) => Math.min(prev + 1, 5));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const displayDate = (v?: string | Date) => {
    if (!v) return '—';
    try {
      const d = typeof v === 'string' ? new Date(v) : v;
      if (Number.isNaN(d.getTime())) return String(v);
      return d.toISOString().slice(0, 10);
    } catch {
      return String(v);
    }
  };

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submitForm(false);
      }}
    >
      <h2 className="text-2xl font-bold text-center mb-6">Create Product</h2>

      {/* Step Indicators */}
      <div className="flex justify-between mb-6">
        {[1, 2, 3, 4, 5].map((s) => (
          <div
            key={s}
            className={`flex-1 text-center py-2 border-b-2 ${step === s ? 'border-blue-600 font-semibold' : 'border-gray-300'}`}
          >
            Step {s}
          </div>
        ))}
      </div>

      {/* Step 1 */}
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
              {getErr('name') && <p className="text-sm text-red-600 mt-1">{getErr('name')}</p>}
            </div>
            <div>
              <label className="block font-medium mb-1">Short Description</label>
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
              {getErr('base_price') && <p className="text-sm text-red-600 mt-1">{getErr('base_price')}</p>}
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
              {getErr('brandId') && <p className="text-sm text-red-600 mt-1">{getErr('brandId')}</p>}
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
              {getErr('categories') && <p className="text-sm text-red-600 mt-1">{getErr('categories')}</p>}
            </div>
          </div>
        </section>
      )}

      {/* Step 2: Media */}
      {step === 2 && (
        <section className="space-y-4">
          <h3 className="font-semibold text-lg">Media</h3>

          {/* Ô to (cover) – click chọn N ảnh; ảnh đầu sẽ làm/thay cover */}
          <div className="space-y-2">
            <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50 h-80 w-80">
              {form.media[0]?.url ? (
                <>
                  <img
                    src={form.media[0].url}
                    alt="cover"
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={openMultiPickerReplaceCover}
                    title="Chọn nhiều ảnh; ảnh đầu sẽ thay cover, các ảnh còn lại sẽ thêm vào"
                  />
                  <span className="absolute left-2 top-2 text-xs bg-black/60 text-white px-2 py-1 rounded">Cover</span>
                  <button
                    type="button"
                    onClick={() => removeMediaAt(0)}
                    className="absolute right-2 top-2 bg-white/90 px-2 py-1 rounded shadow text-sm"
                    title="Remove cover"
                  >
                    ×
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={openMultiPickerReplaceCover}
                  className="w-full h-full flex flex-col items-center justify-center text-gray-600 hover:text-black"
                  title="Chọn nhiều ảnh; ảnh đầu sẽ làm cover"
                >
                  <div className="text-5xl leading-none">+</div>
                  <div className="text-sm mt-1">Thêm ảnh đại diện</div>
                </button>
              )}
            </div>

            {getErr('media.0.url') && <p className="text-sm text-red-600">{getErr('media.0.url')}</p>}
          </div>

          {/* Thumbnails (click để đặt làm cover) + ô “+” để append ảnh */}
          <div className="flex items-center gap-3 overflow-x-auto pb-1">
            {form.media.slice(1).map((m, idx) => {
              const i = idx + 1;
              return (
                <div
                  key={i}
                  className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden border border-gray-200 bg-gray-50"
                  title="Click để đặt làm ảnh đại diện"
                >
                  {m.url && (
                    <>
                      <img
                        src={m.url}
                        alt={`media-${i}`}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setAsCover(i)}
                      />
                      <button
                        type="button"
                        onClick={() => removeMediaAt(i)}
                        className="absolute right-1 top-1 bg-white/90 p-1 rounded shadow"
                        title="Xoá ảnh"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </>
                  )}
                </div>
              );
            })}

            {/* Ô '+' để thêm nhiều ảnh (append) */}
            <button
              type="button"
              onClick={openMultiPickerAppend}
              className="w-20 h-20 shrink-0 rounded-xl border-2 border-dashed border-gray-300 hover:border-gray-400
                         bg-white flex items-center justify-center text-gray-500 hover:text-black"
              title="Thêm ảnh"
            >
              <span className="text-2xl leading-none">+</span>
            </button>

            {/* input ẩn duy nhất phục vụ cả 2 luồng */}
            <input
              ref={multiFileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={onMultiPicked}
            />
          </div>

          <p className="text-xs text-gray-500">
            * Click ô to để chọn nhiều ảnh. Ảnh đầu làm/thay cover; ảnh còn lại sẽ thêm vào. Ô “+” chỉ thêm ảnh (không thay cover).
          </p>
        </section>
      )}

      {/* Step 3: Variants & Inventory */}
      {step === 3 && (
        <section className="space-y-4">
          <h3 className="font-semibold text-lg">Variants &amp; Inventory</h3>

          {getErr('variants') && <p className="text-sm text-red-600">{getErr('variants')}</p>}
          {getErr('inventory') && <p className="text-sm text-red-600">{getErr('inventory')}</p>}

          {/* Variants */}
          {form.variants.map((v, i) => {
            const totalStock = form.inventory
              .filter((inv) => inv.variant_sku === v.sku)
              .reduce((sum, inv) => sum + Number(inv.quantity || 0), 0);

            return (
              <div key={i} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-3">
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
                  {getErr(`variants.${i}.sku`) && <p className="text-xs text-red-600">{getErr(`variants.${i}.sku`)}</p>}
                </div>

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
                  {getErr(`variants.${i}.variant_name`) && <p className="text-xs text-red-600">{getErr(`variants.${i}.variant_name`)}</p>}
                </div>

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
                  {getErr(`variants.${i}.price`) && <p className="text-xs text-red-600">{getErr(`variants.${i}.price`)}</p>}
                </div>

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

          <button type="button" onClick={addVariant} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Add Variant
          </button>

          {/* Inventory */}
          {form.inventory.map((inv, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
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
                {getErr(`inventory.${i}.variant_sku`) && <p className="text-xs text-red-600">{getErr(`inventory.${i}.variant_sku`)}</p>}
              </div>

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
                {getErr(`inventory.${i}.location`) && <p className="text-xs text-red-600">{getErr(`inventory.${i}.location`)}</p>}
              </div>

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
                {getErr(`inventory.${i}.quantity`) && <p className="text-xs text-red-600">{getErr(`inventory.${i}.quantity`)}</p>}
              </div>
            </div>
          ))}

          <button type="button" onClick={addInventory} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Add Inventory
          </button>
        </section>
      )}

      {/* Step 4: Pricing Rules */}
      {step === 4 && (
        <section className="space-y-5 md:space-y-6 max-w-[1200px] mx-auto">
          <h3 className="font-semibold text-lg">Pricing Rules</h3>

          {(form.pricing_rules || []).map((pr, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-4 md:p-5">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-start">
                <div className="md:col-span-2 min-w-0">
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <input
                    placeholder="e.g. bulk / tier"
                    value={pr.type}
                    onChange={(e) => {
                      const next = [...form.pricing_rules];
                      next[i].type = e.target.value;
                      setForm({ ...form, pricing_rules: next });
                    }}
                    className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2 min-w-0">
                  <label className="block text-sm font-medium mb-1">Min Qty</label>
                  <input
                    type="number"
                    placeholder="e.g. 10"
                    value={pr.min_quantity}
                    onChange={(e) => {
                      const next = [...form.pricing_rules];
                      next[i].min_quantity = +e.target.value;
                      setForm({ ...form, pricing_rules: next });
                    }}
                    className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2 min-w-0">
                  <label className="block text-sm font-medium mb-1">Price</label>
                  <input
                    type="number"
                    placeholder="e.g. 99000"
                    value={pr.price}
                    onChange={(e) => {
                      const next = [...form.pricing_rules];
                      next[i].price = +e.target.value;
                      setForm({ ...form, pricing_rules: next });
                    }}
                    className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2 min-w-0">
                  <label className="block text-sm font-medium mb-1">Cycle</label>
                  <input
                    placeholder="e.g. monthly"
                    value={pr.cycle || ''}
                    onChange={(e) => {
                      const next = [...form.pricing_rules];
                      next[i].cycle = e.target.value;
                      setForm({ ...form, pricing_rules: next });
                    }}
                    className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2 min-w-0">
                  <label className="block text-sm font-medium mb-1">Starts</label>
                  <input
                    type="date"
                    value={(pr.starts_at as string) || ''}
                    onChange={(e) => {
                      const next = [...form.pricing_rules];
                      next[i].starts_at = e.target.value;
                      setForm({ ...form, pricing_rules: next });
                    }}
                    className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2 min-w-0">
                  <label className="block text-sm font-medium mb-1">Ends</label>
                  <input
                    type="date"
                    value={(pr.ends_at as string) || ''}
                    onChange={(e) => {
                      const next = [...form.pricing_rules];
                      next[i].ends_at = e.target.value;
                      setForm({ ...form, pricing_rules: next });
                    }}
                    className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-3 min-w-0">
                  <label className="block text-sm font-medium mb-1">Variant SKU</label>
                  <input
                    placeholder="Liên kết với SKU biến thể"
                    value={pr.variant_sku || ''}
                    onChange={(e) => {
                      const next = [...form.pricing_rules];
                      next[i].variant_sku = e.target.value;
                      setForm({ ...form, pricing_rules: next });
                    }}
                    className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-4 min-w-0">
                  <label className="block text-sm font-medium mb-1">Rule Name</label>
                  <input
                    placeholder="Tên hiển thị (ví dụ: Giảm giá theo bậc)"
                    value={pr.name || ''}
                    onChange={(e) => {
                      const next = [...form.pricing_rules];
                      next[i].name = e.target.value;
                      setForm({ ...form, pricing_rules: next });
                    }}
                    className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2 min-w-0">
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={pr.status || 'active'}
                    onChange={(e) => {
                      const next = [...form.pricing_rules];
                      next[i].status = e.target.value as 'active' | 'inactive';
                      setForm({ ...form, pricing_rules: next });
                    }}
                    className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="flex justify-end self-end md:col-span-1 md:col-start-12 md:justify-self-end ">
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        pricing_rules: prev.pricing_rules.filter((_, idx) => idx !== i),
                      }))
                    }
                    className="h-11 w-11 inline-flex items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                    title="Remove rule"
                    aria-label="Remove pricing rule"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          <button type="button" onClick={addPricingRule} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Add Pricing Rule
          </button>
        </section>
      )}

      {/* Step 5: Review & Confirm */}
      {step === 5 && (
        <section className="space-y-6 max-w-[1200px] mx-auto">
          <h3 className="font-semibold text-lg">Review &amp; Confirm</h3>

          <div className="flex flex-wrap gap-2 text-sm">
            <button type="button" onClick={() => setStep(1)} className="px-3 py-1 rounded border hover:bg-gray-50">Edit Step 1</button>
            <button type="button" onClick={() => setStep(2)} className="px-3 py-1 rounded border hover:bg-gray-50">Edit Step 2</button>
            <button type="button" onClick={() => setStep(3)} className="px-3 py-1 rounded border hover:bg-gray-50">Edit Step 3</button>
            <button type="button" onClick={() => setStep(4)} className="px-3 py-1 rounded border hover:bg-gray-50">Edit Step 4</button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold">Product Info</h4>
              <div className="text-sm space-y-1">
                <div><span className="font-medium">Name:</span> {form.name || '—'}</div>
                <div><span className="font-medium">Base price:</span> {Number(form.base_price) || 0}</div>
                <div><span className="font-medium">Brand:</span> {(brands.find((b) => b.id === form.brandId) || {}).name || '—'}</div>
                <div><span className="font-medium">Categories:</span> {(categories.filter((c) => (form.categories || []).includes(c.id)).map((c) => c.name).join(', ')) || '—'}</div>
              </div>
              <div>
                <h5 className="font-semibold">Short Description</h5>
                <p className="text-sm whitespace-pre-wrap text-gray-800">{form.short_description || '—'}</p>
              </div>
              <div>
                <h5 className="font-semibold">Description</h5>
                <p className="text-sm whitespace-pre-wrap text-gray-800">{form.description || '—'}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Media</h4>
              <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50 h-64 w-64">
                {form.media?.[0]?.url ? (
                  <img src={form.media[0].url} alt="cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No cover</div>
                )}
              </div>
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
                          <td className="p-2 border">{v.sku || '—'}</td>
                          <td className="p-2 border">{v.variant_name || '—'}</td>
                          <td className="p-2 border">{Number(v.price) || 0}</td>
                          <td className="p-2 border">{stock}</td>
                          <td className="p-2 border">{v.barcode || '—'}</td>
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
                        <td className="p-2 border">{inv.variant_sku || '—'}</td>
                        <td className="p-2 border">{inv.location || '—'}</td>
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
                      <th className="p-2 border">Variant SKU</th>
                      <th className="p-2 border">Rule Name</th>
                      <th className="p-2 border">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(form.pricing_rules || []).map((r, i) => (
                      <tr key={i}>
                        <td className="p-2 border">{r.type || '—'}</td>
                        <td className="p-2 border">{Number(r.min_quantity) || 0}</td>
                        <td className="p-2 border">{Number(r.price) || 0}</td>
                        <td className="p-2 border">{r.cycle || '—'}</td>
                        <td className="p-2 border">{displayDate(r.starts_at)}</td>
                        <td className="p-2 border">{displayDate(r.ends_at)}</td>
                        <td className="p-2 border">{r.variant_sku || '—'}</td>
                        <td className="p-2 border">{r.name || '—'}</td>
                        <td className="p-2 border">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              (r.status || 'active') === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {r.status || 'active'}
                          </span>
                        </td>
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

      {/* Navigation */}
      <div className="flex justify-between mt-6 gap-2">
        {step > 1 && (
          <button type="button" onClick={prevStep} className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400">
            Previous
          </button>
        )}
        {step < 5 && (
          <button type="button" onClick={nextStep} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Next
          </button>
        )}
        {step === 5 && (
          <div className="flex gap-2">
            <button type="submit" onClick={() => submitForm(false)} className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
              Publish
            </button>
            <button type="button" onClick={() => submitForm(true)} className="px-6 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600">
              Save Draft
            </button>
          </div>
        )}
      </div>
    </form>
  );
};
