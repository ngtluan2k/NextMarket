import React, { useEffect, useState } from 'react';
import { 
  Card, 
  Tree, 
  Tag, 
  Statistic, 
  Row, 
  Col, 
  Alert, 
  Select, 
  Button,
  Space,
  Progress
} from 'antd';
import { 
  TeamOutlined, 
  TrophyOutlined, 
  DollarOutlined, 
  UserOutlined,
  ReloadOutlined,
  UserSwitchOutlined,
  BranchesOutlined
} from '@ant-design/icons';
import { fetchMyDownlineTree, fetchMyAffiliateStats } from '../../../../../../service/afiliate/affiliate-tree.service';
import { 
  UserDownlineTreeResponse, 
  UserAffiliateStats 
} from '../../../../../types/affiliate-tree';

const { Option } = Select;

const UserAffiliateTree: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [downlineData, setDownlineData] = useState<UserDownlineTreeResponse | null>(null);
  const [stats, setStats] = useState<UserAffiliateStats | null>(null);
  const [maxDepth, setMaxDepth] = useState(5);
  const [programId] = useState<number | undefined>(undefined); // Future: Add program filter UI

  const loadTreeData = async () => {
    setLoading(true);
    try {
      const response = await fetchMyDownlineTree(maxDepth, programId);
      setDownlineData(response.data);
    } catch (error) {
      console.error('Error loading downline tree:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const response = await fetchMyAffiliateStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading affiliate stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    loadTreeData();
    loadStats();
  }, [maxDepth, programId]);

  // Transform tree data for Ant Design Tree component
  const transformToTreeData = (downlines: any[]) => {
    if (!downlines || downlines.length === 0) return [];
    
    // Create completely unique keys using multiple identifiers
    const timestamp = Date.now();
    const flatNodes = downlines.map((item: any, globalIndex: number) => ({
      ...item,
      uniqueKey: `affiliate-${timestamp}-${item.level}-${item.affiliateCode}-${globalIndex}-${Math.random().toString(36).substr(2, 9)}`,
      globalIndex
    }));
    
    // Sort by level to ensure proper hierarchy
    flatNodes.sort((a, b) => a.level - b.level);
    
    // Build flat tree structure (no nested children for now to avoid complexity)
    return flatNodes.map((item: any) => ({
      title: (
        <div className="flex items-center space-x-2">
          <Tag color="purple">F{item.level}</Tag>
          <Tag color="blue">{item.affiliateCode}</Tag>
          <Tag color={item.status === 'active' ? 'green' : 'default'}>
            {item.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
          </Tag>
          <span className="text-sm text-gray-600">
            {item.totalOrders} đơn hàng • {Number(item.totalRevenue).toLocaleString('vi-VN')}đ
          </span>
        </div>
      ),
      key: item.uniqueKey,
      icon: <UserSwitchOutlined />,
      isLeaf: true // Make all nodes leaf nodes to avoid nesting issues
    }));
  };

  const treeNodes = transformToTreeData(downlineData?.tree || []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold mb-2">Cây Affiliate của tôi</h2>
            <p className="text-gray-600">
              Xem thông tin downline và hiệu suất của team affiliate
            </p>
          </div>
          <Space>
            <Select
              placeholder="Độ sâu tối đa"
              value={maxDepth}
              onChange={setMaxDepth}
              style={{ width: 120 }}
            >
              <Option value={3}>3 cấp</Option>
              <Option value={5}>5 cấp</Option>
              <Option value={7}>7 cấp</Option>
              <Option value={10}>10 cấp</Option>
            </Select>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => {
                loadTreeData();
                loadStats();
              }}
              loading={loading || statsLoading}
            >
              Làm mới
            </Button>
          </Space>
        </div>
      </Card>

      {/* Stats Overview */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tổng Downline"
              value={downlineData?.totalDownlines || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Đang hoạt động"
              value={downlineData?.activeDownlines || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tổng doanh thu"
              value={downlineData?.totalRevenue || 0}
              prefix={<DollarOutlined />}
              formatter={(value) => `${Number(value).toLocaleString('vi-VN')}đ`}
              valueStyle={{ color: '#faad14' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tỷ lệ hoạt động"
              value={downlineData ? Math.round((downlineData.activeDownlines / Math.max(downlineData.totalDownlines, 1)) * 100) : 0}
              suffix="%"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#722ed1' }}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      {/* Level Breakdown */}
      {stats && (
        <Card title="Phân bố theo cấp độ" loading={statsLoading}>
          <Row gutter={[16, 16]}>
            {stats.levelBreakdown.map((level) => (
              <Col xs={12} sm={8} md={6} key={level.level}>
                <Card size="small">
                  <Statistic
                    title={`Cấp F${level.level}`}
                    value={level.count}
                    prefix={<UserOutlined />}
                    valueStyle={{ fontSize: '18px' }}
                  />
                  <Progress 
                    percent={Math.round((level.count / Math.max(stats.totalDownlines, 1)) * 100)} 
                    size="small" 
                    showInfo={false}
                  />
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* Privacy Notice */}
      <Alert
        message="Thông tin bảo mật"
        description="Chúng tôi chỉ hiển thị thông tin hiệu suất và metrics cần thiết để bảo vệ quyền riêng tư của các thành viên trong team. Không có thông tin cá nhân nào được tiết lộ."
        type="info"
        showIcon
        closable
      />

      {/* Downline Tree */}
      <Card 
        title={
          <div className="flex items-center space-x-2">
            <BranchesOutlined />
            <span>Cây Downline</span>
          </div>
        } 
        loading={loading}
      >
        {treeNodes && treeNodes.length > 0 ? (
          <div className="bg-gray-50 p-4 rounded-lg">
            <Tree
              showIcon
              defaultExpandAll
              treeData={treeNodes}
              style={{
                background: 'transparent',
                fontSize: '14px'
              }}
            />
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <BranchesOutlined className="text-4xl mb-2" />
            <p>Chưa có downline nào</p>
            <p className="text-sm">Chia sẻ link affiliate của bạn để bắt đầu xây dựng team</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default UserAffiliateTree;
  