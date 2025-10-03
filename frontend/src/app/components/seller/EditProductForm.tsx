import React, { useEffect, useState } from 'react';
import { productService } from '../../../service/product.service';
import type { Product } from '../../page/Seller/tab/StoreInventory';
interface EditProductFormProps {
  product: any; // dữ liệu sản phẩm cần sửa
  onClose: () => void; // đóng modal
  onProductUpdated?: (updatedProduct: Product) => void;
}

export const EditProductForm: React.FC<EditProductFormProps> = ({
  product,
  onClose,
  onProductUpdated,
}) => {
  console.log('Props from parent:', { product, onClose });
  console.log(
    'Inventory của variant đầu tiên:',
    product.variants[0]?.inventories
  );

  const [step, setStep] = useState(1);
  const [brands, setBrands] = useState<{ id: number; name: string }[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [deletedMediaIds, setDeletedMediaIds] = useState<number[]>([]);
  const [addingMedia, setAddingMedia] = useState(false); // track user đang thêm media mới

  interface ProductFormState {
    name: string;
    short_description?: string;
    description?: string;
    base_price: number;
    brandId: number;
    categories: number[]; // lưu id
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
      inventories?: {
        id?: number;
        location: string;
        quantity: number;
        used_quantity?: number;
      }[];
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

  // Preload brands & categories
  useEffect(() => {
    const token = localStorage.getItem('token');

    const fetchData = async () => {
      try {
        const [brandsRes, categoriesRes] = await Promise.all([
          fetch('http://localhost:3000/brands', {
            headers: { Authorization: `Bearer ${token}` },
          }).then((res) => res.json()),
          fetch('http://localhost:3000/categories', {
            headers: { Authorization: `Bearer ${token}` },
          }).then((res) => res.json()),
        ]);

        const brandsData = brandsRes.data || [];
        const categoriesData = categoriesRes.data || [];

        setBrands(brandsData);
        setCategories(categoriesData);

        if (product) {
          // Map variants + stock
          const variantsWithStock = (product.variants || []).map((v: any) => {
            const totalStock = (v.inventories || []).reduce(
              (sum: number, inv: any) => sum + inv.quantity,
              0
            );
            return { ...v, stock: totalStock };
          });

          // Map pricing rules
          const pricingRules = (product.pricing_rules || []).map((pr: any) => ({
            ...pr,
            starts_at: pr.starts_at
              ? new Date(pr.starts_at).toISOString().split('T')[0]
              : '',
            ends_at: pr.ends_at
              ? new Date(pr.ends_at).toISOString().split('T')[0]
              : '',
          }));

          // Flatten inventories from variants
          const inventoryWithSKU = (product.variants || []).flatMap((v: any) =>
            (v.inventories || []).map((inv: any) => ({
              id: inv.id,
              variant_sku: v.sku,
              variant_id: v.id,
              product_id: product.id,
              location: inv.location,
              quantity: inv.quantity,
              used_quantity: inv.used_quantity || 0,
            }))
          );

          const categoryIds = (product.categories || []).map((c: any) => c.id);

          setForm({
            name: product.name || '',
            short_description: product.short_description || '',
            description: product.description || '',
            base_price: product.base_price || 0,
            brandId: product.brandId || 0,
            categories: categoryIds,
            media: (product.media || []).filter(
              (m: any) => m.url && m.url !== ''
            ),
            variants: variantsWithStock,
            inventory: inventoryWithSKU,
            pricing_rules: pricingRules,
          });
        }
      } catch (err) {
        console.error('Lỗi khi tải brands hoặc categories:', err);
      }
    };

    fetchData();
  }, [product]);
  // Handlers
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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

  // Xử lý thay đổi file
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

  const validateForm = (): string[] => {
    const errors: string[] = [];
    if (!form.name.trim()) errors.push('Product name is required');
    if (!form.base_price || form.base_price <= 0)
      errors.push('Base price must be > 0');
    if (!form.brandId) errors.push('Brand is required');
    if (!form.categories.length)
      errors.push('At least one category is required');
    form.variants.forEach((v, i) => {
      if (!v.sku.trim()) errors.push(`Variant ${i + 1}: SKU is required`);
      if (!v.variant_name.trim())
        errors.push(`Variant ${i + 1}: Name is required`);
      if (v.price <= 0) errors.push(`Variant ${i + 1}: Price must be > 0`);
    });
    return errors;
  };
  const variantsWithStock = form.variants.map((v) => {
    const totalStock = form.inventory
      .filter((inv) => inv.variant_sku === v.sku)
      .reduce((sum, inv) => sum + inv.quantity, 0);
    return { ...v, stock: totalStock };
  });

  // Khi submit, lọc bỏ các slot rỗng
  const handleSubmit = async (status: 'draft' | 'active') => {
    try {
      // --- Tách media cũ và media mới ---
      const existingMedia = form.media.filter((m) => m.url && !m.file); // chỉ media đã có url
      const newMedia = form.media.filter((m) => m.file); // media mới upload

      

      // --- Tạo FormData ---
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('short_description', form.short_description || '');
      formData.append('description', form.description || '');
      formData.append('base_price', String(form.base_price));
      formData.append('brandId', String(form.brandId));
      formData.append('categories', JSON.stringify(form.categories));
      formData.append('variants', JSON.stringify(variantsWithStock));
      formData.append('inventory', JSON.stringify(form.inventory));
      formData.append('pricing_rules', JSON.stringify(form.pricing_rules));
      formData.append('status', status);

      // --- Chỉ gửi media cũ trong media_meta ---
      // media_meta gồm cả cũ + mới
formData.append(
  'media_meta',
  JSON.stringify([
    ...existingMedia.map((m, idx) => ({
      id: m.id || null,
      url: m.url,
      media_type: m.media_type,
      is_primary: m.is_primary || false,
      sort_order: m.sort_order || idx + 1,
    })),
    ...newMedia.map((m, idx) => ({
      id: null,
      url: '',
      media_type: m.media_type || 'image',
      is_primary: m.is_primary || false, // quan trọng
      sort_order: (existingMedia.length + idx + 1),
    }))
  ])
);

// gửi file riêng
newMedia.forEach((m) => {
  if (m.file) formData.append('media', m.file);
});

      // --- Gửi các media bị xóa nếu có ---
      if (deletedMediaIds.length) {
        formData.append('deleted_media_ids', JSON.stringify(deletedMediaIds));
      }

      // --- Gọi API update ---
      const updatedApiProduct = await productService.updateProduct(
        product.apiId,
        formData
      );

      // --- Map dữ liệu mới sang Product để update state cha ---
      const updatedProduct: Product = {
        ...product,
        ...form, // dữ liệu từ form
        base_price: Number(form.base_price),
        statusApi: status,
      };

      // --- Gọi callback nếu có để update state cha ---
      onProductUpdated?.(updatedProduct);

      alert('Product updated successfully!');
      onClose();
    } catch (err: any) {
      alert(err.message || 'Update failed');
    }
  };

  const submitForm = async (isDraft: boolean) => {
    const errors = !isDraft ? validateForm() : [];
    if (errors.length) {
      alert('Please fix the following errors:\n' + errors.join('\n'));
      return;
    }

    const status = isDraft ? 'draft' : 'active';
    await handleSubmit(status); // truyền status đúng
  };

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const errors = validateForm();
        if (errors.length > 0) {
          alert('Please fix the following errors:\n' + errors.join('\n'));
          return;
        }
        submitForm(false); // Publish
      }}
    >
      <h2 className="text-2xl font-bold text-center mb-6">Edit Product</h2>

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
                {categories.map((cat) => (
                  <label key={cat.id}>
                    <input
                      type="checkbox"
                      checked={form.categories.includes(cat.id)}
                      onChange={() => handleCategoryChange(cat.id)}
                    />
                    {cat.name}
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
              {/* Input file */}
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileChange(e, i)}
                className="flex-1"
              />

              {/* Preview image */}
              {m.url && (
                <img
                  src={m.url}
                  className="w-20 h-20 object-cover rounded-md"
                />
              )}

              {/* Primary checkbox */}
              <label className="flex items-center gap-1">
                Primary
                <input
                  type="checkbox"
                  checked={m.is_primary || false}
                  onChange={(e) => {
                    const newMedia = form.media.map((media, idx) => ({
                      ...media,
                      is_primary: idx === i ? e.target.checked : false,
                    }));
                    setForm({ ...form, media: newMedia });
                  }}
                  className="w-4 h-4"
                />
              </label>

              {/* Delete button */}
              <button
                type="button"
                onClick={() => {
                  const removed = form.media[i];

                  // Nếu media cũ (có id), thêm vào deletedMediaIds
                  if (removed.id) {
                    setDeletedMediaIds((prev) => [...prev, Number(removed.id)]);
                  }

                  // Xóa media khỏi form
                  const newMedia = form.media.filter((_, idx) => idx !== i);
                  setForm({ ...form, media: newMedia });
                }}
                className="px-3 py-1 bg-red-500 text-white rounded-md"
              >
                Delete
              </button>
            </div>
          ))}

          {/* Add Media button */}
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
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Publish
            </button>

            <button
              type="button"
              onClick={() => handleSubmit('draft')} // Save Draft
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