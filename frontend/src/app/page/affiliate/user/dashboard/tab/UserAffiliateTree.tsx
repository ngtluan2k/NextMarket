import React, { useEffect, useState, useMemo } from 'react';
import { 
  Card, 
  Tag, 
  Statistic, 
  Row, 
  Col, 
  Alert, 
  Select, 
  Button,
  Space,
  Progress,
  Tooltip,
  Badge,
  Divider
} from 'antd';
import { 
  TeamOutlined, 
  TrophyOutlined, 
  DollarOutlined, 
  UserOutlined,
  ReloadOutlined,
  BranchesOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
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

  // Group data by level (filter out self-references)
  const levelGroups = useMemo(() => {
    const groups: Record<number, any[]> = {};
    (downlineData?.tree || []).forEach((item: any) => {
      // Skip if this is a self-reference (shouldn't happen but just in case)
      if (item.level === 0) {
        console.warn('⚠️ Skipping self-reference in tree:', item);
        return;
      }
      
      if (!groups[item.level]) {
        groups[item.level] = [];
      }
      groups[item.level].push(item);
    });
    return groups;
  }, [downlineData]);

  const levels = useMemo(() => {
    return Object.keys(levelGroups)
      .map(Number)
      .sort((a, b) => a - b);
  }, [levelGroups]);

  // Get tier color
  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      bronze: '#CD7F32',
      silver: '#C0C0C0',
      gold: '#FFD700',
      platinum: '#E5E4E2',
    };
    return colors[tier] || '#999';
  };

  const getTierLabel = (tier: string) => {
    const labels: Record<string, string> = {
      bronze: 'Bronze',
      silver: 'Silver',
      gold: 'Gold',
      platinum: 'Platinum',
    };
    return labels[tier] || tier;
  };

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

      {/* Downline Tree Visualization */}
      <Card 
        title={
          <div className="flex items-center space-x-2">
            <BranchesOutlined />
            <span>Biểu đồ Cây Affiliate</span>
          </div>
        } 
        loading={loading}
      >
        {downlineData && downlineData.tree && downlineData.tree.length > 0 ? (
          <div className="space-y-6">
            {/* Root Node */}
            <div className="flex flex-col items-center">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg px-6 py-4 shadow-lg mb-4">
                <div className="flex items-center gap-2">
                  <UserOutlined className="text-xl" />
                  <span className="font-semibold">Bạn (Root)</span>
                </div>
              </div>
              {levels.length > 0 && (
                <div className="text-2xl text-gray-400 mb-4">↓</div>
              )}
            </div>

            {/* Level Nodes */}
            {levels.map((level) => {
              const levelData = levelGroups[level];
              const levelStats = {
                total: levelData.length,
                active: levelData.filter((d: any) => d.status === 'active').length,
                totalRevenue: levelData.reduce((sum: number, d: any) => sum + d.totalRevenue, 0),
                totalCommission: levelData.reduce(
                  (sum: number, d: any) => sum + d.totalCommissionGenerated,
                  0
                ),
              };

              return (
                <div key={`level-${level}`} className="space-y-4">
                  {/* Level Header */}
                  <div className="flex flex-col items-center gap-2 mb-4">
                    <div className="bg-gray-100 px-4 py-2 rounded-full">
                      <span className="font-semibold text-gray-700">Cấp F{level}</span>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-center text-xs">
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {levelStats.active}/{levelStats.total} hoạt động
                      </span>
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                        {Number(levelStats.totalRevenue).toLocaleString('vi-VN', {
                          notation: 'compact',
                        })}
                        đ
                      </span>
                      <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                        Hoa hồng: {Number(levelStats.totalCommission).toLocaleString('vi-VN', {
                          notation: 'compact',
                        })}
                        đ
                      </span>
                    </div>
                  </div>

                  {/* Level Nodes Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {levelData.map((member: any, index: number) => (
                      <Tooltip
                        key={`${level}-${member.affiliateCode}-${index}`}
                        title={
                          <div className="text-sm space-y-1">
                            <div className="font-semibold">{member.affiliateCode}</div>
                            <Divider style={{ margin: '4px 0' }} />
                            <div>
                              <strong>Trạng thái:</strong>{' '}
                              {member.status === 'active' ? (
                                <span className="text-green-400">✓ Hoạt động</span>
                              ) : (
                                <span className="text-red-400">✗ Không hoạt động</span>
                              )}
                            </div>
                            <div>
                              <strong>Đơn hàng:</strong> {member.totalOrders}
                            </div>
                            <div>
                              <strong>Doanh thu:</strong>{' '}
                              {Number(member.totalRevenue).toLocaleString('vi-VN')}đ
                            </div>
                            <div>
                              <strong>Hoa hồng:</strong>{' '}
                              {Number(member.totalCommissionGenerated).toLocaleString('vi-VN')}đ
                            </div>
                            <div>
                              <strong>Tham gia:</strong>{' '}
                              {new Date(member.joinedDate).toLocaleDateString('vi-VN')}
                            </div>
                            <div>
                              <strong>Downline trực tiếp:</strong> {member.directReferrals}
                            </div>
                            <div>
                              <strong>Tổng downline:</strong> {member.totalDownlines}
                            </div>
                          </div>
                        }
                        placement="top"
                      >
                        <div
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-lg ${
                            member.status === 'active'
                              ? 'border-green-400 bg-green-50 hover:bg-green-100'
                              : 'border-gray-300 bg-gray-50 hover:bg-gray-100 opacity-70'
                          }`}
                        >
                          <div className="flex items-start gap-2 mb-2">
                            <Badge
                              count={
                                <span
                                  className="text-xs font-bold text-white rounded-full w-5 h-5 flex items-center justify-center"
                                  style={{
                                    backgroundColor: getTierColor(member.performanceTier),
                                  }}
                                >
                                  {getTierLabel(member.performanceTier)[0]}
                                </span>
                              }
                            >
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                                style={{
                                  backgroundColor:
                                    member.status === 'active' ? '#52c41a' : '#bfbfbf',
                                }}
                              >
                                <UserOutlined className="text-sm" />
                              </div>
                            </Badge>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm truncate">
                                {member.affiliateCode}
                              </div>
                              <div className="text-xs text-gray-600">
                                {member.totalOrders} đơn •{' '}
                                {Number(member.totalRevenue).toLocaleString('vi-VN', {
                                  notation: 'compact',
                                })}
                                đ
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1 flex-wrap">
                            {member.status === 'active' ? (
                              <Tag color="green" icon={<CheckCircleOutlined />}>
                                Hoạt động
                              </Tag>
                            ) : (
                              <Tag color="default" icon={<CloseCircleOutlined />}>
                                Không hoạt động
                              </Tag>
                            )}
                            <Tag color="blue">F{level}</Tag>
                          </div>
                        </div>
                      </Tooltip>
                    ))}
                  </div>

                  {/* Connector to next level */}
                  {level < Math.max(...levels) && (
                    <div className="flex justify-center py-4">
                      <div className="text-2xl text-gray-400">↓</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <BranchesOutlined className="text-5xl mb-4" />
            <p className="text-lg font-semibold">Chưa có downline nào</p>
            <p className="text-sm">Chia sẻ link affiliate của bạn để bắt đầu xây dựng team</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default UserAffiliateTree;
  