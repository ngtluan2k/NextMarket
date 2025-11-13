'use client';

import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../../../components/affiliate/dashboard/common/Sidebar';
import { Content } from 'antd/es/layout/layout';
import AffiliateHeader from '../../../../components/affiliate/dashboard/common/AffiliateHeader';
import { useState } from 'react';
import { getCurrentUser } from '../../../../../utils/auth.helper';

export function AffiliateDashboardLayout() {
  const [username] = useState(() => getCurrentUser()?.username ?? '');

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar />
      <Layout>
        <Content
          style={{
            paddingLeft: '240px',
            minHeight: 360,
            background: '#F7F7F7',
            margin: '64px',
            marginTop: '32px',
          }}
        >
          <AffiliateHeader username={username} />
          <Outlet context={{ username }} />
        </Content>
      </Layout>
    </Layout>
  );
}
