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
    label: 'Export as PDF',
  },
  {
    value: 'excel',
    label: 'Export as Excel',
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
      placeholder="Select export type"
      className="w-32 sm:w-36 h-9 bg-white rounded-md shadow-sm text-sm" 
      suffixIcon={<ExportOutlined className="text-gray-600" />}
    />
  </Space>
);

export default ExportCascader;