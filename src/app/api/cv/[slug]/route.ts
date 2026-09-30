import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isCvComplete, isCvTemplate, parseEntries } from "@/lib/cv";
import { renderCv } from "@/lib/cv-pdf";
import { db } from "@/lib/db";
import { dictionaries, isLocale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { localizeProfile, localizeProject, stripMarkdown } from "@/lib/localize";
import { visibleProfile } from "@/lib/public";
import { siteUrl } from "@/lib/site-url";
import { track } from "@/lib/stats";
import { slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Retire la mise en forme Markdown des descriptions d'un champ de parcours. */
const plainEntries = (value: string) =>
  parseEntries(value)
    .map((e) => [e.heading, stripMarkdown(e.details)].filter(Boolean).join("\n"))
    .join("\n\n");

/**
 * CV en PDF d'un profil, dans la langue `?lang=fr|en` (sinon la langue courante).
 * Le propriétaire peut toujours le télécharger (et prévisualiser un autre modèle avec `?template=`) ;
 * les visiteurs seulement si le portfolio est publié, le CV terminé et l'option « afficher sur le portfolio » cochée.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const q = req.nextUrl.searchParams;
  const lang = q.get("lang");
  const locale = isLocale(lang) ? lang : await getLocale();
  const t = dictionaries[locale];

  const user = await getCurrentUser();
  const own = user?.profile?.slug === slug;
  const raw = await db.profile.findFirst({
    where: own ? { slug } : { slug, cvPublic: true, ...visibleProfile },
    include: { user: { select: { projects: { where: { published: true }, orderBy: { position: "asc" } } } } },
  });
  if (!raw || (!own && !isCvComplete(raw))) {
    return NextResponse.json({ error: t.notFound.title }, { status: 404 });
  }

  const localized = localizeProfile(raw, locale);
  const profile = {
    ...localized,
    bio: stripMarkdown(localized.bio),
    experience: plainEntries(localized.experience),
    education: plainEntries(localized.education),
  };
  const projects = raw.user.projects.map((p) => {
    const l = localizeProject(p, locale);
    return { ...l, summary: l.summary || stripMarkdown(l.content).slice(0, 180) };
  });
  const requested = q.get("template");
  const template = own && isCvTemplate(requested) ? requested : isCvTemplate(raw.cvTemplate) ? raw.cvTemplate : "modern";
  const portfolioUrl = raw.published ? `${await siteUrl()}/p/${raw.slug}` : null;

  const pdf = await renderCv({ profile, projects, t, locale, portfolioUrl, template });
  const inline = q.get("inline") === "1";
  if (!own && !inline) await track(raw.id, "cvDownloads");

  const fileName = `${t.cvPdf.fileName}-${slugify(raw.fullName) || raw.slug}${locale === "en" ? "-en" : ""}.pdf`;
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${fileName}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
