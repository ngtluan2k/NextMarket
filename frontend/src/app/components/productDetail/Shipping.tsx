import React from 'react';
import { Truck, Package, RefreshCcw } from 'lucide-react';

export default function Shipping() {
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
      <h3 className="mb-2 text-base font-semibold text-slate-900">
        Thông tin vận chuyển
      </h3>
      <ul className="divide-y divide-slate-200 text-sm">
        <li className="flex items-start justify-between gap-2 py-3">
          <div className="flex items-start gap-2">
            <Truck className="mt-0.5 h-4 w-4 text-sky-600" />
            <div>
              Giao đến{' '}
              <span className="font-medium">
                Q. 1, P. Bến Nghé, Hồ Chí Minh
              </span>
            </div>
          </div>
          <button className="text-sky-700 hover:underline">Đổi</button>
        </li>
        <li className="flex items-start gap-2 py-3">
          <div className="mt-0.5 h-4 w-4" />
          <div>
            <span className="text-rose-600 font-semibold">NOW</span> Giao siêu
            tốc 2h —
            <span className="ml-1 text-emerald-600">Miễn phí hôm nay</span>
          </div>
        </li>
        <li className="flex items-start gap-2 py-3">
          <Package className="mt-0.5 h-4 w-4 text-indigo-600" />
          <div>
            Giao đúng sáng mai —{' '}
            <span className="ml-1 text-emerald-600">Miễn phí</span>
          </div>
        </li>
        <li className="flex items-start gap-2 py-3">
          <RefreshCcw className="mt-0.5 h-4 w-4 text-slate-600" />
          <div>Freeship 10k đơn từ 45k, Freeship 25k đơn từ 100k</div>
        </li>
      </ul>
    </div>
  );
}
