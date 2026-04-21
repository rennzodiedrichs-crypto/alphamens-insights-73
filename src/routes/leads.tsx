import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, MoonStar, MessageSquare, Phone, Scissors, X, Users } from "lucide-react";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { fetchLeadsInRange, type Lead } from "@/lib/leads";
import { getPresetRange, type DateRange } from "@/lib/date-range";
import { formatBRL, formatDateTimeBR, formatPhone } from "@/lib/format";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { barberSlug } from "@/components/AppSidebar";

export const Route = createFileRoute("/leads")({
  head: () => ({
    meta: [
      { title: "Lista de Leads — AlphaMens Premium" },
      { name: "description", content: "Acompanhe todos os leads recebidos pela AlphaMens." },
    ],
  }),
  component: LeadsPage,
});

function LeadsPage() {
  const { role, barberName, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [range, setRange] = useState<DateRange>(() => getPresetRange("today"));
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Lead | null>(null);

  useEffect(() => {
    if (!authLoading && role === "barber" && barberName) {
      navigate({ to: `/agenda/${barberSlug(barberName)}` });
      return;
    }
  }, [authLoading, role, barberName, navigate]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchLeadsInRange(range.from, range.to)
      .then((d) => active && setLeads(d))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [range.from, range.to]);

  const sorted = useMemo(
    () =>
      [...leads].sort((a, b) => {
        const dateA = new Date(a.inicio_atendimento_em || a.timestamp_ultima_msg || 0).getTime();
        const dateB = new Date(b.inicio_atendimento_em || b.timestamp_ultima_msg || 0).getTime();
        return dateB - dateA;
      }),
    [leads]
  );

  return (
    <div className="px-6 py-8 md:px-10 md:py-10 max-w-[1600px] mx-auto min-h-screen">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4 animate-reveal">
        <div>
          <div className="text-[10px] uppercase tracking-[0.4em] text-primary mb-3 font-bold opacity-80 flex items-center gap-2">
            <Users size={12} /> Audiência
          </div>
          <h1 className="font-display text-5xl md:text-6xl text-foreground tracking-tight leading-none">Lista de Leads</h1>
          <p className="text-muted-foreground mt-3 text-base max-w-lg leading-relaxed">
            Gerenciamento detalhado de clientes e prospects capturados.
          </p>
        </div>
      </header>

      <div className="mb-10 rounded-xl border border-border/40 bg-card/20 p-4 backdrop-blur-sm animate-reveal [animation-delay:100ms]">
        <DateRangeFilter value={range} onChange={setRange} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading
          ? Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="h-44 rounded-2xl border border-border/40 bg-card/10 animate-pulse animate-reveal"
                style={{ animationDelay: `${150 + i * 50}ms` }}
              />
            ))
          : sorted.map((lead, index) => (
              <div
                key={lead.identificador_usuario}
                onClick={() => setSelected(lead)}
                className="glass-panel p-6 rounded-2xl shadow-card hover-lift cursor-pointer animate-reveal group"
                style={{ animationDelay: `${150 + index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 transition-colors">
                      <Users size={24} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display text-2xl text-foreground leading-tight tracking-tight">
                        {lead.nome || "Lead Anônimo"}
                      </h3>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold opacity-60 mt-1">
                        {lead.servicos || "Interessado"}
                      </p>
                    </div>
                  </div>
                  <div className={[
                    "px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-tighter border transition-all",
                    lead.data_hora_agendada 
                      ? "bg-success/15 text-success border-success/30 shadow-glow" 
                      : "bg-background/40 text-muted-foreground border-border/40"
                  ].join(" ")}>
                    {lead.data_hora_agendada ? "Agendado" : "Analise"}
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-border/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold opacity-50 flex items-center gap-2">
                      <Phone size={12} /> Contato
                    </span>
                    <span className="text-sm font-medium tabular-nums text-foreground">
                      {formatPhone(lead.whatsapp)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold opacity-50">
                      Investimento
                    </span>
                    <span className="text-sm font-bold text-primary">
                      {lead.valor_servico ? formatBRL(lead.valor_servico) : "—"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent
          side="left"
          className="w-full sm:max-w-md bg-card border-r border-border overflow-y-auto h-[100dvh] max-h-[100dvh]"
        >
          {selected && (
            <>
              <SheetHeader className="space-y-1 pr-8">
                <div className="text-xs uppercase tracking-widest text-primary">Lead</div>
                <SheetTitle className="font-display text-3xl text-foreground">
                  {selected.nome ?? "Sem nome"}
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <Section title="Informações principais">
                  <Field icon={<Phone size={14} />} label="WhatsApp" value={formatPhone(selected.whatsapp)} />
                  <Field icon={<Scissors size={14} />} label="Serviço" value={selected.servicos ?? "—"} />
                  <Field
                    label="Valor"
                    value={selected.valor_servico ? formatBRL(selected.valor_servico) : "—"}
                    valueClass="text-primary font-semibold"
                  />
                  {selected.status && <Field label="Status" value={selected.status} />}
                </Section>

                <Section title="Agendamento">
                  {selected.data_hora_agendada ? (
                    <>
                      <Field
                        icon={<CalendarCheck size={14} />}
                        label="Data e hora"
                        value={formatDateTimeBR(selected.data_hora_agendada)}
                        valueClass="text-success font-semibold"
                      />
                      <Field label="Barbeiro" value={selected.barbeiro ?? "—"} />
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Lead ainda não agendou.
                    </p>
                  )}
                </Section>

                <Section title="Resumo da conversa" icon={<MessageSquare size={14} className="text-primary" />}>
                  <p className="text-sm leading-relaxed text-foreground/90 bg-background/40 rounded-lg p-3 border border-border/60">
                    {selected.resumo_conversa ?? "Sem resumo disponível."}
                  </p>
                </Section>

                {selected.inicio_atendimento_em && (
                  <div className="text-xs text-muted-foreground pt-2 border-t border-border/60">
                    Início do atendimento: {formatDateTimeBR(selected.inicio_atendimento_em)}
                    {selected.inicio_fora_horario_comercial && (
                      <span className="ml-2 text-primary">• Fora do horário comercial</span>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Section({ title, children, icon }: { title: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2 font-semibold flex items-center gap-1.5">
        {icon} {title}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  icon,
  valueClass,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm py-1.5 border-b border-border/30 last:border-0">
      <span className="text-muted-foreground flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <span className={valueClass ?? "text-foreground font-medium"}>{value}</span>
    </div>
  );
}
