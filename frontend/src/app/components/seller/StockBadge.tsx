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
          <Text className="font-bold text-lg">Chi tiết tồn kho: </Text>
          <Switch
            checked={show}
            onChange={() => setShow(!show)}
            checkedChildren="Hiển thị"
            unCheckedChildren="Ẩn"
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
          title="Tồn kho cao"
          overflowCount={999}
          style={{ fontSize: '14px', padding: '0 8px' }}
        >
          <CheckCircleOutlined className="text-green-500 text-lg" />
        </Badge>
        <Text className="text-gray-800 font-medium">Tồn kho cao</Text>
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
          title="Tồn kho thấp"
          overflowCount={999}
          style={{ fontSize: '14px', padding: '0 8px' }}
        >
          <ExclamationCircleOutlined className="text-orange-500 text-lg" />
        </Badge>
        <Text className="text-gray-800 font-medium">Tồn kho thấp</Text>
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
          title="Hết hàng"
          overflowCount={999}
          style={{ fontSize: '14px', padding: '0 8px' }}
        >
          <AlertOutlined className="text-red-500 text-lg" />
        </Badge>
        <Text className="text-gray-800 font-medium">Hết hàng</Text>
      </Space>
    </Space>
  );
};

export default StockBadge;