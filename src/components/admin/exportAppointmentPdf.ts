import { AppointmentRequest } from '@/hooks/useAppointmentRequests';
import type { AnamnesisData } from './anamnesisTypes';
import {
  SGI_OPTIONS,
  SGU_OPTIONS,
  SCR_OPTIONS,
  SN_OPTIONS,
  SME_OPTIONS,
  SOT_OPTIONS,
  ALIMENTACAO_OPTIONS,
  VACINACAO_OPTIONS,
  AMBIENTE_OPTIONS,
  COMPORTAMENTO_OPTIONS,
  MUCOSAS_OPTIONS,
  LINFONODOS_OPTIONS,
} from '@/data/anamnesisOptions';

interface ExportPdfOptions {
  request: AppointmentRequest;
  date: string | null;
  time: string | null;
  title: string;
  sectionTitle: string;
  sectionData: unknown;
  sectionType?: 'anamnesis' | 'cirurgia' | 'retorno' | 'avaliacao' | 'generic';
}

const formatObj = (obj: Record<string, unknown>): string => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return '—';
  const parts = Object.entries(obj)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${k}: ${String(v)}`);
  return parts.length > 0 ? parts.join(' | ') : '—';
};

const formatDateLong = (dateStr: string | null): string => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const optionItem = (label: string, checked: boolean) => {
  const dot = checked ? '●' : '○';
  return `<span class="option-item"><span class="option-dot">${dot}</span>${label}</span>`;
};

const buildCheckboxGroup = (
  title: string,
  options: string[],
  selected: string[]
): string => `
  <div class="checkbox-group">
    <h4 class="checkbox-group-title">${title}</h4>
    <div class="checkbox-grid">
      ${options.map((opt) => optionItem(opt, selected.includes(opt))).join('')}
    </div>
  </div>
`;

const buildAnamnesisHtml = (a: AnamnesisData): string => `
  <div class="print-tabs">
    <span class="tab-active">Anamnese</span>
    <span class="tab">Manejo</span>
    <span class="tab">Exame Físico</span>
  </div>

  <div class="print-section">
    <div class="field-block">
      <label>Queixa Principal</label>
      <div class="field-value">${a.queixa_principal || '—'}</div>
    </div>
    <div class="field-block">
      <label>Medicamentos em uso</label>
      <div class="field-value">${a.medicamentos || '—'}</div>
    </div>

    ${buildCheckboxGroup('Sistema Gastrintestinal (SGI)', SGI_OPTIONS, a.sistema_gastrintestinal)}
    ${buildCheckboxGroup('Sistema Genitourinário (SGU)', SGU_OPTIONS, a.sistema_genitourinario)}
    ${buildCheckboxGroup('Sistema Cardiorrespiratório (SCR)', SCR_OPTIONS, a.sistema_cardiorespiratório)}
    ${buildCheckboxGroup('Sistema Neurológico (SN)', SN_OPTIONS, a.sistema_neurologico)}
    ${buildCheckboxGroup('Sistema Musculoesquelético (SME)', SME_OPTIONS, a.sistema_musculoesqueletico)}
    ${buildCheckboxGroup('Sistema Oto-tegumentar (SOT)', SOT_OPTIONS, a.sistema_ototegumentar)}
    ${a.sistema_ototegumentar_obs ? `<div class="field-block"><label>Obs. SOT</label><div class="field-value">${a.sistema_ototegumentar_obs}</div></div>` : ''}
  </div>

  <div class="print-section">
    ${buildCheckboxGroup('Alimentação', ALIMENTACAO_OPTIONS, a.alimentacao)}
    ${buildCheckboxGroup('Vacinação', VACINACAO_OPTIONS, a.vacinacao)}
    ${buildCheckboxGroup('Ambiente', AMBIENTE_OPTIONS, a.ambiente)}
    ${buildCheckboxGroup('Comportamento', COMPORTAMENTO_OPTIONS, a.comportamento)}
    <div class="field-inline"><strong>Ectoparasitas:</strong> ${formatObj(a.ectoparasitas)}</div>
    <div class="field-inline"><strong>Vermífugo:</strong> ${a.vermifugo || '—'}</div>
    <div class="field-inline"><strong>Banho:</strong> ${formatObj(a.banho)}</div>
    <div class="field-inline"><strong>Acesso à rua:</strong> ${formatObj(a.acesso_rua)}</div>
    <div class="field-inline"><strong>Contactantes:</strong> ${formatObj(a.contactantes)}</div>
  </div>

  <div class="print-section">
    ${buildCheckboxGroup('Mucosas', MUCOSAS_OPTIONS, a.mucosas)}
    ${buildCheckboxGroup('Linfonodos', LINFONODOS_OPTIONS, a.linfonodos)}
    <div class="row-inline">
      <span><strong>Hidratação:</strong> ${a.hidratacao || '—'}</span>
      <span><strong>Pulso:</strong> ${a.pulso || '—'}</span>
    </div>
    <div class="row-inline">
      <span><strong>Temperatura:</strong> ${a.temperatura || '—'}</span>
      <span><strong>TPC:</strong> ${a.tpc || '—'}</span>
      <span><strong>FC:</strong> ${a.fc || '—'}</span>
      <span><strong>FR:</strong> ${a.fr || '—'}</span>
    </div>
    <div class="field-inline"><strong>Campos pulmonares:</strong> ${a.campos_pulmonares || '—'}</div>
    <div class="field-inline"><strong>Bulhas cardíacas:</strong> ${a.bulhas_cardiacas || '—'}</div>
    <div class="field-inline"><strong>Ritmo cardíaco:</strong> ${a.ritmo_cardiaco || '—'}</div>
    <div class="field-inline"><strong>Palpação abdominal:</strong> ${a.palpacao_abdominal || '—'}</div>
  </div>
