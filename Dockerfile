# Build stage
FROM oven/bun:latest AS builder

WORKDIR /app

# Variáveis de ambiente para o build (Injetadas no frontend pelo Vite)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_PROJECT_ID

ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_PUBLISHABLE_KEY=${VITE_SUPABASE_PUBLISHABLE_KEY}
ENV VITE_SUPABASE_PROJECT_ID=${VITE_SUPABASE_PROJECT_ID}

# Copy package files
COPY package.json bun.lockb* package-lock.json* ./

# Install dependencies
RUN bun install

# Copy source code
COPY . .

# Build the application
# Com o preset node-server no vite.config.ts, isso gerará a pasta .output
RUN bun run build

# Final stage
FROM oven/bun:latest

WORKDIR /app

# Re-declarar ARGs para o estágio final (Runtime)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_PROJECT_ID

ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_PUBLISHABLE_KEY=${VITE_SUPABASE_PUBLISHABLE_KEY}
ENV VITE_SUPABASE_PROJECT_ID=${VITE_SUPABASE_PROJECT_ID}
ENV PORT=3010
ENV NODE_ENV=production

# Copiar o resultado oficial do motor Nitro (.output)
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./package.json

# Instalar dependências de produção
RUN bun install --production

# Expose the port 3010
EXPOSE 3010

# Ponto de entrada padrão para o preset node-server
CMD ["bun", ".output/server/index.mjs"]
