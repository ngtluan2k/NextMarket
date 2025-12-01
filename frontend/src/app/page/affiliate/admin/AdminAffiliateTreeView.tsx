import React, { useEffect, useState, useMemo } from 'react';
import {
  Card,
  message,
  Button,
  Statistic,
  Row,
  Col,
  Tag,
  Divider,
  Avatar,
  Descriptions,
  Tooltip,
  Select,
  Space,
  Input,
  Empty,
} from 'antd';
import {
  ReloadOutlined,
  UserOutlined,
  DollarOutlined,
  TeamOutlined,
  MailOutlined,
  CalendarOutlined,
  BranchesOutlined,
  CheckCircleOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  fetchFullAffiliateTree,
  fetchUserTreeNodeDetails,
  fetchRootUser,
} from '../../../../service/afiliate/affiliate-tree.service';
import dayjs from 'dayjs';

interface TreeNode {
  userId: number;
  email: string;
  username: string;
  level: number;
  path: string;
  commission: {
    totalEarned: number;
    totalPending: number;
    totalPaid: number;
    currentLevel: number;
    ratePercent: number;
  };
}

interface UserNodeDetails {
  id: number;
  email: string;
  username: string;
  createdAt: string;
  commission: {
    totalEarned: number;
    totalPending: number;
    totalPaid: number;
    ratePercent: number;
  };
  directReferrals: number;
  totalDownlines: number;
}

const { Option } = Select;

