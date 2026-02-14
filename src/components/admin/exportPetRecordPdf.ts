interface ExportPetRecordPdfOptions {
  title: string;
  petName: string;
  sectionTitle: string;
  sectionData: unknown;
}

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '—';
  if (Array.isArray(value)) {
    if (value.length === 0) return '—';
    return value.map((item) => formatValue(item)).join(', ');
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${formatValue(v)}`);
    return entries.length ? entries.join(' | ') : '—';
  }
  return String(value);
};

const buildSectionHtml = (title: string, data: unknown): string => {
  if (data === null || data === undefined) return '';

  if (typeof data === 'object' && !Array.isArray(data)) {
    const obj = data as Record<string, unknown>;
    const rows = Object.entries(obj).map(([key, value]) => {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      return `
        <div class="row">
          <span class="label">${label}:</span>
          <span class="value">${formatValue(value)}</span>
        </div>
      `;
    });

    return `
      <div class="section">
        <h3>${title}</h3>
        ${rows.join('')}
      </div>
    `;
  }

  return `
    <div class="section">
      <h3>${title}</h3>
      <div class="row">
        <span class="value">${formatValue(data)}</span>
      </div>
    </div>
  `;
};

export const exportPetRecordPdf = ({ title, petName, sectionTitle, sectionData }: ExportPetRecordPdfOptions) => {
  if (typeof window === 'undefined') return;

  const dateNow = new Date();
  const dateLabel = dateNow.toLocaleDateString('pt-BR');
  const timeLabel = dateNow.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>${title} - ${petName}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
            color: #111827;
            margin: 0;
            padding: 20px;
            font-size: 12px;
            line-height: 1.45;
          }
          @page { size: A4; margin: 12mm; }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 8px;
            margin-bottom: 14px;
          }
          .title {
            font-size: 18px;
            font-weight: 700;
            margin: 0;
          }
          .subtitle {
            margin: 2px 0 0;
            color: #6b7280;
            font-size: 11px;
          }
          .meta {
            text-align: right;
            color: #6b7280;
            font-size: 11px;
          }
          .section {
            margin-top: 14px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 12px;
          }
          .section h3 {
            margin: 0 0 10px;
            font-size: 13px;
          }
          .row {
            margin: 6px 0;
            display: flex;
            gap: 8px;
            align-items: flex-start;
            flex-wrap: wrap;
          }
          .label {
            font-weight: 600;
            min-width: 130px;
          }
          .value {
            white-space: pre-wrap;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">${title}</h1>
            <p class="subtitle">Pet: ${petName}</p>
          </div>
          <div class="meta">
            ${dateLabel}<br />
            ${timeLabel}
          </div>
        </div>
        ${buildSectionHtml(sectionTitle, sectionData)}
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
