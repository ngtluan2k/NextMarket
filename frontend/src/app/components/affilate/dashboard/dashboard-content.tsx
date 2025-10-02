"use client"

import type React from "react"

import { Wallet, Eye, Users, TrendingUp, Copy, ExternalLink } from "lucide-react"
import { Button } from "antd"
import { Card } from "antd"

const stats = [
  {
    title: "All revenue",
    value: "₦0.000.00",
    change: "0.0%",
    icon: Wallet,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
  },
  {
    title: "Link clicks",
    value: "0.000",
    change: "0.0%",
    icon: Eye,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    title: "Buyers from link",
    value: "00",
    change: "0.0%",
    icon: Users,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
  },
]

const timeFilters = ["12 months", "30 days", "7 days", "24 hours"]

export function DashboardContent() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Avatar className="h-6 w-6">
            <AvatarImage src="/placeholder.svg?height=24&width=24" />
            <AvatarFallback className="bg-orange-100 text-orange-600 text-xs">IO</AvatarFallback>
          </Avatar>
          <span>Ilelakinwa Olajide</span>
          <span>/</span>
          <span>Dashboard</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, Olajide</h1>
        <p className="text-gray-600">Here's an overview of your dashboard & revenue.</p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2" />
          What's new?
        </Button>
        <Button className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50">
          <span className="w-2 h-2 bg-orange-500 rounded-full mr-2" />
          Referrals - 0
        </Button>
        <Button className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50">
          <Copy className="h-4 w-4 mr-2" />
          Copy link
        </Button>
        <Button className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50">
          Visit store
          <ExternalLink className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.iconBg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <TrendingUp className="h-4 w-4" />
                  <span>{stat.change}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
           
          </Card>
        ))}
      </div>

      {/* Available Balance */}
      <Card className="border-gray-200 shadow-sm">
      
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Available balance</p>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-bold text-gray-900">₦0.000.00</p>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">0.0%</span>
              </div>
            </div>
            <div className="flex gap-2">
              {timeFilters.map((filter) => (
                <Button
                  key={filter}
            
                  size="small"
                  className={`text-sm ${
                    filter === "12 months" ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {filter}
                </Button>
              ))}
              <Button  size="small" className="text-gray-600 hover:bg-gray-50">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
                Filters
              </Button>
            </div>
          </div>

          {/* Empty State */}
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-6 opacity-20">
              <svg className="h-32 w-32 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Your Portfolio revenue is empty</h3>
            <p className="text-gray-600 max-w-md">
              When people start buying through your link your revenue and chart will start showing here
            </p>
          </div>
      </Card>
    </div>
  )
}

function Avatar({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={`rounded-full overflow-hidden ${className}`}>{children}</div>
}

function AvatarImage({ src }: { src: string }) {
  return <img src={src || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
}

function AvatarFallback({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={`w-full h-full flex items-center justify-center font-medium ${className}`}>{children}</div>
}
