import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ActiveOrderProvider } from './context/ActiveOrderContext';
import { CartProvider } from './context/CartContext';
import { ProductsProvider } from './context/ProductsContext';
import { Header } from './components/Header';
import { MenuPage } from './pages/MenuPage';
import { CartPage } from './pages/CartPage';
import { OrderPage } from './pages/OrderPage';
import { KitchenPage } from './pages/KitchenPage';

export function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <ProductsProvider>
        <ActiveOrderProvider>
          <div className="app">
            <Header />
            <main className="main">
              <Routes>
                <Route path="/" element={<MenuPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/order/:id" element={<OrderPage />} />
                <Route path="/kitchen" element={<KitchenPage />} />
              </Routes>
            </main>
          </div>
        </ActiveOrderProvider>
        </ProductsProvider>
      </CartProvider>
    </BrowserRouter>
  );
}
