import { AppPageShell } from "@/components/app-page-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MagicCard } from "@/components/ui/magic-card";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/lib/i18n/client";
import {
  APP_VERSION,
  BUILD_DATE,
  VERSION_DISPLAY,
  CHANGELOG,
} from "@/lib/version";
import type { Locale } from "@/lib/i18n/shared";

export function ChangelogPage() {
  const { t, locale } = useTranslation();

  return (
    <AppPageShell
      title={t("page.changelog.title")}
      description={t("page.changelog.description")}
      pattern>
      <section className="mx-auto w-full max-w-4xl space-y-6">
        {/* Current Version Card */}
        <Card className="border-none bg-transparent p-0 shadow-none">
          <MagicCard
            className="flex flex-col overflow-hidden p-0 backdrop-blur"
            gradientFrom="#a78bfa55"
            gradientTo="#4c1d95"
            gradientColor="#a78bfa55">
            <CardHeader className="pb-6 pt-6">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-semibold">
                    {t("changelog.currentVersion")}
                  </CardTitle>
                  <CardDescription className="text-foreground/70">
                    {t("changelog.runningVersion")}
                  </CardDescription>
                </div>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <span className="rounded-lg bg-violet-500/90 px-5 py-2 font-mono text-2xl font-bold text-white shadow-md">
                    v{VERSION_DISPLAY}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(BUILD_DATE + "T00:00:00").toLocaleDateString(
                      locale === "pt-br" ? "pt-BR" : "en-US",
                      { year: "numeric", month: "long", day: "numeric" },
                    )}
                  </span>
                </div>
              </div>
            </CardHeader>
          </MagicCard>
        </Card>

        <Separator />

        {/* Changelog Entries */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">
            {t("changelog.history")}
          </h2>

          <div className="space-y-4">
            {CHANGELOG.map((entry, idx) => {
              const isLatest = idx === 0;
              const changes =
                entry.changes[locale as Locale] ?? entry.changes.en;
              return (
                <Card
                  key={entry.version}
                  className="border border-border/40 rounded-xl bg-transparent p-0 shadow-none">
                  <MagicCard
                    className="flex flex-col overflow-hidden p-0 backdrop-blur"
                    gradientFrom={isLatest ? "#38BDF855" : "#D9D9D920"}
                    gradientTo={isLatest ? "#0F172A" : "#262626"}
                    gradientColor={isLatest ? "#38BDF855" : "#D9D9D920"}>
                    <CardHeader className="space-y-2 pt-5 pb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-lg font-semibold">
                          v{entry.version}
                        </span>
                        {isLatest && (
                          <Badge className="border-transparent bg-emerald-500/80 text-white text-xs">
                            {t("changelog.latest")}
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(entry.date + "T00:00:00").toLocaleDateString(
                          locale === "pt-br" ? "pt-BR" : "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          },
                        )}
                      </span>
                    </CardHeader>
                    <CardContent className="pb-5 pt-1">
                      <ul className="space-y-2">
                        {changes.map((change, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm text-foreground/90">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                            <span>{change}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </MagicCard>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
    </AppPageShell>
  );
}
