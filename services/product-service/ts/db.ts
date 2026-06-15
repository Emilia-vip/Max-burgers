import { Pool } from 'pg';
import { groupProductsByMenu } from './productLogic';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
}

export interface Menu {
  id: number;
  name: string;
  active: boolean;
  products: Product[];
}

export async function getAllProducts(): Promise<Product[]> {
  const result = await getPool().query(
    'SELECT id, name, description, price::float, category, available FROM products WHERE available = true ORDER BY category, name'
  );
  return result.rows;
}

export async function getProductById(id: number): Promise<Product | null> {
  const result = await getPool().query(
    'SELECT id, name, description, price::float, category, available FROM products WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

export async function getAllMenus(): Promise<Menu[]> {
  const [menusResult, productsResult] = await Promise.all([
    getPool().query('SELECT id, name, active FROM menus WHERE active = true ORDER BY id'),
    getPool().query(
      `SELECT mi.menu_id, p.id, p.name, p.description, p.price::float, p.category, p.available
       FROM menu_items mi
       JOIN products p ON p.id = mi.product_id
       WHERE p.available = true
       ORDER BY p.category, p.name`
    ),
  ]);

  return groupProductsByMenu(menusResult.rows, productsResult.rows);
}
