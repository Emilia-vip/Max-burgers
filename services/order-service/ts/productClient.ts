import { ProductInfo } from './orderLogic';

const PRODUCT_SERVICE_URL =
  process.env.PRODUCT_SERVICE_URL || 'http://localhost:3001';

let cachedProducts: ProductInfo[] | null = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 30_000;

async function getAllProductsCached(): Promise<ProductInfo[]> {
  const now = Date.now();
  if (cachedProducts && now < cacheExpiry) {
    return cachedProducts;
  }

  const response = await fetch(`${PRODUCT_SERVICE_URL}/products`);
  if (!response.ok) {
    throw new Error(`Product service error: ${response.status}`);
  }

  const products = (await response.json()) as ProductInfo[];
  cachedProducts = products;
  cacheExpiry = now + CACHE_TTL_MS;
  return products;
}

export async function fetchProducts(ids: number[]): Promise<ProductInfo[]> {
  const allProducts = await getAllProductsCached();
  const idSet = new Set(ids);
  return allProducts.filter((p) => idSet.has(p.id));
}
