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
    expect(kitchenStatusToEvent('preparing')).toBe('order.preparing');
  });

  it('maps ready to order.ready', () => {
    expect(kitchenStatusToEvent('ready')).toBe('order.ready');
  });

  it('returns null for queued', () => {
    expect(kitchenStatusToEvent('queued')).toBeNull();
  });
});
