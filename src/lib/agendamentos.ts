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

function mapAgendamentoRow(row: any) {
  if (!row) return null;
  
  const relacaoServicos = row.agendamentos_servicos || [];
  const servicosNomes = relacaoServicos.map((s: any) => s.servicos?.nome).filter(Boolean).join(', ') || null;
  const valorTotal = row.pagamentos?.[0]?.valor_total 
    ?? relacaoServicos.reduce((acc: number, curr: any) => acc + (curr.preco_cobrado || 0), 0) 
    ?? 0;

  return {
    id: row.id,
    cliente_nome: row.nome_cliente || row.clientes?.nome,
    whatsapp: row.whatsapp || row.clientes?.whatsapp,
    servico: row.servicos || servicosNomes,
    valor: row.valor_servico || valorTotal,
    status: row.status,
    data_hora: row.data_hora_agendada,
    barbeiro: row.barbeiro_nome || row.profissionais?.nome,
    resumo: row.resumo_conversa,
    inicio_atendimento: row.inicio_atendimento_em
  };
}

export async function fetchAgendamentoPorId(id: string) {
  const { data, error } = await supabase
    .from("agendamentos")
    .select(`
      *,
      clientes ( whatsapp, nome ),
      profissionais ( nome ),
      agendamentos_servicos ( preco_cobrado, servicos ( nome ) ),
      pagamentos ( valor_total )
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar agendamento por ID:", error);
    throw error;
  }

  return mapAgendamentoRow(data);
}

export async function fetchUltimoAgendamentoPorCliente(clienteId: string) {
  const agora = new Date().toISOString();

  // 1. Tentar buscar o próximo agendamento ativo (futuro e não cancelado)
  const { data: upcomingData, error: upcomingError } = await supabase
    .from("agendamentos")
    .select(`
      *,
      clientes ( whatsapp, nome ),
      profissionais ( nome ),
      agendamentos_servicos ( preco_cobrado, servicos ( nome ) ),
      pagamentos ( valor_total )
    `)
    .eq("cliente_id", clienteId)
    .not("status", "ilike", "cancelado")
    .gte("data_hora_agendada", agora)
    .order("data_hora_agendada", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (upcomingError) {
    console.error("Erro ao buscar próximo agendamento:", upcomingError);
    throw upcomingError;
  }

  let row = upcomingData;

  // 2. Se não houver agendamento futuro ativo, buscar o mais recente criado (fallback)
  if (!row) {
    const { data: pastData, error: pastError } = await supabase
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

    if (pastError) {
      console.error("Erro ao buscar agendamento passado:", pastError);
      throw pastError;
    }

    if (!pastData) return null;
    row = pastData;
  }

  return mapAgendamentoRow(row);
}
