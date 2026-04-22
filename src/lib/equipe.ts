import { supabase } from "@/integrations/supabase/client";

export type PerformanceBarbeiro = {
  profissional_id: string;
  nome_barbeiro: string;
  mes: string;
  qtd_clientes_atendidos: number;
  faturamento_bruto: number;
};

export type EscalaAusencia = {
  id: string;
  profissional_id: string;
  inicio_ausencia: string;
  fim_ausencia: string;
  motivo: string;
  criado_em: string;
  profissionais?: {
    nome: string;
  };
};

export async function fetchPerformanceMensal(): Promise<PerformanceBarbeiro[]> {
  const { data, error } = await supabase
    .from("vw_performance_barbeiros")
    .select("*")
    .order("faturamento_bruto", { ascending: false });

  if (error) {
    console.error("Erro ao buscar performance:", error);
    throw error;
  }
  return (data || []) as PerformanceBarbeiro[];
}

export async function fetchAusenciasFuturas(): Promise<EscalaAusencia[]> {
  const hoje = new Date().toISOString();
  const { data, error } = await supabase
    .from("escala_ausencias")
    .select(`
      *,
      profissionais ( nome )
    `)
    .gte("fim_ausencia", hoje)
    .order("inicio_ausencia", { ascending: true });

  if (error) {
    console.error("Erro ao buscar ausências:", error);
    throw error;
  }
  return (data || []) as EscalaAusencia[];
}

export async function criarAusencia(
  profissionalId: string, 
  inicio: string, 
  fim: string, 
  motivo: string
): Promise<void> {
  const { error } = await supabase
    .from("escala_ausencias")
    .insert({
      profissional_id: profissionalId,
      inicio_ausencia: inicio,
      fim_ausencia: fim,
      motivo: motivo
    });

  if (error) {
    console.error("Erro ao registrar ausência:", error);
    throw error;
  }
}

export async function deletarAusencia(id: string): Promise<void> {
  const { error } = await supabase
    .from("escala_ausencias")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Erro ao deletar ausência:", error);
    throw error;
  }
}

export async function fetchProfissionais() {
  const { data, error } = await supabase
    .from("profissionais")
    .select("*")
    .order("nome");
    
  if (error) throw error;
  return data || [];
}

export async function createProfissional(nome: string) {
  const { data, error } = await supabase
    .from("profissionais")
    .insert({ nome })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProfissional(id: string, nome: string) {
  const { data, error } = await supabase
    .from("profissionais")
    .update({ nome })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProfissional(id: string) {
  const { error } = await supabase
    .from("profissionais")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function fetchProfissionalBySlug(slug: string) {
  const { data: profs, error } = await supabase
    .from("profissionais")
    .select("*");
  
  if (error) throw error;
  
  const slugify = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-");

  return profs.find(p => slugify(p.nome) === slug) || null;
}


