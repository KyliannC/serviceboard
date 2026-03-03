# ServiceBoard

Mini application type CraigList de services réalisée en Node.js + Express + React.

## Stack technique

### Backend
- Node.js
- Express
- Prisma ORM
- SQLite
- JWT (authentification)
- bcrypt (hash mot de passe)

### Frontend
- React (Vite)
- Axios

---

## Installation

### 1. Cloner le projet

```bash
git clone <repo-url>
cd serviceboard
2. Installer le backend
cd backend
npm install
3. Configurer les variables d’environnement

Créer un fichier .env dans backend/ :

DATABASE_URL="file:./dev.db"
JWT_SECRET="supersecretkey"
4. Lancer le backend
npm run dev

API disponible sur :

http://localhost:3000
Comptes de test
User 1

Email: user1@mail.com

Password: password123

User 2

Email: user2@mail.com

Password: password123

Fonctionnalités Core
Authentification

Inscription

Connexion

Profil utilisateur

Mot de passe hashé (bcrypt)

JWT

Annonces

Création (DRAFT)

Publication / Dépublication

Modification (owner only)

Suppression (owner only)

Listing public

Recherche par mots-clés

Filtres (type, catégorie, ville)

Tri (récent, prix croissant/décroissant)

Messagerie

Envoi de message depuis une annonce

Conversation unique par annonce

Inbox

Réponse à une conversation

Interdiction de se contacter soi-même

Accès limité aux 2 participants

Structure du projet Backend
src/
 ├── app.js
 ├── prisma.js
 ├── routes/
 ├── middlewares/
 └── utils/
Base de données

SQLite via Prisma.

Tables principales :

User

Ad

Conversation

Message


---

