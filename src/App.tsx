import { Routes, Route, Link, useLocation } from "react-router-dom";
import Calculator from "./components/Calculator";
import MaterialsPage from "./pages/MaterialsPage";
import ThemeToggle from "./components/ThemeToggle";
import PVPage from "./pages/PVPage";
import EditorPage from "./pages/EditorPage";
import BuildsPage from "./pages/BuildsPage";
import OfflineStatus from "./components/OfflineStatus";
import PrintBuildPage from "./pages/PrintBuildPage";
import { cls } from "./ui/styles";
import {
  Calculator as CalculatorIcon,
  HeartPulse,
  Layers,
  Library,
  SlidersHorizontal,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Calculateur", mobileLabel: "Calcul", icon: CalculatorIcon, to: "/", match: (path: string) => path === "/" },
  { label: "Matériaux", mobileLabel: "Matériaux", icon: Layers, to: "/materials", match: (path: string) => path.startsWith("/materials") },
  { label: "PV / Constitution", mobileLabel: "PV", icon: HeartPulse, to: "/pv", match: (path: string) => path.startsWith("/pv") },
  { label: "Catalogue", mobileLabel: "Builds", icon: Library, to: "/builds", match: (path: string) => path.startsWith("/builds") },
  { label: "Éditeur", mobileLabel: "Éditeur", icon: SlidersHorizontal, to: "/editeur", match: (path: string) => path.startsWith("/editeur") },
];

export default function App() {
  const location = useLocation();

return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:top-2 focus:left-2 focus:bg-primary focus:text-primary-foreground focus:px-3 focus:py-2 focus:rounded-md focus:shadow-lg"
      >
        Aller au contenu
      </a>
      <div className={`${cls.page} max-w-7xl space-y-6`}>
        <header className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-xl font-bold">
                <Link to="/">Système PA</Link>
              </h1>
              <p className="text-xs text-muted-foreground">
                v{__APP_VERSION__} —{" "}
                <a
                  href="https://github.com/Daneisra/Armures-d100-Hesta"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2 hover:no-underline focus-visible:no-underline"
                >
                  GitHub
                </a>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <OfflineStatus />
              <ThemeToggle />
            </div>
          </div>

          <nav className="hidden flex-wrap items-center gap-2 sm:flex" aria-label="Navigation principale">
            {NAV_ITEMS.map(item => {
              const active = item.match(location.pathname);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`${cls.btnGhost} ${active ? "bg-primary/10 text-primary" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main id="main" className="pb-20 sm:pb-0">
          <Routes>
            <Route path="/" element={<Calculator />} />
            <Route path="/materials" element={<MaterialsPage />} />
            <Route path="/pv" element={<PVPage />} />
            <Route path="/builds" element={<BuildsPage />} />
            <Route path="/editeur" element={<EditorPage />} />
            <Route path="/print" element={<PrintBuildPage />} />
          </Routes>
        </main>
      </div>

      <nav className="mobile-nav fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-card/95 px-1 pt-1 shadow-[0_-4px_16px_rgb(0_0_0/0.08)] backdrop-blur sm:hidden" aria-label="Navigation mobile">
        {NAV_ITEMS.map(item => {
          const active = item.match(location.pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-md px-1 text-[10px] font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-primary/50 ${active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={19} strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
              <span className="max-w-full truncate">{item.mobileLabel}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
