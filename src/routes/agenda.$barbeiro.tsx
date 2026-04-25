import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  format,
  isAfter,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Clock,
  Scissors,
  CalendarX,
  Plus,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { cancelarAgendamento } from "@/lib/agendamentos";
import { fetchLeadsByBarber, type Lead } from "@/lib/leads";
import { StatCard } from "@/components/StatCard";
import { formatBRL, formatTimeBR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { criarAusencia, fetchProfissionais, fetchProfissionalBySlug } from "@/lib/equipe";
import { ManualAppointmentModal } from "@/components/ManualAppointmentModal";
import { ClienteDetailsSheet } from "@/components/ClienteDetailsSheet";

export const Route = createFileRoute("/agenda/$barbeiro")({
  loader: async ({ params }) => {
    const match = await fetchProfissionalBySlug(params.barbeiro);
    if (!match) throw notFound();
    return { barbeiroNome: match.nome };
  },
  head: ({ loaderData }) => {
    const nome = (loaderData as any)?.barbeiroNome;
    return {
      meta: [
        { title: `Agenda ${nome ?? ""} — AlphaMens Premium` },
        { name: "description", content: `Agenda mensal do barbeiro ${nome ?? ""}.` },
      ],
    };
  },
  component: AgendaPage,
});

function AgendaPage() {
  const { barbeiroNome } = Route.useLoaderData() as { barbeiroNome: string };
  const { barbeiro } = Route.useParams();
  const { role, barberName, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthRef, setMonthRef] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const [openModal, setOpenModal] = useState(false);
  const [newInicio, setNewInicio] = useState("");
  const [newFim, setNewFim] = useState("");
  const [newMotivo, setNewMotivo] = useState("");
   const [profissionalId, setProfissionalId] = useState<string>("");
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<{id: string, nome: string, whatsapp: string} | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    fetchProfissionais().then(profs => {
      const me = profs.find(p => p.nome === barbeiroNome);
      if (me) setProfissionalId(me.id);
    });
  }, [barbeiroNome]);

  const handleCreateAusencia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profissionalId) {
      alert("Erro: ID do profissional não encontrado.");
      return;
    }
    try {
      const startIso = new Date(newInicio).toISOString();
      const endIso = new Date(newFim).toISOString();
      await criarAusencia(profissionalId, startIso, endIso, newMotivo);
      setOpenModal(false);
      setNewInicio("");
      setNewFim("");
      setNewMotivo("");
      alert("Bloqueio registrado com sucesso!");
    } catch (error) {
      alert("Erro ao criar ausência. Verifique as datas.");
    }
  };

  useEffect(() => {
    if (!authLoading && role === "barber" && barberName) {
      const mySlug = barberSlug(barberName);
      if (barbeiro !== mySlug) {
        navigate({ to: `/agenda/${mySlug}` });
      }
    }
  }, [authLoading, role, barberName, barbeiro, navigate]);

  const handleCancel = async (id: string) => {
    if (!confirm("Tem certeza que deseja cancelar este agendamento?")) return;
    try {
      await cancelarAgendamento(id);
      refreshData();
    } catch (error) {
      alert("Erro ao cancelar agendamento.");
    }
  };

  const refreshData = () => {
    setLoading(true);
    fetchLeadsByBarber(barbeiroNome)
      .then((d) => setLeads(d))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setSelectedDay(null);
    setMonthRef(new Date());
    refreshData();
  }, [barbeiroNome]);

  const monthStart = startOfMonth(monthRef);
  const monthEnd = endOfMonth(monthRef);

  const daysGrid = useMemo(() => {
    const start = startOfWeek(monthStart, { weekStartsOn: 0 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [monthRef]);

  const monthLeads = useMemo(
    () =>
      leads.filter(
        (l) =>
          l.data_hora_agendada &&
          isSameMonth(new Date(l.data_hora_agendada), monthRef)
      ),
    [leads, monthRef]
  );

  const totalMes = monthLeads.length;
  const valorMes = monthLeads.reduce((s, l) => s + Number(l.valor_servico ?? 0), 0);

  const proximo = useMemo(() => {
    const now = new Date();
    return [...leads]
      .filter((l) => l.data_hora_agendada && isAfter(new Date(l.data_hora_agendada), now))
      .sort(
        (a, b) =>
          new Date(a.data_hora_agendada!).getTime() -
          new Date(b.data_hora_agendada!).getTime()
      )[0];
  }, [leads]);

  const leadsByDay = useMemo(() => {
    const map = new Map<string, Lead[]>();
    monthLeads.forEach((l) => {
      const k = format(new Date(l.data_hora_agendada!), "yyyy-MM-dd");
      const arr = map.get(k) ?? [];
      arr.push(l);
      map.set(k, arr);
    });
    map.forEach((arr) =>
      arr.sort(
        (a, b) =>
          new Date(a.data_hora_agendada!).getTime() -
          new Date(b.data_hora_agendada!).getTime()
      )
    );
    return map;
  }, [monthLeads]);

  const openClienteDetails = (lead: Lead) => {
    // Como o 'Lead' pode não ter o ID do cliente direto mas tem o whatsapp, 
    // precisamos garantir que temos os dados necessários.
    // Na verdade, o fetchLeadsByBarber retorna o cliente_id no objeto raw que é mapeado para lead.id se for o agendamento_id.
    // No fetchLeadsByBarber, row.id é o agendamento.id.
    // Mas o ClienteDetailsSheet precisa do CLIENTE_ID.
    // Vou olhar o mapToLead de novo.
  };

  const selectedLeads = selectedDay
    ? leadsByDay.get(format(selectedDay, "yyyy-MM-dd")) ?? []
    : [];

  return (
    <div className="px-6 py-8 md:px-10 md:py-10 max-w-[1600px] mx-auto">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-primary mb-2 flex items-center gap-2">
            <Scissors size={12} /> Barbeiro
          </div>
          <h1 className="font-display text-4xl md:text-5xl text-foreground">{barbeiroNome}</h1>
          <p className="text-muted-foreground mt-1 text-sm">Agenda mensal de atendimentos.</p>
        </div>
        
        {/* Modal de Bloqueio de Agenda */}
        <Dialog open={openModal} onOpenChange={setOpenModal}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2 border-border/40 hover:bg-sidebar-accent">
              <CalendarX size={16} /> Bloquear Agenda
            </Button>
          </DialogTrigger>
          <Button 
            className="gap-2 shadow-glow" 
            onClick={() => setIsManualOpen(true)}
          >
            <Plus size={16} /> Agendamento Manual
          </Button>
          <ManualAppointmentModal 
            open={isManualOpen} 
            onOpenChange={setIsManualOpen}
            onSuccess={refreshData}
            defaultBarbeiroNome={barbeiroNome}
          />
          <DialogContent className="sm:max-w-[425px] bg-sidebar border-sidebar-border text-sidebar-foreground">
            <DialogHeader>
              <DialogTitle className="font-display">Bloquear Horário</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateAusencia} className="grid gap-4 py-4">
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
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Agendamentos do mês"
          value={loading ? "…" : totalMes}
          icon={CalendarCheck}
          accent="primary"
          hint={format(monthRef, "MMMM 'de' yyyy", { locale: ptBR })}
        />
        <StatCard
          label="Valor total do mês"
          value={loading ? "…" : formatBRL(valorMes)}
          icon={DollarSign}
          accent="success"
        />
        <StatCard
          label="Próximo agendamento"
          value={proximo?.nome ?? "—"}
          hint={
            proximo?.data_hora_agendada
              ? format(new Date(proximo.data_hora_agendada), "dd/MM 'às' HH:mm", { locale: ptBR })
              : "Nenhum futuro"
          }
          icon={Clock}
          accent="muted"
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-xl border border-border/60 bg-gradient-card p-5 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-2xl text-foreground capitalize">
              {format(monthRef, "MMMM yyyy", { locale: ptBR })}
            </h2>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setMonthRef((m) => subMonths(m, 1))}
              >
                <ChevronLeft size={16} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  setMonthRef(new Date());
                  setSelectedDay(null);
                }}
              >
                Hoje
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setMonthRef((m) => addMonths(m, 1))}
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {daysGrid.map((d) => {
              const inMonth = isSameMonth(d, monthRef);
              const items = leadsByDay.get(format(d, "yyyy-MM-dd")) ?? [];
              const isSelected = selectedDay && isSameDay(d, selectedDay);
              const isToday = isSameDay(d, new Date());
              return (
                <button
                  key={d.toISOString()}
                  onClick={() => setSelectedDay(d)}
                  className={[
                    "relative aspect-square rounded-lg border text-left p-1.5 flex flex-col transition-all",
                    inMonth ? "bg-background/40" : "bg-background/10 opacity-40",
                    isSelected
                      ? "border-primary bg-primary/15 shadow-glow"
                      : items.length > 0
                      ? "border-primary/40 hover:border-primary"
                      : "border-border/40 hover:border-border",
                    isToday && !isSelected ? "ring-1 ring-primary/40" : "",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "text-xs font-medium",
                      isToday ? "text-primary" : inMonth ? "text-foreground" : "text-muted-foreground",
                    ].join(" ")}
                  >
                    {format(d, "d")}
                  </span>
                  {items.length > 0 && (
                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-[10px] text-primary font-semibold">
                        {items.length} {items.length === 1 ? "agend." : "agend."}
                      </span>
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-gradient-card p-5 shadow-card">
          <h3 className="font-display text-xl text-foreground mb-1">
            {selectedDay
              ? format(selectedDay, "dd 'de' MMMM", { locale: ptBR })
              : "Selecione um dia"}
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            {selectedDay
              ? `${selectedLeads.length} agendamento${selectedLeads.length === 1 ? "" : "s"}`
              : "Clique em uma data com agendamentos"}
          </p>

          <div className="space-y-2 max-h-[28rem] overflow-y-auto pr-1">
            {selectedDay && selectedLeads.length === 0 && (
              <div className="text-sm text-muted-foreground italic py-6 text-center">
                Sem agendamentos neste dia.
              </div>
            )}
            {selectedLeads.map((l) => (
              <div
                key={l.identificador_usuario}
                onClick={() => {
                  if (l.cliente_id && l.nome) {
                    setSelectedCliente({
                      id: l.cliente_id,
                      nome: l.nome,
                      whatsapp: l.whatsapp || ""
                    });
                    setIsSheetOpen(true);
                  }
                }}
                className={[
                  "rounded-lg border border-border/60 bg-background/40 p-3 hover:border-primary/40 transition-colors cursor-pointer",
                  l.status === "cancelado" ? "opacity-50 grayscale" : ""
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold text-foreground truncate">
                    {l.nome ?? "Sem nome"}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-primary font-display text-lg tabular-nums">
                      {formatTimeBR(l.data_hora_agendada)}
                    </div>
                    {l.id_agendamento && l.status !== "cancelado" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancel(l.id_agendamento!);
                        }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground truncate">{l.servicos ?? "—"}</span>
                  <span className="text-success font-medium tabular-nums">
                    {l.valor_servico ? formatBRL(l.valor_servico) : "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ClienteDetailsSheet 
        open={isSheetOpen} 
        onOpenChange={setIsSheetOpen}
        cliente={selectedCliente}
        onAgendamentoCancelado={refreshData}
      />
    </div>
  );
}
