import React, { useState, useRef, useEffect } from "react";

interface SelectFieldProps {
  value: string | null | undefined;
  options: { id: string; name: string }[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SelectField({
  value,
  options,
  onChange,
  placeholder = "Select an option",
  className = "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
}: SelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((option) => option.id === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`${className} justify-between`}
      >
        <span
          className={
            selectedOption ? "text-foreground" : "text-muted-foreground"
          }
        >
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-muted-foreground transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isOpen && (
        <ul className="absolute z-50 w-full mt-1 bg-background border border-input rounded-md shadow-lg max-h-60 overflow-auto">
          <li
            onClick={() => {
              onChange("");
              setIsOpen(false);
            }}
            className="px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
          >
            {placeholder}
          </li>
          {options.map((option) => (
            <li
              key={option.id}
              onClick={() => {
                onChange(option.id);
                setIsOpen(false);
              }}
              className="px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
            >
              {option.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}