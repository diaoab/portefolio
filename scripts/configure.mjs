// Assistant de configuration : demande les valeurs essentielles et les écrit dans .env.
// Usage : npm run configure
import { readFileSync, writeFileSync, existsSync, copyFileSync } from "fs";
import { createInterface } from "readline";
import { stdin, stdout } from "process";

const FILE = ".env";
if (!existsSync(FILE)) copyFileSync(".env.example", FILE);
let env = readFileSync(FILE, "utf8");

const current = (key) => env.match(new RegExp(`^${key}="([^"]*)"`, "m"))?.[1] ?? "";
const set = (key, value) => {
  const line = `${key}="${value}"`;
  env = new RegExp(`^${key}=.*$`, "m").test(env) ? env.replace(new RegExp(`^${key}=.*$`, "m"), line) : `${env.trimEnd()}\n${line}\n`;
};
const isExample = (v) => !v || v.includes("ep-xxxx") || v.includes("USER:PASSWORD") || v.includes("mon-domaine.com");

/** Nettoie une chaîne copiée depuis Neon (ex. « psql 'postgresql://…' »). */
const cleanUrl = (raw) => raw.trim().replace(/^psql\s+/, "").replace(/^['"]|['"]$/g, "").trim();

function checkNeon(url, pooled) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return "Ce n'est pas une URL valide. Elle doit commencer par postgresql://";
  }
  if (!/^postgres(ql)?:$/.test(u.protocol)) return "L'URL doit commencer par postgresql://";
  if (!u.password) return "Le mot de passe manque dans l'URL (dans Neon, cliquez « Show password » avant de copier).";
  if (!u.hostname.endsWith(".neon.tech")) return "Ce n'est pas une adresse Neon (…neon.tech).";
  if (pooled && !u.hostname.includes("-pooler")) return "Celle-ci doit être la version AVEC « Connection pooling » (l'adresse contient -pooler).";
  if (!pooled && u.hostname.includes("-pooler")) return "Celle-ci doit être la version SANS « Connection pooling » (sans -pooler).";
  return null;
}

const rl = createInterface({ input: stdin, output: stdout });
const lines = rl[Symbol.asyncIterator]();
const question = async (prompt) => {
  stdout.write(prompt);
  const { value, done } = await lines.next();
  if (done) {
    console.log("\nConfiguration interrompue : rien n'a été modifié.");
    process.exit(1);
  }
  return value;
};

async function ask(label, { key, validate, clean = (v) => v.trim(), keepIfSet = true }) {
  const existing = current(key);
  const hint = keepIfSet && !isExample(existing) ? " (Entrée = garder la valeur actuelle)" : "";
  for (;;) {
    const raw = await question(`\n${label}${hint}\n> `);
    if (!raw.trim() && hint) return;
    const value = clean(raw);
    if (value === "" && !validate?.("")) return; // optionnel laissé vide
    const error = validate?.(value);
    if (!error) return set(key, value);
    console.log(`  ✗ ${error}`);
  }
}

const section = (title) => console.log(`\n──────── ${title} ────────`);
const optional = (validate) => (v) => (v === "" ? null : validate(v));
const r2PublicUrl = (v) => (/^https:\/\/[^/\s]+$/.test(v) ? null : "Format attendu : https://pub-xxxx.r2.dev ou https://media.mon-domaine.com (sans / final)");
const notEmpty = (v) => (v ? null : "Valeur requise.");

// Choix des parties à configurer : « npm run configure r2 », sinon tout
const only = process.argv[2];
const want = (name) => !only || only === name;

console.log("\n=== Configuration de Folio (.env) ===");
console.log("Pour chaque question : collez la valeur puis Entrée. Entrée seule = garder la valeur actuelle.");

