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
import { useNavigate } from 'react-router-dom';
import CampaignFormModal from './campaigns_components/CampaignFormModal';
import { getAllCampaigns, Campaign } from '../../../service/campaign.service';
import type { ColumnsType } from 'antd/es/table';

dayjs.locale('vi');
const { Option } = Select;

export default function CampaignPage({
  onSelectCampaign,
}: {
  onSelectCampaign: (c: Campaign, mode: 'detail' | 'publish' | 'update') => void;
}) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'running' | 'upcoming' | 'expired' | 'draft' | null
  >(null);

  const navigate = useNavigate(); // ✅ hook ở đây là đúng chỗ

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const data = await getAllCampaigns();
      setCampaigns(data);
    } catch (err: any) {
      console.error(err);
      message.error('Lỗi lấy danh sách campaign');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    handleFilter();
  }, [campaigns, searchText, statusFilter]);

  const handleFilter = () => {
    let data = [...campaigns];

    if (searchText.trim()) {
      const s = searchText.toLowerCase();
      data = data.filter(
        (c) =>
          c.name.toLowerCase().includes(s) ||
          (c.description && c.description.toLowerCase().includes(s))
      );
    }

    if (statusFilter) {
      data = data.filter((c) => {
        if (statusFilter === 'draft') return c.status === 'draft';
        if (statusFilter === 'running') return c.status === 'active';
        if (statusFilter === 'upcoming') return c.status === 'pending';
        if (statusFilter === 'expired') return c.status === 'ended';
        return true;
      });
    }

    setFilteredCampaigns(data);
  };

  const total = campaigns.length;
  const running = campaigns.filter((c) => c.status === 'active').length;
  const upcoming = campaigns.filter((c) => c.status === 'pending').length;
  const expired = campaigns.filter((c) => c.status === 'ended').length;

  const renderStatusTag = (status: string) => {
    switch (status) {
      case 'draft':
        return <Tag color="default">Nháp</Tag>;
      case 'pending':
        return <Tag color="blue">Sắp diễn ra</Tag>;
      case 'active':
        return <Tag color="green">Đang diễn ra</Tag>;
      case 'ended':
        return <Tag color="red">Hết hạn</Tag>;
      default:
        return <Tag>N/A</Tag>;
    }
  };

  const handleAction = (key: string, record: Campaign) => {
    switch (key) {
      case 'detail':
        onSelectCampaign(record, 'detail'); // ✅ điều hướng sang trang chi tiết
        break;
      case 'approve':
        message.success(`✅ Duyệt chiến dịch ${record.name}`);
        break;
      case 'reject':
        message.warning(`🚫 Từ chối chiến dịch ${record.name}`);
        break;
      case 'publish':
        onSelectCampaign(record, 'publish'); // 👈 giống detail
        break;
      case 'update':
        onSelectCampaign(record, 'update'); // 🆕 mở form cập nhật chiến dịch
        break;
    }
  };

  const columns: ColumnsType<Campaign> = [
    { title: 'Tên', dataIndex: 'name', key: 'name' },
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
      render: (status: string) => renderStatusTag(status),
    },
    {
      title: 'Hành đông',
      key: 'actions',
      align: 'center' as const, // ✅ ép kiểu literal
      render: (_: any, record: Campaign) => {
        const menu = (
          <Menu
            onClick={({ key }) => handleAction(key, record)}
            items={[
              { key: 'detail', label: 'Xem chi tiết' },
              { key: 'approve', label: 'Duyệt tất cả cửa hàng' },
              { key: 'reject', label: 'Từ chối tất cả cửa hàng', danger: true },
              {
                key: 'publish',
                label: 'Đăng chiến dịch',
                icon: <PlusOutlined />,
              },
              {
                key: 'update',
                label: 'Cập nhật chiến dịch',
                icon: <EditOutlined />,
              },
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
            <Statistic title="Tổng chiến dịch" value={total} />
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
              title="Hết hạn"
              value={expired}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Space style={{ marginBottom: 16 }}>
        <h3 className="text-xl font-bold text-gray-900 m-0">Quản Lý Sự Kiện</h3>
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
          <Option value="draft">Nháp</Option>
          <Option value="running">Đang diễn ra</Option>
          <Option value="upcoming">Sắp diễn ra</Option>
          <Option value="expired">Hết hạn</Option>
        </Select>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalVisible(true)}
        >
          Thêm Campaign
        </Button>
      </Space>

      <Card size="small">
        <Table
          dataSource={filteredCampaigns}
          columns={columns}
          rowKey="uuid"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>

      <CampaignFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={fetchCampaigns}
      />

      
    </div>
  );
}
