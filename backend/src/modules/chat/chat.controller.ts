import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { SenderType, MessageType } from './entities/message.entity';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadedFile } from '@nestjs/common';



@UseGuards(JwtAuthGuard) // áp dụng cho tất cả route
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // ---------------- Conversation ----------------
  @Post('conversation')
  async createConversation(
    @Body() body: { storeId: number; orderId?: number },
    @Request() req: any
  ) {
    const userId = req.user.userId; // lấy userId từ JWT
    return this.chatService.createConversation(
      userId,
      body.storeId,
      body.orderId
    );
  }

  @Get('conversation/user')
  async getConversationsForUser(@Request() req: any) {
    const userId = req.user.userId; // lấy userId từ JWT
    return this.chatService.getConversationsForUser(userId);
  }

  @Get('conversation/store/:storeId')
  async getConversationsForStore(
    @Param('storeId') storeId: number,
    @Request() req: any
  ) {
    // TODO: nếu bạn có JWT cho store thì check req.user là store
    return this.chatService.getConversationsForStore(Number(storeId));
  }

  // ---------------- Messages ----------------
 @UseGuards(JwtAuthGuard)
  @Post('message')
  @UseInterceptors(
    FilesInterceptor('media', 10, { // tối đa 10 files
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads', 'chat');
          if (!existsSync(uploadPath)) mkdirSync(uploadPath, { recursive: true });
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
      limits: { fileSize: 20 * 1024 * 1024 }, // 20MB mỗi file
    }),
  )
  async sendMessage(
    @Body()
    body: {
      conversationId: number;
      senderType: SenderType;
      messageType: MessageType; // nếu nhiều loại file, bạn có thể gộp là MEDIA
      content?: string;
    },
    @UploadedFiles() files?: Express.Multer.File[],
    @Request() req?: any,
  ) {
    const senderId = req.user.userId;

    if (body.senderType === SenderType.USER && senderId !== req.user.sub) {
      throw new ForbiddenException('Cannot send message as another user');
    }

    const mediaUrls = files?.map(file => `/uploads/chat/${file.filename}`) || [];

    // Lưu từng file thành message riêng hoặc 1 message có array media
    return this.chatService.sendMultipleMediaMessages(
      body.conversationId,
      senderId,
      body.senderType,
      body.content,
      mediaUrls,
    );
  }
  @Post('message/read')
  async markAsRead(
    @Body() body: { conversationId: number; receiverType: SenderType },
    @Request() req: any
  ) {
    const userId = req.user.sub;

    // Nếu receiverType là user, check JWT
    if (body.receiverType === SenderType.USER && userId !== req.user.sub) {
      throw new ForbiddenException(
        'Cannot mark messages as read for another user'
      );
    }

    return this.chatService.markAsRead(body.conversationId, body.receiverType);
  }

  @Get('conversation/:id')
  async getConversationById(@Param('id') id: string, @Request() req: any) {
    const convId = Number(id);
    if (isNaN(convId)) {
      throw new ForbiddenException('Invalid conversation id');
    }

    // Nếu bạn muốn kiểm tra quyền truy cập:
    // const userId = req.user.userId;
    // const conversation = await this.chatService.getConversationById(convId);
    // if (conversation.userId !== userId && conversation.storeId !== req.user.storeId) {
    //   throw new ForbiddenException('You cannot access this conversation');
    // }

    return this.chatService.getConversationById(convId);
  }
}
