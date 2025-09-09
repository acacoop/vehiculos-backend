########## Stage 1: Builder ##########
FROM node:22-alpine AS builder
WORKDIR /app

# Install deps separately for better layer caching
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build (produces dist/)
RUN npm run build

########## Stage 2: Runtime ##########
FROM node:22-alpine AS runtime
WORKDIR /app

# Copy only needed files from builder (prune dev deps by reinstalling prod only)
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled output and any runtime assets (openAPI, etc.)
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/openAPI.yaml ./

# Environment (to allow NODE_ENV override at runtime if desired)
ENV NODE_ENV=production

EXPOSE 3000

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodeuser -u 1001
USER nodeuser

CMD ["node", "dist/index.js"]
