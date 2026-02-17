import { en } from "./en";
import { ptBr } from "./pt-br";

export type Locale = "en" | "pt-br";

export const INTL_LOCALE: Record<Locale, string> = {
  en: "en-US",
  "pt-br": "pt-BR",
};

/** Resolve a translation key, replacing `{param}` placeholders. */
function resolve(
  dict: Record<string, string>,
  key: string,
  params?: Record<string, string | number>,
): string {
  let val = dict[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      val = val.replaceAll(`{${k}}`, String(v));
    }
  }
  return val;
}

/** Get the translation function for a given locale. */
export function getDictFn(
  locale: Locale,
): (key: string, params?: Record<string, string | number>) => string {
  const dict = locale === "pt-br" ? ptBr : en;
  return (key, params) => resolve(dict, key, params);
}
