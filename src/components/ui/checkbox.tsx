"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  onCheckedChange?: (checked: boolean) => void;
  checked?: boolean;
  indeterminate?: boolean;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, checked, indeterminate, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement | null>(null);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(event.target.checked);
    };

    React.useEffect(() => {
      if (inputRef.current) {
        inputRef.current.indeterminate = indeterminate || false;
      }
    }, [indeterminate]);

    return (
      <div className="relative">
        <input
          type="checkbox"
          ref={(node) => {
            inputRef.current = node;
            if (ref) {
              if (typeof ref === "function") {
                ref(node);
              } else if (ref && typeof ref === "object" && "current" in ref) {
                (ref as any).current = node;
              }
            }
          }}
          className={cn(
            "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            "appearance-none",
            checked && "bg-primary text-primary-foreground",
            className
          )}
          checked={checked}
          onChange={handleChange}
          {...props}
        />
        {checked && (
          <Check className="absolute inset-0 h-4 w-4 text-primary-foreground pointer-events-none" />
        )}
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
