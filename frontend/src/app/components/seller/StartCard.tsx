"use client"
import { Card, Typography, Progress } from "antd"

const { Title, Text } = Typography

export default function StatsCards() {
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <Text className="text-gray-500 text-sm">Sales Revenue</Text>
            <Title level={3} className="!mb-0 !text-gray-900">
              95.345 €
            </Title>
            <Text className="text-green-500 text-sm">↗ 12.3%</Text>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <Text className="text-gray-500 text-sm">Items Sold</Text>
            <Title level={3} className="!mb-0 !text-gray-900">
              1584
            </Title>
            <Text className="text-red-500 text-sm">↘ 5.8%</Text>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <Text className="text-gray-500 text-sm">Avg order value</Text>
            <Title level={4} className="!mb-0 !text-gray-900">
              32 €
            </Title>
          </div>
          <div>
            <Text className="text-gray-500 text-sm">Avg order units</Text>
            <Title level={4} className="!mb-0 !text-gray-900">
              2.60
            </Title>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16">
            <Progress
              type="circle"
              percent={87}
              size={64}
              strokeColor="#10b981"
              trailColor="#f3f4f6"
              strokeWidth={8}
              format={() => <span className="text-lg font-bold text-gray-900">87%</span>}
            />
          </div>
          <div>
            <Title level={4} className="!mb-0 !text-gray-900">
              95.345 €
            </Title>
            <Text className="text-gray-500 text-sm">/ 120k € Target</Text>
            <div className="text-gray-500 text-sm">Sales Revenue in period</div>
          </div>
        </div>
      </Card>
    </div>
  )
}