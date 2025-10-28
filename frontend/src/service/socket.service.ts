import { io, Socket } from 'socket.io-client';

export class SocketService {
    private socket: Socket | null = null;
    private baseURL = 'http://localhost:3000';

    private lastJoin: { groupId: number; userId: number } | null = null;
    private joinedOnce = false;

    connect(token?: string) {
        if (this.socket?.connected) return this.socket;

        this.socket = io(`${this.baseURL}/group-orders`, {
            auth: {
                token,
            },
            transports: ['websocket', 'polling'],
        });

        this.socket.on('connect', () => {
            console.log(
                '[WS] Connected to group orders socket, id=',
                this.socket?.id
            );
            // NEW: tự re-join room nếu có lịch sử
            if (this.lastJoin) {
                this.joinedOnce = true;
                this.joinGroup(this.lastJoin.groupId, this.lastJoin.userId);
            }
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from group orders socket');
            this.joinedOnce = false;
        });

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    joinGroup(groupId: number, userId: number) {
        if (this.socket) {
            this.lastJoin = { groupId, userId };
            this.socket.emit('join-group', { groupId, userId });
            this.joinedOnce = true;
        }
    }

    leaveGroup(groupId: number, userId: number) {
        if (this.socket) {
            this.socket.emit('leave-group', { groupId, userId });
        }
        if (
            this.lastJoin &&
            this.lastJoin.groupId === groupId &&
            this.lastJoin.userId === userId
        ) {
            this.lastJoin = null;
            this.joinedOnce = false;
        }
    }

    onGroupState(callback: (data: any) => void) {
        if (this.socket) {
            this.socket.on('group-state', callback);
        }
    }

    onMemberJoined(callback: (data: any) => void) {
        if (this.socket) {
            this.socket.on('member-joined', callback);
        }
    }

    onMemberLeft(callback: (data: any) => void) {
        if (this.socket) {
            this.socket.on('member-left', callback);
        }
    }

    onItemAdded(callback: (data: any) => void) {
        if (this.socket) {
            this.socket.on('item-added', callback);
        }
    }

    onItemUpdated(callback: (data: any) => void) {
        if (this.socket) {
            this.socket.on('item-updated', callback);
        }
    }

    onItemRemoved(callback: (data: any) => void) {
        if (this.socket) {
            this.socket.on('item-removed', callback);
        }
    }

    onError(callback: (data: any) => void) {
        if (this.socket) {
            this.socket.on('error', callback);
        }
    }

    onGroupUpdated(callback: (data: any) => void) {
        // <-- thêm
        this.socket?.on('group-updated', callback);
    }
    onGroupLocked(callback: () => void) {
        // <-- thêm
        this.socket?.on('group-locked', callback);
    }
    onGroupDeleted(callback: () => void) {
        // <-- thêm
        this.socket?.on('group-deleted', callback);
    }

    removeAllListeners() {
        if (this.socket) {
            this.socket.removeAllListeners();
        }
    }

    // === Emit functions ===
    emitAddItem(groupId: number, userId: number, item: any) {
        this.socket?.emit('add-item', { groupId, userId, item });
    }

    emitUpdateItem(groupId: number, userId: number, item: any) {
        this.socket?.emit('update-item', { groupId, userId, item });
    }

    emitRemoveItem(groupId: number, userId: number, itemId: number) {
        this.socket?.emit('remove-item', { groupId, userId, itemId });
    }

    onDiscountUpdated(callback: (data: any) => void) {
        this.socket?.on('discount-updated', callback);
    }

    onMemberAddressUpdated(callback: (data: any) => void) {
    this.socket?.on('member-address-updated', callback);
}
}

export const socketService = new SocketService();
