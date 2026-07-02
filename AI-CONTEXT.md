# Contexte IA — Système PA / Armures d100

> Référence rapide destinée aux agents IA intervenant sur ce dépôt. Lire ce fichier avant toute modification. Les observations ci-dessous correspondent à la version `0.6.5`. En cas de divergence, la version de `package.json`, le code et les JSON du dépôt priment sur ce document.

## 1. Résumé du projet

- Application web statique React/Vite/TypeScript pour gérer et calculer des armures dans un système JDR d100 inversé (Hesta).
- Fonctions principales : calcul PA/malus, compatibilité châssis-matériau, enchantements, boucliers, usure en combat, réparation, PV/Constitution, catalogue de builds et éditeur local des données.
- Déploiement statique sur OVH via un sous-domaine et GitHub Actions, avec transfert FTP du contenu de `dist/`.
- Aucun backend applicatif, aucune API métier et aucune base de données serveur.
- Les personnalisations utilisateur sont stockées dans `localStorage`.

## 2. Stack technique

- React 18.
- Vite 5.
- TypeScript 5 en mode `strict`.
- React Router (`BrowserRouter` côté application, routes SPA).
- Tailwind CSS v4 via PostCSS.
- `tailwindcss-animate` pour les animations légères.
- `lucide-react` pour les icônes.
- Données métier en JSON dans `src/data/`.
- Persistance navigateur via `localStorage`.
- Node 20 utilisé dans le workflow de déploiement ; Node 18+ est attendu localement.

Scripts disponibles :

```bash
npm run dev
npm run lint
npm test
npm run build
npm run preview
```

`npm run build` exécute `tsc -b && vite build`. `npm test` lance Vitest en mode non interactif et `npm run lint` analyse `src/`, `tests/` et `vite.config.ts` avec ESLint.

### Particularités Tailwind CSS v4

- L’entrée CSS utilise `@import "tailwindcss";` dans `src/index.css`.
- Les tokens de couleur sont déclarés avec `@theme`.
- Le plugin PostCSS est `@tailwindcss/postcss` dans `postcss.config.js`.
- `@plugin "tailwindcss-animate";` active les utilitaires d’animation.
- Ne pas utiliser les anciens patterns Tailwind v3 sans vérifier leur compatibilité v4.
- Ne jamais faire `@apply input`, `@apply btn`, `@apply card`, etc. : `@apply` doit contenir uniquement des utilitaires Tailwind, pas des classes CSS custom du projet.

## 3. Architecture

Flux principal des données :

```text
src/data/*.json
  -> src/data/index.ts (normalisation et injection réparation/PV)
  -> src/catalog.ts (catalogue canonique + fusion des overrides)
  -> CatalogProvider / useCatalogData()
  -> pages, composants et fonctions métier
```

### Dossiers principaux

- `src/data/`
  - Source officielle des données par défaut.
  - Contient les JSON versionnés et `index.ts`, qui adapte les JSON vers les types TypeScript.
  - Les multiplicateurs de réparation sont injectés dans `Material.repair` et `Quality.repair` à cet endroit.
  - `params.pv` est normalisé vers l’union `PVParams` (`linear` ou `table`).

- `src/lib/`
  - Fonctions métier pures ou quasi pures.
  - `calc.ts` : PA, malus, efficacité, sweet spot, enchantements, boucliers et notes.
  - `wear.ts` : simulation d’un coup, pénétration, perte de PV et usure des PA.
  - `repair.ts` : coût et durée de réparation.
  - `importValidation.ts` : validation stricte et rapports structurés pour les imports catalogue/builds.

- `src/components/`
  - Composants réutilisables et widgets métier.
  - `Calculator.tsx` orchestre le build actif, les filtres, le stockage local, le partage et les widgets.
  - `WearWidget.tsx` gère les PA actuelles et l’historique des coups.
  - `RepairWidget.tsx` présente le calcul de réparation.
  - `AccessibleDialog.tsx` encapsule l’élément natif `<dialog>` pour les confirmations et formulaires modaux accessibles.

