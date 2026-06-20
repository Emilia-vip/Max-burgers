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
import { createTicket } from './db';

let connection: RabbitConnection | null = null;
let channel: Channel | null = null;

function getChannel(): Channel {
  if (!channel) throw new Error('RabbitMQ channel not initialized');
  return channel;
}

export async function initEventBus(): Promise<void> {
  const url = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
  connection = await connectRabbitMQ(url);
  channel = await connection.createChannel();
  await setupExchange(channel);

  await subscribeToEvents(
    channel,
    'kitchen-service.orders',
    [EventType.ORDER_CONFIRMED],
    async (event: OrderEvent) => {
      const ticket = await createTicket(
        event.payload.orderId,
        event.payload.customerName,
        event.payload.customerEmail
      );
      console.log(`Kitchen ticket created for order ${ticket.orderId}`);
    }
  );
}

export async function publishKitchenEvent(
  eventType: EventType.ORDER_PREPARING | EventType.ORDER_READY,
  ticket: {
    orderId: string;
    customerName: string;
    customerEmail: string;
  }
): Promise<void> {
  const status = eventType === EventType.ORDER_PREPARING ? 'preparing' : 'ready';
  const event = createOrderEvent(eventType, {
    orderId: ticket.orderId,
    customerName: ticket.customerName,
    customerEmail: ticket.customerEmail,
    items: [],
    total: 0,
    status,
  });
  await publishEvent(getChannel(), event);
  console.log(`Published ${eventType} for order ${ticket.orderId}`);
}

export async function closeEventBus(): Promise<void> {
  if (channel) await channel.close();
  if (connection) await connection.close();
}
