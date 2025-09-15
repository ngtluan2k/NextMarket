"use client"
import { Card, Typography } from "antd"
import { MoreOutlined } from "@ant-design/icons"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts"

const { Title, Text } = Typography

const salesData = [
  { name: "Mon", sales: 8000, target: 6000 },
  { name: "Tue", sales: 12000, target: 10000 },
  { name: "Wed", sales: 9000, target: 8000 },
  { name: "Thu", sales: 7000, target: 9000 },
  { name: "Fri", sales: 11000, target: 10000 },
  { name: "Sat", sales: 13000, target: 12000 },
  { name: "Sun", sales: 12000, target: 11000 },
]

export default function SalesOverview() {
  return (
    <Card className="h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Title level={4} className="!mb-1">
            Sales Overview
          </Title>
          <Text className="text-cyan-500 cursor-pointer">View detailed analytics</Text>
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
          <Text className="text-sm text-gray-600">Sales</Text>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <Text className="text-sm text-gray-600">Target</Text>
        </div>
      </div>
    </Card>
  )
}