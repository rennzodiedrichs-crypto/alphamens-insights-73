import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export type Lead = {
  id: string;
  identificador_usuario: string;
  inicio_atendimento_em: string | null;
  inicio_fora_horario_comercial: boolean | null;
  nome: string | null;
  whatsapp: string | null;
  status: string | null;
  servicos: string | null;
  valor_servico: number | null;
  data_hora_agendada: string | null;
  barbeiro: string | null;
  id_agendamento: string | null;
  marcou_no_grupo: string | null;
  timestamp_ultima_msg: string | null;
  resumo_conversa: string | null;
  id_conta_chatwoot: string | null;
  id_conversa_chatwoot: string | null;
  id_lead_chatwoot: string | null;
  inbox_id_chatwoot: string | null;
  cliente_id: string | null;
};

// Função adaptadora: Converte o retorno relacional do Supabase para o formato plano (Lead) que a UI espera
function mapToLead(row: any): Lead {
  const cliente = row.clientes || {};
  const profissional = row.profissionais || {};
  const relacaoServicos = row.agendamentos_servicos || [];
  
  // Concatena nomes de múltiplos serviços se existirem
  const servicosNomes = relacaoServicos.map((s: any) => s.servicos?.nome).filter(Boolean).join(', ') || null;
  
  // Pega o valor total dos pagamentos ou soma o preço dos serviços como fallback
  const valorTotal = row.pagamentos?.[0]?.valor_total 
    ?? relacaoServicos.reduce((acc: number, curr: any) => acc + (curr.preco_cobrado || 0), 0) 
    ?? null;

  return {
    id: row.id,
    identificador_usuario: cliente.identificador_usuario || row.whatsapp || '',
    inicio_atendimento_em: row.inicio_atendimento_em,
    inicio_fora_horario_comercial: row.inicio_fora_horario_comercial,
    nome: row.nome_cliente || cliente.nome || null,
    whatsapp: row.whatsapp || cliente.whatsapp || null,
    status: row.status,
    servicos: row.servicos || servicosNomes,
    valor_servico: row.valor_servico || valorTotal,
    data_hora_agendada: row.data_hora_agendada,
    barbeiro: row.barbeiro_nome || profissional.nome || null,
    id_agendamento: row.id,
    marcou_no_grupo: row.marcou_no_grupo,
    timestamp_ultima_msg: row.timestamp_ultima_msg || row.atualizado_em || row.criado_em,
    resumo_conversa: row.resumo_conversa,
    id_conta_chatwoot: row.id_conta_chatwoot,
    id_conversa_chatwoot: row.id_conversa_chatwoot,
    id_lead_chatwoot: cliente.id_lead_chatwoot || null,
    inbox_id_chatwoot: row.inbox_id_chatwoot,
    cliente_id: row.cliente_id,
  };
}

export async function fetchLeadsInRange(from: Date, to: Date): Promise<Lead[]> {
  const fromStr = format(from, "yyyy-MM-dd'T'HH:mm:ss");
  const toStr = format(to, "yyyy-MM-dd'T'HH:mm:ss");

  // Consulta nas novas tabelas usando Junções (Joins) do PostgREST
  const { data, error } = await supabase
    .from("agendamentos")
    .select(`
      *,
      clientes ( identificador_usuario, nome, whatsapp, id_lead_chatwoot ),
      profissionais ( nome ),
      agendamentos_servicos ( preco_cobrado, servicos ( nome ) ),
      pagamentos ( valor_total )
    `)
    .or(`inicio_atendimento_em.gte.${fromStr},criado_em.gte.${fromStr}`)
    .order("inicio_atendimento_em", { ascending: false, nullsFirst: false })
    .limit(1000);

  if (error) {
    console.error("Supabase Error:", error);
    throw error;
  }

  // Mapeia para o formato antigo e aplica o filtro exato de tempo
  const mappedData = (data ?? []).map(mapToLead);

  const filteredData = mappedData.filter(lead => {
    const start = lead.inicio_atendimento_em;
    const lastMsg = lead.timestamp_ultima_msg;
    
    const isStartInRange = start && start >= fromStr && start <= toStr;
    const isLastMsgInRange = lastMsg && lastMsg >= fromStr && lastMsg <= toStr;
    
    return isStartInRange || isLastMsgInRange;
  });

  return filteredData;
}

export async function fetchLeadsByBarber(barbeiro: string): Promise<Lead[]> {
  // Removemos o 'inner' join do profissionais para não quebrar agendamentos vindos do n8n (que não possuem profissional_id)
  const { data, error } = await supabase
    .from("agendamentos")
    .select(`
      *,
      clientes ( identificador_usuario, nome, whatsapp, id_lead_chatwoot ),
      profissionais ( nome ),
      agendamentos_servicos ( preco_cobrado, servicos ( nome ) ),
      pagamentos ( valor_total )
    `)
    .not("data_hora_agendada", "is", null)
    .order("data_hora_agendada", { ascending: true })
    .limit(1000);

  if (error) throw error;
  
  // Realiza a filtragem pelo nome do barbeiro no cliente (compatível tanto com a tabela relacional quanto a plana)
  const allLeads = (data ?? []).map(mapToLead);
  return allLeads.filter(l => l.barbeiro === barbeiro);
}
