-- 1. Habilitar RLS na tabela leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas existentes (para evitar conflitos)
DROP POLICY IF EXISTS "Permitir acesso total para usuários autenticados" ON leads;
DROP POLICY IF EXISTS "Permitir inserção anônima" ON leads;

-- 3. Criar política para usuários autenticados (Dashboard)
-- Isso permite que membros da equipe logados vejam e gerenciem os leads.
CREATE POLICY "Permitir acesso total para usuários autenticados"
ON leads
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Criar política para o n8n e outras automações
-- O papel 'service_role' já ignora o RLS por padrão no Supabase, 
-- então não é necessário criar uma política específica para ele.
-- No entanto, se o n8n usar o anon_key por algum motivo, você precisaria de uma política extra.

-- 5. Política para visualização (caso deseje que anônimos NÃO vejam nada)
-- Por padrão, uma vez ativado o RLS, se não houver política para 'anon', ele não verá nada.

-- NOTA: Se você tiver outras tabelas sensíveis, repita o processo para cada uma.
