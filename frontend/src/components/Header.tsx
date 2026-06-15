import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import {
  getOrderStatusLabel,
  useActiveOrder,
} from '../context/ActiveOrderContext';

export function Header() {
  const { itemCount } = useCart();
  const { activeOrder } = useActiveOrder();
  const location = useLocation();

  const isOnOrderPage =
    activeOrder && location.pathname === `/order/${activeOrder.id}`;

  return (
    <header className="header">
      <Link to="/" className="brand">
        MAXBURGER
      </Link>
      <nav className="nav">
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
          Meny
        </Link>

        {activeOrder && (
          <Link
            to={`/order/${activeOrder.id}`}
            className={`active-order-link ${isOnOrderPage ? 'active' : ''} status-${activeOrder.status}`}
          >
            <span className="active-order-label">Din beställning</span>
            <span className="active-order-status">
              {getOrderStatusLabel(activeOrder.status)}
            </span>
          </Link>
        )}

        <Link to="/cart" className={location.pathname === '/cart' ? 'active' : ''}>
          <span className="cart-badge">
            Varukorg {itemCount > 0 && `(${itemCount})`}
          </span>
        </Link>
        <Link to="/kitchen" className={location.pathname === '/kitchen' ? 'active' : ''}>
          Kök
        </Link>
      </nav>
    </header>
  );
}
