import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { AnamnesisCheckboxGroup } from './AnamnesisCheckboxGroup';
import {
  SGI_OPTIONS, SGU_OPTIONS, SCR_OPTIONS, SN_OPTIONS,
  SME_OPTIONS, SOT_OPTIONS, ALIMENTACAO_OPTIONS, VACINACAO_OPTIONS,
  AMBIENTE_OPTIONS, COMPORTAMENTO_OPTIONS,
} from '@/data/anamnesisOptions';
import { FileText, Save } from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface AnamnesisFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentRequestId: string;
  petId: string;
  onSaved: () => void;
}

const INITIAL_STATE = {
  cor: '',
  sexo: '',
  nascimento: '',
  queixa_principal: '',
  medicamentos: '',
  sgi: [] as string[],
  sgu: [] as string[],
  sgu_ultimo_cio: '',
  scr: [] as string[],
  sn: [] as string[],
  sme: [] as string[],
  sot: [] as string[],
  sot_obs: '',
  alimentacao: [] as string[],
  ectoparasitas_puliciose: '',
  ectoparasitas_ixiodiose: '',
  ectoparasiticida: false,
  vacinacao: [] as string[],
  vermifugo: '',
  ambiente: [] as string[],
  contactantes: '',
  contactantes_sintomaticos: false,
  contactantes_assintomaticos: false,
  banho_local: '',
  banho_frequencia: '',
  acesso_rua: '',
  acesso_rua_modo: '',
  acesso_rua_frequencia: '',
  acesso_plantas: '',
  acesso_roedores: '',
  comportamento: [] as string[],
};

