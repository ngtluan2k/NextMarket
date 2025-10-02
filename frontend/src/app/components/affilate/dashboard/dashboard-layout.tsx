"use client"

import type React from "react"
import { useState } from "react"
import Link from "antd/es/typography/Link"
import { Home, Link2, CreditCard, BookOpen, Settings, HelpCircle, Bell, Menu, X } from "lucide-react"
import { Button } from "antd"
import { Avatar } from "antd"

const navigation = [
  { name: "Dashboard Overview", href: "/user/affiliate/dashboard", icon: Home },
  { name: "Affiliate Links", href: "/user/affiliate/links", icon: Link2 },
  { name: "Support", href: "/user/affiliate/support", icon: CreditCard },
  { name: "Resources", href: "/user/affiliate/resources", icon: BookOpen },
]

const bottomNavigation = [
  { name: "Settings", href: "/user/affiliate/settings", icon: Settings },
  { name: "Support", href: "/user/affiliate/support", icon: HelpCircle, badge: "Online" },
  { name: "Notification", href: "/user/affiliate/notifications", icon: Bell },
]

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
      `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="font-bold text-gray-900 text-lg">Skilarna</span>
            </Link>
            <Button size="small" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Search */}
          <div className="px-4 py-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search"
                className="w-full px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 text-xs text-gray-500 bg-white border border-gray-200 rounded">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors group"
              >
                <item.icon className="h-5 w-5 text-gray-500 group-hover:text-orange-500" />
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Bottom Navigation */}
          <div className="px-3 py-4 border-t border-gray-200 space-y-1">
            {bottomNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors group relative"
              >
                <item.icon className="h-5 w-5 text-gray-500 group-hover:text-orange-500" />
                <span className="text-sm font-medium">{item.name}</span>
                {item.badge && (
                  <span className="ml-auto text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Referral Card */}
          <div className="mx-3 mb-4 p-4 bg-gray-100 rounded-lg">
            <button className="w-full text-left group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-900">Refer a friend</span>
                <X className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-xs text-gray-600 mb-3">Earn 50% back for 12 months when someone uses your link.</p>
              <div className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200">
                <code className="flex-1 text-xs text-gray-900 truncate">uui.com/40B0020</code>
                <Button size="small" className="h-6 px-2 text-xs hover:bg-gray-100">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </Button>
              </div>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <Button size="small" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <div className="bg-orange-100 text-orange-600">IO</div>
                </Avatar>
                <span className="text-sm font-medium text-gray-900">Ilelakinwa Olajide</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button size="small" className="relative">
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
              </Button>
              <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-orange-500 ring-offset-2">
                <div className="bg-orange-500 text-white">IO</div>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900">Ilelakinwa Olajide</p>
                <p className="text-xs text-gray-500">olajide@skilarna.com</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}