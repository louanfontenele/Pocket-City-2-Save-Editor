import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { AppPageShell } from "@/components/app-page-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MagicCard } from "@/components/ui/magic-card";
import { useTranslation } from "@/lib/i18n/client";
import { INTL_LOCALE } from "@/lib/i18n/shared";
import {
  CARD_GRADIENTS,
  DEFAULT_CARD_GRADIENT,
  DIFFICULTY_INFO,
  MODE_BADGE_CLASS,
  summarizeSaves,
  type SaveScanItem,
} from "@/lib/save-utils";

export function SavesPage() {
  const { t, locale } = useTranslation();
  const intlLocale = INTL_LOCALE[locale];
  const numberFormatter = new Intl.NumberFormat(intlLocale);
  const moneyFormatter = new Intl.NumberFormat(intlLocale, {
    notation: "compact",
    maximumFractionDigits: 1,
  });

  const [scannedItems, setScannedItems] = useState<SaveScanItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSaves = useCallback(async () => {
    try {
      const result = await window.electronAPI.scanSaves();
      if (result.ok && result.data) {
        setScannedItems(result.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSaves();
    const unsub = window.electronAPI.onSavesChanged(() => {
      loadSaves();
    });
    return unsub;
  }, [loadSaves]);

  const {
    totals,
    cards: displayCards,
    groupCount,
  } = summarizeSaves(scannedItems);
  const {
    normal: totalNormal,
    parent: totalParent,
    sandbox: totalSandbox,
    parentSandbox: totalParentSB,
    survival: totalSurvival,
  } = totals;

  return (
    <AppPageShell
      title={t("page.saves.title")}
      description={t("page.saves.description")}
      pattern>
      <section className="mx-auto w-full max-w-7xl">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {[
            {
              title: t("summary.normalSaves"),
              desc: t("summary.normalSavesDesc"),
              value: totalNormal,
            },
            {
              title: t("summary.parentSaves"),
              desc: t("summary.parentSavesDesc"),
              value: totalParent,
            },
            {
              title: t("summary.sandboxSaves"),
              desc: t("summary.sandboxSavesDesc"),
              value: totalSandbox,
            },
            {
              title: t("summary.parentSandboxSaves"),
              desc: t("summary.parentSandboxSavesDesc"),
              value: totalParentSB,
            },
            {
              title: t("summary.survivalSaves"),
              desc: t("summary.survivalSavesDesc"),
              value: totalSurvival,
            },
          ].map((card) => (
            <Card
              key={card.title}
              className="w-full border border-border/40 rounded-xl p-0 shadow-none">
              <MagicCard
                className="p-0"
                gradientFrom="#D9D9D955"
                gradientTo="#262626"
                gradientColor="#D9D9D955">
                <CardHeader className="border-border border-b p-4 [.border-b]:pb-4">
                  <CardTitle>{card.title}</CardTitle>
                  <CardDescription>{card.desc}</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-3xl font-semibold">
                    {loading ? "..." : card.value}
                  </p>
                </CardContent>
              </MagicCard>
            </Card>
          ))}
        </div>

        {displayCards.length > 0 && (
          <>
            <Separator className="my-6" />

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {displayCards.map((card) => {
                const sizeLabel =
                  typeof card.mapSize === "number" && card.mapSize > 0
                    ? `${card.mapSize}x${card.mapSize}`
                    : null;
                const difficultyInfo =
                  (card.category === "normal" ||
                    card.category === "survival") &&
                  typeof card.difficulty === "number"
                    ? DIFFICULTY_INFO[card.difficulty]
                    : undefined;
                const gradient =
                  CARD_GRADIENTS[card.category] ?? DEFAULT_CARD_GRADIENT;
                return (
                  <Card
                    key={card.id}
                    className="border border-border/40 rounded-xl bg-transparent p-0 shadow-none">
                    <Link
                      to={`/saves/${encodeURIComponent(card.id)}`}
                      className="block h-full rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-300">
                      <MagicCard
                        className="flex h-full flex-col overflow-hidden p-0 backdrop-blur transition-transform duration-200 hover:translate-y-[-2px] focus-visible:translate-y-[-2px]"
                        gradientFrom={gradient.from}
                        gradientTo={gradient.to}
                        gradientColor={gradient.color}>
                        <CardHeader className="space-y-3 pt-6">
                          <div className="space-y-2">
                            <CardTitle
                              className="truncate text-lg font-semibold"
                              title={card.name || t("card.unnamedCity")}>
                              {card.name || t("card.unnamedCity")}
                            </CardTitle>
                            <span
                              className="block font-mono text-xs text-foreground/70 break-words"
                              title={card.id}>
                              {card.id}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={MODE_BADGE_CLASS[card.category]}>
                              {t("category." + card.category)}
                            </Badge>
                            {sizeLabel ? (
                              <Badge variant="secondary">{sizeLabel}</Badge>
                            ) : null}
                            {difficultyInfo ? (
                              <Badge
                                variant="outline"
                                className={difficultyInfo.badgeClass}>
                                {t("difficulty." + difficultyInfo.key)}
                              </Badge>
                            ) : null}
                          </div>
                        </CardHeader>
                        <CardContent className="grid gap-2 pb-6 pt-4 text-sm">
                          {card.category === "survival" ? (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">
                                {t("card.day")}
                              </span>
                              <span className="font-medium text-foreground">
                                {typeof card.day === "number"
                                  ? numberFormatter.format(card.day)
                                  : "-"}
                              </span>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">
                                  {t("card.level")}
                                </span>
                                <span className="font-medium text-foreground">
                                  {typeof card.level === "number"
                                    ? numberFormatter.format(card.level)
                                    : "-"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">
                                  {t("card.day")}
                                </span>
                                <span className="font-medium text-foreground">
                                  {typeof card.day === "number"
                                    ? numberFormatter.format(card.day)
                                    : "-"}
                                </span>
                              </div>
                            </>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              {t("card.money")}
                            </span>
                            <span className="font-medium text-foreground">
                              {typeof card.money === "number"
                                ? moneyFormatter.format(card.money)
                                : "-"}
                            </span>
                          </div>
                          {card.category !== "survival" ? (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">
                                {t("card.parentCities")}
                              </span>
                              <span className="font-medium text-foreground">
                                {numberFormatter.format(card.parentCount)}
                              </span>
                            </div>
                          ) : null}
                        </CardContent>
                      </MagicCard>
                    </Link>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {!loading && groupCount === 0 && (
          <p className="text-muted-foreground mt-4 text-sm">
            {t("noSaves.message")}
          </p>
        )}
      </section>
    </AppPageShell>
  );
}
