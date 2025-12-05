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
  Select,
  Space,
  Input,
} from 'antd';
import {
  ReloadOutlined,
  UserOutlined,
  DollarOutlined,
  TeamOutlined,
  MailOutlined,
  CalendarOutlined,
  BranchesOutlined,
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
  parentId?: number;
  children?: TreeNode[];
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

// Tree Node Renderer Component
interface TreeNodeRendererProps {
  node: TreeNode;
  highlightedUserId: number | null;
  onNodeClick: (userId: number) => void;
  depth?: number;
}

const TreeNodeRenderer: React.FC<TreeNodeRendererProps> = ({
  node,
  highlightedUserId,
  onNodeClick,
  depth = 0,
}) => {
  const isHighlighted = highlightedUserId === node.userId;
  const hasChildren = node.children && node.children.length > 0;
  const isRoot = depth === 0;

  return (
    <div className="flex flex-col items-center">
      {/* Node Card */}
      <div
        id={`user-card-${node.userId}`}
        onClick={() => onNodeClick(node.userId)}
        className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-lg min-w-max ${
          isHighlighted
            ? 'border-yellow-400 bg-yellow-100 shadow-lg ring-2 ring-yellow-300'
            : isRoot
            ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 shadow-md'
            : 'border-green-300 bg-green-50 hover:bg-green-100'
        }`}
      >
        <div className="flex items-start gap-2 mb-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0"
            style={{
              backgroundColor: isHighlighted ? '#faad14' : isRoot ? '#1890ff' : '#52c41a',
            }}
          >
            {node.userId}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate">
              {node.email}
            </div>
            <div className="text-xs text-gray-600">
              {Number(node.commission?.totalEarned || 0).toLocaleString('vi-VN', {
                notation: 'compact',
              })}đ
            </div>
          </div>
        </div>
        <div className="flex gap-1 flex-wrap">
          <Tag color={isHighlighted ? 'gold' : isRoot ? 'blue' : 'green'}>
            {isRoot ? '🌳 Root' : `F${node.level}`}
          </Tag>
          {hasChildren && (
            <Tag color="cyan">
              👥 {node.children?.length}
            </Tag>
          )}
        </div>
      </div>

      {/* Children */}
      {hasChildren && (
        <div className="mt-6 flex flex-col items-center">
          {/* Connector line */}
          <div className="w-1 h-6 bg-gray-300"></div>

          {/* Children container */}
          <div className="flex gap-8 flex-wrap justify-center mt-2">
            {node.children?.map((child) => (
              <div key={child.userId} className="flex flex-col items-center">
                {/* Horizontal line from parent */}
                <div className="h-1 w-12 bg-gray-300 mb-2"></div>

                {/* Vertical line to child */}
                <div className="w-1 h-4 bg-gray-300 mb-2"></div>

                {/* Recursive child node */}
                <TreeNodeRenderer
                  node={child}
                  highlightedUserId={highlightedUserId}
                  onNodeClick={onNodeClick}
                  depth={depth + 1}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

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

  // Build hierarchical tree structure
  const hierarchicalTree = useMemo(() => {
    const nodeMap = new Map<number, TreeNode>();
    
    // Create map of all nodes
    treeNodes.forEach((node) => {
      nodeMap.set(node.userId, { ...node, children: [] });
    });

    // Build parent-child relationships
    treeNodes.forEach((node) => {
      if (node.level > 0 && node.path) {
        // Extract parent ID from path (path format: "1,2,3" where 1 is root, 2 is parent of 3)
        const pathParts = node.path.split(',').map(Number);
        if (pathParts.length > 1) {
          const parentId = pathParts[pathParts.length - 2];
          const parentNode = nodeMap.get(parentId);
          if (parentNode && !parentNode.children?.find(c => c.userId === node.userId)) {
            parentNode.children?.push(nodeMap.get(node.userId)!);
          }
        }
      }
    });

    // Return root node
    return nodeMap.get(treeNodes[0]?.userId) || null;
  }, [treeNodes]);

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
            <span>Biểu đồ Cây Affiliate (Phân cấp)</span>
          </div>
        } 
        loading={loading}
      >
        {treeNodes && treeNodes.length > 0 && hierarchicalTree ? (
          <div className="space-y-4 overflow-x-auto">
            <div className="inline-block min-w-full">
              <TreeNodeRenderer 
                node={hierarchicalTree}
                highlightedUserId={highlightedUserId}
                onNodeClick={loadNodeDetails}
              />
            </div>
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
