import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { SenderType, MessageType } from './entities/message.entity';

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private onlineUsers: Map<number, string> = new Map(); // userId -> socketId

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    const userId = Number(client.handshake.query.userId);
    if (userId) this.onlineUsers.set(userId, client.id);
    console.log('Connected:', userId, client.id);
  }

  handleDisconnect(client: Socket) {
    for (const [userId, socketId] of this.onlineUsers.entries()) {
      if (socketId === client.id) this.onlineUsers.delete(userId);
    }
    console.log('Disconnected:', client.id);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody()
    data: {
      conversationId: number;
      senderId: number;
      senderType: SenderType;
      messageType: MessageType;
      content?: string;
      mediaUrl?: string;
    },
    @ConnectedSocket() client: Socket
  ) {
    // Lưu message vào DB
    const message = await this.chatService.sendMessage(
      data.conversationId,
      data.senderId,
      data.senderType,
      data.messageType,
      data.content,
      data.mediaUrl
    );

    // Load conversation kèm user + store
    const conversation = await this.chatService.getConversationById(
      data.conversationId
    );

    if (!conversation || !conversation.store || !conversation.user) {
      throw new Error('Conversation or participants not found');
    }

    // Xác định receiver
    const receiverId =
      data.senderType === SenderType.USER
        ? conversation.store.id
        : conversation.user.id;

    const socketId = this.onlineUsers.get(receiverId);
    if (socketId) {
      this.server.to(socketId).emit('newMessage', message);
    }

    return message;
  }
}
