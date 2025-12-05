import React from 'react';
import { message } from 'antd';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotificationSocket';
import { NotificationType } from '../../service/notification-socket.service';

/**
 * Global Notification Socket Provider
 * 
 * Connects to notification socket when user is logged in
 * Handles real-time notifications for all features
 */
export const NotificationSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { me } = useAuth();

  // Connect to notification socket with handlers for affiliate notifications
  useNotifications(me?.id || null, {
    handlers: {
      // Affiliate commission notifications
      [NotificationType.COMMISSION_EARNED]: (data) => {
        console.log('💰 Commission earned handler called:', data);
        console.log('💰 Showing message popup...');
        message.success({
          content: `🎉 Bạn nhận được ${data.amount?.toLocaleString('vi-VN') || 0} coins từ đơn hàng ${data.orderNumber}`,
          duration: 5,
        });
        console.log('💰 Message popup shown');
      },
      
      [NotificationType.COMMISSION_PAID]: (data) => {
        console.log('💵 Commission paid:', data);
        message.success({
          content: `✅ ${data.amount?.toLocaleString('vi-VN') || 0} coins đã được cộng vào ví của bạn`,
          duration: 5,
        });
      },
      
      [NotificationType.COMMISSION_REVERSED]: (data) => {
        console.log('⚠️ Commission reversed:', data);
        message.warning({
          content: `⚠️ Hoa hồng ${data.amount?.toLocaleString('vi-VN') || 0} coins từ đơn #${data.orderId} đã bị hoàn trả: ${data.reason}`,
          duration: 5,
        });
      },
      
      [NotificationType.BUDGET_ALERT]: (data) => {
        console.log('📊 Budget alert:', data);
        message.warning({
          content: `⚠️ Chương trình "${data.programName}" còn ${data.percentageRemaining?.toFixed(1)}% ngân sách`,
          duration: 5,
        });
      },
      
      [NotificationType.PROGRAM_PAUSED]: (data) => {
        console.log('⏸️ Program paused:', data);
        message.error({
          content: `🛑 Chương trình "${data.programName}" đã tạm dừng: ${data.reason}`,
          duration: 5,
        });
      },
      
      [NotificationType.PROGRAM_RESUMED]: (data) => {
        console.log('▶️ Program resumed:', data);
        message.success({
          content: `✅ Chương trình "${data.programName}" đã được kích hoạt lại`,
          duration: 5,
        });
      },
      
      // TODO: Add handlers for other notification types when implemented
      // [NotificationType.ORDER_CONFIRMED]: (data) => { ... },
      // [NotificationType.ORDER_SHIPPED]: (data) => { ... },
    },
    
    // Optional: Generic handler for all notifications
    onNotification: (notification) => {
      console.log('🔔 Notification received:', notification.type, notification);
    },
  });

  return <>{children}</>;
};
