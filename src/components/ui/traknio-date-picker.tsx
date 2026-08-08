"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

type TraknioDatePickerProps = {
  name?: string;
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
};

const weekdays = ["L", "M", "M", "J", "V", "S", "D"];

function dateFromInput(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)
    ? new Date(year, month - 1, day)
    : new Date();
}

function inputFromDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sameDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

export function TraknioDatePicker({ name, value, onValueChange, disabled = false, className = "" }: TraknioDatePickerProps) {
  const pickerId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedDate = useMemo(() => dateFromInput(value), [value]);
  const [month, setMonth] = useState(() => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function closeFromOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    function closeFromEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", closeFromOutside);
    document.addEventListener("keydown", closeFromEscape);
    return () => {
      document.removeEventListener("mousedown", closeFromOutside);
      document.removeEventListener("keydown", closeFromEscape);
    };
  }, [open]);

  const days = useMemo(() => {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const firstVisibleDay = new Date(month.getFullYear(), month.getMonth(), 1 - startOffset);
    return Array.from({ length: 42 }, (_, index) => new Date(firstVisibleDay.getFullYear(), firstVisibleDay.getMonth(), firstVisibleDay.getDate() + index));
  }, [month]);
  const label = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(selectedDate);
  const monthLabel = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(month);

  function selectDate(date: Date) {
    onValueChange(inputFromDate(date));
    setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    setOpen(false);
  }

  function shiftMonth(amount: number) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  }

  return (
    <div ref={rootRef} className={`traknio-date-picker ${open ? "is-open" : ""} ${className}`.trim()}>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <button
        id={pickerId}
        type="button"
        className="traknio-date-picker__trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{label}</span><span aria-hidden="true">▾</span>
      </button>
      {open ? (
        <div className="traknio-date-picker__popover" role="dialog" aria-labelledby={pickerId}>
          <div className="traknio-date-picker__head">
            <button type="button" aria-label="Mois précédent" onClick={() => shiftMonth(-1)}>‹</button>
            <strong>{monthLabel}</strong>
            <button type="button" aria-label="Mois suivant" onClick={() => shiftMonth(1)}>›</button>
          </div>
          <div className="traknio-date-picker__weekdays" aria-hidden="true">{weekdays.map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div>
          <div className="traknio-date-picker__days">
            {days.map((date) => {
              const currentMonth = date.getMonth() === month.getMonth();
              const selected = sameDay(date, selectedDate);
              return <button key={inputFromDate(date)} type="button" className={`${currentMonth ? "" : "is-outside"} ${selected ? "is-selected" : ""}`.trim()} aria-pressed={selected} onClick={() => selectDate(date)}>{date.getDate()}</button>;
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
