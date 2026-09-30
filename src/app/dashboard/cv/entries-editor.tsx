"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useT } from "@/components/i18n-provider";
import { fromItems, toItems, type CvItem } from "@/lib/cv";

const blank: CvItem = { period: "", role: "", org: "", description: "" };

/** Éditeur guidé d'une liste d'expériences / formations, sérialisée dans un champ caché. */
export function EntriesEditor({ name, initial, addLabel, lang }: { name: string; initial: string; addLabel: string; lang: string }) {
  const t = useT().cvEditor;
  const [items, setItems] = useState<CvItem[]>(() => toItems(initial));

  const update = (i: number, patch: Partial<CvItem>) => setItems((list) => list.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const move = (i: number, d: number) =>
    setItems((list) => {
      const next = [...list];
      [next[i], next[i + d]] = [next[i + d]!, next[i]!];
      return next;
    });

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={fromItems(items)} />
      {items.length === 0 && <p className="rounded-xl border border-dashed border-line p-4 text-center text-sm text-muted">{t.empty}</p>}
      {items.map((it, i) => (
        <div key={i} className="rounded-xl border border-line bg-white/[0.02] p-4">
          <div className="grid gap-3 sm:grid-cols-[170px_1fr_1fr]">
            <Input label={t.period} value={it.period} placeholder={t.periodPlaceholder} onChange={(v) => update(i, { period: v })} lang={lang} />
            <Input label={t.role} value={it.role} placeholder={t.rolePlaceholder} onChange={(v) => update(i, { role: v })} lang={lang} />
            <Input label={t.org} value={it.org} placeholder={t.orgPlaceholder} onChange={(v) => update(i, { org: v })} lang={lang} />
          </div>
          <label className="mt-3 block">
            <span className="label">{t.description}</span>
            <textarea
              rows={2}
              value={it.description}
              placeholder={t.descriptionPlaceholder}
              onChange={(e) => update(i, { description: e.target.value })}
              className="input"
              lang={lang}
            />
          </label>
          <div className="mt-2 flex justify-end gap-1 text-zinc-400">
            <IconButton label={t.moveUp} disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="size-4" /></IconButton>
            <IconButton label={t.moveDown} disabled={i === items.length - 1} onClick={() => move(i, 1)}><ArrowDown className="size-4" /></IconButton>
            <IconButton label={t.remove} onClick={() => setItems((list) => list.filter((_, j) => j !== i))} danger>
              <Trash2 className="size-4" />
            </IconButton>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => setItems((list) => [...list, { ...blank }])} className="btn-ghost w-full border-dashed">
        <Plus className="size-4" /> {addLabel}
      </button>
    </div>
  );
}

function Input({ label, value, placeholder, onChange, lang }: { label: string; value: string; placeholder: string; onChange: (v: string) => void; lang: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="input" lang={lang} />
    </label>
  );
}

function IconButton({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg p-2 transition disabled:opacity-30 ${danger ? "hover:bg-red-500/10 hover:text-red-400" : "hover:bg-white/5 hover:text-white"}`}
    >
      {children}
    </button>
  );
}
