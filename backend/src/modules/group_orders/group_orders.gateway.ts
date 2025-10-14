import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Inject, forwardRef } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { GroupOrdersService } from './group_orders.service';

@WebSocketGateway({
  cors: {
    origin: [process.env.FE_BASE_URL, process.env.BE_BASE_URL].filter(Boolean) as string[],
    credentials: true,
  },
  namespace: '/group-orders',
})
export class GroupOrdersGateway

  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  server!: Server;

  // userId -> socketId
  private userSockets = new Map<number, string>();
  // groupId -> Set<socketId>
  private groupRooms = new Map<number, Set<string>>();

  constructor(
    @Inject(forwardRef(() => GroupOrdersService))
    private readonly groupOrdersService: GroupOrdersService
  ) { }

  afterInit(server: Server) {
    this.server = server;
  }

  async handleConnection(client: Socket) {
    // no-op
  }

  async handleDisconnect(client: Socket) {
    for (const [, socketIds] of this.groupRooms.entries()) {
      socketIds.delete(client.id);
    }
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) this.userSockets.delete(userId);
    }
  }

  @SubscribeMessage('join-group')
  async onJoinGroup(
    @MessageBody() data: { groupId: number; userId: number },
    @ConnectedSocket() client: Socket
  ) {
    try {
      const group = await this.groupOrdersService.getGroupOrderById(data.groupId);
      const room = this.roomName(data.groupId);

      this.userSockets.set(data.userId, client.id);
      if (!this.groupRooms.has(data.groupId)) {
        this.groupRooms.set(data.groupId, new Set());
      }
      this.groupRooms.get(data.groupId)!.add(client.id);

      await client.join(room);
      const member = (group.members ?? []).find((m: any) => m?.user?.id === data.userId) ?? null;

      client.to(room).emit('member-joined', {
        groupId: data.groupId,
        userId: data.userId,
        member,
        timestamp: new Date(),
      });

      client.emit('group-state', {
        group,
        members: group.members ?? [],
        items: group.items ?? [],
      });
    } catch (e) {
      client.emit('error', { message: 'Cannot join group' });
    }
  }

  @SubscribeMessage('leave-group')
  async onLeaveGroup(
    @MessageBody() data: { groupId: number; userId: number },
    @ConnectedSocket() client: Socket
  ) {
    const room = this.roomName(data.groupId);

    await client.leave(room);
    this.groupRooms.get(data.groupId)?.delete(client.id);

    client.to(room).emit('member-left', {
      groupId: data.groupId,
      userId: data.userId,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('add-item')
  async onAddItem(
    @MessageBody() data: { groupId: number; userId: number; item: any }
  ) {
    this.server.to(this.roomName(data.groupId)).emit('item-added', {
      groupId: data.groupId,
      userId: data.userId,
      item: data.item,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('update-item')
  async onUpdateItem(
    @MessageBody() data: { groupId: number; userId: number; item: any }
  ) {
    this.server.to(this.roomName(data.groupId)).emit('item-updated', {
      groupId: data.groupId,
      userId: data.userId,
      item: data.item,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('remove-item')
  async onRemoveItem(
    @MessageBody() data: { groupId: number; userId: number; itemId: number }
  ) {
    this.server.to(this.roomName(data.groupId)).emit('item-removed', {
      groupId: data.groupId,
      userId: data.userId,
      itemId: data.itemId,
      timestamp: new Date(),
    });
  }

  async broadcastGroupUpdate(groupId: number, event: string, data: any) {
    if (!this.server) {
      // eslint-disable-next-line no-console
      console.warn('[WS] server not ready, skip emit', { event, groupId });
      return;
    }
    const room = this.roomName(groupId);
    // eslint-disable-next-line no-console
    console.log('[WS] emit -> room:', room, 'event:', event);
    this.server.to(room).emit(event, {
      groupId,
      ...data,
      timestamp: new Date(),
    });
  }

  async notifyUser(userId: number, event: string, data: any) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(event, { ...data, timestamp: new Date() });
    }
  }

  async emitGroupLocked(groupId: number) {
    const room = this.roomName(groupId);
    this.server.to(room).emit('group-locked', {
      groupId,
      timestamp: new Date(),
    });
  }

  async emitGroupDeleted(groupId: number) {
    const room = this.roomName(groupId);
    this.server.to(room).emit('group-deleted', {
      groupId,
      timestamp: new Date(),
    });
  }

  private roomName(groupId: number) {
    return `group-${groupId}`;
  }


}