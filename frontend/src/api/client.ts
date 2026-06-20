import type { KitchenTicket, Notification, Order, Product } from '../types';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, options);
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message = body?.error || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return body as T;
}

export function getProducts(): Promise<Product[]> {
  return request('/api/products');
}

export function createOrder(data: {
  customerName: string;
  customerEmail: string;
  items: { productId: number; quantity: number }[];
}): Promise<Order> {
  return request('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function getOrder(id: string): Promise<Order> {
  return request(`/api/orders/${id}`);
}

export function cancelOrder(id: string): Promise<Order> {
  return request(`/api/orders/${id}/cancel`, { method: 'PATCH' });
}

export function completeOrder(id: string): Promise<Order> {
  return request(`/api/orders/${id}/complete`, { method: 'PATCH' });
}

export function getKitchenTickets(activeOnly = true): Promise<KitchenTicket[]> {
  const query = activeOnly ? '?active=true' : '';
  return request(`/api/kitchen${query}`);
}

export function updateKitchenStatus(
  ticketId: number,
  status: 'preparing' | 'ready'
): Promise<KitchenTicket> {
  return request(`/api/kitchen/${ticketId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
}

export function getNotifications(orderId: string): Promise<Notification[]> {
  return request(`/api/notifications/order/${orderId}`);
}
