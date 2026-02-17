import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SaveEditor } from "@/components/save-editor";
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

function formatBytes(size: number | null | undefined): string {
  if (typeof size !== "number" || !Number.isFinite(size) || size < 0)
    return "-";
  if (size < 1024) return `${size} B`;
  const units = ["KB", "MB", "GB", "TB"] as const;
  let value = size / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const decimals = value >= 100 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(decimals)} ${units[unitIndex]}`;
}

export function SaveDetailPage() {
  const { t, locale } = useTranslation();
  const { id: rawId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const id = rawId ? decodeURIComponent(rawId) : "";

  const intlLocale = INTL_LOCALE[locale];
  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(intlLocale),
    [intlLocale],
  );
  const moneyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(intlLocale, {
        notation: "compact",
        maximumFractionDigits: 1,
      }),
    [intlLocale],
  );
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(intlLocale, {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [intlLocale],
  );

  const [scannedItems, setScannedItems] = useState<SaveScanItem[]>([]);
  const [initialSnapshot, setInitialSnapshot] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const result = await window.electronAPI.scanSaves();
    if (result.ok && result.data) {
      setScannedItems(result.data);
    }
  }, []);

  useEffect(() => {
    loadData().finally(() => setLoading(false));
    const unsub = window.electronAPI.onSavesChanged(() => loadData());
    return unsub;
  }, [loadData]);

  const { cards, allCards, cardDetails } = useMemo(
    () => summarizeSaves(scannedItems),
    [scannedItems],
  );

  const detail = cardDetails.get(id);
  const displayCard =
    cards.find((c) => c.id === id) ?? allCards.find((c) => c.id === id);

  // Load snapshot when we have the detail
  useEffect(() => {
    if (!detail) return;
    window.electronAPI.readSave(detail.representative.filePath).then((r) => {
      if (r.ok && r.data) setInitialSnapshot(r.data);
    });
  }, [detail]);

  if (loading) {
    return (
      <AppPageShell title={t("page.saveDetails.title")} pattern>
        <p className="text-muted-foreground">{t("survival.loading")}</p>
      </AppPageShell>
    );
  }

  if (!detail || !displayCard) {
    return (
      <AppPageShell title={t("page.saveDetails.title")} pattern>
        <p className="text-muted-foreground">Save not found.</p>
        <Link
          to="/saves"
          className="text-sm font-medium text-primary hover:underline">
          &larr; {t("detail.backToSaves")}
        </Link>
      </AppPageShell>
    );
  }

  const { representative, bucket, category } = detail;
  const gradient =
    CARD_GRADIENTS[displayCard.category] ?? DEFAULT_CARD_GRADIENT;
  const difficultyInfo = displayCard.difficulty
    ? DIFFICULTY_INFO[displayCard.difficulty]
    : undefined;
  const versions = [...bucket].sort((a, b) => b.mtime - a.mtime);
  const parentCity = representative.meta.parentCity?.trim() || "-";

  const editorFiles = bucket.map((entry) => ({
    filePath: entry.filePath,
    fileName: entry.fileName,
    tag: entry.tag,
    groupId: entry.groupId,
  }));

  const childCards = allCards.filter((card) => {
    const childDetail = cardDetails.get(card.id);
    if (!childDetail) return false;
    return (
      childDetail.representative.meta.parentCity?.trim() === id &&
      card.id !== id
    );
  });

  const parentId = representative.meta.parentCity?.trim() || "";
  const parentCard = parentId ? allCards.find((c) => c.id === parentId) : null;

  return (
    <AppPageShell
      title={displayCard.name || t("page.saveDetails.title")}
      description={t("page.saveDetails.description", {
        name: displayCard.name || id,
      })}
      pattern>
      <section className="mx-auto w-full max-w-5xl space-y-6">
        <Link
          to="/saves"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          &larr; {t("detail.backToSaves")}
        </Link>

        {/* Header card */}
        <Card className="border-none bg-transparent p-0 shadow-none">
          <MagicCard
            className="flex flex-col gap-4 overflow-hidden p-0 backdrop-blur"
            gradientFrom={gradient.from}
            gradientTo={gradient.to}
            gradientColor={gradient.color}>
            <CardHeader className="space-y-4 pt-6">
              <div className="space-y-2">
                <CardTitle className="text-2xl font-semibold">
                  {displayCard.name || t("card.unnamedCity")}
                </CardTitle>
                <CardDescription className="font-mono text-xs text-foreground/70 break-words">
                  {id}
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={MODE_BADGE_CLASS[displayCard.category]}>
                  {t("category." + displayCard.category)}
                </Badge>
                {displayCard.mapSize ? (
                  <Badge variant="secondary">
                    {displayCard.mapSize}x{displayCard.mapSize}
                  </Badge>
                ) : null}
                {difficultyInfo ? (
                  <Badge
                    variant="outline"
                    className={difficultyInfo.badgeClass}>
                    {t("difficulty." + difficultyInfo.key)}
                  </Badge>
                ) : null}
                {representative.tag !== "unknown" ? (
                  <Badge variant="outline" className="uppercase tracking-wide">
                    {representative.tag}
                  </Badge>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 pb-6 pt-2 text-sm md:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg border border-foreground/10 bg-background/40 px-4 py-3">
                <span className="text-muted-foreground">{t("card.level")}</span>
                <span className="font-semibold text-foreground">
                  {typeof displayCard.level === "number"
                    ? numberFormatter.format(displayCard.level)
                    : "-"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-foreground/10 bg-background/40 px-4 py-3">
                <span className="text-muted-foreground">
                  {category === "survival"
                    ? t("card.day")
                    : t("card.dayCampaign")}
                </span>
                <span className="font-semibold text-foreground">
                  {typeof displayCard.day === "number"
                    ? numberFormatter.format(displayCard.day)
                    : "-"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-foreground/10 bg-background/40 px-4 py-3">
                <span className="text-muted-foreground">{t("card.money")}</span>
                <span className="font-semibold text-foreground">
                  {typeof displayCard.money === "number"
                    ? moneyFormatter.format(displayCard.money)
                    : "-"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-foreground/10 bg-background/40 px-4 py-3">
                <span className="text-muted-foreground">
                  {t("card.parentCities")}
                </span>
                <span className="font-semibold text-foreground">
                  {numberFormatter.format(displayCard.parentCount)}
                </span>
              </div>
            </CardContent>
          </MagicCard>
        </Card>

        {/* Save Editor */}
        {initialSnapshot && (
          <SaveEditor
            files={editorFiles}
            initialSnapshot={initialSnapshot}
            initialFilePath={representative.filePath}
          />
        )}

        {/* Child Cities */}
        {childCards.length > 0 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight">
                {t("detail.childCities")} ({childCards.length})
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("detail.childCitiesClickToEdit")}
              </p>
            </div>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {childCards.map((child) => {
                const childGradient =
                  CARD_GRADIENTS[child.category] ?? DEFAULT_CARD_GRADIENT;
                const childDiff =
                  typeof child.difficulty === "number"
                    ? DIFFICULTY_INFO[child.difficulty]
                    : undefined;
                return (
                  <Card
                    key={child.id}
                    className="border border-border/40 rounded-xl bg-transparent p-0 shadow-none">
                    <Link
                      to={`/saves/${encodeURIComponent(child.id)}`}
                      className="block h-full rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-300">
                      <MagicCard
                        className="flex h-full flex-col overflow-hidden p-0 backdrop-blur transition-transform duration-200 hover:translate-y-[-2px]"
                        gradientFrom={childGradient.from}
                        gradientTo={childGradient.to}
                        gradientColor={childGradient.color}>
                        <CardHeader className="space-y-3 pt-5">
                          <div className="space-y-1">
                            <CardTitle className="truncate text-base font-semibold">
                              {child.name || t("card.unnamedCity")}
                            </CardTitle>
                            <span className="block font-mono text-[10px] text-foreground/60 truncate">
                              {child.id}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge
                              className={`text-[10px] ${MODE_BADGE_CLASS[child.category]}`}>
                              {t("category." + child.category)}
                            </Badge>
                            {child.mapSize ? (
                              <Badge
                                variant="secondary"
                                className="text-[10px]">
                                {child.mapSize}x{child.mapSize}
                              </Badge>
                            ) : null}
                            {childDiff ? (
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${childDiff.badgeClass}`}>
                                {t("difficulty." + childDiff.key)}
                              </Badge>
                            ) : null}
                          </div>
                        </CardHeader>
                        <CardContent className="grid gap-1.5 pb-5 pt-2 text-sm">
                          {child.category !== "survival" && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground text-xs">
                                {t("card.level")}
                              </span>
                              <span className="font-medium text-xs text-foreground">
                                {typeof child.level === "number"
                                  ? numberFormatter.format(child.level)
                                  : "-"}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground text-xs">
                              {t("card.day")}
                            </span>
                            <span className="font-medium text-xs text-foreground">
                              {typeof child.day === "number"
                                ? numberFormatter.format(child.day)
                                : "-"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground text-xs">
                              {t("card.money")}
                            </span>
                            <span className="font-medium text-xs text-foreground">
                              {typeof child.money === "number"
                                ? moneyFormatter.format(child.money)
                                : "-"}
                            </span>
                          </div>
                        </CardContent>
                      </MagicCard>
                    </Link>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Parent City Link */}
        {parentCard && (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold tracking-tight">
              {t("detail.parentCity")}
            </h2>
            <Link
              to={`/saves/${encodeURIComponent(parentCard.id)}`}
              className="group flex items-center gap-3 rounded-lg border border-border/40 px-4 py-3 transition-colors hover:bg-muted/40">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {parentCard.name || t("card.unnamedCity")}
                </p>
                <p className="text-xs text-muted-foreground font-mono truncate">
                  {parentCard.id}
                </p>
              </div>
              <Badge className={MODE_BADGE_CLASS[parentCard.category]}>
                {t("category." + parentCard.category)}
              </Badge>
              <span className="text-muted-foreground text-sm group-hover:text-foreground transition-colors">
                &rarr;
              </span>
            </Link>
          </div>
        )}

        {/* Info Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>{t("detail.generalInfo")}</CardTitle>
              <CardDescription>{t("detail.generalInfoDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm min-w-0">
              <div className="flex min-w-0 items-center justify-between gap-4">
                <span className="shrink-0 text-muted-foreground">
                  {t("detail.parentCityLabel")}
                </span>
                {parentCard ? (
                  <Link
                    to={`/saves/${encodeURIComponent(parentCard.id)}`}
                    className="min-w-0 truncate font-medium text-primary hover:underline text-right">
                    {parentCard.name || parentId}
                  </Link>
                ) : (
                  <span className="min-w-0 truncate font-medium text-foreground text-right">
                    {parentCity || "-"}
                  </span>
                )}
              </div>
              <div className="flex min-w-0 items-center justify-between gap-4">
                <span className="shrink-0 text-muted-foreground">
                  {t("detail.difficulty")}
                </span>
                <span className="font-medium text-foreground">
                  {difficultyInfo ? t("difficulty." + difficultyInfo.key) : "-"}
                </span>
              </div>
              <div className="flex min-w-0 items-center justify-between gap-4">
                <span className="shrink-0 text-muted-foreground">
                  {t("detail.sandboxCheats")}
                </span>
                <span className="font-medium text-foreground">
                  {representative.meta.sandboxEnabled ||
                  representative.meta.unlockAll
                    ? t("detail.active")
                    : t("detail.inactive")}
                </span>
              </div>
              <div className="flex min-w-0 items-center justify-between gap-4">
                <span className="shrink-0 text-muted-foreground">
                  {t("detail.file")}
                </span>
                <span className="min-w-0 truncate text-right font-mono text-xs text-foreground">
                  {representative.fileName}
                </span>
              </div>
              <div className="flex min-w-0 items-center justify-between gap-4">
                <span className="shrink-0 text-muted-foreground">
                  {t("detail.size")}
                </span>
                <span className="font-medium text-foreground">
                  {formatBytes(representative.sizeBytes)}
                </span>
              </div>
              <div className="flex min-w-0 items-center justify-between gap-4">
                <span className="shrink-0 text-muted-foreground">
                  {t("detail.modifiedAt")}
                </span>
                <span className="min-w-0 truncate font-medium text-foreground text-right">
                  {dateFormatter.format(new Date(representative.mtime))}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>{t("detail.mapSummary")}</CardTitle>
              <CardDescription>{t("detail.mapSummaryDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm min-w-0">
              <div className="flex min-w-0 items-center justify-between gap-4">
                <span className="shrink-0 text-muted-foreground">
                  {t("detail.mapSize")}
                </span>
                <span className="font-medium text-foreground">
                  {displayCard.mapSize
                    ? `${displayCard.mapSize} x ${displayCard.mapSize}`
                    : "-"}
                </span>
              </div>
              <div className="flex min-w-0 items-center justify-between gap-4">
                <span className="shrink-0 text-muted-foreground">
                  {t("detail.dayProgress")}
                </span>
                <span className="font-medium text-foreground">
                  {typeof representative.meta.dayProgress === "number"
                    ? numberFormatter.format(representative.meta.dayProgress)
                    : "-"}
                </span>
              </div>
              <div className="flex min-w-0 items-center justify-between gap-4">
                <span className="shrink-0 text-muted-foreground">
                  {t("detail.infiniteMoney")}
                </span>
                <span className="font-medium text-foreground">
                  {representative.meta.infiniteMoney
                    ? t("detail.yes")
                    : t("detail.no")}
                </span>
              </div>
              <div className="flex min-w-0 items-center justify-between gap-4">
                <span className="shrink-0 text-muted-foreground">
                  {t("detail.unlockAll")}
                </span>
                <span className="font-medium text-foreground">
                  {representative.meta.unlockAll
                    ? t("detail.yes")
                    : t("detail.no")}
                </span>
              </div>
              <div className="flex min-w-0 items-center justify-between gap-4">
                <span className="shrink-0 text-muted-foreground">
                  {t("detail.maxLevel")}
                </span>
                <span className="font-medium text-foreground">
                  {representative.meta.maxLevel
                    ? t("detail.yes")
                    : t("detail.no")}
                </span>
              </div>
              <div className="flex min-w-0 items-center justify-between gap-4">
                <span className="shrink-0 text-muted-foreground">
                  {t("detail.fullPath")}
                </span>
                <span className="min-w-0 break-all text-right font-mono text-xs text-foreground">
                  {representative.filePath}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Linked Files Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t("detail.linkedFiles")}</CardTitle>
            <CardDescription>{t("detail.linkedFilesDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            {versions.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {t("detail.noLinkedFiles")}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("table.file")}</TableHead>
                      <TableHead>{t("table.type")}</TableHead>
                      <TableHead>{t("table.tag")}</TableHead>
                      <TableHead className="text-right">
                        {t("table.size")}
                      </TableHead>
                      <TableHead className="text-right">
                        {t("table.lastModified")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {versions.map((entry) => (
                      <TableRow key={entry.filePath}>
                        <TableCell className="font-mono text-xs">
                          {entry.fileName}
                        </TableCell>
                        <TableCell>
                          {entry.isRoot ? (
                            <Badge variant="secondary">{t("table.root")}</Badge>
                          ) : (
                            <Badge variant="outline">
                              {t("table.related")}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="capitalize">
                          {entry.tag}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatBytes(entry.sizeBytes)}
                        </TableCell>
                        <TableCell className="text-right">
                          {dateFormatter.format(new Date(entry.mtime))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </AppPageShell>
  );
}
