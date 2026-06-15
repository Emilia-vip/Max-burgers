import { Channel } from 'amqplib';
import {
  connectRabbitMQ,
  createOrderEvent,
  EventType,
  OrderEvent,
  publishEvent,
  RabbitConnection,
  setupExchange,
  subscribeToEvents,
} from '@maxburger/shared';

import {
  getOrderById,
  updateOrderStatus,
  Order,
} from './db';

import {
  canTransition,
  getNextStatusFromEvent,
  OrderStatus,
} from './orderLogic';

let connection: RabbitConnection | null = null;
let channel: Channel | null = null;

/* ---------------- INIT ---------------- */

export async function initEventBus(): Promise<void> {
  const url = process.env.RABBITMQ_URL ?? 'amqp://localhost:5672';

  connection = await connectRabbitMQ(url);
  channel = await connection.createChannel();

  await setupExchange(channel);
}

export function getChannel(): Channel {
  if (!channel) throw new Error('RabbitMQ not initialized');
  return channel;
}

/* ---------------- PUBLISH ---------------- */

export async function publishOrderEvent(
  type: EventType,
  order: Order
): Promise<void> {
  const event = createOrderEvent(type, {
    orderId: order.id,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    items: order.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
    total: order.total,
    status: order.status,
  });

  await publishEvent(getChannel(), event);

  console.log(`Published ${type} for order ${order.id}`);
}

/* ---------------- SUBSCRIBE ---------------- */

async function handleStatusEvent(event: OrderEvent) {
  const newStatus = getNextStatusFromEvent(event.type);
  if (!newStatus) return;

  const order = await getOrderById(event.payload.orderId);

  if (!order) {
    console.warn(`Order ${event.payload.orderId} not found`);
    return;
  }

  if (!canTransition(order.status, newStatus)) {
    console.warn(
      `Invalid transition: ${order.status} -> ${newStatus}`
    );
    return;
  }

  await updateOrderStatus(order.id, newStatus);

  console.log(`Order ${order.id} -> ${newStatus}`);
}

export async function subscribeToStatusUpdates(): Promise<void> {
  const statusEvents = [
    EventType.ORDER_PREPARING,
    EventType.ORDER_READY,
    EventType.ORDER_COMPLETED,
  ];

  await subscribeToEvents(
    getChannel(),
    'order-service.status-updates',
    statusEvents,
    handleStatusEvent
  );
}

/* ---------------- CLEANUP ---------------- */

export async function closeEventBus(): Promise<void> {
  await channel?.close();
  await connection?.close();
}