'use client';
import { Layout, Input, Avatar, Badge } from 'antd';
import {
  SearchOutlined,
  BellOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useEffect, useState } from 'react';

const { Header } = Layout;

export default function SellerHeader() {
  const [full_name, setFullname] = useState<string>('');
  const [avatar, setUseravatar] = useState<string>('');
  useEffect(() => {
    const userDataString = localStorage.getItem('user');

    if (userDataString) {
      try {
        const userData = JSON.parse(userDataString);
        console.log(userData);
        if (userData.full_name) {
          setFullname(userData.full_name);
        }
        if(!userData.avatar){
          setUseravatar('https://api.dicebear.com/7.x/miniavs/svg?seed=1');
        }
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
      }
    }
  }, []);

  return (
    <Header className="bg-white shadow-sm px-6 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        <Input
          placeholder="Tìm kiếm..."
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
          <span className="text-gray-600">Xin chào, {full_name}!</span>
          <Avatar src={avatar} size={32} />
        </div>
      </div>
    </Header>
  );
}
