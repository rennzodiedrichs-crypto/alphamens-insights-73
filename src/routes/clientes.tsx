import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { 
  Users, 
  Search, 
  Plus, 
  Pencil, 
  Trash2, 
  Phone, 
  UserPlus,
  X,
  Check
} from "lucide-react";
import { fetchClientes, createCliente, updateCliente, deleteCliente, type Cliente } from "@/lib/clientes";
import { formatPhone } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/clientes")({
  head: () => ({
    meta: [
      { title: "Gestão de Clientes — AlphaMens Premium" },
      { name: "description", content: "Gerencie sua base de clientes AlphaMens." },
    ],
  }),
  component: ClientesPage,
});

function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState<Partial<Cliente>>({ nome: "", whatsapp: "" });

  const loadClientes = async (search?: string) => {
    setLoading(true);
    try {
      const data = await fetchClientes(search);
      setClientes(data);
    } catch (error) {
      toast.error("Erro ao carregar clientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientes(searchTerm);
  }, [searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedCliente && !isFormOpen) return; // Proteção

      if (selectedCliente?.id) {
        await updateCliente(selectedCliente.id, formData);
        toast.success("Cliente atualizado com sucesso");
      } else {
        await createCliente(formData);
        toast.success("Cliente cadastrado com sucesso");
      }
      setIsFormOpen(false);
      setSelectedCliente(null);
      setFormData({ nome: "", whatsapp: "" });
      loadClientes(searchTerm);
    } catch (error: any) {
      if (error.message === "TELEFONE_DUPLICADO") {
        toast.error("O telefone informado já se encontra cadastrado para outro cliente no banco de dados.");
      } else {
        toast.error("Erro ao salvar cliente");
      }
    }
  };

  const handleDelete = async () => {
    if (!selectedCliente) return;
    try {
      await deleteCliente(selectedCliente.id);
      toast.success("Cliente excluído");
      setIsDeleting(false);
      setSelectedCliente(null);
      loadClientes(searchTerm);
    } catch (error: any) {
      // Verifica se o erro é de restrição de chave estrangeira
      if (error.code === "23503") {
        toast.error("Não é possível excluir: este cliente possui agendamentos vinculados. Cancele os agendamentos primeiro.");
      } else {
        toast.error("Erro ao excluir cliente");
      }
    }
  };

  const openEdit = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setFormData({ nome: cliente.nome, whatsapp: cliente.whatsapp });
    setIsFormOpen(true);
  };

  return (
    <div className="px-6 py-8 md:px-10 md:py-10 max-w-[1600px] mx-auto min-h-screen">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4 animate-reveal">
        <div>
          <div className="text-[10px] uppercase tracking-[0.4em] text-primary mb-3 font-bold opacity-80 flex items-center gap-2">
            <Users size={12} /> CRM
          </div>
          <h1 className="font-display text-5xl md:text-6xl text-foreground tracking-tight leading-none">Gestão de Clientes</h1>
          <p className="text-muted-foreground mt-3 text-base max-w-lg leading-relaxed">
            Controle total sobre o cadastro e histórico de seus clientes.
          </p>
        </div>
        <Button 
          onClick={() => {
            setSelectedCliente(null);
            setFormData({ nome: "", whatsapp: "" });
            setIsFormOpen(true);
          }}
          className="gap-2 h-12 px-6 rounded-xl shadow-glow transition-all hover:scale-105 active:scale-95"
        >
          <UserPlus size={18} /> Cadastrar Cliente
        </Button>
      </header>

      <div className="mb-8 relative max-w-md animate-reveal [animation-delay:100ms]">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <Input 
          placeholder="Buscar por nome ou whatsapp..." 
          className="pl-12 h-12 bg-card/20 border-border/40 backdrop-blur-sm rounded-xl focus:ring-primary/20"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl border border-border/40 bg-card/10 animate-pulse" />
          ))
        ) : clientes.length === 0 ? (
          <div className="col-span-full py-20 text-center">
            <p className="text-muted-foreground">Nenhum cliente encontrado.</p>
          </div>
        ) : (
          clientes.map((cliente, index) => (
            <div 
              key={cliente.id}
              className="glass-panel p-6 rounded-2xl shadow-card hover-lift animate-reveal group relative"
              style={{ animationDelay: `${150 + index * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                    <Users size={20} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl text-foreground leading-tight tracking-tight">
                      {cliente.nome}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Phone size={10} />
                      {formatPhone(cliente.whatsapp)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                  onClick={() => openEdit(cliente)}
                >
                  <Pencil size={14} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    setSelectedCliente(cliente);
                    setIsDeleting(true);
                  }}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Cadastro/Edição */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              {selectedCliente ? "Editar Cliente" : "Novo Cliente"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <Input 
                id="nome" 
                required 
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                placeholder="Ex: João Silva"
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input 
                id="whatsapp" 
                required 
                value={formData.whatsapp || ""}
                onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                placeholder="Ex: 5511999999999"
                className="bg-background/50"
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="gap-2 shadow-glow">
                <Check size={16} /> {selectedCliente ? "Salvar Alterações" : "Cadastrar Cliente"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Exclusão */}
      <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
        <DialogContent className="sm:max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-destructive flex items-center gap-2">
              <Trash2 size={20} /> Excluir Cliente
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tem certeza que deseja excluir o cliente <strong className="text-foreground">{selectedCliente?.nome}</strong>?
              Esta ação não poderá ser desfeita.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsDeleting(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
