import { rewritePath } from './proxy';

describe('rewritePath', () => {
  it('rewrites product paths', () => {
    expect(rewritePath('/api/products', '/api/products/1')).toBe('/products/1');
  });

  it('rewrites menu paths', () => {
    expect(rewritePath('/api/menus', '/api/menus')).toBe('/menus');
  });

  it('rewrites order paths', () => {
    expect(rewritePath('/api/orders', '/api/orders/abc/cancel')).toBe(
      '/orders/abc/cancel'
    );
  });

  it('rewrites kitchen paths', () => {
    expect(rewritePath('/api/kitchen', '/api/kitchen/1/status')).toBe(
      '/tickets/1/status'
    );
  });

  it('rewrites notification paths', () => {
    expect(rewritePath('/api/notifications', '/api/notifications/order/abc')).toBe(
      '/notifications/order/abc'
    );
  });
});
