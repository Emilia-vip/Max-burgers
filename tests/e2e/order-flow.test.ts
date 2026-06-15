const BASE_URL = process.env.API_URL || 'http://localhost';

const EXPECTED_EVENTS = [
  'order.created',
  'order.confirmed',
  'order.preparing',
  'order.ready',
  'order.completed',
];

interface OrderResponse {
  id: string;
  status: string;
  total: number;
}

async function api(
  path: string,
  options?: RequestInit
): Promise<{ status: number; body: any }> {
  const response = await fetch(`${BASE_URL}${path}`, options);
  const body = await response.json().catch(() => null);
  return { status: response.status, body };
}

async function waitFor(
  fn: () => Promise<boolean>,
  timeoutMs = 15000,
  intervalMs = 500
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await fn()) return;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error('Timeout waiting for condition');
}

async function createTestOrder(customerName = 'Test Kund'): Promise<OrderResponse> {
  const orderRes = await api('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName,
      customerEmail: 'test@example.com',
      items: [
        { productId: 1, quantity: 1 },
        { productId: 5, quantity: 2 },
      ],
    }),
  });

  expect(orderRes.status).toBe(201);
  return orderRes.body as OrderResponse;
}

describe('MaxBurger E2E Order Flow', () => {
  it('health check responds through nginx', async () => {
    const { status, body } = await api('/health');
    expect(status).toBe(200);
    expect(body.service).toBe('api-gateway');
  });

  it('lists products and menus', async () => {
    const products = await api('/api/products');
    expect(products.status).toBe(200);
    expect(Array.isArray(products.body)).toBe(true);
    expect(products.body.length).toBeGreaterThan(0);

    const menus = await api('/api/menus');
    expect(menus.status).toBe(200);
    expect(Array.isArray(menus.body)).toBe(true);
    expect(menus.body[0].products.length).toBeGreaterThan(0);
  });

  it('fetches a single product by id', async () => {
    const product = await api('/api/products/1');
    expect(product.status).toBe(200);
    expect(product.body.id).toBe(1);
    expect(product.body.name).toBe('Classic Burger');
  });

  it('lists orders after creating one', async () => {
    const order = await createTestOrder('List Test');
    const orders = await api('/api/orders');
    expect(orders.status).toBe(200);
    expect(Array.isArray(orders.body)).toBe(true);
    expect(orders.body.some((entry: { id: string }) => entry.id === order.id)).toBe(
      true
    );
  });

  it('completes full order flow from client entry to completion', async () => {
    const order = await createTestOrder('Full Flow');
    const orderId = order.id;

    expect(order.status).toBe('confirmed');
    expect(order.total).toBe(159);

    await waitFor(async () => {
      const kitchen = await api('/api/kitchen?active=true');
      return kitchen.body.some((t: { orderId: string }) => t.orderId === orderId);
    });

    const activeKitchen = await api('/api/kitchen?active=true');
    const ticket = activeKitchen.body.find(
      (t: { orderId: string }) => t.orderId === orderId
    );
    expect(ticket.status).toBe('queued');

    const allKitchen = await api('/api/kitchen');
    expect(allKitchen.status).toBe(200);
    expect(allKitchen.body.some((t: { id: number }) => t.id === ticket.id)).toBe(
      true
    );

    const ticketById = await api(`/api/kitchen/${ticket.id}`);
    expect(ticketById.status).toBe(200);
    expect(ticketById.body.orderId).toBe(orderId);

    const preparingRes = await api(`/api/kitchen/${ticket.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'preparing' }),
    });
    expect(preparingRes.status).toBe(200);
    expect(preparingRes.body.status).toBe('preparing');

    await waitFor(async () => {
      const currentOrder = await api(`/api/orders/${orderId}`);
      return currentOrder.body.status === 'preparing';
    });

    const readyRes = await api(`/api/kitchen/${ticket.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ready' }),
    });
    expect(readyRes.status).toBe(200);
    expect(readyRes.body.status).toBe('ready');

    await waitFor(async () => {
      const currentOrder = await api(`/api/orders/${orderId}`);
      return currentOrder.body.status === 'ready';
    });

    const completeRes = await api(`/api/orders/${orderId}/complete`, {
      method: 'PATCH',
    });
    expect(completeRes.status).toBe(200);
    expect(completeRes.body.status).toBe('completed');

    await waitFor(async () => {
      const notifications = await api(`/api/notifications/order/${orderId}`);
      return notifications.body.length >= EXPECTED_EVENTS.length;
    });

    const notifications = await api(`/api/notifications/order/${orderId}`);
    const eventTypes = notifications.body.map(
      (notification: { eventType: string }) => notification.eventType
    );

    for (const eventType of EXPECTED_EVENTS) {
      expect(eventTypes).toContain(eventType);
    }
  });

  it('rejects order with invalid product', async () => {
    const res = await api('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Test',
        customerEmail: 'test@example.com',
        items: [{ productId: 9999, quantity: 1 }],
      }),
    });
    expect(res.status).toBe(400);
  });

  it('allows cancelling a confirmed order', async () => {
    const order = await createTestOrder('Cancel Test');

    const cancelRes = await api(`/api/orders/${order.id}/cancel`, {
      method: 'PATCH',
    });
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.status).toBe('cancelled');

    const notifications = await api(`/api/notifications/order/${order.id}`);
    expect(
      notifications.body.some(
        (notification: { eventType: string }) =>
          notification.eventType === 'order.cancelled'
      )
    ).toBe(true);
  });

  it('rejects cancelling a completed order', async () => {
    const order = await createTestOrder('Completed Cancel Test');
    const orderId = order.id;

    await waitFor(async () => {
      const kitchen = await api('/api/kitchen?active=true');
      return kitchen.body.some((t: { orderId: string }) => t.orderId === orderId);
    });

    const ticket = (await api('/api/kitchen?active=true')).body.find(
      (t: { orderId: string }) => t.orderId === orderId
    );

    await api(`/api/kitchen/${ticket.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'preparing' }),
    });

    await api(`/api/kitchen/${ticket.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ready' }),
    });

    await api(`/api/orders/${orderId}/complete`, { method: 'PATCH' });

    const cancelRes = await api(`/api/orders/${orderId}/cancel`, {
      method: 'PATCH',
    });
    expect(cancelRes.status).toBe(409);
  });

  it('rejects invalid kitchen status transition', async () => {
    const order = await createTestOrder('Kitchen Error Test');
    const orderId = order.id;

    await waitFor(async () => {
      const kitchen = await api('/api/kitchen?active=true');
      return kitchen.body.some((t: { orderId: string }) => t.orderId === orderId);
    });

    const ticket = (await api('/api/kitchen?active=true')).body.find(
      (t: { orderId: string }) => t.orderId === orderId
    );

    const invalidTransition = await api(`/api/kitchen/${ticket.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ready' }),
    });

    expect(invalidTransition.status).toBe(409);
  });
});
