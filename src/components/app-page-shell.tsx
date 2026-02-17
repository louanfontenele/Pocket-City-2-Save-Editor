import { ReactNode } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { DotPattern } from "@/components/ui/dot-pattern";
import { cn } from "@/lib/utils";

type AppPageShellProps = {
  title?: string;
  description?: string;
  children?: ReactNode;
  pattern?: boolean;
  contentClassName?: string;
};

export function AppPageShell({
  title,
  description,
  children,
  pattern = true,
  contentClassName,
}: AppPageShellProps) {
  const patternMask =
    "[mask-image:radial-gradient(650px_circle_at_center,white,transparent)]";

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-4 border-b px-4 bg-background/20 backdrop-blur-md supports-[backdrop-filter]:backdrop-blur-md backdrop-saturate-150 shadow-sm transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex flex-1 items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <SidebarTrigger className="-ml-1" />
              {(title || description) && (
                <div className="min-w-0">
                  {title ? (
                    <h1 className="truncate text-lg font-semibold sm:text-xl">
                      {title}
                    </h1>
                  ) : null}
                  {description ? (
                    <p className="truncate text-sm text-muted-foreground">
                      {description}
                    </p>
                  ) : null}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        </header>
        <div
          className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden bg-background",
            pattern ? "p-0" : "p-6",
            contentClassName,
          )}>
          <div className="relative min-h-[calc(100vh-4rem)] w-full overflow-hidden">
            <div
              className={cn(
                "relative z-10 h-full w-full",
                pattern ? "p-4 sm:p-6" : "p-4 sm:p-6",
              )}>
              {children}
            </div>
            {pattern ? (
              <DotPattern
                width={12}
                height={12}
                className={cn(
                  "pointer-events-none absolute inset-0 text-muted-foreground/40",
                  patternMask,
                )}
              />
            ) : null}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