export function AnamnesisFormDialog({
  open, onOpenChange, appointmentRequestId, petId, onSaved,
}: AnamnesisFormDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(INITIAL_STATE);

  const set = <K extends keyof typeof INITIAL_STATE>(key: K, value: typeof INITIAL_STATE[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { error } = await supabase.from('anamnesis').insert({
        appointment_request_id: appointmentRequestId,
        pet_id: petId,
        user_id: user.id,
        cor: form.cor || null,
        sexo: form.sexo || null,
        nascimento: form.nascimento || null,
        queixa_principal: form.queixa_principal || null,
        medicamentos: form.medicamentos || null,
        sistema_gastrintestinal: form.sgi,
        sistema_genitourinario: form.sgu,
        sistema_genitourinario_extras: { ultimo_cio: form.sgu_ultimo_cio },
        "sistema_cardiorespiratório": form.scr,
        sistema_neurologico: form.sn,
        sistema_musculoesqueletico: form.sme,
        sistema_ototegumentar: form.sot,
        sistema_ototegumentar_obs: form.sot_obs || null,
        alimentacao: form.alimentacao,
        ectoparasitas: {
          puliciose: form.ectoparasitas_puliciose,
          ixiodiose: form.ectoparasitas_ixiodiose,
          ectoparasiticida: form.ectoparasiticida,
        },
        vacinacao: form.vacinacao,
        vermifugo: form.vermifugo || null,
        ambiente: form.ambiente,
        contactantes: {
          tem: form.contactantes,
          sintomaticos: form.contactantes_sintomaticos,
          assintomaticos: form.contactantes_assintomaticos,
        },
        banho: { local: form.banho_local, frequencia: form.banho_frequencia },
        acesso_rua: {
          acesso: form.acesso_rua,
          modo: form.acesso_rua_modo,
          frequencia: form.acesso_rua_frequencia,
        },
        acesso_plantas: form.acesso_plantas || null,
        acesso_roedores: form.acesso_roedores || null,
        comportamento: form.comportamento,
      });

      if (error) throw error;

      toast({ title: 'Ficha salva!', description: 'Anamnese registrada com sucesso.' });
      setForm(INITIAL_STATE);
      onSaved();
      onOpenChange(false);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Ocorreu um erro inesperado';
      toast({ title: 'Erro ao salvar', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <FileText size={20} />
            Ficha de Anamnese
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Identificação extra */}
            <section className="space-y-3">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Identificação</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Cor</Label>
                  <Input value={form.cor} onChange={(e) => set('cor', e.target.value)} placeholder="Ex: caramelo" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Sexo</Label>
                  <Select value={form.sexo} onValueChange={(v) => set('sexo', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="femea">Fêmea</SelectItem>
                      <SelectItem value="macho">Macho</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Nascimento</Label>
                  <Input type="date" value={form.nascimento} onChange={(e) => set('nascimento', e.target.value)} />
                </div>
              </div>
            </section>

            <Separator />

            {/* Queixa e medicamentos */}
            <section className="space-y-3">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Queixa Principal</h3>
              <Textarea value={form.queixa_principal} onChange={(e) => set('queixa_principal', e.target.value)} placeholder="Descreva a queixa principal..." rows={2} />
              <div className="space-y-1">
                <Label className="text-xs">Medicamentos em uso</Label>
                <Textarea value={form.medicamentos} onChange={(e) => set('medicamentos', e.target.value)} placeholder="Liste os medicamentos..." rows={2} />
              </div>
            </section>

            <Separator />

            {/* Sistemas */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Anamnese por Sistemas</h3>
              <AnamnesisCheckboxGroup title="Sistema Gastrintestinal (SGI)" options={SGI_OPTIONS} selected={form.sgi} onChange={(v) => set('sgi', v)} />
              <Separator className="my-2" />
              <AnamnesisCheckboxGroup title="Sistema Genitourinário (SGU)" options={SGU_OPTIONS} selected={form.sgu} onChange={(v) => set('sgu', v)} />
              <div className="space-y-1 pl-2">
                <Label className="text-xs">Último cio</Label>
                <Input value={form.sgu_ultimo_cio} onChange={(e) => set('sgu_ultimo_cio', e.target.value)} placeholder="Data ou período" className="max-w-xs" />
              </div>
              <Separator className="my-2" />
              <AnamnesisCheckboxGroup title="Sistema Cardiorrespiratório (SCR)" options={SCR_OPTIONS} selected={form.scr} onChange={(v) => set('scr', v)} />
              <Separator className="my-2" />
              <AnamnesisCheckboxGroup title="Sistema Neurológico (SN)" options={SN_OPTIONS} selected={form.sn} onChange={(v) => set('sn', v)} />
              <Separator className="my-2" />
              <AnamnesisCheckboxGroup title="Sistema Musculoesquelético (SME)" options={SME_OPTIONS} selected={form.sme} onChange={(v) => set('sme', v)} />
              <Separator className="my-2" />
              <AnamnesisCheckboxGroup title="Sistema Oto-tegumentar (SOT)" options={SOT_OPTIONS} selected={form.sot} onChange={(v) => set('sot', v)} />
              <div className="space-y-1 pl-2">
                <Label className="text-xs">Observações SOT</Label>
                <Input value={form.sot_obs} onChange={(e) => set('sot_obs', e.target.value)} placeholder="Observações..." />
              </div>
            </section>

            <Separator />

            {/* Manejo */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Manejo</h3>
              <AnamnesisCheckboxGroup title="Alimentação" options={ALIMENTACAO_OPTIONS} selected={form.alimentacao} onChange={(v) => set('alimentacao', v)} />

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Ectoparasitas</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Puliciose</Label>
                    <Select value={form.ectoparasitas_puliciose} onValueChange={(v) => set('ectoparasitas_puliciose', v)}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="tem">Tem</SelectItem>
                        <SelectItem value="ja_teve">Já teve</SelectItem>
                        <SelectItem value="nao">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Ixiodiose</Label>
                    <Select value={form.ectoparasitas_ixiodiose} onValueChange={(v) => set('ectoparasitas_ixiodiose', v)}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="tem">Tem</SelectItem>
                        <SelectItem value="ja_teve">Já teve</SelectItem>
                        <SelectItem value="nao">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <AnamnesisCheckboxGroup title="Vacinação" options={VACINACAO_OPTIONS} selected={form.vacinacao} onChange={(v) => set('vacinacao', v)} />

              <div className="space-y-1">
                <Label className="text-xs">Vermífugo</Label>
                <Select value={form.vermifugo} onValueChange={(v) => set('vermifugo', v)}>
                  <SelectTrigger className="max-w-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="atualizado">Atualizado</SelectItem>
                    <SelectItem value="desatualizado">Desatualizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <AnamnesisCheckboxGroup title="Ambiente" options={AMBIENTE_OPTIONS} selected={form.ambiente} onChange={(v) => set('ambiente', v)} />

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Contactantes</Label>
                  <Select value={form.contactantes} onValueChange={(v) => set('contactantes', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="sim">Sim</SelectItem>
                      <SelectItem value="nao">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Banho</Label>
                  <Select value={form.banho_local} onValueChange={(v) => set('banho_local', v)}>
                    <SelectTrigger><SelectValue placeholder="Local" /></SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="casa">Casa</SelectItem>
                      <SelectItem value="pet_shop">Pet Shop</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Frequência do banho</Label>
                  <Select value={form.banho_frequencia} onValueChange={(v) => set('banho_frequencia', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="semanal">Semanal</SelectItem>
                      <SelectItem value="quinzenal">Quinzenal</SelectItem>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="as_vezes">Às vezes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Acesso à rua</Label>
                  <Select value={form.acesso_rua} onValueChange={(v) => set('acesso_rua', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="sim">Sim</SelectItem>
                      <SelectItem value="nao">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Acesso a plantas</Label>
                  <Select value={form.acesso_plantas} onValueChange={(v) => set('acesso_plantas', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="sim">Sim</SelectItem>
                      <SelectItem value="nao">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Acesso a roedores</Label>
                  <Select value={form.acesso_roedores} onValueChange={(v) => set('acesso_roedores', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="sim">Sim</SelectItem>
                      <SelectItem value="nao">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <AnamnesisCheckboxGroup title="Comportamento" options={COMPORTAMENTO_OPTIONS} selected={form.comportamento} onChange={(v) => set('comportamento', v)} />
            </section>

            <Separator />

            <div className="flex justify-end gap-3 pt-2 pb-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="gradient-primary text-primary-foreground" disabled={loading}>
                {loading ? 'Salvando...' : (
                  <>
                    <Save size={16} className="mr-2" />
                    Salvar Ficha
                  </>
                )}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
