# MesDémarches — Vos démarches, simplement

## Overview

MesDémarches (mesdemarches.cd, anciennement DOCU243) effectue les démarches administratives en RDC à la place de ses clients. Le client choisit une démarche, envoie ses informations et ses pièces, paie en ligne (Stripe) le prix de base officiel + les frais de service, reçoit la confirmation et son reçu ; l'équipe MesDémarches effectue la démarche et met à jour le statut du dossier.

## User Preferences

Preferred communication style: Simple, everyday language.

## Architecture

- **Frontend** : React 18 + TypeScript, Wouter, TanStack Query, Tailwind + tokens CSS, Radix pour les primitives accessibles. Pages dans `client/src/pages/`, composants dans `client/src/components/`. Les pages hors accueil et catalogue sont chargées à la demande.
- **Backend** : Express + Drizzle ORM sur PostgreSQL, sessions `express-session` stockées en base.
- **Schéma** : `shared/schema.ts`. Les évolutions de schéma sont additives et appliquées au démarrage par `server/migrate.ts` (`ALTER TABLE … ADD COLUMN IF NOT EXISTS`). Le contenu éditorial initial est appliqué une seule fois (table `app_migrations`).
- **Fichiers** : sur disque dans `uploads/{référence}/`, servis après connexion par `GET /file/:reference/:filename` (propriétaire du dossier ou agent).
- **Design system** : voir `design_guidelines.md`.

## Catalogue

- Contenu sourcé : `server/catalog-content.ts` (sources consultées le 14/10/2026).
- Matrice de toutes les démarches : `docs/matrice-demarches.md`, régénérée par `npx tsx scripts/export-matrix.ts`.
- Statut éditorial : `draft`, `to_verify`, `validated`, `published`, `archived`. Seules les fiches `published` et actives sont publiques.
- Toutes les démarches publiées sont effectuées par MesDémarches (`channel = docu243`) ; `external_url` garde le portail officiel utilisé par l'équipe.
- Frais : montant brut + `currency` (CDF, USD) + `fee_status` (`confirmed`, `variable`, `unconfirmed`). Un tarif non confirmé n'est pas affiché.

## API

- Auth : `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- Démarches : `GET /api/procedures`, `GET /api/procedures/:slug`
- Dossiers : `POST /api/applications`, `GET /api/applications/me`, `GET /api/applications/:id`, `PATCH /api/applications/:id` (champs, ou `status: "submitted"` après contrôle de complétude), `POST /api/applications/:id/retract`
- Pièces : `POST /api/applications/:id/upload` (multipart, `requiredDocId` facultatif pour contrôler format et taille), `POST /api/applications/:id/documents`, `GET /api/documents/me`
- Notifications : `GET /api/notifications`, `PATCH /api/notifications/:id/read`, `POST /api/notifications/read-all`
- Back-office : `GET /api/admin/applications`, `PATCH /api/admin/applications/:id/status` (`note` obligatoire pour une correction), `PATCH /api/admin/documents/:id/validate`, `GET|POST|PATCH /api/admin/procedures`, champs et pièces, `GET|POST|PATCH /api/admin/users`, `GET /api/admin/logs`

## Paiement (Stripe)

- Prix = `procedures.cost` (prix de base officiel, payable seulement si `currency = USD` et `fee_status = confirmed`) + `procedures.service_fee` (USD : 100 passeport, 50 démarches complexes, 20 les autres).
- `POST /api/applications/:id/checkout` crée une session Stripe Checkout (dossier complet obligatoire). Au retour, `POST /api/payments/verify` confirme ; le webhook `POST /api/stripe/webhook` (événements `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired`, `checkout.session.async_payment_failed`) fait de même en arrière-plan.
- Une fois payé : statut `submitted`, numéro de reçu `MD-AAAA-000001`, notification au client, reçu imprimable sur `/application/:id/recu`.
- Un dossier ne peut pas être transmis sans paiement, sauf s'il avait déjà été transmis avant l'arrivée du paiement en ligne.

## Environnement

- `DATABASE_URL` (obligatoire), `SESSION_SECRET` (obligatoire en production), `PORT`.
- `STRIPE_SECRET_KEY=sk_test_...` : active Stripe Checkout en mode test. Une clé live est refusée au démarrage ; sans clé, le paiement est désactivé et le site l'indique.
- `STRIPE_WEBHOOK_SECRET=whsec_...` : secret de signature du webhook de test. Configurer dans Stripe l'URL `https://<domaine>/api/stripe/webhook` et les événements indiqués ci-dessus. En local, utiliser Stripe CLI pour transmettre les événements à `/api/stripe/webhook` et reprendre son secret `whsec_...`.
- Les variables doivent être présentes dans l'environnement du processus serveur ; le fichier `.env` local n'est pas chargé automatiquement par `npm run dev`.
- `PUBLIC_URL=https://mesdemarches.cd` : adresse utilisée pour les retours de paiement Stripe.
- Développement local sur une base séparée : `DATABASE_URL=postgresql://localhost/mesdemarches_dev PORT=5055 npm run dev`.
- Test de bout en bout : `BASE_URL=http://localhost:5055 npm run test:smoke` (crée un compte citoyen de test, utilise `SMOKE_ADMIN_EMAIL` / `SMOKE_ADMIN_PASSWORD`).
