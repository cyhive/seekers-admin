"use client";

import type { PropsWithChildren } from "react";
import { SidebarNav } from "@/components/admin/sidebar-nav";
import { Header } from "@/components/admin/header";
import { Providers } from "@/components/providers";
import { PageLoading } from "@/components/ui/page-loading";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function DashboardLayout({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const [isPageLoading, setIsPageLoading] = useState(true);

  useEffect(() => {
    setIsPageLoading(true);

    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [pathname]);

  const getLoadingType = () => {
    if (pathname === "/dashboard") return "dashboard";
    if (
      pathname.includes("/members") ||
      pathname.includes("/promotions") ||
      pathname.includes("/categories") ||
      pathname.includes("/jobs") ||
      pathname.includes("/customers") ||
      pathname.includes("/uploads")
    )
      return "table";
    return "generic";
  };

  return (
    <Providers>
      <div className="flex h-screen w-full overflow-hidden">
        <SidebarNav />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto bg-background">
            <div className="flex flex-col gap-2 p-2 lg:gap-4 lg:p-4">
              {isPageLoading ? (
                <PageLoading type={getLoadingType()} showSpinner={true} />
              ) : (
                children
              )}
            </div>
          </main>
        </div>
      </div>
    </Providers>
  );
}
