import { cls } from "../ui/styles";

export default function ThemeToggle() {
  const toggle = () => {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "" : "dark";
    root.dataset.theme = next;
    root.classList.toggle("dark", next === "dark");
  };

  return (
    <button className={cls.btnGhost} onClick={toggle} aria-label="Basculer thème">
      🌓 Thème
    </button>
  );
}
