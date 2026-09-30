import "server-only";
import path from "path";
import QRCode from "qrcode";
import sharp from "sharp";
import { Circle, Document, Font, Image, Link, Page, Path, Rect, renderToBuffer, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";
import type { Profile, Project } from "@prisma/client";
import { parseEntries, splitHeading, type CvEntry, type CvTemplate } from "./cv";
import type { Dict, Locale } from "./i18n";
import { contrastRatio, isHex } from "./theme";
import { readUpload } from "./uploads";
import { initials, splitList } from "./utils";

// ───────────── Polices (mêmes familles que le site) ─────────────

const fontFile = (pkg: string, file: string) => path.join(process.cwd(), "node_modules/@fontsource", pkg, "files", file);

Font.register({
  family: "Inter",
  fonts: [
    { src: fontFile("inter", "inter-latin-400-normal.woff"), fontWeight: 400 },
    { src: fontFile("inter", "inter-latin-500-normal.woff"), fontWeight: 500 },
    { src: fontFile("inter", "inter-latin-600-normal.woff"), fontWeight: 600 },
    { src: fontFile("inter", "inter-latin-700-normal.woff"), fontWeight: 700 },
  ],
});
Font.register({
  family: "Grotesk",
  fonts: [
    { src: fontFile("space-grotesk", "space-grotesk-latin-500-normal.woff"), fontWeight: 500 },
    { src: fontFile("space-grotesk", "space-grotesk-latin-700-normal.woff"), fontWeight: 700 },
  ],
});
// Pas de césure automatique des mots (le moteur coupe sinon « appli-cations »)
Font.registerHyphenationCallback((word) => [word]);

// ───────────── Couleurs ─────────────

function mix(a: string, b: string, weight: number) {
  const ch = (hex: string, i: number) => parseInt(hex.slice(i, i + 2), 16);
  return (
    "#" +
    [1, 3, 5]
      .map((i) => Math.round(ch(a, i) * (1 - weight) + ch(b, i) * weight).toString(16).padStart(2, "0"))
      .join("")
  );
}

/** Palette dérivée de la couleur d'accent du portfolio, lisible sur fond blanc comme sur la barre latérale. */
function palette(accent: string) {
  let ink = accent;
  for (let i = 1; contrastRatio(ink, "#ffffff") < 4.5 && i <= 10; i++) ink = mix(accent, "#000000", i * 0.08);
  const side = mix("#0d0e14", accent, 0.14);
  return {
    accent,
    ink, // accent pour du texte sur fond blanc
    side,
    sideSoft: mix(side, "#ffffff", 0.09),
    sideLine: mix(side, "#ffffff", 0.16),
    sideAccent: mix(accent, "#ffffff", 0.35),
    sideText: "#e7e8ee",
    sideMuted: mix(side, "#ffffff", 0.58),
    tint: mix(accent, "#ffffff", 0.9),
    text: "#1d2030",
    body: "#4a4f63",
    muted: "#8a8fa3",
    line: "#e6e7ee",
  };
}
type Palette = ReturnType<typeof palette>;

// ───────────── Données ─────────────

/** Photo de profil convertie en PNG carré (tous formats acceptés : JPEG, PNG, WebP, AVIF, GIF). */
async function loadAvatar(url: string | null) {
  const original = await readUpload(url);
  if (!original) return null;
  try {
    const data = await sharp(original)
      .rotate()
      .resize(480, 480, { fit: "cover" })
      .png()
      .toBuffer();
    return { data, format: "png" as const };
  } catch {
    return null;
  }
}

const display = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

/** « Anglais (courant) » → nom + niveau. */
function splitLanguage(value: string) {
  const m = value.match(/^(.*?)\s*\((.+)\)\s*$/);
  return m ? { name: m[1]!, level: m[2]! } : { name: value, level: "" };
}

// ───────────── Icônes (tracés Lucide) ─────────────

type IconName = "pin" | "phone" | "globe" | "linkedin" | "code" | "link";

function Icon({ name, color }: { name: IconName; color: string }) {
  const stroke = { stroke: color, strokeWidth: 2, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" } as const;
  return (
    <Svg viewBox="0 0 24 24" style={{ width: 9, height: 9, marginTop: 1.5, marginRight: 7 }}>
      {name === "pin" && (
        <>
          <Path {...stroke} d="M20 10c0 5-5.5 10.2-7.4 11.8a1 1 0 0 1-1.2 0C9.5 20.2 4 15 4 10a8 8 0 0 1 16 0" />
          <Circle {...stroke} cx="12" cy="10" r="3" />
        </>
      )}
      {name === "phone" && (
        <Path
          {...stroke}
          d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
        />
      )}
      {name === "globe" && (
        <>
          <Circle {...stroke} cx="12" cy="12" r="10" />
          <Path {...stroke} d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20" />
        </>
      )}
      {name === "linkedin" && (
        <>
          <Path {...stroke} d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
          <Rect {...stroke} x="2" y="9" width="4" height="12" />
          <Circle {...stroke} cx="4" cy="4" r="2" />
        </>
      )}
      {name === "code" && <Path {...stroke} d="M16 18l6-6-6-6M8 6l-6 6 6 6" />}
      {name === "link" && (
        <Path {...stroke} d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      )}
    </Svg>
  );
}

// ───────────── Document ─────────────

const SIDEBAR = 196;

export async function renderCv({
  profile,
  projects,
  t,
  locale,
  portfolioUrl,
  template,
}: {
  profile: Profile;
  projects: Pick<Project, "title" | "summary" | "link">[];
  t: Dict;
  locale: Locale;
  portfolioUrl: string | null;
  template: CvTemplate;
}) {
  const p = palette(isHex(profile.accent) ? profile.accent : "#7c5cff");
  const c = t.cvPdf;
  const [avatar, qr] = await Promise.all([
    loadAvatar(profile.avatarUrl),
    portfolioUrl ? QRCode.toDataURL(portfolioUrl, { margin: 0, width: 240, color: { dark: p.text, light: "#ffffff" } }) : null,
  ]);

  const contact = ([
    profile.location && { icon: "pin", label: profile.location },
    profile.phone && { icon: "phone", label: profile.phone, href: `tel:${profile.phone.replace(/\s/g, "")}` },
    profile.website && { icon: "globe", label: display(profile.website), href: profile.website },
    profile.linkedin && { icon: "linkedin", label: display(profile.linkedin), href: profile.linkedin },
    profile.github && { icon: "code", label: display(profile.github), href: profile.github },
    portfolioUrl && { icon: "link", label: display(portfolioUrl), href: portfolioUrl },
  ] as (ContactItem | "" | null)[]).filter((x): x is ContactItem => !!x);
  const skills = splitList(profile.skills);
  const languages = splitList(profile.languages).map(splitLanguage);
  const experience = parseEntries(profile.experience);
  const education = parseEntries(profile.education);

  const data: CvData = { profile, projects, c, p, locale, avatar, qr, contact, skills, languages, experience, education, portfolioUrl };
  const Template = template === "classic" ? ClassicCv : template === "minimal" ? MinimalCv : ModernCv;
  return renderToBuffer(<Template {...data} />);
}

type ContactItem = { icon: IconName; label: string; href?: string };
type CvData = {
  profile: Profile;
  projects: Pick<Project, "title" | "summary" | "link">[];
  c: Dict["cvPdf"];
  p: Palette;
  locale: Locale;
  avatar: { data: Buffer; format: "png" } | null;
  qr: string | null;
  contact: ContactItem[];
  skills: string[];
  languages: { name: string; level: string }[];
  experience: CvEntry[];
  education: CvEntry[];
  portfolioUrl: string | null;
};

// ───────────── Modèle « Moderne » ─────────────

function ModernCv({ profile, projects, c, p, locale, avatar, qr, contact, skills, languages, experience, education, portfolioUrl }: CvData) {
  const s = styles(p);
  return (
    <Document title={`${c.fileName} — ${profile.fullName}`} author={profile.fullName} language={locale}>
      <Page size="A4" style={s.page}>
        {/* Fond de la barre latérale, répété sur chaque page */}
        <View fixed style={s.sideBg} />

        {/* Barre latérale (1re page) */}
        <View style={s.sidebar}>
          <View style={s.avatarRing}>
            {avatar ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={avatar} style={s.avatar} />
            ) : (
              <View style={[s.avatar, s.avatarFallback]}>
                <Text style={s.initials}>{initials(profile.fullName)}</Text>
              </View>
            )}
          </View>

          {contact.length > 0 && (
            <SideBlock title={c.contact} s={s}>
              {contact.map((item) => (
                <View key={item.label} style={s.contactRow}>
                  <Icon name={item.icon} color={p.sideAccent} />
                  {item.href ? (
                    <Link src={item.href} style={s.contactText}>{item.label}</Link>
                  ) : (
                    <Text style={s.contactText}>{item.label}</Text>
                  )}
                </View>
              ))}
            </SideBlock>
          )}

          {skills.length > 0 && (
            <SideBlock title={c.skills} s={s}>
              <View style={s.chips}>
                {skills.map((skill) => <Text key={skill} style={s.chip}>{skill}</Text>)}
              </View>
            </SideBlock>
          )}

          {languages.length > 0 && (
            <SideBlock title={c.languages} s={s}>
              {languages.map((l) => (
                <View key={l.name} style={s.langRow}>
                  <Text style={s.langName}>{l.name}</Text>
                  {l.level && <Text style={s.langLevel}>{l.level}</Text>}
                </View>
              ))}
            </SideBlock>
          )}

          {qr && portfolioUrl && (
            <View style={s.qrBlock}>
              <Link src={portfolioUrl} style={s.qrBox}>
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image src={qr} style={s.qr} />
              </Link>
              <Text style={s.qrLabel}>{c.portfolio}</Text>
            </View>
          )}
        </View>

        {/* Colonne principale */}
        <View style={s.header}>
          <Text style={s.name}>{profile.fullName}</Text>
          {profile.headline && <Text style={s.headline}>{profile.headline}</Text>}
          <View style={s.headerRule} />
        </View>

        {profile.bio && (
          <Section title={c.profile} s={s}>
            <Text style={s.lead}>{profile.bio}</Text>
          </Section>
        )}
        <Timeline title={c.experience} entries={experience} s={s} />
        <Timeline title={c.education} entries={education} s={s} />

        {projects.length > 0 && (
          <Section title={c.projects} s={s}>
            <View style={s.cards}>
              {projects.slice(0, 6).map((proj) => (
                <View key={proj.title} style={s.card} wrap={false}>
                  <View style={s.cardBar} />
                  <Text style={s.cardTitle}>{proj.title}</Text>
                  {proj.summary && <Text style={s.cardText}>{proj.summary}</Text>}
                  {proj.link && <Link src={proj.link} style={s.cardLink}>{display(proj.link)}</Link>}
                </View>
              ))}
            </View>
          </Section>
        )}

        <View fixed style={s.footer}>
          <Text>{profile.fullName} — {c.fileName}</Text>
          <Text render={({ pageNumber, totalPages }) => (totalPages > 1 ? `${pageNumber} / ${totalPages}` : "")} />
        </View>
      </Page>
    </Document>
  );
}

type S = ReturnType<typeof styles>;

function Section({ title, s, children }: { title: string; s: S; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <View style={s.sectionHeader} wrap={false} minPresenceAhead={60}>
        <Text style={s.sectionTitle}>{title}</Text>
        <View style={s.sectionLine} />
      </View>
      {children}
    </View>
  );
}

function Timeline({ title, entries, s }: { title: string; entries: CvEntry[]; s: S }) {
  if (!entries.length) return null;
  return (
    <Section title={title} s={s}>
      {entries.map((e, i) => {
        const { period, title: heading, org } = splitHeading(e.heading);
        const last = i === entries.length - 1;
        return (
          <View key={i} style={s.tlRow} wrap={false}>
            <Text style={s.tlPeriod}>{period}</Text>
            <View style={s.tlRail}>
              <View style={s.tlDot} />
              {!last && <View style={s.tlLine} />}
            </View>
            <View style={[s.tlBody, last ? {} : { paddingBottom: 12 }]}>
              <Text style={s.tlTitle}>{heading}</Text>
              {org && <Text style={s.tlOrg}>{org}</Text>}
              {e.details && <Text style={s.tlText}>{e.details}</Text>}
            </View>
          </View>
        );
      })}
    </Section>
  );
}

function SideBlock({ title, s, children }: { title: string; s: S; children: React.ReactNode }) {
  return (
    <View style={s.sideBlock}>
      <Text style={s.sideTitle}>{title}</Text>
      {children}
    </View>
  );
}

function styles(p: Palette) {
  return StyleSheet.create({
    page: {
      fontFamily: "Inter",
      fontSize: 9.5,
      color: p.body,
      paddingTop: 44,
      paddingBottom: 56,
      paddingLeft: SIDEBAR + 34,
      paddingRight: 38,
      backgroundColor: "#ffffff",
    },

    // Barre latérale
    sideBg: { position: "absolute", top: 0, left: 0, bottom: 0, width: SIDEBAR, backgroundColor: p.side },
    sidebar: { position: "absolute", top: 0, left: 0, bottom: 0, width: SIDEBAR, paddingTop: 44, paddingHorizontal: 24 },
    avatarRing: { width: 116, height: 116, borderRadius: 58, padding: 4, backgroundColor: p.accent, alignSelf: "center", marginBottom: 30 },
    avatar: { width: 108, height: 108, borderRadius: 54, objectFit: "cover" },
    avatarFallback: { backgroundColor: p.sideSoft, alignItems: "center", justifyContent: "center" },
    initials: { fontFamily: "Grotesk", fontWeight: 700, fontSize: 34, color: p.sideText },
    sideBlock: { marginBottom: 22 },
    sideTitle: {
      fontWeight: 700,
      fontSize: 7.5,
      letterSpacing: 1.8,
      textTransform: "uppercase",
      color: p.sideAccent,
      paddingBottom: 6,
      marginBottom: 9,
      borderBottomWidth: 0.75,
      borderBottomColor: p.sideLine,
    },
    contactRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 6 },
    contactText: { flex: 1, fontSize: 8.5, lineHeight: 1.35, color: p.sideText, textDecoration: "none" },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
    chip: { fontSize: 8, fontWeight: 500, paddingVertical: 3.5, paddingHorizontal: 7, borderRadius: 9, backgroundColor: p.sideSoft, color: p.sideText },
    langRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 },
    langName: { fontSize: 8.5, fontWeight: 600, color: p.sideText },
    langLevel: { fontSize: 7.5, color: p.sideMuted },
    qrBlock: { position: "absolute", left: 24, bottom: 40, flexDirection: "row", alignItems: "center" },
    qrBox: { width: 50, height: 50, padding: 5, borderRadius: 6, backgroundColor: "#ffffff" },
    qr: { width: 40, height: 40 },
    qrLabel: { marginLeft: 10, fontSize: 7.5, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase", color: p.sideMuted },

    // En-tête
    header: { marginBottom: 6 },
    name: { fontFamily: "Grotesk", fontWeight: 700, fontSize: 30, letterSpacing: -0.6, lineHeight: 1.1, color: p.text },
    headline: { marginTop: 6, fontSize: 10, fontWeight: 600, letterSpacing: 0.4, color: p.ink },
    headerRule: { marginTop: 14, width: 40, height: 3, borderRadius: 2, backgroundColor: p.accent },

    // Sections
    section: { marginTop: 22 },
    sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 11 },
    sectionTitle: { fontFamily: "Grotesk", fontWeight: 700, fontSize: 11, letterSpacing: 1.6, textTransform: "uppercase", color: p.text },
    sectionLine: { flex: 1, height: 0.75, marginLeft: 10, backgroundColor: p.line },
    lead: { fontSize: 9.8, lineHeight: 1.6, color: p.body },

    // Frise
    tlRow: { flexDirection: "row" },
    tlPeriod: { width: 72, paddingTop: 1, paddingRight: 8, fontSize: 7.8, fontWeight: 600, lineHeight: 1.35, color: p.muted, textAlign: "right" },
    tlRail: { width: 16, alignItems: "center" },
    tlDot: { width: 8, height: 8, marginTop: 2, borderRadius: 4, borderWidth: 2, borderColor: p.accent, backgroundColor: "#ffffff" },
    tlLine: { flex: 1, width: 1, marginTop: 2, backgroundColor: p.line },
    tlBody: { flex: 1, paddingLeft: 6 },
    tlTitle: { fontSize: 10.2, fontWeight: 600, color: p.text },
    tlOrg: { marginTop: 1.5, fontSize: 8.8, fontWeight: 500, color: p.ink },
    tlText: { marginTop: 4, fontSize: 9, lineHeight: 1.5, color: p.body },

    // Réalisations
    cards: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
    card: { width: "48.5%", marginBottom: 9, padding: 10, paddingLeft: 13, borderRadius: 6, backgroundColor: p.tint },
    cardBar: { position: "absolute", left: 0, top: 10, bottom: 10, width: 2.5, borderRadius: 2, backgroundColor: p.accent },
    cardTitle: { fontSize: 9.5, fontWeight: 600, color: p.text },
    cardText: { marginTop: 3, fontSize: 8.5, lineHeight: 1.45, color: p.body },
    cardLink: { marginTop: 5, fontSize: 7.8, fontWeight: 500, color: p.ink, textDecoration: "none" },

    footer: {
      position: "absolute",
      left: SIDEBAR + 34,
      right: 38,
      bottom: 24,
      flexDirection: "row",
      justifyContent: "space-between",
      fontSize: 7.5,
      color: p.muted,
      borderTopWidth: 0.75,
      borderTopColor: p.line,
      paddingTop: 7,
    },
  });
}

