import express from 'express';
import { EventType } from '@maxburger/shared';
import {
  createOrder,
  getAllOrders,
  getOrderById,
  getPool,
  updateOrderStatus,
} from './db';

import {
  closeEventBus,
  initEventBus,
  publishOrderEvent,
  subscribeToStatusUpdates,
} from './events';

import { fetchProducts } from './productClient';
import {
  canTransition,
  CreateOrderInput,
  validateCreateOrderInput,
  validateOrderItems,
} from './orderLogic';

const app = express();
const PORT = Number(process.env.PORT) || 3002;

app.use(express.json());

/* ---------------- HELPERS ---------------- */

function handleError(res: any, error: unknown, message: string) {
  console.error(message, error);
  res.status(500).json({ error: message });
}

async function getOrderOr404(req: any, res: any) {
  const order = await getOrderById(req.params.id);

  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return null;
  }

  return order;
}

async function updateStatus(
  req: any,
  res: any,
  status: 'cancelled' | 'completed',
  event: EventType,
  errorMsg: string
) {
  try {
    const order = await getOrderOr404(req, res);
    if (!order) return;

    if (!canTransition(order.status, status)) {
      return res.status(409).json({
        error: `Cannot ${status} order in status: ${order.status}`,
      });
    }

    const updated = await updateOrderStatus(order.id, status);

    if (updated) {
      await publishOrderEvent(event, updated);
    }

    res.json(updated);
  } catch (err) {
    handleError(res, err, errorMsg);
  }
}

/* ---------------- ROUTES ---------------- */

app.get('/health', (_, res) => {
  res.json({ status: 'ok', service: 'order-service' });
});

app.post('/orders', async (req, res) => {
  try {
    const input: CreateOrderInput = req.body;

    const validationError = validateCreateOrderInput(input);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const productIds = [...new Set(input.items.map((i) => i.productId))];
    const products = await fetchProducts(productIds);

    if (products.length !== productIds.length) {
      return res.status(400).json({ error: 'One or more products not found' });
    }

    const result = validateOrderItems(input.items, products);

    if ('error' in result) {
      return res.status(400).json({ error: result.error });
    }

    const order = await createOrder(
      input.customerName.trim(),
      input.customerEmail.trim(),
      result.items,
      result.total
    );

    await publishOrderEvent(EventType.ORDER_CREATED, order);

    const confirmed = await updateOrderStatus(order.id, 'confirmed');

    if (!confirmed) {
      return handleError(res, null, 'Failed to confirm order');
    }

    await publishOrderEvent(EventType.ORDER_CONFIRMED, confirmed);
    return res.status(201).json(confirmed);
  } catch (err) {
    handleError(res, err, 'Failed to create order');
  }
});

app.get('/orders', async (_req, res) => {
  try {
    res.json(await getAllOrders());
  } catch (err) {
    handleError(res, err, 'Failed to fetch orders');
  }
});

app.get('/orders/:id', async (req, res) => {
  try {
    const order = await getOrderOr404(req, res);
    if (!order) return;

    res.json(order);
  } catch (err) {
    handleError(res, err, 'Failed to fetch order');
  }
});

app.patch('/orders/:id/cancel', (req, res) =>
  updateStatus(req, res, 'cancelled', EventType.ORDER_CANCELLED, 'Failed to cancel order')
);

app.patch('/orders/:id/complete', (req, res) =>
  updateStatus(req, res, 'completed', EventType.ORDER_COMPLETED, 'Failed to complete order')
);

/* ---------------- START ---------------- */

async function start() {
  try {
    await getPool().query('SELECT 1');
    await initEventBus();
    await subscribeToStatusUpdates();

    app.listen(PORT, () => {
      console.log(`Order service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start order service:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  await closeEventBus();
  process.exit(0);
});

start();