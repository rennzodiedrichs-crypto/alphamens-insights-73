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

export async function fetchLeadsInRange(from: Date, to: Date): Promise<Lead[]> {
  // Usamos formatação local para evitar o deslocamento de UTC (Z) que o toISOString causa.
  // Isso garante que leads criados às 00:01 do horário local sejam capturados corretamente.
  const fromStr = format(from, "yyyy-MM-dd'T'HH:mm:ss");
  const toStr = format(to, "yyyy-MM-dd'T'HH:mm:ss");

  const { data, error } = await supabase
    .from("CRM_ALPHA")
    .select("*")
    .or(`inicio_atendimento_em.gte.${fromStr},timestamp_ultima_msg.gte.${fromStr}`)
    .order("inicio_atendimento_em", { ascending: false, nullsFirst: false })
    .limit(1000);

  // Filtragem secundária no JS para garantir que o limite superior (toStr) seja respeitado
  // (O 'or' complexo com gte/lte em duas colunas é melhor filtrado no retorno para evitar erros de sintaxe no Postgrest)
  const filteredData = (data ?? []).filter(lead => {
    const start = lead.inicio_atendimento_em;
    const lastMsg = lead.timestamp_ultima_msg;
    
    const isStartInRange = start && start >= fromStr && start <= toStr;
    const isLastMsgInRange = lastMsg && lastMsg >= fromStr && lastMsg <= toStr;
    
    return isStartInRange || isLastMsgInRange;
  });

  if (error) {
    console.error("Supabase Error:", error);
    throw error;
  }
  return filteredData as Lead[];
}

export async function fetchLeadsByBarber(barbeiro: string): Promise<Lead[]> {
  const { data, error } = await supabase
    .from("CRM_ALPHA")
    .select("*")
    .eq("barbeiro", barbeiro)
    .not("data_hora_agendada", "is", null)
    .order("data_hora_agendada", { ascending: true })
    .limit(1000);
  if (error) throw error;
  return (data ?? []) as Lead[];
}
