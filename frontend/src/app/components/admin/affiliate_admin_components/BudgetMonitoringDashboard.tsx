import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Progress,
  Tag,
  Space,
  Statistic,
  Row,
  Col,
  Alert,
  Button,
  Descriptions,
  Modal,
} from 'antd';
import {
  DollarOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import {
  getAllProgramsBudgetStatus,
  getBudgetAlerts,
  BudgetStatus,
  BudgetAlert,
} from '../../../../services/budget-tracking.service';

const BudgetMonitoringDashboard: React.FC = () => {
  const [budgetStatuses, setBudgetStatuses] = useState<BudgetStatus[]>([]);
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<BudgetStatus | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statuses, alertsData] = await Promise.all([
        getAllProgramsBudgetStatus(),
        getBudgetAlerts(),
      ]);

      setBudgetStatuses(statuses);
      setAlerts(alertsData);
    } catch (error) {
      console.error('Error loading budget data:', error);
    } finally {
      setLoading(false);
    }
  };

  const showDetailModal = (program: BudgetStatus) => {
    setSelectedProgram(program);
    setDetailModalVisible(true);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return '#ff4d4f'; // Red
    if (percentage >= 70) return '#faad14'; // Orange
    return '#52c41a'; // Green
  };

  const getStatusTag = (status: string, pausedReason?: string) => {
    if (status === 'PAUSED') {
      return (
        <Tag color="red" icon={<WarningOutlined />}>
          Tạm dừng {pausedReason ? `- ${pausedReason}` : ''}
        </Tag>
      );
    }
    return (
      <Tag color="green" icon={<CheckCircleOutlined />}>
        Hoạt động
      </Tag>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const columns = [
    {
      title: 'Chương trình',
      dataIndex: 'program_name',
      key: 'program_name',
      width: 200,
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 150,
      render: (_: any, record: BudgetStatus) =>
        getStatusTag(record.status, record.paused_reason),
    },
    {
      title: 'Ngân sách',
      key: 'budget',
      width: 300,
      render: (_: any, record: BudgetStatus) => (
        <div>
          <div style={{ marginBottom: 8 }}>
            <Progress
              percent={record.percentage_used}
              strokeColor={getProgressColor(record.percentage_used)}
              format={(percent) => `${percent?.toFixed(1)}%`}
            />
          </div>
          <Space size="small">
            <span>
              Đã dùng: <strong>{formatCurrency(record.spent)}</strong>
            </span>
            <span>|</span>
            <span>
              Pending: <strong>{formatCurrency(record.pending)}</strong>
            </span>
            <span>|</span>
            <span>
              Còn lại: <strong>{formatCurrency(record.available)}</strong>
            </span>
          </Space>
        </div>
      ),
    },
    {
      title: 'Tổng ngân sách',
      dataIndex: 'total_budget',
      key: 'total_budget',
      width: 150,
      render: (value: number) => formatCurrency(value),
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 100,
      render: (_: any, record: BudgetStatus) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => showDetailModal(record)}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  // Calculate summary statistics
  const totalBudget = budgetStatuses.reduce((sum, s) => sum + s.total_budget, 0);
  const totalSpent = budgetStatuses.reduce((sum, s) => sum + s.spent, 0);
  const totalPending = budgetStatuses.reduce((sum, s) => sum + s.pending, 0);
  const totalAvailable = budgetStatuses.reduce((sum, s) => sum + s.available, 0);

  return (
    <div style={{ padding: '24px' }}>
      <h1>
        <DollarOutlined style={{ marginRight: 8 }} />
        Giám sát Ngân sách Affiliate
      </h1>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Alert
          message="Cảnh báo ngân sách"
          description={
            <div>
              <p>Các chương trình sau đang gần hết ngân sách (dưới 20%):</p>
              <ul>
                {alerts.map((alert) => (
                  <li key={alert.program_id}>
                    <strong>{alert.program_name}</strong>: Còn{' '}
                    {alert.percentage_remaining.toFixed(1)}% (
                    {formatCurrency(alert.available)})
                  </li>
                ))}
              </ul>
            </div>
          }
          type="warning"
          icon={<WarningOutlined />}
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {/* Summary Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng ngân sách"
              value={totalBudget}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: '#1890ff' }}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Đã chi"
              value={totalSpent}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Đang pending"
              value={totalPending}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Còn lại"
              value={totalAvailable}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Budget Table */}
      <Card
        title="Chi tiết ngân sách theo chương trình"
        extra={
          <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
            Làm mới
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={budgetStatuses}
          rowKey="program_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => `Tổng ${total} chương trình`,
          }}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title={`Chi tiết ngân sách - ${selectedProgram?.program_name}`}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Đóng
          </Button>,
        ]}
        width={800}
      >
        {selectedProgram && (
          <div>
            {/* Budget Overview */}
            <Card title="Tổng quan ngân sách" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="Tổng ngân sách"
                    value={selectedProgram.total_budget}
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Tỷ lệ sử dụng"
                    value={selectedProgram.percentage_used}
                    suffix="%"
                    precision={2}
                  />
                </Col>
              </Row>
              <div style={{ marginTop: 16 }}>
                <Progress
                  percent={selectedProgram.percentage_used}
                  strokeColor={getProgressColor(selectedProgram.percentage_used)}
                  format={(percent) => `${percent?.toFixed(2)}%`}
                />
              </div>
            </Card>

            {/* Budget Breakdown */}
            <Card title="Phân bổ ngân sách" style={{ marginBottom: 16 }}>
              <Descriptions column={2} bordered>
                <Descriptions.Item label="Đã chi">
                  {formatCurrency(selectedProgram.spent)}
                </Descriptions.Item>
                <Descriptions.Item label="Đang pending">
                  {formatCurrency(selectedProgram.pending)}
                </Descriptions.Item>
                <Descriptions.Item label="Còn lại">
                  {formatCurrency(selectedProgram.available)}
                </Descriptions.Item>
                <Descriptions.Item label="Tổng cộng">
                  {formatCurrency(selectedProgram.total_budget)}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Caps */}
            <Card title="Giới hạn" style={{ marginBottom: 16 }}>
              <Descriptions column={1} bordered>
                <Descriptions.Item label="Giới hạn tháng">
                  {selectedProgram.monthly_cap
                    ? formatCurrency(selectedProgram.monthly_cap)
                    : 'Không giới hạn'}
                </Descriptions.Item>
                <Descriptions.Item label="Đã chi tháng này">
                  {formatCurrency(selectedProgram.monthly_spent)}
                </Descriptions.Item>
                <Descriptions.Item label="Giới hạn ngày">
                  {selectedProgram.daily_cap
                    ? formatCurrency(selectedProgram.daily_cap)
                    : 'Không giới hạn'}
                </Descriptions.Item>
                <Descriptions.Item label="Đã chi hôm nay">
                  {formatCurrency(selectedProgram.daily_spent)}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Settings */}
            <Card title="Cài đặt">
              <Descriptions column={1} bordered>
                <Descriptions.Item label="Trạng thái">
                  {getStatusTag(selectedProgram.status, selectedProgram.paused_reason)}
                </Descriptions.Item>
                <Descriptions.Item label="Tự động tạm dừng khi hết ngân sách">
                  {selectedProgram.auto_pause_enabled ? (
                    <Tag color="green">Bật</Tag>
                  ) : (
                    <Tag color="default">Tắt</Tag>
                  )}
                </Descriptions.Item>
                {selectedProgram.paused_reason && (
                  <Descriptions.Item label="Lý do tạm dừng">
                    {selectedProgram.paused_reason}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BudgetMonitoringDashboard;