export default function AdminAffiliateTreeView() {
  const [loading, setLoading] = useState(false);
  const [rootUserLoading, setRootUserLoading] = useState(false);
  const [treeNodes, setTreeNodes] = useState<TreeNode[]>([]);
  const [rootUser, setRootUser] = useState<any>(null);
  const [selectedNodeDetails, setSelectedNodeDetails] =
    useState<UserNodeDetails | null>(null);
  const [nodeDetailsLoading, setNodeDetailsLoading] = useState(false);
  const [maxDepth, setMaxDepth] = useState(10);
  const [searchEmail, setSearchEmail] = useState('');
  const [highlightedUserId, setHighlightedUserId] = useState<number | null>(null);
  const [msg, contextHolder] = message.useMessage();

  // Load root user and full affiliate tree on component mount
  useEffect(() => {
    loadRootUser();
    loadFullTree();
  }, []);

  const loadRootUser = async () => {
    setRootUserLoading(true);
    try {
      console.log('🌳 Loading root user...');
      const response = await fetchRootUser();
      setRootUser(response.data);
      console.log('✅ Root user loaded:', response.data);
    } catch (error: any) {
      console.error('❌ Error loading root user:', error);
      msg.error(error?.message || 'Failed to load root user');
    } finally {
      setRootUserLoading(false);
    }
  };

  const loadFullTree = async () => {
    setLoading(true);
    try {
      console.log('🌳 Loading full affiliate tree...');
      const response = await fetchFullAffiliateTree(maxDepth);
      const nodes = response.data.tree || [];

      console.log('📊 Tree nodes fetched:', nodes.length);
      setTreeNodes(nodes);
      msg.success(`✅ Loaded ${nodes.length} users in affiliate tree`);

      // Auto-select root node
      if (nodes.length > 0) {
        const rootNode = nodes[0];
        loadNodeDetails(rootNode.userId);
      }
    } catch (error: any) {
      console.error('❌ Error loading tree:', error);
      msg.error(error?.message || 'Failed to load affiliate tree');
    } finally {
      setLoading(false);
    }
  };

  // Group data by level
  const levelGroups = useMemo(() => {
    const groups: Record<number, TreeNode[]> = {};
    treeNodes.forEach((item: TreeNode) => {
      // Skip root node (level 0)
      if (item.level === 0) {
        return;
      }
      
      if (!groups[item.level]) {
        groups[item.level] = [];
      }
      groups[item.level].push(item);
    });
    return groups;
  }, [treeNodes]);

  const levels = useMemo(() => {
    return Object.keys(levelGroups)
      .map(Number)
      .sort((a, b) => a - b);
  }, [levelGroups]);

  const loadNodeDetails = async (userId: number) => {
    setNodeDetailsLoading(true);
    try {
      console.log(`👤 Loading details for user ${userId}...`);
      const response = await fetchUserTreeNodeDetails(userId);
      setSelectedNodeDetails(response.data);
      console.log('✅ Node details loaded:', response.data);
    } catch (error: any) {
      console.error('❌ Error loading node details:', error);
      msg.error(error?.message || 'Failed to load user details');
      setSelectedNodeDetails(null);
    } finally {
      setNodeDetailsLoading(false);
    }
  };

  const handleSearchUser = () => {
    if (!searchEmail.trim()) {
      msg.warning('Vui lòng nhập email để tìm kiếm');
      return;
    }

    const foundUser = treeNodes.find(
      (node) => node.email.toLowerCase() === searchEmail.toLowerCase()
    );

    if (!foundUser) {
      msg.error(`Không tìm thấy user với email: ${searchEmail}`);
      setHighlightedUserId(null);
      return;
    }

    // Highlight the user
    setHighlightedUserId(foundUser.userId);
    loadNodeDetails(foundUser.userId);

    // Scroll to the highlighted node
    setTimeout(() => {
      const element = document.getElementById(`user-card-${foundUser.userId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('animate-pulse');
        setTimeout(() => {
          element.classList.remove('animate-pulse');
        }, 2000);
      }
    }, 100);

    msg.success(`Tìm thấy user: ${foundUser.email}`);
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN', {
      style: 'currency',
      currency: 'VND',
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return dayjs(dateString).format('DD/MM/YYYY HH:mm');
  };

  return (
    <div className="space-y-6 p-4">
      {contextHolder}

      {/* Header */}
      <Card>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold mb-2">🌳 Toàn bộ Cây Affiliate</h2>
              <p className="text-gray-600">
                Hiển thị toàn bộ cây affiliate từ root user. Hệ thống chỉ có 1 cây affiliate duy nhất.
              </p>
            </div>
            <Space>
              <Select
                placeholder="Độ sâu tối đa"
                value={maxDepth}
                onChange={(value) => {
                  setMaxDepth(value);
                }}
                style={{ width: 120 }}
              >
                <Option value={3}>3 cấp</Option>
                <Option value={5}>5 cấp</Option>
                <Option value={7}>7 cấp</Option>
                <Option value={10}>10 cấp</Option>
              </Select>
              <Button 
                type="primary"
                icon={<ReloadOutlined />} 
                onClick={loadFullTree}
                loading={loading || rootUserLoading}
              >
                Làm mới
              </Button>
            </Space>
          </div>

          {/* Search Bar */}
          <div className="flex gap-2">
            <Input
              placeholder="Tìm kiếm user theo email..."
              prefix={<SearchOutlined />}
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              onPressEnter={handleSearchUser}
              style={{ flex: 1 }}
            />
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearchUser}
            >
              Tìm kiếm
            </Button>
          </div>
        </div>
      </Card>

      {/* Root User Info Card */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <UserOutlined />
            <span>Root User của Cây Affiliate</span>
          </div>
        }
        loading={rootUserLoading}
      >
        {rootUser ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-lg">{rootUser.username}</p>
              <p className="text-gray-600">{rootUser.email}</p>
              {rootUser.isSystemRoot && (
                <Tag color="green" className="mt-2">
                  ✓ System Root
                </Tag>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Tạo lúc:</p>
              <p className="font-semibold">
                {dayjs(rootUser.createdAt).format('DD/MM/YYYY HH:mm')}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">Không tìm thấy root user</p>
        )}
      </Card>

      {/* Tree Visualization */}
      <Card 
        title={
          <div className="flex items-center space-x-2">
            <BranchesOutlined />
            <span>Biểu đồ Cây Affiliate</span>
          </div>
        } 
        loading={loading}
      >
        {treeNodes && treeNodes.length > 0 ? (
          <div className="space-y-6">
            {/* Root Node */}
            <div className="flex flex-col items-center">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg px-6 py-4 shadow-lg mb-4">
                <div className="flex items-center gap-2">
                  <UserOutlined className="text-xl" />
                  <span className="font-semibold">{rootUser?.username || 'Root'} (Root)</span>
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
                totalCommission: levelData.reduce(
                  (sum: number, d: TreeNode) => sum + (d.commission?.totalEarned || 0),
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
                        {levelStats.total} thành viên
                      </span>
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                        Hoa hồng: {Number(levelStats.totalCommission).toLocaleString('vi-VN', {
                          notation: 'compact',
                        })}đ
                      </span>
                    </div>
                  </div>

                  {/* Level Nodes Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {levelData.map((member: TreeNode, index: number) => {
                      const isHighlighted = highlightedUserId === member.userId;
                      return (
                        <Tooltip
                          key={`${level}-${member.userId}-${index}`}
                          title={
                            <div className="text-sm space-y-1">
                              <div className="font-semibold">{member.email}</div>
                              <Divider style={{ margin: '4px 0' }} />
                              <div>
                                <strong>User ID:</strong> {member.userId}
                              </div>
                              <div>
                                <strong>Hoa hồng:</strong>{' '}
                                {Number(member.commission?.totalEarned || 0).toLocaleString('vi-VN')}đ
                              </div>
                              <div>
                                <strong>Chờ xử lý:</strong>{' '}
                                {Number(member.commission?.totalPending || 0).toLocaleString('vi-VN')}đ
                              </div>
                              <div>
                                <strong>Đã thanh toán:</strong>{' '}
                                {Number(member.commission?.totalPaid || 0).toLocaleString('vi-VN')}đ
                              </div>
                            </div>
                          }
                          placement="top"
                        >
                          <div
                            id={`user-card-${member.userId}`}
                            onClick={() => loadNodeDetails(member.userId)}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-lg ${
                              isHighlighted
                                ? 'border-yellow-400 bg-yellow-100 shadow-lg ring-2 ring-yellow-300'
                                : 'border-blue-300 bg-blue-50 hover:bg-blue-100'
                            }`}
                          >
                            <div className="flex items-start gap-2 mb-2">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs"
                                style={{
                                  backgroundColor: isHighlighted ? '#faad14' : '#52c41a',
                                }}
                              >
                                {member.userId}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-sm truncate">
                                  {member.email}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {Number(member.commission?.totalEarned || 0).toLocaleString('vi-VN', {
                                    notation: 'compact',
                                  })}đ
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-1 flex-wrap">
                              <Tag color={isHighlighted ? 'gold' : 'green'} icon={<CheckCircleOutlined />}>
                                {isHighlighted ? '⭐ Được chọn' : 'Hoạt động'}
                              </Tag>
                              <Tag color="blue">F{level}</Tag>
                            </div>
                          </div>
                        </Tooltip>
                      );
                    })}
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
          </div>
        )}
      </Card>

      {/* Node Details Panel */}
      {selectedNodeDetails && (
        <Card
          title="Thông tin Chi tiết Node"
          loading={nodeDetailsLoading}
        >
          <div className="space-y-4">
            {/* User Info */}
            <div className="text-center">
              <Avatar
                size={80}
                icon={<UserOutlined />}
                className="mb-3"
              />
              <h3 className="text-lg font-semibold mb-1">
                {selectedNodeDetails.username || 'N/A'}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                {selectedNodeDetails.email}
              </p>
            </div>

            <Divider />

            {/* Basic Info */}
            <Descriptions column={1} size="small">
              <Descriptions.Item
                label={
                  <>
                    <MailOutlined className="mr-1" />
                    Email
                  </>
                }
              >
                {selectedNodeDetails.email}
              </Descriptions.Item>

              <Descriptions.Item
                label={
                  <>
                    <CalendarOutlined className="mr-1" />
                    Ngày tạo
                  </>
                }
              >
                {formatDate(selectedNodeDetails.createdAt)}
              </Descriptions.Item>

              <Descriptions.Item
                label={
                  <>
                    <TeamOutlined className="mr-1" />
                    F1 Trực tiếp
                  </>
                }
              >
                <Tag color="blue">{selectedNodeDetails.directReferrals}</Tag>
              </Descriptions.Item>

              <Descriptions.Item
                label={
                  <>
                    <TeamOutlined className="mr-1" />
                    Tổng Downlines
                  </>
                }
              >
                <Tag color="cyan">{selectedNodeDetails.totalDownlines}</Tag>
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            {/* Commission Info */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center">
                <DollarOutlined className="mr-2" />
                Thông tin Hoa hồng
              </h4>

              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Statistic
                    title="Đã kiếm"
                    value={selectedNodeDetails.commission.totalEarned}
                    formatter={(value) =>
                      formatCurrency(Number(value))
                    }
                    valueStyle={{ color: '#52c41a', fontSize: '14px' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Chờ xử lý"
                    value={selectedNodeDetails.commission.totalPending}
                    formatter={(value) =>
                      formatCurrency(Number(value))
                    }
                    valueStyle={{ color: '#faad14', fontSize: '12px' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Đã thanh toán"
                    value={selectedNodeDetails.commission.totalPaid}
                    formatter={(value) =>
                      formatCurrency(Number(value))
                    }
                    valueStyle={{ color: '#1890ff', fontSize: '12px' }}
                  />
                </Col>
              </Row>
            </div>
          </div>
        </Card>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}
