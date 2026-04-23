# Build stage
FROM oven/bun:latest AS builder

WORKDIR /app

# Variáveis de ambiente para o build (Injetadas no frontend)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_PROJECT_ID

ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_PUBLISHABLE_KEY=${VITE_SUPABASE_PUBLISHABLE_KEY}
ENV VITE_SUPABASE_PROJECT_ID=${VITE_SUPABASE_PROJECT_ID}
ENV NITRO_PRESET=node-server

# Copy package files
COPY package.json bun.lockb* package-lock.json* ./

# Install dependencies
RUN bun install

# Copy source code
COPY . .

# Build the application
# Removemos temporariamente o wrangler.jsonc para forçar o build Node/Bun em vez de Cloudflare
RUN if [ -f wrangler.jsonc ]; then mv wrangler.jsonc wrangler.jsonc.bak; fi && \
    bun run build && \
    if [ -f wrangler.jsonc.bak ]; then mv wrangler.jsonc.bak wrangler.jsonc; fi

# Final stage
FROM oven/bun:latest

WORKDIR /app

# Re-declarar ARGs para que estejam disponíveis no estágio final
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_PROJECT_ID

ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_PUBLISHABLE_KEY=${VITE_SUPABASE_PUBLISHABLE_KEY}
ENV VITE_SUPABASE_PROJECT_ID=${VITE_SUPABASE_PROJECT_ID}
ENV PORT=3010
ENV NODE_ENV=production

# Copy build output from builder
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./package.json

# Expose the port 3010
EXPOSE 3010

# Command to run the application
CMD ["bun", ".output/server/index.mjs"]
