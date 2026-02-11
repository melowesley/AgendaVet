import { AnamnesisCheckboxGroup } from '@/components/client/AnamnesisCheckboxGroup';
import { AnamnesisData } from '../anamnesisTypes';
import {
  ALIMENTACAO_OPTIONS, VACINACAO_OPTIONS, AMBIENTE_OPTIONS, COMPORTAMENTO_OPTIONS,
} from '@/data/anamnesisOptions';

interface ManejoTabProps {
  anamnesis: AnamnesisData;
  onChange: (field: keyof AnamnesisData, value: AnamnesisData[keyof AnamnesisData]) => void;
}

export const ManejoTab = ({ anamnesis, onChange }: ManejoTabProps) => (
  <div className="space-y-4">
    <AnamnesisCheckboxGroup
      title="Alimentação"
      options={ALIMENTACAO_OPTIONS}
      selected={anamnesis.alimentacao}
      onChange={(v) => onChange('alimentacao', v)}
    />
    <AnamnesisCheckboxGroup
      title="Vacinação"
      options={VACINACAO_OPTIONS}
      selected={anamnesis.vacinacao}
      onChange={(v) => onChange('vacinacao', v)}
    />
    <AnamnesisCheckboxGroup
      title="Ambiente"
      options={AMBIENTE_OPTIONS}
      selected={anamnesis.ambiente}
      onChange={(v) => onChange('ambiente', v)}
    />
    <AnamnesisCheckboxGroup
      title="Comportamento"
      options={COMPORTAMENTO_OPTIONS}
      selected={anamnesis.comportamento}
      onChange={(v) => onChange('comportamento', v)}
    />
  </div>
);
