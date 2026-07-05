# Système PA — App web (port Excel)

Calculateur d’armures pour un **système d100 inversé** : PA, malus, sweet‑spot, compat châssis/matériau, usure/réparation, PV/CON, catalogue de builds et éditeur local (JSON).

## Stack
- React + Vite + TypeScript
- Tailwind CSS v4 (via `@tailwindcss/postcss`) + `tailwindcss-animate`
- Icones : `lucide-react`
- Node ≥ 18 (reco : 20)

## Scripts
```bash
npm install
npm run dev
npm run lint
npm test
npm run build   # build statique
npm run preview
```

## Données (source de vérité)
- **Canon** : `src/data/*.json` (chassis, materials, categories, qualities, shields, params).
- **Overrides locaux** : fusionnés depuis `localStorage` (catalogue + builds). Boutons reset/import/export dans l’UI.

Types clés (extraits de `src/types.ts`) :
- `Chassis { name, basePA, baseMalus, group: "Légère"|"Intermédiaire"|"Lourde", category: "Gambison"|"Cuir"|"Métal" }`
- `Material { name, category, compat, modPA, malusMod, extraPen?, penIgnore?, effects?, res? }`
- `Quality { name, bonusPA, malusMod, repair?: { costMul?, timeMul? } }`
- `Shield { name, pa, malus }`
- `Params { sweetSpotRatio, renfortMax, enchantMax, baseWear, capWearPerHit, repair: { costPerPA, timePerPA }, pv }`
- `BuildInput { chassis, material, quality, renfort, enchant, enchantId?, shield, shieldMaterial?, cat? }`

## Fonctionnalités actuelles (0.9.1)
- **Calculateur**
  - Filtrage auto des matériaux par compat/châssis + catégorie d’affinage.
  - Résumé : PA/Malus/Efficacité + badge compatibilité + effets/badges ratio.
  - Widget **Usure en combat** (PA actuelle, dégâts d20+bonus, perce-armure optionnel dans les options avancées, `penIgnore`, cap par coup, historique).
  - Widget **Réparation** (coût/temps selon compat + multiplicateurs mat/qualité).
  - Enregistrement/chargement de builds (localStorage) + application directe sans reload.
  - Graphiques d’équilibrage explorables à la souris ou au clavier, exportables en SVG et CSV.
  - Graphiques empilés avec contrôles compacts, infobulles lisibles et informations non redondantes.
  - Layout responsive : Résumé avant Entrées sur mobile, deux colonnes sur desktop et trois colonnes sur très grand écran.
- **PV / Constitution**
  - Mini calculateur (input + slider), tableau repère scrollable, texte d’aide.
- **Matériaux**
  - Table triable/filtrable, badges d’effets/résistances, sticky header, densité compacte.
  - Pagination configurable, fiches détaillées et comparateur de trois matériaux maximum.
- **Catalogue de builds**
  - Liste filtrable, supprimer/exporter/importer (JSON), appliquer au calculateur.
  - Import strict : types, bornes, doublons et références contrôlés avant écriture, avec rapport copiable.
- **Éditeur**
  - CRUD local pour châssis/matériaux/qualités/boucliers/params.
  - Diff overrides vs canon, import/export JSON, reset par onglet ou global.
  - Import strict avec blocage des références invalides et rapport d’erreurs copiable.
  - Annulation des 20 dernières actions et corbeille de session avec restauration.
  - Sauvegarde automatique désactivable, avec enregistrement manuel ou abandon du brouillon.
  - Recherche plein texte et tri alphabétique dans chaque liste éditable.
  - Listes compactes avec colonnes métier et colonne Actions dédiée.
  - Hauteur de liste uniforme et libellés métier humanisés dans l’éditeur.
- **Thème & accessibilité**
  - Modes clair/sombre/auto (prefers-color-scheme), contrastes corrigés.
  - Skip link “Aller au contenu”, focus visibles, aria-live sur le résumé, badges cohérents.
  - Modales accessibles pour les confirmations et la sauvegarde : focus piégé nativement, fermeture Échap et restauration du focus.
- **PWA / hors ligne**
  - Application installable grâce au manifeste web.
  - Cache versionné du shell, du bundle et des données JSON embarquées après la première visite.
  - Routes SPA accessibles hors ligne et indicateur « Mode hors ligne » dans le header.
  - Dernier build, catalogue et préférences conservés par `localStorage`.
- **Navigation responsive**
  - Onglets complets dans le header sur desktop.
  - Barre de navigation inférieure sur mobile avec icônes, page active et prise en charge des zones sûres.
  - Audit réalisé à 390 px, 768 px et 1440 px : formulaires empilés sur mobile, en-têtes d’actions adaptatifs et tables conservées dans leurs zones de défilement.
- **Fiche d’armure**
  - Prévisualisation dédiée depuis le build actuellement configuré (`/print`).
  - Accès depuis chaque build sauvegardé, avec restauration par identifiant après actualisation.
  - Composition, PA, malus, ratio, compatibilité, effets, usure et réparation par PA.
  - Repli sur le dernier build local après actualisation de la page.
  - Mode compact activable et conservé dans l’URL avec `mode=compact`.
  - Mode détaillé avec décomposition PA/malus et résistances chiffrées (`mode=detailed`).
  - Feuille d’impression A4 dédiée, indépendante du thème et sans navigation ni contrôles.
  - Bouton « Imprimer / PDF » ouvrant la boîte d’impression native du navigateur.
- **Aide rapide**
  - Page `/aide` accessible depuis les navigations desktop et mobile.
  - Explications sur les châssis, matériaux, compatibilité, usure, Perce-armure, builds, impression et données locales.

## Déploiement
- Build statique dans `dist/` (`npm run build`).
- Pour OVH/Apache : ajouter un `public/.htaccess` avec fallback SPA (rewrite vers `index.html`).
- La PWA et le service worker nécessitent HTTPS en production (le sous-domaine OVH doit disposer d’un certificat valide).
- Pour GitHub Pages : pousser `dist/` (ou workflow Actions) et définir `base` si nécessaire.

## Roadmap

### 0.9.x — Stabilisation publique & confort d’usage

- [x] Audit complet responsive mobile/tablette/desktop.
- [ ] Audit PWA/offline après plusieurs mises à jour de version.
- [ ] Améliorer les messages d’erreur utilisateur dans l’éditeur et les imports.
- [x] Ajouter une page “À propos / Aide rapide”.
- [ ] Ajouter un changelog visible dans l’app ou dans le README.
- [ ] Nettoyer les dernières incohérences UI et textes.

### 1.0.0 — Première version stable

- [ ] Geler les règles métier principales.
- [ ] Vérifier toutes les données JSON par défaut.
- [ ] Valider les tests unitaires métier.
- [ ] Valider l’impression/PDF sur Chrome, Firefox et Edge.
- [ ] Taguer une release GitHub `v1.0.0`.

## Contribution
- PR petites et ciblées (une feature par PR).
- Respecter les clés/compat dans les JSON (`src/types.ts` en référence).
- Avant PR : `npm run lint`, `npm test` et `npm run build` doivent passer.
