import { supabase } from "@/integrations/supabase/client";

export type AgendamentoPOS = {
  id: string;
  data_hora_agendada: string;
  status: string;
  cliente: { id: string; nome: string; whatsapp: string | null } | null;
  profissional: { id: string; nome: string } | null;
  servicos: { nome: string; preco_cobrado: number }[];
  valor_total: number;
  pagamento?: { id: string; status: string; metodo_pagamento: string | null } | null;
};

export async function fetchAgendamentosDoDia(data: string): Promise<AgendamentoPOS[]> {
  const inicioDia = `${data}T00:00:00-03:00`;
  const fimDia = `${data}T23:59:59-03:00`;

  const { data: agendamentos, error } = await supabase
    .from("agendamentos")
    .select(`
      id,
      data_hora_agendada,
      status,
      valor_servico,
      servicos,
      clientes ( id, nome, whatsapp ),
      profissionais ( id, nome ),
      agendamentos_servicos ( preco_cobrado, servicos ( nome ) )
    `)
    .gte("data_hora_agendada", inicioDia)
    .lte("data_hora_agendada", fimDia)
    .neq("status", "cancelado")
    .order("data_hora_agendada", { ascending: true });

  if (error) throw error;

  const results: AgendamentoPOS[] = [];

  for (const ag of agendamentos || []) {
    // Buscar pagamento vinculado
    const { data: pagamento } = await supabase
      .from("pagamentos")
      .select("id, status, metodo_pagamento")
      .eq("agendamento_id", ag.id)
      .maybeSingle();

    // Priorizar os dados flat da tabela de agendamentos conforme pedido
    const servicosFormatados = ag.servicos 
      ? [{ nome: String(ag.servicos), preco_cobrado: Number(ag.valor_servico || 0) }]
      : (ag.agendamentos_servicos || []).map((as_: any) => ({
          nome: as_.servicos?.nome || "Serviço",
          preco_cobrado: Number(as_.preco_cobrado),
        }));

    const valorTotal = Number(ag.valor_servico) || servicosFormatados.reduce((acc: number, s: any) => acc + s.preco_cobrado, 0);

    results.push({
      id: ag.id,
      data_hora_agendada: ag.data_hora_agendada,
      status: ag.status,
      cliente: ag.clientes as any,
      profissional: ag.profissionais as any,
      servicos: servicosFormatados,
      valor_total: valorTotal,
      pagamento: pagamento || null,
    });
  }

  return results;
}

export async function registrarPagamento(
  agendamentoId: string,
  clienteId: string,
  valorTotal: number,
  metodoPagamento: string
) {
  // 1. Criar o pagamento
  const { data: pagamento, error: pgError } = await supabase
    .from("pagamentos")
    .insert({
      agendamento_id: agendamentoId,
      cliente_id: clienteId,
      valor_total: valorTotal,
      metodo_pagamento: metodoPagamento,
      status: "pago",
      data_pagamento: new Date().toISOString(),
    })
    .select()
    .single();

  if (pgError) throw pgError;

  // 2. Atualizar status do agendamento para "concluido"
  const { error: agError } = await supabase
    .from("agendamentos")
    .update({ status: "concluido" })
    .eq("id", agendamentoId);

  if (agError) throw agError;

  // 3. Registrar no histórico
  await supabase.from("historico_pagamentos").insert({
    pagamento_id: pagamento.id,
    status_anterior: "pendente",
    status_novo: "pago",
    observacao: `Pagamento via ${metodoPagamento}`,
  });

  return pagamento;
}

export async function cancelarAgendamento(agendamentoId: string) {
  const { error } = await supabase
    .from("agendamentos")
    .update({ status: "cancelado" })
    .eq("id", agendamentoId);

  if (error) throw error;
}
