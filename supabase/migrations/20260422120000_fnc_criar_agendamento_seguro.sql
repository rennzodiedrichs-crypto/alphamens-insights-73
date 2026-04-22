-- =================================================================================
-- Função Atômica de Agendamento Seguro
-- Unifica a lógica de criação de agendamentos para n8n e Dashboard
-- Valida: conflitos de horário, ausências/folgas, dados obrigatórios
-- =================================================================================

CREATE OR REPLACE FUNCTION public.fnc_criar_agendamento_seguro(
    p_cliente_whatsapp VARCHAR DEFAULT NULL,
    p_cliente_id UUID DEFAULT NULL,
    p_profissional_id UUID DEFAULT NULL,
    p_profissional_nome VARCHAR DEFAULT NULL,
    p_servico_ids UUID[] DEFAULT NULL,
    p_servico_nome VARCHAR DEFAULT NULL,
    p_data_hora TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_chatwoot_info JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB AS $$
DECLARE
    v_cliente_id UUID := p_cliente_id;
    v_profissional_id UUID := p_profissional_id;
    v_final_servico_ids UUID[] := p_servico_ids;
    v_total_duracao INTEGER := 0;
    v_total_preco DECIMAL(10,2) := 0;
    v_fim_agendamento TIMESTAMP WITH TIME ZONE;
    v_conflito_id UUID;
    v_agendamento_id UUID;
    v_serv_id UUID;
BEGIN
    -- 1. Resolver Cliente (por ID direto ou por WhatsApp)
    IF v_cliente_id IS NULL AND p_cliente_whatsapp IS NOT NULL THEN
        SELECT id INTO v_cliente_id FROM public.clientes WHERE whatsapp = p_cliente_whatsapp LIMIT 1;
    END IF;
    IF v_cliente_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cliente não encontrado.');
    END IF;

    -- 2. Resolver Profissional (por ID direto ou por nome aproximado)
    IF v_profissional_id IS NULL THEN
        SELECT id INTO v_profissional_id FROM public.profissionais
        WHERE nome ILIKE '%' || p_profissional_nome || '%' AND status = 'ativo' LIMIT 1;
    END IF;
    IF v_profissional_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Profissional não encontrado.');
    END IF;

    -- 3. Resolver Serviços (por array de IDs ou por nome aproximado)
    IF v_final_servico_ids IS NULL AND p_servico_nome IS NOT NULL THEN
        SELECT ARRAY[id] INTO v_final_servico_ids FROM public.servicos
        WHERE nome ILIKE '%' || p_servico_nome || '%' AND status = 'ativo' LIMIT 1;
    END IF;
    IF v_final_servico_ids IS NULL OR array_length(v_final_servico_ids, 1) = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Nenhum serviço selecionado.');
    END IF;

    -- 4. Calcular Totais (mínimo 30 minutos se duração ausente)
    SELECT
        GREATEST(COALESCE(SUM(duracao_estimada_minutos), 30), 30),
        COALESCE(SUM(preco_base), 0)
    INTO v_total_duracao, v_total_preco
    FROM public.servicos WHERE id = ANY(v_final_servico_ids);

    v_fim_agendamento := p_data_hora + (v_total_duracao * interval '1 minute');

    -- 5. Verificar Escala/Ausências (tstzrange para timestamptz)
    SELECT id INTO v_conflito_id FROM public.escala_ausencias
    WHERE profissional_id = v_profissional_id
    AND tstzrange(p_data_hora, v_fim_agendamento, '[)') &&
        tstzrange(inicio_ausencia, fim_ausencia, '[)')
    LIMIT 1;
    IF v_conflito_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Profissional indisponível neste horário (folga/ausência).');
    END IF;

    -- 6. Verificar Conflitos com agendamentos existentes
    SELECT a.id INTO v_conflito_id
    FROM public.agendamentos a
    LEFT JOIN (
        SELECT
            agendamento_id,
            GREATEST(COALESCE(SUM(s.duracao_estimada_minutos), 30), 30) AS duracao
        FROM public.agendamentos_servicos as1
        JOIN public.servicos s ON as1.servico_id = s.id
        GROUP BY agendamento_id
    ) as_dur ON a.id = as_dur.agendamento_id
    WHERE a.profissional_id = v_profissional_id
    AND a.status NOT IN ('cancelado', 'concluido')
    AND tstzrange(p_data_hora, v_fim_agendamento, '[)') &&
        tstzrange(
            a.data_hora_agendada,
            a.data_hora_agendada + (COALESCE(as_dur.duracao, 30) * interval '1 minute'),
            '[)'
        )
    LIMIT 1;
    IF v_conflito_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Conflito de horário: o profissional já tem um agendamento neste período.');
    END IF;

    -- 7. Criar Agendamento
    INSERT INTO public.agendamentos (cliente_id, profissional_id, data_hora_agendada, status)
    VALUES (v_cliente_id, v_profissional_id, p_data_hora, 'pendente')
    RETURNING id INTO v_agendamento_id;

    -- 8. Vincular Serviços
    FOREACH v_serv_id IN ARRAY v_final_servico_ids
    LOOP
        INSERT INTO public.agendamentos_servicos (agendamento_id, servico_id, preco_cobrado)
        SELECT v_agendamento_id, id, preco_base FROM public.servicos WHERE id = v_serv_id;
    END LOOP;

    -- 9. Gerar Pagamento pendente
    INSERT INTO public.pagamentos (agendamento_id, cliente_id, valor_total, status)
    VALUES (v_agendamento_id, v_cliente_id, v_total_preco, 'pendente');

    RETURN jsonb_build_object('success', true, 'agendamento_id', v_agendamento_id);
END;
$$ LANGUAGE plpgsql;

-- Permissões para frontend (anon) e backend (authenticated)
GRANT EXECUTE ON FUNCTION public.fnc_criar_agendamento_seguro TO anon, authenticated;
