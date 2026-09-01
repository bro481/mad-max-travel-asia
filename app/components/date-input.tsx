"use client";

import { useEffect, useRef, useState } from "react";
import "./date-input.css";

type DateInputProps = {
  value?: string;
  name?: string;
  label: string;
  placeholder: string;
  preventAutofill?: boolean;
  explicitSelection?: boolean;
  onChange?: (value: string) => void;
};

const pad = (value: number) => String(value).padStart(2, "0");

export function DateInput({ value, name, label, placeholder, preventAutofill = false, explicitSelection = false, onChange }: DateInputProps) {
  const [internalValue, setInternalValue] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const userInteracted = useRef(false);
  const currentValue = value === undefined ? internalValue : value;
  const display = currentValue
    ? `${Number(currentValue.slice(0, 4))}年${Number(currentValue.slice(5, 7))}月${Number(currentValue.slice(8, 10))}日`
    : placeholder;

  useEffect(() => {
    if (!preventAutofill || currentValue || !inputRef.current) return;
    inputRef.current.value = "";
    userInteracted.current = false;
  }, [currentValue, preventAutofill]);

  const markUserInteraction = () => { userInteracted.current = true; };

  const chooseDate = (day: number) => {
    const nextValue = `${visibleMonth.getFullYear()}-${pad(visibleMonth.getMonth() + 1)}-${pad(day)}`;
    if (value === undefined) setInternalValue(nextValue);
    onChange?.(nextValue);
    setCalendarOpen(false);
  };

  if (explicitSelection) {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];
    return <span className="explicit-date-control">
      {name && <input type="hidden" name={name} value={currentValue} />}
      <button type="button" className={currentValue ? "has-value" : ""} aria-label={label} aria-expanded={calendarOpen} onClick={() => {
        if (!calendarOpen && currentValue) {
          const [selectedYear, selectedMonth] = currentValue.split("-").map(Number);
          setVisibleMonth(new Date(selectedYear, selectedMonth - 1, 1));
        }
        setCalendarOpen((open) => !open);
      }}><span>{display}</span><b aria-hidden="true">▣</b></button>
      {calendarOpen && <div className="explicit-calendar">
        <header><button type="button" aria-label="上个月" onClick={() => setVisibleMonth(new Date(year, month - 1, 1))}>‹</button><strong>{year}年{month + 1}月</strong><button type="button" aria-label="下个月" onClick={() => setVisibleMonth(new Date(year, month + 1, 1))}>›</button></header>
        <div className="calendar-week">{["日", "一", "二", "三", "四", "五", "六"].map((day) => <span key={day}>{day}</span>)}</div>
        <div className="calendar-days">{days.map((day, index) => day ? <button type="button" className={currentValue === `${year}-${pad(month + 1)}-${pad(day)}` ? "selected" : ""} onClick={() => chooseDate(day)} key={`${year}-${month}-${day}`}>{day}</button> : <span key={`empty-${index}`} />)}</div>
        <footer><span>请选择具体日期后才会保存</span>{currentValue && <button type="button" onClick={() => { if (value === undefined) setInternalValue(""); onChange?.(""); setCalendarOpen(false); }}>清除日期</button>}</footer>
      </div>}
    </span>;
  }

  return <span className="mobile-date-control">
    <input ref={inputRef} type="date" name={name} value={currentValue} autoComplete={preventAutofill ? "off" : undefined} aria-label={label} onPointerDown={markUserInteraction} onClick={markUserInteraction} onKeyDown={markUserInteraction} onChange={(event) => {
      if (preventAutofill && !userInteracted.current) {
        event.currentTarget.value = currentValue;
        return;
      }
      if (value === undefined) setInternalValue(event.target.value);
      onChange?.(event.target.value);
    }} />
    <span className={currentValue ? "has-value" : ""}>{display}</span>
  </span>;
}
