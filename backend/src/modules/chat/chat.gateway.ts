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
import { SenderType } from './entities/message.entity';

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: 'http://localhost:4200',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'], // bắt buộc WS + fallback polling
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  // Map userId/storeId -> socketIds
  private onlineUsers: Map<string, string[]> = new Map();

  constructor(private readonly chatService: ChatService) {}

  // ---------------- Connection ----------------
  handleConnection(client: Socket) {
    const userId = Number(client.handshake.query.userId);
    const senderType: SenderType = client.handshake.query
      .senderType as SenderType;

    if (!userId || !senderType) return;

    const key = `${senderType}-${userId}`;
    const sockets = this.onlineUsers.get(key) || [];
    sockets.push(client.id);
    this.onlineUsers.set(key, sockets);

    console.log('✅ Connected:', key, client.id);
  }

  handleDisconnect(client: Socket) {
    for (const [key, sockets] of this.onlineUsers.entries()) {
      const filtered = sockets.filter((id) => id !== client.id);
      if (filtered.length > 0) {
        this.onlineUsers.set(key, filtered);
      } else {
        this.onlineUsers.delete(key);
      }
    }
    console.log('⚠️ Disconnected:', client.id);
  }

 @SubscribeMessage('joinGroupConversation')
handleJoinGroupConversation(
  @MessageBody() data: { conversationId: number },
  @ConnectedSocket() client: Socket
) {
  client.join(`group-${data.conversationId}`);
  console.log('Joined room:', `group-${data.conversationId}`);
}


  // ---------------- Send message ----------------
  @SubscribeMessage('startConversation')
  async handleStartConversation(
    @MessageBody()
    data: { userId?: number; storeId?: number; orderId?: number },
    @ConnectedSocket() client: Socket
  ) {
    if (!data.userId || !data.storeId) {
      throw new Error('UserId or StoreId is required');
    }

    const userId = data.userId;
    const storeId = data.storeId;

    // Tạo hoặc lấy conversation đã tồn tại
    const conversation = await this.chatService.createConversation(
      userId,
      storeId,
      data.orderId
    );

    // Emit về chính socket của sender để cập nhật list conversation
    // Lúc này conversation đã có user.profile.full_name và store.name
    client.emit('conversationCreated', conversation);

    return conversation;
  }

  @SubscribeMessage('startGroupConversation')
  async handleStartGroupConversation(
    @MessageBody() data: { groupOrderId: number },
    @ConnectedSocket() client: Socket
  ) {
    if (!data.groupOrderId) throw new Error('groupOrderId is required');

    const conversation = await this.chatService.createGroupConversation(
      data.groupOrderId
    );

    if (conversation) {
      console.log(`[ChatGateway] conversation returned, id=${conversation.id}`);
    } else {
      console.warn(
        `[ChatGateway] conversation is null for groupOrderId=${data.groupOrderId}`
      );
    }

    // Cho client join room group
    client.join(`conversation-${conversation.id}`);

    // Emit lại conversation cho chính client
    client.emit('groupConversationCreated', conversation);

    return conversation;
  }

 @SubscribeMessage('sendMessage')
async handleMessage(
  @MessageBody()
  data: {
    conversationId: number;
    senderId: number;
    senderType: SenderType;
    content?: string;
    mediaUrls?: string[];
  },
  @ConnectedSocket() client: Socket
) {
  console.log('📩 Received sendMessage from client:', data);

  // Lưu tin nhắn
  const messages = await this.chatService.sendMultipleMediaMessages(
    data.conversationId,
    data.senderId,
    data.senderType,
    data.content,
    data.mediaUrls || []
  );
  console.log('💾 Messages saved:', messages.map(m => m.id));

  // Lấy thông tin conversation
  const conversation = await this.chatService.getConversationById(
    data.conversationId
  );
  console.log('📝 Conversation fetched:', conversation?.id, conversation?.group_order?.id);

  if (!conversation) throw new Error('Conversation not found');

  // Nếu là group conversation
  if (conversation.group_order) {
    const room = `group-${conversation.id}`;
    console.log('🏠 Broadcasting to room:', room);
    this.server.to(room).emit('newMessage', messages);
  } else if (conversation.store && conversation.user) {
    console.log('👤 1-1 conversation, sending to specific sockets');

    const receiverKey =
      data.senderType === SenderType.USER
        ? `${SenderType.STORE}-${conversation.store.id}`
        : `${SenderType.USER}-${conversation.user.id}`;

    const receiverSockets = this.onlineUsers.get(receiverKey) || [];
    console.log('🔑 Receiver sockets:', receiverSockets);
    receiverSockets.forEach((sid) =>
      this.server.to(sid).emit('newMessage', messages)
    );

    // Emit lại cho sender
    const senderKey = `${data.senderType}-${data.senderId}`;
    const senderSockets = this.onlineUsers.get(senderKey) || [];
    console.log('🔑 Sender sockets:', senderSockets);
    senderSockets.forEach((sid) =>
      this.server.to(sid).emit('newMessage', messages)
    );
  }

  return messages;
}


  // ---------------- Get conversation list ----------------
  @SubscribeMessage('getConversations')
  async handleGetConversations(
    @MessageBody() data: { id: number; mode: 'user' | 'store' }
  ) {
    if (data.mode === 'user') {
      return this.chatService.getConversationsForUser(data.id);
    } else {
      return this.chatService.getConversationsForStore(data.id);
    }
  }

  // ---------------- Mark as read ----------------
  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @MessageBody() data: { conversationId: number; receiverType: SenderType }
  ) {
    // 1️⃣ Update database
    await this.chatService.markAsRead(data.conversationId, data.receiverType);

    // 2️⃣ Lấy conversation
    const conversation = await this.chatService.getConversationById(
      data.conversationId
    );

    if (!conversation) {
      console.warn('Conversation not found', data.conversationId);
      return { success: false, message: 'Conversation not found' };
    }

    // 3️⃣ Filter messages vừa được read
    const readMessages = conversation.messages.filter(
      (msg) => msg.sender_type !== data.receiverType && msg.is_read
    );

    // 4️⃣ Broadcast 1 lần cho tất cả socket của người gửi
    if (!conversation.user || !conversation.store) {
      console.warn('Conversation missing user or store', conversation.id);
      return { success: false, message: 'Invalid conversation' };
    }

    const oppositeKey =
      data.receiverType === SenderType.USER
        ? `${SenderType.STORE}-${conversation.store.id}`
        : `${SenderType.USER}-${conversation.user.id}`;

    const targetSockets = this.onlineUsers.get(oppositeKey) || [];
    targetSockets.forEach((sid) =>
      this.server.to(sid).emit('messageRead', {
        conversationId: data.conversationId,
        messageIds: readMessages.map((m) => m.id),
      })
    );

    return { success: true };
  }
}
