import React, { useEffect, useState } from "react";
import { Camera } from "lucide-react";

export type ProfileFormValues = {
  fullName?: string;
  nickname?: string;
  dob?: { day?: number; month?: number; year?: number };
  gender?: "male" | "female" | "other";
  nationality?: string;
  avatarUrl?: string;
};

type Props = {
  initial?: ProfileFormValues;
  loading?: boolean;
  onSave: (v: ProfileFormValues) => Promise<void> | void;
  framed?: boolean;           // <= cho phép bọc card hay không
  className?: string;         // <= chèn class bổ sung
};

const days = Array.from({ length: 31 }, (_, i) => i + 1);
const months = Array.from({ length: 12 }, (_, i) => i + 1);
const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

export default function AccountProfileForm({
  initial,
  loading,
  onSave,
  framed = true,
  className = "",
}: Props) {
  const [val, setVal] = useState<ProfileFormValues>({});

  useEffect(() => setVal(initial ?? {}), [initial]);

  const body = (
    <div className={className}>
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Thông tin tài khoản</h2>

      <div className="grid grid-cols-1 gap-6">
        {/* Avatar + Họ & Tên + Nickname */}
        <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-4 items-start">
          <div className="relative h-22 w-22">
            <div className="h-22 w-22 rounded-full bg-slate-100 border border-slate-200 grid place-items-center text-slate-400">
              <svg width="42" height="42" viewBox="0 0 24 24" fill="none">
                <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" stroke="currentColor" strokeWidth="1.5" />
                <path d="M3 21a9 9 0 1 1 18 0" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
            <button
              type="button"
              className="absolute bottom-0 right-0 rounded-full bg-white border border-slate-200 p-2 shadow"
              title="Đổi ảnh"
            >
              <Camera className="h-4 w-4 text-slate-600" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Họ & Tên</label>
              <input
                value={val.fullName ?? ""}
                onChange={(e) => setVal((s) => ({ ...s, fullName: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
                placeholder=""
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nickname</label>
              <input
                value={val.nickname ?? ""}
                onChange={(e) => setVal((s) => ({ ...s, nickname: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
                placeholder="Thêm nickname"
              />
            </div>
          </div>
        </div>

        {/* Ngày sinh */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Ngày sinh</label>
          <div className="flex gap-3">
            <select
              value={val.dob?.day ?? ""}
              onChange={(e) =>
                setVal((s) => ({ ...s, dob: { ...s.dob, day: e.target.value ? Number(e.target.value) : undefined } }))
              }
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
            >
              <option value="">Ngày</option>
              {days.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <select
              value={val.dob?.month ?? ""}
              onChange={(e) =>
                setVal((s) => ({
                  ...s,
                  dob: { ...s.dob, month: e.target.value ? Number(e.target.value) : undefined },
                }))
              }
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
            >
              <option value="">Tháng</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <select
              value={val.dob?.year ?? ""}
              onChange={(e) =>
                setVal((s) => ({ ...s, dob: { ...s.dob, year: e.target.value ? Number(e.target.value) : undefined } }))
              }
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
            >
              <option value="">Năm</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Giới tính */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Giới tính</label>
          <div className="flex items-center gap-5 text-sm text-slate-700">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={val.gender === "male"}
                onChange={() => setVal((s) => ({ ...s, gender: "male" }))}
              />
              Nam
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={val.gender === "female"}
                onChange={() => setVal((s) => ({ ...s, gender: "female" }))}
              />
              Nữ
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={val.gender === "other"}
                onChange={() => setVal((s) => ({ ...s, gender: "other" }))}
              />
              Khác
            </label>
          </div>
        </div>

        {/* Quốc tịch */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Quốc tịch</label>
          <input
            value={val.nationality ?? ""}
            onChange={(e) => setVal((s) => ({ ...s, nationality: e.target.value }))}
            placeholder="Chọn quốc tịch"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
          />
        </div>

        {/* Save */}
        <div>
          <button
            type="button"
            disabled={loading}
            onClick={() => onSave(val)}
            className="rounded-xl bg-sky-600 text-white px-4 py-2 text-sm font-semibold hover:bg-sky-700 disabled:opacity-60"
          >
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );

  return framed ? (
    <section className="rounded-2xl bg-white ring-1 ring-slate-200 shadow p-5">{body}</section>
  ) : (
    body
  );
}
