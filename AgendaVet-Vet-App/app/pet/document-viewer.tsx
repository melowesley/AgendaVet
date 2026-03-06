import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Text, useColorScheme } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { getGenericHtml, getCarteiraVacinaHtml } from '@/lib/pdf/templates';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function DocumentViewerScreen() {
    const { historyId } = useLocalSearchParams<{ historyId: string }>();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
    const router = useRouter();

    const [htmlContent, setHtmlContent] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [documentTitle, setDocumentTitle] = useState('Documento');

    useEffect(() => {
        loadDocument();
    }, [historyId]);

    const loadDocument = async () => {
        if (!historyId) return;
        try {
            // Buscamos o histórico
            const { data: history, error: hError } = await supabase
                .from('pet_admin_history')
                .select('*, pets(name, type, breed, sex, profiles(full_name))')
                .eq('id', historyId)
                .single();

            if (hError || !history) throw hError || new Error('Documento não encontrado.');

            const details = typeof history.details === 'string' ? JSON.parse(history.details) : history.details || {};
            const pet = history.pets;

            // Montando o data object esperado pelos templates HTML
            const docData = {
                petName: pet?.name,
                petSpecies: pet?.type === 'cat' ? 'Felino' : 'Canino',
                petBreed: pet?.breed || 'SRD',
                ownerName: pet?.profiles?.full_name || 'Desconhecido',
                veterinarian: details.veterinario || details.veterinarian || details.responsavel || 'Clínica AgendaVet',
                dateOfIssue: new Date(history.created_at).toLocaleDateString('pt-BR'),
                crmv: details.crmv || '',
                details: details // Usado pelo generic render
            };

            setDocumentTitle(history.title || 'Documento do Paciente');

            // Define o título e subtítulo limpo para o layout print
            let tituloLayout = history.title || 'Registro Clínico';
            let subtituloLayout = 'Procedimento do Sistema';

            if (history.module === 'documento') {
                tituloLayout = details.titulo || history.title;
                subtituloLayout = details.tipo || 'Documento Clínico';
            } else {
                subtituloLayout = history.module ? history.module.replace('_', ' ').toUpperCase() : 'REGISTRO';
            }

            let html = '';
            if (history.module === 'vacina') {
                html = getCarteiraVacinaHtml(docData, pet?.sex);
            } else {
                html = getGenericHtml(docData, tituloLayout, subtituloLayout);
            }

            setHtmlContent(html);

        } catch (error: any) {
            Alert.alert('Erro', 'Não foi possível carregar o documento.');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handleShare = async () => {
        if (!htmlContent) return;
        try {
            const { uri } = await Print.printToFileAsync({
                html: htmlContent,
                base64: false
            });
            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
                await Sharing.shareAsync(uri, {
                    UTI: '.pdf',
                    mimeType: 'application/pdf',
                    dialogTitle: 'Compartilhar Documento'
                });
            }
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível compartilhar o documento.');
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen
                options={{
                    title: documentTitle,
                    headerStyle: { backgroundColor: theme.background },
                    headerShadowVisible: false,
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 12 }}>
                            <Ionicons name="close" size={26} color={theme.text} />
                        </TouchableOpacity>
                    ),
                    headerRight: () => (
                        <TouchableOpacity onPress={handleShare} style={{ paddingLeft: 12 }} disabled={loading}>
                            <Ionicons name="share-outline" size={24} color={theme.primary} />
                        </TouchableOpacity>
                    )
                }}
            />

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={{ marginTop: 16, color: theme.textMuted }}>Carregando documento...</Text>
                </View>
            ) : (
                <View style={styles.webContainer}>
                    <WebView
                        source={{ html: htmlContent }}
                        style={styles.webview}
                        originWhitelist={['*']}
                        scalesPageToFit={true}
                    />
                </View>
            )}

            {!loading && (
                <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
                    <TouchableOpacity style={[styles.printBtn, { backgroundColor: theme.primary }]} onPress={handleShare}>
                        <Ionicons name="print-outline" size={20} color="white" style={{ marginRight: 8 }} />
                        <Text style={styles.printBtnText}>Imprimir / Compartilhar</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    webContainer: {
        flex: 1,
        margin: 16,
        borderRadius: 16,
        overflow: 'hidden',
        // Sombra leve para o box de documento
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    webview: { flex: 1, backgroundColor: 'transparent' },
    footer: {
        padding: 16,
        paddingBottom: 34,
        borderTopWidth: 1,
        alignItems: 'center'
    },
    printBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: 56,
        borderRadius: 16,
    },
    printBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700'
    }
});
