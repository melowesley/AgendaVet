import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';
import { generateAttendancePdfHtml, type PdfData } from './pdfTemplate';

export async function printAttendancePdf(data: PdfData) {
  const html = generateAttendancePdfHtml(data);

  try {
    if (Platform.OS === 'ios') {
      await Print.printAsync({ html });
    } else {
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
      } else {
        Alert.alert('PDF gerado', `Arquivo salvo em: ${uri}`);
      }
    }
  } catch (e: any) {
    if (e?.message?.includes('cancel')) return;
    Alert.alert('Erro', 'Falha ao gerar PDF: ' + (e?.message || ''));
  }
}
