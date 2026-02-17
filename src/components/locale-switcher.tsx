"use client";

import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocaleContext, useTranslation } from "@/lib/i18n/client";

export function LocaleSwitcher() {
  const { locale, setLocale } = useLocaleContext();
  const { t } = useTranslation();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLocale(locale === "en" ? "pt-br" : "en")}
      className="w-full justify-start gap-2 text-xs">
      <Globe className="h-4 w-4" />
      <span>{locale === "en" ? t("locale.en") : t("locale.ptBr")}</span>
    </Button>
  );
}
