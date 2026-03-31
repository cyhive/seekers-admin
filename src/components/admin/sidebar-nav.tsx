"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  TicketPercent,
  Settings,
  Mountain,
  PanelLeft,
  ChevronUp,
  ChevronDown,
  Image,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/jobs", icon: ShoppingCart, label: "Jobs" },
  { href: "/members", icon: Package, label: "Members" },
  { href: "/categories", icon: Package, label: "Categories" },
  { href: "/customers", icon: Users, label: "Customers" },
  { href: "/promotions", icon: TicketPercent, label: "Promotions" },
  { href: "/whatwehavedone", icon: Image, label: "What We Have Done" },
  { href: "/news", icon: Image, label: "News" },
];

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function SidebarNav() {
  const pathname = usePathname();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 100);
    return () => clearTimeout(timer);
  }, []);

  /* ----------------------------- Loading UI ----------------------------- */
  if (isLoading) {
    return (
      <div className="hidden md:block h-screen w-64 border-r p-4">
        <Skeleton className="h-6 w-40 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  return (
    <>
      {/* ---------------------- MOBILE TOGGLE BUTTON ---------------------- */}
      <button
        onClick={toggleMobileSidebar}
        className="fixed top-4 right-4 z-50 md:hidden bg-card border rounded-full p-2 shadow"
      >
        {isMobileOpen ? (
          <ChevronUp className="h-6 w-6" />
        ) : (
          <ChevronDown className="h-6 w-6" />
        )}
        <span className="sr-only">Toggle Sidebar</span>
      </button>

      {/* ----------------------------- SIDEBAR ----------------------------- */}
      <div
        className={cn(
          "fixed md:relative z-40 h-screen bg-card text-card-foreground border-r transition-all duration-300 ease-in-out",
          "md:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "md:w-16" : "md:w-64",
          "w-64"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            {!isCollapsed && (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 font-headline text-lg"
              >
                <Mountain className="h-6 w-6 text-primary" />
                <span>Pacha Bhoomi</span>
              </Link>
            )}

            {/* Desktop collapse button only */}
            <button
              onClick={toggleSidebar}
              className="hidden md:flex p-2 rounded-md hover:bg-accent"
            >
              <PanelLeft className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 p-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  pathname.startsWith(item.href) &&
                    "bg-primary/10 text-primary",
                  isCollapsed && "md:justify-center md:px-2 md:py-3"
                )}
              >
                <item.icon
                  className={cn("h-5 w-5", isCollapsed && "md:h-6 md:w-6")}
                />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            ))}
          </nav>

          {/* Settings */}
          <div className="mt-auto p-4 border-t">
            <Link
              href="/settings"
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                pathname.startsWith("/settings") &&
                  "bg-primary/10 text-primary",
                isCollapsed && "md:justify-center md:px-2 md:py-3"
              )}
            >
              <Settings
                className={cn("h-5 w-5", isCollapsed && "md:h-6 md:w-6")}
              />
              {!isCollapsed && <span>Settings</span>}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
