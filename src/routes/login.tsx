import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, Lock, Mail, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success("Bem-vindo de volta!");
      navigate({ to: "/" });
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="legacy-font-section min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden font-sans">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse [animation-delay:2s]" />

      <div className="w-full max-w-[420px] p-4 relative z-10 animate-reveal">
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-4 border border-primary/30 shadow-glow">
            <Lock className="text-primary" size={32} />
          </div>
          <h1 className="font-display text-4xl tracking-tighter text-foreground uppercase">
            AlphaMens <span className="text-primary">Premium</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1 uppercase tracking-[0.2em] font-medium opacity-60">
            Acesso Restrito
          </p>
        </div>

        <Card className="glass-panel border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-display tracking-tight flex items-center gap-2">
              Login <Sparkles size={18} className="text-primary" />
            </CardTitle>
            <CardDescription className="text-muted-foreground/80">
              Digite suas credenciais para acessar o dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={18} />
                  <Input
                    type="email"
                    placeholder="E-mail profissional"
                    className="pl-10 bg-background/40 border-border/40 focus:border-primary/50 transition-all h-12"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={18} />
                  <Input
                    type="password"
                    placeholder="Sua senha"
                    className="pl-10 bg-background/40 border-border/40 focus:border-primary/50 transition-all h-12"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest text-xs transition-all shadow-glow hover:shadow-glow-lg group"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    Entrar <LogIn className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center mt-8 text-[10px] text-muted-foreground/40 uppercase tracking-[0.3em] font-bold">
          &copy; 2026 AlphaMens Insights • Sistema Protegido
        </p>
      </div>
    </div>
  );
}
