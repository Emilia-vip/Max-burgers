import { EventType } from '@maxburger/shared';

export type KitchenStatus = 'queued' | 'preparing' | 'ready';

const VALID_TRANSITIONS: Record<KitchenStatus, KitchenStatus[]> = {
  queued: ['preparing'],
  preparing: ['ready'],
  ready: [],
};

export function canTransitionKitchenStatus(
  from: KitchenStatus,
  to: KitchenStatus
): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function kitchenStatusToEvent(
  status: KitchenStatus
): EventType.ORDER_PREPARING | EventType.ORDER_READY | null {
  const mapping: Record<
    KitchenStatus,
    EventType.ORDER_PREPARING | EventType.ORDER_READY | null
  > = {
    queued: null,
    preparing: EventType.ORDER_PREPARING,
    ready: EventType.ORDER_READY,
  };
  return mapping[status];
}
