import type { ImportFailure } from "../lib/importFeedback";
import { cls } from "../ui/styles";

type ImportErrorPanelProps = {
  failure: ImportFailure;
  onCopy: () => void;
  onDismiss: () => void;
};

export default function ImportErrorPanel({ failure, onCopy, onDismiss }: ImportErrorPanelProps) {
  const visibleIssues = failure.issues.slice(0, 8);

  return (
    <section className={`${cls.card} border-rose-500 text-sm`} role="alert" aria-live="assertive">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-semibold text-rose-700 dark:text-rose-200">{failure.title}</h2>
          <p className="mt-1 text-muted-foreground">{failure.summary}</p>
        </div>
        <button className={cls.btnGhost} type="button" onClick={onDismiss}>Fermer</button>
      </div>

      {visibleIssues.length > 0 && (
        <ul className="mt-3 space-y-2">
          {visibleIssues.map((issue, index) => (
            <li key={`${issue.path}-${index}`} className="rounded-md border border-rose-200 bg-rose-50/60 px-3 py-2 dark:border-rose-900 dark:bg-rose-950/30">
              <code className="font-semibold text-rose-700 dark:text-rose-200">{issue.path}</code>
              <span className="ml-2 text-foreground">{issue.message}</span>
            </li>
          ))}
          {failure.issues.length > visibleIssues.length && (
            <li className="text-muted-foreground">
              {failure.issues.length - visibleIssues.length} autre(s) erreur(s) dans le rapport complet.
            </li>
          )}
        </ul>
      )}

      <details className="mt-3 rounded-md border border-border bg-muted/20 px-3 py-2">
        <summary className="cursor-pointer font-medium">Rapport technique complet</summary>
        <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words font-mono text-xs text-rose-700 dark:text-rose-200">
          {failure.report}
        </pre>
      </details>

      <button className={`${cls.btnGhost} mt-3`} type="button" onClick={onCopy}>
        Copier le rapport d’erreurs
      </button>
    </section>
  );
}
