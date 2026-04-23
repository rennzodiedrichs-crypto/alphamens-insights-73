import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchClientes, createCliente, updateCliente, deleteCliente, type Cliente } from "@/lib/clientes";
import { cancelarAgendamento, fetchUltimoAgendamentoPorCliente } from "@/lib/agendamentos";
import { formatPhone, formatBRL } from "@/lib/format";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Users, 
  Search, 
  Plus, 
  Pencil, 
  Trash2, 
  Phone, 
  UserPlus,
  X,
  Check,
  Calendar,
  Clock,
  Scissors,
  MessageSquare,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/clientes")({
  head: () => ({
    meta: [
      { title: "Gestão de Clientes — AlphaMens Premium" },
      { name: "description", content: "Gerencie sua base de clientes AlphaMens." },
    ],
  }),
  component: ClientesPage,
});

function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState<Partial<Cliente>>({ nome: "", whatsapp: "" });

  // Info Sheet State
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [agendamentoDetalhes, setAgendamentoDetalhes] = useState<any>(null);
  const [loadingDetalhes, setLoadingDetalhes] = useState(false);

  const loadClientes = async (search?: string) => {
    setLoading(true);
    try {
      const data = await fetchClientes(search);
      setClientes(data);
    } catch (error) {
      toast.error("Erro ao carregar clientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientes(searchTerm);
  }, [searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedCliente && !isFormOpen) return; // Proteção

      if (selectedCliente?.id) {
        await updateCliente(selectedCliente.id, formData);
        toast.success("Cliente atualizado com sucesso");
      } else {
        await createCliente(formData);
        toast.success("Cliente cadastrado com sucesso");
      }
      setIsFormOpen(false);
      setSelectedCliente(null);
      setFormData({ nome: "", whatsapp: "" });
      loadClientes(searchTerm);
    } catch (error: any) {
      if (error.message === "TELEFONE_DUPLICADO") {
        toast.error("O telefone informado já se encontra cadastrado para outro cliente no banco de dados.");
      } else {
        toast.error("Erro ao salvar cliente");
      }
    }
  };

  const handleDelete = async () => {
    if (!selectedCliente) return;
    try {
      await deleteCliente(selectedCliente.id);
      toast.success("Cliente excluído");
      setIsDeleting(false);
      setSelectedCliente(null);
      loadClientes(searchTerm);
    } catch (error: any) {
      // Verifica se o erro é de restrição de chave estrangeira
      if (error.code === "23503") {
        toast.error("Não é possível excluir: este cliente possui agendamentos vinculados. Cancele os agendamentos primeiro.");
      } else {
        toast.error("Erro ao excluir cliente");
      }
    }
  };

  const openEdit = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setFormData({ nome: cliente.nome, whatsapp: cliente.whatsapp });
    setIsFormOpen(true);
  };

  const openInfoSheet = async (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setIsSheetOpen(true);
    setLoadingDetalhes(true);
    try {
      const data = await fetchUltimoAgendamentoPorCliente(cliente.id);
      setAgendamentoDetalhes(data);
    } catch (error) {
      toast.error("Erro ao carregar detalhes do agendamento");
    } finally {
      setLoadingDetalhes(false);
    }
  };

  const handleCancelarAgendamento = async (id: string) => {
    if (!confirm("Tem certeza que deseja cancelar este agendamento?")) return;
    
    try {
      await cancelarAgendamento(id);
      toast.success("Agendamento cancelado com sucesso");
      // Atualiza os detalhes no sheet
      if (selectedCliente) {
        openInfoSheet(selectedCliente);
      }
    } catch (error) {
      toast.error("Erro ao cancelar agendamento");
    }
  };

  return (
    <div className="px-6 py-8 md:px-10 md:py-10 max-w-[1600px] mx-auto min-h-screen">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4 animate-reveal">
        <div>
          <div className="text-[10px] uppercase tracking-[0.4em] text-primary mb-3 font-bold opacity-80 flex items-center gap-2">
            <Users size={12} /> CRM
          </div>
          <h1 className="font-display text-5xl md:text-6xl text-foreground tracking-tight leading-none">Gestão de Clientes</h1>
          <p className="text-muted-foreground mt-3 text-base max-w-lg leading-relaxed">
            Controle total sobre o cadastro e histórico de seus clientes.
          </p>
        </div>
        <Button 
          onClick={() => {
            setSelectedCliente(null);
            setFormData({ nome: "", whatsapp: "" });
            setIsFormOpen(true);
          }}
          className="gap-2 h-12 px-6 rounded-xl shadow-glow transition-all hover:scale-105 active:scale-95"
        >
          <UserPlus size={18} /> Cadastrar Cliente
        </Button>
      </header>

      <div className="mb-8 relative max-w-md animate-reveal [animation-delay:100ms]">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <Input 
          placeholder="Buscar por nome ou whatsapp..." 
          className="pl-12 h-12 bg-card/20 border-border/40 backdrop-blur-sm rounded-xl focus:ring-primary/20"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl border border-border/40 bg-card/10 animate-pulse" />
          ))
        ) : clientes.length === 0 ? (
          <div className="col-span-full py-20 text-center">
            <p className="text-muted-foreground">Nenhum cliente encontrado.</p>
          </div>
        ) : (
          clientes.map((cliente, index) => (
            <div 
              key={cliente.id}
              className="glass-panel p-6 rounded-2xl shadow-card hover-lift animate-reveal group relative"
              style={{ animationDelay: `${150 + index * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                    <Users size={20} className="text-primary" />
                  </div>
                  <div 
                    className="cursor-pointer group/name" 
                    onClick={() => openInfoSheet(cliente)}
                  >
                    <h3 className="font-display text-xl text-foreground leading-tight tracking-tight group-hover/name:text-primary transition-colors">
                      {cliente.nome}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Phone size={10} />
                      {formatPhone(cliente.whatsapp)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                  onClick={() => openEdit(cliente)}
                >
                  <Pencil size={14} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    setSelectedCliente(cliente);
                    setIsDeleting(true);
                  }}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Cadastro/Edição */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              {selectedCliente ? "Editar Cliente" : "Novo Cliente"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <Input 
                id="nome" 
                required 
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                placeholder="Ex: João Silva"
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input 
                id="whatsapp" 
                required 
                value={formData.whatsapp || ""}
                onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                placeholder="Ex: 5511999999999"
                className="bg-background/50"
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="gap-2 shadow-glow">
                <Check size={16} /> {selectedCliente ? "Salvar Alterações" : "Cadastrar Cliente"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Exclusão */}
      <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
        <DialogContent className="sm:max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-destructive flex items-center gap-2">
              <Trash2 size={20} /> Excluir Cliente
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tem certeza que deseja excluir o cliente <strong className="text-foreground">{selectedCliente?.nome}</strong>?
              Esta ação não poderá ser desfeita.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsDeleting(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sheet de Informações do Cliente */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="bg-sidebar border-sidebar-border sm:max-w-md overflow-y-auto p-0">
          {loadingDetalhes ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : !selectedCliente ? null : (
            <div className="flex flex-col min-h-full">
              <div className="p-8 text-center border-b border-sidebar-border/50 bg-sidebar/50">
                <h2 className="font-display text-3xl text-foreground uppercase tracking-tight">
                  {selectedCliente.nome}
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
                      <span className="text-foreground font-medium">{formatPhone(selectedCliente.whatsapp)}</span>
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
                          onClick={() => handleCancelarAgendamento(agendamentoDetalhes.id)}
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
    </div>
  );
}
