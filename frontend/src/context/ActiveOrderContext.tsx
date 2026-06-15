import {createContext,useCallback,useContext,useEffect,useRef,useState,ReactNode} from 'react';
import { getOrder } from '../api/client';
import type { Order, OrderStatus } from '../types';

const STORAGE_KEY = 'maxburger_active_order_id';
const POLL_INTERVAL_MS = 5000;

const ACTIVE_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
];

interface ActiveOrderContextType {
  activeOrder: Order | null;
  setActiveOrderId: (id: string) => void;
  clearActiveOrder: () => void;
  refreshActiveOrder: () => Promise<void>;
}

const ActiveOrderContext = createContext<ActiveOrderContextType | null>(null);

export function getOrderStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    pending: 'Väntar',
    confirmed: 'Bekräftad',
    preparing: 'Tillagas',
    ready: 'Klar för hämtning',
    completed: 'Hämtad',
    cancelled: 'Avbruten',
  };
  return labels[status];
}

export function isActiveOrderStatus(status: OrderStatus): boolean {
  return ACTIVE_STATUSES.includes(status);
}

export function ActiveOrderProvider({ children }: { children: ReactNode }) {
  const [orderId, setOrderId] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY)
  );
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const pollingRef = useRef(false);

  const clearActiveOrder = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setOrderId(null);
    setActiveOrder(null);
  }, []);

  const setActiveOrderId = useCallback((id: string) => {
    localStorage.setItem(STORAGE_KEY, id);
    setOrderId(id);
  }, []);

  const refreshActiveOrder = useCallback(async () => {
    if (!orderId || pollingRef.current) return;
    pollingRef.current = true;

    try {
      const order = await getOrder(orderId);
      if (!isActiveOrderStatus(order.status)) {
        clearActiveOrder();
        return;
      }
      setActiveOrder(order);
    } catch {
      clearActiveOrder();
    } finally {
      pollingRef.current = false;
    }
  }, [orderId, clearActiveOrder]);

  useEffect(() => {
    if (!orderId) {
      setActiveOrder(null);
      return;
    }

    refreshActiveOrder();

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshActiveOrder();
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [orderId, refreshActiveOrder]);

  return (
    <ActiveOrderContext.Provider
      value={{ activeOrder, setActiveOrderId, clearActiveOrder, refreshActiveOrder }}
    >
      {children}
    </ActiveOrderContext.Provider>
  );
}

export function useActiveOrder() {
  const ctx = useContext(ActiveOrderContext);
  if (!ctx) throw new Error('useActiveOrder must be used within ActiveOrderProvider');
  return ctx;
}
