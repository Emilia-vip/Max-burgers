import { EventType } from '@maxburger/shared';
import { buildNotificationMessage } from './notificationLogic';

describe('buildNotificationMessage', () => {
  it.each([
    [EventType.ORDER_CREATED, 'Anna', 'mottagits'],
    [EventType.ORDER_CONFIRMED, 'Anna', 'bekräftad'],
    [EventType.ORDER_PREPARING, 'Erik', 'tillagas'],
    [EventType.ORDER_READY, 'Erik', 'klar'],
    [EventType.ORDER_COMPLETED, 'Lisa', 'Tack'],
    [EventType.ORDER_CANCELLED, 'Lisa', 'avbrutits'],
  ])('builds message for %s', (eventType, customerName, expectedText) => {
    const message = buildNotificationMessage(eventType, customerName);
    expect(message).toContain(customerName);
    expect(message).toContain(expectedText);
  });
});
