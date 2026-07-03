# Fyn Beauty

Boutique de cosmétiques (Algérie) — **React** (frontend) + **Node.js / Express / SQLite** (backend).
Conçu pour un déploiement sur **Hostinger** (hébergement mutualisé avec l'application Node.js de hPanel).

## Structure

```
backend/    API Node.js + Express + SQLite (better-sqlite3)
frontend/   Application React (Create React App + CRACO)
```

La base de données est un simple fichier SQLite créé automatiquement au premier
démarrage (`backend/data/fynbeauty.sqlite` par défaut) — aucun serveur de base
de données séparé à installer ou configurer.

## Compte administrateur

Un compte admin permanent est créé automatiquement au premier démarrage :

- **Email :** `admin@fynbeauty.store`
- **Mot de passe :** `adminoussamafyn2026`

Ces valeurs peuvent être changées via `ADMIN_EMAIL` / `ADMIN_PASSWORD` dans le `.env` du backend.
Ce compte ne peut pas être supprimé depuis le panneau d'administration.

---

## Développement local

### 1. Backend

```bash
cd backend
cp .env.example .env        # ajustez JWT_SECRET si besoin
npm install
npm start                   # démarre l'API sur le port 8001
```

Au démarrage, le backend crée automatiquement le fichier SQLite, les tables et
les données de démonstration (catégories, produits, coupons, compte admin).

### 2. Frontend

```bash
cd frontend
cp .env.example .env        # REACT_APP_BACKEND_URL=http://localhost:8001
npm install
npm start                   # ouvre http://localhost:3000
```

---

## Déploiement sur Hostinger (hébergement mutualisé)

### A. Backend (application Node.js)
1. Envoyez le dossier `backend/` sur le serveur (sans `node_modules/` ni `data/`).
2. hPanel → **Avancé → Node.js** : créez une application.
   - **Fichier de démarrage :** `server.js`
   - **Version de Node :** 18 ou supérieure
3. Renseignez les variables d'environnement (équivalent du `.env`) :
   `NODE_ENV=production`, `JWT_SECRET` (chaîne aléatoire d'au moins 32
   caractères — le serveur refuse de démarrer en production sans ça),
   `ADMIN_EMAIL`, `ADMIN_PASSWORD` (changez la valeur par défaut, elle est
   publiée dans ce README), `CORS_ORIGINS=https://votre-domaine`. `DB_PATH`
   est optionnel (par défaut `backend/data/fynbeauty.sqlite`) — assurez-vous
   simplement que le dossier `data/` persiste entre les déploiements (c'est
   là que vivent vos données).
4. Lancez `npm install` puis démarrez l'application.

> `better-sqlite3` contient un module natif compilé au moment de `npm install`.
> Utilisez la même version majeure de Node en local et sur Hostinger pour
> éviter tout problème de compatibilité binaire.

### B. Frontend
Deux options :

**Option 1 — application unique (recommandée) :** laissez `REACT_APP_BACKEND_URL`
vide, lancez `npm run build`, et placez le contenu de `frontend/build/` à côté
du backend. Le serveur Node sert automatiquement le build (voir `server.js`) et
l'API sous le même domaine — aucune configuration CORS particulière requise.

**Option 2 — site statique séparé :** définissez `REACT_APP_BACKEND_URL` sur
l'URL de l'API, lancez `npm run build`, et déposez `frontend/build/` dans
`public_html`. Pensez à ajouter ce domaine à `CORS_ORIGINS` côté backend.

> Pour le routage côté client (React Router) en site statique, ajoutez un
> `.htaccess` qui redirige toutes les routes vers `index.html`.

---

## Sécurité

Mesures déjà en place dans le backend :
- Mots de passe hachés avec bcrypt (12 rounds) ; longueur minimale de 8 caractères.
- JWT signés HS256, algorithme forcé à la vérification (pas de faille "alg=none").
- Toutes les requêtes SQL sont paramétrées (aucune concaténation de valeurs utilisateur).
- En-têtes de sécurité HTTP via `helmet` (nosniff, HSTS, frameguard, etc.).
- Limitation de débit (`express-rate-limit`) sur la connexion/l'inscription
  (10/15 min), la validation de coupon (30/15 min), la création de commande
  (20/heure) et l'ensemble de l'API (600/15 min) — protège contre le
  brute-force et les abus.
- Upload d'images admin : le type de fichier est vérifié sur les octets
  réels (signature), pas seulement sur l'en-tête `Content-Type` envoyé par
  le client.
- Commande : agrégation des lignes de panier par produit et vérification du
  stock dans une transaction SQLite atomique (empêche la survente).
- Le serveur refuse de démarrer en production sans `JWT_SECRET` valide, et
  avertit au démarrage si `CORS_ORIGINS` ou `ADMIN_PASSWORD` sont laissés
  aux valeurs par défaut.

À votre charge avant la mise en ligne :
- `JWT_SECRET` **doit** être défini en production (chaîne longue et aléatoire, ≥32 caractères).
- Changez `ADMIN_PASSWORD` — la valeur par défaut de ce README est publique.
- Renseignez `CORS_ORIGINS` avec votre domaine réel (évitez `*` en production).
- Le paiement se fait à la livraison (cash on delivery) — aucune donnée bancaire stockée.
- Sauvegardez régulièrement le fichier `backend/data/fynbeauty.sqlite` (c'est
  toute votre base de données).
- Le frontend garde le jeton de connexion dans `localStorage` (comme la
  plupart des SPA React). Le code ne comporte aucun point d'injection HTML
  connu (pas de `dangerouslySetInnerHTML`), mais si vous ajoutez un jour du
  contenu utilisateur affiché tel quel (avis clients, etc.), assurez-vous
  qu'il reste échappé par React et n'est jamais inséré via `innerHTML`.
