# Refonte MesDémarches — livrable

## Mise à jour : modèle « nous faisons la démarche pour vous » (mesdemarches.cd)

- Toutes les démarches publiées sont effectuées par l'équipe MesDémarches. Plus de renvoi vers des portails externes pour le client.
- Prix affiché = prix de base officiel (USD) + frais de service : 100 USD pour le passeport, 50 USD pour les démarches complexes (entreprise, foncier, construction, transport, nationalité, succession, légalisation, profession libérale…), 20 USD pour les autres. Modifiables par démarche dans le back-office.
- Paiement par carte via Stripe au moment de transmettre le dossier, avec autorisation du client à agir en son nom. Confirmation par le serveur (retour de paiement et webhook), notification, reçu MesDémarches imprimable. Une correction ne fait pas repayer.
- Prix de base fixés à partir des sources : passeport 75, certificat de nationalité 40, société 70 (statuts sous seing privé), entreprise individuelle 40, et tarifs de la commune de Gombe pour l'acte de naissance (10), la résidence (1), la bonne vie et mœurs (10), le mariage (10), le célibat (10) et le décès (10).
- **18 démarches publiées n'ont pas encore de prix de base : leur paiement est bloqué** jusqu'à la saisie d'un prix en USD (statut « Confirmé ») dans le back-office. Liste dans `docs/matrice-demarches.md`.
- Pour la mise en production : définir `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` et `PUBLIC_URL=https://mesdemarches.cd`, et déclarer le webhook `https://mesdemarches.cd/api/stripe/webhook` dans Stripe.
- À définir : politique de remboursement (refus de l'administration, annulation), délais sur lesquels vous vous engagez, mandat ou procuration exigés par certaines administrations pour agir au nom d'un client.


Octobre 2026. DOCU243 devient **MesDémarches — Vos démarches, simplement.** La stack existante (Vite + React + Express + PostgreSQL) est conservée.

## Ce qui change

### Identité et design system
- Nouvelle palette bleu royal, bleu profond, jaune et rouge, séparée des couleurs de statut. Bande tricolore inspirée des sites institutionnels congolais en tête et en pied de page.
- Typographies locales Bricolage Grotesque (titres) et Figtree (texte), sans Google Fonts.
- Composants partagés : boutons (44 px minimum, états chargement et désactivé), champs, badges de statut écrits en toutes lettres, alertes, états vides et d'erreur avec nouvelle tentative, squelettes, accordéon, étapes, chronologie, envoi de pièces avec aperçu. Voir `design_guidelines.md`.
- Photos optimisées en AVIF et WebP, trois largeurs chacune. Script : `scripts/optimize-images.py`.

### Pages
- **Accueil** : hero photo et aplat bleu, recherche avec suggestions du catalogue, démarches courantes issues de la base, « Que souhaitez-vous faire ? », fonctionnement en trois étapes, section « Moins de déplacements », aperçu de l'espace citoyen marqué « Démonstration, données fictives », FAQ, appel final.
- **Catalogue** : recherche tolérante aux accents, pluriels et synonymes (impôt et NIF, passeport et voyage…), filtres catégorie, institution et disponibilité, compteurs, filtres actifs, « Effacer les filtres », panneau mobile, filtres conservés dans l'URL.
- **Fiche démarche** : fil d'Ariane, disponibilité, frais et devise, délai de traitement, prérequis (« Vous n'avez pas encore de NIF ? »), liste de pièces adaptée à la situation (obligatoire, selon la situation, original, formulaire, prérequis), étapes en ligne ou en personne, sources avec date de consultation, points à confirmer, résumé collant et bouton « Commencer ma demande ». Les démarches à déposer ailleurs mènent au portail officiel.
- **Connexion et inscription** : modes distincts par l'adresse (`/auth?mode=login` et `/auth?mode=register`), retour à la page d'origine, erreurs précises par champ, valeurs conservées, affichage du mot de passe accessible.
- **Espace citoyen** : tableau de bord « À faire / En cours / Terminés » avec prochaine étape, dossier en trois étapes (informations, pièces, vérification et envoi) avec brouillon enregistré, contrôle du format et de la taille, aperçu, remplacement d'une pièce refusée, message de l'agent, chronologie ; pages Mes documents, Notifications, Mon profil.
- **Pages d'information** : Comment ça marche (modes de dépôt, statuts, ce que la plateforme ne fait pas), Aide, Parcours par projet, Mentions légales, Confidentialité, Conditions d'utilisation.
- **Back-office** : files de dossiers, message obligatoire pour une demande de correction, motif de refus des pièces, gestion éditoriale des démarches (Brouillon → À vérifier → Validé → Publié → Archivé, sources, frais et devise, mode de dépôt, signalements automatiques).

### Règles et sécurité
- Un citoyen ne peut plus changer lui-même le statut de son dossier (il pouvait auparavant se mettre « Approuvé »).
- Un dossier incomplet est refusé par le serveur, avec la liste de ce qui manque. Le succès ne s'affiche qu'après confirmation du serveur.
- Les exigences (champs et pièces) applicables sont figées au moment de l'envoi : une modification ultérieure de la démarche ne change pas un dossier déjà transmis.
- Les pièces sont contrôlées côté serveur (format et taille de la pièce visée, fichier réellement présent), et une nouvelle pièce remplace l'ancienne.
- Les notifications ne peuvent être marquées lues que par leur destinataire.
- La route publique `POST /api/seed`, qui pouvait réinitialiser le catalogue sans authentification, est supprimée. Les routes `/api` inconnues répondent 404.
- L'étape de paiement simulée (« Simuler le succès du paiement ») est retirée : la plateforme n'encaisse rien.
- Base : migrations additives au démarrage (`server/migrate.ts`), contenu éditorial appliqué une seule fois. Aucune donnée supprimée.

