import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  active: boolean;
}

export const ServicesManager = () => {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Service>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    price: '',
    duration_minutes: '30',
    active: true
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('name');

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os serviços.",
        variant: "destructive"
      });
    } else {
      setServices(data || []);
    }
    setLoading(false);
  };

  const handleEdit = (service: Service) => {
    setEditingId(service.id);
    setEditData({
      name: service.name,
      price: service.price,
      duration_minutes: service.duration_minutes,
      active: service.active
    });
  };

  const handleSave = async (id: string) => {
    const { error } = await supabase
      .from('services')
      .update(editData)
      .eq('id', id);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o serviço.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Serviço atualizado com sucesso."
      });
      setEditingId(null);
      fetchServices();
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('services')
      .update({ active: false })
      .eq('id', id);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível desativar o serviço.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Serviço desativado com sucesso."
      });
      fetchServices();
    }
  };

  const handleAddService = async () => {
    if (!newService.name || !newService.price) {
      toast({
        title: "Erro",
        description: "Nome e preço são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const { error } = await supabase
      .from('services')
      .insert({
        name: newService.name,
        description: newService.description || null,
        price: parseFloat(newService.price),
        duration_minutes: parseInt(newService.duration_minutes),
        active: newService.active
      });

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar o serviço.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Serviço criado com sucesso."
      });
      setDialogOpen(false);
      setNewService({
        name: '',
        description: '',
        price: '',
        duration_minutes: '30',
        active: true
      });
      fetchServices();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Serviço
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Preço (R$)</TableHead>
              <TableHead>Duração (min)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service) => (
              <TableRow key={service.id}>
                <TableCell>
                  {editingId === service.id ? (
                    <Input
                      value={editData.name || ''}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="w-40"
                    />
                  ) : (
                    <div>
                      <p className="font-medium">{service.name}</p>
                      {service.description && (
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {editingId === service.id ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={editData.price || ''}
                      onChange={(e) => setEditData({ ...editData, price: parseFloat(e.target.value) })}
                      className="w-24"
                    />
                  ) : (
                    `R$ ${service.price.toFixed(2)}`
                  )}
                </TableCell>
                <TableCell>
                  {editingId === service.id ? (
                    <Input
                      type="number"
                      value={editData.duration_minutes || ''}
                      onChange={(e) => setEditData({ ...editData, duration_minutes: parseInt(e.target.value) })}
                      className="w-20"
                    />
                  ) : (
                    `${service.duration_minutes} min`
                  )}
                </TableCell>
                <TableCell>
                  {editingId === service.id ? (
                    <Switch
                      checked={editData.active}
                      onCheckedChange={(checked) => setEditData({ ...editData, active: checked })}
                    />
                  ) : (
                    <Badge variant={service.active ? "default" : "secondary"}>
                      {service.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {editingId === service.id ? (
                      <>
                        <Button size="sm" variant="default" onClick={() => handleSave(service.id)}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancel}>
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(service)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {service.active && (
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(service.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Serviço</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Serviço*</Label>
              <Input
                value={newService.name}
                onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                placeholder="Ex: Consulta Geral"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={newService.description}
                onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                placeholder="Descrição do serviço..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preço (R$)*</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newService.price}
                  onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                  placeholder="150.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Duração (minutos)</Label>
                <Input
                  type="number"
                  value={newService.duration_minutes}
                  onChange={(e) => setNewService({ ...newService, duration_minutes: e.target.value })}
                  placeholder="30"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={newService.active}
                onCheckedChange={(checked) => setNewService({ ...newService, active: checked })}
              />
              <Label>Serviço ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddService}>Criar Serviço</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
