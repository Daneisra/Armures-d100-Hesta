export default function ThemeToggle(){
  return (
    <button className="btn" onClick={()=>{
      document.documentElement.classList.toggle('dark');
    }} aria-label="Basculer thème">
      🌓 Thème
    </button>
  );
}
