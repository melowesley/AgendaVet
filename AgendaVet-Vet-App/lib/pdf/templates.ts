// ==========================================================
// PDF Templates — Layout Premium AgendaVet
// ==========================================================

export const getReceitaHtml = (data: any, tipo: 'simples' | 'controle'): string => {
    const isControlado = tipo === 'controle';
    if (isControlado) return gerarControleEspecial(data);
    return gerarReceitaSimples(data);
};

const COMMON_STYLES = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    @page { size: A4; margin: 15mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', Arial, sans-serif; font-size: 11pt; color: #1E293B; background: #fff; line-height: 1.5; }
    .page { width: 100%; min-height: 260mm; display: flex; flex-direction: column; }
    
    /* Luxury Header */
    .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #E2E8F0; }
    .brand { display: flex; align-items: center; gap: 15px; }
    .logo-symbol { width: 50px; height: 50px; background: #0EA5E9; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 24px; }
    .vet-info { display: flex; flex-direction: column; }
    .vet-name { font-size: 16pt; font-weight: 800; color: #0F172A; }
    .vet-crmv { font-size: 10pt; color: #64748B; font-weight: 600; }
    
    .doc-type { text-align: right; }
    .doc-title { font-size: 18pt; font-weight: 900; color: #0EA5E9; text-transform: uppercase; letter-spacing: -0.5px; }
    .doc-subtitle { font-size: 9pt; color: #64748B; font-weight: 600; text-transform: uppercase; margin-top: 2px; }

    /* Info Cards */
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
    .info-card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: 15px; }
    .card-label { font-size: 8pt; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px; display: block; }
    
    .field { margin-bottom: 6px; display: flex; gap: 4px; }
    .label { font-weight: 600; font-size: 9pt; color: #475569; }
    .value { font-weight: 500; font-size: 10pt; color: #1E293B; flex: 1; border-bottom: 1px solid transparent; }
    
    /* Content Area */
    .content-box { flex: 1; border: 1px solid #E2E8F0; border-radius: 20px; padding: 30px; margin-bottom: 30px; position: relative; background: #fff; }
    .content-label { position: absolute; top: -10px; left: 20px; background: #fff; padding: 0 10px; font-size: 8pt; font-weight: 800; color: #0EA5E9; text-transform: uppercase; }
    .prescription-text { font-size: 12pt; line-height: 1.8; color: #334155; white-space: pre-wrap; font-weight: 400; }

    /* Footer */
    .footer { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 20px; border-top: 1px solid #E2E8F0; }
    .footer-left { font-size: 10pt; color: #64748B; font-weight: 500; }
    .footer-right { text-align: center; width: 250px; }
    .sig-line { border-top: 2px solid #0F172A; margin-bottom: 5px; }
    .sig-name { font-weight: 700; font-size: 11pt; color: #0F172A; }
    .sig-sub { font-size: 8pt; color: #64748B; font-weight: 600; }
`;

function gerarReceitaSimples(data: any): string {
    return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
    <style>${COMMON_STYLES}</style></head><body><div class="page">
        <div class="header">
            <div class="brand">
                <div class="logo-symbol">V</div>
                <div class="vet-info">
                    <span class="vet-name">${data.veterinarian || ''}</span>
                    <span class="vet-crmv">Médico Veterinário • CRMV: ${data.crmv || ''}</span>
                </div>
            </div>
            <div class="doc-type">
                <div class="doc-title">Receituário</div>
                <div class="doc-subtitle">Receita Simples</div>
            </div>
        </div>

        <div class="info-grid">
            <div class="info-card">
                <span class="card-label">Identificação do Paciente</span>
                <div class="field"><span class="label">Animal:</span> <span class="value">${data.petName || ''}</span></div>
                <div style="display:flex; gap:10px">
                    <div class="field" style="flex:1"><span class="label">Espécie:</span> <span class="value">${data.petSpecies || ''}</span></div>
                    <div class="field" style="flex:1"><span class="label">Raça:</span> <span class="value">${data.petBreed || ''}</span></div>
                </div>
                <div style="display:flex; gap:10px">
                    <div class="field" style="flex:1"><span class="label">Idade:</span> <span class="value">${data.petAge || ''}</span></div>
                    <div class="field" style="flex:1"><span class="label">Sexo:</span> <span class="value">${data.petSex || '---'}</span></div>
                </div>
            </div>
            <div class="info-card">
                <span class="card-label">Responsável</span>
                <div class="field"><span class="label">Nome:</span> <span class="value">${data.ownerName || ''}</span></div>
                <div class="field"><span class="label">Endereço:</span> <span class="value">${data.ownerAddress || ''}</span></div>
                <div class="field"><span class="label">Telefone:</span> <span class="value">${data.ownerPhone || ''}</span></div>
            </div>
        </div>

        <div class="content-box">
            <span class="content-label">Prescrição e Orientações</span>
            <div class="prescription-text">${data.prescriptionText || ''}</div>
        </div>

        <div class="footer">
            <div class="footer-left">Emitido em: ${data.dateOfIssue || ''}</div>
            <div class="footer-right">
                <div class="sig-line"></div>
                <div class="sig-name">${data.veterinarian || ''}</div>
                <div class="sig-sub">Médico Veterinário &nbsp; CRMV: ${data.crmv || ''}</div>
            </div>
        </div>
    </div></body></html>`;
}

function gerarControleEspecial(data: any): string {
    const controlledStyles = `
        ${COMMON_STYLES}
        .header { margin-bottom: 20px; }
        .doc-title { font-size: 14pt; }
        .content-box { min-height: 100mm; max-height: 120mm; }
        
        .special-footer { border: 1px solid #E2E8F0; border-radius: 16px; padding: 15px; background: #F8FAFC; margin-top: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .form-field { border-bottom: 1px solid #CBD5E1; height: 18px; margin-top: 4px; }
        .sub-label { font-size: 7pt; color: #64748B; font-weight: 700; text-transform: uppercase; }
    `;

    return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
    <style>${controlledStyles}</style></head><body><div class="page">
        <div class="header">
            <div class="brand">
                <div class="logo-symbol">V</div>
                <div class="vet-info">
                    <span class="vet-name">${data.veterinarian || ''}</span>
                    <span class="vet-crmv">Médico Veterinário • CRMV: ${data.crmv || ''}</span>
                    <span style="font-size:8pt; color:#64748B">${data.vetAddress || ''} • ${data.vetPhone || ''}</span>
                </div>
            </div>
            <div class="doc-type">
                <div class="doc-title">Controle Especial</div>
                <div class="doc-subtitle">Receita Veterinária</div>
                <div style="font-size:7pt; font-weight:800; color:#EF4444; margin-top:4px"><!--VIA_PLACEHOLDER--></div>
            </div>
        </div>

        <div class="info-grid">
            <div class="info-card">
                <span class="card-label">Dados do Paciente</span>
                <div class="field"><span class="label">Animal:</span> <span class="value">${data.petName || ''}</span></div>
                <div class="field"><span class="label">Espécie/Raça:</span> <span class="value">${data.petSpecies || ''} / ${data.petBreed || ''}</span></div>
            </div>
            <div class="info-card">
                <span class="card-label">Dados do Comprador</span>
                <div class="field"><span class="label">Nome:</span> <span class="value">${data.ownerName || ''}</span></div>
                <div class="field"><span class="label">CPF/RG:</span> <span class="value">________________________</span></div>
            </div>
        </div>

        <div class="content-box">
            <span class="content-label">Prescrição (Uso Controlado)</span>
            <div class="prescription-text">${data.prescriptionText || ''}</div>
        </div>

        <div class="footer" style="padding-bottom:10px">
            <div class="footer-left">Data: ${data.dateOfIssue || ''}</div>
            <div class="footer-right">
                <div class="sig-line"></div>
                <div class="sig-name">${data.veterinarian || ''}</div>
                <div class="sig-sub">Carimbo e Assinatura</div>
            </div>
        </div>

        <div class="special-footer">
            <div>
                <span class="card-label">Identificação do Comprador</span>
                <div style="margin-bottom:8px"><div class="form-field"></div><span class="sub-label">Assinatura do Comprador</span></div>
                <div style="margin-bottom:8px"><div class="form-field"></div><span class="sub-label">Endereço Completo</span></div>
            </div>
            <div>
                <span class="card-label">Identificação do Fornecedor</span>
                <div style="margin-bottom:8px"><div class="form-field"></div><span class="sub-label">Assinatura do Farmacêutico</span></div>
                <div style="display:flex; gap:10px">
                    <div style="flex:1"><div class="form-field"></div><span class="sub-label">Lote</span></div>
                    <div style="flex:1"><div class="form-field"></div><span class="sub-label">Quantidade</span></div>
                </div>
            </div>
        </div>
    </div></body></html>`;
}

