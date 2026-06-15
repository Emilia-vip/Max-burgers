import { EventType } from '@maxburger/shared';

const MESSAGES: Record<EventType, (customerName: string) => string> = {
  [EventType.ORDER_CREATED]: (name) =>
    `Hej ${name}! Din beställning har mottagits och behandlas.`,
  [EventType.ORDER_CONFIRMED]: (name) =>
    `Hej ${name}! Din beställning är bekräftad och skickas till köket.`,
  [EventType.ORDER_PREPARING]: (name) =>
    `Hej ${name}! Din mat tillagas nu i köket.`,
  [EventType.ORDER_READY]: (name) =>
    `Hej ${name}! Din beställning är klar för upphämtning!`,
  [EventType.ORDER_COMPLETED]: (name) =>
    `Hej ${name}! Tack för din beställning. Smaklig måltid!`,
  [EventType.ORDER_CANCELLED]: (name) =>
    `Hej ${name}! Din beställning har avbrutits.`,
};

export function buildNotificationMessage(
  eventType: EventType,
  customerName: string
): string {
  const builder = MESSAGES[eventType];
  return builder ? builder(customerName) : `Orderuppdatering för ${customerName}`;
}
