"use client"
import { Card, Typography } from "antd"
import { MoreOutlined } from "@ant-design/icons"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts"

const { Title, Text } = Typography

const salesData = [
  { name: "T2", sales: 184000000, target: 138000000 },
  { name: "T3", sales: 276000000, target: 230000000 },
  { name: "T4", sales: 207000000, target: 184000000 },
  { name: "T5", sales: 161000000, target: 207000000 },
  { name: "T6", sales: 253000000, target: 230000000 },
  { name: "T7", sales: 299000000, target: 276000000 },
  { name: "CN", sales: 276000000, target: 253000000 },
]

export default function SalesOverview() {
  return (
    <Card className="h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Title level={4} className="!mb-1">
            Tổng Quan Doanh Thu
          </Title>
          <Text className="text-cyan-500 cursor-pointer">Xem phân tích chi tiết</Text>
        </div>
        <MoreOutlined className="text-gray-400 cursor-pointer" />
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={salesData} barCategoryGap="20%">
            <XAxis dataKey="name" axisLine={false} tickLine={false} className="text-xs" />
            <YAxis axisLine={false} tickLine={false} className="text-xs" />
            <Bar dataKey="sales" fill="#0891b2" radius={[4, 4, 0, 0]} />
            <Bar dataKey="target" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
          <Text className="text-sm text-gray-600">Doanh Thu</Text>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <Text className="text-sm text-gray-600">Mục Tiêu</Text>
        </div>
      </div>
    </Card>
  )
}