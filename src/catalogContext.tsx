import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import type { Catalog, CatalogOverrides } from "./catalog";
import { mergeCatalog, loadOverrides, saveOverrides, exportCatalog, importCatalog, defaultCatalog } from "./catalog";

type DomainKey = keyof Catalog;
const EDITOR_AUTOSAVE_KEY = "pa_editor_autosave";

type CatalogContextValue = {
  catalog: Catalog;
  overrides: CatalogOverrides;
  defaults: Catalog;
  autosave: boolean;
  dirty: boolean;
  setAutosave: (enabled: boolean) => void;
  saveNow: () => void;
  discardPending: () => void;
  updateDomain: (key: DomainKey, value: any) => void;
  resetDomain: (key: DomainKey) => void;
  resetAll: () => void;
  exportAll: () => string;
  importAll: (json: string, mode?: "replace" | "merge") => void;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<CatalogOverrides>(loadOverrides() ?? {});
  const [autosave, setAutosaveState] = useState(() => localStorage.getItem(EDITOR_AUTOSAVE_KEY) !== "false");
  const [dirty, setDirty] = useState(false);

  const catalog = useMemo(() => mergeCatalog(overrides), [overrides]);

  const applyOverrides = (next: CatalogOverrides) => {
    setOverrides(next);
    if (autosave) {
      saveOverrides(next);
      setDirty(false);
    } else {
      setDirty(true);
    }
  };

  const setAutosave = (enabled: boolean) => {
    setAutosaveState(enabled);
    localStorage.setItem(EDITOR_AUTOSAVE_KEY, String(enabled));
    if (enabled) {
      saveOverrides(overrides);
      setDirty(false);
    }
  };

  const saveNow = () => {
    saveOverrides(overrides);
    setDirty(false);
  };

  const discardPending = () => {
    setOverrides(loadOverrides() ?? {});
    setDirty(false);
  };

  const updateDomain = (key: DomainKey, value: any) => {
    const next = { ...overrides, [key]: value };
    applyOverrides(next);
  };

  const resetDomain = (key: DomainKey) => {
    const next = { ...overrides };
    delete (next as any)[key];
    applyOverrides(next);
  };

  const resetAll = () => {
    applyOverrides({});
  };

  const exportAll = () => exportCatalog(overrides);

  const importAll = (json: string, mode: "replace" | "merge" = "replace") => {
    const imported = importCatalog(json);
    if (mode === "replace") {
      applyOverrides(imported);
    } else {
      applyOverrides({ ...overrides, ...imported });
    }
  };

  const value: CatalogContextValue = {
    catalog,
    overrides,
    defaults: defaultCatalog,
    autosave,
    dirty,
    setAutosave,
    saveNow,
    discardPending,
    updateDomain,
    resetDomain,
    resetAll,
    exportAll,
    importAll,
  };

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog must be used within CatalogProvider");
  return ctx;
}

export const useCatalogData = () => useCatalog().catalog;
