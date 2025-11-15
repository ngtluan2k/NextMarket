import axios from 'axios';
import { SenderType, MessageType } from '../app/types/chat.types';

const BE_BASE_URL = import.meta.env.VITE_BE_BASE_URL || 'http://localhost:3000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ---------------- Conversations ----------------
export const createConversation = async (storeId: number, orderId?: number) => {
  const res = await axios.post(
    `${BE_BASE_URL}/chat/conversation`,
    { storeId, orderId },
    { headers: getAuthHeaders() }
  );
  return res.data;
};

export const getConversationsForUser = async () => {
  const res = await axios.get(`${BE_BASE_URL}/chat/conversation/user`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const getConversationsForStore = async (storeId: number) => {
  const res = await axios.get(
    `${BE_BASE_URL}/chat/conversation/store/${storeId}`,
    { headers: getAuthHeaders() }
  );
  console.log('getConversationsForStore', res.data);
  return res.data;
};

// ---------------- Messages ----------------
export const sendMessage = async (
  conversationId: number,
  senderType: SenderType,
  messageType: MessageType,
  content?: string,
  mediaFiles?: File[]
) => {
  const formData = new FormData();
  formData.append('conversationId', String(conversationId));
  formData.append('senderType', senderType);
  formData.append('messageType', messageType);
  if (content) formData.append('content', content);
  mediaFiles?.forEach(file => formData.append('media', file)); // 👈 nhiều file

  const res = await axios.post(`${BE_BASE_URL}/chat/message`, formData, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'multipart/form-data',
    },
  });

  return res.data;
};



export const markAsRead = async (
  conversationId: number,
  receiverType: SenderType
) => {
  const res = await axios.post(
    `${BE_BASE_URL}/chat/message/read`,
    { conversationId, receiverType },
    { headers: getAuthHeaders() }
  );
  return res.data;
};

export const getConversationById = async (conversationId: number) => {
  const res = await axios.get(
    `${BE_BASE_URL}/chat/conversation/${conversationId}`,
    { headers: getAuthHeaders() }
  );
  return res.data;
};
