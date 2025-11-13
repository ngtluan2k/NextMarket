import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Space, Table, Tag, Alert } from 'antd';
import { listRules, CommissionRule } from '../../../service/afiliate/affiliate-rules.service';

const { Title, Text } = Typography;

const AffiliateRulesDebug: React.FC = () => {
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRules = async () => {
    console.log('🔄 [Debug] Starting to fetch rules...');
    setLoading(true);
    setError(null);
    
    try {
      const data = await listRules();
      console.log('✅ [Debug] Rules fetched:', data);
      setRules(data || []);
    } catch (e: any) {
      console.error('❌ [Debug] Error:', e);
      setError(e.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (id: string) => (
        <Text code style={{ fontSize: '11px' }}>
          {id.substring(0, 8)}...
        </Text>
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: 'Calculated Rates',
      dataIndex: 'calculated_rates',
      key: 'calculated_rates',
      render: (rates: any) => {
        console.log('🔍 [Debug Column] Rendering rates:', rates);
        
        if (!rates) {
          return <Tag color="red">NULL</Tag>;
        }
        
        if (!Array.isArray(rates)) {
          return <Tag color="orange">NOT ARRAY: {typeof rates}</Tag>;
        }
        
        if (rates.length === 0) {
          return <Tag color="yellow">EMPTY ARRAY</Tag>;
        }
        
        return (
          <div>
            <Tag color="green">Array ({rates.length} items)</Tag>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              {rates.map((rate, index) => (
                <div key={index}>
                  Level {rate.level}: {rate.rate}%
                </div>
              ))}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Method',
      dataIndex: 'calculation_method',
      key: 'calculation_method',
      render: (method: string) => <Tag color="blue">{method}</Tag>,
    },
    {
      title: 'Active',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
  ];

  return (
    <Card title="🔍 Affiliate Rules Debug" style={{ margin: '16px' }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space>
          <Button type="primary" onClick={fetchRules} loading={loading}>
            Refresh Rules
          </Button>
          <Text>Total Rules: {rules.length}</Text>
        </Space>

        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
          />
        )}

        <Title level={4}>Raw Data Structure</Title>
        <div style={{ 
          background: '#f5f5f5', 
          padding: '12px', 
          borderRadius: '4px',
          fontSize: '12px',
          fontFamily: 'monospace',
          maxHeight: '200px',
          overflow: 'auto'
        }}>
          <pre>{JSON.stringify(rules, null, 2)}</pre>
        </div>

        <Title level={4}>Table View</Title>
        <Table
          dataSource={rules}
          columns={columns}
          rowKey="id"
          pagination={false}
          size="small"
          bordered
        />

        <Title level={4}>Individual Rule Analysis</Title>
        {rules.map((rule, index) => (
          <Card key={rule.id} size="small" style={{ marginBottom: '8px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>Rule {index + 1}: {rule.name}</Text>
              <Text>ID: {rule.id}</Text>
              <Text>calculated_rates type: {typeof rule.calculated_rates}</Text>
              <Text>calculated_rates is Array: {Array.isArray(rule.calculated_rates).toString()}</Text>
              <Text>calculated_rates length: {rule.calculated_rates?.length || 'N/A'}</Text>
              <div style={{ 
                background: '#f9f9f9', 
                padding: '8px', 
                borderRadius: '4px',
                fontSize: '11px',
                fontFamily: 'monospace'
              }}>
                <pre>{JSON.stringify(rule.calculated_rates, null, 2)}</pre>
              </div>
            </Space>
          </Card>
        ))}
      </Space>
    </Card>
  );
};

export default AffiliateRulesDebug;
