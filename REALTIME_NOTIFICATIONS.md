# 🔔 Real-time Affiliate Notifications

Hệ thống thông báo real-time cho affiliate commissions sử dụng Socket.IO.

---

## 📋 Tổng quan

Khi affiliate nhận được hoa hồng, hệ thống sẽ:
1. ✅ Tự động cộng tiền vào ví
2. 🔔 Gửi thông báo real-time qua WebSocket
3. 📱 Hiển thị notification popup trên giao diện
4. 🔄 Tự động refresh balance và commission history

---

## 🏗️ Kiến trúc

### **Backend**
```
NotificationsGateway (WebSocket)
    ↓
CommissionCalcService
    ↓
Gửi notification khi commission PAID
```

### **Frontend**
```
NotificationSocketService
    ↓
useNotificationSocket Hook
    ↓
React Components
```

---

## 🚀 Cách sử dụng

### **1. Backend - Đã tích hợp sẵn**

Notification tự động được gửi trong `CommissionCalcService` khi commission được paid:

```typescript
// backend/src/modules/affiliate-commissions/service/commission-calc.service.ts

// Sau khi commission được PAID thành công
await this.notificationsGateway.notifyCommissionPaid(beneficiaryUserId, {
  commissionId: savedCommission.uuid,
  amount: computed,
  newBalance: 0,
});

await this.notificationsGateway.notifyCommissionEarned(beneficiaryUserId, {
  commissionId: savedCommission.uuid,
  amount: computed,
  level,
  orderId,
  orderNumber: `#${orderId}`,
  productName: orderItem?.product?.name || 'Unknown Product',
  programName: program?.name || 'Unknown Program',
});
```

### **2. Frontend - Sử dụng Hook**

#### **Option A: Sử dụng trong Component (Recommended)**

```typescript
import { useNotificationSocket } from '../hooks/useNotificationSocket';

function AffiliateDashboard() {
  const userId = getCurrentUserId(); // Lấy từ auth context
  
  // Connect to socket và handle events
  useNotificationSocket(userId, {
    onCommissionEarned: (data) => {
      console.log('Commission earned:', data);
      // Refresh commission history
      refetchCommissions();
    },
    onCommissionPaid: (data) => {
      console.log('Commission paid:', data);
      // Refresh wallet balance
      refetchBalance();
    },
  });

  return <div>...</div>;
}
```

#### **Option B: Sử dụng Service trực tiếp**

```typescript
import { notificationSocket } from '../services/notification-socket.service';

// Connect
notificationSocket.connect(userId);

// Listen to custom events
window.addEventListener('commission-earned', (event: CustomEvent) => {
  console.log('Commission earned:', event.detail);
});

// Disconnect when done
notificationSocket.disconnect();
```

---

## 📡 Socket Events

### **Client → Server**

| Event | Data | Description |
|-------|------|-------------|
| `register-user` | `{ userId: number }` | Đăng ký user với socket server |
| `unregister-user` | `{ userId: number }` | Hủy đăng ký user |

### **Server → Client**

| Event | Data | Description |
|-------|------|-------------|
| `registered` | `{ userId, timestamp }` | Xác nhận đăng ký thành công |
| `commission-earned` | `NotificationData` | Thông báo nhận hoa hồng mới |
| `commission-paid` | `NotificationData` | Thông báo hoa hồng đã thanh toán |
| `budget-alert` | `NotificationData` | Cảnh báo ngân sách (admin) |
| `program-paused` | `NotificationData` | Thông báo program bị tạm dừng |
| `error` | `{ message: string }` | Lỗi từ server |

---

## 🎯 Notification Types

### **1. Commission Earned**
```typescript
{
  type: 'commission',
  title: '🎉 Bạn nhận được hoa hồng mới!',
  message: 'Bạn vừa nhận 3,000,000 VND từ đơn hàng #123',
  data: {
    commissionId: 'uuid',
    amount: 3000000,
    level: 1,
    orderId: 123,
    orderNumber: '#123',
    productName: 'iPhone 15 Pro',
    programName: 'Black Friday Sale'
  }
}
```

### **2. Commission Paid**
```typescript
{
  type: 'commission',
  title: '💰 Hoa hồng đã được thanh toán!',
  message: '3,000,000 VND đã được cộng vào ví của bạn',
  data: {
    commissionId: 'uuid',
    amount: 3000000,
    newBalance: 10000000
  }
}
```

### **3. Budget Alert (Admin)**
```typescript
{
  type: 'budget',
  title: '⚠️ Cảnh báo ngân sách',
  message: 'Chương trình "Black Friday" còn 15.5% ngân sách',
  data: {
    programId: 1,
    programName: 'Black Friday Sale',
    remainingBudget: 15500000,
    percentageRemaining: 15.5
  }
}
```

### **4. Program Paused**
```typescript
{
  type: 'program',
  title: '🛑 Chương trình đã tạm dừng',
  message: 'Chương trình "Black Friday" đã bị tạm dừng: Budget limit reached',
  data: {
    programId: 1,
    programName: 'Black Friday Sale',
    reason: 'Budget limit reached'
  }
}
```

---

## 🔧 Configuration

### **Backend Socket URL**
```typescript
// frontend/src/services/notification-socket.service.ts
const SOCKET_URL = 'http://localhost:3000/notifications';
```

### **Socket Options**
```typescript
{
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
}
```

---

## 🎨 UI Components

### **Notification Popup**
- **Success** (green): Commission earned/paid
- **Warning** (orange): Budget alert
- **Error** (red): Program paused
- **Duration**: 5-10 seconds
- **Placement**: Top right corner

### **Custom Event Listeners**
Components có thể listen các custom events để tự động refresh data:

```typescript
// Listen for commission earned
window.addEventListener('commission-earned', (event: CustomEvent) => {
  // Refresh commission history table
  refetchCommissions();
});

