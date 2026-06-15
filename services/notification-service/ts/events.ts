import { Channel } from 'amqplib';
import {
  connectRabbitMQ,
  EventType,
  getAllEventTypes,
  OrderEvent,
  RabbitConnection,
  setupExchange,
  subscribeToEvents,
} from '@maxburger/shared';
import { saveNotification } from './db';
import { buildNotificationMessage } from './notificationLogic';

let connection: RabbitConnection | null = null;
let channel: Channel | null = null;

export async function initEventBus(): Promise<void> {
  const url = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
  connection = await connectRabbitMQ(url);
  channel = await connection.createChannel();
  await setupExchange(channel);

  await subscribeToEvents(
    channel,
    'notification-service.all-events',
    getAllEventTypes(),
    async (event: OrderEvent) => {
      const message = buildNotificationMessage(
        event.type as EventType,
        event.payload.customerName
      );

      const notification = await saveNotification(
        event.payload.orderId,
        event.type,
        message,
        event.payload.customerEmail
      );

      console.log(
        `[NOTIFICATION] To: ${notification.recipient} | ${notification.message}`
      );
    }
  );
}

export async function closeEventBus(): Promise<void> {
  if (channel) await channel.close();
  if (connection) await connection.close();
}
