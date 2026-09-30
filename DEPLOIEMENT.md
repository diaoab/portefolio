# Déploiement : Vercel + Neon + Cloudflare

| Service | Rôle | Offre gratuite |
|---|---|---|
| **Vercel** | Héberge le site (Next.js) | Hobby : suffisant pour démarrer |
| **Neon** | Base de données PostgreSQL | 0,5 Go |
| **Cloudflare R2** | Stockage des photos et vidéos | 10 Go, sans frais de sortie |
| **Cloudflare** (optionnel) | DNS du domaine, anti-spam Turnstile | Gratuit |
| **Brevo** | Envoi des emails | 300 emails / jour |

Durée : environ 45 minutes. Gardez ouvert le fichier **`.env`** (à la racine du projet, sur votre Mac, `open -e .env`) :
vous allez le compléter au fil des étapes. Il contient déjà une clé secrète et un mot de passe admin générés.

> `.env` est ignoré par git : il ne part jamais sur GitHub. Ne le partagez pas.

---

## Étape 1 — Base de données Neon

1. Créez un compte sur [neon.tech](https://neon.tech) → **Create project**.
   Région : **AWS Europe (Frankfurt)** (la plus proche de l'Afrique de l'Ouest et de l'Europe).
2. Sur le tableau de bord du projet, cliquez **Connect**.
3. Copiez la chaîne de connexion **avec « Connection pooling » activé** → collez-la dans `.env` sur la ligne `DATABASE_URL`.
4. Désactivez « Connection pooling », copiez la nouvelle chaîne → ligne `DIRECT_URL`.

Les deux se ressemblent. Seule différence : la première contient `-pooler` dans le nom d'hôte.

### Créer les tables et le compte super admin (depuis votre Mac)

Après avoir rempli `DATABASE_URL`, `DIRECT_URL` et `ADMIN_EMAIL` dans `.env` :

```bash
cd ~/Desktop/portefolio
npm run setup
```

Le message `Super admin créé : …` confirme la création. Ce sont vos identifiants de connexion.

---

## Étape 2 — Stockage Cloudflare R2

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **R2 Object Storage**. L'activation demande une carte bancaire, mais l'offre gratuite suffit.
2. **Create bucket** → nom : `folio-media` → emplacement automatique.
3. **URL publique** du bucket (onglet *Settings* du bucket) :
   - avec un domaine géré par Cloudflare : *Custom Domains → Connect Domain* → `media.mon-domaine.com` (recommandé) ;
   - sinon : *Public Development URL → Enable* (URL `https://pub-xxxx.r2.dev`).

   Mettez cette URL dans `.env` → `R2_PUBLIC_URL` (sans `/` final).
4. **CORS** (onglet *Settings* → *CORS Policy* → *Edit*), pour autoriser l'envoi depuis le site. Collez :

   ```json
   [
     {
       "AllowedOrigins": ["https://mon-domaine.com", "https://www.mon-domaine.com", "http://localhost:3000"],
       "AllowedMethods": ["PUT", "GET"],
       "AllowedHeaders": ["content-type"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

   Ajoutez aussi l'adresse `https://votre-projet.vercel.app` si vous testez avant d'avoir le domaine.
5. **Clés d'accès** : page R2 → *Manage R2 API Tokens* → *Create API token*
   - Permission : **Object Read & Write**, limité au bucket `folio-media`
   - Recopiez dans `.env` : *Access Key ID* → `R2_ACCESS_KEY_ID`, *Secret Access Key* → `R2_SECRET_ACCESS_KEY`
6. **Account ID** (visible sur la page R2, à droite, ou dans l'URL du tableau de bord) → `R2_ACCOUNT_ID`.

---

## Étape 3 — Emails avec Brevo

1. Compte sur [brevo.com](https://www.brevo.com) → *Paramètres → Expéditeurs, domaines* → ajoutez votre domaine et **authentifiez-le**
   (Brevo fournit 3–4 enregistrements DNS à ajouter chez Cloudflare ou votre registraire).
2. *SMTP & API → SMTP* → générez une clé SMTP.
3. Dans `.env` :

   ```
   SMTP_HOST="smtp-relay.brevo.com"
   SMTP_PORT="587"
   SMTP_USER="identifiant affiché par Brevo (xxxx@smtp-brevo.com)"
   SMTP_PASS="la clé SMTP"
   MAIL_FROM="Folio <no-reply@mon-domaine.com>"
   ```

---

## Étape 4 — Anti-spam Turnstile (recommandé)

Cloudflare → **Turnstile** → *Add widget* → domaines : `mon-domaine.com` et `votre-projet.vercel.app`, mode *Managed*.
Copiez *Site Key* → `NEXT_PUBLIC_TURNSTILE_SITE_KEY` et *Secret Key* → `TURNSTILE_SECRET_KEY`.

---

## Étape 5 — Déployer sur Vercel

1. [vercel.com](https://vercel.com) → connexion avec GitHub → **Add New… → Project** → importez `diaoab/portefolio`.
2. Framework : **Next.js** (détecté automatiquement). Ne touchez pas aux commandes de build :
   le script `vercel-build` du projet met aussi à jour les tables de la base à chaque déploiement.
3. Dépliez **Environment Variables** et collez **tout le contenu** de `.env`.
   Vercel reconnaît le format et crée chaque variable.
   - `APP_URL` : mettez `https://votre-projet.vercel.app` pour l'instant si vous n'avez pas encore le domaine.
4. **Deploy**. Comptez 2 à 3 minutes. Le site est en ligne sur `https://votre-projet.vercel.app`.

> Réglage conseillé : *Settings → Functions → Function Region* → **Frankfurt (fra1)**, la même région que Neon (le site sera plus rapide).

---

## Étape 6 — Votre nom de domaine

1. Vercel → projet → *Settings → Domains* → ajoutez `mon-domaine.com` (et `www.mon-domaine.com`).
2. Vercel affiche les enregistrements DNS à créer :
   - **Domaine chez Cloudflare** : *DNS → Records* → ajoutez-les en **désactivant le proxy** (nuage gris, « DNS only »), sinon le certificat HTTPS de Vercel ne peut pas être créé.
   - Autre registraire : ajoutez-les dans sa zone DNS.
3. Quand le domaine est validé (coche verte), mettez à jour la variable `APP_URL` dans Vercel → `https://mon-domaine.com`,
   puis *Deployments* → ⋯ → **Redeploy**.
4. Vérifiez que `https://mon-domaine.com` figure dans le CORS de R2 (étape 2.4).

---

## Étape 7 — Vérifications

1. `https://mon-domaine.com/login` → connexion avec le super admin → **Sécurité** : changez le mot de passe.
2. **Paramètres du site** : nom, logo (teste l'envoi vers R2), textes FR/EN, mentions légales (complétez « Hébergement : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis »).
3. **Mon profil** → ajoutez une photo. Si l'envoi échoue, le problème vient presque toujours du CORS R2 (étape 2.4).
4. « Mot de passe oublié ? » avec votre email → l'email doit arriver (sinon : Vercel → *Logs*).
5. [Google Search Console](https://search.google.com/search-console) → ajoutez le domaine → soumettez `https://mon-domaine.com/sitemap.xml`.

---

## Mettre à jour le site

```bash
git add -A && git commit -m "Ma modification" && git push
```

Vercel redéploie automatiquement en 2 à 3 minutes. Si le schéma de base (`prisma/schema.prisma`) a changé, les tables sont mises à jour pendant le déploiement.
Une modification destructrice (suppression de colonne…) est refusée : le déploiement échoue sans rien casser.

## Sauvegardes

- **Base** : Neon garde un historique qui permet de restaurer la base à un instant passé (*Branches → Restore*). Sur l'offre gratuite, cet historique couvre environ 24 h.
- **Fichiers** : R2 ne crée pas de sauvegarde automatique. Pour une copie locale, installez `rclone` et configurez un remote R2.

## Développer en local

```bash
npm install
npm run dev
```

Le site local utilise le même `.env` (base Neon, stockage R2). Pour séparer les données de test,
créez une branche « dev » dans Neon et mettez ses URLs dans `.env`. Sans variables `R2_*`, les fichiers vont dans `uploads/`.

## Dépannage

| Symptôme | Cause probable |
|---|---|
| Échec du build : `Environment variable not found: DIRECT_URL` | variable manquante dans Vercel |
| Échec du build pendant `prisma db push` | `DIRECT_URL` incorrecte, ou changement destructeur du schéma |
| Envoi de photo en erreur (« network » ou « HTTP 403 ») | CORS R2 (origine manquante) ou clés R2 incorrectes |
| Photos envoyées mais pas affichées | `R2_PUBLIC_URL` incorrecte ou accès public du bucket désactivé |
| Emails non reçus | identifiants SMTP, domaine non authentifié chez Brevo, dossier spam |
| Liens des emails vers le mauvais site | `APP_URL`, puis *Redeploy* |
| Captcha invisible / absent | les clés Turnstile nécessitent un **Redeploy** (la clé publique est intégrée au build) |
