# Règles métier de référence — Système PA

Ce document fixe le comportement des calculs pour la préparation de la version 1.0. Les valeurs chiffrées par défaut viennent de `src/data/*.json` ; l’éditeur local peut les personnaliser sans changer les formules. Toute évolution d’une règle ci-dessous doit mettre à jour ce document, les tests concernés et la version de l’application.

## Convention d100 inversé

Un jet réussit lorsque son résultat est inférieur ou égal à la caractéristique cible. Le calculateur d’armure ne lance pas de dés : il fournit les valeurs de protection, de malus, d’usure et de réparation.

## Construction d’une armure

La compatibilité est vraie si `material.compat === chassis.category`. Le formulaire filtre les matériaux selon le châssis et la catégorie d’affinage. `computeBuild()` calcule néanmoins un résultat même pour un couple incompatible ; la validation d’import d’un build sauvegardé refuse cette association.

```text
PA = châssis.basePA + matériau.modPA + qualité.bonusPA + renfort
   + bouclier.pa + matériauBouclier.paMod + bonus PA de l’enchantement

Malus = châssis.baseMalus + matériau.malusMod + qualité.malusMod + renfort
      + bouclier.malus + matériauBouclier.malusMod + effet de l’enchantement
```

- Le renfort est borné entre `0` et `params.renfortMax` et ajoute `+1 PA` **et** `+1 malus` par niveau.
- Le niveau d’enchantement est borné par le plus petit de `params.enchantMax` et `enchant.maxLevel` lorsque ce dernier existe. Un enchantement de protection ajoute ses PA par niveau ; un enchantement d’allègement réduit le malus selon `perLevel`.
- Après l’enchantement, le malus est ramené à `0` minimum. Si `material.halfMalus` est vrai, ce malus est ensuite divisé par deux et arrondi au supérieur.
- Le ratio métier vaut `PA / malus`. Si le malus final vaut `0`, le ratio métier vaut l’infini et le sweet spot est atteint. La valeur d’efficacité affichée vaut alors `PA`.
- Le sweet spot est atteint lorsque le ratio métier est supérieur ou égal à `params.sweetSpotRatio` (`2` dans les données par défaut).
- Les effets de résistance, de pénétration ignorée et d’usure de pénétration ne modifient pas directement le total PA/malus. Les deux derniers sont transmis au widget d’usure avec leur niveau d’enchantement effectif.

## Usure après un coup

Les dégâts et le Perce-armure de l’attaque sont deux valeurs distinctes. Les dégâts peuvent dépasser `20`. Le Perce-armure vaut `0` par défaut.

```text
perceArmureEffectif = max(0, perceArmureAttaque - matériau.penIgnore)
paEffective = max(0, paAvant - perceArmureEffectif)
pvSubis = max(0, dégâts - paEffective)
coupPénétrant = dégâts > paEffective
usure = params.baseWear + (coupPénétrant ? matériau.extraPen : 0)
usureAppliquée = min(usure, params.capWearPerHit)
paAprès = max(0, paAvant - usureAppliquée)
```

Un coup dont les dégâts sont **égaux** aux PA effectives ne pénètre pas. `penIgnore` réduit la pénétration de l’attaque, jamais les dégâts bruts. Les PA effectives servent uniquement à résoudre le coup ; les PA actuelles baissent ensuite de l’usure appliquée. Le widget conserve l’historique des coups tant qu’il reste monté et repart des PA du build si celles-ci changent.

Le suivi des PV dans le widget est facultatif et indépendant de la page Constitution. Quand des PV max sont saisis, les PV actuels sont initialisés à cette valeur ; après chaque coup, `PV après = max(0, PV avant - PV subis)`. Les PV réellement perdus ne peuvent pas dépasser les PV avant le coup. Modifier les PV actuels permet de refléter des soins ou corrections, sans dépasser le maximum. La réinitialisation du combat remet les PA au total du build, les PV au maximum saisi et efface l’historique.

## Réparation

```text
paManquants = max(0, floor(paManquantsSaisis))
coût = round(paManquants × coûtParPA[matériau.compat]
             × matériau.repair.costMul × qualité.repair.costMul)
heures = arrondiÀUneDécimale(paManquants × tempsParPA[matériau.compat]
                             × matériau.repair.timeMul × qualité.repair.timeMul)
```

Les multiplicateurs absents valent `1`. Les valeurs par défaut sont injectées depuis `repairMaterial.json` et `repairQuality.json` dans `src/data/index.ts`. Les clés runtime sont `repair.costMul` et `repair.timeMul`.

## PV et Constitution

La règle publique actuelle est `PV = Math.round(CON × 0.625)` pour une Constitution de `0` à `100`. Les paramètres par défaut utilisent le mode linéaire, un offset de `0`, aucun bonus par niveau et un cap de `999`.

Le calcul accepte aussi un mode table : les valeurs entre deux points sont interpolées linéairement ; hors de la table, la valeur du point extrême est utilisée. Dans les deux modes, le bonus `perLevel × max(0, niveau)` est ajouté avant le cap, puis le résultat est arrondi au plus proche avec `Math.round`.

## Données et compatibilité

Les JSON du dépôt sont les valeurs officielles par défaut. Le `localStorage` ne contient que les personnalisations et builds de l’utilisateur. Les imports sont validés avant écriture ; ils doivent respecter les références, types, bornes et versions de schéma existantes. Une modification incompatible d’un format sauvegardé nécessite une migration et un changement de version de schéma.

## Vérification

Les cas de référence se trouvent dans `tests/calc.test.ts`, `tests/wear.test.ts`, `tests/repair.test.ts` et `tests/pv.test.ts`. Avant d’accepter un changement de règle ou de données, exécuter `npm run lint`, `npm test` et `npm run build`.
