import { AppointmentRequest } from '@/hooks/useAppointmentRequests';
import type { AnamnesisData } from './anamnesisTypes';

interface ExportPdfOptions {
  request: AppointmentRequest;
  date: string | null;
  time: string | null;
  title: string;
  sectionTitle: string;
  sectionData: unknown;
  sectionType?: 'anamnesis' | 'cirurgia' | 'retorno' | 'avaliacao' | 'generic';
}

const formatList = (arr: string[]): string =>
  Array.isArray(arr) && arr.length > 0 ? arr.join(', ') : '—';

const formatObj = (obj: Record<string, unknown>): string => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return '—';
  const parts = Object.entries(obj)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${k}: ${String(v)}`);
  return parts.length > 0 ? parts.join(' | ') : '—';
};

const buildAnamnesisHtml = (a: AnamnesisData): string => `
  <div class="print-section">
    <h3>Anamnese</h3>
    <div class="field"><strong>Queixa principal:</strong> ${a.queixa_principal || '—'}</div>
    <div class="field"><strong>Medicamentos em uso:</strong> ${a.medicamentos || '—'}</div>
    <div class="subsection">
      <h4>Sistema Gastrintestinal (SGI)</h4>
      <p>${formatList(a.sistema_gastrintestinal)}</p>
    </div>
    <div class="subsection">
      <h4>Sistema Genitourinário (SGU)</h4>
      <p>${formatList(a.sistema_genitourinario)}</p>
    </div>
    <div class="subsection">
      <h4>Sistema Cardiorrespiratório (SCR)</h4>
      <p>${formatList(a.sistema_cardiorespiratório)}</p>
    </div>
    <div class="subsection">
      <h4>Sistema Neurológico (SN)</h4>
      <p>${formatList(a.sistema_neurologico)}</p>
    </div>
    <div class="subsection">
      <h4>Sistema Musculoesquelético (SME)</h4>
      <p>${formatList(a.sistema_musculoesqueletico)}</p>
    </div>
    <div class="subsection">
      <h4>Sistema Oto-tegumentar (SOT)</h4>
      <p>${formatList(a.sistema_ototegumentar)}</p>
    </div>
    ${a.sistema_ototegumentar_obs ? `<div class="field"><strong>Obs. SOT:</strong> ${a.sistema_ototegumentar_obs}</div>` : ''}
  </div>

  <div class="print-section">
    <h3>Manejo</h3>
    <div class="subsection"><h4>Alimentação</h4><p>${formatList(a.alimentacao)}</p></div>
    <div class="subsection"><h4>Vacinação</h4><p>${formatList(a.vacinacao)}</p></div>
    <div class="subsection"><h4>Ambiente</h4><p>${formatList(a.ambiente)}</p></div>
    <div class="subsection"><h4>Comportamento</h4><p>${formatList(a.comportamento)}</p></div>
    <div class="field"><strong>Ectoparasitas:</strong> ${formatObj(a.ectoparasitas)}</div>
    <div class="field"><strong>Vermífugo:</strong> ${a.vermifugo || '—'}</div>
    <div class="field"><strong>Banho:</strong> ${formatObj(a.banho)}</div>
    <div class="field"><strong>Acesso à rua:</strong> ${formatObj(a.acesso_rua)}</div>
    <div class="field"><strong>Contactantes:</strong> ${formatObj(a.contactantes)}</div>
  </div>

  <div class="print-section">
    <h3>Exame Físico</h3>
    <div class="subsection"><h4>Mucosas</h4><p>${formatList(a.mucosas)}</p></div>
    <div class="subsection"><h4>Linfonodos</h4><p>${formatList(a.linfonodos)}</p></div>
    <div class="row">
      <span><strong>Hidratação:</strong> ${a.hidratacao || '—'}</span>
      <span><strong>Pulso:</strong> ${a.pulso || '—'}</span>
    </div>
    <div class="row">
      <span><strong>Temperatura:</strong> ${a.temperatura || '—'}</span>
      <span><strong>TPC:</strong> ${a.tpc || '—'}</span>
      <span><strong>FC:</strong> ${a.fc || '—'}</span>
      <span><strong>FR:</strong> ${a.fr || '—'}</span>
    </div>
    <div class="field"><strong>Campos pulmonares:</strong> ${a.campos_pulmonares || '—'}</div>
    <div class="field"><strong>Bulhas cardíacas:</strong> ${a.bulhas_cardiacas || '—'}</div>
    <div class="field"><strong>Ritmo cardíaco:</strong> ${a.ritmo_cardiaco || '—'}</div>
    <div class="field"><strong>Palpação abdominal:</strong> ${a.palpacao_abdominal || '—'}</div>
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
        return `<div class="field"><strong>${label}:</strong> ${String(val)}</div>`;
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

  const dateLabel = date ? new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
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
            line-height: 1.35;
            color: #1f2937;
            margin: 0;
            padding: 14px 18px;
          }
          @page {
            size: A4;
            margin: 14mm;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
            .print-section { break-inside: avoid; page-break-inside: avoid; }
          }
          .header-clinic {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid #d1d5db;
          }
          .clinic-name { font-size: 14px; font-weight: 700; }
          .muted { color: #6b7280; font-size: 10px; }
          h1 { font-size: 15px; margin: 0 0 10px; font-weight: 700; }
          .meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px 24px;
            margin-bottom: 12px;
            padding: 10px 12px;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
          }
          .meta-grid .label { font-size: 10px; color: #6b7280; }
          .meta-grid .value { font-weight: 500; }
          .print-section {
            margin-bottom: 14px;
            padding-bottom: 10px;
            border-bottom: 1px solid #e5e7eb;
          }
          .print-section:last-of-type { border-bottom: none; }
          .print-section h3 {
            font-size: 12px;
            font-weight: 700;
            margin: 0 0 8px;
            color: #374151;
          }
          .print-section h4 {
            font-size: 10px;
            font-weight: 600;
            margin: 4px 0 2px;
            color: #6b7280;
          }
          .print-section .field, .print-section p {
            margin: 2px 0;
            font-size: 10px;
          }
          .print-section .row {
            display: flex;
            flex-wrap: wrap;
            gap: 12px 20px;
            margin: 4px 0;
          }
          .print-section .row span { font-size: 10px; }
          .subsection { margin-bottom: 4px; }
          .subsection p { margin: 0; }
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
            ${dateLabel} às ${timeLabel}
          </div>
        </div>

        <h1>${title} — ${petName}</h1>

        <div class="meta-grid">
          <div>
            <div class="label">Tutor</div>
            <div class="value">${tutorName}</div>
          </div>
          <div>
            <div class="label">Telefone</div>
            <div class="value">${tutorPhone}</div>
          </div>
          <div>
            <div class="label">Paciente</div>
            <div class="value">${petName}</div>
          </div>
          <div>
            <div class="label">Espécie / Raça</div>
            <div class="value">${petType} — ${petBreed}</div>
          </div>
          <div>
            <div class="label">Motivo</div>
            <div class="value">${reason}</div>
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
