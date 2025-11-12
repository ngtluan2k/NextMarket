import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Tag,
  Space,
  Card,
  Row,
  Col,
  Statistic,
  message,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { approveRegistration, getAffiliateRegistrations, rejectRegistration } from '../../../../service/afiliate/affiliate-registration.service';
import axios from 'axios';

interface AffiliateRegistration {
  createdAt: string | number | Date;
  id: number;
  uuid: string;
  user_full_name: string;
  user_email: string;
  phone: string;
  registered_at: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

const BE_BASE_URL = import.meta.env.VITE_BE_BASE_URL;

const AffiliateRegistrationManager: React.FC = () => {
  const [registrations, setRegistrations] = useState<AffiliateRegistration[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [viewingRegistration, setViewingRegistration] =
    useState<AffiliateRegistration | null>(null);
  const token = localStorage.getItem('token');

  // const apiClient = axios.create({
  //   baseURL: `${BE_BASE_URL}`, // chỉnh lại theo BE thật
  //   headers: {
  //     Authorization: `Bearer ${token}`,
  //     'Content-Type': 'application/json',
  //   },
  // });

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const data = await getAffiliateRegistrations();
      setRegistrations(data);
    } catch (err: any) {
      message.error('Không thể tải danh sách đăng ký Affiliate');
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    Modal.confirm({
      title: 'Phê duyệt đăng ký',
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      content: 'Bạn có chắc chắn muốn phê duyệt đăng ký này?',
      okText: 'Phê duyệt',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await approveRegistration(id);
          message.success('Đã phê duyệt thành công');
          await fetchRegistrations();
        } catch {
          message.error('Phê duyệt thất bại');
        }
      },
    });
  };

  const handleReject = async (id: number) => {
    Modal.confirm({
      title: 'Từ chối đăng ký',
      icon: <CloseCircleOutlined style={{ color: '#f5222d' }} />,
      content: 'Bạn có chắc chắn muốn từ chối đăng ký này?',
      okText: 'Từ chối',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await rejectRegistration(id);
          message.success('Đã từ chối thành công');
          await fetchRegistrations();
        } catch {
          message.error('Từ chối thất bại');
        }
      },
    });
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Tag color="green">Đã duyệt</Tag>;
      case 'REJECTED':
        return <Tag color="red">Từ chối</Tag>;
      default:
        return <Tag color="orange">Chờ duyệt</Tag>;
    }
  };

  const columns = [
    {
      title: 'Tên người đăng ký',
      dataIndex: 'user_full_name',
      key: 'user_full_name',
      width: 180,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      width: 140,
    },
    {
      title: 'Ngày đăng ký',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) =>
        date ? new Date(date).toLocaleDateString('vi-VN') : 'N/A',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 160,
      fixed: 'right' as const,
      render: (record: AffiliateRegistration) => (
        <Space size="small">
          <Button
            icon={<EyeOutlined />}
            onClick={() => setViewingRegistration(record)}
          />
          {record.status === 'PENDING' && (
            <>
              <Button
                icon={<CheckCircleOutlined />}
                type="primary"
                size="small"
                onClick={() => handleApprove(record.id)}
              >
                Duyệt
              </Button>
              <Button
                icon={<CloseCircleOutlined />}
                danger
                size="small"
                onClick={() => handleReject(record.id)}
              >
                Từ chối
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const total = registrations.length;
  const approved = registrations.filter((r) => r.status === 'APPROVED').length;
  const rejected = registrations.filter((r) => r.status === 'REJECTED').length;
  const pending = registrations.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="h-full overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-900 m-0">
          Quản lý đăng ký Affiliate
        </h3>
      </div>

      {/* Statistics */}
      <Row gutter={12} className="mb-4">
        <Col xs={24} sm={12} md={6}>
          <Card size="small" className="h-20">
            <Statistic
              title="Tổng số đăng ký"
              value={total}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" className="h-20">
            <Statistic
              title="Đã phê duyệt"
              value={approved}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" className="h-20">
            <Statistic
              title="Đã từ chối"
              value={rejected}
              prefix={<CloseCircleOutlined style={{ color: '#f5222d' }} />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" className="h-20">
            <Statistic
              title="Chờ duyệt"
              value={pending}
              prefix={
                <ExclamationCircleOutlined style={{ color: '#faad14' }} />
              }
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Table */}
      <Card size="small" bodyStyle={{ padding: '12px' }}>
        <Table
          dataSource={registrations}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="small"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
          }}
        />
      </Card>

      {/* View Details Modal */}
      <Modal
        title="Chi tiết đăng ký"
        open={!!viewingRegistration}
        onCancel={() => setViewingRegistration(null)}
        footer={null}
        width={480}
      >
        {viewingRegistration && (
          <div className="space-y-2">
            <p>
              <strong>Tên:</strong> {viewingRegistration.user_full_name}
            </p>
            <p>
              <strong>Email:</strong> {viewingRegistration.user_email}
            </p>
            <p>
              <strong>Điện thoại:</strong> {viewingRegistration.phone}
            </p>
            <p>
              <strong>Ngày đăng ký:</strong>{' '}
              {new Date(viewingRegistration.createdAt).toLocaleDateString(
                'vi-VN'
              )}
            </p>
            <p>
              <strong>Trạng thái:</strong>{' '}
              {getStatusTag(viewingRegistration.status)}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AffiliateRegistrationManager;
