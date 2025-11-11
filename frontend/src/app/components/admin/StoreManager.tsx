import React, { useEffect, useState } from 'react';
import {
  Table,
  Spin,
  message,
  Card,
  Popconfirm,
  Button,
  Drawer,
  Descriptions,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';
import { DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { storeService } from '../../../service/store.service';

interface Store {
  id: number;
  uuid: string;
  name: string;
  status: string;
  description?: string;
  created_at: string;
}

const StoreManager: React.FC = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<any | null>(null);
  const [selected, setSelected] = useState<Store | null>(null);
  const navigate = useNavigate();
  const BE_BASE_URL = import.meta.env.VITE_BE_BASE_URL;

  // Gọi API lấy danh sách store
  const fetchStores = async () => {
    setLoading(true);
    try {
      const data = await storeService.getStores(true); // admin xem cả soft-deleted
      setStores(data || []);
    } catch (err: any) {
      console.error('Lỗi fetch stores:', err);
      message.error(
        err?.response?.data?.message || 'Không lấy được danh sách cửa hàng'
      );
    } finally {
      setLoading(false);
    }
  };

  // Gọi API xóa store
  const deleteStore = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${BE_BASE_URL}/stores/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      message.success('Xóa cửa hàng thành công');
      setStores((prev) => prev.filter((store) => store.id !== id));
      // Nếu đang xem chi tiết cửa hàng vừa xóa thì đóng Drawer
      if (selected?.id === id) {
        setDrawerOpen(false);
        setSelected(null);
        setDetail(null);
      }
    } catch (err: any) {
      console.error('Lỗi xóa store:', err);
      message.error(err.response?.data?.message || 'Xóa cửa hàng thất bại');
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const openDetail = async (record: Store) => {
    setSelected(record);
    setDrawerOpen(true);
    setDetailLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${BE_BASE_URL}/stores/${record.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Backend có thể trả về { data: {...} } hoặc trực tiếp object
      setDetail(res.data?.data ?? res.data ?? null);
    } catch (err: any) {
      console.error(err);
      message.error(
        err.response?.data?.message || 'Không lấy được thông tin cửa hàng'
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const columns: ColumnsType<Store> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Tên cửa hàng',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => text || '(Chưa đặt tên)',
    },

    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (text: string) => {
        switch (text) {
          case 'active':
            return <span style={{ color: 'green' }}>Hoạt động</span>;
          case 'inactive':
            return <span style={{ color: 'gray' }}>Chưa hoạt động</span>;
          case 'suspended':
            return <span style={{ color: 'orange' }}>Bị tạm ngưng</span>;
          case 'closed':
            return <span style={{ color: 'red' }}>Đã đóng</span>;
          default:
            return text || '-';
        }
      },
    },

    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => new Date(text).toLocaleString(),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            size="small"
            onClick={() => navigate(`/admin/stores/${record.id}`)}
          >
            Xem chi tiết
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa cửa hàng này?"
            onConfirm={() => deleteStore(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button
              type="primary"
              danger
              size="small"
              icon={<DeleteOutlined />}
            >
              Xóa
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <Card title="Quản lý cửa hàng" style={{ margin: 16 }}>
      {loading ? (
        <div className="flex justify-center items-center py-10">
          <Spin size="large" />
        </div>
      ) : (
        <>
          <Table
            rowKey="id"
            dataSource={stores}
            columns={columns}
            pagination={{ pageSize: 10 }}
          />
        </>
      )}
    </Card>
  );
};

export default StoreManager;
