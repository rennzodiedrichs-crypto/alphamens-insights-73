import type { LucideIcon } from "lucide-react";

type Props = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: "primary" | "success" | "muted" | "destructive";
  hint?: string;
};

const accents = {
  primary: "from-primary/20 to-primary/5 text-primary border-primary/30",
  success: "from-success/20 to-success/5 text-success border-success/30",
  muted: "from-muted-foreground/15 to-muted-foreground/5 text-muted-foreground border-border",
  destructive: "from-destructive/20 to-destructive/5 text-destructive border-destructive/30",
};

export function StatCard({ label, value, icon: Icon, accent = "primary", hint }: Props) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border/60 bg-gradient-card p-5 shadow-card group hover-lift transition-all duration-300">
      <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${accents[accent]} opacity-20 blur-2xl group-hover:opacity-40 transition-opacity duration-500`} />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">
            {label}
          </div>
          <div className="mt-3 font-display text-4xl text-foreground tracking-tight group-hover:text-primary transition-colors duration-300">{value}</div>
          {hint && <div className="mt-1 text-[10px] text-muted-foreground italic">{hint}</div>}
        </div>
        <div className={`rounded-lg border p-2.5 bg-gradient-to-br ${accents[accent]} group-hover:scale-110 transition-transform duration-300 shadow-sm group-hover:shadow-glow`}>
          <Icon size={20} className="group-hover:rotate-12 transition-transform duration-300" />
        </div>
      </div>
    </div>
  );
}
