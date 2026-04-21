import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Home, Users, Scissors, LogOut, BarChart } from "lucide-react";
import logo from "@/assets/alpha-logo.png";
import { useAuth } from "@/hooks/useAuth";

const BARBERS = [
  "Adriano",
  "Gustavo",
  "Gabriel Oliveira",
  "Gabriel Santos",
  "Arthur Fontes",
];

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-");

type SidebarContentProps = {
  onItemClick?: () => void;
  hideHeader?: boolean;
};

export function SidebarContent({ onItemClick, hideHeader = false }: SidebarContentProps) {
  const { location } = useRouterState();
  const path = location.pathname;
  const { signOut, role, barberName } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
    onItemClick?.();
  };

  const navItem = (to: string, active: boolean, icon: React.ReactNode, label: string) => (
    <Link
      key={to}
      to={to}
      onClick={onItemClick}
      className={[
        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-300",
        active
          ? "bg-primary/10 text-primary border border-primary/20 shadow-glow"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
      ].join(" ")}
    >
      <span className={[
        "transition-colors duration-300",
        active ? "text-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground"
      ].join(" ")}>
        {icon}
      </span>
      <span className="font-medium tracking-wide">{label}</span>
      {active && (
        <div className="absolute left-0 w-1 h-5 bg-primary rounded-r-full shadow-glow" />
      )}
    </Link>
  );

  const isAdmin = role === "admin";

  return (
    <div className="flex flex-col h-full bg-sidebar/95 backdrop-blur-xl">
      {!hideHeader && (
        <div className="px-6 py-6 border-b border-sidebar-border/50">
          <div className="flex items-center gap-3 group">
            <div className="relative shrink-0">
              <img src={logo} alt="AlphaMens Premium" className="h-10 w-10 rounded-full ring-2 ring-primary/40 group-hover:ring-primary transition-all duration-500" />
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="min-w-0">
              <div className="font-display text-lg leading-none text-foreground tracking-tight truncate">ALPHA MEN'S</div>
              <div className="text-[9px] uppercase tracking-[0.2em] text-primary mt-1 font-semibold opacity-80 truncate">Premium Quality</div>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 custom-scrollbar">
        {isAdmin && (
          <>
            <div className="px-3 pb-3 text-[10px] uppercase tracking-[0.4em] text-sidebar-foreground/30 font-bold">
              Geral
            </div>
            {navItem("/", path === "/", <Home size={18} />, "Página Inicial")}
            {navItem("/leads", path === "/leads", <Users size={18} />, "Lista de Leads")}
            {navItem("/equipe", path === "/equipe", <BarChart size={18} />, "Gestão de Equipe")}
          </>
        )}

        <div className="px-3 pt-6 pb-3 text-[10px] uppercase tracking-[0.4em] text-sidebar-foreground/30 font-bold">
          Agendas
        </div>
        <div className="space-y-1">
          {BARBERS.filter((b) => isAdmin || b === barberName).map((b) => {
            const to = `/agenda/${slugify(b)}`;
            return navItem(to, path === to, <Scissors size={16} />, b);
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-sidebar-border/50 flex flex-col gap-4">
        {role && (
          <div className="px-3 py-2 rounded-lg bg-sidebar-accent/30 border border-sidebar-border/30">
            <div className="text-[9px] uppercase tracking-[0.2em] text-primary font-bold">Usuário Logado</div>
            <div className="text-xs font-medium text-sidebar-foreground truncate mt-0.5">{barberName}</div>
            <div className="text-[9px] text-sidebar-foreground/40 font-bold uppercase tracking-widest mt-0.5">{role}</div>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-destructive/70 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
        >
          <LogOut size={18} />
          Sair do Sistema
        </button>
        <div className="px-2 text-[10px] uppercase tracking-widest text-sidebar-foreground/20 font-medium">
          © 2026 AlphaMens Pro
        </div>
      </div>
    </div>
  );
}

export function AppSidebar() {
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar/95 backdrop-blur-md border-r border-sidebar-border h-screen sticky top-0 z-50">
      <SidebarContent />
    </aside>
  );
}

export const BARBER_LIST = BARBERS;
export const barberSlug = slugify;
