import { supabase } from "@/integrations/supabase/client";

export type Lead = {
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
  const { data, error } = await supabase
    .from("CRM_ALPHA")
    .select("*")
    .gte("inicio_atendimento_em", from.toISOString())
    .lte("inicio_atendimento_em", to.toISOString())
    .order("inicio_atendimento_em", { ascending: false })
    .limit(1000);
  if (error) throw error;
  return (data ?? []) as Lead[];
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
