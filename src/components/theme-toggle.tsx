"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/client";

type Theme = "light" | "dark" | "system";

function getSystemPrefersDark() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function applyTheme(theme: "light" | "dark") {
  const root = document.documentElement.classList;
  if (theme === "dark") root.add("dark");
  else root.remove("dark");
}

export function ThemeToggle({ className }: { className?: string }) {
  const { t } = useTranslation();
  const [theme, setTheme] = React.useState<Theme>(() => {
    if (typeof window === "undefined") return "system";
    return (localStorage.getItem("theme") as Theme) ?? "system";
  });

  const resolvedTheme =
    theme === "system" ? (getSystemPrefersDark() ? "dark" : "light") : theme;

  // Apply on mount and whenever theme changes
  React.useEffect(() => {
    applyTheme(resolvedTheme);
    if (theme === "light" || theme === "dark") {
      localStorage.setItem("theme", theme);
    } else {
      localStorage.removeItem("theme");
    }
  }, [theme, resolvedTheme]);

  // Keep in sync with system when using system mode
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (theme === "system") {
        applyTheme(mql.matches ? "dark" : "light");
      }
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [theme]);

  function toggle() {
    // Toggle between explicit light/dark (leaves system as initial-only)
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={t("theme.toggleAriaLabel")}
      onClick={toggle}
      className={className}
      title={t("theme.switchTo", {
        mode: resolvedTheme === "dark" ? t("theme.light") : t("theme.dark"),
      })}>
      {resolvedTheme === "dark" ? (
        <Sun className="size-4" />
      ) : (
        <Moon className="size-4" />
      )}
    </Button>
  );
}
