import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { generateAttendancePdfHtml, PdfData } from './pdfTemplate';

export async function printAttendancePdf(data: PdfData) {
    const html = generateAttendancePdfHtml(data);
    try {
        const { uri } = await Print.printToFileAsync({
            html,
        });

        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri, {
                mimeType: 'application/pdf',
                UTI: 'com.adobe.pdf',
            });
        } else {
            Alert.alert('PDF gerado', `Arquivo salvo em: ${uri}`);
        }
    } catch (error: any) {
        if (error?.message?.includes('cancel')) return;
        Alert.alert('Erro', 'Falha ao gerar PDF: ' + (error?.message || ''));
    }
}
