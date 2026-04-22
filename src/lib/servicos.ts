import { supabase } from "@/integrations/supabase/client";

export type Servico = {
  id: string;
  nome: string;
  descricao: string | null;
  preco_base: number;
  duracao_estimada_minutos: number;
  status: string;
  criado_em: string;
};

export async function fetchTodosServicos(): Promise<Servico[]> {
  const { data, error } = await supabase
    .from("servicos")
    .select("*")
    .order("nome");
  if (error) throw error;
  return data || [];
}

export async function createServico(input: Omit<Servico, "id" | "criado_em" | "status">) {
  const { data, error } = await supabase
    .from("servicos")
    .insert({ ...input, status: "ativo" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateServico(id: string, input: Partial<Omit<Servico, "id" | "criado_em">>) {
  const { data, error } = await supabase
    .from("servicos")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteServico(id: string) {
  const { error } = await supabase
    .from("servicos")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
