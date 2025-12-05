import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Breadcrumb } from 'antd';
import EveryMartHeader from '../../components/Navbar';
import Footer from '../../components/Footer';
import AccountSidebar from '../../components/account/AccountSidebar';

export default function AccountLayout() {
  const BE_BASE_URL = import.meta.env.VITE_BE_BASE_URL;
  const { pathname } = useLocation();
  const userStr = localStorage.getItem('user');
  let user: { full_name?: string; avatar_url?: string } | null = null;

  try {
    user = userStr ? JSON.parse(userStr) : null;
  } catch (err) {
    console.error('Failed to parse user from localStorage', err);
    user = null;
  }

  const userName = user?.full_name || 'Tài khoản';
  const avatarUrl = user?.avatar_url
    ? `${BE_BASE_URL}${user.avatar_url}`
    : undefined;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <EveryMartHeader />
      <main className="flex-1 mx-auto w-full max-w-screen-2xl px-4 py-6">
        <Breadcrumb className="mb-4" />

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="col-span-12 md:col-span-3">
            <AccountSidebar userName={userName} avatarUrl={avatarUrl} />
          </div>

          {/* Nội dung động theo route con */}
          <section className="col-span-12 md:col-span-9">
            <Outlet />
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
