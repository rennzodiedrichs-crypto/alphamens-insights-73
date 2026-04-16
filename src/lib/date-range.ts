import {
  startOfDay,
  endOfDay,
  subDays,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
} from "date-fns";

export type DateRange = { from: Date; to: Date };
export type RangePreset =
  | "today"
  | "yesterday"
  | "last7"
  | "last14"
  | "thisMonth"
  | "last2Months"
  | "thisYear"
  | "custom";

export function getPresetRange(preset: RangePreset, ref: Date = new Date()): DateRange {
  switch (preset) {
    case "today":
      return { from: startOfDay(ref), to: endOfDay(ref) };
    case "yesterday": {
      const y = subDays(ref, 1);
      return { from: startOfDay(y), to: endOfDay(y) };
    }
    case "last7":
      return { from: startOfDay(subDays(ref, 6)), to: endOfDay(ref) };
    case "last14":
      return { from: startOfDay(subDays(ref, 13)), to: endOfDay(ref) };
    case "thisMonth":
      return { from: startOfMonth(ref), to: endOfMonth(ref) };
    case "last2Months":
      return { from: startOfMonth(subMonths(ref, 1)), to: endOfMonth(ref) };
    case "thisYear":
      return { from: startOfYear(ref), to: endOfYear(ref) };
    default:
      return { from: startOfDay(ref), to: endOfDay(ref) };
  }
}

export const PRESETS: { value: RangePreset; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "yesterday", label: "Ontem" },
  { value: "last7", label: "Últimos 7 dias" },
  { value: "last14", label: "Últimos 14 dias" },
  { value: "thisMonth", label: "Esse mês" },
  { value: "last2Months", label: "Últimos 2 meses" },
  { value: "thisYear", label: "Esse ano" },
];
