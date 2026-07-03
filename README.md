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

## Fonctionnalités actuelles (0.7.4)
- **Calculateur**
  - Filtrage auto des matériaux par compat/châssis + catégorie d’affinage.
  - Résumé : PA/Malus/Efficacité + badge compatibilité + effets/badges ratio.
  - Widget **Usure en combat** (PA actuelle, dégâts d20+bonus, perce-armure optionnel dans les options avancées, `penIgnore`, cap par coup, historique).
  - Widget **Réparation** (coût/temps selon compat + multiplicateurs mat/qualité).
  - Enregistrement/chargement de builds (localStorage) + application directe sans reload.
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

## Déploiement
- Build statique dans `dist/` (`npm run build`).
- Pour OVH/Apache : ajouter un `public/.htaccess` avec fallback SPA (rewrite vers `index.html`).
- La PWA et le service worker nécessitent HTTPS en production (le sous-domaine OVH doit disposer d’un certificat valide).
- Pour GitHub Pages : pousser `dist/` (ou workflow Actions) et définir `base` si nécessaire.

## Roadmap

### 0.7.x — Expérience avancée

- [ ] Rendre les graphiques interactifs et permettre l’export image/CSV.

### 0.8.x — Impression & partage long terme

- [ ] Ajouter une fiche imprimable.
- [ ] Ajouter l’export PDF.
- [ ] Proposer des templates de fiche compact et détaillé.

## Contribution
- PR petites et ciblées (une feature par PR).
- Respecter les clés/compat dans les JSON (`src/types.ts` en référence).
- Avant PR : `npm run lint`, `npm test` et `npm run build` doivent passer.
