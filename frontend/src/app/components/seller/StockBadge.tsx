import React, { useState } from 'react';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  AlertOutlined,
} from '@ant-design/icons';
import { Badge, Space, Switch, Typography } from 'antd';

const { Text } = Typography;

interface StockBadgeProps {
  inStock: number;
  lowStock: number;
  outOfStock: number;
  showToggle?: boolean;
}

const StockBadge: React.FC<StockBadgeProps> = ({
  inStock,
  lowStock,
  outOfStock,
  showToggle = true,
}) => {
  const [show, setShow] = useState(true);

  return (
    <Space direction="vertical" size={12} className="w-full">
      {showToggle && (
        <Space className="w-full flex-row align-middle justify-between">
          <Text className="font-bold text-lg">Stock detail: </Text>
          <Switch
            checked={show}
            onChange={() => setShow(!show)}
            checkedChildren="View"
            unCheckedChildren="Hide"
            className="mb-2"
          />
        </Space>
      )}
      <Space
        align="center"
        size={8}
        className="w-full flex-row justify-between  px-2"
      >
        <Badge
          count={show ? inStock : 0}
          showZero
          color="#52c41a"
          title="High Stock"
          overflowCount={999}
          style={{ fontSize: '14px', padding: '0 8px' }}
        >
          <CheckCircleOutlined className="text-green-500 text-lg" />
        </Badge>
        <Text className="text-gray-800 font-medium">High Stock</Text>
      </Space>
      <Space
        align="center"
        size={8}
        className="w-full flex-row justify-between  px-2"
      >
        <Badge
          count={show ? lowStock : 0}
          showZero
          color="#faad14"
          title="Low Stock"
          overflowCount={999}
          style={{ fontSize: '14px', padding: '0 8px' }}
        >
          <ExclamationCircleOutlined className="text-orange-500 text-lg" />
        </Badge>
        <Text className="text-gray-800 font-medium">Low Stock</Text>
      </Space>
      <Space
        align="center"
        size={8}
        className="w-full flex-row justify-between  px-2"
      >
        <Badge
          count={show ? outOfStock : 0}
          showZero
          color="#f5222d"
          title="Out of Stock"
          overflowCount={999}
          style={{ fontSize: '14px', padding: '0 8px' }}
        >
          <AlertOutlined className="text-red-500 text-lg" />
        </Badge>
        <Text className="text-gray-800 font-medium">Out of Stock</Text>
      </Space>
    </Space>
  );
};

export default StockBadge;
