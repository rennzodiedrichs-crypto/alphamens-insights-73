-- Habilita extensão para geração de UUID se não existir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Criação das Tabelas

-- Clientes
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(20),
    identificador_usuario VARCHAR(255) UNIQUE,
    id_lead_chatwoot VARCHAR(255),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Endereços de Clientes
CREATE TABLE IF NOT EXISTS public.enderecos_clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
    cep VARCHAR(10),
    logradouro VARCHAR(255),
    numero VARCHAR(50),
    complemento VARCHAR(255),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    estado VARCHAR(2),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profissionais (Barbeiros)
CREATE TABLE IF NOT EXISTS public.profissionais (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    telefone VARCHAR(20),
    status VARCHAR(50) DEFAULT 'ativo',
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Serviços
CREATE TABLE IF NOT EXISTS public.servicos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    preco_base DECIMAL(10, 2) NOT NULL,
    duracao_estimada_minutos INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'ativo',
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agendamentos
CREATE TABLE IF NOT EXISTS public.agendamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
    profissional_id UUID REFERENCES public.profissionais(id) ON DELETE SET NULL,
    data_hora_agendada TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'pendente',
    id_conta_chatwoot VARCHAR(255),
    id_conversa_chatwoot VARCHAR(255),
    inbox_id_chatwoot VARCHAR(255),
    inicio_atendimento_em TIMESTAMP WITH TIME ZONE,
    inicio_fora_horario_comercial BOOLEAN DEFAULT FALSE,
    marcou_no_grupo VARCHAR(255),
    resumo_conversa TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agendamentos Serviços (Relacionamento NxN)
CREATE TABLE IF NOT EXISTS public.agendamentos_servicos (
    agendamento_id UUID REFERENCES public.agendamentos(id) ON DELETE CASCADE,
    servico_id UUID REFERENCES public.servicos(id) ON DELETE RESTRICT,
    preco_cobrado DECIMAL(10, 2) NOT NULL,
    PRIMARY KEY (agendamento_id, servico_id)
);

-- Pagamentos
CREATE TABLE IF NOT EXISTS public.pagamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agendamento_id UUID REFERENCES public.agendamentos(id) ON DELETE SET NULL,
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
    valor_total DECIMAL(10, 2) NOT NULL,
    metodo_pagamento VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pendente',
    data_pagamento TIMESTAMP WITH TIME ZONE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Histórico de Pagamentos
CREATE TABLE IF NOT EXISTS public.historico_pagamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pagamento_id UUID REFERENCES public.pagamentos(id) ON DELETE CASCADE,
    status_anterior VARCHAR(50),
    status_novo VARCHAR(50) NOT NULL,
    observacao TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Habilitar RLS (Row Level Security) em todas as tabelas
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enderecos_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos_servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_pagamentos ENABLE ROW LEVEL SECURITY;

-- 3. Criar Políticas para permitir acesso total a usuários autenticados
-- As automações (n8n usando chave service_role) ignoram RLS por padrão.

DO $$
DECLARE
    t_name text;
BEGIN
    FOR t_name IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('clientes', 'enderecos_clientes', 'profissionais', 'servicos', 'agendamentos', 'agendamentos_servicos', 'pagamentos', 'historico_pagamentos')
    LOOP
        EXECUTE format('
            CREATE POLICY "Permitir acesso total para usuarios autenticados" 
            ON public.%I 
            FOR ALL 
            TO authenticated 
            USING (true) 
            WITH CHECK (true);
        ', t_name);
    END LOOP;
END
$$;
