export function parseProductId(id: string): number | null {
  const parsed = parseInt(id, 10);
  if (isNaN(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

export function groupProductsByMenu(
  menuRows: { id: number; name: string; active: boolean }[],
  productRows: {
    menu_id: number;
    id: number;
    name: string;
    description: string;
    price: number;
    category: string;
    available: boolean;
  }[]
) {
  const productsByMenu = new Map<number, typeof productRows>();

  for (const row of productRows) {
    const list = productsByMenu.get(row.menu_id) || [];
    list.push(row);
    productsByMenu.set(row.menu_id, list);
  }

  return menuRows.map((menu) => ({
    ...menu,
    products: (productsByMenu.get(menu.id) || []).map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      price: row.price,
      category: row.category,
      available: row.available,
    })),
  }));
}
