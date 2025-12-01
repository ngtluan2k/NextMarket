import React, { useState } from 'react';
import { Tag, Card, Statistic, Row, Col, Badge } from 'antd';
import type { TreeDataNode } from 'antd';
import { DollarOutlined, UserOutlined, TeamOutlined, ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { AffiliateTreeNode, CommissionInfo } from '../../../types/affiliate-tree';
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
  expandedKeys?: React.Key[];
}

const AffiliateTree = ({ treeData, defaultExpandAll = true, showCommissions = false, commissionData, onUserSelect, expandedKeys: propExpandedKeys }: Props) => {
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [expandedLevels, setExpandedLevels] = useState<Set<number>>(new Set([0, 1]));

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
      ancestors.reduce((sum: number, a:any) => sum + a.commission.totalEarned, 0) +
      descendants.reduce((sum:number, d:any) => sum + d.commission.totalEarned, 0);

    const totalPending = rootUser.commission.totalPending + 
      ancestors.reduce((sum: number, a: any) => sum + a.commission.totalPending, 0) +
      descendants.reduce((sum:number, d:any) => sum + d.commission.totalPending, 0);

    const totalPaid = rootUser.commission.totalPaid + 
      ancestors.reduce((sum: number, a: any) => sum + a.commission.totalPaid, 0) +
      descendants.reduce((sum:number, d:any) => sum + d.commission.totalPaid, 0);

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

  // Toggle level expansion
  const toggleLevel = (level: number) => {
    const newExpanded = new Set(expandedLevels);
    if (newExpanded.has(level)) {
      newExpanded.delete(level);
    } else {
      newExpanded.add(level);
    }
    setExpandedLevels(newExpanded);
  };

  // Render user node with commission info
  const renderUserNode = (node: AffiliateTreeNode, isRoot = false, isAncestor = false) => {
    const isSelected = selectedKeys.includes(`${node.userId}`);
    const userName = (node.user as any)?.username || (node.user as any)?.email || `User ${node.userId}`;
    
    return (
      <div
        key={`node-${node.userId}`}
        onClick={() => {
          setSelectedKeys([`${node.userId}`]);
          if (onUserSelect) {
            onUserSelect(node.userId, node.commission);
          }
        }}
        style={{
          padding: '12px 16px',
          borderRadius: '8px',
          border: isSelected ? '2px solid #1890ff' : '1px solid #d9d9d9',
          backgroundColor: isRoot ? '#fafafa' : isSelected ? '#e6f7ff' : '#ffffff',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          marginBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserOutlined style={{ fontSize: '16px' }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>{userName}</div>
              <div style={{ fontSize: '12px', color: '#8c8c8c' }}>ID: {node.userId}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isRoot && <Tag color="green">🌳 Root</Tag>}
            {isAncestor && <Tag color="blue"><ArrowUpOutlined /> Upline</Tag>}
            {node.level > 0 && <Tag color="cyan">Level {node.level}</Tag>}
          </div>
        </div>

        {showCommissions && (
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f0f0f0' }}>
            <Row gutter={12}>
              <Col span={8}>
                <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                  <div style={{ color: '#52c41a', fontWeight: 600 }}>
                    {node.commission.totalEarned.toLocaleString()}đ
                  </div>
                  <div style={{ fontSize: '12px' }}>Đã kiếm</div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                  <div style={{ color: '#faad14', fontWeight: 600 }}>
                    {node.commission.totalPending.toLocaleString()}đ
                  </div>
                  <div style={{ fontSize: '12px' }}>Chờ xử lý</div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                  <div style={{ color: '#1890ff', fontWeight: 600 }}>
                    {node.commission.totalPaid.toLocaleString()}đ
                  </div>
                  <div style={{ fontSize: '12px' }}>Đã thanh toán</div>
                </div>
              </Col>
            </Row>
          </div>
        )}
      </div>
    );
  };

  // Render hierarchical view
  const renderHierarchicalView = () => {
    if (!commissionData) {
      return (
        <div style={{ padding: '16px', textAlign: 'center', color: '#8c8c8c' }}>
          Không có dữ liệu
        </div>
      );
    }

    const { rootUser, ancestors, descendants } = commissionData;
    
    // Group descendants by level
    const descendantsByLevel: { [key: number]: AffiliateTreeNode[] } = {};
    descendants.forEach((node) => {
      const level = Math.abs(node.level);
      if (!descendantsByLevel[level]) {
        descendantsByLevel[level] = [];
      }
      descendantsByLevel[level].push(node);
    });

    const sortedLevels = Object.keys(descendantsByLevel)
      .map(Number)
      .sort((a, b) => a - b);

    // Calculate totals
    const allNodes = [rootUser, ...ancestors, ...descendants];
    const totalEarned = allNodes.reduce((sum, node) => sum + node.commission.totalEarned, 0);
    const totalPending = allNodes.reduce((sum, node) => sum + node.commission.totalPending, 0);
    const totalPaid = allNodes.reduce((sum, node) => sum + node.commission.totalPaid, 0);
    const totalMembers = allNodes.length;

    return (
      <div>
        {/* Summary Stats */}
        <Card style={{ marginBottom: '16px' }} title="📊 Tổng quan Cây Affiliate">
          <Row gutter={16}>
            <Col xs={12} sm={6}>
              <Statistic
                title="Tổng Members"
                value={totalMembers}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Tổng Đã Kiếm"
                value={totalEarned}
                suffix="đ"
                valueStyle={{ color: '#3f8600' }}
                formatter={(value) => `${Number(value).toLocaleString('vi-VN')}`}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Chờ Xử Lý"
                value={totalPending}
                suffix="đ"
                valueStyle={{ color: '#cf1322' }}
                formatter={(value) => `${Number(value).toLocaleString('vi-VN')}`}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Đã Thanh Toán"
                value={totalPaid}
                suffix="đ"
                valueStyle={{ color: '#1890ff' }}
                formatter={(value) => `${Number(value).toLocaleString('vi-VN')}`}
              />
            </Col>
          </Row>
        </Card>

        {/* Tree Structure */}
        <Card title="🌳 Cây Affiliate Chi Tiết">
          <div>
            {/* Ancestors */}
            {ancestors.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <ArrowUpOutlined style={{ marginRight: '8px' }} />
                  Cấp Trên ({ancestors.length})
                </div>
                <div style={{ paddingLeft: '16px', borderLeft: '2px solid #69b1ff', backgroundColor: 'rgba(24, 144, 255, 0.05)', borderRadius: '8px', padding: '12px' }}>
                  {ancestors.map((ancestor) => renderUserNode(ancestor, false, true))}
                </div>
              </div>
            )}

            {/* Root User */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
                👤 User Chính
              </div>
              <div style={{ padding: '12px', backgroundColor: 'linear-gradient(135deg, #f6ffed 0%, #ffffff 100%)', borderRadius: '8px', border: '2px solid #52c41a' }}>
                {renderUserNode(rootUser, true, false)}
              </div>
            </div>

            {/* Descendants */}
            {descendants.length > 0 ? (
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <ArrowDownOutlined style={{ marginRight: '8px' }} />
                  Cấp Dưới ({descendants.length})
                </div>
                <div style={{ backgroundColor: 'rgba(82, 196, 26, 0.05)', borderRadius: '8px', padding: '12px' }}>
                  {sortedLevels.map((level) => (
                    <div key={`level-${level}`} style={{ marginBottom: '16px' }}>
                      <div
                        onClick={() => toggleLevel(level)}
                        style={{
                          backgroundColor: '#fafafa',
                          border: '1px solid #d9d9d9',
                          borderRadius: '6px',
                          padding: '12px 16px',
                          fontWeight: 500,
                          color: '#262626',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'all 0.3s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f0f0f0';
                          e.currentTarget.style.borderColor = '#bfbfbf';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#fafafa';
                          e.currentTarget.style.borderColor = '#d9d9d9';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Badge count={descendantsByLevel[level].length} color="#1890ff" />
                          <span>
                            Level {level} ({descendantsByLevel[level].length} members)
                          </span>
                        </div>
                        <span style={{ color: '#8c8c8c' }}>
                          {expandedLevels.has(level) ? '▼' : '▶'}
                        </span>
                      </div>

                      {expandedLevels.has(level) && (
                        <div style={{ marginTop: '12px', paddingLeft: '16px', borderLeft: '2px solid #95de64' }}>
                          {descendantsByLevel[level].map((descendant) =>
                            renderUserNode(descendant, false, false)
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', paddingTop: '32px', paddingBottom: '32px', color: '#8c8c8c' }}>
                <TeamOutlined style={{ fontSize: '32px', marginBottom: '8px', display: 'block' }} />
                <p>Không có cấp dưới</p>
              </div>
            )}
          </div>
        </Card>

        {/* Legend */}
        <Card style={{ marginTop: '16px' }} size="small" title="📋 Hướng Dẫn">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Tag color="green">🌳 Root</Tag>
              <span style={{ fontSize: '14px' }}>User chính của cây affiliate</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Tag color="blue">↑ Upline</Tag>
              <span style={{ fontSize: '14px' }}>Các cấp trên (người giới thiệu)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Tag color="cyan">Level N</Tag>
              <span style={{ fontSize: '14px' }}>Cấp độ trong cây (F1, F2, F3...)</span>
            </div>
            <div style={{ fontSize: '14px' }}>
              💰 Click vào bất kỳ node nào để xem chi tiết
            </div>
          </div>
        </Card>
      </div>
    );
  };

  if (!treeData || treeData.length === 0) {
    return (
      <div style={{ padding: '16px', textAlign: 'center', color: '#8c8c8c', border: '1px solid #d9d9d9', borderRadius: '6px' }}>
        Nhập email người dùng và nhấn "Xem cây affiliate" để hiển thị.
      </div>
    );
  }

  return (
    <div>
      {renderCommissionSummary()}
      {renderHierarchicalView()}
    </div>
  );
};

export default AffiliateTree;
