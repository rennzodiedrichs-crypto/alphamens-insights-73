-- Migration: Criação da View Inteligente de Horários Livres
-- Permite que o n8n consulte os próximos 15 dias de horários disponíveis.

CREATE OR REPLACE VIEW public.vw_horarios_livres AS
WITH recursive dias AS (
    -- Começa no dia atual (baseado no timezone configurado no banco)
    SELECT current_date AS data_ref
    UNION ALL
    -- Avança até 14 dias para frente
    SELECT data_ref + 1
    FROM dias
    WHERE data_ref < current_date + 14
),
slots_base AS (
    SELECT 
        p.id AS profissional_id,
        p.nome AS profissional_nome,
        d.data_ref,
        hf.hora_inicio,
        hf.hora_fim,
        -- Gera os slots de 30 minutos cravados do inicio ao fim do expediente
        generate_series(
            (d.data_ref + hf.hora_inicio)::timestamp,
            (d.data_ref + hf.hora_fim - interval '30 minutes')::timestamp,
            interval '30 minutes'
        ) AS slot_inicio
    FROM dias d
    -- Busca os dias da semana em que a barbearia abre
    JOIN public.horarios_funcionamento hf ON EXTRACT(ISODOW FROM d.data_ref) = hf.dia_semana
    -- Multiplica os dias/horários para todos os profissionais ativos
    CROSS JOIN public.profissionais p
    WHERE hf.aberto = true AND p.status = 'ativo'
),
slots_formatados AS (
    SELECT
        profissional_id,
        profissional_nome,
        data_ref,
        slot_inicio,
        slot_inicio + interval '30 minutes' AS slot_fim
    FROM slots_base
)
SELECT 
    sf.profissional_id,
    sf.profissional_nome,
    sf.data_ref AS data,
    sf.slot_inicio AS horario_inicio,
    sf.slot_fim AS horario_fim
FROM slots_formatados sf
-- LEFT JOIN para cruzar com a tabela de agendamentos
LEFT JOIN public.agendamentos a 
    ON a.profissional_id = sf.profissional_id
    AND a.data_hora_agendada = sf.slot_inicio
    AND (a.status IS NULL OR a.status != 'cancelado') 
-- LEFT JOIN para cruzar com a tabela de pausas (almoço, atestado, férias)
LEFT JOIN public.escala_ausencias ea 
    ON ea.profissional_id = sf.profissional_id
    AND sf.slot_inicio >= ea.inicio_ausencia 
    AND sf.slot_inicio < ea.fim_ausencia
-- Mantém apenas slots onde não existe agendamento ativo NEM ausência do barbeiro
WHERE a.id IS NULL 
  AND ea.id IS NULL
  -- Oculta horários do dia de hoje que já ficaram para trás no relógio
  AND sf.slot_inicio > current_timestamp;
