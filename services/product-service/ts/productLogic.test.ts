import { groupProductsByMenu, parseProductId } from './productLogic';

describe('parseProductId', () => {
  it('accepts valid product IDs', () => {
    expect(parseProductId('1')).toBe(1);
    expect(parseProductId('42')).toBe(42);
  });

  it('rejects invalid product IDs', () => {
    expect(parseProductId('abc')).toBeNull();
    expect(parseProductId('-1')).toBeNull();
    expect(parseProductId('0')).toBeNull();
  });
});

describe('groupProductsByMenu', () => {
  it('groups products under their menus', () => {
    const menus = [
      { id: 1, name: 'Lunch', active: true },
      { id: 2, name: 'Dinner', active: true },
    ];

    const products = [
      {
        menu_id: 1,
        id: 10,
        name: 'Burger',
        description: 'Tasty',
        price: 89,
        category: 'burgers',
        available: true,
      },
      {
        menu_id: 1,
        id: 11,
        name: 'Fries',
        description: 'Crispy',
        price: 35,
        category: 'sides',
        available: true,
      },
      {
        menu_id: 2,
        id: 10,
        name: 'Burger',
        description: 'Tasty',
        price: 89,
        category: 'burgers',
        available: true,
      },
    ];

    const result = groupProductsByMenu(menus, products);

    expect(result).toHaveLength(2);
    expect(result[0].products).toHaveLength(2);
    expect(result[1].products).toHaveLength(1);
    expect(result[0].products[0].name).toBe('Burger');
  });

  it('returns empty product lists for menus without items', () => {
    const menus = [{ id: 3, name: 'Empty', active: true }];
    const result = groupProductsByMenu(menus, []);
    expect(result[0].products).toEqual([]);
  });
});
