import React, { useState, useEffect } from 'react';
import { Modal, DatePicker } from 'antd';
import dayjs, { Dayjs } from 'dayjs';

export interface GroupDeadlineModalProps {
  open: boolean;
  initialExpiresAt?: string | null; 
  onSubmit: (expiresAtIso: string | null) => void | Promise<void>;
  onCancel: () => void;
}

export const GroupDeadlineModal: React.FC<GroupDeadlineModalProps> = ({
  open,
  initialExpiresAt,
  onSubmit,
  onCancel,
}) => {
  const [value, setValue] = useState<Dayjs | null>(null);

  useEffect(() => {
    if (initialExpiresAt) {
      const d = dayjs(initialExpiresAt);
      setValue(d.isValid() ? d : null);
    } else {
      setValue(null);
    }
  }, [initialExpiresAt, open]);

  const handleOk = async () => {
    // Cho phép clear (không deadline)
    if (!value) {
      await onSubmit(null);
      return;
    }

    const now = dayjs();
    if (value.isBefore(now)) {
      // Đơn giản dùng alert ở đây, có thể nâng cấp dùng antd message nếu muốn
      alert('Thời hạn phải lớn hơn thời điểm hiện tại');
      return;
    }

    await onSubmit(value.toISOString());
  };

  return (
    <Modal
      open={open}
      title="Chọn thời hạn cho nhóm"
      onOk={handleOk}
      onCancel={onCancel}
      okText="Lưu"
      cancelText="Hủy"
      destroyOnClose
    >
      <div className="space-y-2">
        <p className="text-sm text-slate-600">
          Chọn ngày giờ hết hạn cho nhóm. Để trống để bỏ thời hạn.
        </p>
        <DatePicker
          value={value}
          onChange={(d) => setValue(d)}
          showTime
          allowClear
          style={{ width: '100%' }}
          format="YYYY-MM-DD HH:mm"
          placeholder="Chọn ngày giờ hết hạn"
        />
      </div>
    </Modal>
  );
};