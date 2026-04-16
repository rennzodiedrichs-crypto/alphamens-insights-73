import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, MoonStar, MessageSquare, Phone, Scissors, X } from "lucide-react";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { fetchLeadsInRange, type Lead } from "@/lib/leads";
import { getPresetRange, type DateRange } from "@/lib/date-range";
import { formatBRL, formatDateTimeBR, formatPhone } from "@/lib/format";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

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
  const [range, setRange] = useState<DateRange>(() => getPresetRange("today"));
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Lead | null>(null);

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
      [...leads].sort(
        (a, b) =>
          new Date(b.inicio_atendimento_em ?? 0).getTime() -
          new Date(a.inicio_atendimento_em ?? 0).getTime()
      ),
    [leads]
  );

  return (
    <div className="px-6 py-8 md:px-10 md:py-10 max-w-[1600px] mx-auto">
      <header className="mb-8">
        <div className="text-xs uppercase tracking-[0.3em] text-primary mb-2">Leads</div>
        <h1 className="font-display text-4xl md:text-5xl text-foreground">Lista de Leads</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Clique em um lead para ver detalhes da conversa.
        </p>
      </header>

      <div className="mb-6 rounded-xl border border-border/60 bg-card/40 p-4">
        <DateRangeFilter value={range} onChange={setRange} />
      </div>

      <div className="rounded-xl border border-border/60 bg-gradient-card overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-card/60">
                <th className="text-left font-medium text-xs uppercase tracking-wider text-muted-foreground px-4 py-3">
                  Nome
                </th>
                <th className="text-left font-medium text-xs uppercase tracking-wider text-muted-foreground px-4 py-3">
                  WhatsApp
                </th>
                <th className="text-left font-medium text-xs uppercase tracking-wider text-muted-foreground px-4 py-3">
                  Serviço
                </th>
                <th className="text-right font-medium text-xs uppercase tracking-wider text-muted-foreground px-4 py-3">
                  Valor
                </th>
                <th className="text-left font-medium text-xs uppercase tracking-wider text-muted-foreground px-4 py-3">
                  Indicadores
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    Carregando leads…
                  </td>
                </tr>
              )}
              {!loading && sorted.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    Nenhum lead nesse período.
                  </td>
                </tr>
              )}
              {!loading &&
                sorted.map((l) => (
                  <tr
                    key={l.identificador_usuario}
                    onClick={() => setSelected(l)}
                    className="border-b border-border/30 hover:bg-primary/5 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3.5 font-medium text-foreground">
                      {l.nome ?? "—"}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground tabular-nums">
                      {formatPhone(l.whatsapp)}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">
                      {l.servicos ?? "—"}
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums font-medium text-foreground">
                      {l.valor_servico ? formatBRL(l.valor_servico) : "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1.5">
                        {l.data_hora_agendada && (
                          <Badge className="bg-success/15 text-success border-success/30 hover:bg-success/15 gap-1">
                            <CalendarCheck size={10} /> Agendado
                          </Badge>
                        )}
                        {l.inicio_fora_horario_comercial && (
                          <Badge className="bg-primary/15 text-primary border-primary/30 hover:bg-primary/15 gap-1">
                            <MoonStar size={10} /> Fora do horário
                          </Badge>
                        )}
                        {l.status && (
                          <Badge variant="outline" className="border-border text-muted-foreground">
                            {l.status}
                          </Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent
          side="left"
          className="w-full sm:max-w-md bg-card border-r border-border overflow-y-auto"
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
