import React, { useState } from 'react';
import { Tree, Tooltip, Tag, Card, Statistic, Row, Col } from 'antd';
import type { TreeDataNode, TreeProps } from 'antd';
import { DollarOutlined, UserOutlined, PercentageOutlined } from '@ant-design/icons';

interface CommissionInfo {
  totalEarned: number;
  totalPending: number;
  totalPaid: number;
  currentLevel: number;
  ratePercent: number;
}

interface UserInfo {
  id: number;
  email: string;
  username: string;
  is_affiliate: boolean;
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
}

const AffiliateTree = ({ treeData, defaultExpandAll = true, showCommissions = false, commissionData }: Props) => {
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
  };

  // Render commission info cho một node
  const renderCommissionInfo = (commission: CommissionInfo) => {
    if (!showCommissions) return null;
    
    return (
      <div className="ml-2 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <Tag color="blue" size="small">
            Level {commission.currentLevel}
          </Tag>
          <Tag color="green" size="small">
            {commission.ratePercent}%
          </Tag>
        </div>
        <div className="mt-1 space-y-1">
          <div className="flex items-center gap-1">
            <DollarOutlined className="text-green-500" />
            <span>Earned: {commission.totalEarned.toLocaleString()}đ</span>
          </div>
          <div className="flex items-center gap-1">
            <DollarOutlined className="text-yellow-500" />
            <span>Pending: {commission.totalPending.toLocaleString()}đ</span>
          </div>
          <div className="flex items-center gap-1">
            <DollarOutlined className="text-blue-500" />
            <span>Paid: {commission.totalPaid.toLocaleString()}đ</span>
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
      <Card title="Commission Summary" size="small" className="mb-4">
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="Total Earned"
              value={totalEarned}
              precision={0}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Total Pending"
              value={totalPending}
              precision={0}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Total Paid"
              value={totalPaid}
              precision={0}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
        </Row>
      </Card>
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
