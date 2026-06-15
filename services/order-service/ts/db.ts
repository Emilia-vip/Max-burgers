import { Pool } from 'pg';
import { OrderStatus, ValidatedOrderItem } from './orderLogic';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
}

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
}

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

export async function createOrder(
  customerName: string,
  customerEmail: string,
  items: ValidatedOrderItem[],
  total: number
): Promise<Order> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');

    const orderResult = await client.query(
      `INSERT INTO orders (customer_name, customer_email, status, total)
       VALUES ($1, $2, 'pending', $3)
       RETURNING id, customer_name, customer_email, status, total::float, created_at, updated_at`,
      [customerName, customerEmail, total]
    );

    const order = orderResult.rows[0];
    const orderItems: OrderItem[] = [];

    for (const item of items) {
      const itemResult = await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, product_id, product_name, quantity, unit_price::float`,
        [order.id, item.productId, item.productName, item.quantity, item.unitPrice]
      );
      const row = itemResult.rows[0];
      orderItems.push({
        id: row.id,
        productId: row.product_id,
        productName: row.product_name,
        quantity: row.quantity,
        unitPrice: row.unit_price,
      });
    }

    await client.query('COMMIT');

    return {
      id: order.id,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      status: order.status,
      total: order.total,
      items: orderItems,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getOrderById(id: string): Promise<Order | null> {
  const orderResult = await getPool().query(
    `SELECT id, customer_name, customer_email, status, total::float, created_at, updated_at
     FROM orders WHERE id = $1`,
    [id]
  );

  if (orderResult.rows.length === 0) return null;

  const order = orderResult.rows[0];
  const itemsResult = await getPool().query(
    `SELECT id, product_id, product_name, quantity, unit_price::float
     FROM order_items WHERE order_id = $1`,
    [id]
  );

  return {
    id: order.id,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    status: order.status,
    total: order.total,
    items: itemsResult.rows.map((row) => ({
      id: row.id,
      productId: row.product_id,
      productName: row.product_name,
      quantity: row.quantity,
      unitPrice: row.unit_price,
    })),
    createdAt: order.created_at,
    updatedAt: order.updated_at,
  };
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<Order | null> {
  const result = await getPool().query(
    `UPDATE orders SET status = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING id`,
    [id, status]
  );

  if (result.rows.length === 0) return null;
  return getOrderById(id);
}

export async function getAllOrders(): Promise<Order[]> {
  const ordersResult = await getPool().query(
    `SELECT id FROM orders ORDER BY created_at DESC`
  );

  const orders: Order[] = [];
  for (const row of ordersResult.rows) {
    const order = await getOrderById(row.id);
    if (order) orders.push(order);
  }
  return orders;
}
