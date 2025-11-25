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

    socket.on('newMessage', (msg: Message[]) => {
      console.log('[Hook] New message received:', msg);
      // Lấy convId từ message (ưu tiên conversation.id)
      let convId = msg[0]?.conversation?.id ?? msg[0]?.conversation_id;
      if (!convId) return;

      // Convert sang number (vì BE đôi khi trả string)
      convId = Number(convId);

      const isOpen = selectedConvRef.current === convId;
      console.log('[Socket] New message convId:', convId);
      console.log('[Socket] Current selectedConvRef:', selectedConvRef.current);
      console.log('[Socket] Tin nhắn có thuộc conversation đang mở?', isOpen);

      // Cập nhật trong danh sách conversation
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

      // Nếu đang mở thì append message + emit markAsRead
      if (isOpen) {
        setMessages((prev) => [...prev, ...msg]);
        socketRef.current?.emit('markAsRead', {
          conversationId: convId,
          receiverType: senderType,
        });
      }
    });

    // Khi conversation mới được tạo (1-1)
    socket.on('conversationCreated', (conv: Conversation) => {
      setConversations((prev) => [conv, ...prev]);
    });

    // Khi conversation nhóm được tạo
    socket.on('groupConversationCreated', (conv: Conversation) => {
      // Join room ngay
      socket.emit('joinGroupConversation', { conversationId: conv.id });
      setConversations((prev) => [conv, ...prev]);
    });

    // Join room khi selectedConversationId thay đổi (mở group chat)
    if (selectedConversationId) {
      socket.emit(
        'joinGroupConversation',
        { conversationId: selectedConversationId },
        () => {
          console.log('Joined room group-' + selectedConversationId);
        }
      );
    }

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

  const startGroupConversation = async (
    groupOrderId: number
  ): Promise<Conversation> => {
    if (!socketRef.current) throw new Error('Socket not connected');
    return new Promise((resolve, reject) => {
      socketRef.current!.emit(
        'startGroupConversation',
        { groupOrderId },
        (conv: Conversation) => {
          if (!conv) return reject(new Error('No group conversation returned'));
          // Join room ngay
          socketRef.current!.emit('joinConversation', conv.id);
          resolve(conv);
        }
      );
    });
  };

  const joinConversationRoom = (conversationId: number) => {
    socketRef.current?.emit('joinConversation', conversationId);
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
    startGroupConversation,
    markAsRead,
    joinConversationRoom,
  };
};
