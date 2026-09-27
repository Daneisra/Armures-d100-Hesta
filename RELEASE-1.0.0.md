# Préparation de la release v1.0.0

La version `1.0.0` est inscrite dans `package.json` et `package-lock.json`. Le changelog, le README et le contexte projet sont synchronisés. Ce document prépare la publication ; il ne signifie pas que le tag ou la release GitHub existent déjà.

## Contenu de la release

- Calculateur d'armure avec compatibilité, enchantements, boucliers, usure et réparation.
- Suivi des PA et des PV pendant le combat, avec historique des coups.
- Catalogue de builds et éditeur local avec import/export JSON et validation.
- Calculateur PV/Constitution, comparateur de matériaux et graphiques d'équilibrage.
- Fiches d'armure imprimables en modes Standard, Compact et Détaillé.
- Navigation responsive, thème clair/sombre/auto, aide, changelog et PWA hors ligne.

## Contrôles avant publication

```bash
npm ci
npm run lint
npm test
npm run build
```

Les tests de règles et de données sont dans `tests/`. Les validations de l'impression figurent dans `PRINT-AUDIT.md`. Après le build, vérifier que `dist/` contient `index.html`, les assets et le service worker.

## Publication

Le workflow `.github/workflows/deploy.yml` déploie automatiquement chaque push sur `main` vers `/var/www/pahesta/` via SSH/rsync. Une fois les changements relus et validés :

1. Commiter les fichiers de préparation de la version `1.0.0`.
2. Pousser le commit sur `main` et vérifier que le workflow de déploiement réussit.
3. Vérifier la version et les routes `/`, `/materials`, `/pv`, `/builds`, `/editeur` et `/print` sur `https://pahesta.dannytech.fr/`.
4. Créer le tag annoté `v1.0.0` **sur ce commit**, le pousser, puis publier une release GitHub reprenant les points ci-dessus.

Le workflow exclut `.htaccess` du transfert. Vérifier que le serveur web du VPS gère les routes SPA ; ne pas supposer que la configuration Apache du dépôt est active sur le VPS.
