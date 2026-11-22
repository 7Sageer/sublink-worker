# The build output is a single platform-independent JS bundle, so build it on
# the runner's native platform: `npm install` under QEMU for arm64 sometimes
# hangs until the job times out.
FROM --platform=$BUILDPLATFORM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY src ./src
COPY public ./public

RUN npm run build:node

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8787

COPY --from=builder /app/dist ./dist
COPY public ./public

EXPOSE 8787

CMD ["node", "dist/node-server.cjs"]
