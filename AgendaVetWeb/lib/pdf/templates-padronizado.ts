// ==========================================================
// PDF Templates — Layout Premium AgendaVet (Padronizado)
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

// ==========================================================
// ESTILOS PADRÕES AGENDAVET (Baseado na Imagem 1)
// ==========================================================

export const AGENDAVET_STYLES = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    @page { 
        size: A4; 
        margin: 15mm;
    }
    * { 
        box-sizing: border-box; 
        margin: 0; 
        padding: 0; 
    }
    body { 
        font-family: 'Inter', Arial, sans-serif; 
        font-size: 11pt; 
        color: #1E293B; 
        background: #fff; 
        line-height: 1.5;
    }
    .page { 
        width: 100%; 
        min-height: 260mm; 
        display: flex; 
        flex-direction: column;
    }
    
    /* Header Premium */
    .header { 
        display: flex; 
        align-items: center; 
        justify-content: space-between; 
        margin-bottom: 25px; 
        padding-bottom: 20px; 
        border-bottom: 2px solid #0EA5E9; 
    }
    .brand { 
        display: flex; 
        align-items: center; 
        gap: 20px; 
    }
    .logo-symbol { 
        width: 60px; 
        height: 60px; 
        background: linear-gradient(135deg, #0EA5E9 0%, #1D4ED8 100%); 
        border-radius: 16px; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        color: white; 
        font-weight: 800; 
        font-size: 28px; 
        box-shadow: 0 8px 24px rgba(14, 165, 233, 0.15);
    }
    .vet-info { 
        display: flex; 
        flex-direction: column; 
    }
    .vet-name { 
        font-size: 18pt; 
        font-weight: 800; 
        color: #0F172A; 
        margin-bottom: 4px;
    }
    .vet-crmv { 
        font-size: 10pt; 
        color: #64748B; 
        font-weight: 600; 
        letter-spacing: 0.5px;
    }
    .doc-type { 
        text-align: right; 
    }
    .doc-title { 
        font-size: 20pt; 
        font-weight: 900; 
        color: #0EA5E9; 
        text-transform: uppercase; 
        letter-spacing: -0.5px; 
        margin-bottom: 4px;
    }
    .doc-subtitle { 
        font-size: 11pt; 
        color: #64748B; 
        font-weight: 600; 
        text-transform: uppercase; 
        margin-top: 2px;
    }

    /* Content Cards */
    .info-grid { 
        display: grid; 
        grid-template-columns: 1fr 1fr; 
        gap: 24px; 
        margin-bottom: 30px; 
    }
    .info-card { 
        background: #F8FAFC; 
        border: 1px solid #E2E8F0; 
        border-radius: 16px; 
        padding: 20px; 
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
    .card-label { 
        font-size: 9pt; 
        font-weight: 700; 
        color: #64748B; 
        text-transform: uppercase; 
        letter-spacing: 0.5px; 
        margin-bottom: 10px; 
        border-bottom: 2px solid #0EA5E9; 
        padding-bottom: 6px; 
        display: block;
    }
    .field { 
        margin-bottom: 8px; 
        display: flex; 
        gap: 8px; 
    }
    .label { 
        font-weight: 600; 
        font-size: 10pt; 
        color: #475569; 
        min-width: 80px;
    }
    .value { 
        font-weight: 500; 
        font-size: 11pt; 
        color: #1E293B; 
        flex: 1; 
        border-bottom: 1px solid transparent; 
    }

    /* Content Area */
    .content-box { 
        flex: 1; 
        border: 2px solid #E2E8F0; 
        border-radius: 20px; 
        padding: 30px; 
        margin-bottom: 30px; 
        position: relative; 
        background: #fff; 
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    }
    .content-label { 
        position: absolute; 
        top: -14px; 
        left: 30px; 
        background: #fff; 
        padding: 4px 12px; 
        font-size: 9pt; 
        font-weight: 800; 
        color: #0EA5E9; 
        text-transform: uppercase; 
        letter-spacing: 0.5px; 
        border-radius: 8px 8px 0 8px;
    }
    .prescription-text { 
        font-size: 12pt; 
        line-height: 1.8; 
        color: #334155; 
        white-space: pre-wrap; 
        font-weight: 400;
    }

    /* Footer */
    .footer { 
        display: flex; 
        justify-content: space-between; 
        align-items: flex-end; 
        padding-top: 30px; 
        border-top: 1px solid #E2E8F0; 
        margin-top: auto;
    }
    .footer-left { 
        font-size: 10pt; 
        color: #64748B; 
        font-weight: 500; 
        max-width: 300px;
    }
    .footer-right { 
        text-align: center; 
        width: 280px;
    }
    .sig-line { 
        border-top: 2px solid #0F172A; 
        margin-bottom: 8px;
    }
    .sig-name { 
        font-weight: 700; 
        font-size: 12pt; 
        color: #0F172A;
    }
    .sig-sub { 
        font-size: 9pt; 
        color: #64748B; 
        font-weight: 600;
    }
`;

// ==========================================================
// FUNÇÕES DE GERAÇÃO (Padronizadas)
// ==========================================================

function gerarReceitaSimples(data: any): string {
    return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
    <style>${AGENDAVET_STYLES}</style></head><body><div class="page">
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
                <div class="doc-subtitle">Receita Veterinária</div>
            </div>
        </div>

        <div class="info-grid">
            <div class="info-card">
                <span class="card-label">Identificação do Paciente</span>
                <div class="field"><span class="label">Animal:</span> <span class="value">${data.petName || ''}</span></div>
                <div style="display:flex; gap:12px">
                    <div class="field" style="flex:1"><span class="label">Espécie:</span> <span class="value">${data.petSpecies || ''}</span></div>
                    <div class="field" style="flex:1"><span class="label">Raça:</span> <span class="value">${data.petBreed || ''}</span></div>
                </div>
                <div style="display:flex; gap:12px">
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
                <div class="sig-sub">Médico Veterinário & CRMV: ${data.crmv || ''}</div>
            </div>
        </div>
    </div></body></html>`;
}

function gerarControleEspecial(data: any): string {
    const controlledStyles = `
        ${AGENDAVET_STYLES}
        .header { margin-bottom: 20px; }
        .doc-title { font-size: 16pt; }
        .content-box { min-height: 100mm; max-height: 120mm; }
        .form-field { border-bottom: 1px solid #CBD5E1; height: 20px; margin-top: 4px; }
        .sub-label { font-size: 8pt; color: #64748B; font-weight: 700; text-transform: uppercase; }
        .special-footer { 
            border: 1px solid #E2E8F0; 
            border-radius: 16px; 
            padding: 20px; 
            background: #F8FAFC; 
            margin-top: 15px; 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 24px; 
        }
    `;

    return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
    <style>${controlledStyles}</style></head><body><div class="page">
        <div class="header">
            <div class="brand">
                <div class="logo-symbol">V</div>
                <div class="vet-info">
                    <span class="vet-name">${data.veterinarian || ''}</span>
                    <span class="vet-crmv">Médico Veterinário • CRMV: ${data.crmv || ''}</span>
                    <span style="font-size:9pt; color:#64748B">${data.vetAddress || ''} • ${data.vetPhone || ''}</span>
                </div>
            </div>
            <div class="doc-type">
                <div class="doc-title">Controle Especial</div>
                <div class="doc-subtitle">Receita Veterinária Controlada</div>
                <div style="font-size:8pt; font-weight:800; color:#EF4444; margin-top:4px"><!--VIA_PLACEHOLDER--></div>
            </div>
        </div>

        <div class="info-grid">
            <div class="info-card">
                <span class="card-label">Dados do Paciente</span>
                <div class="field"><span class="label">Animal:</span> <span class="value">${data.petName || ''}</span></div>
                <div style="display:flex; gap:12px">
                    <div class="field" style="flex:1"><span class="label">Espécie/Raça:</span> <span class="value">${data.petSpecies || ''} / ${data.petBreed || ''}</span></div>
                </div>
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

        <div class="footer" style="padding-bottom:15px;">
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
                <div style="margin-bottom:10px;"><div class="form-field"></div><span class="sub-label">Assinatura do Comprador</span></div>
                <div style="margin-bottom:10px;"><div class="form-field"></div><span class="sub-label">Endereço Completo</span></div>
            </div>
            <div>
                <span class="card-label">Identificação do Fornecedor</span>
                <div style="margin-bottom:10px;"><div class="form-field"></div><span class="sub-label">Assinatura do Farmacêutico</span></div>
                <div style="display:flex; gap:10px;">
                    <div style="flex:1.;"><div class="form-field"></div><span class="sub-label">Lote</span></div>
                    <div style="flex:1.;"><div class="form-field"></div><span class="sub-label">Quantidade</span></div>
                </div>
            </div>
        </div>
    </div></body></html>`;
}

function gerarCarteiraVacina(data: any, petSex?: 'male' | 'female' | string): string {
    const isFemale = petSex === 'female' || petSex?.toLowerCase() === 'fêmea';
    const primaryColor = isFemale ? '#DB2777' : '#0284C7'; // Rosa Feminino / Azul Masculino
    const lightBg = isFemale ? '#FDF2F8' : '#F0F9FF'; // Rosa-50 / Azul-50
    const borderAccent = isFemale ? '#FBCFE8' : '#BFDBFE'; // Rosa-200 / Azul-200

    const customStyles = `
        ${AGENDAVET_STYLES}
        .passport-header { 
            background: ${lightBg}; 
            border: 2px solid ${borderAccent}; 
            border-radius: 20px; 
            padding: 30px; 
            margin-bottom: 30px; 
            display: flex; 
            align-items: center; 
            justify-content: space-between; 
        }
        .pet-badge { 
            display: flex; 
            align-items: center; 
            gap: 24px; 
        }
        .pet-avatar { 
            width: 90px; 
            height: 90px; 
            border-radius: 50px; 
            background: ${primaryColor}; 
            color: white; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-size: 36px; 
            font-weight: 900; 
            box-shadow: 0 8px 24px ${primaryColor}40; 
            letter-spacing: -2px;
        }
        .pet-name { 
            font-size: 26pt; 
            font-weight: 900; 
            color: #0F172A; 
            text-transform: uppercase; 
            letter-spacing: -1px; 
            margin-bottom: 6px;
        }
        .pet-meta { 
            font-size: 12pt; 
            color: #64748B; 
            font-weight: 600;
        }
        
        .seal { 
            text-align: right; 
        }
        .seal-title { 
            font-size: 16pt; 
            font-weight: 800; 
            color: ${primaryColor}; 
            text-transform: uppercase; 
            letter-spacing: 1px; 
            margin-bottom: 4px;
        }
        .seal-sub { 
            font-size: 10pt; 
            color: #64748B; 
            font-weight: 600; 
            margin-top: 4px;
        }
        
        .vaccine-card { 
            border: 2px solid ${primaryColor}; 
            border-radius: 20px; 
            padding: 25px; 
            margin-bottom: 30px; 
            position: relative; 
            background: #fff;
        }
        .vaccine-title { 
            font-size: 20pt; 
            font-weight: 900; 
            color: #0F172A; 
            margin-bottom: 20px; 
            padding-bottom: 15px; 
            border-bottom: 1px dashed ${borderAccent};
        }
        
        .grid-3 { 
            display: grid; 
            grid-template-columns: 1fr 1fr 1fr; 
            gap: 20px; 
            margin-bottom: 20px; 
        }
        .grid-2 { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 20px; 
        }
        
        .v-box { 
            background: #F8FAFC; 
            padding: 16px 20px; 
            border-radius: 16px; 
            border: 1px solid #E2E8F0; 
        }
        .v-label { 
            font-size: 8pt; 
            font-weight: 800; 
            color: #64748B; 
            text-transform: uppercase; 
            letter-spacing: 0.5px; 
            margin-bottom: 6px;
        }
        .v-value { 
            font-size: 12pt; 
            font-weight: 700; 
            color: #1E293B;
        }
        
        .next-dose-card { 
            background: ${primaryColor}; 
            border-radius: 20px; 
            padding: 24px; 
            color: white; 
            display: flex; 
            align-items: center; 
            justify-content: space-between; 
            box-shadow: 0 12px 24px ${primaryColor}40; 
            margin-bottom: 30px; 
        }
        .nd-label { 
            font-size: 11pt; 
            font-weight: 700; 
            text-transform: uppercase; 
            opacity: 0.9; 
            letter-spacing: 1px; 
            margin-bottom: 6px;
        }
        .nd-date { 
            font-size: 26pt; 
            font-weight: 900; 
            letter-spacing: -0.5px; 
        }
        .nd-icon { 
            width: 56px; 
            height: 56px; 
            border-radius: 28px; 
            background: rgba(255,255,255,0.2); 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-size: 28px; 
        }
    `;

    const details = data.details || {};
    const nomeVacina = details.nomeVacina || 'Vacina/Medicação';
    const fabricante = details.fabricante || '---';
    const lote = details.lote || '---';
    const validade = details.validade || '---';
    const dose = details.dose || '---';
    const viaAdm = details.viaAdm || '---';
    const proximaDose = details.proximaDose;
    const notes = details.observacoes || '';

    return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
    <style>${customStyles}</style></head><body><div class="page">
        <div class="header" style="border-bottom: none; margin-bottom: 15px; padding-bottom:0;">
            <div class="brand">
                <div class="logo-symbol" style="background: ${primaryColor}; width: 50px; height: 50px; font-size: 22px;">V</div>
                <div class="vet-info">
                    <span class="vet-name">${data.veterinarian || ''}</span>
                    <span class="vet-crmv">${data.crmv ? 'Médico Veterinário • CRMV: ' + data.crmv : 'Profissional Responsável'}</span>
                </div>
            </div>
            <div class="doc-type">
                <div class="doc-title">Carteira de Vacinação</div>
                <div class="doc-subtitle">Passaporte Sanitário Animal</div>
            </div>
        </div>

        <div class="passport-header">
            <div class="pet-badge">
                <div class="pet-avatar">${isFemale ? '🐱' : '🐕'}</div>
                <div>
                    <div class="pet-name">${data.petName || ''}</div>
                    <div class="pet-meta">${data.petSpecies || ''} • ${data.petBreed || ''}</div>
                </div>
            </div>
            <div class="seal">
                <div class="seal-title">CARTEIRA DE VACINAÇÃO</div>
                <div class="seal-sub">Documento Oficial • Sistema AgendaVet</div>
            </div>
        </div>

        <div class="vaccine-card">
            <div class="vaccine-title">${nomeVacina}</div>
            
            <div class="grid-3">
                <div class="v-box">
                    <div class="v-label">Fabricante</div>
                    <div class="v-value">${fabricante}</div>
                </div>
                <div class="v-box">
                    <div class="v-label">Lote</div>
                    <div class="v-value">${lote}</div>
                </div>
                <div class="v-box">
                    <div class="v-label">Validade</div>
                    <div class="v-value">${validade}</div>
                </div>
            </div>

            <div class="grid-2">
                <div class="v-box">
                    <div class="v-label">Dose</div>
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
            <div class="nd-icon">⚠️</div>
        </div>
        ` : ''}

        <div class="content-box" style="flex: none; min-height: 140px;">
            <span class="content-label" style="color: ${primaryColor};">Observações Clínicas</span>
            <div class="prescription-text" style="font-size: 12pt;">${notes || `<span style="color: #94A3B8; font-style:italic;">Nenhuma observação registrada para esta aplicação.</span>`}</div>
            ${details.reacao ? `<div style="margin-top: 20px; padding: 16px; border-radius: 12px; background: #FEF2F2; border: 1px solid #FECACA; color: #991B1B; font-weight: 600; font-size: 11pt;">⚠️ Relato de Intercorrência: ${details.descReacao || 'Reação não descrita.'}</div>` : ''}
        </div>

        <div style="flex: 1.;"></div>

        <div class="footer">
            <div class="footer-left">Autenticado pelo Sistema Médico Veterinário<br>Gerado em: ${new Date().toLocaleDateString('pt-BR')}</div>
            <div class="footer-right">
                <div class="sig-line"></div>
                <div class="sig-name" style="font-size: 11pt;">${data.veterinarian || 'Responsável Técnico'}</div>
                <div class="sig-sub">${data.crmv ? 'CRMV: ' + data.crmv : 'Assinatura Digital'}</div>
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
            <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px dashed #E2E8F0;">
                <div style="font-size: 10pt; font-weight: 700; color: #64748B; text-transform: uppercase; margin-bottom: 6px;">${formattedKey}</div>
                <div style="font-size: 12pt; color: #1E293B; white-space: pre-wrap;">${value}</div>
            </div>
        `;
    }).join('');

    return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
    <style>${AGENDAVET_STYLES}</style></head><body><div class="page">
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
                <div style="display:flex; flex-wrap: wrap; gap:20px;">
                    <div class="field" style="min-width:220px;"><span class="label">Animal:</span> <span class="value">${data.petName || '---'}</span></div>
                    <div class="field" style="min-width:180px;"><span class="label">Espécie:</span> <span class="value">${data.petSpecies || '---'}</span></div>
                    <div class="field" style="min-width:180px;"><span class="label">Raça:</span> <span class="value">${data.petBreed || '---'}</span></div>
                    <div class="field" style="min-width:180px;"><span class="label">Tutor:</span> <span class="value">${data.ownerName || '---'}</span></div>
                    <div class="field" style="min-width:180px;"><span class="label">Idade:</span> <span class="value">${data.petAge || '---'}</span></div>
                    <div class="field" style="min-width:180px;"><span class="label">Sexo:</span> <span class="value">${data.petSex || '---'}</span></div>
                </div>
            </div>
        </div>

        <div class="content-box">
            <span class="content-label">Detalhes do Registro</span>
            <div style="margin-top: 16px;">
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
