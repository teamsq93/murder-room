import { useSyncExternalStore } from "react";
import { EN } from "./en";

export type Lang = "sv" | "en";

const KEY = "murder-room-language";

function readLang(): Lang {
  try {
    return localStorage.getItem(KEY) === "en" ? "en" : "sv";
  } catch {
    return "sv";
  }
}

let lang: Lang = typeof localStorage === "undefined" ? "sv" : readLang();
const listeners = new Set<() => void>();

function stamp() {
  if (typeof document !== "undefined") document.documentElement.lang = lang;
}

stamp();

export function getLang() {
  return lang;
}

export function setLang(next: Lang) {
  lang = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* The choice lasts for this visit. */
  }
  stamp();
  listeners.forEach((listener) => listener());
}

export function subscribeLang(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useLang() {
  return useSyncExternalStore(subscribeLang, getLang, getLang);
}

export function tx(sv: string, en: string) {
  return lang === "en" ? en : sv;
}

const extra: Record<string, string> = {};
let templateCache: { value: string; pattern: RegExp }[] | null = null;

export function addTranslations(lines: Record<string, string>) {
  let changed = false;
  for (const [key, value] of Object.entries(lines)) {
    if (extra[key] !== value) {
      extra[key] = value;
      changed = true;
    }
  }
  if (changed) templateCache = null;
}

function lookup(text: string) {
  if (Object.prototype.hasOwnProperty.call(extra, text)) return extra[text];
  return EN[text];
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function compiledTemplates() {
  if (templateCache) return templateCache;
  templateCache = Object.entries({ ...EN, ...extra })
    .filter(([key]) => key.includes("{n}"))
    .sort((a, b) => b[0].length - a[0].length)
    .map(([key, value]) => ({
      value,
      pattern: new RegExp(`^${key.split("{n}").map(escapeRegExp).join("(.+?)")}$`),
    }));
  return templateCache;
}

export function tr(text: string) {
  if (lang !== "en" || !text) return text;
  return lookup(text) ?? text;
}

export function speak(text: string) {
  if (lang !== "en" || !text) return text;
  const exact = lookup(text);
  if (exact) return exact;
  for (const template of compiledTemplates()) {
    const match = template.pattern.exec(text);
    if (!match) continue;
    const parts = template.value.split("{n}");
    let out = parts[0] ?? "";
    for (let index = 1; index < parts.length; index += 1) {
      const found = match[index] ?? "";
      const who = found.toLowerCase() === "utredare" ? "investigator" : found;
      out += who + (parts[index] ?? "");
    }
    return out;
  }
  return text;
}
