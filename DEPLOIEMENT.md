# Guide de déploiement complet

Ce guide met le site en ligne sur un **serveur VPS Ubuntu** avec votre nom de domaine et le HTTPS.
Compter environ 1 heure la première fois.

> **Pourquoi un VPS ?** Le site stocke sa base (SQLite) et les photos/vidéos envoyées sur le disque.
> Il lui faut donc un serveur qui garde ses fichiers : un VPS convient parfaitement.
> Les hébergeurs « serverless » (Vercel, Netlify) effacent le disque et ne conviennent pas sans modifications.

---

## Étape 0 — Ce qu'il vous faut

| Élément | Où l'obtenir | Prix indicatif |
|---|---|---|
| Un **VPS Ubuntu 24.04**, 2 Go de RAM, 40 Go de disque | Hostinger, OVH, Contabo, DigitalOcean, Hetzner… | 5–8 €/mois |
| Un **nom de domaine** | OVH, Namecheap, Hostinger… (`.com`, `.sn`, `.fr`…) | 10–15 €/an |
| Un compte **SMTP** pour les emails | [Brevo](https://www.brevo.com) (300 emails/jour gratuits) ou Resend | Gratuit |
| *(Optionnel)* **Cloudflare Turnstile** (anti-spam) | [dash.cloudflare.com](https://dash.cloudflare.com) → Turnstile | Gratuit |

Notez l'**adresse IP** du VPS et le **mot de passe root** envoyés par l'hébergeur.

---

## Étape 1 — Envoyer le code sur GitHub (sur votre Mac)

Le serveur récupérera le code depuis votre dépôt `github.com/diaoab/portefolio`.

```bash
cd ~/Desktop/portefolio
git add -A
git commit -m "Version prête pour la production"
git push origin main
```

Le fichier `.env` (secrets) n'est **pas** envoyé : il est ignoré par git, c'est voulu.

> Si le dépôt est **privé**, il faudra une clé de déploiement à l'étape 4 (expliqué là-bas).

---

## Étape 2 — Faire pointer le domaine vers le serveur

Chez votre registraire (zone DNS du domaine), créez :

| Type | Nom | Valeur |
|---|---|---|
| `A` | `@` | IP du VPS |
| `A` | `www` | IP du VPS |

La propagation prend de 5 minutes à quelques heures. Vérifiez avec `ping mon-domaine.com`.

---

## Étape 3 — Préparer le serveur

Connectez-vous depuis le Terminal du Mac :

```bash
ssh root@IP_DU_VPS
```

Puis, **sur le serveur** :

```bash
# Mises à jour + outils
apt update && apt upgrade -y
apt install -y git nginx sqlite3 ufw curl

# Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
npm install -g pm2

# Pare-feu : SSH + web uniquement
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# Mémoire d'appoint (évite les plantages pendant la compilation sur 1–2 Go de RAM)
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Utilisateur dédié (ne pas faire tourner le site en root)
adduser --disabled-password --gecos "" folio
```

---

## Étape 4 — Installer le site

```bash
su - folio
git clone https://github.com/diaoab/portefolio.git
cd portefolio
```

> **Dépôt privé ?** Toujours en tant que `folio` : `ssh-keygen -t ed25519` (Entrée partout), puis `cat ~/.ssh/id_ed25519.pub`.
> Ajoutez cette clé dans GitHub → dépôt → *Settings → Deploy keys*, puis clonez avec `git clone git@github.com:diaoab/portefolio.git`.

### Créer le fichier `.env`

Le plus simple : copier le `.env` préparé sur votre Mac (il contient déjà une clé secrète et un mot de passe admin générés).
Depuis **un autre Terminal sur le Mac** :

```bash
scp ~/Desktop/portefolio/.env root@IP_DU_VPS:/home/folio/portefolio/.env
ssh root@IP_DU_VPS "chown folio:folio /home/folio/portefolio/.env && chmod 600 /home/folio/portefolio/.env"
```

Puis sur le serveur, complétez-le :

```bash
nano .env
```

À remplir obligatoirement :

- `APP_URL="https://mon-domaine.com"` — votre vrai domaine, sans `/` final
- `ADMIN_EMAIL` — votre email de super admin
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` — voir l'étape 8

Enregistrez avec `Ctrl+O`, `Entrée`, puis `Ctrl+X`.

### Compiler et créer la base

```bash
npm ci
npm run setup      # crée la base prisma/data.db et le compte super admin
npm run build
```

`npm run setup` affiche l'email et le mot de passe du super admin : **notez-les**.

---

## Étape 5 — Lancer le site en permanence (PM2)

```bash
pm2 start ecosystem.config.cjs
pm2 save
exit                                    # retour en root
env PATH=$PATH:/usr/bin pm2 startup systemd -u folio --hp /home/folio
```

Vérification : `su - folio -c "pm2 status"` doit afficher `folio` en `online`.

---

## Étape 6 — Nginx (le serveur web devant le site)

En root :

```bash
cp /home/folio/portefolio/deploy/nginx.conf /etc/nginx/sites-available/folio
nano /etc/nginx/sites-available/folio          # remplacez mon-domaine.com par votre domaine (2 fois)
ln -s /etc/nginx/sites-available/folio /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

Le site répond maintenant sur `http://mon-domaine.com`.

---

## Étape 7 — HTTPS gratuit (Let's Encrypt)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d mon-domaine.com -d www.mon-domaine.com --redirect -m votre@email.com --agree-tos -n
```

Le certificat se renouvelle automatiquement. Le site est en ligne sur **https://mon-domaine.com** 🎉

---

## Étape 8 — Emails (notifications et « mot de passe oublié »)

Exemple avec **Brevo** :

1. Créez un compte, puis *Paramètres → Expéditeurs & domaines* : ajoutez et **authentifiez votre domaine**
   (Brevo donne des enregistrements DNS à ajouter chez votre registraire).
2. *SMTP & API → SMTP* : récupérez l'identifiant et générez une clé SMTP.
3. Dans `.env` sur le serveur :

   ```
   SMTP_HOST="smtp-relay.brevo.com"
   SMTP_PORT="587"
   SMTP_USER="votre-identifiant@smtp-brevo.com"
   SMTP_PASS="votre-clé-smtp"
   MAIL_FROM="Folio <no-reply@mon-domaine.com>"
   ```

4. Redémarrez : `su - folio -c "pm2 restart folio"`

Test : page de connexion → « Mot de passe oublié ? » avec votre email admin → l'email doit arriver.
En cas de problème : `su - folio -c "pm2 logs folio"`.

---

## Étape 9 — Anti-spam Turnstile (recommandé)

1. Cloudflare → *Turnstile* → *Add widget* : domaine `mon-domaine.com`, mode *Managed*.
2. Copiez les deux clés dans `.env` : `NEXT_PUBLIC_TURNSTILE_SITE_KEY` et `TURNSTILE_SECRET_KEY`.
3. **Recompilez** (la clé publique est intégrée au site lors de la compilation) :

   ```bash
   su - folio
   cd portefolio && npm run build && pm2 restart folio
   ```

---

## Étape 10 — Sauvegardes automatiques

En tant que `folio` :

```bash
crontab -e
```

Ajoutez la ligne :

```
0 3 * * * /home/folio/portefolio/deploy/backup.sh >> /home/folio/backups.log 2>&1
```

Chaque nuit à 3 h, la base et les fichiers sont sauvegardés dans `/home/folio/backups` (14 jours conservés).
Pensez à **copier ces sauvegardes hors du serveur** de temps en temps, depuis le Mac :

```bash
scp -r root@IP_DU_VPS:/home/folio/backups ~/Desktop/sauvegardes-folio
```

---

## Étape 11 — Premiers réglages sur le site

1. Connectez-vous sur `https://mon-domaine.com/login` avec le compte super admin.
2. **Sécurité** → changez le mot de passe.
3. **Paramètres du site** → nom, logo, textes FR/EN, **mentions légales** (complétez l'hébergeur : nom, adresse).
4. **Utilisateurs** → créez les comptes des talents.
5. Déclarez le site sur [Google Search Console](https://search.google.com/search-console) et soumettez `https://mon-domaine.com/sitemap.xml`.

---

## Mettre à jour le site plus tard

Sur le Mac, après vos modifications :

```bash
git add -A && git commit -m "Mise à jour" && git push
```

Sur le serveur :

```bash
ssh root@IP_DU_VPS
su - folio
cd portefolio && ./deploy/update.sh
```

La base de données et les fichiers envoyés sont conservés.

---

## Dépannage

| Symptôme | Commande / solution |
|---|---|
| Voir les erreurs du site | `su - folio -c "pm2 logs folio --lines 100"` |
| Site hors ligne (502 Bad Gateway) | `su - folio -c "pm2 restart folio"` |
| « 413 Request Entity Too Large » à l'envoi d'une vidéo | vérifier `client_max_body_size 110M;` dans la config Nginx, puis `systemctl reload nginx` |
| La compilation s'arrête (« Killed ») | mémoire insuffisante : vérifier le swap de l'étape 3 (`free -h`) |
| Les emails n'arrivent pas | identifiants SMTP dans `.env`, domaine authentifié chez le fournisseur, dossier spam, `pm2 logs` |
| Liens des emails en `localhost` | `APP_URL` mal renseigné dans `.env` → corriger puis `pm2 restart folio` |
| Restaurer une sauvegarde | `pm2 stop folio`, copier `data-AAAA-MM-JJ.db` vers `prisma/data.db`, décompresser `uploads-….tar.gz`, `pm2 start folio` |
