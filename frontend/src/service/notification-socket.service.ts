import { io, Socket } from 'socket.io-client';
import { message, notification } from 'antd';

// 🎯 NEW: Use environment variable for socket URL
const SOCKET_URL = `${import.meta.env.VITE_BE_BASE_URL || 'http://localhost:3000'}/notifications`;

/**
 * Generic Notification System - Frontend Service
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

// ========================================
// NOTIFICATION TYPES
// ========================================

export enum NotificationType {
  // Affiliate notifications (✅ Implemented)
  COMMISSION_EARNED = 'commission-earned',
  COMMISSION_PAID = 'commission-paid',
  COMMISSION_REVERSED = 'commission-reversed',
  BUDGET_ALERT = 'budget-alert',
  PROGRAM_PAUSED = 'program-paused',
  PROGRAM_RESUMED = 'program-resumed',
  
  // Order notifications (⏳ TODO)
  ORDER_CONFIRMED = 'order-confirmed',
  ORDER_SHIPPED = 'order-shipped',
  ORDER_DELIVERED = 'order-delivered',
  ORDER_CANCELLED = 'order-cancelled',
  ORDER_REFUNDED = 'order-refunded',
  
  // Group order notifications (⏳ TODO)
  GROUP_ORDER_MEMBER_JOINED = 'group-order-member-joined',
  GROUP_ORDER_LOCKED = 'group-order-locked',
  GROUP_ORDER_COMPLETED = 'group-order-completed',
  
  // Payment notifications (⏳ TODO)
  PAYMENT_RECEIVED = 'payment-received',
  REFUND_PROCESSED = 'refund-processed',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

// ========================================
// DATA INTERFACES
// ========================================

export interface NotificationData {
  type: NotificationType;
  title: string;
  message: string;
  data: any;
  priority: NotificationPriority;
  actionUrl?: string;
  timestamp: Date;
}

// Affiliate notification data types (✅ Implemented)
export interface CommissionEarnedData {
  commissionId: string;
  amount: number;
  level: number;
  orderId: number;
  orderNumber: string;
  productName: string;
  programName: string;
}

export interface CommissionPaidData {
  commissionId: string;
  amount: number;
  newBalance: number;
}

export interface CommissionReversedData {
  commissionId: string;
  amount: number;
  orderId: number;
  reason: string;
}

export interface BudgetAlertData {
  programId: number;
  programName: string;
  remainingBudget: number;
  percentageRemaining: number;
}

export interface ProgramPausedData {
  programId: number;
  programName: string;
  reason: string;
}

// TODO: Add data types for other notifications
// export interface OrderConfirmedData { ... }
// export interface GroupOrderMemberJoinedData { ... }

class NotificationSocketService {
  private socket: Socket | null = null;
  private userId: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  /**
   * Connect to notification socket
   */
  connect(userId: number) {
    if (this.socket?.connected && this.userId === userId) {
      console.log('[NotificationSocket] Already connected');
      return;
    }

    this.userId = userId;
    
    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventListeners();
    
    // Register user after connection
    this.socket.on('connect', () => {
      console.log('[NotificationSocket] Connected to server');
      this.reconnectAttempts = 0;
      this.registerUser(userId);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[NotificationSocket] Disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[NotificationSocket] Connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        message.error('Không thể kết nối đến server thông báo');
      }
    });
  }

  /**
   * Register user with socket server
   */
  private registerUser(userId: number) {
    if (!this.socket) return;

    this.socket.emit('register-user', { userId });
    console.log(`[NotificationSocket] Registered user ${userId}`);
  }

  /**
   * Setup event listeners for notifications
   * Generic listener handles all notification types
   */
  private setupEventListeners() {
    if (!this.socket) return;

    // Confirmation of registration
    this.socket.on('registered', (data: { userId: number; timestamp: Date }) => {
      console.log('[NotificationSocket] Registration confirmed:', data);
    });

    // ========================================
    // GENERIC NOTIFICATION LISTENER
    // ========================================
    this.socket.on('notification', (data: NotificationData) => {
      console.log('[NotificationSocket] Received notification:', data.type, data);
      
      // Show notification popup based on priority
      this.showNotificationPopup(data);
      
      // Dispatch custom event for components to listen
      window.dispatchEvent(new CustomEvent('notification', { detail: data }));
      window.dispatchEvent(new CustomEvent(data.type, { detail: data.data }));
    });

    // ========================================
    // AFFILIATE NOTIFICATIONS (✅ Implemented)
    // ========================================
    
    // Commission earned
    this.socket.on(NotificationType.COMMISSION_EARNED, (data: NotificationData) => {
      console.log('[NotificationSocket] Commission earned:', data);
      const commissionData = data.data as CommissionEarnedData;
      window.dispatchEvent(new CustomEvent('commission-earned', { detail: commissionData }));
    });

    // Commission paid
    this.socket.on(NotificationType.COMMISSION_PAID, (data: NotificationData) => {
      console.log('[NotificationSocket] Commission paid:', data);
      const commissionData = data.data as CommissionPaidData;
      window.dispatchEvent(new CustomEvent('commission-paid', { detail: commissionData }));
    });

    // Commission reversed
    this.socket.on(NotificationType.COMMISSION_REVERSED, (data: NotificationData) => {
      console.log('[NotificationSocket] Commission reversed:', data);
      const commissionData = data.data as CommissionReversedData;
      window.dispatchEvent(new CustomEvent('commission-reversed', { detail: commissionData }));
    });

    // Budget alert
    this.socket.on(NotificationType.BUDGET_ALERT, (data: NotificationData) => {
      console.log('[NotificationSocket] Budget alert:', data);
      const alertData = data.data as BudgetAlertData;
      window.dispatchEvent(new CustomEvent('budget-alert', { detail: alertData }));
    });

    // Program paused
    this.socket.on(NotificationType.PROGRAM_PAUSED, (data: NotificationData) => {
      console.log('[NotificationSocket] Program paused:', data);
      const programData = data.data as ProgramPausedData;
      window.dispatchEvent(new CustomEvent('program-paused', { detail: programData }));
    });

    // Program resumed
    this.socket.on(NotificationType.PROGRAM_RESUMED, (data: NotificationData) => {
      console.log('[NotificationSocket] Program resumed:', data);
      const programData = data.data as ProgramPausedData;
      window.dispatchEvent(new CustomEvent('program-resumed', { detail: programData }));
    });

    // ========================================
    // TODO: ORDER NOTIFICATIONS (⏳ Placeholder)
    // ========================================
    // this.socket.on(NotificationType.ORDER_CONFIRMED, (data: NotificationData) => { ... });
    // this.socket.on(NotificationType.ORDER_SHIPPED, (data: NotificationData) => { ... });

    // ========================================
    // TODO: GROUP ORDER NOTIFICATIONS (⏳ Placeholder)
    // ========================================
    // this.socket.on(NotificationType.GROUP_ORDER_MEMBER_JOINED, (data: NotificationData) => { ... });

    // Error handling
    this.socket.on('error', (data: { message: string }) => {
      console.error('[NotificationSocket] Error:', data);
      message.error(data.message || 'Lỗi kết nối socket');
    });
  }

  /**
   * Show notification popup based on priority and type
   */
  private showNotificationPopup(data: NotificationData) {
    const config = {
      message: data.title,
      description: data.message,
      placement: 'topRight' as const,
      duration: this.getNotificationDuration(data.priority),
      onClick: data.actionUrl ? () => {
        window.location.href = data.actionUrl!;
      } : undefined,
    };

    switch (data.priority) {
      case NotificationPriority.URGENT:
        notification.error(config);
        break;
      case NotificationPriority.HIGH:
        notification.warning(config);
        break;
      case NotificationPriority.MEDIUM:
        notification.info(config);
        break;
      case NotificationPriority.LOW:
      default:
        notification.success(config);
        break;
    }
  }

  /**
   * Get notification duration based on priority
   */
  private getNotificationDuration(priority: NotificationPriority): number {
    switch (priority) {
      case NotificationPriority.URGENT:
        return 0; // Don't auto-close
      case NotificationPriority.HIGH:
        return 10;
      case NotificationPriority.MEDIUM:
        return 5;
      case NotificationPriority.LOW:
      default:
        return 3;
    }
  }

  /**
   * Disconnect from socket
   */
  disconnect() {
    if (this.socket) {
      if (this.userId) {
        this.socket.emit('unregister-user', { userId: this.userId });
      }
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
      console.log('[NotificationSocket] Disconnected');
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get current user ID
   */
  getCurrentUserId(): number | null {
    return this.userId;
  }
}

// Export singleton instance
export const notificationSocket = new NotificationSocketService();