// ───────────── Modèle « Classique » : une colonne, sobre ─────────────

function ClassicCv({ profile, projects, c, p, locale, avatar, contact, skills, languages, experience, education, qr, portfolioUrl }: CvData) {
  const s = StyleSheet.create({
    page: { fontFamily: "Inter", fontSize: 9.5, color: p.body, paddingTop: 46, paddingBottom: 56, paddingHorizontal: 54 },
    header: { flexDirection: "row", alignItems: "center", paddingBottom: 16, borderBottomWidth: 1.5, borderBottomColor: p.text },
    avatar: { width: 74, height: 74, borderRadius: 37, marginRight: 20, objectFit: "cover" },
    name: { fontFamily: "Grotesk", fontWeight: 700, fontSize: 26, letterSpacing: -0.4, color: p.text },
    headline: { marginTop: 3, fontSize: 11, fontWeight: 500, color: p.ink },
    contact: { flexDirection: "row", flexWrap: "wrap", marginTop: 8 },
    contactItem: { fontSize: 8.5, color: p.body, textDecoration: "none" },
    sep: { fontSize: 8.5, color: p.muted, marginHorizontal: 5 },
    section: { marginTop: 18 },
    sectionTitle: {
      fontFamily: "Grotesk",
      fontWeight: 700,
      fontSize: 10.5,
      letterSpacing: 1.8,
      textTransform: "uppercase",
      color: p.ink,
      paddingBottom: 4,
      marginBottom: 9,
      borderBottomWidth: 0.75,
      borderBottomColor: p.line,
    },
    lead: { fontSize: 9.8, lineHeight: 1.6 },
    entry: { marginBottom: 10 },
    entryHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
    entryTitle: { flex: 1, fontSize: 10.2, fontWeight: 600, color: p.text },
    entryPeriod: { fontSize: 8.5, fontWeight: 500, color: p.muted, marginLeft: 12 },
    entryOrg: { marginTop: 1, fontSize: 9, fontStyle: "normal", fontWeight: 500, color: p.ink },
    entryText: { marginTop: 3, fontSize: 9, lineHeight: 1.5 },
    twoCols: { flexDirection: "row", gap: 24 },
    col: { flex: 1 },
    inline: { fontSize: 9.2, lineHeight: 1.6 },
    project: { marginBottom: 7 },
    projectTitle: { fontSize: 9.5, fontWeight: 600, color: p.text },
    footer: { position: "absolute", left: 54, right: 54, bottom: 26, flexDirection: "row", justifyContent: "space-between", alignItems: "center", fontSize: 7.5, color: p.muted },
    qr: { width: 34, height: 34 },
  });

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={s.section}>
      <Text style={s.sectionTitle} minPresenceAhead={50}>{title}</Text>
      {children}
    </View>
  );
  const Entries = ({ entries }: { entries: CvEntry[] }) =>
    entries.map((e, i) => {
      const h = splitHeading(e.heading);
      return (
        <View key={i} style={s.entry} wrap={false}>
          <View style={s.entryHead}>
            <Text style={s.entryTitle}>{h.title}</Text>
            {h.period && <Text style={s.entryPeriod}>{h.period}</Text>}
          </View>
          {h.org && <Text style={s.entryOrg}>{h.org}</Text>}
          {e.details && <Text style={s.entryText}>{e.details}</Text>}
        </View>
      );
    });

  return (
    <Document title={`${c.fileName} — ${profile.fullName}`} author={profile.fullName} language={locale}>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          {avatar && <Image src={avatar} style={s.avatar} />}
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{profile.fullName}</Text>
            {profile.headline && <Text style={s.headline}>{profile.headline}</Text>}
            <View style={s.contact}>
              {contact.map((item, i) => (
                <View key={item.label} style={{ flexDirection: "row" }}>
                  {i > 0 && <Text style={s.sep}>·</Text>}
                  {item.href ? <Link src={item.href} style={s.contactItem}>{item.label}</Link> : <Text style={s.contactItem}>{item.label}</Text>}
                </View>
              ))}
            </View>
          </View>
        </View>

        {profile.bio && (
          <Section title={c.profile}>
            <Text style={s.lead}>{profile.bio}</Text>
          </Section>
        )}
        {experience.length > 0 && <Section title={c.experience}><Entries entries={experience} /></Section>}
        {education.length > 0 && <Section title={c.education}><Entries entries={education} /></Section>}

        {(skills.length > 0 || languages.length > 0) && (
          <View style={s.twoCols} wrap={false}>
            {skills.length > 0 && (
              <View style={s.col}>
                <Section title={c.skills}><Text style={s.inline}>{skills.join("  ·  ")}</Text></Section>
              </View>
            )}
            {languages.length > 0 && (
              <View style={s.col}>
                <Section title={c.languages}>
                  <Text style={s.inline}>{languages.map((l) => (l.level ? `${l.name} (${l.level})` : l.name)).join("  ·  ")}</Text>
                </Section>
              </View>
            )}
          </View>
        )}

        {projects.length > 0 && (
          <Section title={c.projects}>
            {projects.slice(0, 6).map((proj) => (
              <View key={proj.title} style={s.project} wrap={false}>
                <Text style={s.projectTitle}>
                  {proj.title}
                  {proj.link ? <Text style={{ fontWeight: 400, color: p.muted }}>{`  —  ${display(proj.link)}`}</Text> : null}
                </Text>
                {proj.summary && <Text style={s.entryText}>{proj.summary}</Text>}
              </View>
            ))}
          </Section>
        )}

        <View fixed style={s.footer}>
          <Text>{profile.fullName} — {c.fileName}</Text>
          {qr && portfolioUrl ? (
            <Link src={portfolioUrl}>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image src={qr} style={s.qr} />
            </Link>
          ) : (
            <Text render={({ pageNumber, totalPages }) => (totalPages > 1 ? `${pageNumber} / ${totalPages}` : "")} />
          )}
        </View>
      </Page>
    </Document>
  );
}

