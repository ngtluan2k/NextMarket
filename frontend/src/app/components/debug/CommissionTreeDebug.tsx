import React, { useState } from 'react';
import { Card, Button, Input, Typography, Space, Alert, Table, Tag } from 'antd';
import { BE_BASE_URL } from '../../api/api';

const { Title, Text } = Typography;

const CommissionTreeDebug: React.FC = () => {
  const [userId, setUserId] = useState<string>('9'); // Default to user 9 from logs
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchTreeData = async () => {
    if (!userId) return;
    
    console.log('🔄 [Debug] Fetching tree data for user:', userId);
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BE_BASE_URL}/admin/affiliate-tree/with-commissions/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ [Debug] Tree data received:', data);
      setTreeData(data.data);
    } catch (e: any) {
      console.error('❌ [Debug] Error:', e);
      setError(e.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const renderCommissionInfo = (commission: any) => {
    if (!commission) return <Tag color="red">No Commission Data</Tag>;
    
    return (
      <div>
        <div>Total Earned: <Text strong style={{ color: '#52c41a' }}>{commission.totalEarned?.toLocaleString() || 0}đ</Text></div>
        <div>Total Pending: <Text style={{ color: '#faad14' }}>{commission.totalPending?.toLocaleString() || 0}đ</Text></div>
        <div>Total Paid: <Text style={{ color: '#1890ff' }}>{commission.totalPaid?.toLocaleString() || 0}đ</Text></div>
        <div>Rate: {commission.ratePercent || 0}%</div>
      </div>
    );
  };

  const columns = [
    {
      title: 'User ID',
      dataIndex: 'userId',
      key: 'userId',
      width: 80,
    },
    {
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level: number) => (
        <Tag color={level === 0 ? 'green' : level > 0 ? 'blue' : 'orange'}>
          {level}
        </Tag>
      ),
    },
    {
      title: 'User Info',
      dataIndex: 'user',
      key: 'user',
      render: (user: any) => user ? (
        <div>
          <div><Text strong>{user.username || user.email}</Text></div>
          <div><Text type="secondary">ID: {user.id}</Text></div>
        </div>
      ) : 'No User Data',
    },
    {
      title: 'Commission',
      dataIndex: 'commission',
      key: 'commission',
      render: renderCommissionInfo,
    },
  ];

  const allNodes = treeData ? [
    treeData.rootUser,
    ...(treeData.ancestors || []),
    ...(treeData.descendants || [])
  ].filter(Boolean) : [];

  return (
    <Card title="🔍 Commission Tree Debug" style={{ margin: '16px' }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space>
          <Text strong>User ID:</Text>
          <Input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Enter user ID"
            style={{ width: 120 }}
          />
          <Button type="primary" onClick={fetchTreeData} loading={loading}>
            Fetch Tree Data
          </Button>
        </Space>

        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
          />
        )}

        {treeData && (
          <>
            <Title level={4}>Tree Structure</Title>
            <div style={{ 
              background: '#f5f5f5', 
              padding: '12px', 
              borderRadius: '4px',
              fontSize: '12px',
              fontFamily: 'monospace',
              maxHeight: '300px',
              overflow: 'auto'
            }}>
              <pre>{JSON.stringify(treeData, null, 2)}</pre>
            </div>

            <Title level={4}>Commission Summary</Title>
            <Table
              dataSource={allNodes}
              columns={columns}
              rowKey={(record) => `${record.userId}-${record.level}`}
              pagination={false}
              size="small"
              bordered
            />

            <Title level={4}>Analysis</Title>
            <Card size="small">
              <Space direction="vertical">
                <Text><strong>Root User:</strong> {treeData.rootUser?.userId} (Level {treeData.rootUser?.level})</Text>
                <Text><strong>Ancestors:</strong> {treeData.ancestors?.length || 0} users</Text>
                <Text><strong>Descendants:</strong> {treeData.descendants?.length || 0} users</Text>
                <Text><strong>Total Commission (Root):</strong> {treeData.rootUser?.commission?.totalEarned || 0}đ</Text>
                
                {treeData.rootUser?.commission?.totalEarned === 0 && (
                  <Alert
                    message="No Commission Found"
                    description="This user has no commission data. Check if commissions were properly calculated and saved to database."
                    type="warning"
                    showIcon
                  />
                )}
              </Space>
            </Card>
          </>
        )}
      </Space>
    </Card>
  );
};

export default CommissionTreeDebug;
