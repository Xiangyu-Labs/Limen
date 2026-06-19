"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

  const monthLabel = format(currentMonth, "yyyy年M月");

  return (
    <div className="rounded-[var(--radius-xl)] border border-border/70 bg-surface p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface2 hover:text-text"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-bold tracking-tight text-text">{monthLabel}</span>
        <button
          type="button"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface2 hover:text-text"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {labels.map((label) => (
          <div key={label} className="py-1 text-[10px] font-bold uppercase tracking-wider text-muted">
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
              className={`relative rounded-full py-1.5 text-xs font-medium transition-colors ${
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
  );
}
