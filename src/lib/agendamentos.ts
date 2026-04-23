import { supabase } from "@/integrations/supabase/client";

export type AgendamentoInput = {
  cliente_id: string;
  profissional_id: string;
  data_hora_agendada: string;
  status?: string;
  servicos: {
    servico_id: string;
    preco_cobrado: number;
  }[];
};

export async function criarAgendamentoManual(input: AgendamentoInput) {
  const { data, error } = await supabase.rpc("fnc_criar_agendamento_seguro", {
    p_cliente_id: input.cliente_id,
    p_profissional_id: input.profissional_id,
    p_data_hora: input.data_hora_agendada,
    p_servico_ids: input.servicos.map((s) => s.servico_id),
  });

  if (error) {
    console.error("Erro no RPC de agendamento:", error);
    throw error;
  }

  if (data === null || data === undefined) {
    throw new Error("Sem resposta do servidor. Verifique as permissões da função.");
  }

  const result = data as { success: boolean; error?: string; agendamento_id?: string };

  if (!result.success) {
    throw new Error(result.error || "Erro desconhecido ao criar agendamento");
  }

  return { id: result.agendamento_id };
}

export async function fetchServicos() {
  const { data, error } = await supabase
    .from("servicos")
    .select("*")
    .eq("status", "ativo")
    .order("nome");

  if (error) throw error;
  return data || [];
}

export async function cancelarAgendamento(agendamentoId: string) {
  const { error } = await supabase
    .from("agendamentos")
    .update({ status: "cancelado" })
    .eq("id", agendamentoId);

  if (error) {
    console.error("Erro ao cancelar agendamento:", error);
    throw error;
  }
}

export async function fetchUltimoAgendamentoPorCliente(clienteId: string) {
  const { data, error } = await supabase
    .from("agendamentos")
    .select(`
      *,
      clientes ( whatsapp, nome ),
      profissionais ( nome ),
      agendamentos_servicos ( preco_cobrado, servicos ( nome ) ),
      pagamentos ( valor_total )
    `)
    .eq("cliente_id", clienteId)
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar último agendamento:", error);
    throw error;
  }

  if (!data) return null;

  // Adaptador simples para o formato que a UI precisa
  const row = data;
  const relacaoServicos = row.agendamentos_servicos || [];
  const servicosNomes = relacaoServicos.map((s: any) => s.servicos?.nome).filter(Boolean).join(', ') || null;
  const valorTotal = row.pagamentos?.[0]?.valor_total 
    ?? relacaoServicos.reduce((acc: number, curr: any) => acc + (curr.preco_cobrado || 0), 0) 
    ?? 0;

  return {
    id: row.id,
    cliente_nome: row.clientes?.nome,
    whatsapp: row.clientes?.whatsapp,
    servico: servicosNomes,
    valor: valorTotal,
    status: row.status,
    data_hora: row.data_hora_agendada,
    barbeiro: row.profissionais?.nome,
    resumo: row.resumo_conversa,
    inicio_atendimento: row.inicio_atendimento_em
  };
}
