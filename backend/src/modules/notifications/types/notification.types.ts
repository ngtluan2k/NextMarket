/**
 * Generic Notification System Types
 * 
 * This file defines all notification types for the entire application.
 * Currently implemented: Affiliate notifications
 * TODO: Implement other notification types (orders, group orders, payments, etc.)
 */

export enum NotificationType {
  // ========================================
  // AFFILIATE NOTIFICATIONS (✅ Implemented)
  // ========================================
  COMMISSION_EARNED = 'commission-earned',
  COMMISSION_PAID = 'commission-paid',
  COMMISSION_REVERSED = 'commission-reversed',
  BUDGET_ALERT = 'budget-alert',
  PROGRAM_PAUSED = 'program-paused',
  PROGRAM_RESUMED = 'program-resumed',
  
  // ========================================
  // ORDER NOTIFICATIONS (⏳ TODO)
  // ========================================
  ORDER_CONFIRMED = 'order-confirmed',
  ORDER_PROCESSING = 'order-processing',
  ORDER_SHIPPED = 'order-shipped',
  ORDER_DELIVERED = 'order-delivered',
  ORDER_CANCELLED = 'order-cancelled',
  ORDER_REFUNDED = 'order-refunded',
  
  // ========================================
  // GROUP ORDER NOTIFICATIONS (⏳ TODO)
  // ========================================
  GROUP_ORDER_CREATED = 'group-order-created',
  GROUP_ORDER_MEMBER_JOINED = 'group-order-member-joined',
  GROUP_ORDER_MEMBER_LEFT = 'group-order-member-left',
  GROUP_ORDER_LOCKED = 'group-order-locked',
  GROUP_ORDER_COMPLETED = 'group-order-completed',
  GROUP_ORDER_CANCELLED = 'group-order-cancelled',
  
  // ========================================
  // PAYMENT NOTIFICATIONS (⏳ TODO)
  // ========================================
  PAYMENT_RECEIVED = 'payment-received',
  PAYMENT_FAILED = 'payment-failed',
  REFUND_PROCESSED = 'refund-processed',
  WITHDRAWAL_APPROVED = 'withdrawal-approved',
  WITHDRAWAL_REJECTED = 'withdrawal-rejected',
  
  // ========================================
  // SELLER NOTIFICATIONS (⏳ TODO)
  // ========================================
  NEW_ORDER_RECEIVED = 'new-order-received',
  PRODUCT_OUT_OF_STOCK = 'product-out-of-stock',
  PRODUCT_LOW_STOCK = 'product-low-stock',
  NEW_REVIEW = 'new-review',
  NEW_QUESTION = 'new-question',
  
  // ========================================
  // ADMIN NOTIFICATIONS (⏳ TODO)
  // ========================================
  FRAUD_ALERT = 'fraud-alert',
  SYSTEM_ERROR = 'system-error',
  REPORT_GENERATED = 'report-generated',
  
  // ========================================
  // SYSTEM NOTIFICATIONS (⏳ TODO)
  // ========================================
  SYSTEM_MAINTENANCE = 'system-maintenance',
  ACCOUNT_VERIFIED = 'account-verified',
  PASSWORD_CHANGED = 'password-changed',
  SECURITY_ALERT = 'security-alert',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  priority?: NotificationPriority;
  actionUrl?: string; // URL to navigate when clicking notification
  expiresAt?: Date;
}

export interface NotificationData {
  id?: string;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  priority: NotificationPriority;
  actionUrl?: string;
  read: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

// ========================================
// AFFILIATE NOTIFICATION DATA TYPES (✅ Implemented)
// ========================================

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

// ========================================
// TODO: Add data types for other notifications
// ========================================

// Example structure for future implementation:
// export interface OrderConfirmedData {
//   orderId: number;
//   orderNumber: string;
//   totalAmount: number;
//   estimatedDelivery: Date;
// }