// ───────────── Modèle « Minimaliste » : gouttière de titres, beaucoup de blanc ─────────────

function MinimalCv({ profile, projects, c, p, locale, contact, skills, languages, experience, education }: CvData) {
  const GUTTER = 118;
  const s = StyleSheet.create({
    page: { fontFamily: "Inter", fontSize: 9.3, color: p.body, paddingTop: 64, paddingBottom: 60, paddingHorizontal: 60 },
    name: { fontFamily: "Grotesk", fontWeight: 500, fontSize: 32, letterSpacing: -0.8, color: p.text },
    dot: { color: p.accent },
    headline: { marginTop: 6, fontSize: 11, color: p.muted },
    contact: { marginTop: 14, flexDirection: "row", flexWrap: "wrap", gap: 14 },
    contactItem: { fontSize: 8.5, color: p.body, textDecoration: "none" },
    row: { flexDirection: "row", marginTop: 26 },
    label: { width: GUTTER, paddingTop: 1.5, fontSize: 7.5, fontWeight: 600, letterSpacing: 1.6, textTransform: "uppercase", color: p.muted },
    content: { flex: 1 },
    lead: { fontSize: 10, lineHeight: 1.65, color: p.text },
    entry: { marginBottom: 12 },
    entryTitle: { fontSize: 10, fontWeight: 600, color: p.text },
    entryMeta: { marginTop: 2, fontSize: 8.5, color: p.muted },
    entryText: { marginTop: 4, fontSize: 9, lineHeight: 1.55 },
    inline: { fontSize: 9.3, lineHeight: 1.7, color: p.text },
    footer: { position: "absolute", left: 60 + GUTTER, right: 60, bottom: 30, fontSize: 7.5, color: p.muted },
  });

  const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <View style={s.row}>
      <Text style={s.label}>{label}</Text>
      <View style={s.content}>{children}</View>
    </View>
  );
  const Entries = ({ entries }: { entries: CvEntry[] }) =>
    entries.map((e, i) => {
      const h = splitHeading(e.heading);
      const meta = [h.org, h.period].filter(Boolean).join("  ·  ");
      return (
        <View key={i} style={s.entry} wrap={false}>
          <Text style={s.entryTitle}>{h.title}</Text>
          {meta && <Text style={s.entryMeta}>{meta}</Text>}
          {e.details && <Text style={s.entryText}>{e.details}</Text>}
        </View>
      );
    });

  return (
    <Document title={`${c.fileName} — ${profile.fullName}`} author={profile.fullName} language={locale}>
      <Page size="A4" style={s.page}>
        <Text style={s.name}>
          {profile.fullName}
          <Text style={s.dot}>.</Text>
        </Text>
        {profile.headline && <Text style={s.headline}>{profile.headline}</Text>}
        <View style={s.contact}>
          {contact.map((item) =>
            item.href ? <Link key={item.label} src={item.href} style={s.contactItem}>{item.label}</Link> : <Text key={item.label} style={s.contactItem}>{item.label}</Text>,
          )}
        </View>

        {profile.bio && <Row label={c.profile}><Text style={s.lead}>{profile.bio}</Text></Row>}
        {experience.length > 0 && <Row label={c.experience}><Entries entries={experience} /></Row>}
        {education.length > 0 && <Row label={c.education}><Entries entries={education} /></Row>}
        {skills.length > 0 && <Row label={c.skills}><Text style={s.inline}>{skills.join(", ")}</Text></Row>}
        {languages.length > 0 && (
          <Row label={c.languages}>
            <Text style={s.inline}>{languages.map((l) => (l.level ? `${l.name} — ${l.level}` : l.name)).join(", ")}</Text>
          </Row>
        )}
        {projects.length > 0 && (
          <Row label={c.projects}>
            {projects.slice(0, 6).map((proj) => (
              <View key={proj.title} style={s.entry} wrap={false}>
                <Text style={s.entryTitle}>{proj.title}</Text>
                {proj.link && <Link src={proj.link} style={[s.entryMeta, { textDecoration: "none" }]}>{display(proj.link)}</Link>}
                {proj.summary && <Text style={s.entryText}>{proj.summary}</Text>}
              </View>
            ))}
          </Row>
        )}

        <Text fixed style={s.footer} render={({ pageNumber, totalPages }) => (totalPages > 1 ? `${profile.fullName} — ${pageNumber} / ${totalPages}` : "")} />
      </Page>
    </Document>
  );
}
