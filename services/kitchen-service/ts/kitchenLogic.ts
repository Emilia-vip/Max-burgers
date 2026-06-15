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
): 'order.preparing' | 'order.ready' | null {
  const mapping: Record<KitchenStatus, 'order.preparing' | 'order.ready' | null> = {
    queued: null,
    preparing: 'order.preparing',
    ready: 'order.ready',
  };
  return mapping[status];
}
