export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';

export interface OrderItemInput {
  productId: number;
  quantity: number;
}

export interface CreateOrderInput {
  customerName: string;
  customerEmail: string;
  items: OrderItemInput[];
}

export interface ProductInfo {
  id: number;
  name: string;
  price: number;
  available: boolean;
}

export interface ValidatedOrderItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
}

/* ---------------- STATUS RULES ---------------- */

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['completed'],
  completed: [],
  cancelled: [],
};

/* ---------------- VALIDATION ---------------- */

export function validateCreateOrderInput(
  input: CreateOrderInput
): string | null {
  if (!input.customerName?.trim()) {
    return 'Customer name is required';
  }

  if (!input.customerEmail?.trim() || !input.customerEmail.includes('@')) {
    return 'Valid customer email is required';
  }

  if (!input.items?.length) {
    return 'Order must contain at least one item';
  }

  for (const item of input.items) {
    if (item.productId <= 0) {
      return 'Invalid product ID';
    }

    if (item.quantity <= 0) {
      return 'Quantity must be greater than 0';
    }
  }

  return null;
}

/* ---------------- ORDER ITEMS ---------------- */

export function validateOrderItems(
  items: OrderItemInput[],
  products: ProductInfo[]
):
  | { error: string }
  | { items: ValidatedOrderItem[]; total: number } {
  const productMap = new Map(products.map((p) => [p.id, p]));

  const validated: ValidatedOrderItem[] = [];
  let total = 0;

  for (const item of items) {
    const product = productMap.get(item.productId);

    if (!product) {
      return { error: `Product ${item.productId} not found` };
    }

    if (!product.available) {
      return { error: `Product ${product.name} is not available` };
    }

    validated.push({
      productId: product.id,
      productName: product.name,
      quantity: item.quantity,
      unitPrice: product.price,
    });

    total += product.price * item.quantity;
  }

  return {
    items: validated,
    total: Math.round(total * 100) / 100,
  };
}

/* ---------------- STATE LOGIC ---------------- */

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/* ---------------- EVENTS ---------------- */

const EVENT_TO_STATUS: Record<string, OrderStatus> = {
  'order.confirmed': 'confirmed',
  'order.preparing': 'preparing',
  'order.ready': 'ready',
  'order.completed': 'completed',
  'order.cancelled': 'cancelled',
};

export function getNextStatusFromEvent(
  eventType: string
): OrderStatus | null {
  return EVENT_TO_STATUS[eventType] ?? null;
}