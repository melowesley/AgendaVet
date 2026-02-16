import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AnamnesisCheckboxGroup } from '@/components/client/AnamnesisCheckboxGroup';
import { AnamnesisData } from '../anamnesisTypes';
import {
  SGI_OPTIONS, SGU_OPTIONS, SCR_OPTIONS, SN_OPTIONS, SME_OPTIONS, SOT_OPTIONS,
} from '@/data/anamnesisOptions';

interface AnamneseTabProps {
  anamnesis: AnamnesisData;
  onChange: (field: keyof AnamnesisData, value: AnamnesisData[keyof AnamnesisData]) => void;
}

export const AnamneseTab = ({ anamnesis, onChange }: AnamneseTabProps) => (
  <div className="space-y-4">
    <div className="space-y-1">
      <Label className="text-xs font-semibold">Queixa Principal</Label>
      <Textarea
        value={anamnesis.queixa_principal}
        onChange={(e) => onChange('queixa_principal', e.target.value)}
        rows={2}
        placeholder="Descreva a queixa principal..."
        spellCheck={true}
        lang="pt-BR"
      />
    </div>

    <div className="space-y-1">
      <Label className="text-xs font-semibold">Medicamentos em uso</Label>
      <Textarea
        value={anamnesis.medicamentos}
        onChange={(e) => onChange('medicamentos', e.target.value)}
        rows={2}
        placeholder="Medicamentos atuais..."
        spellCheck={true}
        lang="pt-BR"
      />
    </div>

    <AnamnesisCheckboxGroup
      title="Sistema Gastrintestinal (SGI)"
      options={SGI_OPTIONS}
      selected={anamnesis.sistema_gastrintestinal}
      onChange={(v) => onChange('sistema_gastrintestinal', v)}
    />
    <AnamnesisCheckboxGroup
      title="Sistema Genitourinário (SGU)"
      options={SGU_OPTIONS}
      selected={anamnesis.sistema_genitourinario}
      onChange={(v) => onChange('sistema_genitourinario', v)}
    />
    <AnamnesisCheckboxGroup
      title="Sistema Cardiorrespiratório (SCR)"
      options={SCR_OPTIONS}
      selected={anamnesis['sistema_cardiorespiratório']}
      onChange={(v) => onChange('sistema_cardiorespiratório', v)}
    />
    <AnamnesisCheckboxGroup
      title="Sistema Neurológico (SN)"
      options={SN_OPTIONS}
      selected={anamnesis.sistema_neurologico}
      onChange={(v) => onChange('sistema_neurologico', v)}
    />
    <AnamnesisCheckboxGroup
      title="Sistema Musculoesquelético (SME)"
      options={SME_OPTIONS}
      selected={anamnesis.sistema_musculoesqueletico}
      onChange={(v) => onChange('sistema_musculoesqueletico', v)}
    />
    <AnamnesisCheckboxGroup
      title="Sistema Oto-tegumentar (SOT)"
      options={SOT_OPTIONS}
      selected={anamnesis.sistema_ototegumentar}
      onChange={(v) => onChange('sistema_ototegumentar', v)}
    />

    <div className="space-y-1">
      <Label className="text-xs font-semibold">Obs. SOT</Label>
      <Textarea
        value={anamnesis.sistema_ototegumentar_obs}
        onChange={(e) => onChange('sistema_ototegumentar_obs', e.target.value)}
        rows={2}
        placeholder="Observações do sistema oto-tegumentar..."
        spellCheck={true}
        lang="pt-BR"
      />
    </div>
  </div>
);
