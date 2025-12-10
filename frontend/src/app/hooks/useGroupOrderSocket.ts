import { useEffect, useRef } from 'react';
import { socketService } from './../../service/socket.service';
import { useAuth } from '../context/AuthContext';

export const useGroupOrderSocket = (groupId?: number, onRealtimeUpdate?: (event: string, data: any) => void) => {
    const { me } = useAuth();
    const socketRef = useRef<boolean>(false);

    useEffect(() => {
        if (!me?.id || !groupId) return;

        const raw = localStorage.getItem('token');
        const token = raw ?? undefined;
        socketService.connect(token);
        


        // Lắng nghe các sự kiện real-time
        socketService.onGroupState((data) => onRealtimeUpdate?.('group-state', data));
        socketService.onMemberJoined((data) => onRealtimeUpdate?.('member-joined', data));
        socketService.onMemberLeft((data) => onRealtimeUpdate?.('member-left', data));
        socketService.onItemAdded((data) => onRealtimeUpdate?.('item-added', data));
        socketService.onItemUpdated((data) => onRealtimeUpdate?.('item-updated', data));
        socketService.onItemRemoved((data) => onRealtimeUpdate?.('item-removed', data));
        socketService.onGroupUpdated((data) => onRealtimeUpdate?.('group-updated', data));
        socketService.onGroupLocked(() => onRealtimeUpdate?.('group-locked', {}));
        socketService.onGroupDeleted(() => onRealtimeUpdate?.('group-deleted', {}));
        socketService.onDiscountUpdated((data) => onRealtimeUpdate?.('discount-updated', data));
        socketService.onMemberAddressUpdated((data) => onRealtimeUpdate?.('member-address-updated', data));
        socketService.onMemberPaid((data) => onRealtimeUpdate?.('member-paid', data));
        socketService.onPaymentProgress((data) => onRealtimeUpdate?.('payment-progress', data));
        socketService.onGroupCompleted((data) => onRealtimeUpdate?.('group-completed', data));
        socketService.onTargetReachedWarning((data) => onRealtimeUpdate?.('target-reached-warning', data));
        socketService.onGroupAutoLocked((data) => onRealtimeUpdate?.('group-auto-locked', data));
        socketService.onGroupManualLocked((data) => onRealtimeUpdate?.('group-manual-locked', data));
        socketService.joinGroup(groupId, me.id);
        socketRef.current = true;

        return () => {
            socketService.leaveGroup(groupId, me.id);
            // socketService.removeAllListeners();
            socketRef.current = false;
        };
    }, [me?.id, groupId]);

    return {
        socketService,
        isConnected: socketRef.current,
    };
};
