"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";

interface CalendarFilterProps {
  datesWithEntries: string[];
  selectedDate?: string;
}

const weekDayLabelsZh = ["日", "一", "二", "三", "四", "五", "六"];

function formatSelectedDateLabel(date?: string) {
  if (!date) return "日期";
  return format(new Date(`${date}T00:00:00`), "M月d日");
}

export function CalendarFilter({ datesWithEntries, selectedDate }: CalendarFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const dateSet = new Set(datesWithEntries);
  const labels = weekDayLabelsZh;

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const handleDateClick = (day: Date) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const params = new URLSearchParams(searchParams.toString());
    if (selectedDate === dateStr) {
      params.delete("date");
    } else {
      params.set("date", dateStr);
    }
    router.push(`?${params.toString()}`);
  };

  const clearDate = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("date");
    const serialized = params.toString();
    router.push(serialized ? `?${serialized}` : "?");
  };

  const monthLabel = format(currentMonth, "yyyy年M月");

  return (
    <details className="group relative shrink-0">
      <summary className="flex h-10 cursor-pointer list-none items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 text-sm text-text transition-colors hover:bg-surface2 marker:hidden sm:min-w-36 [&::-webkit-details-marker]:hidden">
        <span className="inline-flex min-w-0 items-center gap-2">
          <CalendarDays className="h-4 w-4 shrink-0 text-muted" />
          <span className="truncate">{formatSelectedDateLabel(selectedDate)}</span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180" />
      </summary>

      <div className="absolute right-0 z-20 mt-2 w-[min(calc(100vw-2rem),22rem)] rounded-lg border border-border bg-surface p-3">
        {selectedDate && (
          <div className="mb-2 flex justify-end">
            <button
              type="button"
              onClick={clearDate}
              className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs text-muted transition-colors hover:bg-surface2 hover:text-text"
            >
              <X className="h-3.5 w-3.5" />
              清除
            </button>
          </div>
        )}

        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface2 hover:text-text"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium tracking-tight text-text">{monthLabel}</span>
          <button
            type="button"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface2 hover:text-text"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {labels.map((label) => (
            <div key={label} className="py-1 text-[11px] font-medium text-muted">
              {label}
            </div>
          ))}
          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const hasEntry = dateSet.has(dateStr);
            const isSelected = selectedDate === dateStr;
            const isCurrentMonth = isSameMonth(day, currentMonth);

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => handleDateClick(day)}
                className={`relative h-9 rounded-md text-xs font-medium transition-colors ${
                  isSelected
                    ? "bg-primary text-white"
                    : isCurrentMonth
                      ? "text-text hover:bg-surface2"
                      : "text-muted/40"
                }`}
              >
                {format(day, "d")}
                {hasEntry && !isSelected && (
                  <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </details>
  );
}
