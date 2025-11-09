# 🔔 Generic Notification System

Hệ thống thông báo real-time tổng quát, có thể tái sử dụng cho mọi tính năng trong ứng dụng.

**Status:** ✅ Affiliate notifications implemented | ⏳ Other features ready for implementation

---

## 📋 Tổng quan

Hệ thống notification được thiết kế **generic** và **scalable**, cho phép:
- ✅ Dễ dàng thêm notification types mới
- ✅ Tái sử dụng cho mọi tính năng (orders, group orders, payments, etc.)
- ✅ Flexible handlers (generic hoặc specific)
- ✅ Priority-based display
- ✅ Filter notifications by type/priority

---

## 🏗️ Architecture

### **Backend Structure**
```
notifications/
├── types/
│   └── notification.types.ts       # All notification types & interfaces
├── notifications.gateway.ts        # WebSocket gateway (generic)
└── notifications.module.ts         # Module definition
```

### **Frontend Structure**
```
services/
└── notification-socket.service.ts  # Socket service (generic)

hooks/
└── useNotificationSocket.ts        # React hook (generic)
```

---

## 🎯 Notification Types

### **✅ Implemented (Affiliate)**
```typescript
COMMISSION_EARNED       // Nhận hoa hồng mới
COMMISSION_PAID         // Hoa hồng đã thanh toán
COMMISSION_REVERSED     // Hoa hồng bị hoàn trả
BUDGET_ALERT            // Cảnh báo ngân sách (admin)
PROGRAM_PAUSED          // Chương trình tạm dừng
PROGRAM_RESUMED         // Chương trình hoạt động lại
```

### **⏳ TODO (Placeholders ready)**
```typescript
// Order notifications
ORDER_CONFIRMED
ORDER_SHIPPED
ORDER_DELIVERED
ORDER_CANCELLED
ORDER_REFUNDED

// Group order notifications
GROUP_ORDER_CREATED
GROUP_ORDER_MEMBER_JOINED
GROUP_ORDER_LOCKED
GROUP_ORDER_COMPLETED

// Payment notifications
PAYMENT_RECEIVED
REFUND_PROCESSED
WITHDRAWAL_APPROVED

// Seller notifications
NEW_ORDER_RECEIVED
PRODUCT_OUT_OF_STOCK
NEW_REVIEW

// Admin notifications
FRAUD_ALERT
SYSTEM_ERROR

// System notifications
SYSTEM_MAINTENANCE
ACCOUNT_VERIFIED
```

---

## 🚀 Usage Guide

### **1. Backend - Sending Notifications**

#### **Generic Method (Recommended)**
```typescript
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { NotificationType, NotificationPriority } from '../notifications/types/notification.types';

// Inject gateway
constructor(
  private readonly notificationsGateway: NotificationsGateway,
) {}

// Send notification
await this.notificationsGateway.notify(userId, {
  type: NotificationType.COMMISSION_EARNED,
  title: '🎉 Bạn nhận được hoa hồng mới!',
  message: `Bạn vừa nhận ${amount} VND`,
  data: { commissionId, amount, orderId },
  priority: NotificationPriority.HIGH,
  actionUrl: `/affiliate/commissions/${commissionId}`,
});
```

#### **Specific Methods (For common use cases)**
```typescript
// ✅ Affiliate notifications (Already implemented)
await this.notificationsGateway.notifyCommissionEarned(userId, data);
await this.notificationsGateway.notifyCommissionPaid(userId, data);
await this.notificationsGateway.notifyCommissionReversed(userId, data);
await this.notificationsGateway.notifyBudgetAlert(userId, data);
await this.notificationsGateway.notifyProgramPaused(userId, data);

// ⏳ TODO: Implement these methods
// await this.notificationsGateway.notifyOrderConfirmed(userId, data);
// await this.notificationsGateway.notifyOrderShipped(userId, data);
// await this.notificationsGateway.notifyRefundProcessed(userId, data);
```

