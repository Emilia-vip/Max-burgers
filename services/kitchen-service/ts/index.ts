import express from 'express';
import { EventType } from '@maxburger/shared';
import {
  getActiveTickets,
  getAllTickets,
  getPool,
  getTicketById,
  updateTicketStatus,
} from './db';
import { closeEventBus, initEventBus, publishKitchenEvent } from './events';
import {
  canTransitionKitchenStatus,
  KitchenStatus,
  kitchenStatusToEvent,
} from './kitchenLogic';

const app = express();
const PORT = parseInt(process.env.PORT || '3003', 10);

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'kitchen-service' });
});

app.get('/tickets', async (req, res) => {
  try {
    const activeOnly = req.query.active === 'true';
    const tickets = activeOnly ? await getActiveTickets() : await getAllTickets();
    res.json(tickets);
  } catch (error) {
    console.error('Failed to fetch tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

app.get('/tickets/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid ticket ID' });
      return;
    }
    const ticket = await getTicketById(id);
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }
    res.json(ticket);
  } catch (error) {
    console.error('Failed to fetch ticket:', error);
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

app.patch('/tickets/:id/status', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body as { status: KitchenStatus };

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid ticket ID' });
      return;
    }

    if (!['preparing', 'ready'].includes(status)) {
      res.status(400).json({ error: 'Status must be preparing or ready' });
      return;
    }

    const ticket = await getTicketById(id);
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    if (!canTransitionKitchenStatus(ticket.status, status)) {
      res.status(409).json({
        error: `Cannot transition from ${ticket.status} to ${status}`,
      });
      return;
    }

    const updated = await updateTicketStatus(id, status);
    if (!updated) {
      res.status(500).json({ error: 'Failed to update ticket' });
      return;
    }

    const eventType = kitchenStatusToEvent(status);
    if (eventType) {
      const rabbitEventType =
        eventType === 'order.preparing'
          ? EventType.ORDER_PREPARING
          : EventType.ORDER_READY;

      await publishKitchenEvent(rabbitEventType, {
        type: rabbitEventType,
        timestamp: new Date().toISOString(),
        payload: {
          orderId: updated.orderId,
          customerName: updated.customerName,
          customerEmail: updated.customerEmail,
          items: [],
          total: 0,
          status,
        },
      });
    }

    res.json(updated);
  } catch (error) {
    console.error('Failed to update ticket:', error);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

async function start() {
  try {
    await getPool().query('SELECT 1');
    await initEventBus();

    app.listen(PORT, () => {
      console.log(`Kitchen service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start kitchen service:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  await closeEventBus();
  process.exit(0);
});

start();

export default app;
