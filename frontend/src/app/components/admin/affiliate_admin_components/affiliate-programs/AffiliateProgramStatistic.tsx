'use client';

import { Card, Col, Row, Statistic } from 'antd';
import { CheckCircleOutlined, DollarOutlined, TeamOutlined } from '@ant-design/icons';
import { Line } from '@ant-design/plots';

interface Props {
  totalPrograms: number;
  activePrograms: number;
  avgRevenue: number;
  avgCommission: number;
  chartData: any[];
}

const vnd = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value || 0);

const AffiliateProgramStatistic = ({ totalPrograms, activePrograms, avgRevenue, avgCommission, chartData }: Props) => {
  const config = {
    data: chartData,
    xField: 'time',
    yField: 'value',
    seriesField: 'type',
    smooth: true,
    height: 300,
    yAxis: { title: { text: 'Count' } },
    xAxis: { title: { text: 'Month' } },
    animation: { appear: { animation: 'path-in', duration: 1500 } },
    tooltip: { showMarkers: true },
  } as any;

  return (
    <>
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng số chương trình"
              value={totalPrograms}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Chương trình đang hoạt động"
              value={activePrograms}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Doanh thu trung bình"
              value={vnd(avgRevenue)}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Hoa hồng trung bình"
              value={vnd(avgCommission)}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Xu hướng Chuyển đổi" className="mb-6">
        <Line {...config} />
      </Card>
    </>
  );
};

export default AffiliateProgramStatistic;