import { createClient } from '@supabase/supabase-js';

// NOTA: Para rodar este script, use: 
// npx tsx scratch/backfill.ts
// Certifique-se de configurar as variáveis abaixo com suas credenciais ou usar process.env

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://smfqoewtgvhnaxsfzykn.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'COLOQUE_SUA_SERVICE_ROLE_KEY_AQUI'; // IMPORTANTE: Usar Service Role Key para ignorar RLS!

const supabase = createClient(supabaseUrl, supabaseKey);

async function runBackfill() {
    console.log('Iniciando migração de dados...');

    // 1. Buscar todos os dados antigos
    const { data: antigos, error: fetchError } = await supabase
        .from('CRM_ALPHA')
        .select('*');

    if (fetchError) {
        console.error('Erro ao buscar dados antigos:', fetchError);
        return;
    }

    if (!antigos || antigos.length === 0) {
        console.log('Nenhum dado encontrado na tabela CRM_ALPHA.');
        return;
    }

    console.log(`Encontrados ${antigos.length} registros para migrar.`);

    // Estruturas auxiliares para evitar duplicatas
    const clientesMap = new Map(); // identificador_usuario -> id
    const profissionaisMap = new Map(); // nome do barbeiro -> id

    for (const record of antigos) {
        try {
            // --- 2. Migrar Cliente ---
            let clienteId = clientesMap.get(record.identificador_usuario);
            if (!clienteId) {
                // Tenta inserir ou recuperar o cliente
                const { data: cliente, error: cliError } = await supabase
                    .from('clientes')
                    .insert({
                        nome: record.nome || 'Cliente Sem Nome',
                        whatsapp: record.whatsapp,
                        identificador_usuario: record.identificador_usuario,
                        id_lead_chatwoot: record.id_lead_chatwoot,
                    })
                    .select('id')
                    .single();

                if (cliError && cliError.code === '23505') {
                    // Já existe, então busca
                    const { data: cliExistente } = await supabase
                        .from('clientes')
                        .select('id')
                        .eq('identificador_usuario', record.identificador_usuario)
                        .single();
                    clienteId = cliExistente?.id;
                } else if (cliente) {
                    clienteId = cliente.id;
                }
                if (clienteId) clientesMap.set(record.identificador_usuario, clienteId);
            }

            // --- 3. Migrar Profissional ---
            const nomeBarbeiro = record.barbeiro || 'Profissional Padrão';
            let profissionalId = profissionaisMap.get(nomeBarbeiro);
            if (!profissionalId) {
                const { data: prof, error: profError } = await supabase
                    .from('profissionais')
                    .insert({ nome: nomeBarbeiro })
                    .select('id')
                    .single();
                
                if (profError && profError.code === '23505') {
                    const { data: profExistente } = await supabase
                        .from('profissionais')
                        .select('id')
                        .eq('nome', nomeBarbeiro)
                        .single();
                    profissionalId = profExistente?.id;
                } else if (prof) {
                    profissionalId = prof.id;
                }
                if (profissionalId) profissionaisMap.set(nomeBarbeiro, profissionalId);
            }

            // --- 4. Criar Serviço Temporário (se necessário) ---
            // Como não temos serviços estruturados, criamos um serviço genérico ou baseados no nome
            const nomeServico = record.servicos || 'Serviço Padrão';
            let servicoId;
            const { data: serv, error: servError } = await supabase
                .from('servicos')
                .insert({ 
                    nome: nomeServico, 
                    preco_base: record.valor_servico || 0,
                    duracao_estimada_minutos: 30 // Padrão
                })
                .select('id')
                .single();
            
            servicoId = serv?.id;

            // --- 5. Criar Agendamento ---
            const { data: agendamento, error: agError } = await supabase
                .from('agendamentos')
                .insert({
                    cliente_id: clienteId,
                    profissional_id: profissionalId,
                    data_hora_agendada: record.data_hora_agendada || new Date().toISOString(),
                    status: record.status || 'concluido',
                    id_conta_chatwoot: record.id_conta_chatwoot,
                    id_conversa_chatwoot: record.id_conversa_chatwoot,
                    inbox_id_chatwoot: record.inbox_id_chatwoot,
                    inicio_atendimento_em: record.inicio_atendimento_em,
                    inicio_fora_horario_comercial: record.inicio_fora_horario_comercial,
                    marcou_no_grupo: record.marcou_no_grupo,
                    resumo_conversa: record.resumo_conversa,
                })
                .select('id')
                .single();

            // --- 6. Vincular Agendamento e Serviço ---
            if (agendamento && servicoId) {
                await supabase
                    .from('agendamentos_servicos')
                    .insert({
                        agendamento_id: agendamento.id,
                        servico_id: servicoId,
                        preco_cobrado: record.valor_servico || 0
                    });
            }

            // --- 7. Criar Pagamento ---
            if (agendamento) {
                await supabase
                    .from('pagamentos')
                    .insert({
                        agendamento_id: agendamento.id,
                        cliente_id: clienteId,
                        valor_total: record.valor_servico || 0,
                        metodo_pagamento: 'nao_informado',
                        status: 'pago', // Assumindo que históricos antigos já foram pagos
                    });
            }

            console.log(`Registro migrardo com sucesso: ${record.id}`);

        } catch (err) {
            console.error(`Falha ao migrar registro ${record.id}:`, err);
        }
    }

    console.log('Migração de backfill concluída!');
}

runBackfill();
