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

## Fonctionnalités actuelles (0.4.x)
- **Calculateur**
  - Filtrage auto des matériaux par compat/châssis + catégorie d’affinage.
  - Résumé : PA/Malus/Efficacité + badge compatibilité + effets/badges ratio.
  - Widget **Usure en combat** (PA actuelle, dégâts d20+bonus, cap par coup, historique).
  - Widget **Réparation** (coût/temps selon compat + multiplicateurs mat/qualité).
  - Enregistrement/chargement de builds (localStorage) + application directe sans reload.
- **PV / Constitution**
  - Mini calculateur (input + slider), tableau repère scrollable, texte d’aide.
- **Matériaux**
  - Table triable/filtrable, badges d’effets/résistances, sticky header, densité compacte.
- **Catalogue de builds**
  - Liste filtrable, supprimer/exporter/importer (JSON), appliquer au calculateur.
- **Éditeur**
  - CRUD local pour châssis/matériaux/qualités/boucliers/params.
  - Diff overrides vs canon, import/export JSON, reset par onglet ou global.
- **Thème & accessibilité**
  - Modes clair/sombre/auto (prefers-color-scheme), contrastes corrigés.
  - Skip link “Aller au contenu”, focus visibles, aria-live sur le résumé, badges cohérents.

## Déploiement
- Build statique dans `dist/` (`npm run build`).
- Pour OVH/Apache : ajouter un `public/.htaccess` avec fallback SPA (rewrite vers `index.html`).
- Pour GitHub Pages : pousser `dist/` (ou workflow Actions) et définir `base` si nécessaire.

## Roadmap

- **0.5.x – Sandbox & partage**

[x] Graphiques d’équilibrage (efficacité vs malus, usure cumulée). version simple avec SVG maison, paramètres fixes.
[x] Partage de builds (lien encodé ou fichier JSON minimal), export CSV/Excel matériaux/châssis.
[ ] UX éditeur : undo/corbeille, autosave optionnelle, filtres/tri dans catalogue et éditeur.
[ ] A11y : focus trap modales/drawers, rapports d’erreurs ARIA.

- **0.6.x – PWA & qualité**

[ ] Graphiques d’équilibrage, sliders interactifs, export image/CSV des séries, thème sombre soigné.
[ ] PWA/offline + cache données et dernière session.
[ ] Fiche imprimable / export PDF.
[ ] Tests unitaires calc/usure/réparation + CI (build/test/deploy).
[ ] Tables avancées (pagination Matériaux, vues détaillées, comparateur).
[ ] Navigation mobile repensée (burger, CTA tactiles).

## Contribution
- PR petites et ciblées (une feature par PR).
- Respecter les clés/compat dans les JSON (`src/types.ts` en référence).
- Avant PR : `npm run build` doit passer (lint/tests à venir).
