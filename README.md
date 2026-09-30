# Folio — Plateforme de portfolios

Plateforme multi-utilisateurs de portfolios avec 3 espaces :

| Espace | URL | Rôle |
|---|---|---|
| **Super admin** | `/admin` | Crée les comptes, réinitialise les mots de passe, active/désactive, publie/dépublie, supprime |
| **Utilisateur** | `/dashboard` | Édite son profil, ses réalisations (texte, images, vidéos, YouTube/Vimeo), lit ses messages, change son mot de passe |
| **Public** | `/` et `/p/<slug>` | Annuaire des portfolios publiés avec recherche, page portfolio, page réalisation, formulaire de contact |

## Stack

Next.js 15 (App Router, Server Actions) · TypeScript · Tailwind CSS 4 · Prisma + PostgreSQL (Neon) · Cloudflare R2 (fichiers) · JWT (jose) en cookie httpOnly · bcrypt

Hébergement cible : **Vercel + Neon + Cloudflare** — voir [DEPLOIEMENT.md](DEPLOIEMENT.md).

## Démarrage (local)

Prérequis : Node.js 20+ et PostgreSQL (Postgres.app sur Mac, ou une branche « dev » Neon).

```bash
npm install
cp .env.example .env      # puis renseigner DATABASE_URL / DIRECT_URL et AUTH_SECRET
npm run setup             # crée les tables et le super admin
npm run dev
```

Ouvrir http://localhost:3000/login avec `ADMIN_EMAIL` / `ADMIN_PASSWORD` définis dans `.env` (à changer ensuite via « Sécurité »).

## Fonctionnement

- Le super admin crée un compte → les identifiants s'affichent (bouton « Copier ») pour les transmettre.
- L'utilisateur se connecte, complète son profil, ajoute ses réalisations puis coche **« Publier mon portfolio »**.
- Seuls les portfolios **publiés** de comptes **actifs** et les réalisations **publiées** sont visibles publiquement.
- Les visiteurs contactent un utilisateur via le formulaire de son portfolio ; le message arrive dans `/dashboard/messages` (l'email de l'utilisateur n'est jamais exposé). Anti-spam : champ piège + limite de 5 messages / 10 min par IP.

## Langues (FR / EN)

Un sélecteur **FR | EN** est présent dans l'en-tête public, l'espace utilisateur/admin et la page de connexion (choix mémorisé dans le cookie `lang`, sinon langue du navigateur). Les textes de la page d'accueil se saisissent dans les deux langues dans « Paramètres du site ».

## CV en PDF

Dans « Mon CV », l'utilisateur renseigne ses expériences, sa formation et ses langues. Une fois le CV terminé (nom, titre, présentation, compétences et au moins une expérience ou formation), il peut le télécharger en PDF, en français ou en anglais (`/api/cv/<slug>?lang=fr|en`). Le bouton « Télécharger le CV » apparaît aussi sur le portfolio public (option désactivable).

## Fichiers envoyés

Le navigateur envoie les fichiers **directement** vers le stockage grâce à une URL signée (type et taille imposés), sans passer par les fonctions serveur (limitées à 4,5 Mo sur Vercel) :

- **Production** : Cloudflare R2 (variables `R2_*`), fichiers servis par l'URL publique du bucket.
- **Local** : dossier `uploads/`, servi par `/api/files/<nom>` (streaming vidéo).

Limites : images 8 Mo (redimensionnées à 2000 px et recompressées), vidéos 100 Mo (MP4, WebM, MOV).

## Production

Guide pas à pas Vercel + Neon + Cloudflare R2 + Brevo : **[DEPLOIEMENT.md](DEPLOIEMENT.md)**.

## Fonctionnalités pro

- **Emails** (SMTP configurable) : notification à chaque message reçu (répondre à l'email répond au visiteur), « mot de passe oublié » par lien sécurisé valable 1 h. Sans SMTP, les emails s'affichent dans les logs.
- **Anti-spam** : champ piège, limite de 5 messages / 10 min par IP (persistée en base, IP hachée), captcha Cloudflare Turnstile optionnel.
- **Contenu bilingue** : version anglaise optionnelle du titre, de la bio, des réalisations et du CV, affichée aux visiteurs en anglais.
- **CV** : éditeur guidé (période, poste, structure, description), 3 modèles PDF (Moderne, Classique, Minimaliste) avec aperçu en direct, QR code vers le portfolio.
- **Texte enrichi** (Markdown léger) dans les bios et descriptions : gras, italique, listes, liens.
- **SEO** : sitemap, robots.txt, données structurées schema.org, image de partage générée pour chaque portfolio.
- **Statistiques** : visites et téléchargements de CV sur 30 jours (sans cookie de suivi).
- **Confort** : glisser-déposer des réalisations et des médias, images redimensionnées et compressées à l'envoi.
- **RGPD** : pages mentions légales et confidentialité (modifiables par l'admin), suppression de compte par l'utilisateur.

## Tests

```bash
npm test            # tests unitaires (Vitest)
npm run typecheck   # vérification TypeScript
```

La CI GitHub (`.github/workflows/ci.yml`) lance typecheck, tests et build à chaque push.

## Structure

```
prisma/schema.prisma        Modèles User, Profile, Project, Media, Message, DailyStat, PasswordResetToken
src/middleware.ts           Protection /admin et /dashboard
src/lib/                    auth, session JWT, uploads, utilitaires
src/app/admin/              Espace super admin
src/app/dashboard/          Espace utilisateur
src/app/p/[slug]/           Portfolio public + contact
src/app/page.tsx            Annuaire public
src/lib/cv-pdf.tsx          Modèles de CV PDF
src/lib/uploads.ts          Stockage des fichiers (R2 ou disque local)
src/lib/i18n.ts             Traductions FR / EN
tests/                      Tests unitaires
```
