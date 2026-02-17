import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Save, RotateCcw, Zap, Trash2, AlertTriangle } from "lucide-react";
import {
  SURVIVAL_UPGRADES,
  KNOWN_UPGRADE_IDS,
  GLOBAL_LIMITS,
} from "@/lib/pc2/data/limits";
import { useTranslation } from "@/lib/i18n/client";

type GlobalEditable = {
  bestDayReachedEasy?: number;
  bestDayReachedHard?: number;
  bestDayReachedExpert?: number;
  highestStarsReachedEasy?: number;
  highestStarsReachedHard?: number;
  highestStarsReachedExpert?: number;
  highestPopulationReachedEasy?: number;
  highestPopulationReachedHard?: number;
  highestPopulationReachedExpert?: number;
  totalUpgradePoints?: number;
  upgradesSpent?: Record<number, number>;
};

type Props = {
  dataDir: string;
};

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function SurvivalGlobalEditor({ dataDir }: Props) {
  const { t } = useTranslation();
  const [exists, setExists] = useState(false);
  const [readonly, setReadonly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Field state
  const [bestDayEasy, setBestDayEasy] = useState(0);
  const [bestDayHard, setBestDayHard] = useState(0);
  const [bestDayExpert, setBestDayExpert] = useState(0);
  const [starsEasy, setStarsEasy] = useState(0);
  const [starsHard, setStarsHard] = useState(0);
  const [starsExpert, setStarsExpert] = useState(0);
  const [popEasy, setPopEasy] = useState(0);
  const [popHard, setPopHard] = useState(0);
  const [popExpert, setPopExpert] = useState(0);
  const [totalUpgradePoints, setTotalUpgradePoints] = useState(0);
  const [upgrades, setUpgrades] = useState<Record<number, number>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await window.electronAPI.readGlobals(dataDir);
      if (!data.ok) throw new Error(data.error);
      setExists(data.exists ?? false);
      setReadonly(data.readonly ?? false);
      const e = data.snapshot?.editable ?? {};
      setBestDayEasy(e.bestDayReachedEasy ?? 0);
      setBestDayHard(e.bestDayReachedHard ?? 0);
      setBestDayExpert(e.bestDayReachedExpert ?? 0);
      setStarsEasy(e.highestStarsReachedEasy ?? 0);
      setStarsHard(e.highestStarsReachedHard ?? 0);
      setStarsExpert(e.highestStarsReachedExpert ?? 0);
      setPopEasy(e.highestPopulationReachedEasy ?? 0);
      setPopHard(e.highestPopulationReachedHard ?? 0);
      setPopExpert(e.highestPopulationReachedExpert ?? 0);
      setTotalUpgradePoints(e.totalUpgradePoints ?? 0);
      setUpgrades(e.upgradesSpent ?? {});
    } catch (err) {
      toast.error(t("toast.loadError", { error: (err as Error).message }));
    } finally {
      setLoading(false);
    }
  }, [dataDir]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function buildPatch(): GlobalEditable {
    const patch: GlobalEditable = {
      bestDayReachedEasy: clamp(bestDayEasy, 0, 100),
      bestDayReachedHard: clamp(bestDayHard, 0, 100),
      bestDayReachedExpert: clamp(bestDayExpert, 0, 100),
      highestStarsReachedEasy: clamp(starsEasy, 0, 5),
      highestStarsReachedHard: clamp(starsHard, 0, 5),
      highestStarsReachedExpert: clamp(starsExpert, 0, 5),
      highestPopulationReachedEasy: clamp(popEasy, 0, 999_999_999),
      highestPopulationReachedHard: clamp(popHard, 0, 999_999_999),
      highestPopulationReachedExpert: clamp(popExpert, 0, 999_999_999),
      totalUpgradePoints: clamp(totalUpgradePoints, 0, 999_999),
      upgradesSpent: { ...upgrades },
    };
    return patch;
  }

  async function handleSave() {
    setSaving(true);
    try {
      const data = await window.electronAPI.writeGlobals(dataDir, buildPatch());
      if (!data.ok) throw new Error(data.error);
      toast.success(t("toast.settingsSaved"));
      await loadData();
    } catch (err) {
      toast.error(t("toast.settingsError", { error: (err as Error).message }));
    } finally {
      setSaving(false);
    }
  }

  async function handleApplyMax() {
    setSaving(true);
    try {
      const maxPatch: GlobalEditable = {
        bestDayReachedEasy: 100,
        bestDayReachedHard: 100,
        bestDayReachedExpert: 100,
        highestStarsReachedEasy: 5,
        highestStarsReachedHard: 5,
        highestStarsReachedExpert: 5,
        highestPopulationReachedEasy: 999_999_999,
        highestPopulationReachedHard: 999_999_999,
        highestPopulationReachedExpert: 999_999_999,
        totalUpgradePoints: 999_999,
        upgradesSpent: Object.fromEntries(
          KNOWN_UPGRADE_IDS.map((id) => [id, SURVIVAL_UPGRADES[id].maxLevel]),
        ),
      };
      const data = await window.electronAPI.writeGlobals(dataDir, maxPatch);
      if (!data.ok) throw new Error(data.error);
      toast.success(t("toast.maxApplied"));
      await loadData();
    } catch (err) {
      toast.error(t("toast.maxError", { error: (err as Error).message }));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(t("toast.globalDeleteConfirm"))) return;
    setSaving(true);
    try {
      const data = await window.electronAPI.deleteGlobals(dataDir);
      if (!data.ok) throw new Error(data.error);
      toast.success(t("toast.fileDeleted"));
      await loadData();
    } catch (err) {
      toast.error(
        t("toast.fileDeleteError", { error: (err as Error).message }),
      );
    } finally {
      setSaving(false);
    }
  }

  function updateUpgrade(id: number, value: number) {
    const maxLvl = SURVIVAL_UPGRADES[id]?.maxLevel ?? 3;
    setUpgrades((prev) => ({ ...prev, [id]: clamp(value, 0, maxLvl) }));
  }

  const disabled = loading || saving || readonly;

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {t("survival.loading")}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {!exists && (
        <Card className="border-amber-500/50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <span className="text-sm">{t("survival.fileNotFound")}</span>
          </CardContent>
        </Card>
      )}

      {readonly && (
        <Card className="border-rose-500/50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="h-5 w-5 text-rose-500" />
            <span className="text-sm">{t("survival.readonlyWarning")}</span>
          </CardContent>
        </Card>
      )}

      {/* Quick actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {t("survival.quickActions")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={disabled}
            onClick={handleApplyMax}>
            <Zap className="mr-1.5 h-3.5 w-3.5" /> {t("survival.applyMax")}
          </Button>
          {exists && (
            <Button
              size="sm"
              variant="destructive"
              disabled={disabled}
              onClick={handleDelete}>
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />{" "}
              {t("survival.deleteFile")}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Best Day */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t("survival.bestDay")} <Badge variant="secondary">0-100</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {t("difficulty.easy")}
            </label>
            <Input
              type="number"
              min={0}
              max={100}
              value={bestDayEasy}
              onChange={(e) => setBestDayEasy(Number(e.target.value) || 0)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {t("difficulty.hard")}
            </label>
            <Input
              type="number"
              min={0}
              max={100}
              value={bestDayHard}
              onChange={(e) => setBestDayHard(Number(e.target.value) || 0)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {t("difficulty.expert")}
            </label>
            <Input
              type="number"
              min={0}
              max={100}
              value={bestDayExpert}
              onChange={(e) => setBestDayExpert(Number(e.target.value) || 0)}
              disabled={disabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Stars */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t("survival.highestStars")} <Badge variant="secondary">0-5</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {t("difficulty.easy")}
            </label>
            <Input
              type="number"
              min={0}
              max={5}
              value={starsEasy}
              onChange={(e) => setStarsEasy(Number(e.target.value) || 0)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {t("difficulty.hard")}
            </label>
            <Input
              type="number"
              min={0}
              max={5}
              value={starsHard}
              onChange={(e) => setStarsHard(Number(e.target.value) || 0)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {t("difficulty.expert")}
            </label>
            <Input
              type="number"
              min={0}
              max={5}
              value={starsExpert}
              onChange={(e) => setStarsExpert(Number(e.target.value) || 0)}
              disabled={disabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Population */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t("survival.highestPopulation")}{" "}
            <Badge variant="secondary">0-999,999,999</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {t("difficulty.easy")}
            </label>
            <Input
              type="number"
              min={0}
              max={999999999}
              value={popEasy}
              onChange={(e) => setPopEasy(Number(e.target.value) || 0)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {t("difficulty.hard")}
            </label>
            <Input
              type="number"
              min={0}
              max={999999999}
              value={popHard}
              onChange={(e) => setPopHard(Number(e.target.value) || 0)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {t("difficulty.expert")}
            </label>
            <Input
              type="number"
              min={0}
              max={999999999}
              value={popExpert}
              onChange={(e) => setPopExpert(Number(e.target.value) || 0)}
              disabled={disabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Total Upgrade Points */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t("survival.totalUpgradePoints")}{" "}
            <Badge variant="secondary">0-999,999</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="number"
            min={0}
            max={999999}
            className="max-w-xs"
            value={totalUpgradePoints}
            onChange={(e) => setTotalUpgradePoints(Number(e.target.value) || 0)}
            disabled={disabled}
          />
        </CardContent>
      </Card>

      {/* Upgrades Spent */}
      <Card>
        <CardHeader>
          <CardTitle>{t("survival.upgradesSpent")}</CardTitle>
          <CardDescription>{t("survival.upgradesSpentDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {KNOWN_UPGRADE_IDS.map((id) => {
              const info = SURVIVAL_UPGRADES[id];
              return (
                <div key={id} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-48 truncate">
                    {info.name}
                    <span className="text-muted-foreground text-xs ml-1">
                      {t("survival.maxLabel", { max: String(info.maxLevel) })}
                    </span>
                  </span>
                  <Input
                    type="number"
                    className="flex-1"
                    min={0}
                    max={info.maxLevel}
                    value={upgrades[id] ?? 0}
                    onChange={(e) =>
                      updateUpgrade(id, Number(e.target.value) || 0)
                    }
                    disabled={disabled}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="sticky bottom-4 z-10 rounded-xl border bg-background/80 p-3 shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={disabled}
            className="flex-1 sm:flex-none sm:min-w-[200px]">
            <Save className="mr-2 h-4 w-4" />
            {saving ? t("editor.saving") : t("editor.saveChanges")}
          </Button>
          <Button variant="outline" onClick={loadData} disabled={disabled}>
            <RotateCcw className="mr-2 h-4 w-4" />
            {t("editor.reload")}
          </Button>
        </div>
      </div>
    </div>
  );
}
