export interface ServiceConfig {
  name: string;
  url: string;
  pathPrefix: string;
}

export function getServiceRoutes(): ServiceConfig[] {
  return [
    {
      name: 'product-service',
      url: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3001',
      pathPrefix: '/api/products',
    },
    {
      name: 'product-service-menus',
      url: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3001',
      pathPrefix: '/api/menus',
    },
    {
      name: 'order-service',
      url: process.env.ORDER_SERVICE_URL || 'http://localhost:3002',
      pathPrefix: '/api/orders',
    },
    {
      name: 'kitchen-service',
      url: process.env.KITCHEN_SERVICE_URL || 'http://localhost:3003',
      pathPrefix: '/api/kitchen',
    },
    {
      name: 'notification-service',
      url: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004',
      pathPrefix: '/api/notifications',
    },
  ];
}

export function rewritePath(pathPrefix: string, targetPath: string): string {
  if (pathPrefix === '/api/products') {
    return targetPath.replace('/api/products', '/products');
  }
  if (pathPrefix === '/api/menus') {
    return targetPath.replace('/api/menus', '/menus');
  }
  if (pathPrefix === '/api/orders') {
    return targetPath.replace('/api/orders', '/orders');
  }
  if (pathPrefix === '/api/kitchen') {
    return targetPath.replace('/api/kitchen', '/tickets');
  }
  if (pathPrefix === '/api/notifications') {
    return targetPath.replace('/api/notifications', '/notifications');
  }
  return targetPath;
}
