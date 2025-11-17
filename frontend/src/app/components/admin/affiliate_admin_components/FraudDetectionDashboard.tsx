import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Statistic,
  Row,
  Col,
  message,
  Descriptions,
  Badge,
} from 'antd';
import {
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  getFraudLogs,
  reviewFraudLog,
  getFraudStats,
  FraudLog,
  FraudStats,
} from '../../../../service/afiliate/fraud-detection.service';

const { TextArea } = Input;
const { Option } = Select;

const FraudDetectionDashboard: React.FC = () => {
  const [logs, setLogs] = useState<FraudLog[]>([]);
  const [stats, setStats] = useState<FraudStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [selectedLog, setSelectedLog] = useState<FraudLog | null>(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [page]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [logsResponse, statsData] = await Promise.all([
        getFraudLogs(page, limit),
        getFraudStats(),
      ]);

      setLogs(logsResponse.logs);
      setTotal(logsResponse.total);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading fraud data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (values: any) => {
    if (!selectedLog) return;

    try {
      await reviewFraudLog(selectedLog.id, values.action, values.notes);
      setReviewModalVisible(false);
      form.resetFields();
      loadData();
    } catch (error) {
      console.error('Error reviewing fraud log:', error);
    }
  };

  const showReviewModal = (log: FraudLog) => {
    setSelectedLog(log);
    setReviewModalVisible(true);
  };

  const showDetailModal = (log: FraudLog) => {
    setSelectedLog(log);
    setDetailModalVisible(true);
  };

  const getFraudTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      SELF_REFERRAL: 'red',
      DUPLICATE_ORDER: 'orange',
      SUSPICIOUS_IP: 'volcano',
      ABNORMAL_CONVERSION_RATE: 'magenta',
      RAPID_PURCHASE: 'purple',
    };
    return colors[type] || 'default';
  };

  const getFraudTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      SELF_REFERRAL: 'Tự giới thiệu',
      DUPLICATE_ORDER: 'Đơn hàng trùng lặp',
      SUSPICIOUS_IP: 'IP đáng ngờ',
      ABNORMAL_CONVERSION_RATE: 'Tỷ lệ chuyển đổi bất thường',
      RAPID_PURCHASE: 'Mua hàng quá nhanh',
    };
    return labels[type] || type;
  };

  const getActionColor = (action?: string) => {
    const colors: { [key: string]: string } = {
      IGNORE: 'default',
      BAN_USER: 'red',
      SUSPEND_AFFILIATE: 'orange',
    };
    return colors[action || ''] || 'default';
  };

  const getActionLabel = (action?: string) => {
    const labels: { [key: string]: string } = {
      IGNORE: 'Bỏ qua',
      BAN_USER: 'Cấm người dùng',
      SUSPEND_AFFILIATE: 'Tạm ngưng affiliate',
    };
    return labels[action || ''] || action;
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Loại gian lận',
      dataIndex: 'fraud_type',
      key: 'fraud_type',
      render: (type: string) => (
        <Tag color={getFraudTypeColor(type)}>{getFraudTypeLabel(type)}</Tag>
      ),
    },
    {
      title: 'Affiliate User ID',
      dataIndex: 'affiliate_user_id',
      key: 'affiliate_user_id',
      render: (id?: number) => id || '-',
    },
    {
      title: 'Order ID',
      dataIndex: 'order_id',
      key: 'order_id',
      render: (id?: number) => id || '-',
    },
    {
      title: 'IP Address',
      dataIndex: 'ip_address',
      key: 'ip_address',
      render: (ip?: string) => ip || '-',
    },
    {
      title: 'Phát hiện lúc',
      dataIndex: 'detected_at',
      key: 'detected_at',
      render: (date: string) => new Date(date).toLocaleString('vi-VN'),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_: any, record: FraudLog) => {
        if (record.is_reviewed) {
          return (
            <Space direction="vertical" size="small">
              <Tag color="green" icon={<CheckCircleOutlined />}>
                Đã xử lý
              </Tag>
              {record.admin_action && (
                <Tag color={getActionColor(record.admin_action)}>
                  {getActionLabel(record.admin_action)}
                </Tag>
              )}
            </Space>
          );
        }
        return (
          <Tag color="orange" icon={<WarningOutlined />}>
            Chờ xử lý
          </Tag>
        );
      },
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_: any, record: FraudLog) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => showDetailModal(record)}
          >
            Chi tiết
          </Button>
          {!record.is_reviewed && (
            <Button type="primary" onClick={() => showReviewModal(record)}>
              Xử lý
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <h1>
        <WarningOutlined style={{ marginRight: 8 }} />
        Phát hiện gian lận Affiliate
      </h1>

      {/* Statistics Cards */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Tổng số gian lận"
                value={stats.totalFraudAttempts}
                valueStyle={{ color: '#cf1322' }}
                prefix={<WarningOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Gian lận 24h qua"
                value={stats.recentAttempts}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Đã xử lý"
                value={stats.reviewedCount}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Chờ xử lý"
                value={stats.pendingReviewCount}
                valueStyle={{ color: '#faad14' }}
                prefix={<CloseCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Fraud by Type */}
      {stats && Object.keys(stats.byType).length > 0 && (
        <Card
          title="Phân loại gian lận"
          style={{ marginBottom: 24 }}
          extra={
            <Button icon={<ReloadOutlined />} onClick={loadData}>
              Làm mới
            </Button>
          }
        >
          <Space wrap>
            {Object.entries(stats.byType).map(([type, count]) => (
              <Badge
                key={type}
                count={count}
                style={{ backgroundColor: getFraudTypeColor(type) }}
              >
                <Tag color={getFraudTypeColor(type)}>
                  {getFraudTypeLabel(type)}
                </Tag>
              </Badge>
            ))}
          </Space>
        </Card>
      )}

      {/* Fraud Logs Table */}
      <Card title="Danh sách gian lận">
        <Table
          columns={columns}
          dataSource={logs}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize: limit,
            total: total,
            onChange: (newPage) => setPage(newPage),
            showSizeChanger: false,
            showTotal: (total) => `Tổng ${total} bản ghi`,
          }}
        />
      </Card>

      {/* Review Modal */}
      <Modal
        title="Xử lý gian lận"
        open={reviewModalVisible}
        onCancel={() => {
          setReviewModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        {selectedLog && (
          <>
            <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Loại gian lận">
                <Tag color={getFraudTypeColor(selectedLog.fraud_type)}>
                  {getFraudTypeLabel(selectedLog.fraud_type)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Affiliate User ID">
                {selectedLog.affiliate_user_id || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Order ID">
                {selectedLog.order_id || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="IP Address">
                {selectedLog.ip_address || '-'}
              </Descriptions.Item>
            </Descriptions>

            <Form form={form} onFinish={handleReview} layout="vertical">
              <Form.Item
                name="action"
                label="Hành động"
                rules={[{ required: true, message: 'Vui lòng chọn hành động' }]}
              >
                <Select placeholder="Chọn hành động">
                  <Option value="IGNORE">Bỏ qua</Option>
                  <Option value="SUSPEND_AFFILIATE">Tạm ngưng affiliate</Option>
                  <Option value="BAN_USER">Cấm người dùng</Option>
                </Select>
              </Form.Item>

              <Form.Item name="notes" label="Ghi chú">
                <TextArea rows={4} placeholder="Nhập ghi chú (tùy chọn)" />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit">
                    Xác nhận
                  </Button>
                  <Button
                    onClick={() => {
                      setReviewModalVisible(false);
                      form.resetFields();
                    }}
                  >
                    Hủy
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>

      {/* Detail Modal */}
      <Modal
        title="Chi tiết gian lận"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Đóng
          </Button>,
        ]}
        width={700}
      >
        {selectedLog && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="ID">{selectedLog.id}</Descriptions.Item>
            <Descriptions.Item label="Loại gian lận">
              <Tag color={getFraudTypeColor(selectedLog.fraud_type)}>
                {getFraudTypeLabel(selectedLog.fraud_type)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Affiliate User ID">
              {selectedLog.affiliate_user_id || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Order ID">
              {selectedLog.order_id || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="IP Address">
              {selectedLog.ip_address || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Phát hiện lúc">
              {new Date(selectedLog.detected_at).toLocaleString('vi-VN')}
            </Descriptions.Item>
            <Descriptions.Item label="Chi tiết">
              <pre style={{ maxHeight: 200, overflow: 'auto' }}>
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </Descriptions.Item>
            {selectedLog.is_reviewed && (
              <>
                <Descriptions.Item label="Trạng thái">
                  <Tag color="green">Đã xử lý</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Hành động">
                  {selectedLog.admin_action && (
                    <Tag color={getActionColor(selectedLog.admin_action)}>
                      {getActionLabel(selectedLog.admin_action)}
                    </Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Ghi chú admin">
                  {selectedLog.admin_notes || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Xử lý bởi">
                  User ID: {selectedLog.reviewed_by || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Xử lý lúc">
                  {selectedLog.reviewed_at
                    ? new Date(selectedLog.reviewed_at).toLocaleString('vi-VN')
                    : '-'}
                </Descriptions.Item>
              </>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default FraudDetectionDashboard;
