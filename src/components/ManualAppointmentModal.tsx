import { useState, useEffect } from "react";
import { 
  Calendar, 
  Clock, 
  Users, 
  Scissors, 
  Search, 
  Plus, 
  Check, 
  X,
  AlertCircle
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Alert,
  AlertDescription 
} from "@/components/ui/alert";
import { fetchClientes, createCliente, type Cliente } from "@/lib/clientes";
import { fetchProfissionais } from "@/lib/equipe";
import { fetchServicos, criarAgendamentoManual } from "@/lib/agendamentos";
import { formatBRL } from "@/lib/format";
import { toast } from "sonner";

interface ManualAppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  defaultBarbeiroNome?: string;
}

export function ManualAppointmentModal({ 
  open, 
  onOpenChange, 
  onSuccess,
  defaultBarbeiroNome 
}: ManualAppointmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [profissionais, setProfissionais] = useState<{id: string, nome: string}[]>([]);
  const [servicos, setServicos] = useState<any[]>([]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewClient, setIsNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");

  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedProId, setSelectedProId] = useState<string>("");
  const [selectedServicosIds, setSelectedServicosIds] = useState<string[]>([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchProfissionais().then(setProfissionais);
      fetchServicos().then(setServicos);
      loadClientes();
    }
  }, [open]);

  useEffect(() => {
    if (profissionais.length > 0 && defaultBarbeiroNome) {
      const match = profissionais.find(p => p.nome === defaultBarbeiroNome);
      if (match) setSelectedProId(match.id);
    }
  }, [profissionais, defaultBarbeiroNome]);

  const loadClientes = async (q?: string) => {
    try {
      const data = await fetchClientes(q);
      setClientes(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isNewClient) loadClientes(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, isNewClient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isNewClient) {
      if (!newClientName || !newClientPhone) {
        toast.error("Preencha os dados do novo cliente");
        return;
      }
    } else if (!selectedClientId) {
      toast.error("Selecione um cliente");
      return;
    }

    if (!selectedProId || selectedServicosIds.length === 0 || !date || !time) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);
    setFormError(null);
    try {
      let clientId = selectedClientId;

      // 1. Criar novo cliente se necessário
      if (isNewClient) {
        const nc = await createCliente({ nome: newClientName, whatsapp: newClientPhone });
        clientId = nc.id;
      }

      const scheduledAt = new Date(`${date}T${time}`).toISOString();
      
      const selectedServicosDetails = selectedServicosIds.map(id => {
        const s = servicos.find(serv => serv.id === id);
        return {
          servico_id: id,
          preco_cobrado: Number(s.preco_base)
        };
      });

      const result = await criarAgendamentoManual({
        cliente_id: clientId,
        profissional_id: selectedProId,
        data_hora_agendada: scheduledAt,
        servicos: selectedServicosDetails
      });

      console.log("[MODAL DEBUG] Resultado:", result);

      toast.success("Agendamento realizado com sucesso!");
      onSuccess?.();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error("[MODAL DEBUG] Erro capturado:", error);
      const msg = error?.message || "Erro ao criar agendamento";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedClientId("");
    setIsNewClient(false);
    setNewClientName("");
    setNewClientPhone("");
    setSelectedServicosIds([]);
    setDate("");
    setTime("");
  };

  const toggleServico = (id: string) => {
    setSelectedServicosIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const total = selectedServicosIds.reduce((acc, id) => {
    const s = servicos.find(serv => serv.id === id);
    return acc + Number(s?.preco_base || 0);
  }, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl flex items-center gap-2">
            <Plus className="text-primary" /> Novo Agendamento Manual
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {formError && (
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 animate-reveal">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs font-medium">
                {formError}
              </AlertDescription>
            </Alert>
          )}
          {/* Busca de Cliente */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Users size={14} /> Cliente
              </Label>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setIsNewClient(!isNewClient);
                  setSelectedClientId("");
                }}
                className="h-7 text-[10px] uppercase tracking-wider text-primary hover:text-primary hover:bg-primary/10"
              >
                {isNewClient ? "Selecionar Existente" : "Cadastrar Novo"}
              </Button>
            </div>

            {isNewClient ? (
              <div className="grid grid-cols-1 gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5 animate-reveal">
                <div className="space-y-1.5">
                  <Label htmlFor="nc-nome" className="text-[10px] uppercase text-muted-foreground">Nome Completo</Label>
                  <Input 
                    id="nc-nome" 
                    placeholder="Ex: João Silva" 
                    className="h-9 bg-background/50 border-primary/20 focus:ring-primary/20"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nc-phone" className="text-[10px] uppercase text-muted-foreground">WhatsApp</Label>
                  <Input 
                    id="nc-phone" 
                    placeholder="Ex: 5511999999999" 
                    className="h-9 bg-background/50 border-primary/20 focus:ring-primary/20"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2 animate-reveal">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                  <Input 
                    placeholder="Buscar cliente..." 
                    className="pl-9 bg-background/50"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto rounded-lg border border-border/40 bg-background/20 p-1">
                  {clientes.length === 0 ? (
                    <div className="text-[10px] text-center py-2 text-muted-foreground italic">
                      Nenhum cliente encontrado.
                    </div>
                  ) : (
                    clientes.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedClientId(c.id)}
                        className={[
                          "flex items-center justify-between px-3 py-2 rounded-md text-xs transition-colors",
                          selectedClientId === c.id 
                            ? "bg-primary/20 text-primary border border-primary/30" 
                            : "hover:bg-primary/10 text-foreground"
                        ].join(" ")}
                      >
                        <span>{c.nome}</span>
                        {selectedClientId === c.id && <Check size={12} />}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Profissional */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Scissors size={14} /> Barbeiro
              </Label>
              <Select value={selectedProId} onValueChange={setSelectedProId}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {profissionais.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Data e Hora */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar size={14} /> Data
              </Label>
              <Input 
                type="date" 
                className="bg-background/50"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock size={14} /> Horário
              </Label>
              <Input 
                type="time" 
                className="bg-background/50"
                value={time}
                onChange={e => setTime(e.target.value)}
              />
            </div>
            
            <div className="flex items-end">
              <div className="w-full p-2 rounded-lg bg-primary/10 border border-primary/20 text-center">
                <div className="text-[10px] uppercase text-primary/60 font-bold">Total</div>
                <div className="text-xl font-display text-primary">{formatBRL(total)}</div>
              </div>
            </div>
          </div>

          {/* Serviços */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Scissors size={14} /> Serviços
            </Label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
              {servicos.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleServico(s.id)}
                  className={[
                    "flex flex-col items-start p-3 rounded-xl border transition-all text-left",
                    selectedServicosIds.includes(s.id)
                      ? "border-primary bg-primary/10 shadow-glow"
                      : "border-border/40 bg-background/20 hover:border-border"
                  ].join(" ")}
                >
                  <span className="text-xs font-bold truncate w-full">{s.nome}</span>
                  <span className="text-[10px] text-muted-foreground">{formatBRL(s.preco_base)}</span>
                </button>
              ))}
            </div>
          </div>
        </form>

        <DialogFooter className="pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="gap-2 shadow-glow">
            {loading ? "Processando..." : "Confirmar Agendamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
