import { Store } from "../../service/store.service";
import { User } from "./user";
import { Order } from "./order";

export enum SenderType {
  USER = 'user',
  STORE = 'store',
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
}

export interface ConversationRef {
  id: number;
}

export interface Message {
  id: number;
  conversation_id: number;
  conversation?: ConversationRef; // object kèm id
  sender_id: number;
  sender_type: SenderType;
  message_type: MessageType;
  content?: string;
  media_url?: string;
  is_read: boolean;
  created_at: string;
}


export interface Conversation {
  id: number;
  user: User; // <-- thay user_id
  store: Store;
  order?: Order;
  messages: Message[];
  created_at: string;
  updated_at: string;
  unreadCount: number; // số tin nhắn chưa đọc trong cuộc hội thoại
}
