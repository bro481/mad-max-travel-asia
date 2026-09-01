"use client";

import { useEffect, useRef, useState } from "react";
import "./date-input.css";

type DateInputProps = {
  value?: string;
  name?: string;
  label: string;
  placeholder: string;
  preventAutofill?: boolean;
  onChange?: (value: string) => void;
};

export function DateInput({ value, name, label, placeholder, preventAutofill = false, onChange }: DateInputProps) {
  const [internalValue, setInternalValue] = useState("");
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
