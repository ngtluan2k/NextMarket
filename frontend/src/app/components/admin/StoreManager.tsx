import React, { useEffect, useState } from "react";
import { Table, Spin, message, Card, Popconfirm, Button } from "antd";
import type { ColumnsType } from "antd/es/table";
import axios from "axios";
import { DeleteOutlined } from "@ant-design/icons";

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
    } catch (err: any) {
      console.error("Lỗi xóa store:", err);
      message.error(err.response?.data?.message || "Xóa cửa hàng thất bại");
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);
  

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
        <Table
          rowKey="id"
          dataSource={stores}
          columns={columns}
          pagination={{ pageSize: 10 }}
        />
      )}
    </Card>
  );
};

export default StoreManager;
