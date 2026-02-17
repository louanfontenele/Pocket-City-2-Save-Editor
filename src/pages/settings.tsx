import { AppPageShell } from "@/components/app-page-shell";
import { SettingsDirectories } from "@/components/settings-directories";
import { useTranslation } from "@/lib/i18n/client";

export function SettingsPage() {
  const { t } = useTranslation();
  return (
    <AppPageShell
      title={t("page.settings.title")}
      description={t("page.settings.description")}>
      <div className="space-y-6">
        <SettingsDirectories />
      </div>
    </AppPageShell>
  );
}
