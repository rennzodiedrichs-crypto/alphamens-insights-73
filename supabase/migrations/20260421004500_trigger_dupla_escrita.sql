-- 1. Criação da Função (Gatilho)
CREATE OR REPLACE FUNCTION public.sync_crm_alpha_to_normalized()
RETURNS TRIGGER AS $$
DECLARE
    v_cliente_id UUID;
    v_profissional_id UUID;
    v_servico_id UUID;
    v_agendamento_id UUID;
    v_valor DECIMAL(10, 2);
BEGIN
    -- A. Lidar com o Cliente (Buscar existente ou Criar novo)
    IF NEW.identificador_usuario IS NOT NULL THEN
        SELECT id INTO v_cliente_id FROM public.clientes WHERE identificador_usuario = NEW.identificador_usuario LIMIT 1;
        
        IF v_cliente_id IS NULL THEN
            INSERT INTO public.clientes (nome, whatsapp, identificador_usuario, id_lead_chatwoot)
            VALUES (COALESCE(NEW.nome, 'Cliente Sem Nome'), NEW.whatsapp, NEW.identificador_usuario, NEW.id_lead_chatwoot)
            RETURNING id INTO v_cliente_id;
        END IF;
    END IF;

    -- B. Lidar com o Profissional/Barbeiro
    IF NEW.barbeiro IS NOT NULL THEN
        SELECT id INTO v_profissional_id FROM public.profissionais WHERE nome = NEW.barbeiro LIMIT 1;
        
        IF v_profissional_id IS NULL THEN
            INSERT INTO public.profissionais (nome)
            VALUES (NEW.barbeiro)
            RETURNING id INTO v_profissional_id;
        END IF;
    END IF;

    -- C. Criar o Agendamento
    INSERT INTO public.agendamentos (
        cliente_id,
        profissional_id,
        data_hora_agendada,
        status,
        id_conta_chatwoot,
        id_conversa_chatwoot,
        inbox_id_chatwoot,
        inicio_atendimento_em,
        inicio_fora_horario_comercial,
        marcou_no_grupo,
        resumo_conversa
    ) VALUES (
        v_cliente_id,
        v_profissional_id,
        COALESCE(
            NULLIF(NEW.data_hora_agendada, '')::timestamp with time zone, 
            NOW()
        ),
        COALESCE(NEW.status, 'concluido'),
        NEW.id_conta_chatwoot,
        NEW.id_conversa_chatwoot,
        NEW.inbox_id_chatwoot,
        NULLIF(NEW.inicio_atendimento_em, '')::timestamp with time zone,
        NEW.inicio_fora_horario_comercial,
        NEW.marcou_no_grupo,
        NEW.resumo_conversa
    ) RETURNING id INTO v_agendamento_id;

    -- D. Lidar com o Serviço e o Vínculo NxN
    IF NEW.servicos IS NOT NULL THEN
        SELECT id INTO v_servico_id FROM public.servicos WHERE nome = NEW.servicos LIMIT 1;
        v_valor := COALESCE(NEW.valor_servico, 0);

        IF v_servico_id IS NULL THEN
            INSERT INTO public.servicos (nome, preco_base, duracao_estimada_minutos)
            VALUES (NEW.servicos, v_valor, 30)
            RETURNING id INTO v_servico_id;
        END IF;

        -- Associar Serviço ao Agendamento
        INSERT INTO public.agendamentos_servicos (agendamento_id, servico_id, preco_cobrado)
        VALUES (v_agendamento_id, v_servico_id, v_valor);
    END IF;

    -- E. Lidar com Pagamento Financeiro
    v_valor := COALESCE(NEW.valor_servico, 0);
    INSERT INTO public.pagamentos (
        agendamento_id,
        cliente_id,
        valor_total,
        status
    ) VALUES (
        v_agendamento_id,
        v_cliente_id,
        v_valor,
        'pago'
    );

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Em caso de qualquer erro (ex: formato de data inválido), o erro é registrado no log,
        -- mas a inserção original no CRM_ALPHA não é bloqueada. Isso garante que seu n8n nunca falhe.
        RAISE WARNING 'Erro ao sincronizar CRM_ALPHA com tabelas normalizadas: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Criação do Trigger associado à Tabela CRM_ALPHA
DROP TRIGGER IF EXISTS trg_sync_crm_alpha ON public."CRM_ALPHA";

CREATE TRIGGER trg_sync_crm_alpha
AFTER INSERT ON public."CRM_ALPHA"
FOR EACH ROW
EXECUTE FUNCTION public.sync_crm_alpha_to_normalized();
