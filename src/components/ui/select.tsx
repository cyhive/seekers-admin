'use client'

import * as React from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

// Context to manage the state of the select component
interface SelectContextProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedValue: string | undefined;
  setSelectedValue: (value: string) => void;
  selectedLabel: React.ReactNode;
  setSelectedLabel: (label: React.ReactNode) => void;
}

const SelectContext = React.createContext<SelectContextProps | null>(null);

const useSelect = () => {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error("useSelect must be used within a Select provider");
  }
  return context;
};

// Main Select component that provides the context
const Select = ({
  children,
  onValueChange,
  defaultValue,
}: {
  children: React.ReactNode;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedValue, setSelectedValueState] = React.useState<string | undefined>(defaultValue);
  const [selectedLabel, setSelectedLabel] = React.useState<React.ReactNode>(
    () => {
        const defaultChild = React.Children.toArray(children).find(child => 
            React.isValidElement(child) && 
            child.props.children
        );
        if (React.isValidElement(defaultChild)) {
            const items = React.Children.toArray(defaultChild.props.children).filter(child => 
                React.isValidElement(child) && child.props.value === defaultValue
            );
            if (items.length > 0 && React.isValidElement(items[0])) {
                return items[0].props.children;
            }
        }
        return null;
    }
  );
  const selectRef = React.useRef<HTMLDivElement>(null);

  const setSelectedValue = (value: string) => {
    setSelectedValueState(value);
    if (onValueChange) {
      onValueChange(value);
    }
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <SelectContext.Provider
      value={{ isOpen, setIsOpen, selectedValue, setSelectedValue, selectedLabel, setSelectedLabel }}
    >
      <div ref={selectRef} className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
};

const SelectGroup = ({ children }: { children: React.ReactNode }) => <>{children}</>;

const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  const { selectedLabel } = useSelect();
  return <>{selectedLabel || placeholder}</>;
};

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  { className?: string; children: React.ReactNode }
>(({ className, children, ...props }, ref) => {
  const { setIsOpen } = useSelect();
  return (
    <button
      ref={ref}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      onClick={() => setIsOpen(prev => !prev)}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
});
SelectTrigger.displayName = 'SelectTrigger';

const SelectContent = React.forwardRef<
  HTMLDivElement,
  { className?: string; children: React.ReactNode }
>(({ className, children, ...props }, ref) => {
  const { isOpen } = useSelect();
  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-50 mt-1 min-w-[8rem] w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80",
        className
      )}
      {...props}
    >
      <div className="p-1">{children}</div>
    </div>
  );
});
SelectContent.displayName = 'SelectContent';

const SelectLabel = React.forwardRef<
  HTMLDivElement,
  { className?: string; children: React.ReactNode }
>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)} {...props}>
    {children}
  </div>
));
SelectLabel.displayName = 'SelectLabel';

const SelectItem = React.forwardRef<
  HTMLDivElement,
  { className?: string; children: React.ReactNode; value: string }
>(({ className, children, value, ...props }, ref) => {
  const { setSelectedValue, setIsOpen, setSelectedLabel, selectedValue } = useSelect();
  const isSelected = selectedValue === value;

  const handleSelect = () => {
    setSelectedValue(value);
    setSelectedLabel(children);
    setIsOpen(false);
  };

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      onClick={handleSelect}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <Check className="h-4 w-4" />}
      </span>
      {children}
    </div>
  );
});
SelectItem.displayName = 'SelectItem';

const SelectSeparator = React.forwardRef<
  HTMLHRElement,
  { className?: string }
>(({ className, ...props }, ref) => (
  <hr ref={ref} className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />
));
SelectSeparator.displayName = 'SelectSeparator';

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
}
