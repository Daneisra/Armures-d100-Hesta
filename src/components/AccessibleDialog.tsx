import { useEffect, useId, useRef, type ReactNode } from "react";
import { cls } from "../ui/styles";

type AccessibleDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  initialFocusSelector?: string;
};

export default function AccessibleDialog({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  initialFocusSelector,
}: AccessibleDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      previousFocusRef.current = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
      dialog.showModal();
      requestAnimationFrame(() => {
        const target = initialFocusSelector
          ? dialog.querySelector<HTMLElement>(initialFocusSelector)
          : dialog.querySelector<HTMLElement>("button, input, select, textarea, [tabindex]:not([tabindex='-1'])");
        target?.focus();
      });
    } else if (!open && dialog.open) {
      dialog.close();
      previousFocusRef.current?.focus();
      previousFocusRef.current = null;
    }
  }, [open, initialFocusSelector]);

  useEffect(() => () => {
    previousFocusRef.current?.focus();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className="m-auto w-[min(32rem,calc(100%_-_2rem))] rounded-xl border border-border bg-card p-0 text-foreground shadow-xl backdrop:bg-black/60"
      onCancel={event => {
        event.preventDefault();
        onClose();
      }}
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
            {description && (
              <p id={descriptionId} className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <button className={cls.btnGhost} type="button" onClick={onClose} aria-label="Fermer la fenêtre">
            ×
          </button>
        </div>

        <div className="mt-4">{children}</div>

        {footer && <div className="mt-5 flex flex-wrap justify-end gap-2">{footer}</div>}
      </div>
    </dialog>
  );
}
