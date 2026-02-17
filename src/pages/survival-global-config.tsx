import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AppPageShell } from "@/components/app-page-shell";
import { SurvivalGlobalEditor } from "@/components/survival-global-editor";
import { useTranslation } from "@/lib/i18n/client";

export function SurvivalGlobalConfigPage() {
  const { t } = useTranslation();
  const [dataDir, setDataDir] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.electronAPI
      .collectDirs()
      .then((r) => {
        if (r.ok && r.data && r.data.length > 0) {
          setDataDir(r.data[0]);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppPageShell
      title={t("page.survivalConfig.title")}
      description={t("page.survivalConfig.description")}
      pattern>
      <section className="mx-auto w-full max-w-5xl">
        {loading ? (
          <p className="text-muted-foreground text-sm">
            {t("survival.loading")}
          </p>
        ) : dataDir ? (
          <SurvivalGlobalEditor dataDir={dataDir} />
        ) : (
          <p className="text-muted-foreground text-sm">
            {t("noSaves.survivalConfig")}{" "}
            <Link to="/settings" className="underline">
              {t("noSaves.survivalConfigLink")}
            </Link>
            .
          </p>
        )}
      </section>
    </AppPageShell>
  );
}