#### **Multiple Users**
```typescript
// Send to multiple users
await this.notificationsGateway.notifyMultiple([userId1, userId2, userId3], {
  type: NotificationType.GROUP_ORDER_MEMBER_JOINED,
  title: '👥 Thành viên mới',
  message: 'Có người vừa tham gia nhóm',
  data: { groupId, newMemberId },
  priority: NotificationPriority.LOW,
});
```

#### **Broadcast (System-wide)**
```typescript
// Broadcast to all connected users
await this.notificationsGateway.broadcast({
  type: NotificationType.SYSTEM_MAINTENANCE,
  title: '🔧 Bảo trì hệ thống',
  message: 'Hệ thống sẽ bảo trì vào 2h sáng',
  priority: NotificationPriority.URGENT,
});
```

---

### **2. Frontend - Receiving Notifications**

#### **Option A: Generic Handler**
```typescript
import { useNotifications, NotificationType } from '../hooks/useNotificationSocket';

function MyComponent() {
  const { user } = useAuth();
  
  useNotifications(user.id, {
    // Handle all notifications
    onNotification: (notification) => {
      console.log('Received:', notification);
      
      // Custom logic based on type
      if (notification.type === NotificationType.COMMISSION_EARNED) {
        refetchCommissions();
      }
    },
  });
}
```

#### **Option B: Specific Handlers (Recommended)**
```typescript
import { useNotifications, NotificationType } from '../hooks/useNotificationSocket';

function AffiliateDashboard() {
  const { user } = useAuth();
  
  useNotifications(user.id, {
    handlers: {
      // ✅ Affiliate handlers (Implemented)
      [NotificationType.COMMISSION_EARNED]: (data) => {
        console.log('Commission earned:', data);
        refetchCommissions();
      },
      [NotificationType.COMMISSION_PAID]: (data) => {
        console.log('Commission paid:', data);
        refetchBalance();
      },
      [NotificationType.COMMISSION_REVERSED]: (data) => {
        console.log('Commission reversed:', data);
        showAlert(data.reason);
      },
      
      // ⏳ TODO: Add handlers for other types
      // [NotificationType.ORDER_CONFIRMED]: (data) => { ... },
      // [NotificationType.ORDER_SHIPPED]: (data) => { ... },
    },
  });
}
```

#### **Option C: With Filters**
```typescript
// Only receive specific notification types
useNotifications(user.id, {
  filter: {
    types: [
      NotificationType.COMMISSION_EARNED,
      NotificationType.COMMISSION_PAID,
    ],
    priorities: ['high', 'urgent'], // Only high priority
  },
  handlers: {
    [NotificationType.COMMISSION_EARNED]: (data) => refetchCommissions(),
  },
});
```

---

## 🔧 How to Add New Notification Types

### **Step 1: Add Type Definition**

**Backend:** `/backend/src/modules/notifications/types/notification.types.ts`
```typescript
export enum NotificationType {
  // ... existing types ...
  
  // Add your new type
  ORDER_CONFIRMED = 'order-confirmed',
}

// Add data interface
export interface OrderConfirmedData {
  orderId: number;
  orderNumber: string;
  totalAmount: number;
  estimatedDelivery: Date;
}
```

**Frontend:** `/frontend/src/services/notification-socket.service.ts`
```typescript
export enum NotificationType {
  // ... existing types ...
  
  // Add your new type
  ORDER_CONFIRMED = 'order-confirmed',
}

export interface OrderConfirmedData {
  orderId: number;
  orderNumber: string;
  totalAmount: number;
  estimatedDelivery: Date;
}
```

### **Step 2: Add Backend Method (Optional)**

