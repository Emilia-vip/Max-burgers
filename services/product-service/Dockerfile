FROM node:20-alpine AS builder
WORKDIR /app
COPY services/product-service ./service
WORKDIR /app/service
RUN npm install && npm run build

FROM node:20-alpine
RUN apk add --no-cache wget
WORKDIR /app/service
COPY --from=builder /app/service/dist ./dist
COPY --from=builder /app/service/node_modules ./node_modules
COPY --from=builder /app/service/package.json ./
EXPOSE 3001
CMD ["node", "dist/index.js"]
