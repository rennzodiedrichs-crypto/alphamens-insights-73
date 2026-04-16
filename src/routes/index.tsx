import { createFileRoute } from "@tanstack/react-router";
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
import { format, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

import { DateRangeFilter } from "@/components/DateRangeFilter";
import { StatCard } from "@/components/StatCard";
import { fetchLeadsInRange, type Lead } from "@/lib/leads";
import { getPresetRange, type DateRange } from "@/lib/date-range";
import { formatBRL } from "@/lib/format";

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
  const [range, setRange] = useState<DateRange>(() => getPresetRange("last7"));
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
    const total = leads.length;
    const agendados = leads.filter((l) => !!l.data_hora_agendada);
    const valorTotal = agendados.reduce((s, l) => s + Number(l.valor_servico ?? 0), 0);
    const semAgenda = total - agendados.length;
    return { total, agendados: agendados.length, valorTotal, semAgenda };
  }, [leads]);

  const dailyData = useMemo(() => {
    const days = eachDayOfInterval({ start: range.from, end: range.to });
    const map = new Map(days.map((d) => [format(d, "yyyy-MM-dd"), 0]));
    leads.forEach((l) => {
      if (!l.inicio_atendimento_em) return;
      const k = format(new Date(l.inicio_atendimento_em), "yyyy-MM-dd");
      if (map.has(k)) map.set(k, (map.get(k) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([k, v]) => ({
      date: format(new Date(k), "dd/MM", { locale: ptBR }),
      leads: v,
    }));
  }, [leads, range]);

  const horaData = useMemo(() => {
    let dentro = 0;
    let fora = 0;
    leads.forEach((l) => {
      if (l.inicio_fora_horario_comercial) fora++;
      else dentro++;
    });
    return [
      { name: "Horário comercial", value: dentro, color: "oklch(0.72 0.18 48)" },
      { name: "Fora do horário", value: fora, color: "oklch(0.55 0.1 60)" },
    ];
  }, [leads]);

  return (
    <div className="px-6 py-8 md:px-10 md:py-10 max-w-[1600px] mx-auto">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-primary mb-2">Dashboard</div>
          <h1 className="font-display text-4xl md:text-5xl text-foreground">Visão Geral</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Acompanhe leads, atendimentos e agendamentos em tempo real.
          </p>
        </div>
      </header>

      <div className="mb-8 rounded-xl border border-border/60 bg-card/40 p-4">
        <DateRangeFilter value={range} onChange={setRange} />
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Erro ao carregar dados: {error}
        </div>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard label="Total de leads" value={loading ? "…" : stats.total} icon={Users} accent="primary" />
        <StatCard label="Agendamentos" value={loading ? "…" : stats.agendados} icon={CalendarCheck} accent="success" />
        <StatCard label="Valor agendado" value={loading ? "…" : formatBRL(stats.valorTotal)} icon={DollarSign} accent="primary" />
        <StatCard label="Sem agendamento" value={loading ? "…" : stats.semAgenda} icon={CalendarX} accent="muted" />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-xl border border-border/60 bg-gradient-card p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-2xl text-foreground flex items-center gap-2">
                <TrendingUp size={20} className="text-primary" />
                Leads por dia
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Baseado em início do atendimento
              </p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.014 60)" />
                <XAxis dataKey="date" stroke="oklch(0.7 0.015 70)" fontSize={11} />
                <YAxis stroke="oklch(0.7 0.015 70)" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.21 0.014 60)",
                    border: "1px solid oklch(0.3 0.014 60)",
                    borderRadius: 8,
                    color: "oklch(0.96 0.01 80)",
                  }}
                  cursor={{ stroke: "oklch(0.72 0.18 48)", strokeWidth: 1 }}
                />
                <Line
                  type="monotone"
                  dataKey="leads"
                  stroke="oklch(0.72 0.18 48)"
                  strokeWidth={2.5}
                  dot={{ fill: "oklch(0.72 0.18 48)", r: 3 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-gradient-card p-6 shadow-card">
          <div className="mb-4">
            <h2 className="font-display text-2xl text-foreground flex items-center gap-2">
              <Clock size={20} className="text-primary" />
              Atendimento 24h
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Eficácia do bot fora do horário
            </p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={horaData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {horaData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} stroke="oklch(0.16 0.012 60)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.21 0.014 60)",
                    border: "1px solid oklch(0.3 0.014 60)",
                    borderRadius: 8,
                    color: "oklch(0.96 0.01 80)",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ fontSize: 11, color: "oklch(0.7 0.015 70)" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}
