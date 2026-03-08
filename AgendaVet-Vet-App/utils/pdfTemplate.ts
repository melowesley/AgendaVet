export interface PdfData {
  vetName: string;
  crmv: string;
  petName: string;
  species: string;
  breed: string;
  age: string;
  weight: string;
  tutorName: string;
  tutorPhone: string;
  attendanceType: string;
  date: string;
  clinicalData: Record<string, unknown>;
}

const TYPE_LABELS: Record<string, string> = {
  consulta: 'Ficha de Consulta',
  receita: 'Receita',
  vacina: 'Registro de Vacinação',
  exame: 'Solicitação / Resultado de Exame',
  cirurgia: 'Relatório Cirúrgico',
  internacao: 'Ficha de Internação',
  observacao: 'Observações Clínicas',
  retorno: 'Retorno / Reavaliação',
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderClinicalRows(data: Record<string, unknown>): string {
  return Object.entries(data)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([key, value]) => {
      const label = key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      const val = typeof value === 'object' ? JSON.stringify(value) : String(value);
      return `<tr><td class="field-label">${escapeHtml(label)}</td><td class="field-value">${escapeHtml(val)}</td></tr>`;
    })
    .join('');
}

export function generateAttendancePdfHtml(data: PdfData): string {
  const title = TYPE_LABELS[data.attendanceType] || data.attendanceType;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<title>${escapeHtml(title)}</title>
<style>
  @page { size: A4; margin: 18mm 15mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #1e293b; line-height: 1.5; }
  .page { max-width: 720px; margin: 0 auto; }

  /* Header */
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0f766e; padding-bottom: 12px; margin-bottom: 16px; }
  .header-left h1 { font-size: 18pt; color: #0f766e; font-weight: 800; }
  .header-left p { font-size: 9pt; color: #64748b; }
  .header-right { text-align: right; font-size: 9pt; color: #64748b; }
  .header-right strong { color: #1e293b; }

  /* Info boxes */
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
  .info-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; }
  .info-box h3 { font-size: 8pt; text-transform: uppercase; letter-spacing: 0.5px; color: #0f766e; margin-bottom: 6px; font-weight: 700; }
  .info-box p { font-size: 10pt; margin-bottom: 2px; }
  .info-box span.label { color: #64748b; }

  /* Title bar */
  .title-bar { background: #0f766e; color: white; padding: 8px 16px; border-radius: 6px; margin-bottom: 14px; font-weight: 700; font-size: 12pt; text-align: center; }

  /* Clinical table */
  .clinical-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  .clinical-table td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; font-size: 10pt; vertical-align: top; }
  .field-label { width: 35%; font-weight: 600; color: #334155; background: #f8fafc; }
  .field-value { color: #1e293b; }

  /* Footer */
  .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 16px; display: flex; justify-content: space-between; align-items: flex-end; }
  .signature-line { border-top: 1px solid #1e293b; width: 240px; text-align: center; padding-top: 4px; font-size: 9pt; color: #64748b; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
<div class="page">

  <div class="header">
    <div class="header-left">
      <h1>AgendaVet</h1>
      <p>Sistema de Gestão Veterinária</p>
    </div>
    <div class="header-right">
      <p><strong>${escapeHtml(data.vetName)}</strong></p>
      <p>CRMV: ${escapeHtml(data.crmv || 'N/I')}</p>
      <p>${escapeHtml(data.date)}</p>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <h3>Paciente</h3>
      <p><span class="label">Nome:</span> ${escapeHtml(data.petName)}</p>
      <p><span class="label">Espécie:</span> ${escapeHtml(data.species)} &nbsp; <span class="label">Raça:</span> ${escapeHtml(data.breed)}</p>
      <p><span class="label">Idade:</span> ${escapeHtml(data.age)} &nbsp; <span class="label">Peso:</span> ${escapeHtml(data.weight)}</p>
    </div>
    <div class="info-box">
      <h3>Tutor</h3>
      <p><span class="label">Nome:</span> ${escapeHtml(data.tutorName)}</p>
      <p><span class="label">Telefone:</span> ${escapeHtml(data.tutorPhone)}</p>
    </div>
  </div>

  <div class="title-bar">${escapeHtml(title)}</div>

  <table class="clinical-table">
    <tbody>
      ${renderClinicalRows(data.clinicalData)}
    </tbody>
  </table>

  <div class="footer">
    <div class="signature-line">
      ${escapeHtml(data.vetName)}<br/>CRMV: ${escapeHtml(data.crmv || 'N/I')}
    </div>
    <div style="font-size:9pt;color:#64748b;">
      ${escapeHtml(data.date)}
    </div>
  </div>

</div>
</body>
</html>`;
}
