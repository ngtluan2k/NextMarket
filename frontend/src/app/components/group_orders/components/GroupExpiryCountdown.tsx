import React from 'react';
import { ClockCircleOutlined } from '@ant-design/icons';

type Status = 'open' | 'locked' | 'completed' | 'cancelled' | string;

type Props = {
  status?: Status;
  expiresAt?: string | null;
  /**
   * 'full' = dùng ở trang chi tiết / banner (dòng to)
   * 'compact' = dùng ở list/cart (dòng nhỏ)
   */
  variant?: 'full' | 'compact';
  className?: string;
};

export const GroupExpiryCountdown: React.FC<Props> = ({
  status,
  expiresAt,
  variant = 'full',
  className = '',
}) => {
  const [label, setLabel] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!expiresAt || !status || (status !== 'open' && status !== 'locked')) {
      setLabel(null);
      return;
    }

    const update = () => {
      const end = new Date(expiresAt).getTime();
      const now = Date.now();
      const diffMs = end - now;

      if (diffMs <= 0) {
        setLabel(
          status === 'locked'
            ? 'Đang xử lý auto hủy nhóm do quá hạn…'
            : 'Đang xử lý auto khóa nhóm do quá hạn…'
        );
        return;
      }

      const totalSec = Math.floor(diffMs / 1000);
      const m = Math.floor(totalSec / 60);
      const s = totalSec % 60;

      const prefix =
        status === 'open'
          ? 'Nhóm sẽ tự động KHÓA sau'
          : 'Nhóm sẽ tự động HỦY sau';

      setLabel(
        `${prefix} ${m} phút ${s.toString().padStart(2, '0')} giây`
      );
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [expiresAt, status]);

  if (!label) return null;

  if (variant === 'compact') {
    return (
      <div
        className={`flex items-center gap-4 text-[11px] text-orange-600 ${className}`}
      >
        <ClockCircleOutlined />
        <span>{label}</span>
      </div>
    );
  }

  return (
    <div
      className={`mt-2 flex items-center gap-1 text-xs text-orange-600 ${className}`}
    >
      <ClockCircleOutlined />
      <span>{label}</span>
    </div>
  );
};