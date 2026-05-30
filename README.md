# Fyn Beauty

Boutique de cosmétiques (Algérie) — **React** (frontend) + **Node.js / Express / MySQL** (backend).
Conçu pour un déploiement sur **Hostinger** (hébergement mutualisé avec l'application Node.js de hPanel).

## Structure

```
backend/    API Node.js + Express + MySQL
frontend/   Application React (Create React App + CRACO)
```

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
cp .env.example .env        # puis renseignez vos identifiants MySQL + JWT_SECRET
npm install
npm start                   # démarre l'API sur le port 8001
```

Au démarrage, le backend crée automatiquement les tables et insère les données
de démonstration (catégories, produits, coupons, compte admin).

### 2. Frontend

```bash
cd frontend
cp .env.example .env        # REACT_APP_BACKEND_URL=http://localhost:8001
yarn install   # ou: npm install
yarn start     # ouvre http://localhost:3000
```

---

## Déploiement sur Hostinger (hébergement mutualisé)

### A. Base de données MySQL
1. hPanel → **Bases de données → MySQL** : créez une base + un utilisateur.
2. Notez `hôte`, `nom de base`, `utilisateur`, `mot de passe`.

### B. Backend (application Node.js)
1. Envoyez le dossier `backend/` sur le serveur (sans `node_modules/`).
2. hPanel → **Avancé → Node.js** : créez une application.
   - **Fichier de démarrage :** `server.js`
   - **Version de Node :** 18 ou supérieure
3. Renseignez les variables d'environnement (équivalent du `.env`) :
   `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`,
   `JWT_SECRET` (chaîne longue et aléatoire), `ADMIN_EMAIL`, `ADMIN_PASSWORD`,
   et `CORS_ORIGINS=https://votre-domaine`.
4. Lancez `npm install` puis démarrez l'application.

### C. Frontend
Deux options :

**Option 1 — application unique (recommandée) :** laissez `REACT_APP_BACKEND_URL`
vide, lancez `yarn build`, et placez le contenu de `frontend/build/` à côté du
backend. Le serveur Node sert automatiquement le build (voir `server.js`) et
l'API sous le même domaine — aucune configuration CORS particulière requise.

**Option 2 — site statique séparé :** définissez `REACT_APP_BACKEND_URL` sur
l'URL de l'API, lancez `yarn build`, et déposez `frontend/build/` dans
`public_html`. Pensez à ajouter ce domaine à `CORS_ORIGINS` côté backend.

> Pour le routage côté client (React Router) en site statique, ajoutez un
> `.htaccess` qui redirige toutes les routes vers `index.html`.

---

## Notes de sécurité
- `JWT_SECRET` **doit** être défini en production (chaîne longue et aléatoire).
- Renseignez `CORS_ORIGINS` avec votre domaine réel (évitez `*` en production).
- Le paiement se fait à la livraison (cash on delivery) — aucune donnée bancaire stockée.
