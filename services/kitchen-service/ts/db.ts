import { Pool } from 'pg';
import { KitchenStatus } from './kitchenLogic';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
}

export interface KitchenTicket {
  id: number;
  orderId: string;
  customerName: string;
  customerEmail: string;
  status: KitchenStatus;
  createdAt: string;
  updatedAt: string;
}

export async function createTicket(
  orderId: string,
  customerName: string,
  customerEmail: string
): Promise<KitchenTicket> {
  const result = await getPool().query(
    `INSERT INTO kitchen_tickets (order_id, customer_name, customer_email, status)
     VALUES ($1, $2, $3, 'queued')
     ON CONFLICT (order_id) DO NOTHING
     RETURNING id, order_id, customer_name, customer_email, status, created_at, updated_at`,
    [orderId, customerName, customerEmail]
  );

  if (result.rows.length > 0) {
    return mapTicket(result.rows[0]);
  }

  const existing = await getTicketByOrderId(orderId);
  if (!existing) throw new Error('Failed to create kitchen ticket');
  return existing;
}

export async function getTicketByOrderId(orderId: string): Promise<KitchenTicket | null> {
  const result = await getPool().query(
    `SELECT id, order_id, customer_name, customer_email, status, created_at, updated_at
     FROM kitchen_tickets WHERE order_id = $1`,
    [orderId]
  );
  return result.rows[0] ? mapTicket(result.rows[0]) : null;
}

export async function getTicketById(id: number): Promise<KitchenTicket | null> {
  const result = await getPool().query(
    `SELECT id, order_id, customer_name, customer_email, status, created_at, updated_at
     FROM kitchen_tickets WHERE id = $1`,
    [id]
  );
  return result.rows[0] ? mapTicket(result.rows[0]) : null;
}

export async function getActiveTickets(): Promise<KitchenTicket[]> {
  const result = await getPool().query(
    `SELECT id, order_id, customer_name, customer_email, status, created_at, updated_at
     FROM kitchen_tickets
     WHERE status != 'ready'
     ORDER BY created_at ASC`
  );
  return result.rows.map(mapTicket);
}

export async function getAllTickets(): Promise<KitchenTicket[]> {
  const result = await getPool().query(
    `SELECT id, order_id, customer_name, customer_email, status, created_at, updated_at
     FROM kitchen_tickets
     ORDER BY created_at DESC`
  );
  return result.rows.map(mapTicket);
}

export async function updateTicketStatus(
  id: number,
  status: KitchenStatus
): Promise<KitchenTicket | null> {
  const result = await getPool().query(
    `UPDATE kitchen_tickets SET status = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING id, order_id, customer_name, customer_email, status, created_at, updated_at`,
    [id, status]
  );
  return result.rows[0] ? mapTicket(result.rows[0]) : null;
}

function mapTicket(row: Record<string, unknown>): KitchenTicket {
  return {
    id: row.id as number,
    orderId: row.order_id as string,
    customerName: row.customer_name as string,
    customerEmail: row.customer_email as string,
    status: row.status as KitchenStatus,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
