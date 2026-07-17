FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=true
# Set dummy values for required env vars during build only
ENV ADMIN_SECRET=dummy-build-secret
ENV OPENAI_API_KEY=dummy-build-key
ENV MT5_BRIDGE_BASE_URL=http://localhost:8000
ENV CARVIPIX_JWT_SECRET=dummy-jwt-secret
ENV COOKIE_SIGNING_SECRET=dummy-cookie-secret
ENV DATABASE_URL=postgresql://dummy:dummy@localhost/dummy
ENV PAYMENT_GATEWAY_PROVIDER=stripe
ENV CARVIPIX_DATA_CLASSIFICATION=SANDBOX
ENV RESEND_API_KEY=re_dummy_build_key
ENV TELEGRAM_BOT_TOKEN=dummy-token
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
