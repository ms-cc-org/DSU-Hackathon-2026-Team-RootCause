"use client";

import { useEffect, useRef, useState } from "react";

export type SelectOption = { value: string; label: string };

// A dropdown that matches the rest of the page (instead of the grey browser one)
export default function Select({
  value,
  options,
  onChange,
  ariaLabel,
  id,
}: {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  ariaLabel?: string;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];

  // Close the list when the user clicks somewhere else on the page
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (box.current && !box.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function pick(newValue: string) {
    onChange(newValue);
    setOpen(false);
  }

  return (
    <div
      className={open ? "fw-select is-open" : "fw-select"}
      ref={box}
      onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}
    >
      <button
        type="button"
        id={id}
        className="fw-select-button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={selected?.label}
        onClick={() => setOpen(!open)}
      >
        <span className="fw-select-value">{selected?.label}</span>
        <svg className="fw-select-chevron" viewBox="0 0 12 8" aria-hidden="true">
          <path d="M1 1.5 6 6.5 11 1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      </button>

      {open && (
        <ul className="fw-select-list" role="listbox">
          {options.map((option) => (
            <li key={option.value} role="option" aria-selected={option.value === value}>
              <button
                type="button"
                className={option.value === value ? "fw-select-option is-selected" : "fw-select-option"}
                onClick={() => pick(option.value)}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
