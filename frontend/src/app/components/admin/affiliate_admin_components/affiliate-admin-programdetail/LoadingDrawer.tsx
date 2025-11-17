'use client';

import React from 'react';
import { Drawer, Spin } from 'antd';

interface LoadingDrawerProps {
  visible: boolean;
  onClose: () => void;
}

const LoadingDrawer = ({ visible, onClose }: LoadingDrawerProps) => (
  <Drawer
    placement="right"
    open={visible}
    onClose={onClose}
    width={600}
    title="Đang tải..."
  >
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
      }}
    >
      <Spin size="large" />
    </div>
  </Drawer>
);

export default LoadingDrawer;