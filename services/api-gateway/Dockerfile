FROM node:20-alpine AS builder
WORKDIR /app/service
COPY services/api-gateway/package.json services/api-gateway/tsconfig.json ./
COPY services/api-gateway/ts ./ts
RUN npm install && npm run build

FROM node:20-alpine
RUN apk add --no-cache wget
WORKDIR /app/service
COPY --from=builder /app/service/dist ./dist
COPY --from=builder /app/service/node_modules ./node_modules
COPY --from=builder /app/service/package.json ./
EXPOSE 3000
CMD ["node", "dist/index.js"]
