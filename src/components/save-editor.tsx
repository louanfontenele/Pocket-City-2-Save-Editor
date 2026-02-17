import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Save,
  RotateCcw,
  Zap,
  Calendar,
  CalendarCheck,
  Shield,
  ShieldOff,
  Trash2,
  Download,
} from "lucide-react";
import { RESOURCE_NAMES, RESOURCE_IDS } from "@/lib/pc2/data/resources";
import { NPC_NAMES, KNOWN_NPC_IDS } from "@/lib/pc2/data/npcs";
import { CAR_MAX_ID_DEFAULT } from "@/lib/pc2/data/cars";
import { useTranslation } from "@/lib/i18n/client";

// ----- Types -----

type Snapshot = {
  FILE_ID: string;
  name: string;
  parentCity: string;
  difficulty: number;
  mapSize: number;
  day: number;
  dayProgress: number;
  money: number;
  researchPoints: number;
  level: number;
  isSurvivalMode: boolean;
  unlockAll: boolean;
  infiniteMoney: boolean;
  maxLevel: boolean;
  sandboxEnabled: boolean;
  resources: { id: number; amount: number }[];
  relationships: { id: number; level: number }[];
  unlockedCars: { id: number; unlocked: boolean }[];
};

type SaveFileInfo = {
  filePath: string;
  fileName: string;
  tag: string;
  groupId: string;
};

type Props = {
  files: SaveFileInfo[];
  initialSnapshot: Snapshot;
  initialFilePath: string;
};

// ----- Component -----

