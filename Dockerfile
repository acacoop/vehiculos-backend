# Use Node.js 22 LTS version
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the TypeScript code
RUN npm run build

# Clean up dev dependencies for production
RUN npm ci --only=production && npm cache clean --force

# Expose the port the app runs on
EXPOSE 3000

# Create a non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodeuser -u 1001
USER nodeuser

# Start the application
CMD ["npm", "start"]
