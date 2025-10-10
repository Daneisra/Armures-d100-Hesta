# Système PA — App Web (port Excel 10.3.7)

Calculateur d’armures pour un **système d100 inversé** : PA, malus, sweet-spot, compatibilité châssis ↔ matériau, et **catalogue des matériaux**.
Le projet migre le classeur Excel → **app web statique** avec données JSON versionnables.

> Les mécaniques d’**Usure/Durabilité (10.3.8+)** arriveront au jalon 0.2.x.



## ⚙️ Stack & prérequis

* **React + Vite + TypeScript**
* **Tailwind CSS v4** (via `@tailwindcss/postcss`)
* Icônes : `lucide-react`
* Node **≥ 18** (recommandé : **20**)



## 🚀 Démarrage

```bash
npm install
npm run dev
# build statique (pour GitHub Pages / Netlify)
npm run build
```

### Déploiement GitHub Pages

Deux options :

**A. Pages “deploy from /docs” (simple)**

```bash
npm run build
# copiez le contenu de dist/ dans docs/ puis poussez la branche
```

**B. Pages via GitHub Actions**

* Laissez `dist/` comme artefact, ajoutez un workflow (ex. `/.github/workflows/pages.yml`) qui fait `npm ci && npm run build` puis publie `dist/`.

Si votre repo n’est **pas** à la racine (ex. `username.github.io/repo`), pensez à définir `base` dans `vite.config.ts`.



## 📁 Arborescence (résumé)

```
src/
  components/  (Calculator, CompatBadge, CategoryBadge, MaterialBadges…)
  pages/       (MaterialsPage)
  data/        (JSON : chassis, materials, categories, qualities, shields, params)
  lib/         (calc.ts, validate.ts)
  ui/          (palette.ts, icons.tsx)
  types.ts
  index.css    (Tailwind v4)
  App.tsx, main.tsx
```



## 🧱 Données (JSON)

Tout le contenu est éditable dans `src/data/*.json` (facile à versionner et relire en diff).

* **`chassis.json`** — base de calcul

  ```ts
  type Chassis = {
    name: string;
    basePA: number;
    baseMalus: number;
    group: "Légère" | "Intermédiaire" | "Lourde";
    category: "Gambison" | "Cuir" | "Métal"; // compat attendue côté matériau
  }
  ```

* **`categories.json`** — catégories d’affinage (visual & tri)

  ```ts
  type Category = { key: string; label: string; sort: number; compat: "Gambison"|"Cuir"|"Métal"; description?: string }
  ```

* **`materials.json`** — matériaux

  ```ts
  type Material = {
    name: string;
    category: string;                     // clé de categories.json
    compat: "Gambison"|"Cuir"|"Métal";    // compat de châssis
    modPA: number;
    malusMod: number;
    effects?: string;
    halfMalus?: boolean;   // ex. mithril : malus x0,5
    penIgnore?: number;    // ex. adamantium : ignore X pénétration
    extraPen?: number; // usure additionnelle quand la pénétration dépasse les PA restants
    res?: { feu?:number; froid?:number; foudre?:number; tr?:number; per?:number; con?:number; magie?:number };
  }
  ```

* **`qualities.json`**

  ```ts
  type Quality = { name: string; bonusPA: number; malusMod: number } // malus descendant : meilleure qualité → malus plus faible
  ```

* **`shields.json`**

  ```ts
  type Shield = { name: string; pa: number; malus: number; poids?: number }
  ```

* **`params.json`**

  ```ts
  type Params = { 
    sweetSpotRatio: number; 
    renfortMax: number; 
    enchantMax: number;
    baseWear: number;      // usure de base (coup non pénétrant)
    capWearPerHit: number; // limite max d'usure sur un coup
    }
  ```



## 🧮 Règles de calcul (10.3.7)

* **PA final**
  `PA = basePA(châssis) + modPA(matériau) + bonusPA(qualité) + renfort + bouclier.pa`

* **Malus final**
  `Malus = baseMalus(châssis) + malusMod(matériau) + malusMod(qualité) + bouclier.malus`
  Si `halfMalus` → **arrondi supérieur** après cumul.

* **Efficacité**
  `Efficacité = PA / max(1, Malus)`

* **Sweet spot**
  Bon équilibre si `Efficacité ≥ params.sweetSpotRatio` (valeur par défaut : **2**).



## 🖥️ Fonctionnalités actuelles

* **Calculateur**

  * Forçage automatique de la **catégorie** sur la compat du **châssis**
  * **Matériaux filtrés** selon compat + catégorie
  * Résumé : **PA/Malus/Efficacité** + badge **Compatibilité (✅/❌)** + effets
  * Persistance locale du dernier build

* **Page “Matériaux”**

  * Liste triable (nom, catégorie, compat, modPA, malusMod)
  * Filtres : compat (Gambison/Cuir/Métal), catégorie d’affinage, recherche
  * **Badges** d’effets & résistances
  * Accessibilité : focus visible, tri clavier (Enter/Espace), `aria-sort`

* **Polish UI**

  * **Tailwind v4**, palette par catégorie (icône + couleur)
  * Entrées **focus/keyboard friendly**, nombres en **tabular-nums**



## 🎨 CSS / Tailwind v4

PostCSS (`postcss.config.js`) :

```js
export default { plugins: { "@tailwindcss/postcss": {}, autoprefixer: {} } }
```

`src/index.css` :

```css
@import "tailwindcss";
@reference "tailwindcss";

.input{ @apply w-full border rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400; }
.btn{ @apply inline-flex items-center gap-2 border rounded-md px-3 py-1.5 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400; }
.tabular{ @apply tabular-nums; }
```



## 🧭 Roadmap

### 0.1.x — Base stable (✅)

* [x] Port du **classeur 10.3.7**
* [x] Catégories d’affinage + **compat châssis** (filtrage auto)
* [x] **Badge compat** dans le résumé
* [x] **Page Matériaux** (tri/filtres/badges)
* [x] Polish UI : icônes par catégorie, focus/keyboard, couleurs cohérentes
* [x] Setup **Tailwind v4** (`@tailwindcss/postcss`)
* [x] README pour GitHub

### 0.2.0 — Usure & Durabilité (10.3.8)

* [x] `extraPen` par matériau
* [x] **cap par coup** (params)
* [ ] Widget **Usure en combat** (d20 → PV/PA)
* [ ] Réparation (coût/temps par matériau/qualité)
* [ ] Matériaux de bouclier
* [ ] Polish UI

### 0.3.0 — Catalogue & Impression

* [ ] **Catalogue** de builds (LocalStorage + export JSON)
* [ ] **Fiche imprimable** (compacte/détaillée) + impression PDF navigateur
* [ ] Polish UI

### 0.4.0 — Éditeur & Import

* [ ] Mini **CRUD** (châssis / matériaux / qualités / boucliers / params)
* [ ] Import CSV (depuis Excel) + **validation** (doublons, clés invalides)
* [ ] Polish UI

### 0.5.0 — Sandbox & Équilibrage

* [ ] Sandbox d’équilibrage (sliders, profils types)
* [ ] Graphique réussite vs malus (d100 inversé)
* [ ] Polish UI

### 0.6.0 — PWA & Qualité

* [ ] PWA (offline) • tests unitaires sur `calc.ts` • CI (build/test/deploy)
* [ ] Polish UI


## 🔧 Contribution

* PR petites et ciblées (une feature par PR).
* Respecter les **clés** et **compat** des JSON (cf. `src/types.ts`).
* Avant PR : `npm run build` doit passer (lint/tests à venir).



## 📄 Licence

MIT