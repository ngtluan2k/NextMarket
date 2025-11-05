'use client';

import { Button, Popconfirm, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { AffiliateProgram } from '../../../../types/affiliate';

interface Props {
  programs: AffiliateProgram[];
  loading: boolean;
  onView: (id: number) => void;
  onEdit: (program: AffiliateProgram) => void;
  onDelete: (id: number) => void;
}

const vnd = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value || 0);

const AffiliateProgramsTable = ({ programs, loading, onView, onEdit, onDelete }: Props) => {
  const columns: ColumnsType<AffiliateProgram> = [
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Số ngày lưu Cookie',
      dataIndex: 'cookie_days',
      key: 'cookie_days',
      render: (days) => days ?? 'N/A',
      sorter: (a, b) => (a.cookie_days ?? 0) - (b.cookie_days ?? 0),
    },
    {
      title: 'Loại hoa hồng',
      dataIndex: 'commission_type',
      key: 'commission_type',
      render: (type) =>
        type ? (
          <Tag color={type === 'percentage' ? 'blue' : 'green'}>
            {type === 'percentage' ? 'PHẦN TRĂM' : 'CỐ ĐỊNH'}
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
      title: 'Giá trị hoa hồng',
      dataIndex: 'commission_value',
      key: 'commission_value',
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
      render: (status) => (
        <Tag color={status === 'active' ? 'success' : 'default'}>
          {status === 'active' ? 'HOẠT ĐỘNG' : 'NGỪNG HOẠT ĐỘNG'}
        </Tag>
      ),
      filters: [
        { text: 'Hoạt động', value: 'active' },
        { text: 'Ngừng hoạt động', value: 'inactive' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
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
            title="Xóa chương trình"
            description="Bạn có chắc chắn muốn xóa chương trình này không?"
            onConfirm={() => onDelete(record.id)}
            okText="Có"
            cancelText="Không"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Xóa
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
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showTotal: (total) => `Tổng cộng ${total} chương trình`,
      }}
    />
  );
};

export default AffiliateProgramsTable;