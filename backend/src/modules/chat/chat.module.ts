import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { ChatController } from './chat.controller';
import { GroupOrder } from '../group_orders/group_orders.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, Message, GroupOrder]), // <--- quan trọng
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService],
})
export class ChatModule {}
