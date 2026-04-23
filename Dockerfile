# Build stage
FROM oven/bun:latest AS builder

WORKDIR /app

# Variáveis de ambiente necessárias para o build do Vite (Injetadas no frontend)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_PROJECT_ID

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_SUPABASE_PROJECT_ID=$VITE_SUPABASE_PROJECT_ID

# Copy package files
COPY package.json bun.lockb* package-lock.json* ./

# Install dependencies
RUN bun install

# Copy source code
COPY . .

# Build the application
# Forçando o preset node-server para garantir compatibilidade com Docker/EasyPanel
ENV NITRO_PRESET=node-server
RUN bun run build

# Debug: Listar arquivos para garantir que .output foi criado
RUN ls -la /app && (ls -d /app/.output || echo "Pasta .output não encontrada!")

# Final stage
FROM oven/bun:latest

WORKDIR /app

# Copy build output from builder
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./package.json

# Expose the port 3010
EXPOSE 3010

# Set environment to production and define the port
ENV NODE_ENV=production
ENV PORT=3010

# Variáveis para tempo de execução (Backend/SSR)
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_SUPABASE_PROJECT_ID=$VITE_SUPABASE_PROJECT_ID

# Command to run the application
CMD ["bun", ".output/server/index.mjs"]
