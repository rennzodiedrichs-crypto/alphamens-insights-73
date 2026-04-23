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
# Forcing node-server preset to ensure it works with Bun/Node
ENV NITRO_PRESET=node-server
# Build the app and list files for debugging if it fails
RUN bun run build && ls -la /app

# Final stage
FROM oven/bun:latest

WORKDIR /app

# Copy build output from builder
# We try to copy .output which is the standard for node-server preset
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./package.json

# Expose the port 3010 as requested
EXPOSE 3010

# Set environment to production and define the port
ENV NODE_ENV=production
ENV PORT=3010

# Command to run the application
# Nitro output usually has a server entry point
CMD ["bun", ".output/server/index.mjs"]
