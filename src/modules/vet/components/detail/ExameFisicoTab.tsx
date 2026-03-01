import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AnamnesisCheckboxGroup } from '@/modules/tutor/components/AnamnesisCheckboxGroup';
import { AnamnesisData } from '../anamnesisTypes';
import { MUCOSAS_OPTIONS, LINFONODOS_OPTIONS } from '@/data/anamnesisOptions';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface ExameFisicoTabProps {
  anamnesis: AnamnesisData;
  onChange: (field: keyof AnamnesisData, value: AnamnesisData[keyof AnamnesisData]) => void;
}

export const ExameFisicoTab = ({ anamnesis, onChange }: ExameFisicoTabProps) => (
  <div className="space-y-4">
    <AnamnesisCheckboxGroup
      title="Mucosas"
      options={MUCOSAS_OPTIONS}
      selected={anamnesis.mucosas}
      onChange={(v) => onChange('mucosas', v)}
    />
    <AnamnesisCheckboxGroup
      title="Linfonodos"
      options={LINFONODOS_OPTIONS}
      selected={anamnesis.linfonodos}
      onChange={(v) => onChange('linfonodos', v)}
    />

    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <Label className="text-xs">Hidratação</Label>
        <Select value={anamnesis.hidratacao} onValueChange={(v) => onChange('hidratacao', v)}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent className="bg-popover">
            <SelectItem value="adequada">Adequada</SelectItem>
            <SelectItem value="desidratado">Desidratado</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Pulso</Label>
        <Select value={anamnesis.pulso} onValueChange={(v) => onChange('pulso', v)}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent className="bg-popover">
            <SelectItem value="normosfigmia">Normosfigmia</SelectItem>
            <SelectItem value="filiforme">Filiforme</SelectItem>
            <SelectItem value="forte">Forte</SelectItem>
            <SelectItem value="ausente">Ausente</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <div className="grid grid-cols-4 gap-3">
      {[
        { key: 'temperatura' as const, label: 'Temperatura' },
        { key: 'tpc' as const, label: 'TPC' },
        { key: 'fc' as const, label: 'FC' },
        { key: 'fr' as const, label: 'FR' },
      ].map(({ key, label }) => (
        <div key={key} className="space-y-1">
          <Label className="text-xs">{label}</Label>
          <Input
            value={anamnesis[key]}
            onChange={(e) => onChange(key, e.target.value)}
            placeholder={label}
          />
        </div>
      ))}
    </div>

    <div className="space-y-3">
      {[
        { key: 'campos_pulmonares' as const, label: 'Campos Pulmonares' },
        { key: 'bulhas_cardiacas' as const, label: 'Bulhas Cardíacas' },
        { key: 'ritmo_cardiaco' as const, label: 'Ritmo Cardíaco' },
      ].map(({ key, label }) => (
        <div key={key} className="space-y-1">
          <Label className="text-xs">{label}</Label>
          <Input
            value={anamnesis[key]}
            onChange={(e) => onChange(key, e.target.value)}
            placeholder={label}
          />
        </div>
      ))}
      <div className="space-y-1">
        <Label className="text-xs">Palpação Abdominal</Label>
        <Textarea
          value={anamnesis.palpacao_abdominal}
          onChange={(e) => onChange('palpacao_abdominal', e.target.value)}
          rows={2}
          spellCheck={true}
          lang="pt-BR"
        />
      </div>
    </div>
  </div>
);
