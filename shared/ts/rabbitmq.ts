import amqp, { Channel, ConsumeMessage } from 'amqplib';
import { EXCHANGE_NAME, EventType, OrderEvent } from './events';

const ROUTING_KEYS = Object.values(EventType);

export type RabbitConnection = Awaited<ReturnType<typeof amqp.connect>>;

export async function connectRabbitMQ(
  url: string,
  maxRetries = 10,
  delayMs = 3000
): Promise<RabbitConnection> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await amqp.connect(url);
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        console.log(`RabbitMQ not ready (attempt ${attempt}/${maxRetries}), retrying...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError;
}

export async function setupExchange(channel: Channel): Promise<void> {
  await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
}

export async function publishEvent(
  channel: Channel,
  event: OrderEvent
): Promise<void> {
  const buffer = Buffer.from(JSON.stringify(event));
  channel.publish(EXCHANGE_NAME, event.type, buffer, {
    persistent: true,
    contentType: 'application/json',
  });
}

export async function subscribeToEvents(
  channel: Channel,
  queueName: string,
  eventTypes: EventType[],
  handler: (event: OrderEvent) => Promise<void>
): Promise<void> {
  await channel.assertQueue(queueName, { durable: true });

  for (const eventType of eventTypes) {
    await channel.bindQueue(queueName, EXCHANGE_NAME, eventType);
  }

  await channel.consume(queueName, async (msg: ConsumeMessage | null) => {
    if (!msg) return;

    try {
      const event = JSON.parse(msg.content.toString()) as OrderEvent;
      await handler(event);
      channel.ack(msg);
    } catch (error) {
      console.error(`Failed to process message on ${queueName}:`, error);
      channel.nack(msg, false, false);
    }
  });
}

export function getAllEventTypes(): EventType[] {
  return ROUTING_KEYS as EventType[];
}
