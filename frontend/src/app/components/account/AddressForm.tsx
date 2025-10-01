// src/components/account/AddressForm.tsx
import React, { useEffect, useState } from "react";
import { getProvinces, getDistricts, getWards, Province, District, Ward } from "../../../service/vnLocation";
import { AddressFormValues } from "../../types/user";

type Size = "xs" | "sm" | "md";

export default function AddressForm({
  initial,
  onSubmit,
  onCancel,
  size = "xs",               // <<< thêm prop size, mặc định rất nhỏ
}: {
  initial: AddressFormValues;
  onSubmit: (v: AddressFormValues) => void | Promise<void>;
  onCancel: () => void;
  size?: Size;
}) {
  const [v, setV] = useState<AddressFormValues>(initial);

  // ---- DATA ----
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loadingP, setLoadingP] = useState(false);
  const [loadingD, setLoadingD] = useState(false);
  const [loadingW, setLoadingW] = useState(false);

  useEffect(() => { (async () => {
    setLoadingP(true);
    try { setProvinces(await getProvinces()); } finally { setLoadingP(false); }
  })(); }, []);

  useEffect(() => {
    if (!v.provinceCode) { setDistricts([]); setWards([]); return; }
    (async () => {
      setLoadingD(true);
      try { setDistricts(await getDistricts(v.provinceCode!)); } finally { setLoadingD(false); }
    })();
  }, [v.provinceCode]);

  useEffect(() => {
    if (!v.districtCode) { setWards([]); return; }
    (async () => {
      setLoadingW(true);
      try { setWards(await getWards(v.districtCode!)); } finally { setLoadingW(false); }
    })();
  }, [v.districtCode]);

  const set = <K extends keyof AddressFormValues>(k: K, val: AddressFormValues[K]) =>
    setV((p) => ({ ...p, [k]: val }));

  const onProvinceChange = (codeStr: string) => {
    const code = Number(codeStr) || undefined;
    const p = provinces.find((x) => x.code === code);
    set("provinceCode", code); set("province", p?.name || "");
    set("districtCode", undefined as any); set("district", "");
    set("wardCode", undefined as any);     set("ward", "");
  };
  const onDistrictChange = (codeStr: string) => {
    const code = Number(codeStr) || undefined;
    const d = districts.find((x) => x.code === code);
    set("districtCode", code); set("district", d?.name || "");
    set("wardCode", undefined as any); set("ward", "");
  };
  const onWardChange = (codeStr: string) => {
    const code = Number(codeStr) || undefined;
    const w = wards.find((x) => x.code === code);
    set("wardCode", code); set("ward", w?.name || "");
  };

  // ---- KÍCH THƯỚC (Tailwind) ----
  const S = {
    xs: { label: "text-[13.5px]", ctrl: "h-9 text-[13.5px] px-3", area: "h-24 text-[13.5px] px-3", gap: "gap-2" },
    sm: { label: "text-sm",        ctrl: "h-10 text-sm px-3",     area: "h-28 text-sm px-3",     gap: "gap-3" },
    md: { label: "text-base",      ctrl: "py-2 text-base px-3",   area: "h-32 text-base px-3",   gap: "gap-4" },
  }[size];

  const labelCls = `mb-1 block ${S.label}`;
  const inputCls  = `w-full rounded-md border ${S.ctrl} placeholder:text-slate-400`;
  const areaCls   = `w-full rounded-md border ${S.area} placeholder:text-slate-400`;

  return (
    <form className={`grid grid-cols-1 ${S.gap}`} onSubmit={async (e) => { e.preventDefault(); await onSubmit(v); }}>
      <div>
        <label className={labelCls}>Họ và tên:</label>
        <input className={inputCls} value={v.fullName} onChange={(e) => set("fullName", e.target.value)} required />
      </div>

      <div>
        <label className={labelCls}>Công ty:</label>
        <input className={inputCls} value={v.company ?? ""} onChange={(e) => set("company", e.target.value)} placeholder="Nhập công ty" />
      </div>

      <div>
        <label className={labelCls}>Số điện thoại:</label>
        <input className={inputCls} value={v.phone}
          onChange={(e) => set("phone", e.target.value)}
          pattern="^(0|\\+84)[0-9]{8,10}$" title="SĐT Việt Nam hợp lệ"
          placeholder="Nhập số điện thoại" required />
      </div>

      <div>
        <label className={labelCls}>Tỉnh/Thành phố:</label>
        <select className={inputCls} value={v.provinceCode ?? ""} onChange={(e) => onProvinceChange(e.target.value)} required>
          <option value="">{loadingP ? "Đang tải..." : "Chọn Tỉnh/Thành phố"}</option>
          {provinces.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
        </select>
      </div>

      <div>
        <label className={labelCls}>Quận huyện:</label>
        <select className={inputCls} value={v.districtCode ?? ""} onChange={(e) => onDistrictChange(e.target.value)} disabled={!v.provinceCode} required>
          <option value="">{!v.provinceCode ? "Chọn Tỉnh trước" : (loadingD ? "Đang tải..." : "Chọn Quận/Huyện")}</option>
          {districts.map((d) => <option key={d.code} value={d.code}>{d.name}</option>)}
        </select>
      </div>

      <div>
        <label className={labelCls}>Phường xã:</label>
        <select className={inputCls} value={v.wardCode ?? ""} onChange={(e) => onWardChange(e.target.value)} disabled={!v.districtCode} required>
          <option value="">{!v.districtCode ? "Chọn Quận/Huyện trước" : (loadingW ? "Đang tải..." : "Chọn Phường/Xã")}</option>
          {wards.map((w) => <option key={w.code} value={w.code}>{w.name}</option>)}
        </select>
      </div>

      <div>
        <label className={labelCls}>Địa chỉ:</label>
        <textarea className={areaCls} placeholder="Nhập địa chỉ" value={v.addressLine} onChange={(e) => set("addressLine", e.target.value)} required />
      </div>

      <div className={`flex flex-wrap items-center gap-6 ${S.label}`}>
        <label className="flex items-center gap-2">
          <input type="radio" name="kind" checked={v.kind === "home"} onChange={() => set("kind", "home")} />
          Nhà riêng / Chung cư
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="kind" checked={v.kind === "company"} onChange={() => set("kind", "company")} />
          Cơ quan / Công ty
        </label>
        <label className="ml-4 flex items-center gap-2">
          <input type="checkbox" checked={!!v.isDefault} onChange={(e) => set("isDefault", e.target.checked)} />
          Đặt làm địa chỉ mặc định
        </label>
      </div>

      <div className="mt-1 flex gap-3">
        <button type="submit" className={`rounded-md bg-yellow-400 px-4 ${size === "xs" ? "h-9 text-sm" : "py-2"} font-medium hover:brightness-95`}>
          Cập nhật
        </button>
        <button type="button" onClick={onCancel} className={`rounded-md border px-4 ${size === "xs" ? "h-9 text-sm" : "py-2"} hover:bg-gray-50`}>
          Hủy
        </button>
      </div>
    </form>
  );
}