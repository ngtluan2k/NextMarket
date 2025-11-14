import React, { useState } from 'react';
import { Card, Button, Typography, Space, Alert, Table, Tag } from 'antd';
import { BE_BASE_URL } from '../../api/api';

const { Title, Text } = Typography;

const CommissionDatabaseDebug: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [commissionData, setCommissionData] = useState<any>(null);
  const [walletData, setWalletData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchCommissionData = async () => {
    console.log('🔄 [Debug] Fetching commission data...');
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      
      // Fetch raw commission data
      const commissionResponse = await fetch(`${BE_BASE_URL}/debug/commissions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (commissionResponse.ok) {
        const commissions = await commissionResponse.json();
        console.log('✅ [Debug] Commission data:', commissions);
        setCommissionData(commissions);
      }
      
      // Fetch wallet transactions
      const walletResponse = await fetch(`${BE_BASE_URL}/debug/wallet-transactions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (walletResponse.ok) {
        const wallets = await walletResponse.json();
        console.log('✅ [Debug] Wallet data:', wallets);
        setWalletData(wallets);
      }
      
    } catch (e: any) {
      console.error('❌ [Debug] Error:', e);
      setError(e.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testCommissionQuery = async (userId: number) => {
    console.log(`🧪 [Debug] Testing commission query for user ${userId}...`);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BE_BASE_URL}/debug/test-commission-query/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ [Debug] Query test result:', result);
        alert(`Query Result for User ${userId}:\n${JSON.stringify(result, null, 2)}`);
      } else {
        console.error('❌ [Debug] Query test failed:', response.status);
      }
    } catch (e: any) {
      console.error('❌ [Debug] Query test error:', e);
    }
  };

  const commissionColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: 'Beneficiary User ID',
      dataIndex: 'beneficiary_user_id',
      key: 'beneficiary_user_id',
      width: 120,
      render: (value: any) => (
        <Text code>{typeof value === 'object' ? value?.id : value}</Text>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <Text strong style={{ color: '#52c41a' }}>
          {amount?.toLocaleString()}đ
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'PAID' ? 'green' : status === 'PENDING' ? 'orange' : 'red'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Program ID',
      dataIndex: 'program_id',
      key: 'program_id',
    },
    {
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
    },
    {
      title: 'Rate %',
      dataIndex: 'rate_percent',
      key: 'rate_percent',
    },
  ];

  const walletColumns = [
    {
      title: 'User ID',
      dataIndex: 'user_id',
      key: 'user_id',
      render: (value: any) => (
        <Text code>{typeof value === 'object' ? value?.id : value}</Text>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <Text strong style={{ color: amount > 0 ? '#52c41a' : '#ff4d4f' }}>
          {amount > 0 ? '+' : ''}{amount?.toLocaleString()}đ
        </Text>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'transaction_type',
      key: 'transaction_type',
      render: (type: string) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString(),
    },
  ];

  return (
    <Card title="🔍 Commission Database Debug" style={{ margin: '16px' }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Button type="primary" onClick={fetchCommissionData} loading={loading}>
          Fetch Database Data
        </Button>
        <Button type="default" onClick={() => testCommissionQuery(9)}>
          Test Query User 9
        </Button>
        <Button type="default" onClick={() => testCommissionQuery(11)}>
          Test Query User 11
        </Button>

        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
          />
        )}

        {commissionData && (
          <>
            <Title level={4}>Commission Records</Title>
            <Alert
              message={`Found ${commissionData.length} commission records`}
              type="info"
              showIcon
            />
            <Table
              dataSource={commissionData}
              columns={commissionColumns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              size="small"
              bordered
              scroll={{ x: 800 }}
            />
          </>
        )}

        {walletData && (
          <>
            <Title level={4}>Wallet Transactions</Title>
            <Alert
              message={`Found ${walletData.length} wallet transactions`}
              type="info"
              showIcon
            />
            <Table
              dataSource={walletData}
              columns={walletColumns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              size="small"
              bordered
              scroll={{ x: 800 }}
            />
          </>
        )}

        {commissionData && walletData && (
          <Card size="small" title="Analysis">
            <Space direction="vertical">
              <Text><strong>Commission Records:</strong> {commissionData.length}</Text>
              <Text><strong>Wallet Transactions:</strong> {walletData.length}</Text>
              
              {commissionData.length > 0 && walletData.length > 0 && (
                <Alert
                  message="Data Mismatch Investigation"
                  description="Both commission and wallet data exist, but tree shows 0. This suggests a query relationship issue in the affiliate-tree service."
                  type="warning"
                  showIcon
                />
              )}
              
              {commissionData.length === 0 && walletData.length > 0 && (
                <Alert
                  message="Commission Data Missing"
                  description="Wallet transactions exist but no commission records found. Commission calculation may not be saving to affiliate_commissions table."
                  type="error"
                  showIcon
                />
              )}
            </Space>
          </Card>
        )}
      </Space>
    </Card>
  );
};

export default CommissionDatabaseDebug;
