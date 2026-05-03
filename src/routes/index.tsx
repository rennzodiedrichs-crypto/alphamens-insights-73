import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Users,
  CalendarCheck,
  DollarSign,
  CalendarX,
  TrendingUp,
  Clock,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { format, eachDayOfInterval, parseISO, subDays, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

import { DateRangeFilter } from "@/components/DateRangeFilter";
import { StatCard } from "@/components/StatCard";
import { fetchLeadsInRange, type Lead } from "@/lib/leads";
import { getPresetRange, type DateRange } from "@/lib/date-range";
import { formatBRL } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";
import { barberSlug } from "@/components/AppSidebar";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — AlphaMens Premium" },
      { name: "description", content: "Visão geral de leads e agendamentos da AlphaMens." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { role, barberName, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [range, setRange] = useState<DateRange>(() => getPresetRange("last7"));
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && role === "barber" && barberName) {
      navigate({ to: `/agenda/${barberSlug(barberName)}` });
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);
    fetchLeadsInRange(range.from, range.to)
      .then((d) => {
        if (active) setLeads(d);
      })
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [range.from, range.to]);

  const stats = useMemo(() => {
    const validLeads = leads.filter(l => l.status?.toLowerCase().trim() !== "cancelado");
    const total = validLeads.length;
    const agendados = validLeads.filter((l) => !!l.data_hora_agendada);
    const valorTotal = agendados.reduce((s, l) => s + Number(l.valor_servico ?? 0), 0);
    const semAgenda = total - agendados.length;
    return { total, agendados: agendados.length, valorTotal, semAgenda };
  }, [leads]);

  const dailyData = useMemo(() => {
    // Mostrar dos últimos 7 dias até os próximos 7 dias para ver a agenda futura
    const start = subDays(new Date(), 7);
    const end = addDays(new Date(), 7);
    const days = eachDayOfInterval({ start, end });
    const map = new Map(days.map((d) => [format(d, "yyyy-MM-dd"), 0]));
    
    leads.forEach((l) => {
      if (l.status?.toLowerCase().trim() === "cancelado") return;

      const rawDate = l.data_hora_agendada || l.inicio_atendimento_em || l.timestamp_ultima_msg;
      if (!rawDate) return;

      const datePart = rawDate.substring(0, 10); 
      if (map.has(datePart)) {
        map.set(datePart, (map.get(datePart) ?? 0) + 1);
      }
    });
    
    return Array.from(map.entries()).map(([k, v]) => ({
      date: format(parseISO(k + "T12:00:00"), "dd/MM", { locale: ptBR }),
      leads: v,
    }));
  }, [leads]);

  const horaData = useMemo(() => {
    let dentro = 0;
    let fora = 0;
    leads.forEach((l) => {
      if (l.inicio_fora_horario_comercial) fora++;
      else dentro++;
    });
    return [
      { name: "Horário comercial", value: dentro, color: "oklch(0.65 0.15 45)" }, // Laranja forte
      { name: "Fora do horário", value: fora, color: "oklch(0.45 0.05 45)" }, // Tom mais escuro e sóbrio
    ];
  }, [leads]);

  return (
    <div className="legacy-font-section px-4 py-6 md:px-8 md:py-8 max-w-[1600px] mx-auto overflow-hidden">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4 animate-reveal">
        <div>
          <div className="text-[10px] uppercase tracking-[0.4em] text-primary mb-1 font-bold opacity-80">Dashboard Intuitivo</div>
          <h1 className="font-display text-3xl text-foreground tracking-tight leading-none">Visão Geral</h1>
          <p className="text-muted-foreground mt-1 text-xs max-w-lg leading-relaxed">
            Gestão estratégica de clientes, atendimentos e agendamentos com métricas em tempo real.
          </p>
        </div>
      </header>

      <div className="mb-6 rounded-xl border border-border/40 bg-card/20 p-2 backdrop-blur-sm animate-reveal [animation-delay:100ms]">
        <DateRangeFilter value={range} onChange={setRange} />
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Erro ao carregar dados: {error}
        </div>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <div className="animate-reveal [animation-delay:150ms]">
          <StatCard label="Total de clientes" value={loading ? "…" : stats.total} icon={Users} accent="primary" />
        </div>
        <div className="animate-reveal [animation-delay:200ms]">
          <StatCard label="Agendamentos" value={loading ? "…" : stats.agendados} icon={CalendarCheck} accent="success" />
        </div>
        <div className="animate-reveal [animation-delay:250ms]">
          <StatCard label="Valor agendado" value={loading ? "…" : formatBRL(stats.valorTotal)} icon={DollarSign} accent="primary" />
        </div>
        <div className="animate-reveal [animation-delay:300ms]">
          <StatCard label="Sem agendamento" value={loading ? "…" : stats.semAgenda} icon={CalendarX} accent="muted" />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-7 rounded-2xl shadow-card animate-reveal [animation-delay:400ms]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-3xl text-foreground flex items-center gap-3 tracking-tight">
                <TrendingUp size={24} className="text-primary" />
                Clientes por dia
              </h2>
              <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest font-semibold opacity-60">
                Frequência de novos atendimentos
              </p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData} margin={{ top: 20, right: 30, left: -10, bottom: 10 }}>
                <defs>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.014 60 / 0.3)" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="oklch(0.7 0.015 70 / 0.5)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  stroke="oklch(0.7 0.015 70 / 0.5)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  domain={[0, 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.18 0.012 60 / 0.95)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid oklch(0.3 0.014 60)",
                    borderRadius: 12,
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.5)",
                    padding: "12px",
                  }}
                  itemStyle={{ color: "var(--color-primary)", fontSize: "12px", fontWeight: "bold" }}
                  labelStyle={{ color: "white", fontSize: "14px", marginBottom: "4px", fontWeight: "bold" }}
                  cursor={{ stroke: "var(--color-primary)", strokeWidth: 1, strokeDasharray: "4 4" }}
                />
                <Line
                  type="monotone"
                  dataKey="leads"
                  stroke="var(--color-primary)"
                  strokeWidth={3}
                  dot={{ fill: "var(--color-primary)", r: 4, strokeWidth: 2, stroke: "var(--color-background)" }}
                  activeDot={{ r: 7, strokeWidth: 0, fill: "var(--color-primary)" }}
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-7 rounded-2xl shadow-card animate-reveal [animation-delay:500ms]">
          <div className="mb-6">
            <h2 className="font-display text-3xl text-foreground flex items-center gap-3 tracking-tight">
              <Clock size={24} className="text-primary" />
              Ciclo 24h
            </h2>
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest font-semibold opacity-60">
              Conversão fora do horário
            </p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={horaData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  animationBegin={500}
                  animationDuration={1200}
                  stroke="none"
                >
                  {horaData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={entry.color}
                      className="hover:brightness-125 transition-all cursor-pointer focus:outline-none"
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => {
                    const numValue = Number(value);
                    const total = horaData.reduce((acc, curr) => acc + curr.value, 0);
                    const percent = total > 0 ? ((numValue / total) * 100).toFixed(1) : 0;
                    return [`${numValue} leads (${percent}%)`, ""];
                  }}
                  contentStyle={{
                    background: "oklch(0.18 0.012 60 / 0.95)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid oklch(0.3 0.014 60)",
                    borderRadius: 12,
                    padding: "10px",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.5)",
                  }}
                  itemStyle={{ fontSize: "12px", fontWeight: "bold", color: "white" }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, fontWeight: "500", paddingTop: "20px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}
