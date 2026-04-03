FROM node:22-bookworm-slim AS base

WORKDIR /app

FROM base AS deps

COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV DATABASE_URL=sqlite:///./data/limen.db

COPY package.json package-lock.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next

RUN mkdir -p /app/data

EXPOSE 3000

CMD ["sh", "-c", "npm run db:push && npm run start -- --hostname 0.0.0.0 --port ${PORT:-3000}"]
