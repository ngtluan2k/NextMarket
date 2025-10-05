import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Breadcrumb } from 'antd';
import EveryMartHeader from '../../components/Navbar';
import Footer from '../../components/Footer';
import AccountSidebar from '../../components/account/AccountSidebar';

export default function AccountLayout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <EveryMartHeader />
      <main className="flex-1 mx-auto w-full max-w-screen-2xl px-4 py-6">
        <Breadcrumb className="mb-4" />

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="col-span-12 md:col-span-3">
            <AccountSidebar />
          </div>

          {/* Nội dung động theo route con */}
          <section className="col-span-12 md:col-span-9">
            {/* Chuyển /account -> /account/profile */}
            {pathname === '/account' ? (
              <Navigate to="/account/profile" replace />
            ) : null}
            <Outlet />
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
