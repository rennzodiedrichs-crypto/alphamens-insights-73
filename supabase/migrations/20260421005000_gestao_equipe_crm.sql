-- =================================================================================
-- GESTÃO DE EQUIPE (Simples e Direto)
-- =================================================================================

-- 1. Tabela de Escala/Ausências
-- Usada para bloquear horários da agenda (folgas, horário de almoço, atestados)
CREATE TABLE IF NOT EXISTS public.escala_ausencias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profissional_id UUID NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
    inicio_ausencia TIMESTAMP WITH TIME ZONE NOT NULL,
    fim_ausencia TIMESTAMP WITH TIME ZONE NOT NULL,
    motivo VARCHAR(255) NOT NULL, -- ex: 'almoço', 'folga', 'médico'
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ativar RLS (Row Level Security) para a tabela de escala
ALTER TABLE public.escala_ausencias ENABLE ROW LEVEL SECURITY;

-- Política de RLS: Apenas usuários autenticados podem ler/inserir/editar a escala
CREATE POLICY "Permitir acesso total para usuarios autenticados" 
ON public.escala_ausencias 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);


-- 2. View de Performance dos Barbeiros
-- Dashboard automático: Conta quantos clientes o barbeiro atendeu no mês e quanto faturou
CREATE OR REPLACE VIEW public.vw_performance_barbeiros AS
SELECT 
    p.id AS profissional_id,
    p.nome AS nome_barbeiro,
    DATE_TRUNC('month', a.data_hora_agendada) AS mes,
    COUNT(DISTINCT a.id) AS qtd_clientes_atendidos,
    COALESCE(SUM(pag.valor_total), 0) AS faturamento_bruto
FROM 
    public.profissionais p
LEFT JOIN 
    public.agendamentos a ON p.id = a.profissional_id
LEFT JOIN 
    public.pagamentos pag ON a.id = pag.agendamento_id AND pag.status = 'pago'
WHERE 
    a.status = 'concluido'
    AND a.data_hora_agendada IS NOT NULL
GROUP BY 
    p.id, p.nome, DATE_TRUNC('month', a.data_hora_agendada);
