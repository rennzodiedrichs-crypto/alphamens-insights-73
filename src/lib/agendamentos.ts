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
