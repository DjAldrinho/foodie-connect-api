import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { NotificationsService } from '../notifications.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger(NotificationsGateway.name);

  constructor(private notificationsService: NotificationsService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinNotifications')
  async handleJoinNotifications(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { userId: string },
  ) {
    client.join(`notifications:${payload.userId}`);
    this.logger.log(`User ${payload.userId} joined notifications room`);

    // Send unread count
    const count = await this.notificationsService.getUnreadCount(
      payload.userId,
    );
    client.emit('unread-count', { count });
  }

  @SubscribeMessage('leaveNotifications')
  handleLeaveNotifications(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { userId: string },
  ) {
    client.leave(`notifications:${payload.userId}`);
    this.logger.log(`User ${payload.userId} left notifications room`);
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { notificationId: string; userId: string },
  ) {
    try {
      const notification = await this.notificationsService.markAsRead(
        payload.notificationId,
        payload.userId,
      );

      // Broadcast updated unread count
      const count = await this.notificationsService.getUnreadCount(
        payload.userId,
      );

      // Send to user's socket
      client.emit('notification-updated', notification);
      client.emit('unread-count', { count });

      this.logger.log(
        `Notification ${payload.notificationId} marked as read for user ${payload.userId}`,
      );
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }
}
