import React from 'react';
import type { CascaderProps } from 'antd';
import { Cascader, Space } from 'antd';
import { ExportOutlined } from '@ant-design/icons';

interface ExportOption {
  value: string;
  label: string;
}

const exportOptions: ExportOption[] = [
  {
    value: 'pdf',
    label: 'Xuất dưới dạng PDF',
  },
  {
    value: 'excel',
    label: 'Xuất dưới dạng Excel',
  },
];

const onChange: CascaderProps<ExportOption>['onChange'] = (value) => {
  console.log('Selected export type:', value[0]);
};

const displayRender = (labels: string[]) => labels[0];

const ExportCascader: React.FC = () => (
  <Space className="w-full">
    <Cascader
      options={exportOptions}
      expandTrigger="click"
      displayRender={displayRender}
      onChange={onChange}
      defaultValue={['excel']}
      placeholder="Chọn loại xuất dữ liệu"
      className="w-32 sm:w-36 h-9 bg-white rounded-md shadow-sm text-sm"
      suffixIcon={<ExportOutlined className="text-gray-600" />}
    />
  </Space>
);

export default ExportCascader;
