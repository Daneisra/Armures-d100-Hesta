# Validation de l'impression et des PDF — 0.9.11

Contrôle effectué le 27 septembre 2026 sur la route `/print`, en mode automatisé sans fenêtre graphique. Les fichiers PDF de contrôle ont été générés localement puis retirés du dépôt.

| Navigateur | Standard | Compact | Détaillé |
| --- | ---: | ---: | ---: |
| Chrome | 2 pages | 1 page | 2 pages |
| Edge | 2 pages | 1 page | 2 pages |
| Firefox | 2 pages | 1 page | 2 pages |

- Chrome et Edge : export PDF par Playwright avec taille de page CSS et fonds imprimés.
- Firefox : export PDF par la commande WebDriver `Print Page` de geckodriver.
- Les neuf PDF ont été relus avec PDF.js : chaque page contient du texte ; titre, matériau, qualité et pied de fiche sont présents.
- Dans les trois navigateurs, les contrôles et la navigation sont masqués à l'impression, le papier reste blanc, aucune erreur JavaScript ni aucun débordement horizontal n'a été observé.
- Une fiche sauvegardée a été contrôlée en thème sombre dans les trois navigateurs : nom, matériau, qualité, catégorie et renfort borné sont conservés sur la fiche, avec un fond blanc imprimé.

L'audit valide le moteur d'impression et le contenu PDF. La boîte de dialogue native et une imprimante physique ne sont pas couvertes par ce contrôle automatisé.
