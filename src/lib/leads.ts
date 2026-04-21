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
    identificador_usuario: cliente.identificador_usuario || '',
    inicio_atendimento_em: row.inicio_atendimento_em,
    inicio_fora_horario_comercial: row.inicio_fora_horario_comercial,
    nome: cliente.nome || null,
    whatsapp: cliente.whatsapp || null,
    status: row.status,
    servicos: servicosNomes,
    valor_servico: valorTotal,
    data_hora_agendada: row.data_hora_agendada,
    barbeiro: profissional.nome || null,
    id_agendamento: row.id, // Mapeado para a nova PK
    marcou_no_grupo: row.marcou_no_grupo,
    timestamp_ultima_msg: row.atualizado_em || row.criado_em, // Fallback para timestamp
    resumo_conversa: row.resumo_conversa,
    id_conta_chatwoot: row.id_conta_chatwoot,
    id_conversa_chatwoot: row.id_conversa_chatwoot,
    id_lead_chatwoot: cliente.id_lead_chatwoot || null,
    inbox_id_chatwoot: row.inbox_id_chatwoot,
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
  // Para filtrar por uma coluna de tabela associada (profissionais.nome), usamos inner join syntax no Supabase
  const { data, error } = await supabase
    .from("agendamentos")
    .select(`
      *,
      clientes ( identificador_usuario, nome, whatsapp, id_lead_chatwoot ),
      profissionais!inner ( nome ),
      agendamentos_servicos ( preco_cobrado, servicos ( nome ) ),
      pagamentos ( valor_total )
    `)
    .eq("profissionais.nome", barbeiro)
    .not("data_hora_agendada", "is", null)
    .order("data_hora_agendada", { ascending: true })
    .limit(1000);

  if (error) throw error;
  
  return (data ?? []).map(mapToLead);
}
