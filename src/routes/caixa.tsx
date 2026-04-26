import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { 
  fetchAgendamentosDoDia, 
  registrarPagamento, 
  AgendamentoPOS 
} from "@/lib/pagamentos";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Calculator, CheckCircle2, Clock, DollarSign, User, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { formatBRL, formatTimeBR } from "@/lib/format";
import { format, addDays, subDays } from "date-fns";

export const Route = createFileRoute("/caixa")({
  component: CaixaPage,
});

function CaixaPage() {
  const { role } = useAuth();
  const [agendamentos, setAgendamentos] = useState<AgendamentoPOS[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  
  // Modal state
  const [openModal, setOpenModal] = useState(false);
  const [selectedAgendamento, setSelectedAgendamento] = useState<AgendamentoPOS | null>(null);
  const [metodoPagamento, setMetodoPagamento] = useState<string>("pix");

  const todayStr = format(dataSelecionada, "yyyy-MM-dd");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchAgendamentosDoDia(todayStr);
      setAgendamentos(data);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar o caixa");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === "admin") {
      loadData();
    }
  }, [role, dataSelecionada]);

  const handlePrevDay = () => setDataSelecionada(prev => subDays(prev, 1));
  const handleNextDay = () => setDataSelecionada(prev => addDays(prev, 1));

  if (role !== "admin") {
    return (
      <div className="flex h-screen items-center justify-center">
        <h1 className="text-xl text-destructive font-bold">Acesso Restrito</h1>
      </div>
    );
  }

  const handleOpenPagamento = (ag: AgendamentoPOS) => {
    setSelectedAgendamento(ag);
    setMetodoPagamento("pix");
    setOpenModal(true);
  };

  const handleConfirmarPagamento = async () => {
    if (!selectedAgendamento || !selectedAgendamento.cliente) return;
    
    try {
      await registrarPagamento(
        selectedAgendamento.id,
        selectedAgendamento.cliente.id,
        selectedAgendamento.valor_total,
        metodoPagamento
      );
      toast.success("Pagamento registrado!");
      setOpenModal(false);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Erro no pagamento");
    }
  };

  const totalEmAberto = agendamentos
    .filter(a => {
      const isPago = a.status === "concluido" || a.pagamento?.status === "pago";
      return !isPago;
    })
    .reduce((acc, a) => acc + (a.valor_total || 0), 0);

  const totalRecebido = agendamentos
    .filter(a => a.status === "concluido" || a.pagamento?.status === "pago")
    .reduce((acc, a) => acc + (a.valor_total || 0), 0);

  return (
    <div className="flex-1 space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-bold tracking-tight flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          Caixa / POS
        </h2>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrevDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 bg-sidebar-accent/50 px-3 py-1 rounded-md border border-sidebar-border text-xs font-bold">
            <CalendarIcon className="h-3 w-3 text-primary" />
            {format(dataSelecionada, "dd/MM/yyyy")}
          </div>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Resumo Financeiro do Dia */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-sidebar-accent/10 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">A Receber Hoje</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display">{formatBRL(totalEmAberto)}</div>
          </CardContent>
        </Card>
        <Card className="bg-sidebar-accent/10 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recebido Hoje</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display text-success">{formatBRL(totalRecebido)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Atendimentos */}
      <Card className="bg-sidebar-accent/5 border-primary/10">
        <CardHeader>
          <CardTitle className="font-display">Atendimentos do Dia</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando caixa...</div>
          ) : agendamentos.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-sidebar-border rounded-xl">
              <p className="text-muted-foreground italic mb-2">Nenhum atendimento registrado para hoje.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {agendamentos.map(ag => {
                const isPago = ag.status === "concluido" || ag.pagamento?.status === "pago";
                
                return (
                  <Card key={ag.id} className={`overflow-hidden ${isPago ? 'bg-success/5 border-success/20 opacity-80' : 'bg-sidebar-accent/20 border-sidebar-border'}`}>
                    <div className={`h-1 w-full ${isPago ? 'bg-success' : 'bg-warning'}`} />
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-lg font-display flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" />
                            {ag.cliente?.nome || "Cliente Removido"}
                          </CardTitle>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatTimeBR(ag.data_hora_agendada)} com {ag.profissional?.nome}
                          </div>
                        </div>
                        {isPago && <CheckCircle2 className="h-5 w-5 text-success" />}
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3 text-base">
                      <ul className="space-y-2 text-foreground font-medium">
                        {ag.servicos.map((s, idx) => (
                          <li key={idx} className="flex justify-between">
                            <span>{s.nome}</span>
                            <span>{formatBRL(s.preco_cobrado)}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-4 pt-3 border-t border-sidebar-border/50 flex justify-between items-center font-bold">
                        <span>Total:</span>
                        <span className={isPago ? "text-success" : "text-primary"}>
                          {formatBRL(ag.valor_total)}
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      {!isPago ? (
                        <Button 
                          className="w-full bg-primary hover:bg-primary/90 shadow-glow text-primary-foreground font-bold"
                          onClick={() => handleOpenPagamento(ag)}
                        >
                          <DollarSign className="h-4 w-4 mr-2" />
                          Cobrar
                        </Button>
                      ) : (
                        <div className="w-full text-center py-2 text-xs font-semibold text-success bg-success/10 rounded-md">
                          PAGO ({ag.pagamento?.metodo_pagamento?.toUpperCase()})
                        </div>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Pagamento */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-[400px] bg-sidebar border-sidebar-border text-sidebar-foreground">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl flex items-center gap-2">
              <DollarSign className="text-primary" />
              Finalizar Venda
            </DialogTitle>
          </DialogHeader>
          
          {selectedAgendamento && (
            <div className="space-y-6 py-4">
              <div className="p-4 rounded-xl bg-sidebar-accent/20 border border-sidebar-border">
                <div className="text-sm text-muted-foreground mb-1">Cliente</div>
                <div className="font-bold text-lg">{selectedAgendamento.cliente?.nome}</div>
                <div className="mt-3 pt-3 border-t border-sidebar-border/50">
                  <div className="text-sm text-muted-foreground mb-1">Valor a Pagar</div>
                  <div className="font-display text-3xl text-primary font-bold">
                    {formatBRL(selectedAgendamento.valor_total)}
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="metodo">Método de Pagamento</Label>
                <Select value={metodoPagamento} onValueChange={setMetodoPagamento}>
                  <SelectTrigger className="bg-background border-sidebar-border h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="credito">Cartão de Crédito</SelectItem>
                    <SelectItem value="debito">Cartão de Débito</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                size="lg" 
                className="w-full text-lg font-bold shadow-glow"
                onClick={handleConfirmarPagamento}
              >
                Confirmar Pagamento
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
