export interface ReceitaSimplesData {
  petName: string;
  petSpecies: string;
  petBreed: string;
  petAge: string;
  petSex: string;
  ownerName: string;
  ownerAddress: string;
  ownerPhone: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  veterinarian: string;
  crmv: string;
  clinicName: string;
  notes: string;
  prescriptionDate: string;
}

export interface ReceitaControladaData {
  petName: string;
  petSpecies: string;
  petBreed: string;
  petAge: string;
  petSex: string;
  ownerName: string;
  ownerAddress: string;
  emitterName: string;
  crmv: string;
  emitterPhone: string;
  emitterAddress: string;
  emitterCity: string;
  emitterState: string;
  prescription: string;
  prescriptionDate: string;
}

const formatDate = (dateStr: string): string => {
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
};

// ── Estilos compartilhados ─────────────────────────────────────
const baseStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; color: #111; background: white; }
`;

// ── HTML da Receita Simples — A4 retrato, página inteira ──────
export const buildReceitaSimplesPdfHtml = (data: ReceitaSimplesData): string => {
  const logoUrl = `${window.location.origin}/agendavet-logo.png`;
  const dateFormatted = formatDate(data.prescriptionDate);

  const isFemea = data.petSex === 'F'
    || data.petSex.toLowerCase() === 'fêmea'
    || data.petSex.toLowerCase() === 'femea';
  const isMacho = data.petSex === 'M' || data.petSex.toLowerCase() === 'macho';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Receituário Simples - ${data.petName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { font-family: Arial, sans-serif; font-size: 13px; color: #111; background: white; }
    @page { size: A4 portrait; margin: 16mm 18mm; }

    /* ── Estrutura geral ── */
    .page {
      width: 100%;
      min-height: 247mm;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    /* ── Cabeçalho ── */
    .header {
      display: flex;
      align-items: center;
      gap: 16px;
      border-bottom: 2.5px solid #222;
      padding-bottom: 12px;
    }
    .logo-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      flex-shrink: 0;
    }
    .logo { width: 72px; height: 72px; object-fit: contain; }
    .clinic-name { font-size: 9px; font-weight: bold; color: #555; text-align: center; max-width: 80px; }
    .header-text { flex: 1; text-align: center; }
    .receipt-title {
      font-size: 20px;
      font-weight: bold;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .receipt-subtitle { font-size: 11px; color: #555; margin-top: 3px; }

    /* ── Seções ── */
    .section {
      border: 1px solid #bbb;
      border-radius: 3px;
      padding: 10px 12px;
    }
    .section-title {
      font-size: 10px;
      font-weight: bold;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #444;
      border-bottom: 1px solid #ddd;
      padding-bottom: 5px;
      margin-bottom: 9px;
    }

    /* ── Campos ── */
    .field-row {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 8px;
      flex-wrap: wrap;
    }
    .fl { font-weight: bold; white-space: nowrap; flex-shrink: 0; }
    .fv { flex: 1; }
    .fline { border-bottom: 1px solid #555; min-width: 50px; }
    .short  { max-width: 130px; flex: none; }
    .short2 { max-width: 70px;  flex: none; }
    .ml12 { margin-left: 12px; }
    .multi-fields { display: flex; flex-wrap: wrap; gap: 10px; align-items: baseline; }
    .mini-field { display: flex; align-items: baseline; gap: 5px; }
    .mini-field .fline { width: 80px; flex: none; }
    .checkbox { font-size: 14px; margin-right: 2px; }
    .cb-label { margin-right: 8px; }

    /* ── Prescrição ── */
    .presc-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 120mm;
    }
    .presc-content {
      flex: 1;
      font-size: 13px;
      line-height: 1.6;
      padding: 4px 0;
    }

    /* ── Rodapé ── */
    .footer-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-top: 10px;
      border-top: 1px solid #bbb;
      margin-top: auto;
    }
    .footer-date { font-size: 12px; }
    .footer-sig { text-align: center; }
    .sig-line { border-bottom: 1.5px solid #333; width: 220px; margin-bottom: 5px; }
    .sig-label { font-size: 10px; color: #444; }
  </style>
</head>
<body>
  <div class="page">

    <!-- Cabeçalho -->
    <div class="header">
      <div class="logo-wrap">
        <img src="${logoUrl}" alt="AgendaVet" class="logo" onerror="this.style.display='none'" />
        <div class="clinic-name">${data.clinicName || 'AgendaVet'}</div>
      </div>
      <div class="header-text">
        <div class="receipt-title">Receituário Veterinário</div>
        <div class="receipt-subtitle">Receita Simples</div>
      </div>
    </div>

    <!-- Dados do Paciente -->
    <div class="section">
      <div class="section-title">Dados do Paciente</div>
      <div class="field-row">
        <span class="fl">Tutor:</span>
        <span class="fv fline">${data.ownerName}</span>
        ${data.ownerPhone ? `<span class="fl ml12">Tel.:</span><span class="fv fline short">${data.ownerPhone}</span>` : ''}
      </div>
      <div class="field-row">
        <span class="fl">Endereço:</span>
        <span class="fv fline">${data.ownerAddress}</span>
      </div>
      <div class="field-row multi-fields">
        <div class="mini-field"><span class="fl">Animal:</span><span class="fv fline">${data.petName}</span></div>
        <div class="mini-field"><span class="fl">Espécie:</span><span class="fv fline">${data.petSpecies}</span></div>
        <div class="mini-field"><span class="fl">Raça:</span><span class="fv fline">${data.petBreed}</span></div>
        <div class="mini-field"><span class="fl">Idade:</span><span class="fv fline short2">${data.petAge}</span></div>
        <div class="mini-field">
          <span class="fl">Sexo:</span>
          <span class="checkbox">${isFemea ? '☑' : '☐'}</span><span class="cb-label">F</span>
          <span class="checkbox">${isMacho ? '☑' : '☐'}</span><span class="cb-label">M</span>
        </div>
      </div>
    </div>

    <!-- Prescrição -->
    <div class="section presc-section">
      <div class="section-title">Prescrição</div>
      <div class="presc-content">${data.notes || ''}</div>
    </div>

    <!-- Assinatura -->
    <div class="footer-row">
      <div class="footer-date">Data: ${dateFormatted}</div>
      <div class="footer-sig">
        <div class="sig-line"></div>
        <div class="sig-label">${data.veterinarian || 'Médico Veterinário'}${data.crmv ? ` · CRMV: ${data.crmv}` : ''}</div>
      </div>
    </div>

  </div>
</body>
</html>`;
};

