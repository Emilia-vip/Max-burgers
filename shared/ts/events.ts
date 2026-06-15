export const EXCHANGE_NAME = 'maxburger.events';

export enum EventType {
  ORDER_CREATED = 'order.created',
  ORDER_CONFIRMED = 'order.confirmed',
  ORDER_PREPARING = 'order.preparing',
  ORDER_READY = 'order.ready',
  ORDER_COMPLETED = 'order.completed',
  ORDER_CANCELLED = 'order.cancelled',
}

export interface OrderItemPayload {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderEventPayload {
  orderId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItemPayload[];
  total: number;
  status: string;
}

export interface OrderEvent {
  type: EventType;
  timestamp: string;
  payload: OrderEventPayload;
}

export function createOrderEvent(
  type: EventType,
  payload: OrderEventPayload
): OrderEvent {
  return {
    type,
    timestamp: new Date().toISOString(),
    payload,
  };
}
