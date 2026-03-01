import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface AnamnesisCheckboxGroupProps {
  title: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function AnamnesisCheckboxGroup({ title, options, selected, onChange }: AnamnesisCheckboxGroupProps) {
  const toggle = (option: string) => {
    onChange(
      selected.includes(option)
        ? selected.filter((s) => s !== option)
        : [...selected, option]
    );
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {options.map((option) => (
          <label
            key={option}
            className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/50 rounded px-2 py-1.5 transition-colors"
          >
            <Checkbox
              checked={selected.includes(option)}
              onCheckedChange={() => toggle(option)}
              className="h-3.5 w-3.5"
            />
            <span className="text-muted-foreground capitalize">{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
