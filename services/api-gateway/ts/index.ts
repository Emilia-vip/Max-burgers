import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { getServiceRoutes, rewritePath } from './proxy';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'api-gateway' });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'api-gateway' });
});

app.get('/', (_req, res) => {
  res.json({
    name: 'MaxBurger API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      products: 'GET /api/products',
      menus: 'GET /api/menus',
      orders: 'POST /api/orders, GET /api/orders/:id',
      kitchen: 'GET /api/kitchen, PATCH /api/kitchen/:id/status',
      notifications: 'GET /api/notifications/order/:orderId',
    },
  });
});

for (const service of getServiceRoutes()) {
  app.use(
    service.pathPrefix,
    createProxyMiddleware({
      target: service.url,
      changeOrigin: true,
      pathRewrite: (_path, req) => {
        const originalUrl = (req as { originalUrl?: string }).originalUrl || _path;
        return rewritePath(service.pathPrefix, originalUrl);
      },
    })
  );
}

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