- `src/pages/`
  - Pages routées : matériaux, PV/Constitution, catalogue de builds et éditeur.
  - Routes actuelles : `/`, `/materials`, `/pv`, `/builds`, `/editeur`.
  - L’éditeur propose un historique limité à 20 actions, une corbeille de session, une sauvegarde automatique optionnelle et des listes filtrables/triables.

- `src/ui/`
  - Styles centralisés et primitives visuelles.
  - `styles.ts` expose l’objet `cls` (`page`, `card`, `input`, `select`, `btnPrimary`, `btnGhost`, `badge*`, `noteList`, styles de table, etc.).

- `tests/`
  - Tests unitaires Vitest des règles métier principales.
  - Couvre actuellement `calc`, `wear`, `repair`, `importValidation` et la fusion du catalogue.

### Fichiers structurants complémentaires

- `src/types.ts` : contrats TypeScript des données et résultats métier.
- `src/catalog.ts` : catalogue canonique, fusion et persistance des overrides.
- `src/catalogContext.tsx` : contexte React donnant accès au catalogue fusionné.
- `src/buildCatalog.ts` : CRUD local et import/export du catalogue de builds.
- `src/App.tsx` : navigation, routes, skip link et shell principal.

## 4. Inventaire des données JSON

- `categories.json` : catégories d’affinage, ordre d’affichage et compatibilité attendue.
- `chassis.json` : PA/malus de base, groupe et compatibilité (`Gambison`, `Cuir`, `Métal`).
- `materials.json` : modificateurs PA/malus, catégorie, compatibilité, usure, pénétration et résistances.
- `qualities.json` : bonus PA et modificateur de malus par qualité.
- `enchantments.json` : enchantements génériques (`pa_flat`, `malus_flat`, résistances, pénétration, etc.).
- `shields.json` : PA, malus et poids des boucliers.
- `shieldMaterials.json` : modificateurs liés au matériau du bouclier.
- `params.json` : sweet spot, limites renfort/enchantement, usure, réparation et paramètres PV.
- `repairMaterial.json` : multiplicateurs de coût/temps par matériau.
- `repairQuality.json` : multiplicateurs de coût/temps par qualité.

Les noms servent aujourd’hui d’identifiants dans plusieurs fusions et sélections. Un renommage n’est donc pas neutre.

## 5. Règles métier importantes

### Système d100 inversé

- Une action réussit si le jet est inférieur ou égal à la caractéristique.
- Cette règle est une convention du système Hesta ; le calculateur d’armure actuel ne résout pas directement les jets de compétence.

### PA, malus et compatibilité

Formule principale actuelle :

```text
PA = châssis.basePA
   + matériau.modPA
   + qualité.bonusPA
   + renfort
   + bouclier.pa
   + matériauBouclier.paMod
   + effets d’enchantement sur les PA

Malus = châssis.baseMalus
      + matériau.malusMod
      + qualité.malusMod
      + renfort
      + bouclier.malus
      + matériauBouclier.malusMod
      + effets d’enchantement sur le malus
```

- `renfort` est borné entre `0` et `params.renfortMax` et ajoute `+1 PA` et `+1 malus` par niveau.
- Le niveau d’enchantement est borné par `params.enchantMax`.
- Le malus final est borné à `0` minimum.
- Si `material.halfMalus` est vrai, le malus est divisé par deux avec arrondi supérieur.
- Efficacité : `PA / malus`. Quand le malus vaut `0`, l’efficacité affichée devient la valeur des PA et le ratio métier utilisé pour le sweet spot est infini.
- Sweet spot : ratio supérieur ou égal à `params.sweetSpotRatio` (actuellement `2`).
- La compatibilité est vraie lorsque `material.compat === chassis.category`.
- L’UI filtre normalement les catégories et matériaux selon la compatibilité du châssis ; la fonction `computeBuild()` ne rejette pas explicitement un couple incompatible.

### Usure en combat

Implémentation dans `src/lib/wear.ts` :

```text
pénétration_effective = max(0, pénétration_attaque - penIgnore_total)
PA_effective = max(0, PA_avant - pénétration_effective)
PV subis = max(0, dégâts - PA_effective)
pénétration_du_coup = dégâts > PA_effective
usure non pénétrante = params.baseWear
usure pénétrante = params.baseWear + material.extraPen
usure appliquée = min(usure, params.capWearPerHit)
PA_après = max(0, PA_avant - usure appliquée)
```

