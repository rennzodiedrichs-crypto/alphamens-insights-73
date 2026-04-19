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
        {(() => {
          let isAnyPresetActive = false;
          const buttons = PRESETS.map((p) => {
            const range = getPresetRange(p.value);
            const isActive =
              range.from.getTime() === value.from.getTime() &&
              range.to.getTime() === value.to.getTime();

            if (isActive) isAnyPresetActive = true;

            return (
              <Button
                key={p.value}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => applyPreset(p.value)}
                className={cn(
                  "h-8 text-xs transition-all duration-300",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-glow scale-105 z-10"
                    : "border-border/60 bg-card/40 text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/40"
                )}
              >
                {p.label}
              </Button>
            );
          });
          return { buttons, isAnyPresetActive };
        })().buttons}
      </div>

      {/* Re-calculate for the popover or use the same logic */}
      {(() => {
        let isAnyPresetActive = false;
        PRESETS.forEach((p) => {
          const range = getPresetRange(p.value);
          if (
            range.from.getTime() === value.from.getTime() &&
            range.to.getTime() === value.to.getTime()
          ) {
            isAnyPresetActive = true;
          }
        });

        return (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-8 gap-2 text-xs transition-all duration-300",
                  !isAnyPresetActive
                    ? "border-primary bg-primary/20 text-primary font-bold shadow-glow"
                    : "border-primary/40 bg-primary/5 text-foreground hover:bg-primary/15"
                )}
              >
                <CalendarIcon
                  size={14}
                  className={cn(
                    "transition-colors",
                    !isAnyPresetActive ? "text-primary" : "text-primary/60"
                  )}
                />
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
        );
      })()}
    </div>
  );
}
