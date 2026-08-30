"use client";

import { useState } from "react";
import "./date-input.css";

type DateInputProps = {
  value?: string;
  name?: string;
  label: string;
  placeholder: string;
  onChange?: (value: string) => void;
};

export function DateInput({ value, name, label, placeholder, onChange }: DateInputProps) {
  const [internalValue, setInternalValue] = useState("");
  const currentValue = value === undefined ? internalValue : value;
  const display = currentValue
    ? `${Number(currentValue.slice(0, 4))}年${Number(currentValue.slice(5, 7))}月${Number(currentValue.slice(8, 10))}日`
    : placeholder;

  return <span className="mobile-date-control">
    <input type="date" name={name} value={currentValue} aria-label={label} onChange={(event) => {
      if (value === undefined) setInternalValue(event.target.value);
      onChange?.(event.target.value);
    }} />
    <span className={currentValue ? "has-value" : ""}>{display}</span>
  </span>;
}