- `penIgnore` réduit uniquement la pénétration de l’attaque ; il ne réduit jamais directement les dégâts bruts.
- `PA_effective` est temporaire pour la résolution du coup. Les PA permanentes ne diminuent ensuite que de l’usure appliquée.
- Les PA diminuent de l’usure, pas des dégâts bruts.
- `WearWidget` autorise les dégâts supérieurs à 20, accepte une pénétration d’attaque distincte, permet de modifier les PA actuelles et conserve un historique local des coups tant que le composant reste monté.
- Un changement de `paFinal` réinitialise les PA actuelles et l’historique.
- L’enchantement `extraPen_delta` est appliqué au matériau transmis au widget d’usure.
- L’enchantement `pen_ignore_add` augmente le `penIgnore` total transmis au widget d’usure.

### Réparation

Implémentation dans `src/lib/repair.ts` :

```text
coût = PA_manquants
     × params.repair.costPerPA[compat]
     × material.repair.costMul
     × quality.repair.costMul

temps = PA_manquants
      × params.repair.timePerPA[compat]
      × material.repair.timeMul
      × quality.repair.timeMul
```

- La compatibilité utilisée est `material.compat`.
- Les PA manquants sont bornés à `0` minimum puis arrondis à l’entier inférieur.
- Le coût final est arrondi à l’entier le plus proche.
- Le temps final est arrondi à une décimale.
- Les bases sont définies dans `params.json`.
- Les multiplicateurs runtime attendus sont uniquement `repair.costMul` et `repair.timeMul` sur `Material` et `Quality`.
- Ces propriétés sont injectées depuis `repairMaterial.json` et `repairQuality.json` par `src/data/index.ts`.
- Les deux fichiers dédiés utilisent exactement les clés `costMul` et `timeMul` en camelCase ; conserver cette convention.
- Ne pas réintroduire ou mélanger les anciens champs plats `repairCostMult` / `repairTimeMult`.

### PV / Constitution

- Modèle actuel dans `params.json` : mode `linear`.
- Formule actuelle : `PV = Math.round(CON × 0.625)` avec offset `0` et arrondi au plus proche.
- Constitution bornée de `0` à `100` dans les paramètres actuels.
- `perLevel` vaut actuellement `0` et `cap` vaut `999`.
- `PVPage.tsx` sait aussi gérer un mode `table` avec interpolation linéaire entre les points.
- L’adaptateur `toPVParams()` de `src/data/index.ts` fournit des valeurs par défaut sûres pour les deux modes.

## 6. Source de vérité et persistance

### Source canonique

- Les JSON commités dans `src/data/` sont la source de vérité officielle et publique.
- Toute modification des valeurs par défaut doit être faite dans ces JSON, puis validée par le build et par un test fonctionnel du calculateur.
- `src/data/index.ts` est l’unique couche normale d’adaptation/enrichissement des JSON avant exposition au reste de l’application.

### Personnalisation runtime

- `localStorage` est une couche de personnalisation utilisateur, jamais la source canonique du projet.
- Le catalogue runtime utilise les defaults du repo pour les domaines sans override. Une liste éditée est stockée comme un instantané complet du domaine afin que les suppressions restent effectives ; les paramètres restent fusionnés avec leurs defaults.
- Lorsque la sauvegarde automatique de l’éditeur est désactivée, les overrides restent en mémoire jusqu’à un enregistrement manuel ou un abandon du brouillon.
- Ne pas introduire de backend, d’API distante ou de base de données sans décision explicite du propriétaire du projet.

Clés actuellement utilisées :

- `pa_catalog_v1` : overrides du catalogue, payload avec `schemaVersion: 1`.
- `pa_build_catalog_v1` : catalogue local de builds.
- `lastBuild_v2` : dernier build du calculateur.
- `lastBuildCat_v2` : dernière catégorie d’affinage sélectionnée.
- `lastBuild` : ancienne clé lue uniquement pour migration.
- `theme-mode` : préférence `auto`, `light` ou `dark`.
- `pa_editor_autosave` : préférence de sauvegarde automatique de l’éditeur (`true` ou `false`).

