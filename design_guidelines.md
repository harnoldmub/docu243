# MesDémarches — design system

« Vos démarches, simplement. » Une marque de service numérique congolaise : lumineuse, chaleureuse, très lisible, pensée d'abord pour un téléphone Android et une connexion modeste.

Les tokens vivent dans `client/src/index.css` (variables CSS) et `tailwind.config.ts` (couleurs `brand-*`).

## Couleurs

Couleurs de marque inspirées de celles de la RDC (pas des valeurs officielles).

| Token | Valeur | Usage |
| --- | --- | --- |
| `brand-royal` | `#0047FF` | Grands aplats, action principale, liens |
| `brand-deep` | `#002A8F` | En-têtes de page, aplat du hero |
| `brand-night` | `#001A5C` | Pied de page |
| `brand-yellow` | `#FFD400` | Accents, repères, bouton sur fond bleu, section « Que souhaitez-vous faire ? » |
| `brand-red` | `#E52336` | Petits accents de marque uniquement (bande tricolore, repère du hero, pastille de notification) |
| `brand-mist` | `#F4F7FC` | Fonds clairs |
| `brand-ink` | `#101B35` | Texte principal |
| `brand-ink-2` | `#526079` | Texte secondaire |
| `brand-line` | `#DCE3EF` | Bordures |

Couleurs de statut, séparées de la marque (`--st-*`) : succès `#0B7A4B`, attention `#7A4F00` sur `#FFF1C2`, erreur `#B3122A`, information `#002A8F`, neutre `#3B4A66`. Une erreur n'utilise jamais le rouge de marque, et un statut est toujours écrit en toutes lettres avec une icône.

Contrastes vérifiés : blanc sur royal 6,3:1, encre sur jaune 11,8:1, texte secondaire sur fond clair 6,3:1. Jamais de texte jaune sur blanc.

## Bande tricolore

`.tricolor` : bleu royal traversé d'une diagonale rouge bordée de jaune, comme sur les sites institutionnels congolais. En tête de chaque page (6 px), sous les en-têtes bleus (8 px), en haut du pied de page et des blocs de statut.

## Typographie

- Titres : Bricolage Grotesque (variable, fichiers locaux via `@fontsource-variable`).
- Texte : Figtree (variable, fichiers locaux).
- Échelle : `display-hero` (40 à 84 px), `display-1` (34 à 60 px), `display-2` (28 à 42 px), `title-3` (22 px), texte courant 17 px.
- Titres courts, retours à la ligne intentionnels, interlettrage légèrement négatif seulement sur les grands titres.

## Composition

- Conteneur `.md-container` : 1280 px, marges de 16 px sur mobile.
- Rayons : 12 px (champs, boutons), 16 px (cartes), 20 à 28 px (photos, grands blocs).
- Ombres légères et neutres : `shadow-card`, `shadow-raised`, `shadow-float`.
- Chaque section a une couleur dominante : alternance blanc, bleu, jaune et fond clair.

## Composants

| Composant | Fichier |
| --- | --- |
| Boutons (`default`, `yellow` sur fond bleu, `outline`, `on-blue`, `ghost`, `tertiary`, `destructive`, état `loading`) — 44 px minimum | `components/ui/button.tsx` |
| Champs (`.field-input`), libellés visibles, erreurs reliées par `aria-describedby` | `index.css`, `pages/auth-page.tsx` |
| Badges de statut et de pièce | `components/status-badge.tsx` |
| Disponibilité d'une démarche | `components/procedure-card.tsx` |
| Carte de démarche et squelette | `components/procedure-card.tsx` |
| Recherche avec suggestions (combobox accessible) | `components/search-combobox.tsx` |
| Alertes, état vide, erreur avec nouvelle tentative | `components/states.tsx` |
| Accordéon FAQ | `components/faq.tsx` |
| Étapes du formulaire | `components/stepper.tsx` |
| Chronologie du dossier | `components/timeline.tsx` |
| Envoi de pièce (format, taille, aperçu, remplacement) | `components/doc-uploader.tsx` |
| Photos responsives AVIF/WebP | `components/picture.tsx` |
| En-tête du back-office | `components/admin-shell.tsx` |

## Mouvement

Une seule séquence d'entrée sur le hero, apparitions discrètes au scroll (`data-reveal`), transitions de 150 à 250 ms sur les interactions. Tout est désactivé avec `prefers-reduced-motion`, et le contenu reste visible sans JavaScript.

## Photos

Générées par `python3 -I scripts/optimize-images.py` depuis `assets/` vers `client/public/img/` (AVIF + WebP, trois largeurs). Une photo n'est jamais répétée sur une même page. Aucune donnée personnelle lisible sur les documents tenus.
