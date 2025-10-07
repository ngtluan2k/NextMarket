import React, { useState, useEffect } from 'react';

export const ProductForm: React.FC = () => {
  const [brands, setBrands] = useState<{ id: number; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>(
    []
  );
  const [step, setStep] = useState(1);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('short_description', form.short_description || '');
    formData.append('description', form.description || '');
    formData.append('base_price', form.base_price.toString());
    formData.append('brandId', form.brandId.toString());
    formData.append('categories', JSON.stringify(form.categories));
    formData.append('variants', JSON.stringify(form.variants));
    formData.append('inventory', JSON.stringify(form.inventory));
    formData.append('pricing_rules', JSON.stringify(form.pricing_rules));
    form.media.forEach((m) => m.file && formData.append('media', m.file));

    const res = await fetch('http://localhost:3000/products/publish', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create product');
    alert('Product created successfully!');
  };

  // Step navigation
  const nextStep = () => setStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-5xl mx-auto p-6 space-y-6 bg-white shadow-md rounded-md"
    >
      <h2 className="text-2xl font-bold text-center mb-6">Create Product</h2>

      {/* Step Indicators */}
      <div className="flex justify-between mb-6">
        {[1, 2, 3, 4].map((s) => (
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
            </div>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-4">
          <h3 className="font-semibold text-lg">Media</h3>
          {form.media.map((m, i) => (
            <div key={i} className="flex items-center gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, i)}
                className="flex-1"
              />
              {m.url && (
                <img
                  src={m.url}
                  className="w-20 h-20 object-cover rounded-md"
                />
              )}
              <label className="flex items-center gap-1">
                Primary
                <input
                  type="checkbox"
                  checked={m.is_primary}
                  onChange={(e) => {
                    const newMedia = [...form.media];
                    newMedia[i].is_primary = e.target.checked;
                    setForm({ ...form, media: newMedia });
                  }}
                  className="w-4 h-4"
                />
              </label>
            </div>
          ))}
          <button
            type="button"
            onClick={addMedia}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add Media
          </button>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-4">
          <h3 className="font-semibold text-lg">Variants & Inventory</h3>
          {/* Variants */}
          {form.variants.map((v, i) => {
            const totalStock = form.inventory
              .filter((inv) => inv.variant_sku === v.sku)
              .reduce((sum, inv) => sum + inv.quantity, 0);
            return (
              <div
                key={i}
                className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-2"
              >
                <input
                  placeholder="SKU"
                  value={v.sku}
                  onChange={(e) => {
                    const newVar = [...form.variants];
                    newVar[i].sku = e.target.value;
                    setForm({ ...form, variants: newVar });
                  }}
                  className="px-3 py-2 border rounded-md"
                />
                <input
                  placeholder="Name"
                  value={v.variant_name}
                  onChange={(e) => {
                    const newVar = [...form.variants];
                    newVar[i].variant_name = e.target.value;
                    setForm({ ...form, variants: newVar });
                  }}
                  className="px-3 py-2 border rounded-md"
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={v.price}
                  onChange={(e) => {
                    const newVar = [...form.variants];
                    newVar[i].price = +e.target.value;
                    setForm({ ...form, variants: newVar });
                  }}
                  className="px-3 py-2 border rounded-md"
                />
                <input
                  type="number"
                  placeholder="Stock"
                  value={totalStock}
                  readOnly
                  className="px-3 py-2 border rounded-md bg-gray-100"
                />
                <input
                  placeholder="Barcode"
                  value={v.barcode || ''}
                  onChange={(e) => {
                    const newVar = [...form.variants];
                    newVar[i].barcode = e.target.value;
                    setForm({ ...form, variants: newVar });
                  }}
                  className="px-3 py-2 border rounded-md"
                />
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
            <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
              <input
                placeholder="Variant SKU"
                value={inv.variant_sku}
                onChange={(e) => {
                  const newInv = [...form.inventory];
                  newInv[i].variant_sku = e.target.value;
                  setForm({ ...form, inventory: newInv });
                }}
                className="px-3 py-2 border rounded-md"
              />
              <input
                placeholder="Location"
                value={inv.location}
                onChange={(e) => {
                  const newInv = [...form.inventory];
                  newInv[i].location = e.target.value;
                  setForm({ ...form, inventory: newInv });
                }}
                className="px-3 py-2 border rounded-md"
              />
              <input
                type="number"
                placeholder="Quantity"
                value={inv.quantity}
                onChange={(e) => {
                  const newInv = [...form.inventory];
                  newInv[i].quantity = +e.target.value;
                  setForm({ ...form, inventory: newInv });
                }}
                className="px-3 py-2 border rounded-md"
              />
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
          {form.pricing_rules.map((pr, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-2">
              <input
                placeholder="Type"
                value={pr.type}
                onChange={(e) => {
                  const newPR = [...form.pricing_rules];
                  newPR[i].type = e.target.value;
                  setForm({ ...form, pricing_rules: newPR });
                }}
                className="px-3 py-2 border rounded-md"
              />
              <input
                type="number"
                placeholder="Min Qty"
                value={pr.min_quantity}
                onChange={(e) => {
                  const newPR = [...form.pricing_rules];
                  newPR[i].min_quantity = +e.target.value;
                  setForm({ ...form, pricing_rules: newPR });
                }}
                className="px-3 py-2 border rounded-md"
              />
              <input
                type="number"
                placeholder="Price"
                value={pr.price}
                onChange={(e) => {
                  const newPR = [...form.pricing_rules];
                  newPR[i].price = +e.target.value;
                  setForm({ ...form, pricing_rules: newPR });
                }}
                className="px-3 py-2 border rounded-md"
              />
              <input
                placeholder="Cycle"
                value={pr.cycle}
                onChange={(e) => {
                  const newPR = [...form.pricing_rules];
                  newPR[i].cycle = e.target.value;
                  setForm({ ...form, pricing_rules: newPR });
                }}
                className="px-3 py-2 border rounded-md"
              />
              <input
                type="date"
                value={pr.starts_at as string}
                onChange={(e) => {
                  const newPR = [...form.pricing_rules];
                  newPR[i].starts_at = e.target.value;
                  setForm({ ...form, pricing_rules: newPR });
                }}
                className="px-3 py-2 border rounded-md"
              />
              <input
                type="date"
                value={pr.ends_at as string}
                onChange={(e) => {
                  const newPR = [...form.pricing_rules];
                  newPR[i].ends_at = e.target.value;
                  setForm({ ...form, pricing_rules: newPR });
                }}
                className="px-3 py-2 border rounded-md"
              />
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

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        {step > 1 && (
          <button
            type="button"
            onClick={prevStep}
            className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
          >
            Previous
          </button>
        )}
        {step < 4 && (
          <button
            type="button"
            onClick={nextStep}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Next
          </button>
        )}
        {step === 4 && (
          <button
            type="submit"
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Submit
          </button>
        )}
      </div>
    </form>
  );
};
