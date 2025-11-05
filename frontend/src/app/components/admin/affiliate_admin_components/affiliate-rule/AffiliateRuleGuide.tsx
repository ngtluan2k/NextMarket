import { Alert, Col, Row, Typography } from 'antd';
import React from 'react';
const { Text } = Typography;
const AffiliateRuleGuide = () => {
  return (
    <Alert
      message="Hướng dẫn sử dụng hệ thống Affiliate"
      description={
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <div style={{ marginBottom: 8 }}>
              <Text strong>
                <span role="img" aria-label="crystal ball">
                  🔮
                </span>{' '}
                Xem trước Hoa hồng Dự kiến
              </Text>
            </div>
            <Text type="secondary">
              Tính toán thuần túy hoa hồng dự kiến cho từng cấp dựa trên số tiền
              và quy tắc hiện tại.
              <Text strong>Không cần kết nối database</Text> - chỉ tính toán dựa
              trên level và rules.
              <Text strong>Dành cho user</Text> để dự đoán thu nhập từ
              affiliate.
            </Text>
          </Col>
          <Col xs={24} md={12}>
            <div style={{ marginBottom: 8 }}>
              <Text strong>
                <span role="img" aria-label="tree">
                  🌳
                </span>{' '}
                Cây Affiliate & Hoa hồng Thực tế
              </Text>
            </div>
            <Text type="secondary">
              Hiển thị hoa hồng thực tế đã được tính toán và phân bổ cho từng
              cấp affiliate.
              <Text strong>Cần kết nối với user trong database</Text> để hiển
              thị thông tin thực tế.
              <Text strong>Dành cho admin</Text> để theo dõi hiệu suất và thu
              nhập thực tế của hệ thống.
            </Text>
          </Col>
        </Row>
      }
      type="info"
      showIcon
      style={{ marginBottom: 16 }}
    />
  );
};

export default AffiliateRuleGuide;
