import React, { useEffect, useState } from 'react';

interface Store {
  id: number;
  name: string;
  slug: string;
  status: 'active' | 'inactive' | 'suspended' | 'closed';
  is_draft: boolean; // Thêm lại trường is_draft
  description: string;
  created_at: string;
}

export const Settings: React.FC = () => {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  const handleDeleteStore = async () => {
    if (!store) return;

    // Xác nhận trực tiếp mà không cần preview
//     if (
//       !confirm(`⚠️ CẢNH BÁO: Bạn có chắc chắn muốn XÓA VĨNH VIỄN cửa hàng "${store.name}"?

// 🗑️ Hành động này sẽ xóa:
// • Toàn bộ thông tin cửa hàng
// • Tài khoản ngân hàng 
// • Địa chỉ kho/lấy hàng
// • Giấy tờ định danh
// • Tài liệu đính kèm
// • Tất cả dữ liệu liên quan

// ⚠️ KHÔNG THỂ HOÀN TÁC!
// Sau khi xóa, bạn sẽ cần đăng ký lại từ đầu để tạo cửa hàng mới.`)
//     ) {
//       return;
//     }

//     // Double confirmation cho hành động quan trọng
//     if (!confirm(`🔴 XÁC NHẬN LẦN CUỐI: XÓA cửa hàng "${store.name}"?`)) {
//       return;
//     }

    try {
      const token = localStorage.getItem('token');

      console.log('🗑️ Deleting my store');
      const res = await fetch('http://localhost:3000/stores/my-store', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      if (res.ok) {
        alert(
          `✅ Xóa cửa hàng thành công!\n\n📊 Đã xóa ${
            data.deletedRecords || 'toàn bộ'
          } bản ghi dữ liệu\n\nBạn sẽ được chuyển về trang chủ.`
        );

        // Redirect về trang chủ hoặc trang đăng ký seller
        window.location.href = '/';
      } else {
        alert(`❌ Lỗi: ${data.message || 'Không thể xóa cửa hàng'}`);
      }
    } catch (error) {
      alert('❌ Lỗi kết nối. Vui lòng thử lại.');
    }
  };

  useEffect(() => {
    const fetchMyStore = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:3000/stores/my-store`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        setStore(data.data);
      } catch (error) {
        console.error('Error fetching store:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyStore();
  }, []);

  if (loading) return <div className="text-center mt-5">Đang tải...</div>;

  if (!store) {
    return (
      <div className="container mt-5 text-center">
        <h3>Bạn chưa có cửa hàng</h3>
        <p>Hãy đăng ký trở thành người bán hàng để bắt đầu kinh doanh!</p>
        <a href="/seller-registration" className="btn btn-primary">
          Đăng Ký Làm Seller
        </a>
      </div>
    );
  }

  // Logic mới: chỉ 2 trạng thái dựa trên is_draft
  const getStatusBadge = (is_draft: boolean) => {
    if (is_draft) {
      return <span className="badge bg-warning">📝 Bản nháp</span>;
    }
    return <span className="badge bg-success">✅ Hoạt động</span>;
  };

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4>🏪 Thông Tin Cửa Hàng</h4>
              {getStatusBadge(store.is_draft)}
            </div>
            <div className="card-body">
              <h5>{store.name}</h5>
              <p className="text-muted">Slug: {store.slug}</p>
              {store.description && <p>{store.description}</p>}
              <small className="text-muted">
                Đăng ký ngày:{' '}
                {new Date(store.created_at).toLocaleDateString('vi-VN')}
              </small>
            </div>
          </div>

          {/* Logic hiển thị thông báo mới */}
          {store.is_draft ? (
            <div className="alert alert-warning mt-3">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <i className="bi bi-pencil-square"></i>
                  <strong> Bạn chưa hoàn thành đủ thông tin để đăng ký</strong>
                  <p className="mb-0">
                    Hãy tiếp tục hoàn tất các bước còn lại để kích hoạt cửa
                    hàng.
                  </p>
                </div>
                <div className="ms-3">
                  <a href="/seller-registration" className="btn btn-primary">
                    ✏️ Hoàn tất đăng ký
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="alert alert-success mt-3">
              <i className="bi bi-check-circle"></i>
              <strong> Cửa hàng đã được kích hoạt</strong>
              <p className="mb-0">
                Chúc mừng! Cửa hàng của bạn đã sẵn sàng hoạt động và bán hàng.
              </p>
            </div>
          )}
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h6>📊 Thống Kê</h6>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <span>Sản phẩm:</span>
                <strong>0</strong>
              </div>
              <div className="d-flex justify-content-between">
                <span>Đơn hàng:</span>
                <strong>0</strong>
              </div>
              <div className="d-flex justify-content-between">
                <span>Đánh giá:</span>
                <strong>⭐ 0</strong>
              </div>
            </div>
          </div>

          <div className="card mt-3">
            <div className="card-header">
              <h6>⚙️ Quản Lý Cửa Hàng</h6>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                {store.is_draft ? (
                  // Trạng thái DRAFT: Chỉ có nút hoàn tất đăng ký
                  <>
                    <a
                      href="/seller-registration"
                      className="btn btn-primary btn-sm"
                    >
                      ✏️ Hoàn tất đăng ký
                    </a>
                    <div className="alert alert-info p-2 mt-2">
                      <small>
                        <strong>💡 Gợi ý:</strong> Hoàn tất thông tin để bắt đầu
                        bán hàng.
                      </small>
                    </div>
                  </>
                ) : (
                  // Trạng thái ACTIVE: Đầy đủ chức năng quản lý
                  <>
                    <a
                      href="/seller-registration"
                      className="btn btn-outline-primary btn-sm"
                    >
                      ✏️ Chỉnh sửa thông tin
                    </a>
                    <button className="btn btn-outline-success btn-sm">
                      📦 Quản lý sản phẩm
                    </button>
                    <button className="btn btn-outline-info btn-sm">
                      📊 Xem báo cáo
                    </button>
                    <button className="btn btn-outline-secondary btn-sm">
                      💬 Quản lý đánh giá
                    </button>
                  </>
                )}

                <hr />
                <button
                  className="btn btn-danger btn-sm"
                  onClick={handleDeleteStore}
                  title="Xóa vĩnh viễn cửa hàng và toàn bộ dữ liệu"
                >
                  🗑️ Xóa Cửa Hàng
                </button>
                <small className="text-muted">
                  ⚠️ Hành động này không thể hoàn tác
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