`;

const buildGenericSectionHtml = (sectionTitle: string, data: unknown): string => {
  if (data === null || data === undefined) return '';
  if (typeof data === 'object' && !Array.isArray(data)) {
    const obj = data as Record<string, unknown>;
    const rows = Object.entries(obj)
      .filter(([, v]) => v !== null && v !== undefined)
      .map(([k, v]) => {
        const label = k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        let val = v;
        if (Array.isArray(v)) val = v.join(', ');
        else if (typeof v === 'object' && v !== null) val = JSON.stringify(v);
        return `<div class="field-inline"><strong>${label}:</strong> ${String(val)}</div>`;
      });
    return `
      <div class="print-section">
        <h3>${sectionTitle}</h3>
        ${rows.join('')}
      </div>
    `;
  }
  return `<div class="print-section"><h3>${sectionTitle}</h3><p>${String(data)}</p></div>`;
};

export const exportAppointmentPdf = ({
  request,
  date,
  time,
  title,
  sectionTitle,
  sectionData,
  sectionType = 'generic',
}: ExportPdfOptions) => {
  if (typeof window === 'undefined') return;

  const dateShort = date ? new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
  const dateLong = date ? formatDateLong(date) : '';
  const timeLabel = time || '';
  const tutorName = request.profile?.full_name || 'N/A';
  const tutorPhone = request.profile?.phone || 'Sem telefone';
  const petName = request.pet?.name || 'N/A';
  const petType = request.pet?.type || 'N/A';
  const petBreed = request.pet?.breed || 'SRD';
  const reason = request.reason || '';
  const veterinarian = request.veterinarian || '____________________________';

  const isAnamnesis = sectionType === 'anamnesis' && sectionData && typeof sectionData === 'object' && 'queixa_principal' in (sectionData as object);
  const bodyContent = isAnamnesis
    ? buildAnamnesisHtml(sectionData as AnamnesisData)
    : buildGenericSectionHtml(sectionTitle, sectionData);

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>${title} — ${petName}</title>
        <style>
          *, *::before, *::after { box-sizing: border-box; }
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 11px;
            line-height: 1.4;
            color: #1f2937;
            margin: 0;
            padding: 16px 20px;
          }
          @page { size: A4; margin: 12mm; }
          @media print {
            body { padding: 0; }
            .print-section { break-inside: avoid; page-break-inside: avoid; }
          }

          .header-clinic {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e5e7eb;
          }
          .clinic-name { font-size: 14px; font-weight: 700; }
          .muted { color: #6b7280; font-size: 10px; }

          h1 {
            font-size: 16px;
            font-weight: 700;
            margin: 0 0 12px;
          }

          .tutor-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px 24px;
            margin-bottom: 16px;
            padding: 12px 16px;
            background: #f3f4f6;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
          }
          .tutor-item {
            display: flex;
            align-items: flex-start;
            gap: 8px;
          }
          .tutor-icon {
            width: 16px;
            height: 16px;
            flex-shrink: 0;
            background: #9ca3af;
            border-radius: 4px;
          }
          .tutor-item .main { font-weight: 500; font-size: 11px; }
          .tutor-item .sub { font-size: 10px; color: #6b7280; }

          .print-tabs {
            display: flex;
            gap: 0;
            margin-bottom: 12px;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            overflow: hidden;
          }
          .print-tabs .tab, .print-tabs .tab-active {
            flex: 1;
            padding: 8px 12px;
            text-align: center;
            font-size: 11px;
            font-weight: 500;
          }
          .print-tabs .tab { background: #f9fafb; color: #6b7280; }
          .print-tabs .tab-active { background: #fff; color: #111; border-bottom: 2px solid #111; }

          .print-section {
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid #e5e7eb;
          }
          .print-section:last-of-type { border-bottom: none; }

          .field-block { margin-bottom: 10px; }
          .field-block label {
            display: block;
            font-size: 10px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 4px;
          }
          .field-value {
            padding: 8px 10px;
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            font-size: 11px;
            min-height: 36px;
          }

          .checkbox-group { margin-bottom: 12px; }
          .checkbox-group-title {
            font-size: 11px;
            font-weight: 600;
            margin: 0 0 8px;
            color: #374151;
          }
          .checkbox-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 6px 16px;
          }
          .option-item {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 10px;
            text-transform: capitalize;
          }
          .option-dot {
            font-size: 12px;
            line-height: 1;
            flex-shrink: 0;
          }

          .field-inline, .row-inline { margin: 4px 0; font-size: 10px; }
          .row-inline { display: flex; flex-wrap: wrap; gap: 12px 24px; }

          .signature-block {
            margin-top: 24px;
            padding-top: 12px;
            text-align: right;
            font-size: 10px;
          }
          .signature-line {
            border-top: 1px solid #9ca3af;
            width: 220px;
            margin-left: auto;
            padding-top: 4px;
          }
        </style>
      </head>
      <body>
        <div class="header-clinic">
          <div>
            <div class="clinic-name">Clínica Veterinária</div>
            <p class="muted">Endereço / Contato da clínica</p>
          </div>
          <div class="muted" style="text-align:right;">
            ${dateShort} às ${timeLabel}
          </div>
        </div>

        <h1>${title} — ${petName}</h1>

        <div class="tutor-grid">
          <div class="tutor-item">
            <div class="tutor-icon"></div>
            <div>
              <div class="main">${dateLong}</div>
              <div class="sub">${timeLabel}</div>
            </div>
          </div>
          <div class="tutor-item">
            <div class="tutor-icon"></div>
            <div>
              <div class="main">${tutorName}</div>
              <div class="sub">${tutorPhone}</div>
            </div>
          </div>
          <div class="tutor-item">
            <div class="tutor-icon"></div>
            <div>
              <div class="main">${petName}</div>
              <div class="sub">${petType} — ${petBreed}</div>
            </div>
          </div>
          <div class="tutor-item">
            <div class="tutor-icon"></div>
            <div>
              <div class="main">Motivo</div>
              <div class="sub">${reason}</div>
            </div>
          </div>
        </div>

        ${bodyContent}

        <div class="signature-block">
          <div class="signature-line">
            ${veterinarian}<br />
            <span class="muted">Médico(a) Veterinário(a)</span>
          </div>
        </div>
      </body>
    </html>
  `;

  const printWindow = window.open('about:blank', '_blank');
  if (!printWindow) return;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};
