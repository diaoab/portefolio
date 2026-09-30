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
    const error = validate?.(value);
    if (!error) return set(key, value);
    console.log(`  ✗ ${error}`);
  }
}

console.log("\n=== Configuration de Folio (.env) ===");
console.log("Neon → votre projet → bouton « Connect » (en haut à droite).");

await ask("1/3  Collez l'URL Neon AVEC « Connection pooling » activé (contient -pooler) :", {
  key: "DATABASE_URL",
  clean: cleanUrl,
  validate: (v) => checkNeon(v, true),
});
await ask("2/3  Collez l'URL Neon SANS « Connection pooling » (désactivez l'interrupteur, puis copiez) :", {
  key: "DIRECT_URL",
  clean: cleanUrl,
  validate: (v) => checkNeon(v, false),
});
await ask("3/3  Votre email de connexion (super admin) :", {
  key: "ADMIN_EMAIL",
  validate: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : "Email invalide."),
});

rl.close();
writeFileSync(FILE, env);
console.log("\n✓ .env enregistré. Étape suivante :  npm run setup\n");
