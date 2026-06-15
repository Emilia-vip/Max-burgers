import express from 'express';
import { getAllNotifications, getNotificationsByOrderId, getPool } from './db';
import { closeEventBus, initEventBus } from './events';

const app = express();
const PORT = parseInt(process.env.PORT || '3004', 10);

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'notification-service' });
});

app.get('/notifications', async (_req, res) => {
  try {
    const notifications = await getAllNotifications();
    res.json(notifications);
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.get('/notifications/order/:orderId', async (req, res) => {
  try {
    const notifications = await getNotificationsByOrderId(req.params.orderId);
    res.json(notifications);
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

async function start() {
  try {
    await getPool().query('SELECT 1');
    await initEventBus();

    app.listen(PORT, () => {
      console.log(`Notification service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start notification service:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  await closeEventBus();
  process.exit(0);
});

start();

export default app;
