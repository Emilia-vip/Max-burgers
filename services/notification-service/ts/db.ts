import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
}

export interface Notification {
  id: number;
  orderId: string;
  eventType: string;
  message: string;
  recipient: string;
  createdAt: string;
}

export async function saveNotification(
  orderId: string,
  eventType: string,
  message: string,
  recipient: string
): Promise<Notification> {
  const result = await getPool().query(
    `INSERT INTO notifications (order_id, event_type, message, recipient)
     VALUES ($1, $2, $3, $4)
     RETURNING id, order_id, event_type, message, recipient, created_at`,
    [orderId, eventType, message, recipient]
  );

  const row = result.rows[0];
  return {
    id: row.id,
    orderId: row.order_id,
    eventType: row.event_type,
    message: row.message,
    recipient: row.recipient,
    createdAt: row.created_at,
  };
}

export async function getNotificationsByOrderId(
  orderId: string
): Promise<Notification[]> {
  const result = await getPool().query(
    `SELECT id, order_id, event_type, message, recipient, created_at
     FROM notifications
     WHERE order_id = $1
     ORDER BY created_at ASC`,
    [orderId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    orderId: row.order_id,
    eventType: row.event_type,
    message: row.message,
    recipient: row.recipient,
    createdAt: row.created_at,
  }));
}

export async function getAllNotifications(): Promise<Notification[]> {
  const result = await getPool().query(
    `SELECT id, order_id, event_type, message, recipient, created_at
     FROM notifications
     ORDER BY created_at DESC
     LIMIT 100`
  );

  return result.rows.map((row) => ({
    id: row.id,
    orderId: row.order_id,
    eventType: row.event_type,
    message: row.message,
    recipient: row.recipient,
    createdAt: row.created_at,
  }));
}