// Listen for commission paid
window.addEventListener('commission-paid', (event: CustomEvent) => {
  // Refresh wallet balance
  refetchBalance();
});

// Listen for budget alert
window.addEventListener('budget-alert', (event: CustomEvent) => {
  // Refresh budget dashboard
  refetchBudgetStatus();
});
```

---

## 🧪 Testing

### **1. Test Connection**
```typescript
import { notificationSocket } from '../services/notification-socket.service';

// Connect
notificationSocket.connect(123); // userId = 123

// Check connection
console.log('Connected:', notificationSocket.isConnected());

// Disconnect
notificationSocket.disconnect();
```

### **2. Test Notification Flow**
1. Tạo order với affiliate tracking
2. Admin xác nhận thanh toán order
3. Commission tự động được tính và paid
4. Notification popup xuất hiện
5. Balance tự động refresh

### **3. Debug Mode**
```typescript
// Enable socket.io debug
localStorage.debug = 'socket.io-client:socket';
```

---

## 📊 Monitoring

### **Backend Logs**
```
[NotificationsGateway] WebSocket initialized
[NotificationsGateway] Client connected: abc123
[NotificationsGateway] User 123 registered with socket abc123
[NotificationsGateway] Sent commission-earned to user 123
```

### **Frontend Logs**
```
[NotificationSocket] Connected to server
[NotificationSocket] Registered user 123
[NotificationSocket] Commission earned: {...}
```

---

## 🔒 Security

- ✅ CORS configured với `FE_BASE_URL` và `BE_BASE_URL`
- ✅ User authentication qua `userId`
- ✅ Namespace isolation: `/notifications`
- ✅ Room-based messaging: `user-${userId}`

---

## 🚨 Troubleshooting

### **Không nhận được notification?**
1. Kiểm tra socket connection: `notificationSocket.isConnected()`
2. Kiểm tra userId đã đăng ký chưa
3. Kiểm tra backend logs
4. Kiểm tra CORS configuration

### **Notification bị duplicate?**
1. Đảm bảo chỉ connect 1 lần
2. Cleanup socket khi component unmount
3. Sử dụng `useEffect` dependencies đúng

### **Socket không reconnect?**
1. Kiểm tra `reconnectionAttempts` config
2. Kiểm tra network connectivity
3. Restart backend server

---

## 📚 API Reference

### **NotificationsGateway Methods**

```typescript
// Send notification to specific user
await notificationsGateway.notifyUser(userId, event, data);

// Send commission earned notification
await notificationsGateway.notifyCommissionEarned(userId, commissionData);

// Send commission paid notification
await notificationsGateway.notifyCommissionPaid(userId, commissionData);

// Send budget alert
await notificationsGateway.notifyBudgetAlert(userId, alertData);

// Send program paused notification
await notificationsGateway.notifyProgramPaused(userId, programData);

// Broadcast to all users
await notificationsGateway.broadcastToAll(event, data);
```

### **NotificationSocketService Methods**

```typescript
// Connect to socket
notificationSocket.connect(userId);

// Disconnect from socket
notificationSocket.disconnect();

// Check connection status
notificationSocket.isConnected();

// Get current user ID
notificationSocket.getCurrentUserId();
```

---

## 🎉 Features

✅ Real-time notifications khi nhận hoa hồng
✅ Auto-refresh balance và commission history
✅ Beautiful notification popups
✅ Reconnection tự động
✅ Custom event system
✅ TypeScript support
✅ Error handling
✅ Debug logging

---

## 📝 Next Steps

1. ✅ Tích hợp vào affiliate dashboard
2. ✅ Tích hợp vào wallet component
3. ⏳ Thêm notification history
4. ⏳ Thêm notification preferences
5. ⏳ Push notifications (mobile)

---

Happy coding! 🚀
