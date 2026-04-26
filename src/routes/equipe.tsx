import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { fetchPerformanceMensal, PerformanceBarbeiro, fetchAusenciasFuturas, EscalaAusencia, criarAusencia, deletarAusencia, fetchProfissionais, createProfissional, deleteProfissional } from "@/lib/equipe";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, DollarSign, CalendarX, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export const Route = createFileRoute("/equipe")({
  component: EquipeAdminPage,
});

function EquipeAdminPage() {
  const { role } = useAuth();
  const [performance, setPerformance] = useState<PerformanceBarbeiro[]>([]);
  const [ausencias, setAusencias] = useState<EscalaAusencia[]>([]);
  const [profissionais, setProfissionais] = useState<{id: string, nome: string}[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State para Nova Ausência
  const [openModal, setOpenModal] = useState(false);
  const [newProfissional, setNewProfissional] = useState("");
  const [newInicio, setNewInicio] = useState("");
  const [newFim, setNewFim] = useState("");
  const [newMotivo, setNewMotivo] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [perfData, ausData, profData] = await Promise.all([
        fetchPerformanceMensal(),
        fetchAusenciasFuturas(),
        fetchProfissionais()
      ]);
      setPerformance(perfData);
      setAusencias(ausData);
      setProfissionais(profData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === "admin") {
      loadData();
    }
  }, [role]);

  if (role !== "admin") {
    return (
      <div className="flex h-screen items-center justify-center">
        <h1 className="text-xl text-destructive font-bold">Acesso Negado</h1>
      </div>
    );
  }

  const handleCreateAusencia = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Combina a data local com T e converte para formato aceito
      const startIso = new Date(newInicio).toISOString();
      const endIso = new Date(newFim).toISOString();
      await criarAusencia(newProfissional, startIso, endIso, newMotivo);
      setOpenModal(false);
      loadData(); // recarrega
    } catch (error) {
      alert("Erro ao criar ausência. Verifique as datas.");
    }
  };

  const handleDeleteAusencia = async (id: string) => {
    if (confirm("Deseja remover este bloqueio de agenda?")) {
      await deletarAusencia(id);
      loadData();
    }
  };

  const totalFaturado = performance.reduce((acc, curr) => acc + Number(curr.faturamento_bruto), 0);
  const totalClientes = performance.reduce((acc, curr) => acc + Number(curr.qtd_clientes_atendidos), 0);

  return (
    <div className="flex-1 space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-bold tracking-tight">Gestão de Equipe</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-sidebar-accent/20 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Faturado (Mês)</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalFaturado)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-sidebar-accent/20 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Clientes Atendidos</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display">{totalClientes}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-7">
        {/* Gestão de Profissionais */}
        <Card className="col-span-full bg-sidebar-accent/5 border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-display">Equipe AlphaMens</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Gerencie os profissionais que aparecem no sistema.</p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2 shadow-glow">
                  <Plus className="h-4 w-4" /> Novo Profissional
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px] bg-sidebar border-sidebar-border text-sidebar-foreground">
                <DialogHeader>
                  <DialogTitle className="font-display">Cadastrar Profissional</DialogTitle>
                </DialogHeader>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const target = e.target as any;
                  const nome = target.nome.value;
                  try {
                    await createProfissional(nome);
                    loadData();
                    target.reset();
                    toast.success("Profissional cadastrado!");
                  } catch (err) {
                    toast.error("Erro ao cadastrar profissional");
                  }
                }} className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="nome">Nome do Barbeiro</Label>
                    <Input id="nome" name="nome" placeholder="Ex: Lucas Silva" required className="bg-background border-sidebar-border" />
                  </div>
                  <Button type="submit" className="w-full">Salvar</Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {profissionais.map((p) => (
                <div key={p.id} className="relative group p-2 rounded-xl border border-sidebar-border bg-sidebar-accent/10 hover:border-primary/40 transition-all flex flex-col items-center text-center gap-2">
                  <Avatar className="h-10 w-10 ring-1 ring-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                      {p.nome.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="font-medium text-[11px] truncate w-full">{p.nome}</div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={async () => {
                      if (confirm(`Excluir profissional ${p.nome}?`)) {
                        try {
                          await deleteProfissional(p.id);
                          loadData();
                          toast.success("Profissional removido");
                        } catch (err) {
                          toast.error("Não é possível excluir: ele possui agendamentos.");
                        }
                      }
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {profissionais.length === 0 && (
                <div className="col-span-full py-10 text-center text-muted-foreground italic border border-dashed border-sidebar-border rounded-xl">
                  Nenhum profissional cadastrado ainda.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Performance Table */}
        <Card className="col-span-4 bg-sidebar-accent/10 border-sidebar-border">
          <CardHeader>
            <CardTitle className="font-display">Performance por Barbeiro</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4 text-muted-foreground">Carregando...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-sidebar-border hover:bg-transparent">
                    <TableHead>Profissional</TableHead>
                    <TableHead className="text-right">Clientes</TableHead>
                    <TableHead className="text-right">Faturamento</TableHead>
                    <TableHead className="text-right">Ticket Médio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {performance.map((perf) => {
                    const ticketMedio = perf.qtd_clientes_atendidos > 0 
                      ? perf.faturamento_bruto / perf.qtd_clientes_atendidos 
                      : 0;

                    return (
                      <TableRow key={perf.profissional_id} className="border-sidebar-border hover:bg-sidebar-accent/30">
                        <TableCell className="font-medium flex items-center gap-3">
                          <Avatar className="h-8 w-8 ring-1 ring-primary/20">
                            <AvatarFallback className="bg-sidebar-accent text-xs">
                              {perf.nome_barbeiro.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {perf.nome_barbeiro}
                        </TableCell>
                        <TableCell className="text-right font-semibold">{perf.qtd_clientes_atendidos}</TableCell>
                        <TableCell className="text-right text-primary font-bold">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(perf.faturamento_bruto)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ticketMedio)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {performance.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                        Nenhum dado registrado neste mês.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Escala de Ausências */}
        <Card className="col-span-3 bg-sidebar-accent/10 border-sidebar-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display flex items-center gap-2">
              <CalendarX className="h-5 w-5 text-primary" />
              Bloqueios de Agenda
            </CardTitle>
            
            <Dialog open={openModal} onOpenChange={setOpenModal}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 gap-1">
                  <Plus className="h-4 w-4" /> Registrar
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-sidebar border-sidebar-border text-sidebar-foreground">
                <DialogHeader>
                  <DialogTitle className="font-display">Bloquear Horário</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateAusencia} className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="profissional">Barbeiro</Label>
                    <Select onValueChange={setNewProfissional} required>
                      <SelectTrigger className="bg-background border-sidebar-border">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {profissionais.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="inicio">Início</Label>
                      <Input 
                        id="inicio" 
                        type="datetime-local" 
                        required 
                        value={newInicio} 
                        onChange={e => setNewInicio(e.target.value)}
                        className="bg-background border-sidebar-border"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="fim">Fim</Label>
                      <Input 
                        id="fim" 
                        type="datetime-local" 
                        required 
                        value={newFim} 
                        onChange={e => setNewFim(e.target.value)}
                        className="bg-background border-sidebar-border"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="motivo">Motivo</Label>
                    <Input 
                      id="motivo" 
                      placeholder="Ex: Almoço, Folga, Médico" 
                      required 
                      value={newMotivo} 
                      onChange={e => setNewMotivo(e.target.value)}
                      className="bg-background border-sidebar-border"
                    />
                  </div>
                  <Button type="submit" className="mt-2 w-full">Salvar Bloqueio</Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-4 text-muted-foreground">Carregando...</div>
              ) : ausencias.length === 0 ? (
                <div className="text-sm text-center text-muted-foreground py-4 border border-dashed border-sidebar-border rounded-lg">
                  Nenhuma ausência futura registrada.
                </div>
              ) : (
                ausencias.map((ausencia) => (
                  <div key={ausencia.id} className="flex items-center justify-between p-3 rounded-lg bg-sidebar-accent/20 border border-sidebar-border/50 hover:border-primary/30 transition-colors">
                    <div>
                      <div className="font-semibold text-sm">{ausencia.profissionais?.nome}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {format(new Date(ausencia.inicio_ausencia), "dd/MM 'às' HH:mm", { locale: ptBR })} 
                        {' - '}
                        {format(new Date(ausencia.fim_ausencia), "HH:mm")}
                      </div>
                      <div className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold mt-2 bg-sidebar-accent text-foreground">
                        {ausencia.motivo}
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive/70 hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                      onClick={() => handleDeleteAusencia(ausencia.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
