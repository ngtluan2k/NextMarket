import React, { useState } from "react";

type Media = { media_type: "image" | "video"; url: string; is_primary?: boolean; sort_order?: number };
type Variant = { sku: string; variant_name: string; price: number; stock: number };
type Inventory = { variant_sku: string; location: string; quantity: number; used_quantity?: number };
type PricingRule = { type: "bulk" | "discount"; min_quantity: number; price: number; cycle?: string; starts_at?: string; ends_at?: string };

type ProductFormData = {
  name: string;
  short_description: string;
  description: string;
  base_price: number;
  brandId: number;
  categories: number[];
  media: Media[];
  variants: Variant[];
  inventory: Inventory[];
  pricing_rules: PricingRule[];
};

export default function ProductForm() {
  const [data, setData] = useState<ProductFormData>({
    name: "",
    short_description: "",
    description: "",
    base_price: 0,
    brandId: 1,
    categories: [8],
    media: [],
    variants: [],
    inventory: [],
    pricing_rules: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (field: keyof ProductFormData, value: any) => setData({ ...data, [field]: value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null); setSuccess(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3000/products/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      setSuccess("Tạo sản phẩm thành công!");
    } catch (err: any) { setError(err.message || "Lỗi khi tạo sản phẩm"); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4 bg-white rounded-lg shadow-md">
      {/* ===== Basic Info ===== */}
      <div className="space-y-2">
        <div><label className="font-medium">Tên sản phẩm</label><input type="text" value={data.name} onChange={e=>handleChange("name",e.target.value)} className="w-full border px-2 py-1 rounded"/></div>
        <div><label className="font-medium">Mô tả ngắn</label><textarea value={data.short_description} onChange={e=>handleChange("short_description",e.target.value)} className="w-full border px-2 py-1 rounded"/></div>
        <div><label className="font-medium">Mô tả chi tiết</label><textarea value={data.description} onChange={e=>handleChange("description",e.target.value)} className="w-full border px-2 py-1 rounded"/></div>
        <div><label className="font-medium">Giá cơ bản</label><input type="number" value={data.base_price} onChange={e=>handleChange("base_price",Number(e.target.value))} className="w-full border px-2 py-1 rounded"/></div>
      </div>

      {/* ===== Media ===== */}
      <div>
        <label className="font-medium">Media</label>
        {data.media.map((m, idx) => (
          <div key={idx} className="flex gap-2 mb-2">
            <input placeholder="URL" value={m.url} onChange={e=>{ const newM=[...data.media]; newM[idx].url=e.target.value; handleChange("media",newM)}} className="border px-2 py-1 flex-1 rounded"/>
            <input type="checkbox" checked={m.is_primary||false} onChange={e=>{ const newM=data.media.map((item,i)=>({...item,is_primary:i===idx?e.target.checked:false})); handleChange("media",newM)}}/>
            <button type="button" onClick={()=>handleChange("media",data.media.filter((_,i)=>i!==idx))} className="bg-red-500 text-white px-2 rounded">Xóa</button>
          </div>
        ))}
        <button type="button" onClick={()=>handleChange("media",[...data.media,{url:"",media_type:"image"}])} className="bg-sky-500 text-white px-3 py-1 rounded">Thêm media</button>
      </div>

      {/* ===== Variants ===== */}
      <div>
        <label className="font-medium">Variants</label>
        {data.variants.map((v, idx)=>(
          <div key={idx} className="flex gap-2 mb-2">
            <input placeholder="SKU" value={v.sku} onChange={e=>{ const newV=[...data.variants]; newV[idx].sku=e.target.value; handleChange("variants",newV)}} className="border px-2 py-1 rounded"/>
            <input placeholder="Tên variant" value={v.variant_name} onChange={e=>{ const newV=[...data.variants]; newV[idx].variant_name=e.target.value; handleChange("variants",newV)}} className="border px-2 py-1 rounded"/>
            <input type="number" placeholder="Giá" value={v.price} onChange={e=>{ const newV=[...data.variants]; newV[idx].price=Number(e.target.value); handleChange("variants",newV)}} className="border px-2 py-1 rounded"/>
            <input type="number" placeholder="Stock" value={v.stock} onChange={e=>{ const newV=[...data.variants]; newV[idx].stock=Number(e.target.value); handleChange("variants",newV)}} className="border px-2 py-1 rounded"/>
            <button type="button" onClick={()=>handleChange("variants",data.variants.filter((_,i)=>i!==idx))} className="bg-red-500 text-white px-2 rounded">Xóa</button>
          </div>
        ))}
        <button type="button" onClick={()=>handleChange("variants",[...data.variants,{sku:"",variant_name:"",price:0,stock:0}])} className="bg-sky-500 text-white px-3 py-1 rounded">Thêm variant</button>
      </div>

      {/* ===== Inventory ===== */}
      <div>
        <label className="font-medium">Inventory</label>
        {data.inventory.map((inv, idx)=>(
          <div key={idx} className="flex gap-2 mb-2">
            <input placeholder="SKU variant" value={inv.variant_sku} onChange={e=>{ const newI=[...data.inventory]; newI[idx].variant_sku=e.target.value; handleChange("inventory",newI)}} className="border px-2 py-1 rounded"/>
            <input placeholder="Kho" value={inv.location} onChange={e=>{ const newI=[...data.inventory]; newI[idx].location=e.target.value; handleChange("inventory",newI)}} className="border px-2 py-1 rounded"/>
            <input type="number" placeholder="Số lượng" value={inv.quantity} onChange={e=>{ const newI=[...data.inventory]; newI[idx].quantity=Number(e.target.value); handleChange("inventory",newI)}} className="border px-2 py-1 rounded"/>
            <input type="number" placeholder="Đã dùng" value={inv.used_quantity||0} onChange={e=>{ const newI=[...data.inventory]; newI[idx].used_quantity=Number(e.target.value); handleChange("inventory",newI)}} className="border px-2 py-1 rounded"/>
            <button type="button" onClick={()=>handleChange("inventory",data.inventory.filter((_,i)=>i!==idx))} className="bg-red-500 text-white px-2 rounded">Xóa</button>
          </div>
        ))}
        <button type="button" onClick={()=>handleChange("inventory",[...data.inventory,{variant_sku:"",location:"",quantity:0}])} className="bg-sky-500 text-white px-3 py-1 rounded">Thêm inventory</button>
      </div>

      {/* ===== Pricing Rules ===== */}
      <div>
        <label className="font-medium">Pricing rules</label>
        {data.pricing_rules.map((pr, idx)=>(
          <div key={idx} className="flex gap-2 mb-2">
            <select value={pr.type} onChange={e=>{ const newP=[...data.pricing_rules]; newP[idx].type=e.target.value as any; handleChange("pricing_rules",newP)}} className="border px-2 py-1 rounded">
              <option value="bulk">bulk</option>
              <option value="discount">discount</option>
            </select>
            <input type="number" placeholder="Số lượng tối thiểu" value={pr.min_quantity} onChange={e=>{ const newP=[...data.pricing_rules]; newP[idx].min_quantity=Number(e.target.value); handleChange("pricing_rules",newP)}} className="border px-2 py-1 rounded"/>
            <input type="number" placeholder="Giá" value={pr.price} onChange={e=>{ const newP=[...data.pricing_rules]; newP[idx].price=Number(e.target.value); handleChange("pricing_rules",newP)}} className="border px-2 py-1 rounded"/>
            <input placeholder="Cycle" value={pr.cycle||""} onChange={e=>{ const newP=[...data.pricing_rules]; newP[idx].cycle=e.target.value; handleChange("pricing_rules",newP)}} className="border px-2 py-1 rounded"/>
            <button type="button" onClick={()=>handleChange("pricing_rules",data.pricing_rules.filter((_,i)=>i!==idx))} className="bg-red-500 text-white px-2 rounded">Xóa</button>
          </div>
        ))}
        <button type="button" onClick={()=>handleChange("pricing_rules",[...data.pricing_rules,{type:"bulk",min_quantity:1,price:0}])} className="bg-sky-500 text-white px-3 py-1 rounded">Thêm rule</button>
      </div>

      {error && <div className="text-red-500">{error}</div>}
      {success && <div className="text-green-500">{success}</div>}
      <button type="submit" disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded">{loading?"Đang lưu...":"Lưu sản phẩm"}</button>
    </form>
  );
}