**File:** `/backend/src/modules/notifications/notifications.gateway.ts`
```typescript
/**
 * Send order confirmed notification
 */
async notifyOrderConfirmed(userId: number, data: OrderConfirmedData) {
  await this.notify(userId, {
    type: NotificationType.ORDER_CONFIRMED,
    title: '✅ Đơn hàng đã được xác nhận',
    message: `Đơn hàng ${data.orderNumber} đã được xác nhận`,
    data,
    priority: NotificationPriority.MEDIUM,
    actionUrl: `/orders/${data.orderId}`,
  });
}
```

### **Step 3: Add Frontend Listener (Optional)**

**File:** `/frontend/src/services/notification-socket.service.ts`
```typescript
// In setupEventListeners()
this.socket.on(NotificationType.ORDER_CONFIRMED, (data: NotificationData) => {
  console.log('[NotificationSocket] Order confirmed:', data);
  const orderData = data.data as OrderConfirmedData;
  window.dispatchEvent(new CustomEvent('order-confirmed', { detail: orderData }));
});
```

### **Step 4: Use in Your Service**

```typescript
// In OrdersService
async confirmOrder(orderId: number) {
  // ... confirm order logic ...
  
  // Send notification
  await this.notificationsGateway.notify(order.user_id, {
    type: NotificationType.ORDER_CONFIRMED,
    title: '✅ Đơn hàng đã được xác nhận',
    message: `Đơn hàng #${order.orderNumber} đã được xác nhận`,
    data: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      estimatedDelivery: order.estimatedDelivery,
    },
    priority: NotificationPriority.MEDIUM,
    actionUrl: `/orders/${order.id}`,
  });
}
```

### **Step 5: Handle in Frontend**

```typescript
function OrdersPage() {
  const { user } = useAuth();
  
  useNotifications(user.id, {
    handlers: {
      [NotificationType.ORDER_CONFIRMED]: (data) => {
        console.log('Order confirmed:', data);
        refetchOrders();
        showSuccessMessage(`Đơn hàng ${data.orderNumber} đã được xác nhận`);
      },
    },
  });
}
```

---

## 📊 Notification Priority

| Priority | Color | Duration | Use Case |
|----------|-------|----------|----------|
| **URGENT** | Red | Never close | System errors, fraud alerts |
| **HIGH** | Orange | 10s | Commission reversed, budget alerts |
| **MEDIUM** | Blue | 5s | Commission paid, order updates |
| **LOW** | Green | 3s | Group member joined, minor updates |

---

## 🎨 UI Behavior

### **Notification Popup**
- **Position**: Top right corner
- **Auto-close**: Based on priority
- **Click action**: Navigate to `actionUrl` if provided
- **Style**: Ant Design notification component

### **Custom Events**
All notifications dispatch 2 custom events:
1. `'notification'` - Generic event with full notification data
2. `'<notification-type>'` - Specific event with data only

Components can listen to either:
```typescript
// Listen to generic event
window.addEventListener('notification', (event: CustomEvent) => {
  console.log(event.detail); // Full NotificationData
});

