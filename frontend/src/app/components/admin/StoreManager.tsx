import React, { useEffect, useState } from "react";
import { Table, Spin, message, Card, Popconfirm, Button, Drawer, Descriptions } from "antd";
import type { ColumnsType } from "antd/es/table";
import axios from "axios";
import { DeleteOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

interface Store {
  id: number;
  uuid: string;
  name: string;
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

  // Gọi API lấy danh sách store
  const fetchStores = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token"); // token từ login
      const res = await axios.get("http://localhost:3000/stores", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setStores(res.data.data || []);
    } catch (err: any) {
      console.error("Lỗi fetch stores:", err);
      message.error(err.response?.data?.message || "Không lấy được danh sách cửa hàng");
    } finally {
      setLoading(false);
    }
  };

  // Gọi API xóa store
  const deleteStore = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:3000/stores/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      message.success("Xóa cửa hàng thành công");
      setStores((prev) => prev.filter((store) => store.id !== id));
      // Nếu đang xem chi tiết cửa hàng vừa xóa thì đóng Drawer
      if (selected?.id === id) {
        setDrawerOpen(false);
        setSelected(null);
        setDetail(null);
      }
    } catch (err: any) {
      console.error("Lỗi xóa store:", err);
      message.error(err.response?.data?.message || "Xóa cửa hàng thất bại");
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
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://localhost:3000/stores/${record.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Backend có thể trả về { data: {...} } hoặc trực tiếp object
      setDetail(res.data?.data ?? res.data ?? null);
    } catch (err: any) {
      console.error(err);
      message.error(err.response?.data?.message || "Không lấy được thông tin cửa hàng");
    } finally {
      setDetailLoading(false);
    }
  };

  const columns: ColumnsType<Store> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
    },
    {
      title: "Tên cửa hàng",
      dataIndex: "name",
      key: "name",
      render: (text: string, record) => (
        <a onClick={() => openDetail(record)}>{text || "(Chưa đặt tên)"}</a>
      ),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      render: (text: string) => new Date(text).toLocaleString(),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <div className="flex gap-2">
          <Button size="small" onClick={() => navigate(`/admin/stores/${record.id}`)}>
            Xem chi tiết
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa cửa hàng này?"
            onConfirm={() => deleteStore(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="primary" danger size="small" icon={<DeleteOutlined />}>
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
            onRow={(record) => ({
              onClick: () => openDetail(record),
              style: { cursor: "pointer" },
            })}
          />

          <Drawer
            width={520}
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            title={selected ? `Thông tin cửa hàng ${selected.name}` : "Thông tin cửa hàng"}
            destroyOnClose
          >
            {detailLoading ? (
              <div className="flex justify-center items-center py-10">
                <Spin size="large" />
              </div>
            ) : detail ? (
              <Descriptions bordered column={1} size="middle">
                <Descriptions.Item label="ID">{detail.id}</Descriptions.Item>
                <Descriptions.Item label="Tên">{detail.name || "-"}</Descriptions.Item>
                <Descriptions.Item label="Mô tả">{detail.description || "-"}</Descriptions.Item>
                <Descriptions.Item label="Email">{detail.email || "-"}</Descriptions.Item>
                <Descriptions.Item label="SĐT">{detail.phone || "-"}</Descriptions.Item>
                <Descriptions.Item label="Slug">{detail.slug || "-"}</Descriptions.Item>
                <Descriptions.Item label="Trạng thái">{detail.status || "-"}</Descriptions.Item>
                <Descriptions.Item label="Ngày tạo">
                  {detail.created_at ? new Date(detail.created_at).toLocaleString() : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Cập nhật">
                  {detail.updated_at ? new Date(detail.updated_at).toLocaleString() : "-"}
                </Descriptions.Item>


              </Descriptions>
            ) : (
              <div>Không có dữ liệu cửa hàng</div>
            )}
          </Drawer>
        </>
      )}
    </Card>
  );
};

export default StoreManager;