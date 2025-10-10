import { Routes, Route, Link, NavLink } from "react-router-dom";
import Calculator from "./components/Calculator";
import MaterialsPage from "./pages/MaterialsPage";


export default function App() {
  const navClass = ({isActive}:{isActive:boolean}) =>
    "px-3 py-2 rounded" + (isActive ? " bg-slate-900 text-white" : " hover:bg-slate-200");

  return (
    <div className="max-w-5xl mx-auto p-4">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold"><Link to="/">Système PA</Link></h1>
        <nav className="flex gap-2 text-sm">
          <NavLink className={navClass} to="/">Calculateur</NavLink>
          <NavLink className={navClass} to="/materials">Matériaux</NavLink>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<Calculator/>} />
        <Route path="/materials" element={<MaterialsPage/>} />
      </Routes>
    </div>
  );
}
