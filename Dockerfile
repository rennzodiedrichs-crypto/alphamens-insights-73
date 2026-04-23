# Build stage
FROM oven/bun:latest AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lockb* package-lock.json* ./

# Install dependencies
RUN bun install

# Copy source code
COPY . .

# Build the application
# We use --mode production to ensure production optimizations
RUN bun run build

# Final stage
FROM oven/bun:latest

WORKDIR /app

# Copy build output from builder
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./package.json

# Expose the port (TanStack Start defaults to 3000 in production usually, but we can configure it)
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Command to run the application
# Nitro output usually has a server entry point
CMD ["bun", ".output/server/index.mjs"]
