import React, { useState } from 'react';
import { Card, Button, Typography, Space, Alert, Table, Tag } from 'antd';
import { BE_BASE_URL } from '../../api/api';

const { Title, Text } = Typography;

interface PerformanceMetric {
  step: string;
  duration: number;
  status: 'success' | 'error' | 'pending';
  details?: string;
}

const LoginPerformanceDebug: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalTime, setTotalTime] = useState(0);

  const testLoginPerformance = async () => {
    setLoading(true);
    setMetrics([]);
    
    const startTime = performance.now();
    const newMetrics: PerformanceMetric[] = [];

    try {
      // Test 1: Database Query Performance
      const dbStart = performance.now();
      const dbRes = await fetch(`${BE_BASE_URL}/debug/test-user-query`, {
        headers: { 'Content-Type': 'application/json' },
      });
      const dbEnd = performance.now();
      
      newMetrics.push({
        step: 'Database Query',
        duration: dbEnd - dbStart,
        status: dbRes.ok ? 'success' : 'error',
        details: `Status: ${dbRes.status}`
      });

      // Test 2: Login API Performance
      const loginStart = performance.now();
      const loginRes = await fetch(`${BE_BASE_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'testpassword'
        }),
      });
      const loginEnd = performance.now();
      
      newMetrics.push({
        step: 'Login API Call',
        duration: loginEnd - loginStart,
        status: loginRes.ok ? 'success' : 'error',
        details: `Status: ${loginRes.status}`
      });

      // Test 3: JWT Verification
      if (loginRes.ok) {
        const loginData = await loginRes.json();
        const jwtStart = performance.now();
        
        const verifyRes = await fetch(`${BE_BASE_URL}/auth/verify`, {
          headers: { 
            'Authorization': `Bearer ${loginData.access_token}`,
            'Content-Type': 'application/json' 
          },
        });
        const jwtEnd = performance.now();
        
        newMetrics.push({
          step: 'JWT Verification',
          duration: jwtEnd - jwtStart,
          status: verifyRes.ok ? 'success' : 'error',
          details: `Token valid: ${verifyRes.ok}`
        });
      }

      // Test 4: User Profile Fetch
      const profileStart = performance.now();
      const profileRes = await fetch(`${BE_BASE_URL}/users/me`, {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json' 
        },
      });
      const profileEnd = performance.now();
      
      newMetrics.push({
        step: 'Profile Fetch (/users/me)',
        duration: profileEnd - profileStart,
        status: profileRes.ok ? 'success' : 'error',
        details: `Duplicate call check`
      });

    } catch (error: any) {
      newMetrics.push({
        step: 'Error',
        duration: 0,
        status: 'error',
        details: error.message
      });
    }

    const endTime = performance.now();
    setTotalTime(endTime - startTime);
    setMetrics(newMetrics);
    setLoading(false);
  };

  const columns = [
    {
      title: 'Step',
      dataIndex: 'step',
      key: 'step',
      width: 200,
    },
    {
      title: 'Duration (ms)',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: number) => (
        <Text strong style={{ 
          color: duration > 1000 ? '#ff4d4f' : duration > 500 ? '#faad14' : '#52c41a' 
        }}>
          {duration.toFixed(2)}ms
        </Text>
      ),
      sorter: (a: PerformanceMetric, b: PerformanceMetric) => a.duration - b.duration,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'success' ? 'green' : status === 'error' ? 'red' : 'orange'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Details',
      dataIndex: 'details',
      key: 'details',
    },
  ];

  const getPerformanceAnalysis = () => {
    if (metrics.length === 0) return null;

    const slowSteps = metrics.filter(m => m.duration > 500);
    const totalDuration = metrics.reduce((sum, m) => sum + m.duration, 0);

    return (
      <Card size="small" title="Performance Analysis">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text><strong>Total Time:</strong> {totalTime.toFixed(2)}ms</Text>
          <Text><strong>API Calls Time:</strong> {totalDuration.toFixed(2)}ms</Text>
          
          {slowSteps.length > 0 && (
            <Alert
              message="Performance Issues Detected"
              description={
                <ul>
                  {slowSteps.map((step, idx) => (
                    <li key={idx}>
                      <strong>{step.step}</strong>: {step.duration.toFixed(2)}ms (too slow)
                    </li>
                  ))}
                </ul>
              }
              type="warning"
              showIcon
            />
          )}

          {totalTime > 2000 && (
            <Alert
              message="Login Too Slow"
              description="Total login time > 2 seconds. Consider optimizations."
              type="error"
              showIcon
            />
          )}
        </Space>
      </Card>
    );
  };

  return (
    <Card title="🚀 Login Performance Debug" style={{ margin: '16px' }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Button type="primary" onClick={testLoginPerformance} loading={loading}>
          Test Login Performance
        </Button>

        {metrics.length > 0 && (
          <>
            <Title level={4}>Performance Metrics</Title>
            <Table
              dataSource={metrics}
              columns={columns}
              rowKey="step"
              pagination={false}
              size="small"
              bordered
            />
            
            {getPerformanceAnalysis()}
          </>
        )}

        <Card size="small" title="Optimization Recommendations">
          <Space direction="vertical">
            <Text><strong>Backend Optimizations:</strong></Text>
            <ul>
              <li>Reduce database query relations (currently 4 levels deep)</li>
              <li>Remove duplicate JWT generation in controller</li>
              <li>Add database indexes on email column</li>
              <li>Consider caching user roles & permissions</li>
            </ul>
            
            <Text><strong>Frontend Optimizations:</strong></Text>
            <ul>
              <li>Remove duplicate API calls (/users/login + /users/me)</li>
              <li>Implement lazy loading for user addresses</li>
              <li>Use cached user data when possible</li>
              <li>Background token validation</li>
            </ul>
          </Space>
        </Card>
      </Space>
    </Card>
  );
};

export default LoginPerformanceDebug;
