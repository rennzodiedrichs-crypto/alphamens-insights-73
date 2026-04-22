import { supabase } from "@/integrations/supabase/client";

export type Cliente = {
  id: string;
  nome: string;
  whatsapp: string | null;
  identificador_usuario: string | null;
  id_lead_chatwoot: string | null;
  criado_em: string;
  atualizado_em: string;
};

export async function fetchClientes(search?: string): Promise<Cliente[]> {
  let query = supabase.from("clientes").select("*").order("nome");

  if (search) {
    query = query.or(`nome.ilike.%${search}%,whatsapp.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Erro ao buscar clientes:", error);
    throw error;
  }
  return (data || []) as Cliente[];
}

export async function createCliente(cliente: Partial<Cliente>): Promise<Cliente> {
  if (cliente.whatsapp) {
    const { data: existing } = await supabase
      .from("clientes")
      .select("id")
      .eq("whatsapp", cliente.whatsapp)
      .maybeSingle();

    if (existing) {
      throw new Error("TELEFONE_DUPLICADO");
    }
  }

  const { data, error } = await supabase
    .from("clientes")
    .insert(cliente)
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar cliente:", error);
    throw error;
  }
  return data as Cliente;
}

export async function updateCliente(id: string, updates: Partial<Cliente>): Promise<Cliente> {
  if (updates.whatsapp) {
    const { data: existing } = await supabase
      .from("clientes")
      .select("id")
      .eq("whatsapp", updates.whatsapp)
      .neq("id", id)
      .maybeSingle();

    if (existing) {
      throw new Error("TELEFONE_DUPLICADO");
    }
  }

  const { data, error } = await supabase
    .from("clientes")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Erro ao atualizar cliente:", error);
    throw error;
  }
  return data as Cliente;
}

export async function deleteCliente(id: string): Promise<void> {
  const { error } = await supabase
    .from("clientes")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Erro ao deletar cliente:", error);
    throw error;
  }
}
