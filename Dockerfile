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
# O log confirmou que o build gera a pasta 'dist'
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

# Copiar o resultado do build da pasta 'dist'
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/package.json /app/package.json

# Expose the port 3010
EXPOSE 3010

# Command to run the application
# O ponto de entrada identificado no log é dist/server/server.js
CMD ["bun", "dist/server/server.js"]