export function SaveEditor({ files, initialSnapshot, initialFilePath }: Props) {
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState(initialFilePath);
  const [snapshot, setSnapshot] = useState<Snapshot>(initialSnapshot);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable form state
  const [name, setName] = useState(snapshot.name);
  const [money, setMoney] = useState(String(snapshot.money));
  const [researchPoints, setResearchPoints] = useState(
    String(snapshot.researchPoints),
  );
  const [day, setDay] = useState(String(snapshot.day));
  const [dayProgress, setDayProgress] = useState(String(snapshot.dayProgress));
  const [level, setLevel] = useState(String(snapshot.level));
  const [mapSize, setMapSize] = useState(snapshot.mapSize);
  const originalMapSize = snapshot.mapSize;
  const [difficulty, setDifficulty] = useState(String(snapshot.difficulty));
  const [sandboxEnabled, setSandboxEnabled] = useState(snapshot.sandboxEnabled);
  const [resources, setResources] = useState(snapshot.resources);
  const [relationships, setRelationships] = useState(snapshot.relationships);
  const [unlockedCars, setUnlockedCars] = useState(snapshot.unlockedCars);

  const isSurvival = snapshot.isSurvivalMode;

  // Reload snapshot from server
  async function loadSnapshot(fp: string) {
    setLoading(true);
    try {
      const data = await window.electronAPI.readSave(fp);
      if (!data.ok) throw new Error(data.error);
      const s: Snapshot = data.data;
      setSnapshot(s);
      setName(s.name);
      setMoney(String(s.money));
      setResearchPoints(String(s.researchPoints));
      setDay(String(s.day));
      setDayProgress(String(s.dayProgress));
      setLevel(String(s.level));
      setMapSize(s.mapSize);
      setDifficulty(String(s.difficulty));
      setSandboxEnabled(s.sandboxEnabled);
      setResources(s.resources);
      setRelationships(s.relationships);
      setUnlockedCars(s.unlockedCars);
    } catch (err) {
      toast.error(t("toast.readError", { error: (err as Error).message }));
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const patch: Record<string, unknown> = {
        name,
        money: Number(money),
        researchPoints: Number(researchPoints),
        day: Number(day),
        dayProgress: Number(dayProgress),
        difficulty: Number(difficulty),
        mapSize: mapSize,
        resources: resources.map((r) => ({ id: r.id, amount: r.amount })),
        relationships: relationships.map((r) => ({ id: r.id, level: r.level })),
        unlockedCars: unlockedCars.map((c) => ({
          id: c.id,
          unlocked: c.unlocked,
        })),
      };
      if (!isSurvival) {
        patch.level = Number(level);
        patch.sandbox = sandboxEnabled;
      }
      const data = await window.electronAPI.patchSave(selectedFile, patch);
      if (!data.ok) throw new Error(data.error);
      if (data.tolerant) {
        toast.warning(t("toast.saveTolerant"));
      } else {
        toast.success(t("toast.saveSuccess"));
      }
      await loadSnapshot(selectedFile);
    } catch (err) {
      toast.error(t("toast.saveError", { error: (err as Error).message }));
    } finally {
      setSaving(false);
    }
  }

  async function handleBulk(action: string, scope: "all" | "group") {
    setSaving(true);
    try {
      const groupId = snapshot.FILE_ID || files[0]?.groupId;
      const data = await window.electronAPI.bulkPatchSaves(
        action,
        scope,
        scope === "group" ? groupId : undefined,
      );
      if (!data.ok) throw new Error(data.error);
      let msg = t("toast.bulkApplied", {
        applied: data.applied ?? 0,
        total: data.total ?? 0,
      });
      if ((data.skipped ?? 0) > 0)
        msg += t("toast.bulkSurvivalSkipped", { skipped: data.skipped ?? 0 });
      toast.success(msg);
      await loadSnapshot(selectedFile);
    } catch (err) {
      toast.error(t("toast.bulkError", { error: (err as Error).message }));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(t("editor.deleteConfirm"))) return;
    setSaving(true);
    try {
      const data = await window.electronAPI.deleteSave(selectedFile);
      if (!data.ok) throw new Error(data.error);
      toast.success(t("toast.deleteSuccess"));
    } catch (err) {
      toast.error(t("toast.deleteError", { error: (err as Error).message }));
    } finally {
      setSaving(false);
    }
  }

  function updateResource(id: number, amount: number) {
    setResources((prev) => {
      const idx = prev.findIndex((r) => r.id === id);
      if (idx < 0) return [...prev, { id, amount }];
      const copy = [...prev];
      copy[idx] = { ...copy[idx], amount };
      return copy;
    });
  }

  function updateRelationship(id: number, lvl: number) {
    setRelationships((prev) => {
      const idx = prev.findIndex((r) => r.id === id);
      if (idx < 0) return [...prev, { id, level: lvl }];
      const copy = [...prev];
      copy[idx] = { ...copy[idx], level: lvl };
      return copy;
    });
  }

  function toggleCar(id: number) {
    setUnlockedCars((prev) => {
      const idx = prev.findIndex((c) => c.id === id);
      if (idx < 0) return [...prev, { id, unlocked: true }];
      const copy = [...prev];
      copy[idx] = { ...copy[idx], unlocked: !copy[idx].unlocked };
      return copy;
    });
  }

  // Ensure all standard resource IDs are shown
  const displayResources = (() => {
    const map = new Map(resources.map((r) => [r.id, r.amount]));
    const all: { id: number; amount: number }[] = [];
    for (const id of RESOURCE_IDS) {
      all.push({ id, amount: map.get(id) ?? 0 });
    }
    for (const r of resources) {
      if (!RESOURCE_IDS.includes(r.id)) all.push(r);
    }
    return all.sort((a, b) => a.id - b.id);
  })();

  // Ensure all known NPC IDs + any extras from snapshot
  const displayRelationships = (() => {
    const map = new Map(relationships.map((r) => [r.id, r.level]));
    const all: { id: number; level: number }[] = [];
    for (const id of KNOWN_NPC_IDS) {
      all.push({ id, level: map.get(id) ?? 0 });
    }
    for (const r of relationships) {
      if (!KNOWN_NPC_IDS.includes(r.id)) all.push(r);
    }
    return all.sort((a, b) => a.id - b.id);
  })();

  // Ensure car IDs 0..26 + any extras
  const displayCars = (() => {
    const map = new Map(unlockedCars.map((c) => [c.id, c.unlocked]));
    const maxId = Math.max(
      CAR_MAX_ID_DEFAULT,
      ...unlockedCars.map((c) => c.id),
    );
    const all: { id: number; unlocked: boolean }[] = [];
    for (let i = 0; i <= maxId; i++) {
      all.push({ id: i, unlocked: map.get(i) ?? false });
    }
    return all;
  })();

  const disabledAll = loading || saving;

  return (
    <div className="space-y-6">
      {/* File selector for multiple files in the same group */}
      {files.length > 1 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {t("editor.selectFile")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {files.map((f) => (
                <Button
                  key={f.filePath}
                  size="sm"
                  variant={f.filePath === selectedFile ? "default" : "outline"}
                  disabled={disabledAll}
                  onClick={async () => {
                    setSelectedFile(f.filePath);
                    await loadSnapshot(f.filePath);
                  }}>
                  <span className="truncate max-w-[200px]">{f.fileName}</span>
                  {f.tag !== "unknown" && (
                    <Badge variant="secondary" className="ml-1.5 text-[10px]">
                      {f.tag}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk actions toolbar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {t("editor.quickActions")}
          </CardTitle>
          <CardDescription>{t("editor.quickActionsDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={disabledAll}
              onClick={() => handleBulk("setMax", "group")}>
              <Zap className="mr-1.5 h-3.5 w-3.5" /> {t("editor.setMaxMap")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={disabledAll}
              onClick={() => handleBulk("resetDay", "group")}>
              <Calendar className="mr-1.5 h-3.5 w-3.5" />{" "}
              {t("editor.resetDayMap")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={disabledAll}
              onClick={() => handleBulk("setDay100", "group")}>
              <CalendarCheck className="mr-1.5 h-3.5 w-3.5" />{" "}
              {t("editor.day100Map")}
            </Button>
            {!isSurvival && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={disabledAll}
                  onClick={() => handleBulk("enableSandbox", "group")}>
                  <Shield className="mr-1.5 h-3.5 w-3.5" />{" "}
                  {t("editor.sandboxOnMap")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={disabledAll}
                  onClick={() => handleBulk("disableSandbox", "group")}>
                  <ShieldOff className="mr-1.5 h-3.5 w-3.5" />{" "}
                  {t("editor.sandboxOffMap")}
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant="outline"
              disabled={disabledAll}
              onClick={() => handleBulk("setMax", "all")}>
              <Zap className="mr-1.5 h-3.5 w-3.5" /> {t("editor.setMaxAll")}
            </Button>
          </div>
          <Separator />
          <div>
            <Button
              size="sm"
              variant="destructive"
              disabled={disabledAll}
              onClick={handleDelete}>
              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> {t("editor.deleteSave")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main editor with tabs */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="flex w-full">
          <TabsTrigger value="general" className="flex-1">
            {t("editor.generalTab")}
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex-1">
            {t("editor.resourcesTab")}
          </TabsTrigger>
          <TabsTrigger value="npcs" className="flex-1">
            {t("editor.npcsTab")}
          </TabsTrigger>
          <TabsTrigger value="cars" className="flex-1">
            {t("editor.vehiclesTab")}
          </TabsTrigger>
        </TabsList>

        {/* ====== GENERAL TAB ====== */}
        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("editor.saveInfo")}</CardTitle>
              <CardDescription>
                {t("editor.saveInfoDesc")}
                {isSurvival && (
                  <Badge variant="destructive" className="ml-2">
                    {t("editor.survivalBadge")}
                  </Badge>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  {t("editor.cityName")}
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={disabledAll}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  {t("editor.money")}
                </label>
                <Input
                  type="number"
                  value={money}
                  onChange={(e) => setMoney(e.target.value)}
                  disabled={disabledAll}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  {t("editor.researchPoints")}
                </label>
                <Input
                  type="number"
                  value={researchPoints}
                  onChange={(e) => setResearchPoints(e.target.value)}
                  disabled={disabledAll}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("editor.day")}</label>
                <Input
                  type="number"
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  disabled={disabledAll}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  {t("editor.dayProgress")}
                </label>
                <Input
                  type="number"
                  value={dayProgress}
                  onChange={(e) => setDayProgress(e.target.value)}
                  disabled={disabledAll}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  {t("editor.difficulty")}
                </label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  disabled={disabledAll}>
                  <option value="1" className="bg-background text-foreground">
                    {t("difficulty.easy")}
                  </option>
                  <option value="2" className="bg-background text-foreground">
                    {t("difficulty.hard")}
                  </option>
                  <option value="3" className="bg-background text-foreground">
                    {t("difficulty.expert")}
                  </option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  {t("editor.level")}{" "}
                  {isSurvival && (
                    <span className="text-muted-foreground text-xs">
                      {t("editor.disabledSurvival")}
                    </span>
                  )}
                </label>
                <Input
                  type="number"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  disabled={disabledAll || isSurvival}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  {t("editor.mapSize")}{" "}
                  <span className="text-muted-foreground text-xs">
                    {t("editor.cannotDecrease")}
                  </span>
                </label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={mapSize}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val < originalMapSize) {
                      toast.warning(
                        t("toast.mapSizeWarning", { size: originalMapSize }),
                      );
                      return;
                    }
                    setMapSize(val);
                  }}
                  disabled={disabledAll}>
                  {[40, 64, 72, 88]
                    .filter((s) => s >= originalMapSize)
                    .map((s) => (
                      <option
                        key={s}
                        value={s}
                        className="bg-background text-foreground">
                        {s}×{s}
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex items-center space-x-3 col-span-full">
                <label className="text-sm font-medium">
                  {t("editor.sandboxMode")}{" "}
                  {isSurvival && (
                    <span className="text-muted-foreground text-xs">
                      {t("editor.disabledSurvival")}
                    </span>
                  )}
                </label>
                <button
                  type="button"
                  role="switch"
                  aria-checked={sandboxEnabled}
                  disabled={disabledAll || isSurvival}
                  onClick={() => setSandboxEnabled(!sandboxEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                    sandboxEnabled ? "bg-primary" : "bg-input"
                  }`}>
                  <span
                    className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                      sandboxEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
                <span className="text-sm text-muted-foreground">
                  {sandboxEnabled ? t("editor.enabled") : t("editor.disabled")}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ====== RESOURCES TAB ====== */}
        <TabsContent value="resources" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("editor.resources")}</CardTitle>
              <CardDescription>{t("editor.resourcesDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[500px]">
                <div className="grid gap-3 sm:grid-cols-2">
                  {displayResources.map((r) => (
                    <div key={r.id} className="flex items-center gap-3">
                      <span className="text-sm font-medium w-44 truncate">
                        {RESOURCE_NAMES[r.id] ??
                          t("editor.resourceFallback", { id: r.id })}
                      </span>
                      <Input
                        type="number"
                        className="flex-1"
                        value={r.amount}
                        min={0}
                        disabled={disabledAll}
                        onChange={(e) =>
                          updateResource(
                            r.id,
                            Math.max(0, Number(e.target.value) || 0),
                          )
                        }
                      />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ====== NPCS TAB ====== */}
        <TabsContent value="npcs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("editor.npcsTitle")}</CardTitle>
              <CardDescription>{t("editor.npcsDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[500px]">
                <div className="grid gap-3 sm:grid-cols-2">
                  {displayRelationships.map((r) => (
                    <div key={r.id} className="flex items-center gap-3">
                      <span className="text-sm font-medium w-44 truncate">
                        {NPC_NAMES[r.id] ??
                          t("editor.npcFallback", { id: r.id })}
                      </span>
                      <Input
                        type="number"
                        className="flex-1"
                        value={r.level}
                        disabled={disabledAll}
                        onChange={(e) =>
                          updateRelationship(r.id, Number(e.target.value) || 0)
                        }
                      />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ====== CARS TAB ====== */}
        <TabsContent value="cars" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("editor.vehiclesTitle")}</CardTitle>
              <CardDescription>{t("editor.vehiclesDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="pb-0">
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={disabledAll}
                  onClick={() =>
                    setUnlockedCars((prev) =>
                      prev.map((c) => ({ ...c, unlocked: true })),
                    )
                  }>
                  {t("editor.unlockAll")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={disabledAll}
                  onClick={() =>
                    setUnlockedCars((prev) =>
                      prev.map((c) => ({ ...c, unlocked: false })),
                    )
                  }>
                  {t("editor.lockAll")}
                </Button>
              </div>
            </CardContent>
            <CardContent>
              <ScrollArea className="max-h-[500px]">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                  {displayCars.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      disabled={disabledAll}
                      onClick={() => toggleCar(c.id)}
                      className={`rounded-lg border px-3 py-2 text-center text-sm font-medium transition-colors ${
                        c.unlocked
                          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/60"
                      } disabled:opacity-50`}>
                      #{c.id}
                      <br />
                      <span className="text-[10px]">
                        {c.unlocked ? t("editor.unlocked") : t("editor.locked")}
                      </span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save button */}
      <div className="sticky bottom-4 z-10 rounded-xl border bg-background/80 p-3 shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={disabledAll}
            className="flex-1 sm:flex-none sm:min-w-[200px]">
            <Save className="mr-2 h-4 w-4" />
            {saving ? t("editor.saving") : t("editor.saveChanges")}
          </Button>
          <Button
            variant="outline"
            onClick={() => loadSnapshot(selectedFile)}
            disabled={disabledAll}>
            <RotateCcw className="mr-2 h-4 w-4" />
            {t("editor.reload")}
          </Button>
        </div>
      </div>
    </div>
  );
}
