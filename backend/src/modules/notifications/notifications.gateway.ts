import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  NotificationType,
  NotificationPriority,
  NotificationPayload,
  CommissionEarnedData,
  CommissionPaidData,
  CommissionReversedData,
  BudgetAlertData,
  ProgramPausedData,
} from './types/notification.types';

/**
 * Generic Notifications Gateway
 * 
 * Handles real-time notifications for all application features.
 * Currently implemented: Affiliate notifications
 * 
 * TODO for future implementation:
 * - Order notifications (confirmed, shipped, delivered, cancelled, refunded)
 * - Group order notifications (member joined, locked, completed)
 * - Payment notifications (received, failed, refund processed)
 * - Seller notifications (new order, low stock, new review)
 * - Admin notifications (fraud alert, system error)
 * - System notifications (maintenance, account verified)
 */
@WebSocketGateway({
  cors: {
    origin: [process.env.FE_BASE_URL, process.env.BE_BASE_URL].filter(
      Boolean
    ) as string[],
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server!: Server;

  // userId -> socketId mapping
  private userSockets = new Map<number, string>();

  afterInit(server: Server) {
    this.server = server;
    console.log('[NotificationsGateway] Generic notification system initialized');
  }

  async handleConnection(client: Socket) {
    console.log(`[NotificationsGateway] Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    // Remove user mapping when disconnected
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        this.userSockets.delete(userId);
        console.log(`[NotificationsGateway] User ${userId} disconnected`);
      }
    }
  }

  @SubscribeMessage('register-user')
  async onRegisterUser(
    @MessageBody() data: { userId: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { userId } = data;
      
      // Map userId to socketId
      this.userSockets.set(userId, client.id);
      
      // Join user-specific room
      const userRoom = this.getUserRoom(userId);
      await client.join(userRoom);
      
      console.log(`[NotificationsGateway] User ${userId} registered with socket ${client.id}`);
      
      // Confirm registration
      client.emit('registered', { userId, timestamp: new Date() });
    } catch (error) {
      console.error('[NotificationsGateway] register-user error:', error);
      client.emit('error', { message: 'Cannot register user' });
    }
  }

  @SubscribeMessage('unregister-user')
  async onUnregisterUser(
    @MessageBody() data: { userId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const { userId } = data;
    const userRoom = this.getUserRoom(userId);
    
    await client.leave(userRoom);
    this.userSockets.delete(userId);
    
    console.log(`[NotificationsGateway] User ${userId} unregistered`);
  }

  // ========================================
  // GENERIC NOTIFICATION METHODS
  // ========================================

  /**
   * Generic method to send notification to a specific user
   * This is the core method that all specific notification methods should use
   * 
   * @param userId - Target user ID
   * @param payload - Notification payload
   */
  async notify(userId: number, payload: NotificationPayload) {
    if (!this.server) {
      console.warn('[NotificationsGateway] Server not ready, skip emit');
      return;
    }

    const userRoom = this.getUserRoom(userId);
    
    const notification = {
      type: payload.type,
      title: payload.title,
      message: payload.message,
      data: payload.data,
      priority: payload.priority || NotificationPriority.MEDIUM,
      actionUrl: payload.actionUrl,
      timestamp: new Date(),
    };
    
    // Emit generic 'notification' event
    this.server.to(userRoom).emit('notification', notification);
    
    // Also emit specific event for backward compatibility
    this.server.to(userRoom).emit(payload.type, notification);

    console.log(`[NotificationsGateway] Sent ${payload.type} to user ${userId}`);
    
    // TODO: Save notification to database for history
    // await this.saveNotificationToDatabase(userId, notification);
  }

  /**
   * Send notification to multiple users
   * 
   * @param userIds - Array of user IDs
   * @param payload - Notification payload
   */
  async notifyMultiple(userIds: number[], payload: NotificationPayload) {
    await Promise.all(
      userIds.map(userId => this.notify(userId, payload))
    );
  }

  /**
   * Broadcast notification to all connected users
   * Use with caution - only for system-wide announcements
   * 
   * @param payload - Notification payload
   */
  async broadcast(payload: NotificationPayload) {
    if (!this.server) {
      console.warn('[NotificationsGateway] Server not ready, skip broadcast');
      return;
    }

    const notification = {
      type: payload.type,
      title: payload.title,
      message: payload.message,
      data: payload.data,
      priority: payload.priority || NotificationPriority.MEDIUM,
      timestamp: new Date(),
    };

    this.server.emit('notification', notification);
    console.log(`[NotificationsGateway] Broadcasted ${payload.type} to all users`);
  }

  /**
   * @deprecated Use notify() instead
   * Kept for backward compatibility
   */
  async notifyUser(userId: number, event: string, data: any) {
    const userRoom = this.getUserRoom(userId);
    this.server?.to(userRoom).emit(event, {
      ...data,
      timestamp: new Date(),
    });
  }

  // ========================================
  // AFFILIATE NOTIFICATION METHODS (✅ Implemented)
  // ========================================

  /**
   * Send commission earned notification
   * Called when a new commission is created and paid
   */
  async notifyCommissionEarned(userId: number, data: CommissionEarnedData) {
    await this.notify(userId, {
      type: NotificationType.COMMISSION_EARNED,
      title: '🎉 Bạn nhận được hoa hồng mới!',
      message: `Bạn vừa nhận ${data.amount.toLocaleString('vi-VN')} VND từ đơn hàng ${data.orderNumber}`,
      data,
      priority: NotificationPriority.HIGH,
      actionUrl: `/affiliate/commissions/${data.commissionId}`,
    });
  }

  /**
   * Send commission paid notification
   * Called when commission status changes to PAID
   */
  async notifyCommissionPaid(userId: number, data: CommissionPaidData) {
    await this.notify(userId, {
      type: NotificationType.COMMISSION_PAID,
      title: '💰 Hoa hồng đã được thanh toán!',
      message: `${data.amount.toLocaleString('vi-VN')} VND đã được cộng vào ví của bạn`,
      data,
      priority: NotificationPriority.MEDIUM,
      actionUrl: '/affiliate/wallet',
    });
  }

  /**
   * Send commission reversed notification
   * Called when a commission is reversed due to refund/cancellation
   */
  async notifyCommissionReversed(userId: number, data: CommissionReversedData) {
    await this.notify(userId, {
      type: NotificationType.COMMISSION_REVERSED,
      title: '⚠️ Hoa hồng bị hoàn trả',
      message: `Hoa hồng ${data.amount.toLocaleString('vi-VN')} VND từ đơn #${data.orderId} đã bị hoàn trả: ${data.reason}`,
      data,
      priority: NotificationPriority.HIGH,
      actionUrl: `/affiliate/commissions/${data.commissionId}`,
    });
  }

  /**
   * Send budget alert to admin
   * Called when program budget is running low (<20%)
   */
  async notifyBudgetAlert(userId: number, data: BudgetAlertData) {
    await this.notify(userId, {
      type: NotificationType.BUDGET_ALERT,
      title: '⚠️ Cảnh báo ngân sách',
      message: `Chương trình "${data.programName}" còn ${data.percentageRemaining.toFixed(1)}% ngân sách`,
      data,
      priority: NotificationPriority.HIGH,
      actionUrl: `/admin/affiliate/programs/${data.programId}/budget`,
    });
  }

  /**
   * Send program paused notification
   * Called when a program is automatically paused (e.g., budget exhausted)
   */
  async notifyProgramPaused(userId: number, data: ProgramPausedData) {
    await this.notify(userId, {
      type: NotificationType.PROGRAM_PAUSED,
      title: '🛑 Chương trình đã tạm dừng',
      message: `Chương trình "${data.programName}" đã bị tạm dừng: ${data.reason}`,
      data,
      priority: NotificationPriority.URGENT,
      actionUrl: `/admin/affiliate/programs/${data.programId}`,
    });
  }

  /**
   * Send program resumed notification
   * Called when a paused program is resumed
   */
  async notifyProgramResumed(userId: number, data: ProgramPausedData) {
    await this.notify(userId, {
      type: NotificationType.PROGRAM_RESUMED,
      title: '✅ Chương trình đã hoạt động trở lại',
      message: `Chương trình "${data.programName}" đã được kích hoạt lại`,
      data,
      priority: NotificationPriority.MEDIUM,
      actionUrl: `/admin/affiliate/programs/${data.programId}`,
    });
  }

  // ========================================
  // TODO: ORDER NOTIFICATION METHODS (⏳ Placeholder)
  // ========================================

  /**
   * TODO: Implement order confirmed notification
   * Called when buyer's order is confirmed
   */
  // async notifyOrderConfirmed(userId: number, data: OrderConfirmedData) {
  //   await this.notify(userId, {
  //     type: NotificationType.ORDER_CONFIRMED,
  //     title: '✅ Đơn hàng đã được xác nhận',
  //     message: `Đơn hàng ${data.orderNumber} đã được xác nhận`,
  //     data,
  //     priority: NotificationPriority.MEDIUM,
  //     actionUrl: `/orders/${data.orderId}`,
  //   });
  // }

  // ========================================
  // TODO: GROUP ORDER NOTIFICATION METHODS (⏳ Placeholder)
  // ========================================

  /**
   * TODO: Implement group order member joined notification
   * Called when a new member joins a group order
   */
  // async notifyGroupOrderMemberJoined(userIds: number[], data: GroupOrderMemberData) {
  //   await this.notifyMultiple(userIds, {
  //     type: NotificationType.GROUP_ORDER_MEMBER_JOINED,
  //     title: '👥 Thành viên mới tham gia',
  //     message: `Có người vừa tham gia nhóm mua ${data.groupName}`,
  //     data,
  //     priority: NotificationPriority.LOW,
  //     actionUrl: `/group-orders/${data.groupId}`,
  //   });
  // }

  // ========================================
  // TODO: PAYMENT NOTIFICATION METHODS (⏳ Placeholder)
  // ========================================

  /**
   * TODO: Implement refund processed notification
   * Called when a refund is successfully processed
   */
  // async notifyRefundProcessed(userId: number, data: RefundData) {
  //   await this.notify(userId, {
  //     type: NotificationType.REFUND_PROCESSED,
  //     title: '💰 Hoàn tiền thành công',
  //     message: `Đơn hàng ${data.orderNumber} đã được hoàn ${data.amount} VND`,
  //     data,
  //     priority: NotificationPriority.HIGH,
  //     actionUrl: `/orders/${data.orderId}`,
  //   });
  // }

  private getUserRoom(userId: number): string {
    return `user-${userId}`;
  }
}
