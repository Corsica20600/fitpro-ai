"use client";

import { useId, useMemo, useState } from "react";

export type BrandSelectOption = {
  value: string;
  label: string;
};

type BrandSelectProps = {
  id?: string;
  name?: string;
  options: BrandSelectOption[];
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onValueChange?: (value: string) => void;
};

export function BrandSelect({
  id,
  name,
  options,
  value,
  defaultValue,
  placeholder = "Selectionner",
  className = "",
  disabled = false,
  onValueChange,
}: BrandSelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const fallbackValue = defaultValue ?? options[0]?.value ?? "";
  const [internalValue, setInternalValue] = useState(fallbackValue);
  const [open, setOpen] = useState(false);
  const currentValue = value ?? internalValue;
  const selectedOption = useMemo(
    () => options.find((option) => option.value === currentValue) ?? null,
    [currentValue, options],
  );

  function choose(nextValue: string) {
    setInternalValue(nextValue);
    onValueChange?.(nextValue);
    setOpen(false);
  }

  return (
    <div className={`brand-select ${open ? "is-open" : ""} ${className}`.trim()}>
      {name ? <input type="hidden" name={name} value={currentValue} /> : null}
      <button
        id={selectId}
        type="button"
        className="brand-select__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selectedOption?.label ?? placeholder}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m7 10 5 5 5-5" />
        </svg>
      </button>
      {open ? (
        <div className="brand-select__menu" role="listbox" aria-labelledby={selectId}>
          {options.map((option) => {
            const active = option.value === currentValue;
            return (
              <button
                key={option.value}
                type="button"
                className={`brand-select__option ${active ? "is-selected" : ""}`}
                role="option"
                aria-selected={active}
                onClick={() => choose(option.value)}
              >
                <span>{option.label}</span>
                <span className="brand-select__radio" aria-hidden="true" />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
