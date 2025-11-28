'use client';

import { Button, Popconfirm, Space, Table, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { AffiliateProgram } from '../../../../types/affiliate';

interface Props {
  programs: AffiliateProgram[];
  loading: boolean;
  onView: (id: number) => void;
  onEdit: (program: AffiliateProgram) => void;
  onDelete: (id: number) => void;
  onHardDelete: (id: number) => void;
}

const vnd = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value || 0);

const AffiliateProgramsTable = ({ programs, loading, onView, onEdit, onDelete, onHardDelete }: Props) => {
  const columns: ColumnsType<AffiliateProgram> = [
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      fixed: 'left',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Cookie',
      dataIndex: 'cookie_days',
      key: 'cookie_days',
      width: 80,
      align: 'center',
      render: (days) => days ?? 'N/A',
      sorter: (a, b) => (a.cookie_days ?? 0) - (b.cookie_days ?? 0),
    },
    {
      title: 'Loại HH',
      dataIndex: 'commission_type',
      key: 'commission_type',
      width: 100,
      render: (type) =>
        type ? (
          <Tag color={type === 'percentage' ? 'blue' : 'green'}>
            {type === 'percentage' ? '%' : 'VNĐ'}
          </Tag>
        ) : (
          'N/A'
        ),
      filters: [
        { text: 'Phần trăm', value: 'percentage' },
        { text: 'Cố định', value: 'fixed' },
      ],
      onFilter: (value, record) => record.commission_type === value,
    },
    {
      title: 'Giá trị HH',
      dataIndex: 'commission_value',
      key: 'commission_value',
      width: 100,
      render: (value, record) => {
        if (value == null) return 'N/A';
        return record.commission_type === 'percentage' ? `${value}%` : vnd(value);
      },
      sorter: (a, b) => (a.commission_value ?? 0) - (b.commission_value ?? 0),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={status === 'active' ? 'success' : 'default'}>
          {status === 'active' ? 'HOẠT ĐỘNG' : 'TẠM DỪNG'}
        </Tag>
      ),
      filters: [
        { text: 'Hoạt động', value: 'active' },
        { text: 'Ngừng hoạt động', value: 'inactive' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Người tham gia',
      dataIndex: 'user_enrolled',
      key: 'user_enrolled',
      width: 110,
      align: 'center',
      render: (count: number) => (
        <Tag color={count > 0 ? 'blue' : 'default'}>
          {count.toLocaleString()}
        </Tag>
      ),
      sorter: (a, b) => (a.user_enrolled || 0) - (b.user_enrolled || 0),
    },
    {
      title: 'Giới hạn',
      key: 'limits',
      width: 100,
      align: 'center',
      render: (_, record) => {
        const hasTotal = record.total_budget_amount && record.total_budget_amount > 0;
        const hasMonthly = record.monthly_budget_cap && record.monthly_budget_cap > 0;
        const hasDaily = record.daily_budget_cap && record.daily_budget_cap > 0;
        
        if (!hasTotal && !hasMonthly && !hasDaily) {
          return <Tag color="default">Không giới hạn</Tag>;
        }
        
        const tooltipContent = (
          <div>
            {hasTotal && <div>Tổng: {vnd(record.total_budget_amount || 0)}</div>}
            {hasMonthly && <div>Tháng: {vnd(record.monthly_budget_cap || 0)}</div>}
            {hasDaily && <div>Ngày: {vnd(record.daily_budget_cap || 0)}</div>}
          </div>
        );
        
        return (
          <Tooltip title={tooltipContent}>
            <Tag color="orange" style={{ cursor: 'pointer' }}>
              Có giới hạn
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: 'Doanh thu TB',
      dataIndex: 'avg_revenue',
      key: 'avg_revenue',
      width: 120,
      align: 'right',
      render: (value: number) => (
        <span style={{ color: value > 0 ? '#52c41a' : '#8c8c8c', fontWeight: value > 0 ? 600 : 400 }}>
          {value > 0 ? vnd(value) : '0₫'}
        </span>
      ),
      sorter: (a, b) => (a.avg_revenue || 0) - (b.avg_revenue || 0),
    },
    {
      title: 'Hoa hồng TB',
      dataIndex: 'avg_commission',
      key: 'avg_commission',
      width: 120,
      align: 'right',
      render: (value: number) => (
        <span style={{ color: value > 0 ? '#cf1322' : '#8c8c8c', fontWeight: value > 0 ? 600 : 400 }}>
          {value > 0 ? vnd(value) : '0₫'}
        </span>
      ),
      sorter: (a, b) => (a.avg_commission || 0) - (b.avg_commission || 0),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 100,
      render: (date) => (date ? new Date(date).toLocaleDateString('vi-VN') : 'N/A'),
      sorter: (a, b) =>
        new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime(),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="text" icon={<EyeOutlined />} onClick={() => onView(record.id)}>
            Chi tiết
          </Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => onEdit(record)}>
            Chỉnh sửa
          </Button>
          <Popconfirm
            title="Xóa tạm thời"
            description="Chương trình sẽ chuyển sang trạng thái ngừng hoạt động. Bạn có thể kích hoạt lại sau."
            onConfirm={() => onDelete(record.id)}
            okText="Có"
            cancelText="Không"
          >
            <Button type="link" icon={<DeleteOutlined />}>
              Xóa tạm
            </Button>
          </Popconfirm>
          <Popconfirm
            title="Xóa cứng chương trình"
            description="⚠️ Cảnh báo: Thao tác này sẽ xóa vĩnh viễn chương trình, tất cả liên kết affiliate, quy tắc hoa hồng và dữ liệu hoa hồng. Không thể hoàn tác!"
            onConfirm={() => onHardDelete(record.id)}
            okText="Xóa vĩnh viễn"
            okButtonProps={{ danger: true }}
            cancelText="Hủy"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Xóa cứng
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={programs}
      rowKey="id"
      loading={loading}
      locale={{ emptyText: loading ? 'Đang tải...' : 'Không có dữ liệu.' }}
      scroll={{ x: 1300 }}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showTotal: (total) => `Tổng cộng ${total} chương trình`,
      }}
    />
  );
};

export default AffiliateProgramsTable;