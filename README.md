# skeu - E-commerce cosmetiques

Application e-commerce construite avec Next.js, MongoDB et Fapshi.

## Fonctionnalites

- boutique produits avec filtres, tri et recherche
- compte client avec inscription, connexion et deconnexion
- super admin (defini dans les variables d'environnement) avec panel complet
- gestion des **revendeurs** : le super admin nomme un client revendeur
- chaque revendeur a un **code / lien de parrainage** et une page de configuration
- attribution automatique des commandes au revendeur (lien ou code promo)
- **frais de livraison** configurables par le super admin selon le lieu du client
- paiement 100% sur le site via Fapshi (produits + livraison)
- redirection WhatsApp vers le revendeur pour discuter des modalites
- **notation des revendeurs** par les clients
- suivi des montants apportes par chaque revendeur cote admin
- export **PDF** : rapport general + rapport personnel par revendeur
- panier persistant avec Zustand
- favicon SVG et branding violet `SK`

## Roles

- `admin` (super admin) : defini par `ADMIN_EMAIL` / `ADMIN_PASSWORD`, acces a `/admin`
- `reseller` (revendeur) : nomme par l'admin, acces a `/reseller`
- `customer` (client) : inscription libre, peut etre rattache a un revendeur

## Parcours revendeur

1. Le client cree un compte sur `/login`
2. Le super admin saisit son email dans `Admin > Revendeurs > Nommer un revendeur`
3. Un code de parrainage unique est genere
4. Le revendeur partage son lien `/?ref=CODE` ou son code
5. Les clients qui s'inscrivent avec sont rattaches au revendeur
6. Leurs commandes payees sont comptabilisees pour ce revendeur
7. Le revendeur configure son numero WhatsApp sur `/reseller`
8. Les clients le contactent et le notent depuis `/account`

## Stack

- Next.js 14
- React 18
- Tailwind CSS
- MongoDB + Mongoose
- JWT en cookie httpOnly
- Fapshi

## Variables d'environnement

Copiez `.env.example` vers `.env.local`.

```bash
cp .env.example .env.local
```

Renseignez ensuite :

- `MONGODB_URI`
- `JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD` *(optionnel mais recommande pour login admin via variables)*
- `FAPSHI_API_USER`
- `FAPSHI_API_KEY`
- `FAPSHI_BASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_WHATSAPP_NUMBER`

## Installation locale

1. Installez les dependances

```bash
npm install
```

2. Configurez `.env.local`

3. Lancez le seed de demonstration si besoin

```bash
node scripts/seed.js
```

4. Lancez le serveur local

```bash
npm run dev
```

5. Ouvrez `http://localhost:3000`

## Connexion MongoDB Atlas

1. Creez un cluster MongoDB Atlas
2. Creez un utilisateur base de donnees
3. Autorisez l'IP necessaire dans `Network Access`
4. Recuperez l'URI de connexion
5. Placez-la dans `MONGODB_URI`

## Compte admin

La connexion admin utilise :

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD` *(optionnel mais recommande pour login admin via variables)*

Acces :

- login admin : `/admin/login`
- dashboard admin : `/admin`

Le compte admin peut se connecter via `/admin/login` ou via `/login`.

## Compte client

Les clients peuvent :

- creer un compte depuis `/account`
- se connecter
- voir leurs informations
- se deconnecter

Les comptes clients sont sauvegardes dans MongoDB.

## Recherche

La barre de recherche de la navbar envoie vers `/products?q=...`

L'API produits supporte :

- `category`
- `badge`
- `featured`
- `sort`
- `limit`
- `q`

## Paiement Fapshi

Configurez vos cles Fapshi dans `.env.local`.

Mode sandbox :

- `https://sandbox.fapshi.com`

Mode production :

- `https://live.fapshi.com`

Webhook recommande :

- `/api/payment/status`

## Deploiement Vercel

1. Poussez le repo sur GitHub
2. Importez le repo dans Vercel
3. Laissez le framework sur `Next.js`
4. Ajoutez toutes les variables d'environnement
5. Lancez le deploiement

Variables minimales a definir dans Vercel :

- `MONGODB_URI`
- `JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD` *(optionnel mais recommande pour login admin via variables)*
- `FAPSHI_API_USER`
- `FAPSHI_API_KEY`
- `FAPSHI_BASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_WHATSAPP_NUMBER`

## Build production

```bash
npm run build
npm run start
```

## Securite

- cookie auth httpOnly
- protection middleware sur `/admin`
- verification admin pour les routes sensibles
- mots de passe clients hashes avec bcrypt

## A verifier avant mise en prod

- utiliser un `JWT_SECRET` long et unique
- creer le compte admin via /login avec l'email `ADMIN_EMAIL` et un mot de passe fort
- connecter une vraie base MongoDB production
- passer Fapshi en mode live
- verifier `NEXT_PUBLIC_APP_URL`
- tester paiement, login client et login admin
