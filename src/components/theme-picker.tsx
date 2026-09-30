"use client";

import { useState } from "react";
import { AlertTriangle, Check, Mail } from "lucide-react";
import { useT } from "./i18n-provider";
import { contrastRatio, THEME_PRESETS, themeStyle, type ThemeColors } from "@/lib/theme";

const FIELDS: { key: keyof ThemeColors; label: "bg" | "surface" | "text" | "accent" }[] = [
  { key: "bgColor", label: "bg" },
  { key: "surfaceColor", label: "surface" },
  { key: "textColor", label: "text" },
  { key: "accent", label: "accent" },
];

export function ThemePicker({ initial, initialTheme }: { initial: ThemeColors; initialTheme: string }) {
  const [colors, setColors] = useState<ThemeColors>(initial);
  const [theme, setTheme] = useState(initialTheme);
  const t = useT().theme;
  const lowContrast = contrastRatio(colors.textColor, colors.bgColor) < 4.5;

  return (
    <div className="space-y-5">
      <input type="hidden" name="theme" value={theme} />

      <div>
        <span className="label">{t.presets}</span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {THEME_PRESETS.map((p) => {
            const active = theme === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setTheme(p.id);
                  setColors({ accent: p.accent, bgColor: p.bgColor, surfaceColor: p.surfaceColor, textColor: p.textColor });
                }}
                className={`relative overflow-hidden rounded-xl border p-2 text-left transition ${
                  active ? "border-brand ring-2 ring-brand/40" : "border-line hover:border-white/25"
                }`}
                style={{ background: p.bgColor }}
              >
                <div className="rounded-md p-1.5" style={{ background: p.surfaceColor }}>
                  <div className="h-1.5 w-2/3 rounded-full" style={{ background: p.textColor, opacity: 0.85 }} />
                  <div className="mt-1 h-1.5 w-1/3 rounded-full" style={{ background: p.accent }} />
                </div>
                <span className="mt-1.5 block text-xs font-medium" style={{ color: p.textColor }}>{t.names[p.id] ?? p.name}</span>
                {active && (
                  <Check className="absolute top-1.5 right-1.5 size-3.5 rounded-full p-0.5" style={{ background: p.accent, color: "#fff" }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <span className="label">{t.custom}</span>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {FIELDS.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 rounded-xl border border-line bg-white/[0.02] p-2.5">
              <input
                type="color"
                name={key}
                value={colors[key]}
                onChange={(e) => {
                  setColors((c) => ({ ...c, [key]: e.target.value }));
                  setTheme("custom");
                }}
                className="h-9 w-10 shrink-0 cursor-pointer rounded-lg border border-line bg-transparent"
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium">{t[label]}</span>
                <span className="block font-mono text-xs uppercase text-muted">{colors[key]}</span>
              </span>
            </label>
          ))}
        </div>
        {lowContrast && (
          <p className="mt-2 flex items-center gap-2 text-xs text-amber-300">
            <AlertTriangle className="size-3.5" /> {t.lowContrast}
          </p>
        )}
      </div>

      <div>
        <span className="label">{t.preview}</span>
        <div className="portfolio-theme overflow-hidden rounded-2xl border border-line" style={{ ...themeStyle(colors), minHeight: 0 }}>
          <div className="h-16" style={{ background: `radial-gradient(circle at 20% 30%, ${colors.accent}66, transparent 60%)` }} />
          <div className="-mt-6 space-y-4 p-5 pt-0">
            <div className="flex items-end justify-between gap-3">
              <div className="flex items-end gap-3">
                <span className="grid size-14 place-items-center rounded-full border-4 border-ink font-semibold" style={{ background: colors.accent, color: "var(--accent-fg)" }}>
                  AB
                </span>
                <div>
                  <p className="font-display font-bold">{t.yourName}</p>
                  <p className="text-xs text-zinc-400">{t.yourJob}</p>
                </div>
              </div>
              <span className="btn-primary btn-accent px-3 py-1.5 text-xs"><Mail className="size-3.5" /> {t.contact}</span>
            </div>
            <div className="card p-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <span className="h-4 w-1 rounded-full" style={{ background: "var(--accent)" }} /> {t.project}
              </p>
              <p className="mt-1 text-xs text-zinc-400">{t.previewText}</p>
              <div className="mt-3 flex gap-1.5">
                <span className="badge">Design</span>
                <span className="badge">{t.video}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
