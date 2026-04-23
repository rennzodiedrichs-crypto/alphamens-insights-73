import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { 
  fetchTodosServicos, 
  createServico, 
  updateServico, 
  deleteServico, 
  Servico 
} from "@/lib/servicos";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scissors, Plus, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import { formatBRL } from "@/lib/format";

export const Route = createFileRoute("/servicos")({
  component: ServicosPage,
});

function ServicosPage() {
  const { role } = useAuth();
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);

  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [duracao, setDuracao] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchTodosServicos();
      setServicos(data);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar serviços");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === "admin") {
      loadData();
    }
  }, [role]);

  if (role !== "admin") {
    return (
      <div className="flex h-screen items-center justify-center">
        <h1 className="text-xl text-destructive font-bold">Acesso Restrito a Administradores</h1>
      </div>
    );
  }

  const handleOpenModal = (servico?: Servico) => {
    if (servico) {
      setEditingId(servico.id);
      setNome(servico.nome);
      setDescricao(servico.descricao || "");
      setPreco(servico.preco_base.toString());
      setDuracao(servico.duracao_estimada_minutos.toString());
    } else {
      setEditingId(null);
      setNome("");
      setDescricao("");
      setPreco("");
      setDuracao("");
    }
    setOpenModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const input = {
        nome,
        descricao: descricao || null,
        preco_base: parseFloat(preco),
        duracao_estimada_minutos: parseInt(duracao, 10)
      };

      if (editingId) {
        await updateServico(editingId, input);
        toast.success("Serviço atualizado com sucesso!");
      } else {
        await createServico(input);
        toast.success("Serviço cadastrado com sucesso!");
      }
      setOpenModal(false);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar serviço. Verifique os dados.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este serviço?")) {
      try {
        await deleteServico(id);
        toast.success("Serviço excluído");
        loadData();
      } catch (err: any) {
        if (err.code === "23503") {
          toast.error("Não é possível excluir: existem agendamentos vinculados a este serviço.");
        } else {
          toast.error("Erro ao excluir serviço");
        }
      }
    }
  };

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-display font-bold tracking-tight flex items-center gap-2">
          <Scissors className="h-8 w-8 text-primary" />
          Catálogo de Serviços
        </h2>
      </div>

      <Card className="bg-sidebar-accent/5 border-primary/10">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-display">Gerenciar Serviços</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Adicione ou edite os serviços que podem ser agendados.
            </p>
          </div>
          <Dialog open={openModal} onOpenChange={setOpenModal}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 shadow-glow" onClick={() => handleOpenModal()}>
                <Plus className="h-4 w-4" /> Novo Serviço
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-sidebar border-sidebar-border text-sidebar-foreground">
              <DialogHeader>
                <DialogTitle className="font-display">
                  {editingId ? "Editar Serviço" : "Cadastrar Novo Serviço"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nome">Nome do Serviço *</Label>
                  <Input 
                    id="nome" 
                    required 
                    value={nome} 
                    onChange={e => setNome(e.target.value)}
                    className="bg-background border-sidebar-border"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="preco">Preço (R$) *</Label>
                    <Input 
                      id="preco" 
                      type="number" 
                      step="0.01" 
                      required 
                      value={preco} 
                      onChange={e => setPreco(e.target.value)}
                      className="bg-background border-sidebar-border"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="duracao">Duração (min) *</Label>
                    <Input 
                      id="duracao" 
                      type="number" 
                      required 
                      value={duracao} 
                      onChange={e => setDuracao(e.target.value)}
                      className="bg-background border-sidebar-border"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="descricao">Descrição Breve</Label>
                  <Input 
                    id="descricao" 
                    value={descricao} 
                    onChange={e => setDescricao(e.target.value)}
                    className="bg-background border-sidebar-border"
                  />
                </div>
                <Button type="submit" className="w-full mt-2">Salvar Serviço</Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando serviços...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-sidebar-border hover:bg-transparent">
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Duração</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-right w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {servicos.map((servico) => (
                  <TableRow key={servico.id} className="border-sidebar-border hover:bg-sidebar-accent/30">
                    <TableCell className="font-medium font-display">{servico.nome}</TableCell>
                    <TableCell className="text-muted-foreground text-sm truncate max-w-[300px]">
                      {servico.descricao || "-"}
                    </TableCell>
                    <TableCell className="text-right">{servico.duracao_estimada_minutos} min</TableCell>
                    <TableCell className="text-right text-primary font-bold">
                      {formatBRL(servico.preco_base)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:bg-sidebar-accent hover:text-primary transition-colors"
                          onClick={() => handleOpenModal(servico)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:bg-destructive/10 text-destructive/70 hover:text-destructive transition-colors"
                          onClick={() => handleDelete(servico.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {servicos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground italic">
                      Nenhum serviço cadastrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
