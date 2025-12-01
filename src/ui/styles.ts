// Tu peux changer les classes ici sans toucher les composants
const badgeBase = "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";
const badgeGood = `${badgeBase} border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-100 dark:border-emerald-500/70`;
const badgeBad = `${badgeBase} border-rose-300 text-rose-700 bg-rose-50 dark:bg-rose-900/30 dark:text-rose-100 dark:border-rose-500/70`;
const badgeWarn = `${badgeBase} border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-100 dark:border-amber-500/70`;
const badgeInfo = `${badgeBase} border-sky-300 text-sky-700 bg-sky-50 dark:bg-sky-900/30 dark:text-sky-100 dark:border-sky-500/70`;
const badgeNeutral = `${badgeBase} border-slate-300 text-slate-700 bg-slate-50 dark:bg-slate-800/60 dark:text-slate-100 dark:border-slate-500/70`;
const badgeMuted = `${badgeBase} border-slate-200 text-slate-500 bg-slate-50 dark:bg-slate-900/40 dark:text-slate-200 dark:border-slate-600/60`;
const badgeMystic = `${badgeBase} border-violet-300 text-violet-700 bg-violet-50 dark:bg-violet-900/30 dark:text-violet-100 dark:border-violet-500/70`;

export const cls = {
  // Layout
  page: "w-full mx-auto p-4",

  // Formulaires
  input:  "w-full rounded-md border border-border bg-card text-foreground placeholder:text-muted-foreground px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary transition",
  select: "w-full rounded-md border border-border bg-card text-foreground placeholder:text-muted-foreground px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary transition appearance-none pr-8 bg-[right_0.6rem_center] bg-no-repeat",

  // Boutons
  btn:        "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-primary/50",
  btnPrimary: "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-primary/50 bg-primary text-primary-foreground hover:bg-primary/90",
  btnGhost:   "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-primary/50 bg-transparent hover:bg-muted",

  // Conteneurs
  card:  "rounded-xl border bg-card p-4 shadow-sm",

  // Listes
  noteList: "list-disc pl-5 text-sm space-y-1 text-muted-foreground",

  // Table
  table: "w-full border-separate border-spacing-0",
  th:    "sticky top-0 z-10 bg-muted/60 backdrop-blur px-3 py-2 text-left text-xs font-semibold",
  td:    "px-3 py-2 text-sm",
  tr:    "border-b hover:bg-muted/40 focus-within:bg-primary/5",

  // Badges
  badge:        badgeBase,
  badgeGood,
  badgeBad,
  badgeWarn,
  badgeInfo,
  badgeNeutral,
  badgeMuted,
  badgeMystic,
  // Legacy aliases
  badgeSuccess: badgeGood,
  badgeError:   badgeBad,
};
