"use client";

import * as React from "react";
import * as ReactDOM from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/* -------------------- Context -------------------- */
interface DialogContextType {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const DialogContext = React.createContext<DialogContextType | null>(null);

function useDialog() {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within a <Dialog>");
  }
  return context;
}

/* -------------------- Root Dialog -------------------- */
interface DialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const Dialog = ({ children, open, onOpenChange }: DialogProps) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  const setIsOpen: React.Dispatch<React.SetStateAction<boolean>> = (value) => {
    const newOpen = typeof value === "function" ? value(isOpen) : value;
    if (!isControlled) setInternalOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  return (
    <DialogContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </DialogContext.Provider>
  );
};
Dialog.displayName = "Dialog";

/* -------------------- Trigger & Close -------------------- */
interface DialogButtonProps {
  children: React.ReactNode;
  asChild?: boolean;
}

const DialogTrigger = ({ children, asChild = false }: DialogButtonProps) => {
  const { setIsOpen } = useDialog();

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement;
    return React.cloneElement(child, {
      onClick: (e: React.MouseEvent) => {
        child.props.onClick?.(e);
        setIsOpen(true);
      },
    });
  }

  return <button onClick={() => setIsOpen(true)}>{children}</button>;
};
DialogTrigger.displayName = "DialogTrigger";

const DialogClose = ({ children, asChild = false }: DialogButtonProps) => {
  const { setIsOpen } = useDialog();

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement;
    return React.cloneElement(child, {
      onClick: (e: React.MouseEvent) => {
        child.props.onClick?.(e);
        setIsOpen(true);
      },
    });
  }

  return <button onClick={() => setIsOpen(false)}>{children}</button>;
};
DialogClose.displayName = "DialogClose";

/* -------------------- Portal -------------------- */
const DialogPortal = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  return mounted ? ReactDOM.createPortal(children, document.body) : null;
};
DialogPortal.displayName = "DialogPortal";

/* -------------------- Overlay & Content -------------------- */
const DialogOverlay = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { isOpen, setIsOpen } = useDialog();
  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      onClick={() => setIsOpen(false)}
      className={cn(
        "fixed inset-0 z-50 bg-black/80 transition-opacity duration-300 ease-in-out",
        className
      )}
      {...props}
    />
  );
});
DialogOverlay.displayName = "DialogOverlay";

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { isOpen, setIsOpen } = useDialog();

  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [setIsOpen]);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <DialogPortal>
      <DialogOverlay />
      <div
        ref={ref}
        className={cn(
          "fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border bg-background p-6 shadow-lg sm:rounded-lg",
          "transition-all duration-300 ease-in-out",
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95",
          className
        )}
        role="dialog"
        aria-modal="true"
        {...props}
      >
        {children}
        <DialogClose asChild>
          <button className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogClose>
      </div>
    </DialogPortal>
  );
});
DialogContent.displayName = "DialogContent";

/* -------------------- Header / Footer / Title -------------------- */
const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";

/* -------------------- Exports -------------------- */
export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogPortal,
  DialogClose,
  DialogOverlay,
};
