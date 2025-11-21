import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { Message, MessageType, SenderType } from './entities/message.entity';
import { User } from '../user/user.entity';
import { Store } from '../store/store.entity';
import { Order } from '../orders/order.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>
  ) {}

  // ---------------- Conversation ----------------
  async createConversation(
    userId: number,
    storeId: number,
    orderId?: number
  ): Promise<Conversation> {
    const where: any = { user: { id: userId }, store: { id: storeId } };
    if (orderId) where.order = { id: orderId };

    const existing = await this.conversationRepo.findOne({
      where,
      relations: ['user', 'user.profile', 'store', 'order', 'messages'],
    });

    if (existing) return existing;

    const conversation = this.conversationRepo.create({
      user: { id: userId } as User,
      store: { id: storeId } as Store,
      order: orderId ? ({ id: orderId } as Order) : undefined,
    });

    const savedConversation = await this.conversationRepo.save(conversation);

    // Fetch lại với relations đầy đủ để chắc chắn có user.profile.full_name và store.name
    const fullConversation = await this.conversationRepo.findOneOrFail({
      where: { id: savedConversation.id },
      relations: ['user', 'user.profile', 'store', 'order', 'messages'],
    });

    return fullConversation;
  }

  async getConversationsForUser(userId: number) {
    const conversations = await this.conversationRepo.find({
      where: { user: { id: userId } },
      relations: ['store', 'messages'],
      order: { updated_at: 'DESC' },
    });

    return conversations.map((c) => ({
      ...c,
      unreadCount: c.messages.filter(
        (m) => !m.is_read && m.sender_type === 'store'
      ).length,
    }));
  }

  async getConversationsForStore(storeId: number) {
    const conversations = await this.conversationRepo.find({
      where: { store: { id: storeId } },
      relations: ['user', 'user.profile', 'messages'],
      order: { updated_at: 'DESC' },
    });

    return conversations.map((c) => ({
      ...c,
      unreadCount: c.messages.filter(
        (m) => !m.is_read && m.sender_type === 'user'
      ).length,
      messages: c.messages.map((m) => ({
        ...m,
        is_read: !!m.is_read, // ép thành boolean
      })),
    }));
  }

  // ---------------- Messages ----------------
  async sendMultipleMediaMessages(
    conversationId: number,
    senderId: number,
    senderType: SenderType,
    content: string | undefined,
    mediaUrls: string[]
  ) {
    const messages: any[] = [];

    // Nếu có content text và không có media
    if (content && mediaUrls.length === 0) {
      messages.push(
        this.messageRepo.create({
          conversation: { id: conversationId },
          sender_id: senderId,
          sender_type: senderType,
          message_type: MessageType.TEXT,
          content,
          is_read: false,
        })
      );
    }

    // Nếu có media
    mediaUrls.forEach((url) => {
      // Lấy đuôi file
      const ext = url.split('.').pop()?.toLowerCase();

      let type: MessageType;
      if (ext === 'mp4' || ext === 'webm' || ext === 'ogg') {
        type = MessageType.VIDEO;
      } else if (
        ext === 'png' ||
        ext === 'jpg' ||
        ext === 'jpeg' ||
        ext === 'gif'
      ) {
        type = MessageType.IMAGE;
      } else {
        type = MessageType.IMAGE; // default
      }

      messages.push(
        this.messageRepo.create({
          conversation: { id: conversationId },
          sender_id: senderId,
          sender_type: senderType,
          message_type: type,
          content, // vẫn giữ text nếu muốn kèm media
          media_url: url,
          is_read: false,
        })
      );
    });

    return this.messageRepo.save(messages);
  }

  async markAsRead(conversationId: number, receiverType: SenderType) {
    return this.messageRepo
      .createQueryBuilder()
      .update()
      .set({ is_read: true })
      .where('conversation_id = :conversationId', { conversationId })
      .andWhere('sender_type != :receiverType', { receiverType })
      .execute();
  }
  async getConversationById(conversationId: number) {
    return this.conversationRepo.findOne({
      where: { id: conversationId },
      relations: ['user', 'user.profile', 'store', 'messages'],
    });
  }
}
