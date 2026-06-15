import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrder } from '../api/client';
import { useActiveOrder } from '../context/ActiveOrderContext';
import { useCart } from '../context/CartContext';

export function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, total } = useCart();
  const { setActiveOrderId } = useActiveOrder();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Fyll i namn och e-post');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const order = await createOrder({
        customerName: name.trim(),
        customerEmail: email.trim(),
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
      });
      clearCart();
      setActiveOrderId(order.id);
      navigate(`/order/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte lägga order');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <h3>Varukorgen är tom</h3>
        <p>Lägg till något gott från menyn!</p>
        <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/')}>
          Till menyn
        </button>
      </div>
    );
  }

  return (
    <div className="cart-panel">
      <h1 className="page-title">Din beställning</h1>

      {items.map((item) => (
        <div key={item.product.id} className="cart-item">
          <div>
            <strong>{item.product.name}</strong>
            <p style={{ color: 'var(--gray)', fontSize: '0.9rem' }}>
              {item.product.price.toFixed(0)} kr/st
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="qty-control">
              <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>
                −
              </button>
              <span>{item.quantity}</span>
              <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>
                +
              </button>
            </div>
            <strong>{(item.product.price * item.quantity).toFixed(0)} kr</strong>
            <button
              className="btn-secondary btn-small"
              onClick={() => removeItem(item.product.id)}
            >
              Ta bort
            </button>
          </div>
        </div>
      ))}

      <div className="cart-total">
        <span>Totalt</span>
        <span>{total.toFixed(0)} kr</span>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Namn</label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ditt namn"
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">E-post</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="din@email.com"
          />
        </div>
        <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Lägger order...' : 'Beställ nu'}
        </button>
      </form>
    </div>
  );
}
