# MesDémarches — Vos démarches, simplement

## Overview

MesDémarches (anciennement DOCU243) aide les usagers à comprendre, préparer et suivre leurs démarches administratives en RDC : catalogue de démarches sourcées, liste de pièces adaptée à la situation, dossiers en ligne pour les démarches ouvertes, suivi et notifications, back-office de traitement et de gestion éditoriale.

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
- Mode de dépôt (`channel`) : `docu243` (dossier dans MesDémarches), `external` (portail officiel), `info` (information et préparation).
- Frais : montant brut + `currency` (CDF, USD) + `fee_status` (`confirmed`, `variable`, `unconfirmed`). Un tarif non confirmé n'est pas affiché.

## API

- Auth : `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- Démarches : `GET /api/procedures`, `GET /api/procedures/:slug`
- Dossiers : `POST /api/applications`, `GET /api/applications/me`, `GET /api/applications/:id`, `PATCH /api/applications/:id` (champs, ou `status: "submitted"` après contrôle de complétude), `POST /api/applications/:id/retract`
- Pièces : `POST /api/applications/:id/upload` (multipart, `requiredDocId` facultatif pour contrôler format et taille), `POST /api/applications/:id/documents`, `GET /api/documents/me`
- Notifications : `GET /api/notifications`, `PATCH /api/notifications/:id/read`, `POST /api/notifications/read-all`
- Back-office : `GET /api/admin/applications`, `PATCH /api/admin/applications/:id/status` (`note` obligatoire pour une correction), `PATCH /api/admin/documents/:id/validate`, `GET|POST|PATCH /api/admin/procedures`, champs et pièces, `GET|POST|PATCH /api/admin/users`, `GET /api/admin/logs`

## Paiement

Aucun paiement n'est encaissé par la plateforme. L'ancienne étape de paiement simulée a été retirée.

## Environnement

- `DATABASE_URL` (obligatoire), `SESSION_SECRET` (obligatoire en production), `PORT`.
- Développement local sur une base séparée : `DATABASE_URL=postgresql://localhost/mesdemarches_dev PORT=5055 npm run dev`.
- Test de bout en bout : `BASE_URL=http://localhost:5055 npm run test:smoke` (crée un compte citoyen de test, utilise `SMOKE_ADMIN_EMAIL` / `SMOKE_ADMIN_PASSWORD`).
