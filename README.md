# Folio — Plateforme de portfolios

Plateforme multi-utilisateurs de portfolios avec 3 espaces :

| Espace | URL | Rôle |
|---|---|---|
| **Super admin** | `/admin` | Crée les comptes, réinitialise les mots de passe, active/désactive, publie/dépublie, supprime |
| **Utilisateur** | `/dashboard` | Édite son profil, ses réalisations (texte, images, vidéos, YouTube/Vimeo), lit ses messages, change son mot de passe |
| **Public** | `/` et `/p/<slug>` | Annuaire des portfolios publiés avec recherche, page portfolio, page réalisation, formulaire de contact |

## Stack

Next.js 15 (App Router, Server Actions) · TypeScript · Tailwind CSS 4 · Prisma + SQLite · JWT (jose) en cookie httpOnly · bcrypt

## Démarrage

```bash
npm install
cp .env.example .env      # puis modifier AUTH_SECRET et le compte admin
npm run setup             # crée la base et le super admin
npm run dev
```

Ouvrir http://localhost:3000/login — identifiants par défaut : `admin@portfolio.local` / `Admin123!` (**à changer** dans `.env` avant `npm run setup`, ou via « Sécurité » une fois connecté).

## Fonctionnement

- Le super admin crée un compte → les identifiants s'affichent (bouton « Copier ») pour les transmettre.
- L'utilisateur se connecte, complète son profil, ajoute ses réalisations puis coche **« Publier mon portfolio »**.
- Seuls les portfolios **publiés** de comptes **actifs** et les réalisations **publiées** sont visibles publiquement.
- Les visiteurs contactent un utilisateur via le formulaire de son portfolio ; le message arrive dans `/dashboard/messages` (l'email de l'utilisateur n'est jamais exposé). Anti-spam : champ piège + limite de 5 messages / 10 min par IP.

## Fichiers uploadés

Stockés dans `uploads/` et servis par `/api/files/<nom>` (avec support du streaming vidéo). Limites : images 8 Mo, vidéos 100 Mo (MP4, WebM, MOV).

## Production

```bash
npm run build && npm start
```

Pour un hébergement serverless (Vercel…), remplacer SQLite par PostgreSQL (`provider = "postgresql"` dans `prisma/schema.prisma`) et le stockage local par un stockage objet (S3, Cloudinary…) dans `src/lib/uploads.ts`. Sur un VPS, la configuration actuelle fonctionne telle quelle.

## Structure

```
prisma/schema.prisma        Modèles User, Profile, Project, Media, Message
src/middleware.ts           Protection /admin et /dashboard
src/lib/                    auth, session JWT, uploads, utilitaires
src/app/admin/              Espace super admin
src/app/dashboard/          Espace utilisateur
src/app/p/[slug]/           Portfolio public + contact
src/app/page.tsx            Annuaire public
```
