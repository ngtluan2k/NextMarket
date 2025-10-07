import React, { useEffect, useRef, useState, useMemo } from "react";
import { Trash2 } from "lucide-react";
import { validateProduct, mapErrors, firstErrorStep } from "../../../validation/productValidator";

type Brand = { id: number; name: string };
type Category = { id: number; name: string };

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

export const ProductForm: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const getErr = (path: string) => errors[path];

  const [form, setForm] = useState<ProductFormState>({
    name: "",
    short_description: "",
    description: "",
    base_price: 0,
    brandId: 0,
    categories: [],
    media: [],
    variants: [],
    inventory: [],
    pricing_rules: [],
  });

  // ───────────────────────────── Fetch brand & category ─────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");

    const load = async () => {
      try {
        const [bRes, cRes] = await Promise.all([
          fetch("http://localhost:3000/brands", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("http://localhost:3000/categories", { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const [bData, cData] = await Promise.all([bRes.json(), cRes.json()]);
        setBrands((bData.data || []).map((b: any) => ({ id: Number(b.id), name: b.name })));
        setCategories((cData.data || []).map((c: any) => ({ id: Number(c.id), name: c.name })));
      } catch (e) {
        console.error(e);
      }
    };

    load();
  }, []);

  // ───────────────────────────── Handlers ─────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "number" ? Number(value) : value }));
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
    setForm((prev) => ({ ...prev, variants: [...prev.variants, { sku: "", variant_name: "", price: 0, stock: 0 }] }));

  const addInventory = () =>
    setForm((prev) => ({
      ...prev,
      inventory: [...prev.inventory, { variant_sku: "", location: "", quantity: 0 }],
    }));

  const addPricingRule = () =>
    setForm((prev) => ({
      ...prev,
      pricing_rules: [
        ...prev.pricing_rules,
        { type: "", min_quantity: 0, price: 0, cycle: "", starts_at: "", ends_at: "" },
      ],
    }));

  // ───────────────────────────── Media pickers ─────────────────────────────
  const coverFileRef = useRef<HTMLInputElement | null>(null);
  const smallFileRefs = useRef<Array<HTMLInputElement | null>>([]);

  const openCoverPicker = () => coverFileRef.current?.click();
  const openSmallPicker = (i: number) => smallFileRefs.current[i]?.click();

  const addSmallSlot = () => {
    setForm((prev) => {
      const media = [...prev.media];
      if (media.length === 0) media.push({ media_type: "image", url: "", sort_order: 1, is_primary: true });
      media.push({ media_type: "image", url: "", sort_order: media.length + 1 });
      media.forEach((m, idx) => (m.sort_order = idx + 1));
      return { ...prev, media };
    });
  };

  const removeMediaAt = (i: number) => {
    setForm((prev) => {
      const media = prev.media.filter((_, idx) => idx !== i);
      // ensure first item is primary if exists
      if (media[0]) media[0].is_primary = true;
      media.forEach((m, idx) => (m.sort_order = idx + 1));
      return { ...prev, media };
    });
  };

  const onCoverPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setForm((prev) => {
      const media = [...prev.media];
      if (media.length === 0) media.push({ media_type: "image", url, file, sort_order: 1, is_primary: true });
      else media[0] = { ...media[0], media_type: "image", url, file, sort_order: 1, is_primary: true };
      media.forEach((m, idx) => (m.sort_order = idx + 1));
      return { ...prev, media };
    });
    e.target.value = "";
  };

  const onSmallPicked = (e: React.ChangeEvent<HTMLInputElement>, i: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setForm((prev) => {
      const media = [...prev.media];
      if (i < media.length) media[i] = { ...media[i], media_type: "image", url, file, sort_order: i + 1 };
      else media.push({ media_type: "image", url, file, sort_order: media.length + 1 });
      media.forEach((m, idx) => (m.sort_order = idx + 1));
      return { ...prev, media };
    });
    e.target.value = "";
  };

  // ───────────────────────────── Submit ─────────────────────────────
  const submitForm = async (isDraft: boolean) => {
    try {
      setErrors({});

      // 1) Merge stock from inventory into variants
      const variantsWithStock = form.variants.map((v) => {
        const totalStock = form.inventory
          .filter((inv) => inv.variant_sku === v.sku)
          .reduce((sum, inv) => sum + Number(inv.quantity || 0), 0);
        return { ...v, stock: totalStock };
      });

      const dataForValidate = { ...form, variants: variantsWithStock };

      // 2) Validate (publish strict, draft permissive)
      const result = validateProduct(dataForValidate, isDraft ? "draft" : "publish");

      if (!isDraft && !result.success) {
        const mapped = mapErrors(result.error.errors);
        setErrors(mapped);
        const keys = Object.keys(mapped);
        setStep(firstErrorStep(keys));
        return; // stop submit
      }

      // 3) Build payload
      const token = localStorage.getItem("token");
      const url = isDraft ? "http://localhost:3000/products" : "http://localhost:3000/products/publish";

      const fd = new FormData();
      fd.append("name", String(form.name || ""));
      fd.append("short_description", String(form.short_description || ""));
      fd.append("description", String(form.description || ""));
      fd.append("base_price", Number(form.base_price || 0).toString());
      fd.append("brandId", Number(form.brandId || 0).toString());
      fd.append("categories", JSON.stringify(form.categories || []));
      fd.append("variants", JSON.stringify(variantsWithStock || []));
      fd.append("inventory", JSON.stringify(form.inventory || []));
      fd.append("pricing_rules", JSON.stringify(form.pricing_rules || []));
      (form.media || []).forEach((m) => m.file && fd.append("media", m.file));

      const res = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit product");

      alert(isDraft ? "Product saved as draft!" : "Product published successfully!");
    } catch (err: any) {
      alert(err.message);
    }
  };

  // ───────────────────────────── Date helpers & inline validation ─────────────────────────────
  const toLocalISODate = (d: Date) => {
    const off = d.getTimezoneOffset();
    return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
  };
  const todayStr = toLocalISODate(new Date());

  const startOfTodayTs = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t.getTime();
  }, []);

  const dayTs = (v: any) => {
    if (!v) return NaN;
    const d = v instanceof Date ? v : new Date(v);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };

  const setFieldError = (key: string, msg?: string) =>
    setErrors((prev) => {
      const next = { ...prev };
      if (msg) next[key] = msg;
      else delete next[key];
      return next;
    });

  // ───────────────────────────── Step navigation ─────────────────────────────
  const nextStep = () => setStep((prev) => Math.min(prev + 1, 5));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  // ───────────────────────────── Self-tests (dev only, không ảnh hưởng UI) ─────────────────────────────
  useEffect(() => {
    try {
      // stock merge test
      const dummy: ProductFormState = {
        ...form,
        variants: [{ sku: "A", variant_name: "A", price: 1, stock: 0 }],
        inventory: [
          { variant_sku: "A", location: "HCM", quantity: 2 },
          { variant_sku: "A", location: "HN", quantity: 3 },
        ],
      };
      const merged = dummy.variants.map((v) => ({
        ...v,
        stock: dummy.inventory.filter((x) => x.variant_sku === v.sku).reduce((s, x) => s + x.quantity, 0),
      }));
      console.assert(merged[0].stock === 5, "Stock merge should sum to 5");
    } catch (e) {
      console.warn("Self-test warn", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayDate = (v?: string | Date) => {
    if (!v) return "—";
    if (typeof v === "string") return v || "—";
    try {
      return v.toISOString().slice(0, 10);
    } catch {
      return String(v);
    }
  };

  // ───────────────────────────── Render ─────────────────────────────
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submitForm(false); // Publish
      }}
      className="mx-auto max-w-5xl space-y-6 rounded-md bg-white p-6 shadow-md"
    >
      <h2 className="mb-6 text-center text-2xl font-bold">Create Product</h2>

      {/* Step Indicators */}
      <div className="mb-6 flex justify-between">
        {[1, 2, 3, 4, 5].map((s) => (
          <div
            key={s}
            className={`flex-1 border-b-2 py-2 text-center ${
              step === s ? "border-blue-600 font-semibold" : "border-gray-300"
            }`}
          >
            Step {s}
          </div>
        ))}
      </div>

      {/* Step 1: Product Info */}
      {step === 1 && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Product Info</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block font-medium">Product Name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {getErr("name") && <p className="mt-1 text-sm text-red-600">{getErr("name")}</p>}
            </div>

            <div>
              <label className="mb-1 block font-medium">Short Description</label>
              <input
                name="short_description"
                value={form.short_description}
                onChange={handleChange}
                className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block font-medium">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block font-medium">Base Price</label>
              <input
                type="number"
                name="base_price"
                value={form.base_price}
                onChange={handleChange}
                required
                className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {getErr("base_price") && <p className="mt-1 text-sm text-red-600">{getErr("base_price")}</p>}
            </div>

            <div>
              <label className="mb-1 block font-medium">Brand</label>
              <select
                name="brandId"
                value={form.brandId}
                onChange={(e) => setForm((prev) => ({ ...prev, brandId: Number(e.target.value) }))}
                required
                className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>-- Select Brand --</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              {getErr("brandId") && <p className="mt-1 text-sm text-red-600">{getErr("brandId")}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block font-medium">Categories</label>
              <div className="flex flex-wrap gap-3">
                {categories.map((c) => (
                  <label key={c.id} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={form.categories.includes(c.id)}
                      onChange={() => handleCategoryChange(c.id)}
                      className="h-4 w-4"
                    />
                    {c.name}
                  </label>
                ))}
              </div>
              {getErr("categories") && <p className="mt-1 text-sm text-red-600">{getErr("categories")}</p>}
            </div>
          </div>
        </section>
      )}

      {/* Step 2: Media */}
      {step === 2 && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Media</h3>

          <div className="space-y-4">
            {/* Cover */}
            <div className="relative h-80 w-80 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
              {form.media[0]?.url ? (
                <>
                  <img
                    src={form.media[0].url}
                    alt="cover"
                    className="h-full w-full cursor-pointer object-cover"
                    onClick={openCoverPicker}
                    title="Click để đổi ảnh"
                  />
                  {getErr("media.0.url") && <p className="mt-2 text-sm text-red-600">{getErr("media.0.url")}</p>}
                  <span className="absolute left-2 top-2 rounded bg-black/60 px-2 py-1 text-xs text-white">Cover</span>
                  <button
                    type="button"
                    onClick={() => removeMediaAt(0)}
                    className="absolute right-2 top-2 rounded bg-white/90 px-2 py-1 text-sm shadow"
                    title="Remove"
                  >
                    ×
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={openCoverPicker}
                  className="flex h-full w-full flex-col items-center justify-center text-gray-600 hover:text-black"
                >
                  <div className="text-5xl leading-none">+</div>
                  <div className="mt-1 text-sm">Thêm ảnh đại diện</div>
                </button>
              )}

              <input ref={coverFileRef} type="file" accept="image/*" className="hidden" onChange={onCoverPicked} />
            </div>

            {/* Thumbnails */}
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {form.media.slice(1).map((m, idx) => {
                const i = idx + 1;
                return (
                  <div
                    key={i}
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
                  >
                    {m.url ? (
                      <>
                        <img
                          src={m.url}
                          alt={`media-${i}`}
                          className="h-full w-full cursor-pointer object-cover"
                          onClick={() => openSmallPicker(i)}
                          title="Click để đổi ảnh"
                        />
                        <button
                          type="button"
                          onClick={() => removeMediaAt(i)}
                          className="absolute right-1 top-1 rounded bg-white/90 px-1.5 leading-none shadow"
                          title="Remove"
                        >
                          ×
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openSmallPicker(i)}
                        className="flex h-full w-full flex-col items-center justify-center text-gray-600 hover:text-black"
                        title="Chọn ảnh"
                      >
                        <span className="text-2xl leading-none">+</span>
                        <span className="mt-0.5 text-[11px]">Thêm ảnh</span>
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

              <button
                type="button"
                onClick={addSmallSlot}
                className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-gray-600 hover:text-black"
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

      {/* Step 3: Variants & Inventory */}
      {step === 3 && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Variants &amp; Inventory</h3>

          {getErr("variants") && <p className="text-sm text-red-600">{getErr("variants")}</p>}
          {getErr("inventory") && <p className="text-sm text-red-600">{getErr("inventory")}</p>}

          {/* Variants */}
          {form.variants.map((v, i) => {
            const totalStock = form.inventory
              .filter((inv) => inv.variant_sku === v.sku)
              .reduce((sum, inv) => sum + inv.quantity, 0);
            return (
              <div key={i} className="mb-3 grid grid-cols-1 gap-4 md:grid-cols-5">
                <div className="space-y-1">
                  <label className="block text-sm font-medium">SKU</label>
                  <input
                    placeholder="SKU"
                    value={v.sku}
                    onChange={(e) => {
                      const variants = [...form.variants];
                      variants[i].sku = e.target.value;
                      setForm({ ...form, variants });
                    }}
                    className={`w-full rounded-md border px-3 py-2 ${
                      getErr(`variants.${i}.sku`) ? "border-red-500 focus:ring-red-400" : "focus:ring-blue-500"
                    }`}
                  />
                  {getErr(`variants.${i}.sku`) && <p className="text-xs text-red-600">{getErr(`variants.${i}.sku`)}</p>}
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium">Variant Name</label>
                  <input
                    placeholder="Name"
                    value={v.variant_name}
                    onChange={(e) => {
                      const variants = [...form.variants];
                      variants[i].variant_name = e.target.value;
                      setForm({ ...form, variants });
                    }}
                    className={`w-full rounded-md border px-3 py-2 ${
                      getErr(`variants.${i}.variant_name`)
                        ? "border-red-500 focus:ring-red-400"
                        : "focus:ring-blue-500"
                    }`}
                  />
                  {getErr(`variants.${i}.variant_name`) && (
                    <p className="text-xs text-red-600">{getErr(`variants.${i}.variant_name`)}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium">Price</label>
                  <input
                    type="number"
                    placeholder="Price"
                    value={v.price}
                    onChange={(e) => {
                      const variants = [...form.variants];
                      variants[i].price = +e.target.value;
                      setForm({ ...form, variants });
                    }}
                    className={`w-full rounded-md border px-3 py-2 ${
                      getErr(`variants.${i}.price`) ? "border-red-500 focus:ring-red-400" : "focus:ring-blue-500"
                    }`}
                  />
                  {getErr(`variants.${i}.price`) && (
                    <p className="text-xs text-red-600">{getErr(`variants.${i}.price`)}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium">Total Stock (auto)</label>
                  <input
                    type="number"
                    placeholder="Stock"
                    value={totalStock}
                    readOnly
                    className="w-full rounded-md border bg-gray-100 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">Barcode (tuỳ chọn)</label>
                  <div className="flex items-center gap-2">
                    <input
                      placeholder="Barcode"
                      value={v.barcode || ""}
                      onChange={(e) => {
                        const variants = [...form.variants];
                        variants[i].barcode = e.target.value;
                        setForm({ ...form, variants });
                      }}
                      className="w-full rounded-md border px-3 py-2"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({ ...prev, variants: prev.variants.filter((_, idx) => idx !== i) }))
                      }
                      className="inline-flex cursor-pointer items-center justify-center bg-transparent p-1 text-red-600 hover:text-red-700"
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
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Add Variant
          </button>

          {/* Inventory */}
          {form.inventory.map((inv, i) => (
            <div key={i} className="mb-3 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <label className="block text-sm font-medium">Variant SKU</label>
                <input
                  placeholder="Variant SKU"
                  value={inv.variant_sku}
                  onChange={(e) => {
                    const inventory = [...form.inventory];
                    inventory[i].variant_sku = e.target.value;
                    setForm({ ...form, inventory });
                  }}
                  className={`w-full rounded-md border px-3 py-2 ${
                    getErr(`inventory.${i}.variant_sku`)
                      ? "border-red-500 focus:ring-red-400"
                      : "focus:ring-blue-500"
                  }`}
                />
                {getErr(`inventory.${i}.variant_sku`) && (
                  <p className="text-xs text-red-600">{getErr(`inventory.${i}.variant_sku`)}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium">Location</label>
                <input
                  placeholder="Location"
                  value={inv.location}
                  onChange={(e) => {
                    const inventory = [...form.inventory];
                    inventory[i].location = e.target.value;
                    setForm({ ...form, inventory });
                  }}
                  className={`w-full rounded-md border px-3 py-2 ${
                    getErr(`inventory.${i}.location`) ? "border-red-500 focus:ring-red-400" : "focus:ring-blue-500"
                  }`}
                />
                {getErr(`inventory.${i}.location`) && (
                  <p className="text-xs text-red-600">{getErr(`inventory.${i}.location`)}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium">Quantity</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={inv.quantity}
                    onChange={(e) => {
                      const inventory = [...form.inventory];
                      inventory[i].quantity = +e.target.value;
                      setForm({ ...form, inventory });
                    }}
                    className={`w-full rounded-md border px-3 py-2 ${
                      getErr(`inventory.${i}.quantity`)
                        ? "border-red-500 focus:ring-red-400"
                        : "focus:ring-blue-500"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, inventory: prev.inventory.filter((_, idx) => idx !== i) }))
                    }
                    className="inline-flex cursor-pointer items-center justify-center bg-transparent p-1 text-red-600 hover:text-red-700"
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
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Add Inventory
          </button>
        </section>
      )}

        {step === 4 && (
          <section className="space-y-4">
            <h3 className="font-semibold text-lg">Pricing Rules</h3>

            {(form.pricing_rules || []).map((pr, i) => (
              <div
                key={i}
                className="grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-2 items-start"
              >
                {/* Type */}
                <div className="md:col-span-2 min-w-0">
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <input
                    placeholder="e.g. bulk / tier"
                    value={pr.type}
                    onChange={(e) => {
                      const newPR = [...form.pricing_rules];
                      newPR[i] = { ...newPR[i], type: e.target.value };
                      setForm({ ...form, pricing_rules: newPR });
                    }}
                    className={`w-full h-11 px-3 border rounded-lg focus:outline-none ${
                      getErr(`pricing_rules.${i}.type`)
                        ? 'border-red-500 focus:ring-2 focus:ring-red-400'
                        : 'border-gray-300 focus:ring-2 focus:ring-blue-500'
                    }`}
                  />
                  {getErr(`pricing_rules.${i}.type`) && (
                    <p className="mt-1 text-xs text-red-600">
                      {getErr(`pricing_rules.${i}.type`)}
                    </p>
                  )}
                </div>

                {/* Min Qty */}
                <div className="md:col-span-2 min-w-0">
                  <label className="block text-sm font-medium mb-1">Min Qty</label>
                  <input
                    type="number"
                    placeholder="e.g. 10"
                    value={pr.min_quantity}
                    onChange={(e) => {
                      const newPR = [...form.pricing_rules];
                      newPR[i] = { ...newPR[i], min_quantity: +e.target.value };
                      setForm({ ...form, pricing_rules: newPR });
                    }}
                    className={`w-full h-11 px-3 border rounded-lg focus:outline-none ${
                      getErr(`pricing_rules.${i}.min_quantity`)
                        ? 'border-red-500 focus:ring-2 focus:ring-red-400'
                        : 'border-gray-300 focus:ring-2 focus:ring-blue-500'
                    }`}
                  />
                  {getErr(`pricing_rules.${i}.min_quantity`) && (
                    <p className="mt-1 text-xs text-red-600">
                      {getErr(`pricing_rules.${i}.min_quantity`)}
                    </p>
                  )}
                </div>

                {/* Price */}
                <div className="md:col-span-2 min-w-0">
                  <label className="block text-sm font-medium mb-1">Price</label>
                  <input
                    type="number"
                    placeholder="e.g. 99000"
                    value={pr.price}
                    onChange={(e) => {
                      const newPR = [...form.pricing_rules];
                      newPR[i] = { ...newPR[i], price: +e.target.value };
                      setForm({ ...form, pricing_rules: newPR });
                    }}
                    className={`w-full h-11 px-3 border rounded-lg focus:outline-none ${
                      getErr(`pricing_rules.${i}.price`)
                        ? 'border-red-500 focus:ring-2 focus:ring-red-400'
                        : 'border-gray-300 focus:ring-2 focus:ring-blue-500'
                    }`}
                  />
                  {getErr(`pricing_rules.${i}.price`) && (
                    <p className="mt-1 text-xs text-red-600">
                      {getErr(`pricing_rules.${i}.price`)}
                    </p>
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
                        const value = e.target.value; // "YYYY-MM-DD"
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

      {/* Step 5: Review */}
      {step === 5 && (
        <section className="space-y-6">
          <h3 className="text-lg font-semibold">Review &amp; Confirm</h3>

          <div className="flex flex-wrap gap-2 text-sm">
            <button type="button" onClick={() => setStep(1)} className="rounded border px-3 py-1 hover:bg-gray-50">
              Edit Step 1
            </button>
            <button type="button" onClick={() => setStep(2)} className="rounded border px-3 py-1 hover:bg-gray-50">
              Edit Step 2
            </button>
            <button type="button" onClick={() => setStep(3)} className="rounded border px-3 py-1 hover:bg-gray-50">
              Edit Step 3
            </button>
            <button type="button" onClick={() => setStep(4)} className="rounded border px-3 py-1 hover:bg-gray-50">
              Edit Step 4
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-semibold">Product Info</h4>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="font-medium">Name:</span> {form.name || "—"}
                </div>
                <div>
                  <span className="font-medium">Base price:</span> {Number(form.base_price) || 0}
                </div>
                <div>
                  <span className="font-medium">Brand:</span>{" "}
                  {(brands.find((b) => b.id === form.brandId) || {}).name || "—"}
                </div>
                <div>
                  <span className="font-medium">Categories:</span>{" "}
                  {categories
                    .filter((c) => (form.categories || []).includes(c.id))
                    .map((c) => c.name)
                    .join(", ") || "—"}
                </div>
              </div>

              <div>
                <h5 className="font-semibold">Short Description</h5>
                <p className="whitespace-pre-wrap text-sm text-gray-800">{form.short_description || "—"}</p>
              </div>
              <div>
                <h5 className="font-semibold">Description</h5>
                <p className="whitespace-pre-wrap text-sm text-gray-800">{form.description || "—"}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Media</h4>
              <div className="h-64 w-64 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                {form.media?.[0]?.url ? (
                  <img src={form.media[0].url} alt="cover" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">No cover</div>
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
                      className="h-16 w-16 shrink-0 rounded-xl border border-gray-200 object-cover"
                    />
                  ))}
                {!((form.media || []).slice(1).filter((m) => m?.url).length) && (
                  <span className="text-sm text-gray-400">No extra images</span>
                )}
              </div>
            </div>
          </div>

          <div>
            <h4 className="mb-2 font-semibold">Variants</h4>
            {(form.variants || []).length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border p-2">SKU</th>
                      <th className="border p-2">Name</th>
                      <th className="border p-2">Price</th>
                      <th className="border p-2">Stock</th>
                      <th className="border p-2">Barcode</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(form.variants || []).map((v, i) => {
                      const stock = (form.inventory || [])
                        .filter((inv) => inv.variant_sku === v.sku)
                        .reduce((s, inv) => s + Number(inv.quantity || 0), 0);
                      return (
                        <tr key={i}>
                          <td className="border p-2">{v.sku || "—"}</td>
                          <td className="border p-2">{v.variant_name || "—"}</td>
                          <td className="border p-2">{Number(v.price) || 0}</td>
                          <td className="border p-2">{stock}</td>
                          <td className="border p-2">{v.barcode || "—"}</td>
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
            <h4 className="mb-2 font-semibold">Inventory</h4>
            {(form.inventory || []).length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border p-2">Variant SKU</th>
                      <th className="border p-2">Location</th>
                      <th className="border p-2">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(form.inventory || []).map((inv, i) => (
                      <tr key={i}>
                        <td className="border p-2">{inv.variant_sku || "—"}</td>
                        <td className="border p-2">{inv.location || "—"}</td>
                        <td className="border p-2">{Number(inv.quantity) || 0}</td>
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
            <h4 className="mb-2 font-semibold">Pricing Rules</h4>
            {(form.pricing_rules || []).length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border p-2">Type</th>
                      <th className="border p-2">Min Qty</th>
                      <th className="border p-2">Price</th>
                      <th className="border p-2">Cycle</th>
                      <th className="border p-2">Starts</th>
                      <th className="border p-2">Ends</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(form.pricing_rules || []).map((pr, i) => (
                      <tr key={i}>
                        <td className="border p-2">{pr.type || "—"}</td>
                        <td className="border p-2">{Number(pr.min_quantity) || 0}</td>
                        <td className="border p-2">{Number(pr.price) || 0}</td>
                        <td className="border p-2">{pr.cycle || "—"}</td>
                        <td className="border p-2">{displayDate(pr.starts_at)}</td>
                        <td className="border p-2">{displayDate(pr.ends_at)}</td>
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
            Kiểm tra lại thông tin trước khi Publish. Bạn có thể quay lại các bước để chỉnh sửa bằng các nút "Edit Step"
            ở trên.
          </div>
        </section>
      )}

      {/* Navigation Buttons */}
      <div className="mt-6 flex justify-between gap-2">
        {step > 1 && (
          <button type="button" onClick={prevStep} className="rounded-md bg-gray-300 px-4 py-2 hover:bg-gray-400">
            Previous
          </button>
        )}
        {step < 5 && (
          <button type="button" onClick={nextStep} className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
            Next
          </button>
        )}
        {step === 4 && (
          <div className="flex gap-2">
            {/* Chỉ submit qua onSubmit để tránh double submit */}
            <button type="submit" className="rounded-md bg-green-600 px-6 py-2 text-white hover:bg-green-700">
              Publish
            </button>
            <button
              type="button"
              onClick={() => submitForm(true)} // Save Draft
              className="rounded-md bg-yellow-500 px-6 py-2 text-white hover:bg-yellow-600"
            >
              Save Draft
            </button>
          </div>
        )}
      </div>
    </form>
  );
};
