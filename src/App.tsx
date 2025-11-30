import { Routes, Route, Link, useLocation } from "react-router-dom";
import Calculator from "./components/Calculator";
import MaterialsPage from "./pages/MaterialsPage";
import ThemeToggle from "./components/ThemeToggle";
import PVPage from "./pages/PVPage";
import EditorPage from "./pages/EditorPage";
import BuildsPage from "./pages/BuildsPage";
import { cls } from "./ui/styles";

const NAV_ITEMS = [
  { label: "Calculateur", to: "/", match: (path: string) => path === "/" },
  { label: "Matériaux", to: "/materials", match: (path: string) => path.startsWith("/materials") },
  { label: "PV / Constitution", to: "/pv", match: (path: string) => path.startsWith("/pv") },
  { label: "Catalogue", to: "/builds", match: (path: string) => path.startsWith("/builds") },
  { label: "Éditeur", to: "/editeur", match: (path: string) => path.startsWith("/editeur") },
];

export default function App() {
  const location = useLocation();

return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:bg-primary focus:text-primary-foreground focus:px-3 focus:py-2 focus:rounded-md focus:shadow-lg"
      >
        Aller au contenu
      </a>
      <div className={`${cls.page} max-w-5xl space-y-6`}>
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

            <ThemeToggle />
          </div>

          <nav className="flex flex-wrap items-center gap-2">
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

        <main id="main">
          <Routes>
            <Route path="/" element={<Calculator />} />
            <Route path="/materials" element={<MaterialsPage />} />
            <Route path="/pv" element={<PVPage />} />
            <Route path="/builds" element={<BuildsPage />} />
            <Route path="/editeur" element={<EditorPage />} />
          </Routes>
        </main>
      </div>
    </>
  );
}
