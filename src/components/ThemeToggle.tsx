import { cls } from "../ui/styles";

export default function ThemeToggle(){
  return (
    <button className={cls.btnGhost} onClick={()=>{
      document.documentElement.classList.toggle('dark');
    }} aria-label="Basculer thème">
      🌓 Thème
    </button>
  );
}
