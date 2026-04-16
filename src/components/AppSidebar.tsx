import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Users, Scissors } from "lucide-react";
import logo from "@/assets/alpha-logo.png";

const BARBERS = [
  "Adriano",
  "Gustavo",
  "Gabriel Oliveira",
  "Gabriel Santos",
  "Arthur Fontes",
];

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-");

export function AppSidebar() {
  const { location } = useRouterState();
  const path = location.pathname;

  const navItem = (to: string, active: boolean, icon: React.ReactNode, label: string) => (
    <Link
      key={to}
      to={to}
      className={[
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
        active
          ? "bg-primary/15 text-primary border border-primary/30"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
      ].join(" ")}
    >
      <span className={active ? "text-primary" : "text-sidebar-foreground/60"}>{icon}</span>
      <span className="font-medium tracking-wide">{label}</span>
    </Link>
  );

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar border-r border-sidebar-border h-screen sticky top-0">
      <div className="px-5 py-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img src={logo} alt="AlphaMens Premium" className="h-12 w-12 rounded-full ring-2 ring-primary/40" />
          <div>
            <div className="font-display text-lg leading-none text-foreground">ALPHA MEN'S</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-primary mt-1">Premium Quality</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-2 pb-2 text-[10px] uppercase tracking-widest text-sidebar-foreground/40">
          Geral
        </div>
        {navItem("/", path === "/", <Home size={18} />, "Página Inicial")}
        {navItem("/leads", path === "/leads", <Users size={18} />, "Lista de Leads")}

        <div className="px-2 pt-5 pb-2 text-[10px] uppercase tracking-widest text-sidebar-foreground/40">
          Agendas
        </div>
        {BARBERS.map((b) => {
          const to = `/agenda/${slugify(b)}`;
          return navItem(to, path === to, <Scissors size={16} />, b);
        })}
      </nav>

      <div className="px-5 py-4 border-t border-sidebar-border text-[11px] text-sidebar-foreground/40">
        © AlphaMens Premium
      </div>
    </aside>
  );
}

export const BARBER_LIST = BARBERS;
export const barberSlug = slugify;
