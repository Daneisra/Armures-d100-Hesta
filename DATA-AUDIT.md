# Audit des données officielles — 0.9.9

Les dix fichiers JSON de `src/data/` ont été vérifiés avant le jalon 1.0. Aucun changement des valeurs de jeu n’a été nécessaire. Les JSON du dépôt restent la source officielle ; les personnalisations du navigateur n’entrent pas dans cet audit.

| Fichier | Entrées | Contrôle principal |
| --- | ---: | --- |
| `categories.json` | 9 | Clés, libellés et ordres uniques ; catégorie utilisée par au moins un matériau ; compatibilité valide. |
| `chassis.json` | 15 | Schéma, bornes, noms uniques ; matériau compatible disponible pour chaque châssis. |
| `materials.json` | 29 | Schéma, bornes, noms uniques ; catégorie existante et compatibilité cohérente. |
| `qualities.json` | 5 | Schéma, bornes et noms uniques. |
| `shields.json` | 5 | Schéma, bornes et noms uniques. |
| `shieldMaterials.json` | 8 | Types, compatibilités, modificateurs et noms uniques. |
| `enchantments.json` | 13 | Identifiants et noms uniques ; effets définis ; niveaux bornés par `enchantMax`. |
| `repairMaterial.json` | 29 | Une ligne par matériau ; clés `costMul`/`timeMul` numériques ; injection vérifiée. |
| `repairQuality.json` | 5 | Une ligne par qualité ; clés `costMul`/`timeMul` numériques ; injection vérifiée. |
| `params.json` | 1 objet | Paramètres de combat, réparation et PV présents, finis et dans les bornes attendues. |

Ces contrôles sont exécutés dans `tests/defaultData.test.ts` avec `npm test`. Les données éditables sont également passées par la validation stricte des imports. Pour toute modification future d’un JSON canonique, exécuter `npm run lint`, `npm test` et `npm run build` ; mettre à jour ce rapport si les comptes ou les règles changent.