// ── HTML da Receita Controlada — A4 retrato, página inteira ───
export const buildReceitaControladaPdfHtml = (data: ReceitaControladaData): string => {
  const logoUrl = `${window.location.origin}/agendavet-logo.png`;
  const dateFormatted = formatDate(data.prescriptionDate);

  const isFemea = data.petSex === 'F'
    || data.petSex.toLowerCase() === 'fêmea'
    || data.petSex.toLowerCase() === 'femea';
  const isMacho = data.petSex === 'M' || data.petSex.toLowerCase() === 'macho';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Receituário Controle Especial - ${data.petName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { font-family: Arial, sans-serif; font-size: 12px; color: #111; background: white; }
    @page { size: A4 portrait; margin: 14mm 18mm; }

    /* ── Estrutura geral ── */
    .page {
      width: 100%;
      min-height: 249mm;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    /* ── Cabeçalho: emitente + título lado a lado ── */
    .header {
      display: flex;
      border: 1.5px solid #333;
    }
    .emitter-col {
      flex: 1.7;
      border-right: 1.5px solid #333;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .emitter-top {
      display: flex;
      align-items: center;
      gap: 10px;
      border-bottom: 1px solid #ddd;
      padding-bottom: 7px;
      margin-bottom: 2px;
    }
    .logo { width: 56px; height: 56px; object-fit: contain; flex-shrink: 0; }
    .emitter-heading { flex: 1; }
    .box-title {
      font-size: 9px;
      font-weight: bold;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: #444;
      margin-bottom: 4px;
    }
    .e-row { display: flex; align-items: baseline; gap: 5px; margin-bottom: 5px; }
    .el { font-weight: bold; white-space: nowrap; flex-shrink: 0; font-size: 11px; }
    .ev { flex: 1; font-size: 11px; }
    .eline { border-bottom: 1px solid #555; }
    .uf { flex: none; width: 36px; }
    .ml8 { margin-left: 8px; }

    .title-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 14px 10px;
      text-align: center;
      gap: 8px;
    }
    .main-title {
      font-size: 17px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      line-height: 1.4;
    }
    .main-subtitle { font-size: 11px; color: #555; }

    /* ── Seções comuns ── */
    .section {
      border: 1px solid #bbb;
      border-radius: 3px;
      padding: 9px 12px;
    }
    .section-title {
      font-size: 9px;
      font-weight: bold;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #444;
      border-bottom: 1px solid #ddd;
      padding-bottom: 5px;
      margin-bottom: 8px;
    }

    /* ── Campos paciente ── */
    .field-row { display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
    .fl { font-weight: bold; white-space: nowrap; flex-shrink: 0; }
    .fv { flex: 1; }
    .fline { border-bottom: 1px solid #555; min-width: 40px; }
    .short  { max-width: 120px; flex: none; }
    .short2 { max-width: 65px;  flex: none; }
    .ml12 { margin-left: 12px; }
    .multi-fields { display: flex; flex-wrap: wrap; gap: 10px; align-items: baseline; }
    .mini-field { display: flex; align-items: baseline; gap: 5px; }
    .mini-field .fline { width: 80px; flex: none; }
    .checkbox { font-size: 14px; margin-right: 2px; }
    .cb-label { margin-right: 8px; }

    /* ── Prescrição ── */
    .presc-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 80mm;
    }
    .presc-content { flex: 1; font-size: 12px; line-height: 1.6; padding: 4px 0; }

    /* ── Assinatura ── */
    .sig-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-top: 1px solid #bbb;
      padding-top: 10px;
    }
    .sig-date { font-size: 12px; }
    .sig-block { text-align: center; }
    .sig-line { border-bottom: 1.5px solid #333; width: 220px; margin-bottom: 5px; }
    .sig-label { font-size: 10px; color: #444; }

    /* ── Identificação comprador / fornecedor ── */
    .id-boxes { display: flex; border: 1px solid #bbb; border-radius: 3px; }
    .id-section { flex: 1; padding: 8px 10px; }
    .id-section:first-child { border-right: 1px solid #bbb; }
    .id-title {
      font-size: 9px;
      font-weight: bold;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: #444;
      text-align: center;
      padding-bottom: 5px;
      border-bottom: 1px solid #ddd;
      margin-bottom: 7px;
    }
    .id-row { display: flex; align-items: baseline; gap: 4px; margin-bottom: 6px; }
    .il { font-weight: bold; white-space: nowrap; flex-shrink: 0; font-size: 11px; }
    .iv { flex: 1; font-size: 11px; }
    .iline { border-bottom: 1px solid #555; }
    .isht { flex: none; width: 40px; }
    .id-space { min-height: 28px; }
    .id-footer { margin-top: 4px; }
    .id-date-f { font-size: 10px; margin-bottom: 10px; }
    .id-sig-line { border-bottom: 1px solid #333; width: 100%; margin-bottom: 4px; }
    .id-sig-label { font-size: 9px; text-align: center; color: #555; }
  </style>
</head>
<body>
  <div class="page">

    <!-- Cabeçalho: Emitente + Título -->
    <div class="header">
      <div class="emitter-col">
        <div class="emitter-top">
          <img src="${logoUrl}" alt="AgendaVet" class="logo" onerror="this.style.display='none'" />
          <div class="emitter-heading">
            <div class="box-title">Identificação do Emitente</div>
          </div>
        </div>
        <div class="e-row"><span class="el">Nome:</span><span class="ev eline">${data.emitterName}</span></div>
        <div class="e-row"><span class="el">CRMV:</span><span class="ev eline">${data.crmv}</span></div>
        <div class="e-row"><span class="el">Telefone:</span><span class="ev eline">${data.emitterPhone}</span></div>
        <div class="e-row"><span class="el">Endereço:</span><span class="ev eline">${data.emitterAddress}</span></div>
        <div class="e-row">
          <span class="el">Cidade:</span><span class="ev eline">${data.emitterCity}</span>
          <span class="el ml8">UF:</span><span class="ev eline uf">${data.emitterState}</span>
        </div>
      </div>
      <div class="title-col">
        <div class="main-title">Receituário de<br/>Controle Especial</div>
        <div class="main-subtitle">Receita Veterinária</div>
      </div>
    </div>

    <!-- Dados do Paciente -->
    <div class="section">
      <div class="section-title">Dados do Paciente</div>
      <div class="field-row">
        <span class="fl">Tutor:</span>
        <span class="fv fline">${data.ownerName}</span>
      </div>
      <div class="field-row">
        <span class="fl">Endereço:</span>
        <span class="fv fline">${data.ownerAddress}</span>
      </div>
      <div class="field-row multi-fields">
        <div class="mini-field"><span class="fl">Animal:</span><span class="fv fline">${data.petName}</span></div>
        <div class="mini-field"><span class="fl">Espécie:</span><span class="fv fline">${data.petSpecies}</span></div>
        <div class="mini-field"><span class="fl">Raça:</span><span class="fv fline">${data.petBreed}</span></div>
        <div class="mini-field"><span class="fl">Idade:</span><span class="fv fline short2">${data.petAge}</span></div>
        <div class="mini-field">
          <span class="fl">Sexo:</span>
          <span class="checkbox">${isFemea ? '☑' : '☐'}</span><span class="cb-label">F</span>
          <span class="checkbox">${isMacho ? '☑' : '☐'}</span><span class="cb-label">M</span>
        </div>
      </div>
    </div>

    <!-- Prescrição -->
    <div class="section presc-section">
      <div class="section-title">Prescrição</div>
      <div class="presc-content">${data.prescription}</div>
    </div>

    <!-- Assinatura -->
    <div class="sig-row">
      <div class="sig-date">Data: ${dateFormatted}</div>
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-label">Médico Veterinário · CRMV: ${data.crmv}</div>
      </div>
    </div>

    <!-- Comprador / Fornecedor -->
    <div class="id-boxes">
      <div class="id-section">
        <div class="id-title">Identificação do Comprador</div>
        <div class="id-row"><span class="il">Nome:</span><span class="iv iline"></span></div>
        <div class="id-row">
          <span class="il">Identidade:</span><span class="iv iline"></span>
          <span class="il ml8">Órgão Emissor:</span><span class="iv iline isht"></span>
        </div>
        <div class="id-row"><span class="il">Endereço:</span><span class="iv iline"></span></div>
        <div class="id-row">
          <span class="il">Cidade:</span><span class="iv iline"></span>
          <span class="il ml8">UF:</span><span class="iv iline isht"></span>
        </div>
        <div class="id-row"><span class="il">Telefone:</span><span class="iv iline"></span></div>
      </div>
      <div class="id-section">
        <div class="id-title">Identificação do Fornecedor</div>
        <div class="id-space"></div>
        <div class="id-footer">
          <div class="id-date-f">Data: _____ / _____ / __________</div>
          <div class="id-sig-line"></div>
          <div class="id-sig-label">Assinatura do Farmacêutico</div>
        </div>
      </div>
    </div>

  </div>
</body>
</html>`;
};

// ── Funções de abertura em nova aba (mantidas para compatibilidade) ──
export const exportReceitaSimplesPdf = (data: ReceitaSimplesData) => {
  const html = buildReceitaSimplesPdfHtml(data);
  const w = window.open('about:blank', '_blank');
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 800);
};

export const exportReceitaControladaPdf = (data: ReceitaControladaData) => {
  const html = buildReceitaControladaPdfHtml(data);
  const w = window.open('about:blank', '_blank');
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 800);
};
