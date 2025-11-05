import React, { useState } from 'react';
import { Tree, Tag, Card, Statistic, Row, Col } from 'antd';
import type { TreeDataNode, TreeProps } from 'antd';
import { DollarOutlined} from '@ant-design/icons';

interface CommissionInfo {
  totalEarned: number;
  totalPending: number;
  totalPaid: number;
  currentLevel: number;
  ratePercent: number;
}

interface UserInfo {
  id: number;
  uuid: string;
  user_id: number;
  full_name: string;
  dob: string;
  phone: string;
  gender: string;
  avatar_url: string | null;
  country: string;
  created_at: string;
  user: {
    id: number;
    uuid: string;
    username: string;
    email: string;
    status: string;
    code: string;
    created_at: string;
    updated_at: string | null;
    is_affiliate: boolean;
  };
}

interface AffiliateTreeNode {
  userId: number;
  level: number;
  user: UserInfo | null;
  commission: CommissionInfo;
}

interface Props {
  treeData: TreeDataNode[];
  defaultExpandAll?: boolean;
  showCommissions?: boolean;
  commissionData?: {
    rootUser: AffiliateTreeNode;
    ancestors: AffiliateTreeNode[];
    descendants: AffiliateTreeNode[];
  };
  onUserSelect?: (userId: number, commissionInfo?: CommissionInfo) => void;
}

