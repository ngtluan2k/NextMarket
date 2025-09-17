"use client"
import { Layout, Input, Avatar, Badge } from "antd"
import { SearchOutlined, BellOutlined, SettingOutlined } from "@ant-design/icons"

const { Header } = Layout

export default function SellerHeader() {
  return (
    <Header className="bg-white shadow-sm px-6 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        <Input
          placeholder="Search..."
          prefix={<SearchOutlined className="text-gray-400" />}
          className="max-w-md"
          size="large"
        />
      </div>
      <div className="flex items-center gap-4">
        <Badge dot>
          <BellOutlined className="text-xl text-gray-600 cursor-pointer" />
        </Badge>
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Hello, Julia!</span>
          <Avatar src="/woman-profile.png" size={32} />
        </div>
      </div>
    </Header>
  )
}