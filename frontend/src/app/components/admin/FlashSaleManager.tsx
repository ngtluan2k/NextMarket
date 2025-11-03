import React, { useEffect, useState } from 'react';
import {
  Card,
  Statistic,
  Row,
  Col,
  Space,
  Button,
  Input,
  Select,
  Table,
  message,
  Tag,
  Dropdown,
  Menu,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  MoreOutlined,
  EditOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { getAllFlashSalesForAdmin } from '../../../service/flash_sale.service';
import type { ColumnsType } from 'antd/es/table';
import FlashSaleFormModal from './flash_sale_components/FlashSaleFormModal';
import EditFlashSaleModal from './flash_sale_components/EditFlashSaleModal';

dayjs.locale('vi');
const { Option } = Select;

export interface FlashSale {
  id: number;
  name: string;
  description?: string;
  starts_at: string;
  ends_at: string;
  status?: 'upcoming' | 'active' | 'ended';
}
interface FlashSaleManagerProps {
  onSelectFlashSale: (flashSale: FlashSale) => void;
}

const FlashSaleManager: React.FC<FlashSaleManagerProps> = ({
  onSelectFlashSale,
}) => {
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [filtered, setFiltered] = useState<FlashSale[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'running' | 'upcoming' | 'expired' | null
  >(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedFlashSale, setSelectedFlashSale] = useState<FlashSale | null>(
    null
  );

  const fetchFlashSales = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await getAllFlashSalesForAdmin(token);
      const list = Array.isArray(res) ? res : res.data; // ✅ đảm bảo là mảng
      setFlashSales(list || []);
    } catch (err: any) {
      console.error(err);
      message.error('Lỗi lấy danh sách flash sale');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlashSales();
  }, []);

  useEffect(() => {
    handleFilter();
  }, [flashSales, searchText, statusFilter]);

  const handleFilter = () => {
    let data = [...flashSales];

    if (searchText.trim()) {
      const s = searchText.toLowerCase();
      data = data.filter(
        (fs) =>
          fs.name.toLowerCase().includes(s) ||
          (fs.description && fs.description.toLowerCase().includes(s))
      );
    }

    if (statusFilter) {
      data = data.filter((fs) => {
        if (statusFilter === 'running') return fs.status === 'active';
        if (statusFilter === 'upcoming') return fs.status === 'upcoming';
        if (statusFilter === 'expired') return fs.status === 'ended';
        return true;
      });
    }

    setFiltered(data);
  };

  const total = flashSales.length;
  const running = flashSales.filter((f) => f.status === 'active').length;
  const upcoming = flashSales.filter((f) => f.status === 'upcoming').length;
  const expired = flashSales.filter((f) => f.status === 'ended').length;

  const renderStatusTag = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Tag color="blue">Sắp diễn ra</Tag>;
      case 'active':
        return <Tag color="green">Đang diễn ra</Tag>;
      case 'ended':
        return <Tag color="red">Đã kết thúc</Tag>;
      default:
        return <Tag color="default">Không xác định</Tag>;
    }
  };

  const handleAction = (key: string, record: FlashSale) => {
    switch (key) {
      case 'detail':
        onSelectFlashSale(record); // gửi flash sale lên component cha
        break;
      case 'update':
        setSelectedFlashSale(record);
        setEditModalVisible(true);
        break;
      default:
        break;
    }
  };

  const columns: ColumnsType<FlashSale> = [
    { title: 'Tên chương trình', dataIndex: 'name', key: 'name' },
    { title: 'Mô tả', dataIndex: 'description', key: 'description' },
    {
      title: 'Bắt đầu',
      dataIndex: 'starts_at',
      key: 'startsAt',
      render: (date: string) =>
        date ? dayjs(date).format('HH:mm, DD/MM/YYYY') : '-',
    },
    {
      title: 'Kết thúc',
      dataIndex: 'ends_at',
      key: 'endsAt',
      render: (date: string) =>
        date ? dayjs(date).format('HH:mm, DD/MM/YYYY') : '-',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: renderStatusTag,
    },
    {
      title: 'Hành động',
      key: 'actions',
      align: 'center' as const,
      render: (_: any, record: FlashSale) => {
        const menu = (
          <Menu
            onClick={({ key }) => handleAction(key, record)}
            items={[
              { key: 'detail', label: 'Xem chi tiết' },
              { key: 'update', label: 'Cập nhật', icon: <EditOutlined /> },
            ]}
          />
        );

        return (
          <Dropdown overlay={menu} trigger={['click']} placement="bottomRight">
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <div style={{ height: '100%', overflow: 'hidden' }}>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Tổng số Flash Sale" value={total} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Đang diễn ra"
              value={running}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Sắp diễn ra"
              value={upcoming}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Đã kết thúc"
              value={expired}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Space style={{ marginBottom: 16 }}>
        <h3 className="text-xl font-bold text-gray-900 m-0">
          ⚡ Quản Lý Flash Sale
        </h3>
        <Input
          placeholder="Tìm kiếm tên/mô tả..."
          prefix={<SearchOutlined />}
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 250 }}
        />
        <Select
          placeholder="Lọc trạng thái"
          allowClear
          style={{ width: 150 }}
          value={statusFilter}
          onChange={(val) => setStatusFilter(val)}
        >
          <Option value="running">Đang diễn ra</Option>
          <Option value="upcoming">Sắp diễn ra</Option>
          <Option value="expired">Đã kết thúc</Option>
        </Select>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalVisible(true)}
        >
          Thêm Flash Sale
        </Button>
      </Space>

      <Card size="small">
        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>

      <FlashSaleFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={fetchFlashSales}
      />
      <EditFlashSaleModal
        visible={editModalVisible}
        flashSale={selectedFlashSale!} // chắc chắn không null khi modal mở
        onClose={() => setEditModalVisible(false)}
        onSuccess={() => {
          setEditModalVisible(false);
          fetchFlashSales(); // load lại danh sách sau khi cập nhật
        }}
      />
    </div>
  );
};

export default FlashSaleManager;
