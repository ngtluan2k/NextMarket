'use client';
import { Layout, Input, Avatar, Badge } from 'antd';
import {
  SearchOutlined,
  BellOutlined,
  WechatWorkOutlined,
} from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { StoreChat } from '../ChatBoxForStore';
import { Store, storeService } from '../../../service/store.service';
import { useChatSocket } from '../../hooks/useChatSocket';
import { SenderType } from '../../types/chat.types';

const { Header } = Layout;

export default function SellerHeader() {
  const [full_name, setFullname] = useState<string>('');
  const [avatar, setUseravatar] = useState<string>('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [storeId, setStoreId] = useState<number | null>(null);
  const [totalUnread, setTotalUnread] = useState(0);

  const onOpenChat = () => setIsChatOpen(true);
  const onCloseChat = () => {
    setIsChatOpen(false); // đóng modal
    setSelectedConversationId(null); // bỏ chọn conversation
  };

  // Lấy storeId
  useEffect(() => {
    const fetchStore = async () => {
      const store: Store | null = await storeService.getMyStore();
      if (store) setStoreId(store.id);
    };
    fetchStore();
  }, []);

  // Lấy info user
  useEffect(() => {
    const userDataString = localStorage.getItem('user');
    if (userDataString) {
      try {
        const userData = JSON.parse(userDataString);
        if (userData.full_name) setFullname(userData.full_name);
        setUseravatar(
          userData.avatar || 'https://api.dicebear.com/7.x/miniavs/svg?seed=1'
        );
      } catch (error) {
        console.error(error);
      }
    }
  }, []);

  // --- Hook WebSocket luôn chạy, dù modal chưa mở ---
  const {
    conversations,
    markAsRead,
    sendMessage,
    setConversations,
    selectedConversationId,
    setSelectedConversationId,
  } = useChatSocket(storeId!, SenderType.STORE);

  // Cập nhật totalUnread mỗi khi conversations thay đổi
  useEffect(() => {
    if (!conversations) return;
    const total = conversations.reduce(
      (acc, c) => acc + (c.unreadCount || 0),
      0
    );
    setTotalUnread(total);
  }, [conversations]);

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
        {/* Badge tin nhắn chưa đọc */}
        <Badge count={totalUnread} size="small" dot={totalUnread === 0}>
          <WechatWorkOutlined
            className="text-xl text-gray-600 cursor-pointer"
            onClick={onOpenChat}
          />
        </Badge>

        <Badge dot>
          <BellOutlined className="text-xl text-gray-600 cursor-pointer" />
        </Badge>
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Xin chào, {full_name}!</span>
          <Avatar src={avatar} size={32} />
        </div>
      </div>

      {/* Modal chat */}
      {isChatOpen && storeId && (
        <div className="fixed inset-0 bg-black/30 z-50 flex justify-end">
          <div className="w-full max-w-4xl h-full bg-white shadow-lg relative">
            <StoreChat
              storeId={storeId}
              conversations={conversations}
              setConversations={setConversations}
              selectedConversationId={selectedConversationId}
              setSelectedConversationId={setSelectedConversationId}
              markAsRead={markAsRead}
              sendMessage={sendMessage}
            />
            <button
              onClick={onCloseChat}
              className="absolute top-2 right-2 text-red-500 font-bold"
            >
              X
            </button>
          </div>
        </div>
      )}
    </Header>
  );
}
