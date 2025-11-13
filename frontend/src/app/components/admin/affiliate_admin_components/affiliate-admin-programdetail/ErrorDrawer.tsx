'use client';

import React from 'react';
import { Drawer, Alert } from 'antd';

interface ErrorDrawerProps {
  visible: boolean;
  onClose: () => void;
  error: string | null;
}

const ErrorDrawer = ({ visible, onClose, error }: ErrorDrawerProps) => (
  <Drawer
    placement="right"
    open={visible}
    onClose={onClose}
    width={600}
    title="Lỗi"
  >
    <Alert
      message="Lỗi"
      description={error || 'Không thể tải dữ liệu chương trình.'}
      type="error"
      showIcon
    />
  </Drawer>
);

export default ErrorDrawer;