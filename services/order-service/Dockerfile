FROM node:20-alpine AS builder
WORKDIR /app
COPY shared ./shared
COPY services/order-service ./service
RUN cd shared && npm install && npm run build
WORKDIR /app/service
RUN npm pkg set dependencies.@maxburger/shared="file:../shared"
RUN npm install && npm run build

FROM node:20-alpine
RUN apk add --no-cache wget
WORKDIR /app/service
COPY --from=builder /app/shared /app/shared
COPY --from=builder /app/service/dist ./dist
COPY --from=builder /app/service/node_modules ./node_modules
COPY --from=builder /app/service/package.json ./
EXPOSE 3002
CMD ["node", "dist/index.js"]
