export interface ServiceConfig {
  url: string;
  pathPrefix: string;
}

export function getServiceRoutes(): ServiceConfig[] {
  const productServiceUrl =
    process.env.PRODUCT_SERVICE_URL || 'http://localhost:3001';

  return [
    {
      url: productServiceUrl,
      pathPrefix: '/api/products',
    },
    {
      url: productServiceUrl,
      pathPrefix: '/api/menus',
    },
    {
      url: process.env.ORDER_SERVICE_URL || 'http://localhost:3002',
      pathPrefix: '/api/orders',
    },
    {
      url: process.env.KITCHEN_SERVICE_URL || 'http://localhost:3003',
      pathPrefix: '/api/kitchen',
    },
    {
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
