import React from 'react';
import { Table } from 'antd';
import dayjs from 'dayjs';

interface CampaignTableProps {
  campaigns: any[];
  loading: boolean;
}

export default function CampaignTable({ campaigns, loading }: CampaignTableProps) {
  const columns = [
    { title: 'Tên', dataIndex: 'name', key: 'name' },
    { title: 'Mô tả', dataIndex: 'description', key: 'description' },
    {
      title: 'Bắt đầu',
      dataIndex: 'startsAt',
      key: 'startsAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: 'Kết thúc',
      dataIndex: 'endsAt',
      key: 'endsAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'publish',
      key: 'publish',
      render: (publish: boolean) => (publish ? 'Đang chạy' : 'Nháp'),
    },
  ];

  return (
    <Table
      dataSource={campaigns}
      columns={columns}
      rowKey="uuid"
      loading={loading}
      bordered
    />
  );
}