Règles de compatibilité :

- Ne pas modifier la structure des payloads sans migration.
- Toute rupture de format doit entraîner un bump de schéma et une stratégie de migration/fallback.
- Ne pas renommer un champ JSON ou une valeur servant de clé (`name`, `category`, `compat`, identifiants d’enchantement) sans analyser les sauvegardes existantes.
- Tout import catalogue ou builds est validé avant écriture dans `localStorage` : structure, types, bornes, doublons et références croisées.
- Une erreur d’import doit lever `ImportValidationError`, conserver les données locales existantes et produire un rapport avec un chemin précis par erreur.

## 7. Conventions de développement

- Favoriser des changements incrémentaux et ciblés.
- Préserver la logique métier pure dans `src/lib/` ; garder les états et interactions dans les composants/pages.
- Utiliser les types de `src/types.ts` au lieu de dupliquer des formes de données.
- Éviter `any` dans les nouvelles modifications, notamment pour les imports JSON et les formulaires de l’éditeur.
- Ne pas renommer les champs JSON sans migration et sans mise à jour coordonnée des types, adaptateurs, imports/exports et sauvegardes locales.
- Ne pas casser les données `localStorage` sans bump de schéma.
- Utiliser `cls` depuis `src/ui/styles.ts` pour les primitives UI communes.
- Préférer `cls.card`, `cls.input`, `cls.select`, `cls.btnPrimary`, `cls.btnGhost`, `cls.badgeGood`, `cls.badgeBad`, `cls.badgeWarn`, etc.
- Éviter les couleurs Tailwind codées en dur dans les composants lorsqu’un token `cls` approprié existe.
- Conserver les utilitaires Tailwind de layout (`flex`, `grid`, `gap-*`, `px-*`, etc.) quand ils sont spécifiques au composant.
- Maintenir un contraste correct en modes clair, sombre et auto.
- Conserver un focus clavier visible et relier les labels aux champs avec `htmlFor`/`id` lorsque possible.
- Utiliser `AccessibleDialog` pour toute nouvelle modale afin de conserver Échap, focus modal et restauration du focus déclencheur.
- Pour les données numériques, conserver les bornes, conversions et fallbacks explicites.
- Ne pas muter les tableaux du catalogue partagé ; préférer une copie avant `sort()`.

## 8. Déploiement

- Commande de build : `npm run build`.
- Sortie Vite : `dist/`.
- Workflow : `.github/workflows/deploy.yml`.
- Déclenchement : push sur `main` ou lancement manuel (`workflow_dispatch`).
- Installation avec `npm ci`, lint, tests, build avec Node 20, puis déploiement FTP via `SamKirkland/FTP-Deploy-Action@4.0.0`.
- Dossier distant actuel : `pahesta/`.
- Secrets requis : `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`.
- `public/.htaccess` est copié dans `dist/` et fournit le fallback SPA vers `/index.html`.
- Le fallback actuel suppose que le sous-domaine sert l’application depuis sa racine. Si l’application passe dans un sous-dossier URL, adapter `RewriteBase`, la cible de rewrite et éventuellement `base` dans Vite.
- `dangerous-clean-slate: true` supprime le contenu du dossier distant avant upload. Ne l’utiliser que si `server-dir` pointe vers un dossier exclusivement dédié à cette application.

## 9. Roadmap actuelle

### 0.7.x — Expérience avancée

- Améliorer l’UX du widget Usure : renommer “Pénétration de l’attaque” en “Perce-armure (optionnel)”, laisser la valeur à 0 par défaut, ajouter une aide claire et éventuellement masquer ce champ dans une section avancée.
- Ajouter le mode PWA/offline et mettre en cache les données et la dernière session.
- Repenser la navigation mobile.
- Ajouter les tables avancées : pagination, vues détaillées et comparateur.
- Rendre les graphiques interactifs et permettre l’export image/CSV.

### 0.8.x — Impression & partage long terme

