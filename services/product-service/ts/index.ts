import express from 'express';
import { getAllMenus, getAllProducts, getProductById, getPool } from './db';
import { parseProductId } from './productLogic';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'product-service' });
});

app.get('/products', async (_req, res) => {
  try {
    const products = await getAllProducts();
    res.json(products);
  } catch (error) {
    console.error('Failed to fetch products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get('/products/:id', async (req, res) => {
  try {
    const id = parseProductId(req.params.id);
    if (id === null) {
      res.status(400).json({ error: 'Invalid product ID' });
      return;
    }
    const product = await getProductById(id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    if (!product.available) {
      res.status(404).json({ error: 'Product not available' });
      return;
    }
    res.json(product);
  } catch (error) {
    console.error('Failed to fetch product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

app.get('/menus', async (_req, res) => {
  try {
    const menus = await getAllMenus();
    res.json(menus);
  } catch (error) {
    console.error('Failed to fetch menus:', error);
    res.status(500).json({ error: 'Failed to fetch menus' });
  }
});

async function start() {
  try {
    await getPool().query('SELECT 1');
    app.listen(PORT, () => {
      console.log(`Product service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start product service:', error);
    process.exit(1);
  }
}

start();
