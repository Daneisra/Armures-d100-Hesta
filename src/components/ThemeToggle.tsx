import { useEffect, useState } from "react";
import { cls } from "../ui/styles";

type ThemeMode = "auto" | "light" | "dark";
const STORAGE_KEY = "theme-mode";

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolved = mode === "auto" ? (prefersDark ? "dark" : "light") : mode;
  root.dataset.theme = resolved === "dark" ? "dark" : "";
  root.classList.toggle("dark", resolved === "dark");
}

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("auto");

  useEffect(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as ThemeMode) || "auto";
    setMode(saved);
    applyTheme(saved);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => saved === "auto" && applyTheme("auto");
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);

  const cycle = () => {
    const next = mode === "auto" ? "light" : mode === "light" ? "dark" : "auto";
    setMode(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  };

  const label = mode === "auto" ? "🌓 Thème : auto" : mode === "light" ? "🌓 Thème : clair" : "🌓 Thème : sombre";

  return (
    <button className={cls.btnGhost} onClick={cycle} aria-label="Basculer thème">
      {label}
    </button>
  );
}
