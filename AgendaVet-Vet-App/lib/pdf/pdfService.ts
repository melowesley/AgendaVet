import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { getReceitaHtml } from './templates';
import { Platform } from 'react-native';

export const gerarECompartilharPDF = async (data: any, tipo: 'simples' | 'controle') => {
    try {
        const html = getReceitaHtml(data, tipo);

        // Setup via text
        let htmlContent = html.replace('<!--VIA_PLACEHOLDER-->', tipo === 'controle' ? '1ª Via - Retenção da Farmácia' : 'Via do Paciente');

        if (tipo === 'controle') {
            const htmlVia2 = html.replace('<!--VIA_PLACEHOLDER-->', '2ª Via - Orientação ao Paciente');
            htmlContent = `
                ${htmlContent}
                <div style="page-break-before: always;"></div>
                ${htmlVia2}
            `;
        }

        const { uri } = await Print.printToFileAsync({
            html: htmlContent,
            base64: false
        });

        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
            await Sharing.shareAsync(uri, {
                UTI: '.pdf',
                mimeType: 'application/pdf',
                dialogTitle: 'Compartilhar Receita'
            });
        }
        return true;
    } catch (e: any) {
        console.error('Erro ao gerar PDF', e);
        throw e;
    }
}
