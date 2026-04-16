import { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { PRESETS, getPresetRange, type DateRange, type RangePreset } from "@/lib/date-range";
import { startOfDay, endOfDay } from "date-fns";

type Props = {
  value: DateRange;
  onChange: (r: DateRange) => void;
};

export function DateRangeFilter({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const applyPreset = (p: RangePreset) => {
    onChange(getPresetRange(p));
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <Button
            key={p.value}
            variant="outline"
            size="sm"
            onClick={() => applyPreset(p.value)}
            className="h-8 text-xs border-border/60 bg-card/40 hover:bg-primary/10 hover:text-primary hover:border-primary/40"
          >
            {p.label}
          </Button>
        ))}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 gap-2 text-xs border-primary/40 bg-primary/5 text-foreground hover:bg-primary/15"
            )}
          >
            <CalendarIcon size={14} className="text-primary" />
            {format(value.from, "dd/MM/yy", { locale: ptBR })} —{" "}
            {format(value.to, "dd/MM/yy", { locale: ptBR })}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            defaultMonth={value.from}
            selected={{ from: value.from, to: value.to }}
            onSelect={(r) => {
              if (r?.from && r?.to) {
                onChange({ from: startOfDay(r.from), to: endOfDay(r.to) });
                setOpen(false);
              }
            }}
            numberOfMonths={2}
            locale={ptBR}
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
