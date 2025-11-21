import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { SenderType, Message, Conversation } from '../types/chat.types';
import {
  getConversationById,
  getConversationsForUser,
  getConversationsForStore,
} from '../../service/chat.service';

const BE_BASE_URL = import.meta.env.VITE_BE_BASE_URL || 'http://localhost:3000';

export const useChatSocket = (id: number, senderType: SenderType) => {
  const socketRef = useRef<Socket | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<
    number | null
  >(null);
  const selectedConvRef = useRef<number | null>(selectedConversationId);

  useEffect(() => {
    selectedConvRef.current = selectedConversationId;
  }, [selectedConversationId]);

  // Load conversation list
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const convs =
          senderType === SenderType.USER
            ? await getConversationsForUser()
            : await getConversationsForStore(id);
        setConversations(convs);
      } catch (err) {
        console.error(err);
      }
    };
    loadConversations();
  }, [id, senderType]);

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }
    const loadMessages = async () => {
      try {
        const conv = await getConversationById(selectedConversationId);
        setMessages(conv.messages || []);
      } catch (err) {
        console.error(err);
      }
    };
    loadMessages();
  }, [selectedConversationId]);

  // Socket connection
  useEffect(() => {
    if (!id || !senderType) return;

    const socket = io(`${BE_BASE_URL}/chat`, {
      query: { userId: id, senderType },
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    socketRef.current = socket;

    // Nhận tin nhắn mới
    socket.on('newMessage', (msg: Message[]) => {
      const convId = msg[0]?.conversation?.id ?? msg[0]?.conversation_id;
      if (!convId) return;

      const isOpen = selectedConvRef.current === convId;

      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id !== convId) return conv;

          return {
            ...conv,
            messages: [...(conv.messages || []), ...msg],
            unreadCount: isOpen ? 0 : (conv.unreadCount ?? 0) + msg.length,
          };
        })
      );

      // Nếu conversation đang mở → update messages ngay
      if (isOpen) {
        setMessages((prev) => [...prev, ...msg]);

        socketRef.current?.emit('markAsRead', {
          conversationId: convId,
          receiverType: senderType,
        });
      }
    });

    // Khi conversation mới được tạo
    socket.on('conversationCreated', (conv: Conversation) => {
      setConversations((prev) => [conv, ...prev]);
    });

    // Khi phía gửi nhận thông báo đã đọc
    socket.on('messageRead', ({ conversationId, messageIds }: any) => {
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              messages: conv.messages.map((msg) =>
                messageIds.includes(msg.id) ? { ...msg, is_read: true } : msg
              ),
            };
          }
          return conv;
        })
      );

      if (selectedConvRef.current === conversationId) {
        setMessages((prev) =>
          prev.map((msg) =>
            messageIds.includes(msg.id) ? { ...msg, is_read: true } : msg
          )
        );
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [id, senderType]);

  const sendMessage = (
    conversationId: number,
    content?: string,
    mediaUrls: string[] = []
  ) => {
    if (!socketRef.current) return;
    socketRef.current.emit('sendMessage', {
      conversationId,
      senderId: id,
      senderType,
      content,
      mediaUrls,
    });
  };

  const startConversation = async (storeId: number): Promise<Conversation> => {
    const socket = socketRef.current;
    if (!socket) throw new Error('Socket not connected');

    return new Promise((resolve, reject) => {
      socket.emit(
        'startConversation',
        { storeId, userId: id },
        (conversation: Conversation) => {
          if (!conversation)
            return reject(new Error('No conversation returned'));
          resolve(conversation);
        }
      );
    });
  };

  const markAsRead = (conversationId: number) => {
    if (!socketRef.current) return;
    socketRef.current.emit('markAsRead', {
      conversationId,
      receiverType: senderType,
    });
  };

  return {
    conversations,
    setConversations,
    messages,
    setMessages,
    selectedConversationId,
    setSelectedConversationId,
    sendMessage,
    startConversation,
    markAsRead,
  };
};