### Corrections de contenu
- Section « Services prioritaires » vide : deux causes, colonnes `is_priority` et `sort_order` absentes de la base et aucune démarche marquée prioritaire. Corrigé.
- Montants « $8,000 » : le montant brut était saisi dans un champ libellé « Coût (CDF) » mais affiché en dollars. Les montants non confirmés ne sont plus affichés (« À confirmer »). Les montants officiels sont affichés avec leur devise via `Intl.NumberFormat` (passeport 75 USD, certificat de nationalité 40 USD, création de société 70 ou 110 USD, entreprise individuelle 40 USD). Les frais communaux sont indiqués comme variables.
- Retirés : « 5M+ », « 1.2M », « 70 % », « Plateforme Nationale Officielle », « 100 % officiel », « Sécurité d'État », « Sécurisé par le Gouvernement », Ministère du Numérique, +243 81 000 0000, assistance 24/7, réseaux sociaux en `#`, liens `mailto` vers les pages légales, copyright figé à 2024.
- Accents restaurés dans le catalogue, y compris en base pour les textes d'origine.

## Catalogue
- 28 démarches publiées, dont 4 nouvelles fiches sourcées (déclaration de naissance, entreprise individuelle, affiliation employeur CNSS, vérification d'un document fiscal).
- 19 démarches en brouillon, masquées du public, avec la liste précise des points à vérifier.
- Matrice complète : `docs/matrice-demarches.md`.
- Sources consultées le 14 octobre 2026 : servicepublic.gouv.cd (fiches 7, 463, 734, 5129, 7638, 7645, 7646, 7660, 7698, 7705, 7713), dgi.gouv.cd et e-nif.dgirdc.cd, anapi.cd/procedures, cnss.cd. Le portail passeport.gouv.cd a refusé l'accès lors de la vérification.

## Parcours vérifiés
Sur une base locale, desktop (1440 px) et mobile (375 px) :
- Accueil, recherche avec suggestions, catalogue et filtres, fiche Passeport (prérequis NIF, liste qui s'adapte), fiche Attestation de résidence.
- Inscription avec erreurs de saisie, retour automatique sur la fiche, création du dossier, saisie et enregistrement du brouillon, passage aux pièces.
- Envoi de pièces, refus d'un dossier incomplet, transmission, demande de correction par un agent avec motif, affichage côté citoyen, back-office.
- `npm run check` (TypeScript), `npm run build` et `npm run test:smoke` passent. Le test de bout en bout couvre aussi les refus attendus (auto-approbation, dossier incomplet, démarche externe, correction sans message, route inconnue).
- Aucun débordement horizontal mesuré sur l'accueil à 375 px. Focus clavier visible, lien d'évitement, contrastes conformes aux valeurs du design system.

Non vérifié : comportement réel sur un téléphone Android physique et sur un réseau lent, lecteur d'écran.

## Points à valider avant publication
1. **Statut du service** : MesDémarches est-il un service officiel, partenaire ou indépendant ? Les pages légales l'attendent (éditeur, hébergeur, responsable de publication, responsable du traitement, durée de conservation).
2. **Assistance** : adresse e-mail, téléphone et horaires réels. L'ancienne adresse contact@docu243.cd n'a pas été reprise faute de confirmation.
3. **Mot de passe oublié** : aucune réinitialisation n'existe faute de service d'envoi d'e-mails ou de SMS. Le site l'indique honnêtement.
4. **Tarifs** : les montants enregistrés pour les démarches sans source sont masqués. Ils doivent être confirmés avec leur devise dans le back-office.
5. **Délais** : les délais en jours de l'ancien catalogue ne sont plus affichés tant qu'une fiche n'a pas de date de validation interne.
6. **Pièces des dossiers en ligne** : le formulaire d'origine de certaines démarches ne correspond pas aux pièces des sources officielles (par exemple, attestation de résidence). À aligner dans le back-office ; les dossiers déjà transmis ne seront pas affectés.
7. **NIF** : la démarche dirige désormais vers e-NIF (DGI) au lieu de créer un dossier dans la plateforme. Les dossiers NIF existants restent consultables.
8. **Carte d'électeur** : ouverte en ligne dans l'ancien catalogue alors que la CENI délivre la carte lors de l'enrôlement. À confirmer.
9. **Accès des agents** : tout agent voit tous les dossiers. Limiter l'accès par institution demande une évolution du modèle.
10. **Compte administrateur par défaut** : `admin@docu243.cd` avec un mot de passe connu est créé par le seed sur une base vide. À changer en production.
11. **Base de données** : le `DATABASE_URL` du `.env` (Neon) ne contient pas le même catalogue que le site en ligne (14 démarches contre 24). La migration s'appliquera à la base utilisée au déploiement.
12. **Mes documents** : la réutilisation d'un document dans un autre dossier, l'expiration et la suppression ne sont pas proposées, le backend ne les gère pas.

## Photos
Dix photos fournies dans `assets/`, optimisées par `python3 -I scripts/optimize-images.py` (2,9 Mo pour 60 fichiers AVIF et WebP) :
- hero de l'accueil : maman avec ses documents ;
- « Que souhaitez-vous faire ? » : voyageur, commerçant, parent et enfant, diplômée, ingénieure sur chantier ;
- fonctionnement : remise d'un document au guichet ;
- « Moins de déplacements » : citoyenne sur son téléphone ;
- bloc final : trois adultes devant un bâtiment ;
- connexion : femme avec téléphone et pochette, sur fond bleu.

Le livret bleu tenu sur la photo du hero ne porte aucune inscription : il ne laisse pas croire que le passeport se demande dans MesDémarches.
