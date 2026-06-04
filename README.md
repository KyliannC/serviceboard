# ServiceBoard

ServiceBoard est une application web full JavaScript de type mini Craiglist pour publier, consulter et rechercher des annonces de services.

Un utilisateur peut proposer un service (`OFFER`) ou rechercher un service (`REQUEST`). La mise en relation se fait via une messagerie interne liée aux annonces. L'application ne gere pas le paiement en ligne.

## Stack technique

### Back-end

- Node.js
- Express
- Prisma ORM
- SQLite
- JWT pour l'authentification
- bcrypt pour le hash des mots de passe

### Front-end

- React
- Vite
- React Router
- Axios

## Structure du projet

```text
.
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── src/
│       ├── app.js
│       ├── prisma.js
│       ├── middlewares/
│       └── routes/
└── frontend/
    └── src/
        ├── api/
        ├── auth/
        ├── components/
        ├── pages/
        └── utils/
```

## Installation

### 1. Installer les dependances du back-end

```bash
cd backend
npm install
```

### 2. Configurer l'environnement back-end

Creer un fichier `backend/.env` :

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="change-this-secret"
```

### 3. Initialiser la base de donnees

```bash
cd backend
npm run prisma:migrate
npm run prisma:gen
```

### 4. Installer les dependances du front-end

```bash
cd frontend
npm install
```

## Lancement du projet

### Back-end

Depuis le dossier `backend` :

```bash
npm run dev
```

API disponible sur :

```text
http://localhost:3000
```

### Front-end

Depuis le dossier `frontend` :

```bash
npm run dev
```

Application disponible sur :

```text
http://localhost:5173
```

## Comptes de test

Si la base de donnees est vide, creer ces comptes via la page d'inscription ou via l'API `POST /auth/register`.

| Role | Email | Mot de passe | Pseudo | Ville |
| --- | --- | --- | --- | --- |
| Utilisateur 1 | `user1@mail.com` | `password123` | `user1` | `Paris` |
| Utilisateur 2 | `user2@mail.com` | `password123` | `user2` | `Lyon` |

Exemple de creation via API :

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user1@mail.com","password":"password123","pseudo":"user1","city":"Paris","bio":"Compte de test"}'
```

## Fonctionnalites realisees

### Comptes et authentification

- Inscription
- Connexion
- Deconnexion cote front-end
- Page profil avec pseudo, ville et bio
- Modification de la bio
- Mot de passe hashe avec bcrypt
- Authentification par JWT
- Protection des pages privees cote front-end

### Annonces de services

- Creation d'une annonce en statut `DRAFT`
- Type d'annonce : `OFFER` ou `REQUEST`
- Titre, description, categorie, ville, disponibilite, tarif et modalite
- Tarif : `FREE`, `HOURLY` ou `FIXED`
- Prix obligatoire si le tarif est `HOURLY` ou `FIXED`
- Publication et depublication d'une annonce
- Modification d'une annonce par son auteur uniquement
- Suppression d'une annonce par son auteur uniquement
- Page detail d'une annonce
- Les annonces en `DRAFT` ne sont visibles que par leur auteur

### Listing, recherche, filtres et tri

- Page liste des annonces publiees
- Recherche par mots-cles dans le titre et la description
- Filtre par type : offre ou demande
- Filtre par categorie
- Filtre par ville
- Tri par date recente
- Tri par tarif croissant ou decroissant

### Messagerie interne

- Envoi d'un message a l'auteur depuis une annonce publiee
- Creation ou recuperation d'une conversation liee a l'annonce
- Boite de reception avec dernier message et date
- Consultation d'une conversation avec messages chronologiques
- Envoi de nouveaux messages dans une conversation
- Interdiction de se contacter soi-meme
- Conversation visible uniquement par ses deux participants

### Qualite et securite

- Validation serveur sur l'authentification, les annonces et les messages
- Controle d'acces sur les routes protegees
- Controle proprietaire pour modifier, supprimer, publier et depublier une annonce
- Gestion des erreurs HTTP principales : `401`, `403`, `404`
- Donnees persistees en base SQLite

## Bonus

Aucun bonus n'a ete ajoute pour le moment. Le projet se concentre sur les fonctionnalites core demandees.

## Schema de base de donnees

```text
User
----
id          Int, primary key
email       String, unique
password    String, hash bcrypt
pseudo      String
city        String
bio         String?
createdAt   DateTime

Relations :
- un utilisateur possede plusieurs annonces
- un utilisateur peut envoyer plusieurs messages

Ad
--
id            Int, primary key
authorId      Int, foreign key vers User
type          OFFER | REQUEST
title         String
description   String
category      String
city          String
availability  String
pricingType   FREE | HOURLY | FIXED
price         Int?
modality      String
status        DRAFT | PUBLISHED
createdAt     DateTime

Relations :
- une annonce appartient a un utilisateur
- une annonce peut etre liee a plusieurs conversations

Conversation
------------
id          Int, primary key
adId        Int, foreign key vers Ad
user1Id     Int
user2Id     Int
createdAt   DateTime

Relations :
- une conversation est liee a une annonce
- une conversation regroupe plusieurs messages
- une conversation concerne deux participants

Message
-------
id              Int, primary key
conversationId  Int, foreign key vers Conversation
senderId        Int, foreign key vers User
content         String
createdAt       DateTime

Relations :
- un message appartient a une conversation
- un message est envoye par un utilisateur
```

## Routes principales de l'API

### Authentification

| Methode | Route | Description |
| --- | --- | --- |
| `POST` | `/auth/register` | Creer un compte |
| `POST` | `/auth/login` | Se connecter |
| `GET` | `/auth/me` | Recuperer le profil connecte |
| `PATCH` | `/auth/me` | Modifier la bio |

### Annonces

| Methode | Route | Description |
| --- | --- | --- |
| `GET` | `/ads` | Lister les annonces publiees |
| `GET` | `/ads/:id` | Voir le detail d'une annonce |
| `GET` | `/ads/mine` | Lister ses annonces |
| `POST` | `/ads` | Creer une annonce |
| `PATCH` | `/ads/:id` | Modifier une annonce |
| `DELETE` | `/ads/:id` | Supprimer une annonce |
| `POST` | `/ads/:id/publish` | Publier une annonce |
| `POST` | `/ads/:id/unpublish` | Depublier une annonce |

### Conversations

| Methode | Route | Description |
| --- | --- | --- |
| `POST` | `/conversations/ads/:id/message` | Contacter l'auteur d'une annonce |
| `GET` | `/conversations` | Voir sa boite de reception |
| `GET` | `/conversations/:id` | Voir une conversation |
| `POST` | `/conversations/:id/messages` | Envoyer un message dans une conversation |

## Verification

Build front-end :

```bash
cd frontend
npm run build
```

Validation Prisma :

```bash
cd backend
npx prisma validate
```

