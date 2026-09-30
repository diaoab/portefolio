import { describe, expect, it } from "vitest";
import { dictionaries } from "@/lib/i18n";

/** Liste « chemin → type » de toutes les entrées d'un dictionnaire. */
function shape(obj: object, prefix = ""): Record<string, string> {
  return Object.entries(obj).reduce<Record<string, string>>((acc, [k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") Object.assign(acc, shape(v, key));
    else acc[key] = typeof v;
    return acc;
  }, {});
}

describe("traductions", () => {
  it("le français et l'anglais ont exactement les mêmes clés", () => {
    expect(shape(dictionaries.en)).toEqual(shape(dictionaries.fr));
  });

  it("aucune traduction n'est vide", () => {
    for (const [lang, dict] of Object.entries(dictionaries)) {
      for (const [key, type] of Object.entries(shape(dict))) {
        if (type !== "string") continue;
        const value = key.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown>)[k], dict);
        expect(value, `${lang}.${key}`).not.toBe("");
      }
    }
  });

  it("les textes à variables fonctionnent", () => {
    expect(dictionaries.fr.home.toDiscover(1)).toBe("1 talent à découvrir");
    expect(dictionaries.en.home.toDiscover(3)).toBe("3 talents to discover");
  });
});
