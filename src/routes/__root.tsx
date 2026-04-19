import { Outlet, Link, createRootRoute, HeadContent, Scripts, useLocation, useNavigate } from "@tanstack/react-router";
import { AppSidebar, SidebarContent } from "@/components/AppSidebar";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import logo from "@/assets/alpha-logo.png";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você está procurando não existe.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AlphaMens Premium — Dashboard" },
      { name: "description", content: "Painel de leads, atendimentos e agendamentos da AlphaMens Premium." },
      { property: "og:title", content: "AlphaMens Premium — Dashboard" },
      { name: "twitter:title", content: "AlphaMens Premium — Dashboard" },
      { property: "og:description", content: "Painel de leads, atendimentos e agendamentos da AlphaMens Premium." },
      { name: "twitter:description", content: "Painel de leads, atendimentos e agendamentos da AlphaMens Premium." },
      { name: "twitter:card", content: "summary" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user && location.pathname !== "/login") {
      navigate({ to: "/login" });
    }
  }, [user, loading, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Se estiver na página de login, não renderiza a sidebar/layout padrão
  if (location.pathname === "/login") {
    return <>{children}</>;
  }

  // Se não estiver logado e não estiver no login, não renderiza nada enquanto o useEffect faz o redirect
  if (!user) return null;

  return (
    <div className="flex min-h-screen w-full bg-background flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="flex md:hidden items-center justify-between px-4 py-3 bg-sidebar/95 backdrop-blur-md border-b border-sidebar-border sticky top-0 z-[100]">
        <div className="flex items-center gap-2">
          <img src={logo} alt="AlphaMens" className="h-8 w-8 rounded-full" />
          <span className="font-display text-lg tracking-tight">ALPHA MEN'S</span>
        </div>
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <button className="p-2 text-foreground/70 hover:text-primary transition-colors focus:outline-none">
              <Menu size={24} />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 bg-sidebar border-sidebar-border w-72 overflow-y-auto h-[100dvh] max-h-[100dvh]">
            <div className="sr-only">Menu de Navegação</div>
            <SidebarContent hideHeader onItemClick={() => setIsMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>
      </header>

      <AppSidebar />
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}

function RootComponent() {
  return (
    <AuthGuard>
      <Outlet />
    </AuthGuard>
  );
}
