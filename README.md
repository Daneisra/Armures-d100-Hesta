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

## Fonctionnalités actuelles (0.6.0)
- **Calculateur**
  - Filtrage auto des matériaux par compat/châssis + catégorie d’affinage.
  - Résumé : PA/Malus/Efficacité + badge compatibilité + effets/badges ratio.
  - Widget **Usure en combat** (PA actuelle, dégâts d20+bonus, pénétration d’attaque, `penIgnore`, cap par coup, historique).
  - Widget **Réparation** (coût/temps selon compat + multiplicateurs mat/qualité).
  - Enregistrement/chargement de builds (localStorage) + application directe sans reload.
- **PV / Constitution**
  - Mini calculateur (input + slider), tableau repère scrollable, texte d’aide.
- **Matériaux**
  - Table triable/filtrable, badges d’effets/résistances, sticky header, densité compacte.
- **Catalogue de builds**
  - Liste filtrable, supprimer/exporter/importer (JSON), appliquer au calculateur.
  - Import strict : types, bornes, doublons et références contrôlés avant écriture, avec rapport copiable.
- **Éditeur**
  - CRUD local pour châssis/matériaux/qualités/boucliers/params.
  - Diff overrides vs canon, import/export JSON, reset par onglet ou global.
  - Import strict avec blocage des références invalides et rapport d’erreurs copiable.
- **Thème & accessibilité**
  - Modes clair/sombre/auto (prefers-color-scheme), contrastes corrigés.
  - Skip link “Aller au contenu”, focus visibles, aria-live sur le résumé, badges cohérents.

## Déploiement
- Build statique dans `dist/` (`npm run build`).
- Pour OVH/Apache : ajouter un `public/.htaccess` avec fallback SPA (rewrite vers `index.html`).
- Pour GitHub Pages : pousser `dist/` (ou workflow Actions) et définir `base` si nécessaire.

## Roadmap

### 0.6.x — Stabilisation & qualité

- [ ] Améliorer l’accessibilité des modales et drawers.
- [ ] Améliorer l’UX éditeur : undo/corbeille, autosave optionnelle, filtres et tri.

### 0.7.x — Expérience avancée

- [ ] Améliorer l’UX du widget Usure : renommer “Pénétration de l’attaque” en “Perce-armure (optionnel)”, le laisser à 0 par défaut, ajouter une aide claire, et éventuellement masquer ce champ dans une section avancée.
- [ ] Ajouter le mode PWA/offline et mettre en cache les données et la dernière session.
- [ ] Repenser la navigation mobile.
- [ ] Ajouter les tables avancées : pagination, vues détaillées et comparateur.
- [ ] Rendre les graphiques interactifs et permettre l’export image/CSV.

### 0.8.x — Impression & partage long terme

- [ ] Ajouter une fiche imprimable.
- [ ] Ajouter l’export PDF.
- [ ] Proposer des templates de fiche compact et détaillé.

## Contribution
- PR petites et ciblées (une feature par PR).
- Respecter les clés/compat dans les JSON (`src/types.ts` en référence).
- Avant PR : `npm run lint`, `npm test` et `npm run build` doivent passer.
