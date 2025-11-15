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
  async createConversation(userId: number, storeId: number, orderId?: number) {
    const where: any = { user: { id: userId }, store: { id: storeId } };
    if (orderId) where.order = { id: orderId };

    const existing = await this.conversationRepo.findOne({
      where,
      relations: ['user', 'user.profile', 'store', 'order', 'messages'],
    });
    if (existing) return existing;

    const conversationData: any = {
      user: { id: userId } as User,
      store: { id: storeId } as Store,
    };
    if (orderId) conversationData.order = { id: orderId } as Order;

    const conversation = this.conversationRepo.create(conversationData);
    return this.conversationRepo.save(conversation);
  }

  async getConversationsForUser(userId: number) {
    return this.conversationRepo.find({
      where: { user: { id: userId } },
      relations: ['store', 'messages'],
      order: { updated_at: 'DESC' },
    });
  }

  async getConversationsForStore(storeId: number) {
    return this.conversationRepo.find({
      where: { store: { id: storeId } },
      relations: ['user', 'user.profile', 'messages'],
      order: { updated_at: 'DESC' },
    });
  }

  // ---------------- Messages ----------------
  async sendMultipleMediaMessages(
    conversationId: number,
    senderId: number,
    senderType: SenderType,
    content: string | undefined,
    mediaUrls: string[]
  ) {
    const messages = mediaUrls.map((url) => {
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

      return this.messageRepo.create({
        conversation: { id: conversationId },
        sender_id: senderId,
        sender_type: senderType,
        message_type: type,
        content,
        media_url: url,
        is_read: false,
      });
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
