import { Link } from "react-router-dom";
import { cls } from "../ui/styles";

const releases = [
  {
    version: "0.9.4",
    title: "Journal des versions",
    changes: [
      "Ajout de cette page de changelog accessible depuis le numéro de version et l’aide.",
      "Historique public synthétisé à partir des versions réellement enregistrées dans le dépôt.",
    ],
  },
  {
    version: "0.9.3",
    title: "Retours d’import lisibles",
    changes: [
      "Résumé utilisateur, erreurs présentées par chemin et rapport technique copiable.",
      "Séparation des erreurs de lecture, de validation JSON et des autres actions du Catalogue.",
    ],
  },
  {
    version: "0.9.2",
    title: "Mises à jour PWA fiables",
    changes: [
      "Préchargement du HTML et des bundles JS/CSS avant activation du nouveau service worker.",
      "Rotation des caches et navigation hors ligne validées sur toutes les routes.",
    ],
  },
  {
    version: "0.9.1",
    title: "Audit responsive",
    changes: [
      "Audit des vues principales aux largeurs 390, 768 et 1440 px.",
      "Formulaires mobiles et en-têtes d’actions rendus adaptatifs.",
    ],
  },
  {
    version: "0.9.0",
    title: "Aide joueur",
    changes: [
      "Ajout de la page À propos / Aide rapide.",
      "Documentation du parcours joueur, de l’usure, du Perce-armure, des builds et des données locales.",
    ],
  },
  {
    version: "0.8.x",
    title: "Impression et PDF",
    changes: [
      "Fiche d’armure depuis le build courant ou un build sauvegardé.",
      "Modes Standard, Compact et Détaillé, feuille A4 et export via l’impression navigateur.",
    ],
  },
  {
    version: "0.7.x",
    title: "Expérience avancée",
    changes: [
      "Perce-armure clarifié, PWA hors ligne et navigation mobile dédiée.",
      "Pagination, détail et comparaison des matériaux, graphiques interactifs et exports SVG/CSV.",
      "Rééquilibrage du calculateur et densité améliorée dans l’éditeur.",
    ],
  },
  {
    version: "0.6.x",
    title: "Stabilisation et éditeur",
    changes: [
      "Validation stricte des imports et rapports d’erreurs.",
      "Tests, lint et contrôles CI, modales accessibles, annulation, corbeille et sauvegarde optionnelle.",
    ],
  },
  {
    version: "0.5.x",
    title: "Règles métier et partage",
    changes: [
      "Graphiques d’équilibrage, partage de builds et exports de données.",
      "Correction des multiplicateurs de réparation, du malus de renfort, de penIgnore et de l’arrondi des PV.",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className={`${cls.page} mx-auto max-w-4xl space-y-6`}>
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Évolution du projet</p>
        <h1 className="text-3xl font-bold">Journal des versions</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Les changements majeurs de Système PA, du plus récent au plus ancien.
        </p>
        <Link className={cls.btnGhost} to="/aide">Retour à l’aide</Link>
      </header>

      <ol className="relative space-y-4 border-l border-border pl-5">
        {releases.map((release, index) => (
          <li key={release.version} className={`${cls.card} relative space-y-3`}>
            <span className="absolute -left-[1.72rem] top-5 h-3 w-3 rounded-full border-2 border-background bg-primary" aria-hidden="true" />
            <div className="flex flex-wrap items-baseline gap-2">
              <span className={index === 0 ? cls.badgeInfo : cls.badgeNeutral}>v{release.version}</span>
              <h2 className="text-lg font-semibold">{release.title}</h2>
              {index === 0 && <span className={cls.badgeGood}>Actuelle</span>}
            </div>
            <ul className={cls.noteList}>
              {release.changes.map(change => <li key={change}>{change}</li>)}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}
