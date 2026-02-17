import "./app/globals.css";
import { injectElectronMock } from "@/lib/electron-mock";

// Inject mock electronAPI for browser dev mode (pnpm dev)
injectElectronMock();

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { LocaleProvider } from "@/lib/i18n/client";
import { App } from "./App";
import { HomePage } from "./pages/home";
import { SavesPage } from "./pages/saves";
import { SaveDetailPage } from "./pages/save-detail";
import { BackupsPage } from "./pages/backups";
import { SettingsPage } from "./pages/settings";
import { SurvivalGlobalConfigPage } from "./pages/survival-global-config";

function getInitialLocale(): "en" | "pt-br" {
  try {
    const stored = localStorage.getItem("locale");
    if (stored === "pt-br") return "pt-br";
  } catch {}
  return "en";
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LocaleProvider initialLocale={getInitialLocale()}>
      <HashRouter>
        <Routes>
          <Route element={<App />}>
            <Route index element={<HomePage />} />
            <Route path="saves" element={<SavesPage />} />
            <Route path="saves/:id" element={<SaveDetailPage />} />
            <Route path="backups" element={<BackupsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route
              path="survival-global-config"
              element={<SurvivalGlobalConfigPage />}
            />
          </Route>
        </Routes>
      </HashRouter>
      <Toaster richColors closeButton position="bottom-right" />
    </LocaleProvider>
  </StrictMode>,
);
