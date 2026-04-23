# Configuração de Variáveis de Ambiente - AlphaMens Insights

Este documento contém as variáveis de ambiente necessárias para a integração com o banco de dados (Supabase) e o funcionamento do sistema em ambiente Docker/EasyPanel.

## Variáveis do Supabase

Estas variáveis são essenciais para que o frontend e o backend se comuniquem com o banco de dados.

| Variável | Descrição | Exemplo/Onde encontrar |
|----------|-----------|------------------------|
| `VITE_SUPABASE_URL` | URL da API do projeto no Supabase | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave pública (Anon Key) para o frontend | `eyJhbGciOiJIUzI1Ni...` |
| `VITE_SUPABASE_PROJECT_ID` | ID do projeto no Supabase | `smfqoewtgvhnaxsfzykn` |
| `SUPABASE_URL` | URL da API (usada no servidor) | Igual ao `VITE_SUPABASE_URL` |
| `SUPABASE_PUBLISHABLE_KEY` | Chave pública (usada no servidor) | Igual ao `VITE_SUPABASE_PUBLISHABLE_KEY` |

## Como Configurar no EasyPanel

1. No seu dashboard do **EasyPanel**, selecione o serviço da aplicação.
2. Vá na aba **Environment** (ou Environment Variables).
3. Adicione as variáveis listadas acima com seus respectivos valores.
4. Clique em **Save** e reinicie o deploy se necessário.

> [!IMPORTANT]
> Certifique-se de que as chaves não contenham espaços extras no início ou no fim.

## Configuração Local (Docker Compose)

Se for rodar localmente com Docker Compose, crie um arquivo `.env` na raiz do projeto com estas variáveis antes de rodar `docker-compose up`.

```env
VITE_SUPABASE_URL=seu_url
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave
VITE_SUPABASE_PROJECT_ID=seu_id
SUPABASE_URL=seu_url
SUPABASE_PUBLISHABLE_KEY=sua_chave
```
