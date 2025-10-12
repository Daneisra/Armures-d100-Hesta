import { Routes, Route, Link, NavLink } from "react-router-dom";
import Calculator from "./components/Calculator";
import MaterialsPage from "./pages/MaterialsPage";
import ThemeToggle from "./components/ThemeToggle";
import PVPage from "./pages/PVPage";

export default function App() {
  const navClass = ({ isActive }: { isActive: boolean }) =>
    "btn" + (isActive ? " btn-primary" : "");

  return (
    <div className="max-w-5xl mx-auto p-4">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">
          <Link to="/">Système PA <span className="text-sm opacity-60">v{__APP_VERSION__}</span></Link>
        </h1>

        <nav className="flex items-center gap-2">
          <NavLink className={navClass} to="/">Calculateur</NavLink>
          <NavLink className={navClass} to="/materials">Matériaux</NavLink>
          <ThemeToggle />
        </nav>

        <NavLink className={navClass} to="/pv">PV / Constitution</NavLink>
      </header>

      <Routes>
        <Route path="/" element={<Calculator />} />
        <Route path="/materials" element={<MaterialsPage />} />
        <Route path="/pv" element={<PVPage />} />
      </Routes>
    </div>
  );
}
