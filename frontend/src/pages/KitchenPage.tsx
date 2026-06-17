import { useCallback, useEffect, useState } from 'react';
import { getKitchenTickets, updateKitchenStatus } from '../api/client';
import type { KitchenTicket } from '../types';

export function KitchenPage() {
  const [tickets, setTickets] = useState<KitchenTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState<number | null>(null);

  const loadTickets = useCallback(async () => {
    try {
      const data = await getKitchenTickets(true);
      setTickets(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte hämta biljetter');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTickets();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadTickets();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [loadTickets]);

  const handleStatus = async (ticketId: number, status: 'preparing' | 'ready') => {
    setActionId(ticketId);
    try {
      await updateKitchenStatus(ticketId, status);
      await loadTickets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte uppdatera status');
    } finally {
      setActionId(null);
    }
  };

  if (loading) return <div className="loading">Laddar kök...</div>;

  return (
    <div>
      <h1 className="page-title">Kökspanel</h1>
      <p className="page-subtitle">Hantera inkommande beställningar</p>

      {error && <div className="error-banner">{error}</div>}

      {tickets.length === 0 ? (
        <div className="empty-state">
          <h3>Inga aktiva beställningar</h3>
          <p>Väntar på nya ordrar...</p>
        </div>
      ) : (
        <div className="kitchen-grid">
          {tickets.map((ticket) => (
            <div key={ticket.id} className={`kitchen-card ${ticket.status}`}>
              <span className="ticket-id">Biljett #{ticket.id}</span>
              <h3>Order {ticket.orderId.slice(0, 8)}</h3>
              <p className="customer">{ticket.customerName}</p>
              <span className={`status-badge status-${ticket.status}`}>
                {ticket.status}
              </span>

              <div className="kitchen-actions">
                {ticket.status === 'queued' && (
                  <button
                    className="btn-accent"
                    onClick={() => handleStatus(ticket.id, 'preparing')}
                    disabled={actionId === ticket.id}
                  >
                    Börja tillaga
                  </button>
                )}
                {ticket.status === 'preparing' && (
                  <button
                    className="btn-primary"
                    onClick={() => handleStatus(ticket.id, 'ready')}
                    disabled={actionId === ticket.id}
                  >
                    Markera klar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
