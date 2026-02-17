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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RotateCcw, RefreshCw, Search, FileArchive } from "lucide-react";
import { useTranslation } from "@/lib/i18n/client";
import { INTL_LOCALE } from "@/lib/i18n/shared";

type SaveEntry = {
  filePath: string;
  fileName: string;
  tag: string;
  meta: { name: string; FILE_ID: string };
};

type BackupItem = {
  name: string;
  backupPath: string;
  sizeBytes: number;
  mtime: number;
};

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  const units = ["KB", "MB", "GB"] as const;
  let value = size / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${units[unitIndex]}`;
}

export function BackupManager() {
  const { t, locale } = useTranslation();
  const dateFormatter = new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    dateStyle: "medium",
    timeStyle: "medium",
  });
  const [saves, setSaves] = useState<SaveEntry[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [search, setSearch] = useState("");

  // Load save list
  const loadSaves = useCallback(async () => {
    try {
      const data = await window.electronAPI.scanSaves();
      if (data.ok && data.data) setSaves(data.data);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    loadSaves();
  }, [loadSaves]);

  // Load backups for selected file
  async function loadBackups(filePath: string) {
    setLoading(true);
    try {
      const data = await window.electronAPI.listBackups(filePath);
      if (data.ok && data.data) {
        setBackups(data.data);
      } else {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error(
        t("toast.backupListError", { error: (err as Error).message }),
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore(backupPath: string) {
    if (!selectedFile) return;
    if (!confirm(t("toast.backupRestoreConfirm"))) return;
    setRestoring(true);
    try {
      const data = await window.electronAPI.restoreBackup(
        selectedFile,
        backupPath,
      );
      if (data.ok) {
        toast.success(t("toast.backupRestored"));
        await loadBackups(selectedFile);
      } else {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error(
        t("toast.backupRestoreError", { error: (err as Error).message }),
      );
    } finally {
      setRestoring(false);
    }
  }

  const filteredSaves = saves.filter(
    (s) =>
      s.fileName.toLowerCase().includes(search.toLowerCase()) ||
      s.meta.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Save picker */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileArchive className="h-5 w-5" />
            {t("backup.selectSave")}
          </CardTitle>
          <CardDescription>{t("backup.selectSaveDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("backup.searchPlaceholder")}
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <ScrollArea className="max-h-[300px]">
            <div className="space-y-1">
              {filteredSaves.map((s) => (
                <button
                  key={s.filePath}
                  type="button"
                  onClick={() => {
                    setSelectedFile(s.filePath);
                    loadBackups(s.filePath);
                  }}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors flex items-center min-w-0 ${
                    selectedFile === s.filePath
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}>
                  <span className="font-medium truncate min-w-0 flex-1">
                    {s.meta.name || s.fileName}
                  </span>
                  <span className="ml-2 font-mono text-xs opacity-60 shrink-0 max-w-[200px] truncate hidden sm:inline">
                    {s.fileName}
                  </span>
                  {s.tag !== "unknown" && (
                    <Badge variant="secondary" className="ml-2 text-[10px]">
                      {s.tag}
                    </Badge>
                  )}
                </button>
              ))}
              {filteredSaves.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  {t("backup.noSavesFound")}
                </p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Backup list */}
      {selectedFile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t("backup.backupsTitle")}</span>
              <Button
                size="sm"
                variant="outline"
                disabled={loading}
                onClick={() => loadBackups(selectedFile)}>
                <RefreshCw
                  className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
                />
                {t("backup.refresh")}
              </Button>
            </CardTitle>
            <CardDescription>{t("backup.backupsDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            {backups.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {loading ? t("backup.loading") : t("backup.noBackups")}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("table.dateTime")}</TableHead>
                      <TableHead>{t("table.file")}</TableHead>
                      <TableHead className="text-right">
                        {t("table.size")}
                      </TableHead>
                      <TableHead className="text-right">
                        {t("table.action")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backups.map((b) => (
                      <TableRow key={b.backupPath}>
                        <TableCell>
                          {dateFormatter.format(new Date(b.mtime))}
                        </TableCell>
                        <TableCell className="font-mono text-xs max-w-[300px] truncate">
                          {b.name}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatBytes(b.sizeBytes)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={restoring}
                            onClick={() => handleRestore(b.backupPath)}>
                            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                            {t("backup.restore")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
