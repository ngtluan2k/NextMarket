'use client';

import React from 'react';
import {
  Descriptions,
  Tag,
  Space,
  Divider,
  Card,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  CalendarOutlined,
  DollarOutlined,
  TagOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { AffiliateProgram } from '../../../../types/affiliate';

// Helper for VND formatting (reuse from before for consistency).
const vnd = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value);

interface ProgramDetailContentProps {
  program: AffiliateProgram;
}

const ProgramDetailContent = ({ program }: ProgramDetailContentProps) => {
  // Safe commission display with null checks.
  const getCommissionDisplay = () => {
    if (program.commission_value == null) return 'Không có dữ liệu';
    return program.commission_type === 'percentage'
      ? `${program.commission_value}%`
      : `\$${program.commission_value.toFixed(2)}`; // Or use vnd(program.commission_value) for VND consistency
  };

  return (
    <div className="space-y-6">
      {/* Phần tiêu đề */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-800">{program.name}</h2>
          <div className="flex items-center gap-2">
            <Tag
              color={program.status === 'active' ? 'success' : 'default'}
              className="text-sm"
            >
              {program.status === 'active' ? 'ĐANG HOẠT ĐỘNG' : 'TẠM NGỪNG'}
            </Tag>
            <span className="text-sm text-gray-500">ID: {program.id}</span>
          </div>
        </div>
      </Card>

      {/* Thống kê */}
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card>
            <Statistic
              title="Thời gian lưu cookie"
              value={program.cookie_days ?? 'Không có'}
              suffix={program.cookie_days ? 'ngày' : ''}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff', fontSize: '24px' }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic
              title="Hoa hồng"
              value={getCommissionDisplay()}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#52c41a', fontSize: '24px' }}
            />
          </Card>
        </Col>
      </Row>

      <Divider />

      {/* Thông tin chi tiết */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-gray-700">
          Thông tin chương trình
        </h3>
        <Descriptions column={1} bordered>
          <Descriptions.Item
            label={
              <Space>
                <TagOutlined />
                Tên chương trình
              </Space>
            }
          >
            {program.name}
          </Descriptions.Item>

          <Descriptions.Item
            label={
              <Space>
                <LinkOutlined />
                UUID
              </Space>
            }
          >
            <code className="rounded bg-gray-100 px-2 py-1 text-xs">
              {program.uuid}
            </code>
          </Descriptions.Item>

          <Descriptions.Item
            label={
              <Space>
                <CheckCircleOutlined />
                Trạng thái
              </Space>
            }
          >
            <Tag color={program.status === 'active' ? 'success' : 'default'}>
              {program.status === 'active' ? 'ĐANG HOẠT ĐỘNG' : 'TẠM NGỪNG'}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item
            label={
              <Space>
                <ClockCircleOutlined />
                Thời gian cookie
              </Space>
            }
          >
            {program.cookie_days ? `${program.cookie_days} ngày` : 'Chưa thiết lập'}
          </Descriptions.Item>

          <Descriptions.Item
            label={
              <Space>
                <DollarOutlined />
                Loại hoa hồng
              </Space>
            }
          >
            {program.commission_type ? (
              <Tag
                color={
                  program.commission_type === 'percentage' ? 'blue' : 'green'
                }
              >
                {program.commission_type === 'percentage'
                  ? 'PHẦN TRĂM'
                  : 'CỐ ĐỊNH'}
              </Tag>
            ) : (
              'Chưa thiết lập'
            )}
          </Descriptions.Item>

          <Descriptions.Item
            label={
              <Space>
                <DollarOutlined />
                Giá trị hoa hồng
              </Space>
            }
          >
            <span className="font-semibold text-green-600">
              {getCommissionDisplay()}
            </span>
          </Descriptions.Item>

          <Descriptions.Item
            label={
              <Space>
                <CalendarOutlined />
                Ngày tạo
              </Space>
            }
          >
            {new Date(program.created_at).toLocaleString('vi-VN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Descriptions.Item>
        </Descriptions>
      </div>
    </div>
  );
};

export default ProgramDetailContent;