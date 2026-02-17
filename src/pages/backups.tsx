import { AppPageShell } from "@/components/app-page-shell";
import { BackupManager } from "@/components/backup-manager";
import { useTranslation } from "@/lib/i18n/client";

export function BackupsPage() {
  const { t } = useTranslation();
  return (
    <AppPageShell
      title={t("page.backups.title")}
      description={t("page.backups.description")}
      pattern>
      <section className="mx-auto w-full max-w-5xl">
        <BackupManager />
      </section>
    </AppPageShell>
  );
}
