"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Context for accordion state
interface AccordionContextType {
  openItems: string[];
  toggleItem: (itemValue: string) => void;
  type: "single" | "multiple";
  collapsible?: boolean;
}

const AccordionContext = React.createContext<AccordionContextType | null>(null);

const useAccordion = () => {
  const context = React.useContext(AccordionContext);
  if (!context) {
    throw new Error("useAccordion must be used within an Accordion");
  }
  return context;
};

interface AccordionProps {
  children: React.ReactNode;
  type: "single" | "multiple";
  collapsible?: boolean;
  defaultValue?: string | string[];
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
}

const Accordion = ({
  children,
  type,
  collapsible = false,
  defaultValue,
  value,
  onValueChange,
}: AccordionProps) => {
  const [internalOpenItems, setInternalOpenItems] = React.useState<string[]>(
    Array.isArray(defaultValue)
      ? defaultValue
      : defaultValue
      ? [defaultValue]
      : []
  );

  const isControlled = value !== undefined;
  const openItems = isControlled
    ? Array.isArray(value)
      ? value
      : value
      ? [value]
      : []
    : internalOpenItems;

  const setOpenItems = React.useCallback(
    (newItems: React.SetStateAction<string[]>) => {
      const resolvedItems =
        typeof newItems === "function" ? newItems(openItems) : newItems;
      if (!isControlled) setInternalOpenItems(resolvedItems);
      onValueChange?.(
        type === "single" ? resolvedItems[0] || "" : resolvedItems
      );
    },
    [isControlled, openItems, onValueChange, type]
  );

  const toggleItem = React.useCallback(
    (itemValue: string) => {
      if (type === "single") {
        if (openItems.includes(itemValue)) {
          if (collapsible) setOpenItems([]);
        } else {
          setOpenItems([itemValue]);
        }
      } else {
        if (openItems.includes(itemValue)) {
          setOpenItems(openItems.filter((item) => item !== itemValue));
        } else {
          setOpenItems([...openItems, itemValue]);
        }
      }
    },
    [type, openItems, collapsible, setOpenItems]
  );

  return (
    <AccordionContext.Provider
      value={{ openItems, toggleItem, type, collapsible }}
    >
      <div className="space-y-0">
        {React.Children.map(children, (child, index) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              value: child.props.value || `item-${index}`,
            });
          }
          return child;
        })}
      </div>
    </AccordionContext.Provider>
  );
};

interface AccordionItemProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ className, children, value, ...props }, ref) => (
    <div ref={ref} className={cn("border-b", className)} {...props}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { itemValue: value });
        }
        return child;
      })}
    </div>
  )
);
AccordionItem.displayName = "AccordionItem";

interface AccordionTriggerProps {
  children: React.ReactNode;
  className?: string;
  itemValue?: string;
}

const AccordionTrigger = React.forwardRef<
  HTMLButtonElement,
  AccordionTriggerProps
>(({ className, children, itemValue, ...props }, ref) => {
  const { openItems, toggleItem } = useAccordion();
  const isOpen = itemValue ? openItems.includes(itemValue) : false;

  return (
    <button
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline",
        className
      )}
      onClick={() => itemValue && toggleItem(itemValue)}
      {...props}
    >
      {children}
      <ChevronDown
        className={cn(
          "h-4 w-4 shrink-0 transition-transform duration-200",
          isOpen && "rotate-180"
        )}
      />
    </button>
  );
});
AccordionTrigger.displayName = "AccordionTrigger";

interface AccordionContentProps {
  children: React.ReactNode;
  className?: string;
  itemValue?: string;
}

const AccordionContent = React.forwardRef<
  HTMLDivElement,
  AccordionContentProps
>(({ className, children, itemValue, ...props }, ref) => {
  const { openItems } = useAccordion();
  const isOpen = itemValue ? openItems.includes(itemValue) : false;

  return (
    <div
      ref={ref}
      className={cn(
        "overflow-hidden text-sm transition-all duration-300",
        isOpen ? "animate-accordion-down" : "animate-accordion-up",
        className
      )}
      style={{
        display: isOpen ? "block" : "none",
      }}
      {...props}
    >
      <div className={cn("pb-4 pt-0", className)}>{children}</div>
    </div>
  );
});
AccordionContent.displayName = "AccordionContent";

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
