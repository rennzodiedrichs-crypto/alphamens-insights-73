import { createFileRoute, notFound } from "@tanstack/react-router";
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
} from "lucide-react";
import { fetchLeadsByBarber, type Lead } from "@/lib/leads";
import { BARBER_LIST, barberSlug } from "@/components/AppSidebar";
import { StatCard } from "@/components/StatCard";
import { formatBRL, formatTimeBR } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/agenda/$barbeiro")({
  beforeLoad: ({ params }) => {
    const match = BARBER_LIST.find((b) => barberSlug(b) === params.barbeiro);
    if (!match) throw notFound();
    return { barbeiroNome: match };
  },
  head: ({ params }) => {
    const match = BARBER_LIST.find((b) => barberSlug(b) === params.barbeiro);
    return {
      meta: [
        { title: `Agenda ${match ?? ""} — AlphaMens Premium` },
        { name: "description", content: `Agenda mensal do barbeiro ${match ?? ""}.` },
      ],
    };
  },
  component: AgendaPage,
});

function AgendaPage() {
  const { barbeiro } = Route.useParams();
  const barbeiroNome = BARBER_LIST.find((b) => barberSlug(b) === barbeiro)!;

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthRef, setMonthRef] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    
    // Reset local states when barber changes to ensure isolation
    setSelectedDay(null);
    setMonthRef(new Date());

    fetchLeadsByBarber(barbeiroNome)
      .then((d) => active && setLeads(d))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
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
                className="rounded-lg border border-border/60 bg-background/40 p-3 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold text-foreground truncate">
                    {l.nome ?? "Sem nome"}
                  </div>
                  <div className="text-primary font-display text-lg tabular-nums">
                    {formatTimeBR(l.data_hora_agendada)}
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
    </div>
  );
}
