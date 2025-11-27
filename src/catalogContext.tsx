import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import type { Catalog, CatalogOverrides } from "./catalog";
import { mergeCatalog, loadOverrides, saveOverrides, resetOverrides, exportCatalog, importCatalog, defaultCatalog } from "./catalog";

type DomainKey = keyof Catalog;

type CatalogContextValue = {
  catalog: Catalog;
  overrides: CatalogOverrides;
  updateDomain: (key: DomainKey, value: any) => void;
  resetDomain: (key: DomainKey) => void;
  resetAll: () => void;
  exportAll: () => string;
  importAll: (json: string, mode?: "replace" | "merge") => void;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<CatalogOverrides>(loadOverrides() ?? {});

  const catalog = useMemo(() => mergeCatalog(overrides), [overrides]);

  const persist = (next: CatalogOverrides) => {
    setOverrides(next);
    saveOverrides(next);
  };

  const updateDomain = (key: DomainKey, value: any) => {
    const next = { ...overrides, [key]: value };
    persist(next);
  };

  const resetDomain = (key: DomainKey) => {
    const next = { ...overrides };
    delete (next as any)[key];
    persist(next);
  };

  const resetAll = () => {
    setOverrides({});
    resetOverrides();
  };

  const exportAll = () => exportCatalog(overrides);

  const importAll = (json: string, mode: "replace" | "merge" = "replace") => {
    const imported = importCatalog(json);
    if (mode === "replace") {
      persist(imported);
    } else {
      persist({ ...overrides, ...imported });
    }
  };

  const value: CatalogContextValue = {
    catalog,
    overrides,
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
