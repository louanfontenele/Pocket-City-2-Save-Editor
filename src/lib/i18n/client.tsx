import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { en } from "./en";
import type { Locale } from "./shared";

// Re-export Locale for convenience
export type { Locale };

type Dict = Record<string, string>;

type LocaleContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  dict: Dict;
};

const LocaleContext = createContext<LocaleContextValue>({
  locale: "en",
  setLocale: () => {},
  dict: en,
});

export function useLocaleContext() {
  const { locale, setLocale } = useContext(LocaleContext);
  return { locale, setLocale };
}

/**
 * Translation hook for client components.
 * Returns `t(key, params?)` and the current `locale`.
 */
export function useTranslation() {
  const { locale, dict } = useContext(LocaleContext);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let val = dict[key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          val = val.replaceAll(`{${k}}`, String(v));
        }
      }
      return val;
    },
    [dict],
  );

  return { t, locale };
}

/**
 * Wrap the app (in layout.tsx) with this provider.
 * `initialLocale` should come from the server cookie.
 */
export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [dict, setDict] = useState<Dict>(en);

  // Load the correct dictionary on mount and when locale changes
  useEffect(() => {
    if (locale === "en") {
      setDict(en);
    } else {
      import("./pt-br").then((m) => setDict(m.ptBr));
    }
  }, [locale]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem("locale", newLocale);
    } catch {
      /* noop */
    }
  }, []);

  const ctxValue = useMemo(
    () => ({ locale, setLocale, dict }),
    [locale, setLocale, dict],
  );

  return (
    <LocaleContext.Provider value={ctxValue}>{children}</LocaleContext.Provider>
  );
}
