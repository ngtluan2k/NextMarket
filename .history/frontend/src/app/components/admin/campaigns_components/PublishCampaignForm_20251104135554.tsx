import React from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  message,
  Row,
  Col,
  Menu,
  Dropdown,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  approveStore,
  rejectStore,
  Campaign,
  CampaignStore,
} from '../../../../service/campaign.service';
import { useNavigate } from 'react-router-dom';
import { MoreOutlined } from '@ant-design/icons';

export default function CampaignDetailPage({
  campaign,
  onBack,
  onSelectStore,
}: {
  campaign: Campaign | null;
  onBack: () => void;
  onSelectStore: (storeId: number) => void;
}) {
  const navigate = useNavigate();
  const navigateToStore = (storeId?: number) => {
    if (!storeId || !campaign) return;
    onSelectStore(storeId); // gọi callback từ parent
  };

  if (!campaign) return <p>Không có dữ liệu</p>;

  const handleApprove = async (store: CampaignStore) => {
    try {
      await approveStore(store.id);
      message.success(`Đã duyệt cửa hàng ${store.uuid}`);
    } catch {
      message.error('Lỗi duyệt cửa hàng');
    }
  };

  const handleReject = async (store: CampaignStore) => {
    try {
      await rejectStore(store.id, 'Không đạt yêu cầu');
      message.success(`Đã từ chối cửa hàng ${store.uuid}`);
    } catch {
      message.error('Lỗi từ chối cửa hàng');
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
          Quay lại
        </Button>
        <h2 style={{ margin: 0 }}>Chi tiết chiến dịch</h2>
      </Space>

      <Card>
        <p>
          <strong>Tên:</strong> {campaign.name}
        </p>
        <p>
          <strong>Mô tả:</strong> {campaign.description}
        </p>
        <p>
          <strong>Thời gian:</strong>{' '}
          {dayjs(campaign.starts_at).format('DD/MM/YYYY HH:mm')} -{' '}
          {dayjs(campaign.ends_at).format('DD/MM/YYYY HH:mm')}
        </p>
        <p>
          <strong>Trạng thái:</strong>{' '}
          <Tag
            color={
              campaign.status === 'pending'
                ? 'blue'
                : campaign.status === 'active'
                ? 'green'
                : campaign.status === 'ended'
                ? 'red'
                : 'default'
            }
          >
            {campaign.status}
          </Tag>
        </p>

        {/* 👇 Banner nằm ngay dưới trạng thái */}
        {campaign.banner_url && (
          <div style={{ marginTop: 16 }}>
            <img
              src={`http://localhost:3000${campaign.banner_url}`}
              alt="Banner chiến dịch"
              style={{
                width: '100%',
                maxHeight: 250,
                objectFit: 'cover',
                borderRadius: 8,
              }}
            />
          </div>
        )}

        <h3 style={{ marginTop: 24 }}>Danh sách cửa hàng đăng ký</h3>
        <Table
          dataSource={campaign.stores || []}
          rowKey="uuid"
          pagination={false}
          size="small"
          columns={[
            {
              title: 'Tên cửa hàng',
              dataIndex: ['store', 'name'], // ✅ lấy store.name
              render: (name: string, record) => <span>{name || '-'}</span>,
            },
            {
              title: 'Trạng thái',
              dataIndex: 'status',
              render: (status: string) => (
                <Tag
                  color={
                    status === 'pending'
                      ? 'orange'
                      : status === 'approved'
                      ? 'green'
                      : 'red'
                  }
                >
                  {status}
                </Tag>
              ),
            },
            {
              title: 'Ngày đăng ký',
              dataIndex: 'registeredAt',
              render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
            },
            {
              title: 'Ngày duyệt',
              dataIndex: 'approvedAt',
              render: (date?: string | null) =>
                date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '-',
            },
            {
              title: 'Lý do từ chối',
              dataIndex: 'rejectedReason',
              render: (reason?: string | null) => reason || '-',
            },
            {
              title: 'Hành động',
              key: 'actions',
              render: (_: any, store: CampaignStore) => {
                const menu = (
                  <Menu>
                    {store.status === 'pending' && (
                      <>
                        <Menu.Item
                          key="approve"
                          style={{ color: 'green' }}
                          onClick={() => handleApprove(store)}
                        >
                          Duyệt
                        </Menu.Item>
                        <Menu.Item
                          key="reject"
                          onClick={() => handleReject(store)}
                          danger
                        >
                          Từ chối
                        </Menu.Item>
                      </>
                    )}
                    <Menu.Item
                      key="view"
                      style={{ color: 'blue' }}
                      onClick={() => {
                        if (store.store?.id) onSelectStore(store.store.id);
                      }}
                    >
                      Xem các sản phẩm
                    </Menu.Item>
                    <Menu.Item
                      key="store-products"
                      onClick={() => {
                        navigate(`/admin/stores/${store.store?.id}`);
                      }}
                    >
                      Xem cửa hàng
                    </Menu.Item>
                  </Menu>
                );

                return (
                  <Dropdown overlay={menu} trigger={['click']}>
                    <Button type="text" icon={<MoreOutlined />} />
                  </Dropdown>
                );
              },
            },
          ]}
        />
      </Card>
    </div>
  );
}