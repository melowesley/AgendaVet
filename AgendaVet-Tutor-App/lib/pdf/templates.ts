// ==========================================================
// PDF Templates — Layout Premium AgendaVet
// ==========================================================

export const getReceitaHtml = (data: any, tipo: 'simples' | 'controle'): string => {
    const isControlado = tipo === 'controle';
    if (isControlado) return gerarControleEspecial(data);
    return gerarReceitaSimples(data);
};

export const getGenericHtml = (data: any, title: string, subtitle: string): string => {
    return gerarDocumentoGenerico(data, title, subtitle);
};

export const getCarteiraVacinaHtml = (data: any, petSex?: 'male' | 'female' | string): string => {
    return gerarCarteiraVacina(data, petSex);
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

function gerarDocumentoGenerico(data: any, title: string, subtitle: string): string {
    // Generate rows for any unknown details in data.details
    const detailRows = Object.entries(data.details || {}).map(([key, value]) => {
        // Skip some known redundant keys or empty values
        if (!value || typeof value === 'object' || key === 'titulo' || key === 'tipo' || key === 'veterinario') return '';

        const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        return `
            <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px dashed #E2E8F0;">
                <div style="font-size: 8pt; font-weight: 700; color: #64748B; text-transform: uppercase; margin-bottom: 4px;">${formattedKey}</div>
                <div style="font-size: 11pt; color: #1E293B; white-space: pre-wrap;">${value}</div>
            </div>
        `;
    }).join('');

    return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
    <style>${COMMON_STYLES}</style></head><body><div class="page">
        <div class="header">
            <div class="brand">
                <div class="logo-symbol">V</div>
                <div class="vet-info">
                    <span class="vet-name">${data.veterinarian || ''}</span>
                    <span class="vet-crmv">${data.crmv ? 'Médico Veterinário • CRMV: ' + data.crmv : 'Profissional Responsável'}</span>
                </div>
            </div>
            <div class="doc-type">
                <div class="doc-title">${title}</div>
                <div class="doc-subtitle">${subtitle}</div>
            </div>
        </div>

        <div class="info-grid" style="grid-template-columns: 1fr;">
            <div class="info-card">
                <span class="card-label">Identificação do Paciente</span>
                <div style="display:flex; flex-wrap: wrap; gap:15px">
                    <div class="field" style="min-width: 200px"><span class="label">Animal:</span> <span class="value">${data.petName || '---'}</span></div>
                    <div class="field" style="min-width: 150px"><span class="label">Espécie:</span> <span class="value">${data.petSpecies || '---'}</span></div>
                    <div class="field" style="min-width: 150px"><span class="label">Raça:</span> <span class="value">${data.petBreed || '---'}</span></div>
                    <div class="field" style="min-width: 150px"><span class="label">Tutor:</span> <span class="value">${data.ownerName || '---'}</span></div>
                </div>
            </div>
        </div>

        <div class="content-box">
            <span class="content-label">Detalhes do Registro</span>
            <div style="margin-top: 10px;">
                ${detailRows || '<div style="color: #64748B; font-style: italic;">Nenhum detalhe adicional registrado no sistema.</div>'}
            </div>
        </div>

        <div class="footer">
            <div class="footer-left">Registro de Sistema — Gerado em: ${data.dateOfIssue || new Date().toLocaleDateString('pt-BR')}</div>
            <div class="footer-right">
                <div class="sig-line"></div>
                <div class="sig-name">${data.veterinarian || 'Responsável Técnico'}</div>
                <div class="sig-sub">${data.crmv ? 'CRMV: ' + data.crmv : 'Assinatura Digital'}</div>
            </div>
        </div>
    </div></body></html>`;
}

function gerarCarteiraVacina(data: any, petSex?: 'male' | 'female' | string): string {
    const isFemale = petSex === 'female' || petSex?.toLowerCase() === 'fêmea';
    const primaryColor = isFemale ? '#DB2777' : '#0284C7'; // Pink for female, Sky Blue for male
    const lightBg = isFemale ? '#FDF2F8' : '#F0F9FF'; // Pink-50 / Sky-50
    const borderAccent = isFemale ? '#FBCFE8' : '#BAE6FD'; // Pink-200 / Sky-200

    const details = data.details || {};
    const nomeVacina = details.nomeVacina || 'Vacina/Medicação';
    const fabricante = details.fabricante || '---';
    const lote = details.lote || '---';
    const validade = details.validade || '---';
    const dose = details.dose || '---';
    const viaAdm = details.viaAdm || '---';
    const proximaDose = details.proximaDose;
    const notes = details.observacoes || '';

    const customStyles = `
        ${COMMON_STYLES}
        .passport-header { background: ${lightBg}; border: 1px solid ${borderAccent}; border-radius: 20px; padding: 25px; margin-bottom: 30px; display: flex; align-items: center; justify-content: space-between; }
        .pet-badge { display: flex; align-items: center; gap: 20px; }
        .pet-avatar { width: 80px; height: 80px; border-radius: 40px; background: ${primaryColor}; color: white; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 900; box-shadow: 0 4px 12px ${primaryColor}40; letter-spacing: -1px; }
        .pet-name { font-size: 24pt; font-weight: 900; color: #0F172A; text-transform: uppercase; letter-spacing: -1px; margin-bottom: 4px; }
        .pet-meta { font-size: 11pt; color: #64748B; font-weight: 600; }
        
        .seal { text-align: right; }
        .seal-title { font-size: 14pt; font-weight: 800; color: ${primaryColor}; text-transform: uppercase; letter-spacing: 1px; }
        .seal-sub { font-size: 9pt; color: #64748B; font-weight: 600; margin-top: 4px; }
        
        .vaccine-card { border: 2px solid ${primaryColor}; border-radius: 20px; padding: 25px; margin-bottom: 30px; position: relative; }
        .vaccine-title { font-size: 18pt; font-weight: 900; color: #0F172A; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px dashed ${borderAccent}; }
        
        .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 15px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        
        .v-box { background: #F8FAFC; padding: 12px 15px; border-radius: 12px; border: 1px solid #E2E8F0; }
        .v-label { font-size: 7pt; font-weight: 800; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .v-value { font-size: 11pt; font-weight: 700; color: #1E293B; }
        
        .next-dose-card { background: ${primaryColor}; border-radius: 16px; padding: 20px; color: white; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 8px 16px ${primaryColor}40; margin-bottom: 30px; }
        .nd-label { font-size: 10pt; font-weight: 700; text-transform: uppercase; opacity: 0.9; letter-spacing: 1px; margin-bottom: 4px; }
        .nd-date { font-size: 22pt; font-weight: 900; letter-spacing: -0.5px; }
        .nd-icon { width: 48px; height: 48px; border-radius: 24px; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 24px; }
    `;

    return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
    <style>${customStyles}</style></head><body><div class="page">
        <div class="header" style="border-bottom: none; margin-bottom: 10px; padding-bottom:0;">
            <div class="brand">
                <div class="logo-symbol" style="background: ${primaryColor}; width: 40px; height: 40px; font-size: 18px;">V</div>
                <div class="vet-info">
                    <span class="vet-name" style="font-size: 14pt;">${data.veterinarian || ''}</span>
                    <span class="vet-crmv">${data.crmv ? 'CRMV: ' + data.crmv : 'Profissional Responsável'}</span>
                </div>
            </div>
            <div class="doc-type">
                <div class="doc-subtitle">Cartão de Imunização Oficial</div>
            </div>
        </div>

        <div class="passport-header">
            <div class="pet-badge">
                <div class="pet-avatar">${data.petName?.charAt(0).toUpperCase() || 'P'}</div>
                <div>
                    <div class="pet-name">${data.petName || 'Paciente'}</div>
                    <div class="pet-meta">${data.petSpecies || '---'} • ${data.petBreed || 'SRD'} • Tutor: ${data.ownerName || '---'}</div>
                </div>
            </div>
            <div class="seal">
                <div class="seal-title">Passaporte Pet</div>
                <div class="seal-sub">Registro Vitalício</div>
            </div>
        </div>

        <div class="vaccine-card">
            <div class="vaccine-title">${nomeVacina}</div>
            
            <div class="grid-3">
                <div class="v-box">
                    <div class="v-label">Data da Aplicação</div>
                    <div class="v-value">${data.dateOfIssue || '---'}</div>
                </div>
                <div class="v-box">
                    <div class="v-label">Fabricante</div>
                    <div class="v-value">${fabricante}</div>
                </div>
                <div class="v-box">
                    <div class="v-label">Lote do Produto</div>
                    <div class="v-value">${lote}</div>
                </div>
            </div>
            
            <div class="grid-3" style="margin-bottom: 0;">
                <div class="v-box">
                    <div class="v-label">Validade</div>
                    <div class="v-value">${validade}</div>
                </div>
                <div class="v-box">
                    <div class="v-label">Dose Ministrada</div>
                    <div class="v-value">${dose}</div>
                </div>
                <div class="v-box">
                    <div class="v-label">Via de Adm.</div>
                    <div class="v-value">${viaAdm}</div>
                </div>
            </div>
        </div>

        ${proximaDose ? `
        <div class="next-dose-card">
            <div>
                <div class="nd-label">Atenção: Próxima Dose / Reforço</div>
                <div class="nd-date">${proximaDose}</div>
            </div>
            <div class="nd-icon">!</div>
        </div>
        ` : ''}

        <div class="content-box" style="flex: none; min-height: 120px;">
            <span class="content-label" style="color: ${primaryColor};">Observações Clínicas</span>
            <div class="prescription-text" style="font-size: 11pt;">${notes || `<span style="color: #94A3B8; font-style:italic;">Nenhuma observação registrada para esta aplicação.</span>`}</div>
            ${details.reacao ? `<div style="margin-top: 15px; padding: 12px; border-radius: 8px; background: #FEF2F2; border: 1px solid #FECACA; color: #991B1B; font-weight: 600; font-size: 10pt;">⚠ Relato de Intercorrência: ${details.descReacao || 'Reação não descrita.'}</div>` : ''}
        </div>

        <div style="flex: 1;"></div>

        <div class="footer">
            <div class="footer-left">Autenticado pelo Sistema Médico Veterinário<br>Gerado em: ${new Date().toLocaleDateString('pt-BR')}</div>
            <div class="footer-right">
                <div class="sig-line"></div>
                <div class="sig-name" style="font-size: 10pt;">${data.veterinarian || 'Responsável Técnico'}</div>
                <div class="sig-sub">${data.crmv ? 'CRMV: ' + data.crmv : 'Assinatura Digital'}</div>
            </div>
        </div>
    </div></body></html>`;
}
