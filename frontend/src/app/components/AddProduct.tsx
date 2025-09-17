import React, { useState, useEffect } from 'react';

export const ProductForm: React.FC = () => {
  const [brands, setBrands] = useState<{ id: number; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>(
    []
  );

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
      .then((data) => {
        const brands = (data.data || []).map(
          (b: { id: number; name: string }) => ({
            id: Number(b.id),
            name: b.name,
          })
        );
        setBrands(brands);
      });

    fetch('http://localhost:3000/categories', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const categories = (data.data || []).map(
          (c: { id: number; name: string }) => ({
            id: Number(c.id),
            name: c.name,
          })
        );
        setCategories(categories);
      });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.brandId <= 0) {
      alert('Please select a brand');
      return;
    }

    // Check duplicate SKU in variants
    const skuSet = new Set<string>();
    for (const v of form.variants) {
      if (!v.sku) {
        alert('Each variant must have a SKU');
        return;
      }
      if (skuSet.has(v.sku)) {
        alert(
          `Duplicate SKU detected: ${v.sku}. Each variant must have a unique SKU.`
        );
        return;
      }
      skuSet.add(v.sku);
    }

    // Validate inventory variant_sku
    for (const inv of form.inventory) {
      if (!inv.variant_sku) {
        alert('Each inventory entry must have a Variant SKU.');
        return;
      }
      if (!form.variants.some((v) => v.sku === inv.variant_sku)) {
        alert(
          `Inventory SKU "${inv.variant_sku}" does not match any variant SKU.`
        );
        return;
      }
    }

    // Compute stock from inventory
    const updatedVariants = form.variants.map((v) => {
      const totalInventory = form.inventory
        .filter((inv) => inv.variant_sku === v.sku)
        .reduce((sum, inv) => sum + inv.quantity, 0);
      return { ...v, stock: totalInventory };
    });

    // Check inventory vs variant stock (just in case)
    for (const v of updatedVariants) {
      const totalInventory = form.inventory
        .filter((inv) => inv.variant_sku === v.sku)
        .reduce((sum, inv) => sum + inv.quantity, 0);
      if (totalInventory > v.stock) {
        alert(`Inventory exceeds stock for SKU ${v.sku}`);
        return;
      }
    }

    const token = localStorage.getItem('token');

   // trước khi gửi lên server
