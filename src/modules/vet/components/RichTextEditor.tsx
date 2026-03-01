import { useRef, useCallback, useEffect } from 'react';
import {
  Bold, Italic, Underline, Strikethrough,
  Subscript, Superscript,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
}

interface ToolbarButton {
  cmd: string;
  icon: React.ElementType;
  title: string;
}

const TOOLBAR_BUTTONS: ToolbarButton[] = [
  { cmd: 'bold',          icon: Bold,         title: 'Negrito (Ctrl+B)' },
  { cmd: 'italic',        icon: Italic,        title: 'Itálico (Ctrl+I)' },
  { cmd: 'underline',     icon: Underline,     title: 'Sublinhado (Ctrl+U)' },
  { cmd: 'strikeThrough', icon: Strikethrough, title: 'Tachado' },
  { cmd: 'subscript',     icon: Subscript,     title: 'Subscrito' },
  { cmd: 'superscript',   icon: Superscript,   title: 'Superscrito' },
];

const ALIGN_BUTTONS: ToolbarButton[] = [
  { cmd: 'justifyLeft',   icon: AlignLeft,    title: 'Alinhar à esquerda' },
  { cmd: 'justifyCenter', icon: AlignCenter,  title: 'Centralizar' },
  { cmd: 'justifyRight',  icon: AlignRight,   title: 'Alinhar à direita' },
  { cmd: 'justifyFull',   icon: AlignJustify, title: 'Justificar' },
];

const LIST_BUTTONS: ToolbarButton[] = [
  { cmd: 'insertUnorderedList', icon: List,         title: 'Lista com marcadores' },
  { cmd: 'insertOrderedList',   icon: ListOrdered,  title: 'Lista numerada' },
];

export const RichTextEditor = ({
  value,
  onChange,
  placeholder = 'Digite aqui...',
  minHeight = '120px',
  className = '',
}: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalUpdate = useRef(false);

  useEffect(() => {
    if (editorRef.current && !isInternalUpdate.current) {
      editorRef.current.innerHTML = value || '';
    }
    isInternalUpdate.current = false;
  }, [value]);

  const exec = useCallback((command: string, val?: string) => {
    document.execCommand(command, false, val ?? undefined);
    editorRef.current?.focus();
    if (editorRef.current) {
      isInternalUpdate.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternalUpdate.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const ToolbarBtn = ({ btn }: { btn: ToolbarButton }) => {
    const Icon = btn.icon;
    return (
      <button
        type="button"
        title={btn.title}
        onMouseDown={(e) => { e.preventDefault(); exec(btn.cmd); }}
        className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-slate-700 dark:text-slate-200"
      >
        <Icon size={13} />
      </button>
    );
  };

  return (
    <div className={`border border-input rounded-md overflow-hidden ${className}`}>
      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div className="flex items-center flex-wrap gap-0.5 px-2 py-1.5 bg-slate-100 dark:bg-slate-700 border-b border-input">
        {TOOLBAR_BUTTONS.map((btn) => <ToolbarBtn key={btn.cmd} btn={btn} />)}

        <div className="w-px h-4 bg-slate-300 dark:bg-slate-500 mx-1" />

        {ALIGN_BUTTONS.map((btn) => <ToolbarBtn key={btn.cmd} btn={btn} />)}

        <div className="w-px h-4 bg-slate-300 dark:bg-slate-500 mx-1" />

        {LIST_BUTTONS.map((btn) => <ToolbarBtn key={btn.cmd} btn={btn} />)}

        <div className="w-px h-4 bg-slate-300 dark:bg-slate-500 mx-1" />

        {/* Cor do texto */}
        <label
          title="Cor do texto"
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer relative flex items-center"
        >
          <span className="font-bold text-xs text-slate-700 dark:text-slate-200 underline decoration-2 decoration-red-500">A</span>
          <input
            type="color"
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            defaultValue="#000000"
            onChange={(e) => exec('foreColor', e.target.value)}
          />
        </label>

        {/* Destaque */}
        <label
          title="Cor de destaque (marca-texto)"
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer relative flex items-center"
        >
          <span className="font-bold text-xs text-slate-700 dark:text-slate-200" style={{ backgroundColor: '#ffff00', padding: '0 3px' }}>A</span>
          <input
            type="color"
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            defaultValue="#ffff00"
            onChange={(e) => exec('hiliteColor', e.target.value)}
          />
        </label>
      </div>

      {/* ── Editor ──────────────────────────────────────────── */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        spellCheck={true}
        lang="pt-BR"
        onInput={handleInput}
        data-placeholder={placeholder}
        className="rich-editor p-3 focus:outline-none bg-background text-sm leading-relaxed"
        style={{ minHeight }}
      />
    </div>
  );
};
