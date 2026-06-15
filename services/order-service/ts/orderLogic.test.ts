import {
  canTransition,
  getNextStatusFromEvent,
  validateCreateOrderInput,
  validateOrderItems,
} from './orderLogic';

describe('validateCreateOrderInput', () => {
  const validInput = {
    customerName: 'Anna Svensson',
    customerEmail: 'anna@example.com',
    items: [{ productId: 1, quantity: 2 }],
  };

  it('accepts valid input', () => {
    expect(validateCreateOrderInput(validInput)).toBeNull();
  });

  it('rejects missing customer name', () => {
    expect(validateCreateOrderInput({ ...validInput, customerName: '' })).toBe(
      'Customer name is required'
    );
  });

  it('rejects invalid email', () => {
    expect(validateCreateOrderInput({ ...validInput, customerEmail: 'bad' })).toBe(
      'Valid customer email is required'
    );
  });

  it('rejects empty items', () => {
    expect(validateCreateOrderInput({ ...validInput, items: [] })).toBe(
      'Order must contain at least one item'
    );
  });
});

describe('validateOrderItems', () => {
  const products = [
    { id: 1, name: 'Burger', price: 89, available: true },
    { id: 2, name: 'Fries', price: 35, available: true },
  ];

  it('calculates total correctly', () => {
    const result = validateOrderItems(
      [
        { productId: 1, quantity: 2 },
        { productId: 2, quantity: 1 },
      ],
      products
    );

    expect('error' in result).toBe(false);
    if (!('error' in result)) {
      expect(result.total).toBe(213);
      expect(result.items).toHaveLength(2);
    }
  });

  it('rejects unknown product', () => {
    const result = validateOrderItems([{ productId: 99, quantity: 1 }], products);
    expect(result).toEqual({ error: 'Product 99 not found' });
  });

  it('rejects unavailable product', () => {
    const result = validateOrderItems(
      [{ productId: 1, quantity: 1 }],
      [{ id: 1, name: 'Burger', price: 89, available: false }]
    );
    expect(result).toEqual({ error: 'Product Burger is not available' });
  });
});

describe('canTransition', () => {
  it('allows pending to confirmed', () => {
    expect(canTransition('pending', 'confirmed')).toBe(true);
  });

  it('allows ready to completed', () => {
    expect(canTransition('ready', 'completed')).toBe(true);
  });

  it('blocks completed to preparing', () => {
    expect(canTransition('completed', 'preparing')).toBe(false);
  });

  it('allows cancellation from pending', () => {
    expect(canTransition('pending', 'cancelled')).toBe(true);
  });
});

describe('getNextStatusFromEvent', () => {
  it.each([
    ['order.confirmed', 'confirmed'],
    ['order.preparing', 'preparing'],
    ['order.ready', 'ready'],
    ['order.completed', 'completed'],
    ['order.cancelled', 'cancelled'],
  ])('maps %s to %s', (eventType, status) => {
    expect(getNextStatusFromEvent(eventType)).toBe(status);
  });

  it('returns null for unknown events', () => {
    expect(getNextStatusFromEvent('order.unknown')).toBeNull();
  });
});
