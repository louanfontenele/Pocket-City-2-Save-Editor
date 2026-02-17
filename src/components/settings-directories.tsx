"use client";

import * as React from "react";
import { FolderPlus, RefreshCcw, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/lib/i18n/client";

type DirectoryHandle = {
  name: string;
  kind?: "file" | "directory";
};

const WINDOWS_DEFAULT_PATH =
  "%USERPROFILE%/AppData/LocalLow/Codebrew Games Inc_/Pocket City 2/pocketcity2";
const MAC_DEFAULT_PATH =
  "~/Library/Application Support/Codebrew Games Inc/Pocket City 2/pocketcity2";

function detectDefaultPath() {
  if (typeof window === "undefined") {
    return null;
  }

  const platform = window.navigator.platform?.toLowerCase() ?? "";
  const userAgent = window.navigator.userAgent?.toLowerCase() ?? "";

  const isWindows = platform.includes("win") || userAgent.includes("windows");
  const isMac = platform.includes("mac") || userAgent.includes("mac");

  if (isMac) return MAC_DEFAULT_PATH;
  if (isWindows) return WINDOWS_DEFAULT_PATH;

  return null;
}

export function SettingsDirectories() {
  const { t } = useTranslation();
  const [directories, setDirectories] = React.useState<string[]>([]);
  const [inputValue, setInputValue] = React.useState("");
  const [defaultPath, setDefaultPath] = React.useState<string | null>(null);
  const [isRescanning, setIsRescanning] = React.useState(false);
  const [scanMessage, setScanMessage] = React.useState<string | null>(null);
  const [pickerMessage, setPickerMessage] = React.useState<string | null>(null);

  const addDirectory = React.useCallback(
    (path: string, appendBottom = false) => {
      const trimmed = path.trim();
      if (!trimmed) return;
      setDirectories((prev) => {
        if (prev.includes(trimmed)) return prev;
        return appendBottom ? [...prev, trimmed] : [trimmed, ...prev];
      });
    },
    [],
  );

  React.useEffect(() => {
    const path = detectDefaultPath();
    setDefaultPath(path);
    if (path) {
      addDirectory(path, true);
    }
  }, [addDirectory]);

  async function handleAddClick() {
    const trimmed = inputValue.trim();
    if (trimmed) {
      addDirectory(trimmed);
      setInputValue("");
      return;
    }

    // All browser APIs are referenced inside the handler (client-only)
    const useNativePicker = async () => {
      try {
        const anyWin = window as typeof window & {
          showDirectoryPicker?: () => Promise<DirectoryHandle>;
          isSecureContext?: boolean;
        };
        if (
          typeof anyWin.showDirectoryPicker === "function" &&
          anyWin.isSecureContext !== false
        ) {
          const handle = await anyWin.showDirectoryPicker();
          if (
            handle &&
            (handle.kind === undefined || handle.kind === "directory")
          ) {
            // Only folder name is exposed; browsers do not reveal absolute paths
            addDirectory(handle.name);
            return true;
          }
        }
      } catch (err) {
        // User cancelled is expected; treat as handled and stop
        if ((err as DOMException)?.name === "AbortError") return true;
        // Otherwise fall through to fallback
      }
      return false;
    };

    const useHiddenInputFallback = async () => {
      return new Promise<void>((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        // Boolean attributes for directory selection across browsers
        input.setAttribute("webkitdirectory", "");
        input.setAttribute("directory", "");
        input.setAttribute("mozdirectory", "");
        (input as unknown as Record<string, boolean>).webkitdirectory = true;
        (input as unknown as Record<string, boolean>).directory = true;
        (input as unknown as Record<string, boolean>).mozdirectory = true;
        input.multiple = true;
        input.style.display = "none";
        const onChange = () => {
          const files = Array.from(input.files ?? []);
          const roots = new Set<string>();
          for (const f of files) {
            const rp = (f as File & { webkitRelativePath?: string })
              .webkitRelativePath;
            if (rp) {
              const top = rp.split("/")[0];
              if (top) roots.add(top);
            }
          }
          if (roots.size === 0 && files.length > 0) {
            roots.add(files[0].name);
          }
          roots.forEach((folder) => addDirectory(folder));
          cleanup();
          resolve();
        };
        const cleanup = () => {
          input.removeEventListener("change", onChange);
          if (input.parentNode) document.body.removeChild(input);
        };
        input.addEventListener("change", onChange);
        document.body.appendChild(input);
        // Programmatically open a folder chooser; user sees only OS folder UI
        input.click();
      });
    };

    if (typeof window !== "undefined") {
      const usedNative = await useNativePicker();
      if (!usedNative) {
        // Fallback (Firefox/Safari): hidden <input webkitdirectory> created on demand
        await useHiddenInputFallback();
      }
    }
  }

  // no persistent hidden input; fallback input is created and removed on-demand

  function handleRemove(path: string) {
    setDirectories((prev) => prev.filter((item) => item !== path));
  }

  function handleRescan() {
    if (directories.length === 0) {
      setScanMessage(t("settings.addFirst"));
      return;
    }

    setIsRescanning(true);
    setScanMessage(t("settings.scanning"));
    // Placeholder for actual rescan logic.
    setTimeout(() => {
      const timestamp = new Date().toLocaleTimeString();
      setScanMessage(t("settings.rescanComplete", { time: timestamp }));
      setIsRescanning(false);
    }, 1000);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.saveDirectories")}</CardTitle>
        <CardDescription>{t("settings.saveDirectoriesDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder={t("settings.addFolderPlaceholder")}
            className="sm:flex-1"
          />
          <Button onClick={handleAddClick} className="sm:w-auto">
            <FolderPlus className="mr-2 size-4" />
            {t("settings.addDirectory")}
          </Button>
        </div>
        {pickerMessage ? (
          <p className="text-xs text-muted-foreground">{pickerMessage}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            {t("settings.helperText")}
          </p>
        )}

        <div className="flex flex-col gap-2 rounded-lg border p-3 text-sm">
          <span className="font-medium">{t("settings.detectedDefault")}</span>
          <code className="block truncate rounded bg-muted px-2 py-1">
            {defaultPath ?? t("settings.notDetected")}
          </code>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">
              {t("settings.trackedDirectories")}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRescan}
              disabled={isRescanning}>
              <RefreshCcw
                className={cn(
                  "mr-2 size-4",
                  isRescanning ? "animate-spin" : "",
                )}
              />
              {t("settings.rescanSaves")}
            </Button>
          </div>
          {directories.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("settings.noDirectories")}
            </p>
          ) : (
            <ul className="space-y-2">
              {directories.map((directory) => (
                <li
                  key={directory}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm">
                  <span className="truncate" title={directory}>
                    {directory}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleRemove(directory)}
                    aria-label={t("settings.removeAriaLabel", { directory })}>
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {scanMessage ? (
          <p className="text-sm text-muted-foreground">{scanMessage}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
