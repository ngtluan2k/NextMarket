import React, { useEffect, useState } from 'react';
import {
  Card,
  Tree,
  message,
  Button,
  Statistic,
  Row,
  Col,
  Tag,
  Divider,
  Avatar,
  Descriptions,
} from 'antd';
import {
  ReloadOutlined,
  UserOutlined,
  DollarOutlined,
  TeamOutlined,
  MailOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import type { TreeDataNode } from 'antd';
import {
  fetchFullAffiliateTree,
  fetchUserTreeNodeDetails,
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

export default function AdminAffiliateTreeView() {
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState<TreeDataNode[]>([]);
  const [selectedNodeDetails, setSelectedNodeDetails] =
    useState<UserNodeDetails | null>(null);
  const [nodeDetailsLoading, setNodeDetailsLoading] = useState(false);
  const [msg, contextHolder] = message.useMessage();

  // Load full affiliate tree on component mount
  useEffect(() => {
    loadFullTree();
  }, []);

  const loadFullTree = async () => {
    setLoading(true);
    try {
      console.log('🌳 Loading full affiliate tree...');
      const response = await fetchFullAffiliateTree(10);
      const treeNodes = response.data.tree || [];

      console.log('📊 Tree nodes fetched:', treeNodes.length);

      // Build tree structure from flat list
      const treeMap = new Map<number, TreeDataNode>();
      const rootNodes: TreeDataNode[] = [];

      // First pass: create all nodes
      treeNodes.forEach((node: TreeNode) => {
        const treeNode: TreeDataNode = {
          title: renderNodeTitle(node),
          key: `node-${node.userId}`,
          children: [],
        };
        treeMap.set(node.userId, treeNode);
      });

      // Second pass: build hierarchy
      treeNodes.forEach((node: TreeNode) => {
        if (node.level === 0) {
          // Root node
          rootNodes.push(treeMap.get(node.userId)!);
        } else {
          // Find parent from path
          const pathIds = node.path.split(',').map(Number);
          if (pathIds.length > 1) {
            const parentId = pathIds[pathIds.length - 2];
            const parentNode = treeMap.get(parentId);
            if (parentNode) {
              if (!parentNode.children) {
                parentNode.children = [];
              }
              parentNode.children.push(treeMap.get(node.userId)!);
            }
          }
        }
      });

      setTreeData(rootNodes);
      msg.success(`✅ Loaded ${treeNodes.length} users in affiliate tree`);

      // Auto-select root node
      if (rootNodes.length > 0 && treeNodes.length > 0) {
        const rootNode = treeNodes[0];
        loadNodeDetails(rootNode.userId);
      }
    } catch (error: any) {
      console.error('❌ Error loading tree:', error);
      msg.error(error?.message || 'Failed to load affiliate tree');
    } finally {
      setLoading(false);
    }
  };

  const renderNodeTitle = (node: TreeNode) => {
    return (
      <div className="flex items-center justify-between w-full pr-4">
        <div className="flex items-center gap-2">
          <UserOutlined />
          <span className="font-medium">{node.email}</span>
          {node.level === 0 && (
            <Tag color="green" className="ml-2">
              🌳 Root
            </Tag>
          )}
          <Tag color="blue" className="ml-1">
            Level {node.level}
          </Tag>
        </div>
        <div className="text-xs text-gray-600 flex items-center gap-2">
          <span className="text-green-600 font-medium">
            {node.commission.totalEarned.toLocaleString()}đ
          </span>
          <span className="text-yellow-600">
            {node.commission.totalPending.toLocaleString()}đ
          </span>
        </div>
      </div>
    );
  };

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

  const handleNodeSelect = (selectedKeys: React.Key[]) => {
    if (selectedKeys.length > 0) {
      const key = selectedKeys[0] as string;
      const userId = parseInt(key.replace('node-', ''));
      loadNodeDetails(userId);
    }
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
    <div style={{ padding: '16px' }}>
      {contextHolder}

      {/* Header */}
      <Card
        style={{ marginBottom: '16px' }}
        title={
          <div className="flex items-center gap-2">
            <span role="img" aria-label="tree">
              🌳
            </span>
            <span>Toàn bộ Cây Affiliate</span>
          </div>
        }
        extra={
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={loadFullTree}
            loading={loading}
          >
            Tải lại
          </Button>
        }
      >
        <p className="text-gray-600 text-sm mb-0">
          Hiển thị toàn bộ cây affiliate từ root node. Hệ thống chỉ có 1 cây
          affiliate duy nhất, không được lọc theo chương trình.
        </p>
      </Card>

      {/* Main Content */}
      <div style={{ display: 'flex', gap: '16px' }}>
        {/* Left: Tree View */}
        <div style={{ flex: 1 }}>
          <Card
            title="Cấu trúc Cây Affiliate"
            loading={loading}
            style={{ minHeight: '600px' }}
          >
            {treeData.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <TeamOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                <p>Không có dữ liệu cây affiliate</p>
              </div>
            ) : (
              <Tree
                treeData={treeData}
                onSelect={handleNodeSelect}
                defaultExpandAll={false}
                defaultExpandedKeys={
                  treeData.length > 0 ? [treeData[0].key as React.Key] : []
                }
                showIcon={false}
              />
            )}
          </Card>
        </div>

        {/* Right: Node Details */}
        <div style={{ width: '380px' }}>
          <Card
            title="Thông tin Node"
            loading={nodeDetailsLoading}
            style={{ minHeight: '600px' }}
          >
            {selectedNodeDetails ? (
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
            ) : (
              <div className="text-center text-gray-500 py-8">
                <UserOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                <p>Chọn một node để xem chi tiết</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
