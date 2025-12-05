import { io, Socket } from 'socket.io-client';
import { Message } from '../app/types/chat.types';


type NewMessageCallback = (msgs: Message | Message[]) => void;

class ChatSocketService {
  private socket: Socket | null = null;

  init(token: string, userId: number) { /* ... */ }

  sendMessage(conversationId: number, senderId: number, senderType: 'user' | 'store', content?: string, mediaUrls?: string[]) {
    if (!this.socket || !this.socket.connected) return;
    this.socket.emit('sendMessage', { conversationId, senderId, senderType, content, mediaUrls });
  }

getConversations(userId: number, mode: "user" | "store", cb: (convs: any[]) => void) {
  this.socket?.emit("getConversations", { id: userId, mode }, cb);
}

onNewMessage(cb: NewMessageCallback) {
  this.socket?.on("newMessage", cb);
}

  markAsRead(conversationId: number, receiverType: 'user' | 'store') {
    if (!this.socket) return;
    this.socket.emit('markAsRead', { conversationId, receiverType });
  }
startConversation(userId: number, storeId: number, orderId?: number, cb?: (conv: any) => void) {
  if (!this.socket || !this.socket.connected) return;
  this.socket.emit("startConversation", { userId, storeId, orderId }, cb);
}
}

export const chatSocketService = new ChatSocketService();