const payload = {
  name: form.name,
  short_description: form.short_description || undefined,
  description: form.description || undefined,
  base_price: form.base_price,
  brandId: Number(form.brandId),
  categories: form.categories.length ? form.categories.map(Number) : undefined,
  media: form.media.length ? form.media.map(m => ({ ...m, url: m.url.slice(0, 255) })) : undefined, // truncate URL
  variants: updatedVariants.length ? updatedVariants : undefined,
  inventory: form.inventory.length
    ? form.inventory.map(inv => ({
        variant_sku: inv.variant_sku,
        location: inv.location,
        quantity: inv.quantity,
        used_quantity: inv.used_quantity || 0,
      }))
    : undefined,
  pricing_rules: form.pricing_rules.length ? form.pricing_rules : undefined,
};


    try {
      const res = await fetch('http://localhost:3000/products/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create product');

      console.log('Product created:', data);
      alert('Product created successfully!');
    } catch (err) {
      console.error(err);
      alert('Error creating product: ' + (err as Error).message);
    }
  };

  const sectionStyle = {
    border: '1px solid #ccc',
    padding: '20px',
    marginBottom: '20px',
    borderRadius: '10px',
    backgroundColor: '#fafafa',
  };
  const inputStyle = {
    padding: '8px 10px',
    borderRadius: '5px',
    border: '1px solid #ccc',
    width: '100%',
  };
  const labelStyle = { fontWeight: 600, marginBottom: '5px', display: 'block' };
  const btnStyle = {
    padding: '8px 15px',
    borderRadius: '5px',
    border: 'none',
    cursor: 'pointer',
    backgroundColor: '#007bff',
    color: '#fff',
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        maxWidth: '900px',
        margin: '20px auto',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>
        Create Product
      </h2>

      {/* Product Info */}
      <section style={sectionStyle}>
        <h3>Product Info</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '15px',
            marginTop: '10px',
          }}
        >
          <div>
            <label style={labelStyle}>Product Name</label>
            <input
              name="name"
              style={inputStyle}
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label style={labelStyle}>Short Description</label>
            <input
              name="short_description"
              style={inputStyle}
              value={form.short_description}
              onChange={handleChange}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Description</label>
            <textarea
              name="description"
              style={{ ...inputStyle, height: '80px' }}
              value={form.description}
              onChange={handleChange}
            />
          </div>
          <div>
            <label style={labelStyle}>Base Price</label>
            <input
              type="number"
              name="base_price"
              style={inputStyle}
              value={form.base_price}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label style={labelStyle}>Brand</label>
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
            >
              <option value={0}>-- Select Brand --</option>
              {brands.map((b) => (
                <option key={b.id} value={Number(b.id)}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Categories</label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {categories.map((c) => (
                <label key={c.id}>
                  <input
                    type="checkbox"
                    checked={form.categories.includes(c.id)}
                    onChange={() => handleCategoryChange(c.id)}
                  />{' '}
                  {c.name}
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Media */}
      <section style={sectionStyle}>
        <h3>Media</h3>
        {form.media.map((m, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: '10px',
              marginBottom: '10px',
              alignItems: 'center',
            }}
          >
            <input
              placeholder="Image URL"
              value={m.url}
              onChange={(e) => {
                const newMedia = [...form.media];
                newMedia[i].url = e.target.value;
                setForm({ ...form, media: newMedia });
              }}
              style={{ flex: 1, ...inputStyle }}
            />
            <label>
              Primary:
              <input
                type="checkbox"
                checked={m.is_primary}
                onChange={(e) => {
                  const newMedia = [...form.media];
                  newMedia[i].is_primary = e.target.checked;
                  setForm({ ...form, media: newMedia });
                }}
                style={{ marginLeft: '5px' }}
              />
            </label>
          </div>
        ))}
        <button type="button" onClick={addMedia} style={btnStyle}>
          Add Media
        </button>
      </section>

      {/* Variants */}
      <section style={sectionStyle}>
        <h3>Variants</h3>
        {form.variants.map((v, i) => {
          const totalStock = form.inventory
            .filter((inv) => inv.variant_sku === v.sku)
            .reduce((sum, inv) => sum + inv.quantity, 0);
          return (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
                gap: '10px',
                marginBottom: '10px',
              }}
            >
              <div>
                <label style={labelStyle}>SKU</label>
                <input
                  value={v.sku}
                  onChange={(e) => {
                    const newVar = [...form.variants];
                    newVar[i].sku = e.target.value;
                    setForm({ ...form, variants: newVar });
                  }}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Name</label>
                <input
                  value={v.variant_name}
                  onChange={(e) => {
                    const newVar = [...form.variants];
                    newVar[i].variant_name = e.target.value;
                    setForm({ ...form, variants: newVar });
                  }}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Price</label>
                <input
                  type="number"
                  value={v.price}
                  onChange={(e) => {
                    const newVar = [...form.variants];
                    newVar[i].price = +e.target.value;
                    setForm({ ...form, variants: newVar });
                  }}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Stock</label>
                <input
                  type="number"
                  value={totalStock}
                  readOnly
                  style={{ ...inputStyle, backgroundColor: '#e9ecef' }}
                />
              </div>
              <div>
                <label style={labelStyle}>Barcode</label>
                <input
                  value={v.barcode || ''}
                  onChange={(e) => {
                    const newVar = [...form.variants];
                    newVar[i].barcode = e.target.value;
                    setForm({ ...form, variants: newVar });
                  }}
                  style={inputStyle}
                />
              </div>
            </div>
          );
        })}
        <button type="button" onClick={addVariant} style={btnStyle}>
          Add Variant
        </button>
      </section>

      {/* Inventory */}
      <section style={sectionStyle}>
        <h3>Inventory</h3>
        {form.inventory.map((inv, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
              gap: '10px',
              marginBottom: '10px',
            }}
          >
            <div>
              <label style={labelStyle}>Variant SKU</label>
              <input
                value={inv.variant_sku}
                onChange={(e) => {
                  const newInv = [...form.inventory];
                  newInv[i].variant_sku = e.target.value;
                  // Tìm index của variant có SKU trùng khớp
                  const matchedIndex = form.variants.findIndex(
                    (v) => v.sku === e.target.value
                  );
                  newInv[i].variant_id =
                    matchedIndex !== -1 ? matchedIndex : undefined;
                  setForm({ ...form, inventory: newInv });
                }}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Location</label>
              <input
                value={inv.location}
                onChange={(e) => {
                  const newInv = [...form.inventory];
                  newInv[i].location = e.target.value;
                  setForm({ ...form, inventory: newInv });
                }}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Quantity</label>
              <input
                type="number"
                value={inv.quantity}
                onChange={(e) => {
                  const newInv = [...form.inventory];
                  newInv[i].quantity = +e.target.value;
                  setForm({ ...form, inventory: newInv });
                }}
                style={inputStyle}
              />
            </div>
          </div>
        ))}
        <button type="button" onClick={addInventory} style={btnStyle}>
          Add Inventory
        </button>
      </section>

      {/* Pricing Rules */}
      <section style={sectionStyle}>
        <h3>Pricing Rules</h3>
        {form.pricing_rules.map((pr, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr',
              gap: '10px',
              marginBottom: '10px',
            }}
          >
            <div>
              <label style={labelStyle}>Type</label>
              <input
                value={pr.type}
                onChange={(e) => {
                  const newPR = [...form.pricing_rules];
                  newPR[i].type = e.target.value;
                  setForm({ ...form, pricing_rules: newPR });
                }}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Min Qty</label>
              <input
                type="number"
                value={pr.min_quantity}
                onChange={(e) => {
                  const newPR = [...form.pricing_rules];
                  newPR[i].min_quantity = +e.target.value;
                  setForm({ ...form, pricing_rules: newPR });
                }}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Price</label>
              <input
                type="number"
                value={pr.price}
                onChange={(e) => {
                  const newPR = [...form.pricing_rules];
                  newPR[i].price = +e.target.value;
                  setForm({ ...form, pricing_rules: newPR });
                }}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Cycle</label>
              <input
                value={pr.cycle}
                onChange={(e) => {
                  const newPR = [...form.pricing_rules];
                  newPR[i].cycle = e.target.value;
                  setForm({ ...form, pricing_rules: newPR });
                }}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Starts At</label>
              <input
                type="date"
                value={pr.starts_at as string}
                onChange={(e) => {
                  const newPR = [...form.pricing_rules];
                  newPR[i].starts_at = e.target.value;
                  setForm({ ...form, pricing_rules: newPR });
                }}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Ends At</label>
              <input
                type="date"
                value={pr.ends_at as string}
                onChange={(e) => {
                  const newPR = [...form.pricing_rules];
                  newPR[i].ends_at = e.target.value;
                  setForm({ ...form, pricing_rules: newPR });
                }}
                style={inputStyle}
              />
            </div>
          </div>
        ))}
        <button type="button" onClick={addPricingRule} style={btnStyle}>
          Add Pricing Rule
        </button>
      </section>

      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <button type="submit" style={{ ...btnStyle, fontSize: '16px' }}>
          Create Product
        </button>
      </div>
    </form>
  );
};
