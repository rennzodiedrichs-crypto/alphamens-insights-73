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
    <div className="relative overflow-hidden rounded-xl border border-border/60 bg-gradient-card p-4 shadow-card group hover-lift transition-all duration-300 min-h-[100px] flex flex-col justify-between">
      <div className={`absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${accents[accent]} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity duration-500`} />
      
      <div className="relative flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold opacity-80">
            {label}
          </p>
          <h3 className="font-display text-2xl text-foreground tracking-tight group-hover:text-primary transition-colors duration-300">
            {value}
          </h3>
          {hint && <p className="text-[9px] text-muted-foreground italic mt-1 opacity-60">{hint}</p>}
        </div>
        
        <div className={`rounded-lg border p-2 bg-gradient-to-br ${accents[accent]} group-hover:scale-110 transition-transform duration-300 shadow-sm group-hover:shadow-glow relative z-10`}>
          <Icon size={18} className="group-hover:rotate-12 transition-transform duration-300" />
        </div>
      </div>
    </div>
  );
}