const AffiliateTree = ({ treeData, defaultExpandAll = true, showCommissions = false, commissionData, onUserSelect }: Props) => {
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>(['0-0-0', '0-0-1']);
  const [checkedKeys, setCheckedKeys] = useState<React.Key[]>(['0-0-0']);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [autoExpandParent, setAutoExpandParent] = useState<boolean>(true);

  const onExpand: TreeProps['onExpand'] = (expandedKeysValue) => {
    console.log('onExpand', expandedKeysValue);
    setExpandedKeys(expandedKeysValue);
    setAutoExpandParent(false);
  };

  const onCheck: TreeProps['onCheck'] = (checkedKeysValue) => {
    console.log('onCheck', checkedKeysValue);
    setCheckedKeys(checkedKeysValue as React.Key[]);
  };

  const onSelect: TreeProps['onSelect'] = (selectedKeysValue, info) => {
    console.log('onSelect', info);
    setSelectedKeys(selectedKeysValue);
    
    // Emit event khi user click vào node
    if (onUserSelect && info.node) {
      const nodeKey = info.node.key as string;
      console.log('🔍 Node clicked with key:', nodeKey);
      
      // Tìm userId từ key của node
      let userId: number | null = null;
      let commissionInfo: CommissionInfo | undefined = undefined;
      
      // Parse userId từ key - cải thiện logic parsing
      if (nodeKey.startsWith('root-')) {
        // Root user: "root-123"
        userId = parseInt(nodeKey.replace('root-', ''));
        if (commissionData) {
          commissionInfo = commissionData.rootUser.commission;
        }
      } else if (nodeKey.startsWith('ancestors-') || nodeKey.startsWith('descendants-')) {
        // Parent nodes: "ancestors-123" hoặc "descendants-123"
        // Không có userId cụ thể, skip
        console.log('⚠️ Clicked on parent node, no specific user');
        return;
      } else if (nodeKey.includes('-')) {
        // Child nodes: "123-0", "123-1", etc.
        const parts = nodeKey.split('-');
        if (parts.length >= 2) {
          userId = parseInt(parts[0]); // userId là phần đầu
          
          // Tìm commission info từ commissionData
          if (commissionData) {
            const allUsers = [commissionData.rootUser, ...commissionData.ancestors, ...commissionData.descendants];
            const user = allUsers.find(u => u.userId === userId);
            if (user) {
              commissionInfo = user.commission;
            }
          }
        }
      } else {
        // Fallback: thử parse toàn bộ key làm userId
        const parsed = parseInt(nodeKey);
        if (!isNaN(parsed)) {
          userId = parsed;
        }
      }
      
      console.log('🔍 Parsed userId:', userId, 'commissionInfo:', commissionInfo);
      
      if (userId && onUserSelect) {
        onUserSelect(userId, commissionInfo);
      }
    }
  };

  // Render commission info cho một node
  const renderCommissionInfo = (commission: CommissionInfo) => {
    if (!showCommissions) return null;
    
    return (
      <div className="ml-2 text-xs text-gray-600">
        <div className="flex items-center gap-2 mb-1">
          <Tag color="blue">
            Level {commission.currentLevel}
          </Tag>
          <Tag color="green" >
            {commission.ratePercent}%
          </Tag>
        </div>
        <div className="mt-1 space-y-1">
          <div className="flex items-center gap-1">
            <DollarOutlined className="text-green-500" />
            <span className="font-medium">Đã kiếm: {commission.totalEarned.toLocaleString()}đ</span>
          </div>
          <div className="flex items-center gap-1">
            <DollarOutlined className="text-yellow-500" />
            <span className="font-medium">Chờ xử lý: {commission.totalPending.toLocaleString()}đ</span>
          </div>
          <div className="flex items-center gap-1">
            <DollarOutlined className="text-blue-500" />
            <span className="font-medium">Đã thanh toán: {commission.totalPaid.toLocaleString()}đ</span>
          </div>
        </div>
      </div>
    );
  };

  // Render commission summary card
  const renderCommissionSummary = () => {
    if (!showCommissions || !commissionData) return null;

    const { rootUser, ancestors, descendants } = commissionData;
    const totalEarned = rootUser.commission.totalEarned + 
      ancestors.reduce((sum, a) => sum + a.commission.totalEarned, 0) +
      descendants.reduce((sum, d) => sum + d.commission.totalEarned, 0);

    const totalPending = rootUser.commission.totalPending + 
      ancestors.reduce((sum, a) => sum + a.commission.totalPending, 0) +
      descendants.reduce((sum, d) => sum + d.commission.totalPending, 0);

    const totalPaid = rootUser.commission.totalPaid + 
      ancestors.reduce((sum, a) => sum + a.commission.totalPaid, 0) +
      descendants.reduce((sum, d) => sum + d.commission.totalPaid, 0);

    return (
      <div>
        <div style={{ marginBottom: 12, padding: 12, backgroundColor: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: 6 }}>
          <p style={{ margin: 0, color: '#1890ff' }}>
            <strong><span role="img" aria-label="magnifying glass">🔍</span> Mục đích:</strong> Hiển thị hoa hồng thực tế đã được tính toán và phân bổ cho từng cấp affiliate. 
            Đây là góc nhìn cụ thể cho admin để theo dõi hiệu suất và thu nhập thực tế của hệ thống affiliate.
          </p>
        </div>
        <Card title="Tổng quan Hoa hồng Thực tế" size="small" className="mb-4">
          <Row gutter={16}>
            <Col span={8}>
              <Statistic
                title="Tổng đã kiếm"
                value={totalEarned}
                precision={0}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#3f8600' }}
                formatter={(value) => `${Number(value).toLocaleString('vi-VN')}đ`}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Tổng chờ xử lý"
                value={totalPending}
                precision={0}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#cf1322' }}
                formatter={(value) => `${Number(value).toLocaleString('vi-VN')}đ`}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Tổng đã thanh toán"
                value={totalPaid}
                precision={0}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#1890ff' }}
                formatter={(value) => `${Number(value).toLocaleString('vi-VN')}đ`}
              />
            </Col>
          </Row>
        </Card>
      </div>
    );
  };

  if (!treeData || treeData.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 border rounded-md">
        Nhập User ID và nhấn "Xem cây" để hiển thị.
      </div>
    );
  }

  return (
    <div>
      {renderCommissionSummary()}
      <Tree
        checkable
        onExpand={onExpand}
        expandedKeys={expandedKeys}
        autoExpandParent={autoExpandParent}
        onCheck={onCheck}
        checkedKeys={checkedKeys}
        onSelect={onSelect}
        selectedKeys={selectedKeys}
        treeData={treeData}
      />
    </div>
  );
};

export default AffiliateTree;
