import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../../hooks/useNotificationSocket';
import { NotificationType } from '../../services/notification-socket.service';

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
        console.log('💰 Commission earned:', data);
        // Notification popup is automatically shown by the service
        // Components can listen to this event to refresh data
      },
      
      [NotificationType.COMMISSION_PAID]: (data) => {
        console.log('💵 Commission paid:', data);
      },
      
      [NotificationType.COMMISSION_REVERSED]: (data) => {
        console.log('⚠️ Commission reversed:', data);
      },
      
      [NotificationType.BUDGET_ALERT]: (data) => {
        console.log('📊 Budget alert:', data);
      },
      
      [NotificationType.PROGRAM_PAUSED]: (data) => {
        console.log('⏸️ Program paused:', data);
      },
      
      [NotificationType.PROGRAM_RESUMED]: (data) => {
        console.log('▶️ Program resumed:', data);
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
