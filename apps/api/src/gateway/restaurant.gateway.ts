import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import {
  SOCKET_EVENTS,
  TableStatusChangedPayload,
  NewOrderKitchenPayload,
  OrderStatusChangedPayload,
  BookingConfirmedPayload,
  BookingCancelledPayload,
  PaymentCompletedPayload,
  MenuUpdatedPayload,
} from '@booking/shared';

@WebSocketGateway({
  cors: {
    origin:      process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class RestaurantGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  readonly server: Server;

  private readonly logger = new Logger(RestaurantGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // ── Client → Server: join a branch room ─────────────────────────────────
  @SubscribeMessage('join_branch')
  handleJoinBranch(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { branchId: string; role?: string },
  ) {
    const room = `branch:${payload.branchId}`;
    client.join(room);
    if (payload.role === 'kitchen') {
      client.join(`kitchen:${payload.branchId}`);
    }
    this.logger.log(`${client.id} joined ${room}`);
    return { joined: room };
  }

  @SubscribeMessage('leave_branch')
  handleLeaveBranch(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { branchId: string },
  ) {
    client.leave(`branch:${payload.branchId}`);
    client.leave(`kitchen:${payload.branchId}`);
  }

  // ── Server → Client: branch-scoped emissions ─────────────────────────────

  /** After booking created / status changed. Scoped to branch room. */
  emitTableStatusChanged(payload: TableStatusChangedPayload) {
    const room = payload.branchId ? `branch:${payload.branchId}` : undefined;
    if (room) {
      this.server.to(room).emit(SOCKET_EVENTS.TABLE_STATUS_CHANGED, payload);
    } else {
      // fallback when branchId unavailable (legacy callers)
      this.server.emit(SOCKET_EVENTS.TABLE_STATUS_CHANGED, payload);
    }
  }

  /** After booking confirmed. */
  emitBookingConfirmed(payload: BookingConfirmedPayload) {
    this.server
      .to(`branch:${payload.branchId}`)
      .emit(SOCKET_EVENTS.BOOKING_CONFIRMED, payload);
  }

  /** After booking cancelled. */
  emitBookingCancelled(payload: BookingCancelledPayload) {
    this.server
      .to(`branch:${payload.branchId}`)
      .emit(SOCKET_EVENTS.BOOKING_CANCELLED, payload);
  }

  /** After new order placed. Scoped to kitchen room. */
  emitNewOrderKitchen(payload: NewOrderKitchenPayload & { branchId?: string }) {
    const room = payload.branchId ? `kitchen:${payload.branchId}` : undefined;
    if (room) {
      this.server.to(room).emit(SOCKET_EVENTS.ORDER_NEW, payload);
    } else {
      this.server.emit(SOCKET_EVENTS.ORDER_NEW, payload);
    }
  }

  /** After kitchen updates order status. Scoped to branch room. */
  emitOrderStatusChanged(payload: OrderStatusChangedPayload & { branchId?: string }) {
    const room = payload.branchId ? `branch:${payload.branchId}` : undefined;
    if (room) {
      this.server.to(room).emit(SOCKET_EVENTS.ORDER_STATUS_CHANGED, payload);
    } else {
      this.server.emit(SOCKET_EVENTS.ORDER_STATUS_CHANGED, payload);
    }
  }

  /** After payment confirmed. */
  emitPaymentCompleted(payload: PaymentCompletedPayload & { branchId?: string }) {
    const room = payload.branchId ? `branch:${payload.branchId}` : undefined;
    if (room) {
      this.server.to(room).emit(SOCKET_EVENTS.PAYMENT_COMPLETED, payload);
    } else {
      this.server.emit(SOCKET_EVENTS.PAYMENT_COMPLETED, payload);
    }
  }

  /** After any menu mutation (create/update/delete/toggle86). */
  emitMenuUpdated(payload: MenuUpdatedPayload & { branchId?: string }) {
    const room = payload.branchId ? `branch:${payload.branchId}` : undefined;
    if (room) {
      this.server.to(room).emit(SOCKET_EVENTS.MENU_UPDATED, payload);
    } else {
      this.server.emit(SOCKET_EVENTS.MENU_UPDATED, payload);
    }
  }
}