if (want("neon")) {
  section("1. Base de données Neon  (Neon → projet → bouton « Connect »)");
  await ask("URL AVEC « Connection pooling » activé (contient -pooler) :", { key: "DATABASE_URL", clean: cleanUrl, validate: (v) => checkNeon(v, true) });
  await ask("URL SANS « Connection pooling » :", { key: "DIRECT_URL", clean: cleanUrl, validate: (v) => checkNeon(v, false) });
  await ask("Votre email de connexion (super admin) :", {
    key: "ADMIN_EMAIL",
    validate: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : "Email invalide."),
  });
}

if (want("r2")) {
  section("2. Stockage Cloudflare R2  (dash.cloudflare.com → R2 Object Storage)");
  await ask("Account ID (bloc « Account Details », 32 caractères) :", {
    key: "R2_ACCOUNT_ID",
    clean: (v) => v.trim().replace(/^https?:\/\//, "").replace(/\.r2\.cloudflarestorage\.com.*$/, ""),
    validate: (v) => (/^[0-9a-f]{32}$/.test(v) ? null : "L'Account ID fait 32 caractères (chiffres et lettres a-f)."),
  });
  await ask("Nom du bucket (Entrée = folio-media) :", {
    key: "R2_BUCKET",
    clean: (v) => v.trim() || "folio-media",
    validate: (v) => (/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(v) ? null : "Nom de bucket invalide."),
    keepIfSet: false,
  });
  await ask("Access Key ID (Manage API Tokens → Create) :", { key: "R2_ACCESS_KEY_ID", validate: (v) => (/^[0-9a-f]{32}$/.test(v) ? null : "L'Access Key ID fait 32 caractères.") });
  await ask("Secret Access Key :", { key: "R2_SECRET_ACCESS_KEY", validate: (v) => (/^[0-9a-f]{64}$/.test(v) ? null : "La Secret Access Key fait 64 caractères.") });
  await ask("URL publique du bucket (Settings → Public Development URL ou Custom Domain) :", {
    key: "R2_PUBLIC_URL",
    clean: (v) => v.trim().replace(/\/+$/, ""),
    validate: r2PublicUrl,
  });
}

if (want("site")) {
  section("3. Adresse du site");
  await ask("URL publique du site, ex. https://portefolio.vercel.app (Entrée seule = plus tard) :", {
    key: "APP_URL",
    clean: (v) => v.trim().replace(/\/+$/, ""),
    validate: optional((v) => (/^https:\/\/[^/\s]+$/.test(v) ? null : "Format attendu : https://mon-domaine.com")),
  });
}

if (want("email")) {
  section("4. Emails Brevo  (Brevo → votre nom → SMTP & API → onglet SMTP)  — Entrée seule = plus tard");
  await ask("SMTP Login (ex. 8a1b2c001@smtp-brevo.com) :", { key: "SMTP_USER", validate: optional(notEmpty) });
  if (current("SMTP_USER") && !current("SMTP_HOST")) set("SMTP_HOST", "smtp-relay.brevo.com");
  await ask("Clé SMTP (commence par xsmtpsib-) :", { key: "SMTP_PASS", validate: optional(notEmpty) });
  await ask("Expéditeur validé dans Brevo, ex. Folio <no-reply@mon-domaine.com> :", { key: "MAIL_FROM", validate: optional(notEmpty) });
}

if (want("turnstile")) {
  section("5. Anti-spam Cloudflare Turnstile (optionnel)  — Entrée seule = plus tard");
  await ask("Site Key (commence par 0x) :", { key: "NEXT_PUBLIC_TURNSTILE_SITE_KEY", validate: optional((v) => (v.startsWith("0x") ? null : "La Site Key commence par 0x.")) });
  await ask("Secret Key (commence par 0x) :", { key: "TURNSTILE_SECRET_KEY", validate: optional((v) => (v.startsWith("0x") ? null : "La Secret Key commence par 0x.")) });
}

rl.close();
writeFileSync(FILE, env);
console.log("\n✓ .env enregistré.\n");
