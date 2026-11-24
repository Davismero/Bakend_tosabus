# T-01: imagen reproducible (RNF-13). Node 22 en todas las etapas.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
RUN npm prune --omit=dev

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S tosabus && adduser -S -G tosabus tosabus
COPY --from=builder --chown=tosabus:tosabus /app/dist ./dist
COPY --from=builder --chown=tosabus:tosabus /app/node_modules ./node_modules
COPY --from=builder --chown=tosabus:tosabus /app/package.json ./package.json
USER tosabus
EXPOSE 3000
CMD ["node", "dist/main.js"]
