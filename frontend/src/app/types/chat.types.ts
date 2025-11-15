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

export interface Message {
  id: number;
  conversation_id: number;
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
}
