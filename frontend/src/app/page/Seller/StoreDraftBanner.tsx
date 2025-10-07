import React from 'react';

export default function StoreDraftBanner({ isDraft }: { isDraft?: boolean }) {
  if (!isDraft) return null;

  return (
    <div className="alert alert-warning mb-3">
      <div className="d-flex align-items-center">
        <div className="flex-grow-1">
          <strong> Bạn chưa hoàn thành đủ thông tin để đăng ký</strong>
          <p className="mb-0">
            Hãy tiếp tục hoàn tất các bước còn lại để kích hoạt cửa hàng.
          </p>
        </div>
        <div className="ms-3">
          <a href="/seller-registration" className="btn btn-primary btn-sm">
            ✏️ Hoàn tất đăng ký
          </a>
        </div>
      </div>
    </div>
  );
}
