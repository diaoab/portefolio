import { describe, expect, it } from "vitest";
import { localizeProfile, localizeProject, stripMarkdown } from "@/lib/localize";

const profile = {
  headline: "Développeuse", headlineEn: "Developer",
  bio: "Bonjour", bioEn: "",
  experience: "exp", experienceEn: "",
  education: "edu", educationEn: "edu-en",
  languages: "Français", languagesEn: "",
};

describe("contenu bilingue", () => {
  it("utilise l'anglais quand il est rempli, sinon le français", () => {
    const en = localizeProfile(profile, "en");
    expect(en.headline).toBe("Developer");
    expect(en.bio).toBe("Bonjour");
    expect(en.education).toBe("edu-en");
    expect(localizeProfile(profile, "fr").headline).toBe("Développeuse");
  });

  it("ignore une version anglaise faite uniquement d'espaces", () => {
    const p = { title: "Titre", titleEn: "   ", summary: "", summaryEn: "", content: "", contentEn: "" };
    expect(localizeProject(p, "en").title).toBe("Titre");
  });

  it("retire la mise en forme Markdown", () => {
    expect(stripMarkdown("**Gras** et *italique* avec [un lien](https://x.dev)\n- point")).toBe("Gras et italique avec un lien\n• point");
  });
});
