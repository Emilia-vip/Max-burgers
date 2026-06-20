const BASE_URL = process.env.API_URL || 'http://localhost';
const WAIT_TIMEOUT_MS = process.env.CI ? 45000 : 15000;

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
  timeoutMs = WAIT_TIMEOUT_MS,
  intervalMs = 500
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await fn()) return;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error('Timeout waiting for condition');
}

async function waitForNotification(orderId: string, eventType: string): Promise<void> {
  await waitFor(async () => {
    const notifications = await api(`/api/notifications/order/${orderId}`);
    return (
      Array.isArray(notifications.body) &&
      notifications.body.some(
        (notification: { eventType: string }) => notification.eventType === eventType
      )
    );
  });
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

async function getKitchenTicket(orderId: string) {
  await waitFor(async () => {
    const kitchen = await api('/api/kitchen?active=true');
    return (
      Array.isArray(kitchen.body) &&
      kitchen.body.some((t: { orderId: string }) => t.orderId === orderId)
    );
  });

  const ticket = (await api('/api/kitchen?active=true')).body.find(
    (t: { orderId: string }) => t.orderId === orderId
  );

  if (!ticket) {
    throw new Error(`Kitchen ticket not found for order ${orderId}`);
  }

  return ticket as { id: number; orderId: string; status: string };
}

async function completeOrderThroughKitchen(orderId: string): Promise<void> {
  const ticket = await getKitchenTicket(orderId);

  const preparingRes = await api(`/api/kitchen/${ticket.id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'preparing' }),
  });
  expect(preparingRes.status).toBe(200);

  await waitFor(async () => {
    const currentOrder = await api(`/api/orders/${orderId}`);
    return currentOrder.body?.status === 'preparing';
  });

  const readyRes = await api(`/api/kitchen/${ticket.id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'ready' }),
  });
  expect(readyRes.status).toBe(200);

  await waitFor(async () => {
    const currentOrder = await api(`/api/orders/${orderId}`);
    return currentOrder.body?.status === 'ready';
  });

  const completeRes = await api(`/api/orders/${orderId}/complete`, {
    method: 'PATCH',
  });
  expect(completeRes.status).toBe(200);
  expect(completeRes.body?.status).toBe('completed');
}

describe('MaxBurger E2E Order Flow', () => {
  beforeAll(async () => {
    await waitFor(async () => {
      const { status, body } = await api('/api/health');
      return status === 200 && body?.service === 'api-gateway';
    }, WAIT_TIMEOUT_MS, 1000);
  }, WAIT_TIMEOUT_MS);

  it('health check responds through nginx', async () => {
    const { status, body } = await api('/api/health');
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

  it('returns 404 for unknown product id', async () => {
    const product = await api('/api/products/9999');
    expect(product.status).toBe(404);
  });

  it('rejects order with missing customer name', async () => {
    const res = await api('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: '',
        customerEmail: 'test@example.com',
        items: [{ productId: 1, quantity: 1 }],
      }),
    });
    expect(res.status).toBe(400);
  });

  it('rejects order with invalid email', async () => {
    const res = await api('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Test',
        customerEmail: 'not-an-email',
        items: [{ productId: 1, quantity: 1 }],
      }),
    });
    expect(res.status).toBe(400);
  });

  it('lists all notifications after creating an order', async () => {
    const order = await createTestOrder('Notifications List Test');

    await waitForNotification(order.id, 'order.confirmed');

    const allNotifications = await api('/api/notifications');
    expect(allNotifications.status).toBe(200);
    expect(Array.isArray(allNotifications.body)).toBe(true);
    expect(
      allNotifications.body.some(
        (notification: { orderId: string }) => notification.orderId === order.id
      )
    ).toBe(true);
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
    expect(Number(order.total)).toBe(159);

    const ticket = await getKitchenTicket(orderId);
    expect(ticket.status).toBe('queued');

    const allKitchen = await api('/api/kitchen');
    expect(allKitchen.status).toBe(200);
    expect(allKitchen.body.some((t: { id: number }) => t.id === ticket.id)).toBe(
      true
    );

    const ticketById = await api(`/api/kitchen/${ticket.id}`);
    expect(ticketById.status).toBe(200);
    expect(ticketById.body.orderId).toBe(orderId);

    await completeOrderThroughKitchen(orderId);

    await waitFor(async () => {
      const notifications = await api(`/api/notifications/order/${orderId}`);
      return (
        Array.isArray(notifications.body) &&
        notifications.body.length >= EXPECTED_EVENTS.length
      );
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

    await waitForNotification(order.id, 'order.cancelled');
  });

  it('rejects cancelling a completed order', async () => {
    const order = await createTestOrder('Completed Cancel Test');
    await completeOrderThroughKitchen(order.id);

    const cancelRes = await api(`/api/orders/${order.id}/cancel`, {
      method: 'PATCH',
    });
    expect(cancelRes.status).toBe(409);
  });

  it('rejects invalid kitchen status transition', async () => {
    const order = await createTestOrder('Kitchen Error Test');
    const orderId = order.id;

    await waitFor(async () => {
      const kitchen = await api('/api/kitchen?active=true');
      return (
        Array.isArray(kitchen.body) &&
        kitchen.body.some((t: { orderId: string }) => t.orderId === orderId)
      );
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
