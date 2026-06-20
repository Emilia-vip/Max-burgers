export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
}

export interface OrderItem {
  id?: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  status: OrderStatus;
  total: number;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface KitchenTicket {
  id: number;
  orderId: string;
  customerName: string;
  customerEmail: string;
  status: 'queued' | 'preparing' | 'ready';
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: number;
  orderId: string;
  eventType: string;
  message: string;
  recipient: string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