// Listen to specific event
window.addEventListener('commission-earned', (event: CustomEvent) => {
  console.log(event.detail); // CommissionEarnedData only
});
```

---

## 🔒 Security

- ✅ User authentication via `userId`
- ✅ Room-based messaging (`user-${userId}`)
- ✅ CORS configured
- ✅ Namespace isolation (`/notifications`)
- ⏳ TODO: Add permission checks for admin notifications

---

## 📝 Implementation Checklist

### **✅ Completed (Affiliate)**
- [x] Generic notification types
- [x] Generic gateway methods
- [x] Affiliate notification methods
- [x] Generic frontend service
- [x] Generic React hook
- [x] Priority-based display
- [x] Filter support
- [x] Commission earned notification
- [x] Commission paid notification
- [x] Commission reversed notification
- [x] Budget alert notification
- [x] Program paused/resumed notification

### **⏳ TODO (Ready for implementation)**
- [ ] Order notifications
  - [ ] Order confirmed
  - [ ] Order shipped
  - [ ] Order delivered
  - [ ] Order cancelled
  - [ ] Order refunded
- [ ] Group order notifications
  - [ ] Member joined
  - [ ] Group locked
  - [ ] Group completed
- [ ] Payment notifications
  - [ ] Payment received
  - [ ] Refund processed
  - [ ] Withdrawal approved
- [ ] Seller notifications
  - [ ] New order received
  - [ ] Low stock alert
  - [ ] New review
- [ ] Admin notifications
  - [ ] Fraud alert
  - [ ] System error
- [ ] Notification history (database)
- [ ] Mark as read functionality
- [ ] Notification preferences
- [ ] Push notifications (mobile)

---

## 🎯 Benefits

### **For Developers**
✅ **Easy to extend**: Chỉ cần thêm enum và data interface
✅ **Type-safe**: Full TypeScript support
✅ **Reusable**: Một hệ thống cho tất cả features
✅ **Flexible**: Generic hoặc specific handlers
✅ **Maintainable**: Clear structure và documentation

### **For Users**
✅ **Real-time updates**: Nhận thông báo ngay lập tức
✅ **Priority-based**: Thông báo quan trọng nổi bật hơn
✅ **Actionable**: Click để navigate đến trang liên quan
✅ **Non-intrusive**: Auto-close dựa trên priority

---

## 📚 Examples

### **Example 1: Affiliate User**
```typescript
function AffiliateDashboard() {
  const { user } = useAuth();
  
  useNotifications(user.id, {
    handlers: {
      [NotificationType.COMMISSION_EARNED]: (data) => {
        refetchCommissions();
        playSound('coin.mp3');
      },
      [NotificationType.COMMISSION_PAID]: (data) => {
        refetchBalance();
      },
    },
  });
}
```

### **Example 2: Buyer (TODO)**
```typescript
function BuyerDashboard() {
  const { user } = useAuth();
  
  useNotifications(user.id, {
    filter: {
      types: [
        NotificationType.ORDER_CONFIRMED,
        NotificationType.ORDER_SHIPPED,
        NotificationType.ORDER_DELIVERED,
      ],
    },
    handlers: {
      [NotificationType.ORDER_CONFIRMED]: (data) => refetchOrders(),
      [NotificationType.ORDER_SHIPPED]: (data) => showTrackingInfo(data),
      [NotificationType.ORDER_DELIVERED]: (data) => showReviewPrompt(data),
    },
  });
}
```

### **Example 3: Admin (Partial)**
```typescript
function AdminDashboard() {
  const { user } = useAuth();
  
  useNotifications(user.id, {
    filter: {
      priorities: ['urgent', 'high'], // Only urgent/high priority
    },
    handlers: {
      [NotificationType.BUDGET_ALERT]: (data) => showBudgetWarning(data),
      [NotificationType.PROGRAM_PAUSED]: (data) => showProgramAlert(data),
      // TODO: Add fraud alert, system error handlers
    },
  });
}
```

---

## 🚨 Troubleshooting

### **Notification không hiển thị?**
1. Check socket connection: `notificationSocket.isConnected()`
2. Check userId đã đăng ký chưa
3. Check filter settings (có block notification không?)
4. Check browser console for errors

### **Duplicate notifications?**
1. Đảm bảo chỉ connect socket 1 lần
2. Cleanup socket khi component unmount
3. Check useEffect dependencies

### **Wrong notification priority?**
1. Check `NotificationPriority` enum value
2. Verify backend sending correct priority
3. Check `showNotificationPopup()` logic

---

## 🎉 Summary

Hệ thống notification đã được thiết kế **generic** và **scalable**:

✅ **Affiliate notifications**: Hoàn thành 100%
⏳ **Other features**: Sẵn sàng cho implementation
📚 **Documentation**: Đầy đủ và chi tiết
🔧 **Easy to extend**: Chỉ cần follow checklist

Developers có thể dễ dàng thêm notification types mới bằng cách follow hướng dẫn trong document này! 🚀
