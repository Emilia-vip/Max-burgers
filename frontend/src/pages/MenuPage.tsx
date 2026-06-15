import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductsContext';

const CATEGORY_LABELS: Record<string, string> = {
  burgers: 'Burgare',
  sides: 'Tillbehör',
  drinks: 'Drycker',
};

export function MenuPage() {
  const { products, loading, error } = useProducts();
  const [category, setCategory] = useState('all');
  const { addItem } = useCart();

  const categories = ['all', ...new Set(products.map((p) => p.category))];
  const filtered =
    category === 'all' ? products : products.filter((p) => p.category === category);

  if (loading) return <div className="loading">Laddar meny...</div>;
  if (error) return <div className="error-banner">{error}</div>;

  return (
    <div>
      <h1 className="page-title">Vår Meny</h1>
      <p className="page-subtitle">Välj dina favoriter och lägg en beställning</p>

      <div className="category-tabs">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`category-tab ${category === cat ? 'active' : ''}`}
            onClick={() => setCategory(cat)}
          >
            {cat === 'all' ? 'Alla' : CATEGORY_LABELS[cat] || cat}
          </button>
        ))}
      </div>

      <div className="product-grid">
        {filtered.map((product) => (
          <div key={product.id} className="product-card">
            <span className="category">
              {CATEGORY_LABELS[product.category] || product.category}
            </span>
            <h3>{product.name}</h3>
            <p className="description">{product.description}</p>
            <p className="price">{product.price.toFixed(0)} kr</p>
            <div className="actions">
              <button className="btn-primary" onClick={() => addItem(product)}>
                Lägg till
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
