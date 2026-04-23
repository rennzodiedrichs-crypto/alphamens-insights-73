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
# Forçamos o preset para node-server
ENV NITRO_PRESET=node-server

# Copy package files
COPY package.json bun.lockb* package-lock.json* ./

# Install dependencies
RUN bun install

# Copy source code
COPY . .

# Forçamos a remoção de arquivos do Cloudflare para evitar builds incompatíveis
RUN rm -f wrangler.jsonc wrangler.json && bun run build

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

# Copiamos o estado do builder
COPY --from=builder /app /app

# Organização forçada: se o build não criou .output, nós criamos a estrutura correta
RUN if [ -d ".output" ]; then \
        echo "Sucesso: .output gerado pelo build."; \
    else \
        echo "Aviso: .output não gerado. Organizando pasta dist..."; \
        mkdir -p .output && \
        mv dist/client .output/public && \
        mv dist/server .output/server && \
        if [ -f .output/server/index.js ]; then cp .output/server/index.js .output/server/index.mjs; fi \
    fi

# Instalar dependências de produção
RUN bun install --production

# Expose the port 3010
EXPOSE 3010

# Ponto de entrada (o arquivo index.mjs agora existirá de qualquer forma)
CMD ["bun", ".output/server/index.mjs"]
