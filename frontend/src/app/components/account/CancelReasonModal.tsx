import React, { useState } from 'react';
import { orderService } from '../../../service/order.service';
import { message } from 'antd';

type CancelReasonModalProps = {
  orderId: number;
  token: string;
  onClose: () => void;
  onCancelled: () => void;
};

const REASONS = [
  'Thay đổi ý định',
  'Đặt nhầm sản phẩm',
  'Giá cả quá cao',
  'Khác (ghi chú)',
];

export default function CancelReasonModal({
  orderId,
  token,
  onClose,
  onCancelled,
}: CancelReasonModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customNote, setCustomNote] = useState('');
  const [loading, setLoading] = useState(false);

const handleCancel = async () => {
  if (!selectedReason) return message.error('Vui lòng chọn lý do hủy');
  const note = selectedReason === 'Khác (ghi chú)' ? customNote : selectedReason;

  try {
    setLoading(true);
    await orderService.changeStatus(orderId, 'cancelled', token, note);
    message.success('Hủy đơn thành công');
    onCancelled();
    onClose();
  } catch (err) {
    console.error('Lỗi khi hủy đơn:', err);
    message.error('Hủy đơn thất bại');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl p-6 w-96 max-w-full">
        <h2 className="text-lg font-semibold mb-4">Chọn lý do hủy đơn</h2>

        <div className="flex flex-col gap-2 mb-4">
          {REASONS.map((r) => (
            <label key={r} className="flex items-center gap-2">
              <input
                type="radio"
                name="cancelReason"
                value={r}
                checked={selectedReason === r}
                onChange={() => setSelectedReason(r)}
                className="accent-rose-500"
              />
              {r}
            </label>
          ))}
          {selectedReason === 'Khác (ghi chú)' && (
            <input
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Nhập lý do khác..."
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
            />
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border border-slate-300 hover:bg-slate-50 text-sm"
            disabled={loading}
          >
            Hủy
          </button>
          <button
            onClick={handleCancel}
            className="px-4 py-2 rounded bg-rose-500 text-white hover:bg-rose-600 text-sm"
            disabled={loading}
          >
            {loading ? 'Đang hủy...' : 'Xác nhận hủy'}
          </button>
        </div>
      </div>
    </div>
  );
}
