"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

interface DialogPortalProps {
    className?: string;
    children: React.ReactNode;
}

const DialogPortal: React.FC<DialogPortalProps> = ({
    className,
    children,
    ...props
  }) => {
    const [mounted, setMounted] = React.useState(false)
    React.useEffect(() => {
        setMounted(true)
        return () => setMounted(false)
    }, [])

    if(!mounted) return null;

    const portal = document.body;

    return React.useMemo(() => {
        const el = document.createElement('div');
        portal.appendChild(el);
        const comp = (
            <div className={cn(className)} {...props}>
                {children}
            </div>
        );
        return require('react-dom').createPortal(comp, el)
    }, [className, children, props, portal])
}

const SheetOverlay = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
SheetOverlay.displayName = "SheetOverlay"


const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom:
          "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-3/4  border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
)

interface SheetContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sheetVariants> {
        open?: boolean;
        onOpenChange?: (open: boolean) => void;
    }

const SheetContent = React.forwardRef<
  HTMLDivElement,
  SheetContentProps
>(({ side = "right", className, children, open, onOpenChange, ...props }, ref) => (
  <DialogPortal>
    <SheetOverlay />
    <div
      ref={ref}
      className={cn(sheetVariants({ side }), className)}
      {...props}
    >
      {children}
      <button onClick={() => onOpenChange?.(false)} className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </button>
    </div>
  </DialogPortal>
))
SheetContent.displayName = "SheetContent"

const Sheet = ({ open, onOpenChange, children }: { open: boolean, onOpenChange: (open: boolean) => void, children: React.ReactNode }) => {
    if (!open) return null;
    return <>{children}</>;
};


export {
  Sheet,
  SheetContent,
}
