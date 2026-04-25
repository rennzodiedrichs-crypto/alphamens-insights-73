import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Phone, 
  X,
  Calendar,
  Scissors,
  MessageSquare,
  AlertTriangle,
  Clock,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
} from "@/components/ui/sheet";
import { formatPhone, formatBRL } from "@/lib/format";
import { cancelarAgendamento, fetchUltimoAgendamentoPorCliente } from "@/lib/agendamentos";
import { toast } from "sonner";

interface ClienteDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente: {
    id: string;
    nome: string;
    whatsapp: string;
  } | null;
  onAgendamentoCancelado?: () => void;
}

export function ClienteDetailsSheet({ 
  open, 
  onOpenChange, 
  cliente,
  onAgendamentoCancelado 
}: ClienteDetailsSheetProps) {
  const [agendamentoDetalhes, setAgendamentoDetalhes] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadDetalhes = async () => {
    if (!cliente) return;
    setLoading(true);
    try {
      const data = await fetchUltimoAgendamentoPorCliente(cliente.id);
      setAgendamentoDetalhes(data);
    } catch (error) {
      console.error("Erro ao carregar detalhes:", error);
      toast.error("Erro ao carregar detalhes do agendamento");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && cliente) {
      loadDetalhes();
    } else if (!open) {
      setAgendamentoDetalhes(null);
    }
  }, [open, cliente]);

  const handleCancelar = async (id: string) => {
    if (!confirm("Tem certeza que deseja cancelar este agendamento?")) return;
    
    try {
      await cancelarAgendamento(id);
      toast.success("Agendamento cancelado com sucesso");
      loadDetalhes();
      if (onAgendamentoCancelado) onAgendamentoCancelado();
    } catch (error) {
      toast.error("Erro ao cancelar agendamento");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-sidebar border-sidebar-border sm:max-w-md overflow-y-auto p-0">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : !cliente ? null : (
          <div className="flex flex-col min-h-full">
            <div className="p-8 text-center border-b border-sidebar-border/50 bg-sidebar/50 relative">
              <h2 className="font-display text-3xl text-foreground uppercase tracking-tight break-words">
                {cliente.nome}
              </h2>
            </div>

            <div className="flex-1 p-6 space-y-8">
              {/* Informações Principais */}
              <section className="space-y-4">
                <h3 className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground font-bold">
                  Informações Principais
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm py-1 border-b border-sidebar-border/30">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Phone size={14} /> WhatsApp
                    </span>
                    <span className="text-foreground font-medium">{formatPhone(cliente.whatsapp)}</span>
                  </div>
                  {agendamentoDetalhes && (
                    <>
                      <div className="flex items-center justify-between text-sm py-1 border-b border-sidebar-border/30">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Scissors size={14} /> Serviço
                        </span>
                        <span className="text-foreground font-medium lowercase">{agendamentoDetalhes.servico || "—"}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm py-1 border-b border-sidebar-border/30">
                        <span className="text-muted-foreground">Valor</span>
                        <span className="text-primary font-bold">{formatBRL(agendamentoDetalhes.valor)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm py-1 border-b border-sidebar-border/30">
                        <span className="text-muted-foreground">Status</span>
                        <span className={[
                          "font-semibold capitalize",
                          agendamentoDetalhes.status === "cancelado" ? "text-destructive" :
                          agendamentoDetalhes.status === "concluido" ? "text-success" : "text-foreground"
                        ].join(" ")}>
                          {agendamentoDetalhes.status === "pendente" ? "Agendado" : agendamentoDetalhes.status}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </section>

              {agendamentoDetalhes ? (
                <>
                  {/* Agendamento */}
                  <section className="space-y-4">
                    <h3 className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground font-bold">
                      Agendamento
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm py-1 border-b border-sidebar-border/30">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Calendar size={14} /> Data e hora
                        </span>
                        <span className="text-success font-bold">
                          {agendamentoDetalhes.data_hora 
                            ? format(new Date(agendamentoDetalhes.data_hora), "dd/MM HH:mm", { locale: ptBR })
                            : "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm py-1 border-b border-sidebar-border/30">
                        <span className="text-muted-foreground">Barbeiro</span>
                        <span className="text-foreground font-medium">{agendamentoDetalhes.barbeiro || "—"}</span>
                      </div>
                    </div>
                  </section>

                  {/* Resumo da Conversa */}
                  {agendamentoDetalhes.resumo && (
                    <section className="space-y-4">
                      <h3 className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground font-bold flex items-center gap-2">
                        <MessageSquare size={12} /> Resumo da Conversa
                      </h3>
                      <div className="p-4 rounded-xl bg-sidebar-accent/30 border border-sidebar-border/50 text-sm text-foreground/80 leading-relaxed italic">
                        {agendamentoDetalhes.resumo}
                      </div>
                    </section>
                  )}

                  {/* Botão de Cancelamento */}
                  {(agendamentoDetalhes.status === "pendente" || agendamentoDetalhes.status === "confirmado") && (
                    <div className="pt-4">
                      <Button 
                        variant="outline" 
                        className="w-full gap-2 border-destructive/20 text-destructive hover:bg-destructive/10 hover:border-destructive/40"
                        onClick={() => handleCancelar(agendamentoDetalhes.id)}
                      >
                        <AlertTriangle size={16} /> Cancelar Agendamento
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-10 text-center space-y-3">
                  <div className="h-12 w-12 rounded-full bg-sidebar-accent/50 flex items-center justify-center mx-auto text-muted-foreground">
                    <Calendar size={24} />
                  </div>
                  <p className="text-sm text-muted-foreground italic">
                    Nenhum agendamento encontrado para este cliente.
                  </p>
                </div>
              )}
            </div>

            {agendamentoDetalhes?.inicio_atendimento && (
              <div className="p-6 mt-auto border-t border-sidebar-border/50 bg-sidebar/30">
                <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest text-center">
                  Início do atendimento: {format(new Date(agendamentoDetalhes.inicio_atendimento), "dd/MM HH:mm", { locale: ptBR })}
                </p>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
