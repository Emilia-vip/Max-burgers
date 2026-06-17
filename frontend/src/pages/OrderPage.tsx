import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {cancelOrder,completeOrder,getOrder,getNotifications} from '../api/client';
import {isActiveOrderStatus,useActiveOrder,} from '../context/ActiveOrderContext';
import type { Notification, Order, OrderStatus } from '../types';

const STEPS: { status: OrderStatus; label: string }[] = [
  { status: 'confirmed', label: 'Bekräftad' },
  { status: 'preparing', label: 'Tillagas' },
  { status: 'ready', label: 'Klar' },
  { status: 'completed', label: 'Hämtad' },
];

const STATUS_ORDER: OrderStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'completed',
  'cancelled',
];

function getStepState(
  stepStatus: OrderStatus,
  currentStatus: OrderStatus
): 'done' | 'active' | '' {
  if (currentStatus === 'cancelled') return '';
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);
  const stepIdx = STATUS_ORDER.indexOf(stepStatus);
  if (stepIdx < currentIdx) return 'done';
  if (stepIdx === currentIdx) return 'active';
  return '';
}

export function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeOrder, setActiveOrderId, clearActiveOrder, refreshActiveOrder } =
    useActiveOrder();
  const [order, setOrder] = useState<Order | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const isTrackedOrder = activeOrder?.id === id;

  useEffect(() => {
    if (!id) return;

    if (isTrackedOrder && activeOrder) {
      setOrder(activeOrder);
    }
  }, [id, isTrackedOrder, activeOrder]);

  useEffect(() => {
    if (!id) return;

    if (!isTrackedOrder) {
      getOrder(id)
        .then((data) => {
          setOrder(data);
          if (isActiveOrderStatus(data.status)) {
            setActiveOrderId(data.id);
          }
        })
        .catch((err) =>
          setError(err instanceof Error ? err.message : 'Kunde inte hämta order')
        );
    }
  }, [id, isTrackedOrder, setActiveOrderId]);

  useEffect(() => {
    if (!id) return;

    const loadNotifications = async () => {
      try {
        const notifData = await getNotifications(id);
        setNotifications(notifData);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Kunde inte hämta notiser');
      }
    };

    loadNotifications();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadNotifications();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [id]);

  const handleCancel = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const updated = await cancelOrder(id);
      setOrder(updated);
      clearActiveOrder();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte avbryta');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const updated = await completeOrder(id);
      setOrder(updated);
      clearActiveOrder();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte slutföra');
    } finally {
      setActionLoading(false);
    }
  };

  if (!order) {
    return <div className="loading">{error || 'Laddar order...'}</div>;
  }

  return (
    <div className="order-tracker">
      <div className="tracker-card">
        <h1 className="page-title">Order #{order.id.slice(0, 8)}</h1>
        <p className="page-subtitle">
          {order.customerName} · {order.total.toFixed(0)} kr
        </p>

        <span className={`status-badge status-${order.status}`}>{order.status}</span>

        {order.status !== 'cancelled' && (
          <div className="progress-steps">
            {STEPS.map((step, i) => (
              <div
                key={step.status}
                className={`step ${getStepState(step.status, order.status)}`}
              >
                <div className="step-dot">{i + 1}</div>
                <span className="step-label">{step.label}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: '1.5rem' }}>
          <h3 style={{ marginBottom: '0.75rem' }}>Beställning</h3>
          {order.items.map((item) => (
            <div key={item.id} className="cart-item">
              <span>
                {item.quantity}x {item.productName}
              </span>
              <span>{(item.unitPrice * item.quantity).toFixed(0)} kr</span>
            </div>
          ))}
        </div>

        {error && <div className="error-banner" style={{ marginTop: '1rem' }}>{error}</div>}

        <div className="action-row">
          {['pending', 'confirmed', 'preparing'].includes(order.status) && (
            <button
              className="btn-secondary"
              onClick={handleCancel}
              disabled={actionLoading}
            >
              Avbryt order
            </button>
          )}
          {order.status === 'ready' && (
            <button
              className="btn-primary"
              onClick={handleComplete}
              disabled={actionLoading}
            >
              Markera som hämtad
            </button>
          )}
          {order.status === 'completed' && (
            <button className="btn-primary" onClick={() => navigate('/')}>
              Beställ igen
            </button>
          )}
          {isTrackedOrder && (
            <button
              className="btn-secondary"
              onClick={() => refreshActiveOrder()}
              disabled={actionLoading}
            >
              Uppdatera
            </button>
          )}
        </div>
      </div>

      <div className="tracker-card">
        <h2 className="section-title">Notiser</h2>
        {notifications.length === 0 ? (
          <p style={{ color: 'var(--gray)' }}>Inga notiser ännu...</p>
        ) : (
          <ul className="notification-list">
            {notifications.map((n) => (
              <li key={n.id} className="notification-item">
                <p>{n.message}</p>
                <p className="time">
                  {new Date(n.createdAt).toLocaleTimeString('sv-SE')}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