- Ajouter une fiche imprimable.
- Ajouter l’export PDF.
- Proposer des templates de fiche compact et détaillé.

## 10. Points à vérifier avant de modifier le métier

- Aucun point bloquant connu à ce stade. Ajouter ici toute divergence confirmée entre règles métier, données, UI et documentation.

## 11. Checklist avant et après une modification

- Lire les types et le JSON concernés avant de changer le code.
- Vérifier si la modification touche une clé `localStorage` ou un schéma exporté.
- Vérifier les références par nom et catégorie dans les données.
- Lancer `npm run lint`, `npm test` et `npm run build`.
- Tester le thème clair, sombre et auto.
- Tester au minimum les routes `/`, `/materials` et `/pv`.
- Si la modification concerne le catalogue, tester aussi `/builds` et `/editeur`.
- Tester un rechargement complet du navigateur et la persistance locale.
- Tester import, export, reset et migration si le format des données change.
- Vérifier qu’un changement de JSON ne casse ni le filtrage du calculateur, ni les sélections existantes, ni les formules.
- Vérifier le responsive mobile et la navigation clavier pour toute modification UI.
- Avant déploiement, vérifier que `public/.htaccess` est présent dans `dist/` et que `server-dir` cible bien le dossier dédié du sous-domaine.

## Workflow attendu des agents IA

Lorsqu’un agent IA intervient sur ce projet, il doit respecter les règles suivantes.

### 1. Toujours proposer un nom de commit

À la fin de chaque réponse impliquant une modification du projet, l’agent doit proposer un message de commit clair et prêt à utiliser.

Formats recommandés :

- `feat(scope): description`
- `fix(scope): description`
- `refactor(scope): description`
- `docs(scope): description`
- `ui(scope): description`
- `chore(scope): description`

Exemples :

- `feat(editor): add local CRUD for chassis`
- `fix(repair): correct material repair multiplier loading`
- `ui(materials): improve table density and dark mode contrast`
- `docs(context): update AI project context`

L’agent ne doit pas créer de commit automatiquement, sauf demande explicite.

### 2. Incrémenter la version de l’application

La version de l’application est définie dans `package.json`, injectée par Vite via `__APP_VERSION__` et affichée dans l’interface.

À chaque implémentation fonctionnelle ou modification notable, l’agent doit incrémenter la version de l’application.

Règles de versionnement :

- **Patch**, par exemple `0.3.3` → `0.3.4` : bugfix, petite amélioration, polish UI, correction de données ou ajustement mineur.
- **Minor**, par exemple `0.3.x` → `0.4.0` : fonctionnalité importante, nouvelle page, mini CRUD, import/export ou catalogue de builds.
- **Major** : à éviter pour le moment ; uniquement en cas de refonte incompatible majeure validée explicitement.

L’incrément doit mettre à jour :

- `package.json` ;
- `package-lock.json` lorsqu’il est présent.

Méthode recommandée pour un patch :

```bash
npm version patch --no-git-tag-version
```

Pour une fonctionnalité importante de roadmap :

```bash
npm version minor --no-git-tag-version
```

Règles complémentaires :

- Ne pas créer de tag Git automatiquement.
- Ne pas commit automatiquement, sauf demande explicite.
- Mentionner clairement dans la réponse la version appliquée.
- Pour une modification purement documentaire et mineure, demander confirmation avant d’incrémenter la version. Si la tâche interdit explicitement de modifier `package.json`, conserver la version actuelle et le signaler.

### 3. Format de fin de réponse obligatoire

Chaque réponse d’un agent IA qui modifie le projet doit se terminer par :

- la version proposée ou appliquée ;
- un résumé des fichiers modifiés ;
- les commandes de vérification recommandées ;
- un message de commit conseillé.

Exemple :

Version appliquée :

```text
0.3.4
```

Fichiers modifiés :

- `src/pages/MaterialsPage.tsx`
- `src/ui/styles.ts`
- `package.json`
- `package-lock.json`

Vérification recommandée :

```bash
npm run build
```

Commit conseillé :

```bash
git add .
git commit -m "ui(materials): improve table polish and dark mode contrast"
```
