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
  // 1. Criar o agendamento
  const { data: agendamento, error: agendamentoError } = await supabase
    .from("agendamentos")
    .insert({
      cliente_id: input.cliente_id,
      profissional_id: input.profissional_id,
      data_hora_agendada: input.data_hora_agendada,
      status: input.status || "pendente",
    })
    .select()
    .single();

  if (agendamentoError) {
    console.error("Erro ao criar agendamento:", agendamentoError);
    throw agendamentoError;
  }

  // 2. Vincular os serviços
  const servicosToInsert = input.servicos.map((s) => ({
    agendamento_id: agendamento.id,
    servico_id: s.servico_id,
    preco_cobrado: s.preco_cobrado,
  }));

  const { error: servicosError } = await supabase
    .from("agendamentos_servicos")
    .insert(servicosToInsert);

  if (servicosError) {
    console.error("Erro ao vincular serviços ao agendamento:", servicosError);
    // Idealmente aqui faríamos um rollback do agendamento, mas como é Supabase sem transação explícita via JS simple, 
    // assumimos que o fluxo é controlado.
    throw servicosError;
  }

  return agendamento;
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
