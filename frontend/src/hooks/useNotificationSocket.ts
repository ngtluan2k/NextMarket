import { useEffect, useCallback } from 'react';
import { notificationSocket, NotificationType, NotificationData } from '../services/notification-socket.service';

/**
 * Generic Notification Hook Options
 * 
 * Supports both generic handler and specific handlers for each notification type
 */
interface UseNotificationOptions {
  // Generic handler for all notifications
  onNotification?: (notification: NotificationData) => void;
  
  // Specific handlers for each notification type
  handlers?: Partial<{
    // Affiliate notifications (✅ Implemented)
    [NotificationType.COMMISSION_EARNED]: (data: any) => void;
    [NotificationType.COMMISSION_PAID]: (data: any) => void;
    [NotificationType.COMMISSION_REVERSED]: (data: any) => void;
    [NotificationType.BUDGET_ALERT]: (data: any) => void;
    [NotificationType.PROGRAM_PAUSED]: (data: any) => void;
    [NotificationType.PROGRAM_RESUMED]: (data: any) => void;
    
    // Order notifications (⏳ TODO)
    [NotificationType.ORDER_CONFIRMED]: (data: any) => void;
    [NotificationType.ORDER_SHIPPED]: (data: any) => void;
    [NotificationType.ORDER_DELIVERED]: (data: any) => void;
    [NotificationType.ORDER_CANCELLED]: (data: any) => void;
    [NotificationType.ORDER_REFUNDED]: (data: any) => void;
    
    // Group order notifications (⏳ TODO)
    [NotificationType.GROUP_ORDER_MEMBER_JOINED]: (data: any) => void;
    [NotificationType.GROUP_ORDER_LOCKED]: (data: any) => void;
    [NotificationType.GROUP_ORDER_COMPLETED]: (data: any) => void;
    
    // Payment notifications (⏳ TODO)
    [NotificationType.PAYMENT_RECEIVED]: (data: any) => void;
    [NotificationType.REFUND_PROCESSED]: (data: any) => void;
  }>;
  
  // Filter notifications by type
  filter?: {
    types?: NotificationType[];
    priorities?: string[];
  };
}

/**
 * Generic React hook to connect to notification socket and handle events
 * 
 * @example
 * // For affiliate users
 * useNotifications(userId, {
 *   handlers: {
 *     [NotificationType.COMMISSION_EARNED]: (data) => refetchCommissions(),
 *     [NotificationType.COMMISSION_PAID]: (data) => refetchBalance(),
 *   }
 * });
 * 
 * @example
 * // For all notifications with generic handler
 * useNotifications(userId, {
 *   onNotification: (notification) => {
 *     console.log('Received:', notification);
 *   }
 * });
 */
export function useNotifications(
  userId: number | null,
  options: UseNotificationOptions = {}
) {
  const { onNotification, handlers, filter } = options;

  // Connect to socket when userId is available
  useEffect(() => {
    if (!userId) return;

    console.log(`[useNotificationSocket] Connecting for user ${userId}`);
    notificationSocket.connect(userId);

    return () => {
      console.log(`[useNotificationSocket] Disconnecting for user ${userId}`);
      notificationSocket.disconnect();
    };
  }, [userId]);

  // Setup event listeners
  useEffect(() => {
    // Generic notification handler
    const handleNotification = (event: CustomEvent<NotificationData>) => {
      const notification = event.detail;
      
      // Apply filters
      if (filter?.types && !filter.types.includes(notification.type)) {
        return;
      }
      
      if (filter?.priorities && !filter.priorities.includes(notification.priority)) {
        return;
      }
      
      // Call generic handler
      if (onNotification) {
        onNotification(notification);
      }
    };

    // Specific type handlers
    const handleSpecificType = (type: NotificationType) => (event: CustomEvent) => {
      const handler = handlers?.[type];
      if (handler) {
        handler(event.detail);
      }
    };

    // Add generic listener
    window.addEventListener('notification', handleNotification as EventListener);

    // Add specific listeners for all notification types
    const eventListeners: Array<[string, EventListener]> = [];
    
    if (handlers) {
      Object.keys(handlers).forEach((type) => {
        const listener = handleSpecificType(type as NotificationType) as EventListener;
        window.addEventListener(type, listener);
        eventListeners.push([type, listener]);
      });
    }

    // Cleanup
    return () => {
      window.removeEventListener('notification', handleNotification as EventListener);
      eventListeners.forEach(([type, listener]) => {
        window.removeEventListener(type, listener);
      });
    };
  }, [onNotification, handlers, filter]);

  // Return utility functions
  const isConnected = useCallback(() => {
    return notificationSocket.isConnected();
  }, []);

  return {
    isConnected,
  };
}
