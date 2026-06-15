import {
  createOrderEvent,
  EventType,
  EXCHANGE_NAME,
} from './events';
import { getAllEventTypes, publishEvent, setupExchange } from './rabbitmq';

describe('EventType', () => {
  it('defines all order lifecycle events', () => {
    expect(Object.values(EventType)).toEqual([
      'order.created',
      'order.confirmed',
      'order.preparing',
      'order.ready',
      'order.completed',
      'order.cancelled',
    ]);
  });
});

describe('createOrderEvent', () => {
  const payload = {
    orderId: 'abc-123',
    customerName: 'Anna',
    customerEmail: 'anna@example.com',
    items: [{ productId: 1, productName: 'Burger', quantity: 2, unitPrice: 89 }],
    total: 178,
    status: 'pending',
  };

  it('creates an event with correct type and payload', () => {
    const event = createOrderEvent(EventType.ORDER_CREATED, payload);

    expect(event.type).toBe(EventType.ORDER_CREATED);
    expect(event.payload).toEqual(payload);
    expect(event.timestamp).toBeDefined();
    expect(new Date(event.timestamp).getTime()).not.toBeNaN();
  });

  it.each([
    EventType.ORDER_CREATED,
    EventType.ORDER_CONFIRMED,
    EventType.ORDER_PREPARING,
    EventType.ORDER_READY,
    EventType.ORDER_COMPLETED,
    EventType.ORDER_CANCELLED,
  ])('supports event type %s', (type) => {
    const event = createOrderEvent(type, payload);
    expect(event.type).toBe(type);
  });
});

describe('getAllEventTypes', () => {
  it('returns every defined event type', () => {
    expect(getAllEventTypes()).toEqual(Object.values(EventType));
  });
});

describe('setupExchange', () => {
  it('asserts the topic exchange', async () => {
    const assertExchange = jest.fn().mockResolvedValue(undefined);
    await setupExchange({ assertExchange } as never);

    expect(assertExchange).toHaveBeenCalledWith(EXCHANGE_NAME, 'topic', {
      durable: true,
    });
  });
});

describe('publishEvent', () => {
  it('publishes JSON payload with routing key', async () => {
    const publish = jest.fn();
    const channel = { publish } as never;
    const event = createOrderEvent(EventType.ORDER_CONFIRMED, {
      orderId: 'order-1',
      customerName: 'Erik',
      customerEmail: 'erik@example.com',
      items: [],
      total: 99,
      status: 'confirmed',
    });

    await publishEvent(channel, event);

    expect(publish).toHaveBeenCalledWith(
      EXCHANGE_NAME,
      EventType.ORDER_CONFIRMED,
      expect.any(Buffer),
      {
        persistent: true,
        contentType: 'application/json',
      }
    );

    const published = JSON.parse(publish.mock.calls[0][2].toString());
    expect(published.type).toBe(EventType.ORDER_CONFIRMED);
    expect(published.payload.orderId).toBe('order-1');
  });
});
