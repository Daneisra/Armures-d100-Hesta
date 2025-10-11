export default function Tooltip({label, children}:{label:string, children:React.ReactNode}){
  return (
    <span className="relative group">
      {children}
      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 mt-1
                       hidden group-hover:block text-xs px-2 py-1 rounded
                       bg-black/80 text-white whitespace-nowrap">
        {label}
      </span>
    </span>
  );
}
