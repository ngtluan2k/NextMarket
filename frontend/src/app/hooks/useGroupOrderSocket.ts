import { useEffect, useRef } from 'react';
import { socketService } from './../../service/socket.service';
import { useAuth } from './useAuth';

export const useGroupOrderSocket = (groupId?: number, onRealtimeUpdate?: (event: string, data: any) => void) => {
    const { user } = useAuth();
    const socketRef = useRef<boolean>(false);

    useEffect(() => {
        if (!user?.id || !groupId) return;

        const raw = localStorage.getItem('token');
        const token = raw ?? undefined;
        socketService.connect(token);
        socketService.joinGroup(groupId, user.id);

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

        socketRef.current = true;

        return () => {
            socketService.leaveGroup(groupId, user.id);
            socketService.removeAllListeners();
            socketRef.current = false;
        };
    }, [user?.id, groupId]);

    return {
        socketService,
        isConnected: socketRef.current,
    };
};
