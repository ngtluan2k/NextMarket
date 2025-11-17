import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Alert, Typography, Space, Tag } from 'antd';
import { LinkOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

/**
 * Debug component to test affiliate link variant selection
 */
export const AffiliateVariantTest: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [testUrl, setTestUrl] = useState('');
  const [currentParams, setCurrentParams] = useState<Record<string, string>>({});

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const params: Record<string, string> = {};
    
    urlParams.forEach((value, key) => {
      params[key] = value;
    });
    
    setCurrentParams(params);
  }, [location.search]);

  const testUrls = [
    {
      name: 'Product 1 with Variant 2',
      url: '/products/slug/test-product?aff=AFF123&variant=2&program=1',
      description: 'Should select variant ID 2 automatically'
    },
    {
      name: 'Product 1 with Variant 5',
      url: '/products/slug/test-product?aff=AFF123&variant=5&program=1',
      description: 'Should select variant ID 5 automatically'
    },
    {
      name: 'Product without Variant',
      url: '/products/slug/test-product?aff=AFF123&program=1',
      description: 'Should use default variant selection'
    },
    {
      name: 'Affiliate Link Resolver',
      url: '/product/1?aff=AFF123&variant=3&program=1',
      description: 'Should resolve to product page with variant 3 selected'
    }
  ];

  const handleTestUrl = (url: string) => {
    navigate(url);
  };

  const handleCustomTest = () => {
    if (testUrl.trim()) {
      navigate(testUrl);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}>🔗 Affiliate Link Variant Selection Test</Title>
      
      <Alert
        message="Current URL Parameters"
        description={
          <div>
            <Text strong>Current Location: </Text>
            <Text code>{location.pathname + location.search}</Text>
            <br />
            <div style={{ marginTop: '8px' }}>
              {Object.keys(currentParams).length > 0 ? (
                Object.entries(currentParams).map(([key, value]) => (
                  <Tag key={key} color="blue">
                    {key}: {value}
                  </Tag>
                ))
              ) : (
                <Text type="secondary">No URL parameters detected</Text>
              )}
            </div>
          </div>
        }
        type="info"
        style={{ marginBottom: '20px' }}
      />

      <Card title="🧪 Test Scenarios" style={{ marginBottom: '20px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          {testUrls.map((test, index) => (
            <Card 
              key={index}
              size="small" 
              style={{ backgroundColor: '#f9f9f9' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <Text strong>{test.name}</Text>
                  <br />
                  <Text type="secondary">{test.description}</Text>
                  <br />
                  <Text code style={{ fontSize: '12px' }}>{test.url}</Text>
                </div>
                <Button 
                  type="primary" 
                  icon={<LinkOutlined />}
                  onClick={() => handleTestUrl(test.url)}
                >
                  Test
                </Button>
              </div>
            </Card>
          ))}
        </Space>
      </Card>

      <Card title="🎯 Custom Test URL">
        <Space.Compact style={{ width: '100%' }}>
          <Input
            placeholder="Enter custom URL to test (e.g., /products/slug/test?aff=AFF123&variant=2)"
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            onPressEnter={handleCustomTest}
          />
          <Button 
            type="primary" 
            onClick={handleCustomTest}
            disabled={!testUrl.trim()}
          >
            Test Custom URL
          </Button>
        </Space.Compact>
      </Card>

      <Card title="✅ Expected Behavior" style={{ marginTop: '20px' }}>
        <Paragraph>
          <Text strong>When clicking an affiliate link with variant parameter:</Text>
        </Paragraph>
        <ul>
          <li>
            <CheckCircleOutlined style={{ color: 'green', marginRight: '8px' }} />
            URL should contain <Text code>variant=X</Text> parameter
          </li>
          <li>
            <CheckCircleOutlined style={{ color: 'green', marginRight: '8px' }} />
            Product page should automatically select the specified variant
          </li>
          <li>
            <CheckCircleOutlined style={{ color: 'green', marginRight: '8px' }} />
            Affiliate tracking data should be stored with variant info
          </li>
          <li>
            <CheckCircleOutlined style={{ color: 'green', marginRight: '8px' }} />
            Add to cart should use the pre-selected variant
          </li>
        </ul>
        
        <Alert
          message="How to Verify"
          description={
            <div>
              <Text>1. Click a test link above</Text><br />
              <Text>2. Check that the variant selector shows the correct variant</Text><br />
              <Text>3. Verify the price and stock reflect the selected variant</Text><br />
              <Text>4. Open browser console to see affiliate tracking logs</Text>
            </div>
          }
          type="success"
          style={{ marginTop: '16px' }}
        />
      </Card>
    </div>
  );
};

export default AffiliateVariantTest;
