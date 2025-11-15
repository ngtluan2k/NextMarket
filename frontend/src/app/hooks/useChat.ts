import { useState, useRef, useCallback, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import * as ChatService from '../../service/chat.service';
import {
  MessageType,
  SenderType,
  Message,
  Conversation,
} from '../types/chat.types';

const BE_BASE_URL = import.meta.env.VITE_BE_BASE_URL || 'http://localhost:3000';

export const useChat = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);

  // ---------------- Init Socket ----------------
  const initSocket = useCallback(() => {
    if (socketRef.current) return; // chỉ init 1 lần

    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = io(BE_BASE_URL, {
      auth: { token },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () =>
      console.log('Connected to chat server', socket.id)
    );
    socket.on('disconnect', () => console.log('Disconnected from chat server'));

    socket.on('newMessage', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });
  }, []);

  // ---------------- Wrap service ----------------
  const fetchConversations = useCallback(
    async (mode: 'user' | 'store' = 'user', storeId?: number) => {
      setLoading(true);
      try {
        let data;
        if (mode === 'user') {
          data = await ChatService.getConversationsForUser();
        } else if (mode === 'store' && storeId) {
          data = await ChatService.getConversationsForStore(storeId);
        } else {
          data = [];
        }
        setConversations(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch conversations');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchMessages = useCallback(async (convId: number) => {
    setLoading(true);
    try {
      const conv = await ChatService.getConversationById(convId);
      setMessages(conv.messages || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  }, []);

  const sendMessage = useCallback(
  async (
    conversationId: number,
    senderType: SenderType,
    messageType: MessageType,
    content?: string,
    mediaFiles?: File[] // 👈 nhiều file
  ) => {
    try {
      const msgs = await ChatService.sendMessage(
        conversationId,
        senderType,
        messageType,
        content,
        mediaFiles
      );

      // Nếu backend trả về mảng message (1 message mỗi file), thêm tất cả vào state
      setMessages((prev) => [...prev, ...msgs]);
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    }
  },
  []
);


  const markAsRead = useCallback(
    async (conversationId: number, receiverType: SenderType) => {
      try {
        await ChatService.markAsRead(conversationId, receiverType);
        setMessages((prev) => prev.map((m) => ({ ...m, is_read: true })));
      } catch (err: any) {
        setError(err.message || 'Failed to mark as read');
      }
    },
    []
  );

  const startConversation = useCallback(
    async (storeId: number, orderId?: number) => {
      try {
        const conv = await ChatService.createConversation(storeId, orderId);
        // Thêm conversation mới vào danh sách hiện tại
        setConversations((prev) => [conv, ...prev]);
        // Trả về conversation để dùng navigate hoặc setSelected
        return conv;
      } catch (err: any) {
        setError(err.message || 'Failed to start conversation');
        throw err;
      }
    },
    []
  );

  return {
    conversations,
    messages,
    loading,
    error,
    initSocket,
    fetchConversations,
    fetchMessages,
    sendMessage,
    markAsRead,
    startConversation,
  };
};
