import { Link } from "react-router-dom";
import { cls } from "../ui/styles";

const sections = [
  { id: "choisir", label: "Choisir une armure" },
  { id: "compatibilite", label: "Compatibilité" },
  { id: "usure", label: "Usure" },
  { id: "perce-armure", label: "Perce-armure" },
  { id: "builds", label: "Builds" },
  { id: "impression", label: "Impression" },
  { id: "donnees-locales", label: "Données locales" },
];

export default function HelpPage() {
  return (
    <div className={`${cls.page} mx-auto max-w-5xl space-y-6`}>
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Documentation joueur</p>
        <h1 className="text-3xl font-bold">À propos & aide rapide</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Système PA aide à construire, comparer et sauvegarder des armures pour un système d100 inversé. Cette page résume le parcours recommandé et les règles affichées par l’outil.
        </p>
        <Link className={cls.btnGhost} to="/changelog">Voir le journal des versions</Link>
      </header>

      <nav className="flex flex-wrap gap-2" aria-label="Sommaire de l’aide">
        {sections.map(section => <a key={section.id} className={cls.btnGhost} href={`#${section.id}`}>{section.label}</a>)}
      </nav>

      <section className={`${cls.card} space-y-3`} aria-labelledby="demarrage-title">
        <h2 id="demarrage-title" className="text-xl font-semibold">Démarrage rapide</h2>
        <ol className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <Step number="1" title="Choisis le châssis">Il fixe les PA et le malus de base ainsi que la famille de matériau attendue.</Step>
          <Step number="2" title="Affine le matériau">La catégorie filtre la liste, puis le matériau ajoute ses modificateurs et résistances.</Step>
          <Step number="3" title="Ajuste le build">Qualité, renfort, enchantement et bouclier modifient le résultat final.</Step>
          <Step number="4" title="Sauvegarde ou imprime">Conserve le build dans le Catalogue ou ouvre sa fiche d’armure.</Step>
        </ol>
        <Link className={cls.btnPrimary} to="/">Ouvrir le calculateur</Link>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <HelpSection id="choisir" title="Choisir un châssis">
          <p>Le châssis représente la construction générale de l’armure. Il apporte les <strong>PA de base</strong>, le <strong>malus de base</strong> et une compatibilité attendue : Gambison, Cuir ou Métal.</p>
          <p>Commence par choisir le type d’armure voulu. Les matériaux proposés sont ensuite filtrés pour éviter les associations incohérentes.</p>
        </HelpSection>

        <HelpSection id="compatibilite" title="Matériau, catégorie et compatibilité">
          <ul className={cls.noteList}>
            <li><strong>Matériau :</strong> matière précise utilisée, par exemple acier, cuir renforcé ou mithril.</li>
            <li><strong>Catégorie :</strong> famille d’affinage servant à classer et filtrer les matériaux.</li>
            <li><strong>Compatibilité :</strong> famille structurelle attendue par le châssis.</li>
          </ul>
          <p>Le badge Compatible signifie que <code>material.compat</code> correspond à la catégorie du châssis.</p>
        </HelpSection>

        <HelpSection id="usure" title="Comprendre l’usure">
          <p>Chaque coup applique au minimum l’usure de base. Si les dégâts dépassent les PA effectives, le coup est pénétrant et ajoute l’usure de pénétration du matériau.</p>
          <div className="rounded-lg border border-border bg-muted/30 p-3 font-mono text-xs leading-6">
            usure = baseWear<br />
            si coup pénétrant : usure += extraPen<br />
            usure finale = min(usure, capWearPerHit)
          </div>
          <p>Les PA actuelles diminuent de cette usure, jamais directement du montant total des dégâts.</p>
        </HelpSection>

        <HelpSection id="perce-armure" title="Perce-armure et penIgnore">
          <p>Le Perce-armure est une option avancée du widget d’usure. Il réduit les PA effectives uniquement pour le coup en cours.</p>
          <p>Le <code>penIgnore</code> du matériau annule une partie de ce Perce-armure. Il ne réduit pas directement les dégâts et ne restaure pas de PA.</p>
          <p className="text-sm font-medium">Exemple : Perce-armure 3 et penIgnore 1 donnent un Perce-armure effectif de 2.</p>
        </HelpSection>

        <HelpSection id="builds" title="Sauvegarder et partager un build">
          <p>Le bouton <strong>Enregistrer ce build</strong> ajoute la configuration au Catalogue local. Depuis cette page, tu peux l’appliquer, la partager par lien, exporter son JSON ou ouvrir sa fiche.</p>
          <p>Un build appliqué hydrate directement le calculateur, sans rechargement de la page.</p>
          <Link className={cls.btnGhost} to="/builds">Ouvrir le Catalogue</Link>
        </HelpSection>

        <HelpSection id="impression" title="Imprimer une fiche">
          <p>Depuis le calculateur ou un build sauvegardé, ouvre la fiche puis choisis le mode Standard, Compact ou Détaillé.</p>
          <p>Le bouton <strong>Imprimer / PDF</strong> ouvre la boîte native du navigateur. Sélectionne une imprimante ou « Enregistrer au format PDF ».</p>
        </HelpSection>
      </div>

      <section id="donnees-locales" className={`${cls.card} scroll-mt-4 space-y-3 border-amber-300 dark:border-amber-700`}>
        <h2 className="text-xl font-semibold">Quelles données restent locales ?</h2>
        <p className="text-sm">Les builds, overrides de l’éditeur, dernière configuration et préférence de thème sont stockés dans le navigateur avec <code>localStorage</code>. Aucun compte ni serveur applicatif n’est utilisé.</p>
        <ul className={cls.noteList}>
          <li>Les données ne sont pas automatiquement synchronisées entre appareils ou navigateurs.</li>
          <li>Effacer les données du site supprime les personnalisations non exportées.</li>
          <li>Exporte régulièrement les builds et le catalogue JSON pour conserver une sauvegarde partageable.</li>
        </ul>
        <Link className={cls.btnGhost} to="/editeur">Ouvrir l’Éditeur</Link>
      </section>
    </div>
  );
}

function HelpSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className={`${cls.card} scroll-mt-4 space-y-3 text-sm`}>
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Step({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <li className="rounded-lg border border-border bg-muted/20 p-3">
      <span className={cls.badgeInfo}>{number}</span>
      <h3 className="mt-2 font-semibold">{title}</h3>
      <p className="mt-1 text-muted-foreground">{children}</p>
    </li>
  );
}
