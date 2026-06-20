import { EventType } from '@maxburger/shared';
import { canTransitionKitchenStatus, kitchenStatusToEvent } from './kitchenLogic';

describe('canTransitionKitchenStatus', () => {
  it('allows queued to preparing', () => {
    expect(canTransitionKitchenStatus('queued', 'preparing')).toBe(true);
  });

  it('allows preparing to ready', () => {
    expect(canTransitionKitchenStatus('preparing', 'ready')).toBe(true);
  });

  it('blocks ready to preparing', () => {
    expect(canTransitionKitchenStatus('ready', 'preparing')).toBe(false);
  });
});

describe('kitchenStatusToEvent', () => {
  it('maps preparing to order.preparing', () => {
    expect(kitchenStatusToEvent('preparing')).toBe(EventType.ORDER_PREPARING);
  });

  it('maps ready to order.ready', () => {
    expect(kitchenStatusToEvent('ready')).toBe(EventType.ORDER_READY);
  });

  it('returns null for queued', () => {
    expect(kitchenStatusToEvent('queued')).toBeNull();
  });
});
