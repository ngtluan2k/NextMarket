import React, { useEffect, useState } from 'react';

interface Store {
  id: number;
  name: string;
  slug: string;
  description: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'suspended' | 'closed';
  user_id: number;
  created_at: string;
  updated_at: string;
}

export const StoreManager: React.FC = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const token = localStorage.getItem('token');

  const fetchStores = async () => {
    try {
      const res = await fetch('http://localhost:3000/stores', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setStores(data.data || []);
    } catch (error) {
      console.error('Error fetching stores:', error);
    }
  };


  const handleDelete = async (storeId: number, storeName: string) => {
    // Xác nhận trực tiếp mà không cần preview (giống seller)
    if (
      !window.confirm(`⚠️ CẢNH BÁO: Bạn có chắc chắn muốn XÓA VĨNH VIỄN cửa hàng "${storeName}"?

🗑️ Hành động này sẽ xóa:
• Toàn bộ thông tin cửa hàng
• Tài khoản ngân hàng 
• Địa chỉ kho/lấy hàng
• Giấy tờ định danh
• Tài liệu đính kèm
• Đánh giá và người theo dõi
• Yêu cầu nâng cấp level
• Tất cả dữ liệu liên quan

⚠️ KHÔNG THỂ HOÀN TÁC!`)
    ) {
      return;
    }

    // Double confirmation cho hành động quan trọng
    if (!window.confirm(`🔴 XÁC NHẬN LẦN CUỐI: XÓA cửa hàng "${storeName}"?`)) {
      return;
    }

    try {
      console.log('🗑️ Admin deleting store ID:', storeId);
      const res = await fetch(`http://localhost:3000/stores/${storeId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Delete response status:', res.status);
      const data = await res.json();
      console.log('📡 Delete response data:', data);

      if (res.ok) {
        alert(
          `✅ Xóa cửa hàng thành công!\n\n📊 Đã xóa ${
            data.deletedRecords || 'toàn bộ'
          } bản ghi dữ liệu`
        );
        fetchStores(); // Refresh list
      } else {
        alert(`❌ Lỗi: ${data.message || 'Không thể xóa cửa hàng'}`);
      }
    } catch (error) {
      console.error('Error deleting store:', error);
      alert('❌ Lỗi kết nối. Vui lòng thử lại.');
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  return (
    <div>
      <h4>Quản Lý Cửa Hàng</h4>
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>Tên cửa hàng</th>
              <th>User ID</th>
              <th>Email store</th>
              <th>Trạng thái</th>
              <th>Ngày đăng ký</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {stores.map((store) => (
              <tr key={store.id}>
                <td>{store.name}</td>
                <td>#{store.user_id}</td>
                <td>{store.email || '-'}</td>
                <td>
                  <span
                    className={`badge ${
                      store.status === 'active'
                        ? 'bg-success'
                        : store.status === 'inactive'
                        ? 'bg-warning'
                        : 'bg-danger'
                    }`}
                  >
                    {store.status}
                  </span>
                </td>
                <td>
                  {new Date(store.created_at).toLocaleDateString('vi-VN')}
                </td>
                <td>
                  <div className="d-flex gap-2">
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(store.id, store.name)}
                      title="Xóa vĩnh viễn cửa hàng và toàn bộ dữ liệu"
                    >
                      🗑️ Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};