import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, useColorScheme, Platform, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import SignatureScreen from 'react-native-signature-canvas';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/theme';

export default function AssinarDocumentoScreen() {
    const { historyId } = useLocalSearchParams<{ historyId: string }>();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

    const signatureRef = useRef<any>(null);
    const [saving, setSaving] = useState(false);
    const [documentData, setDocumentData] = useState<any>(null);
    const [loadingDoc, setLoadingDoc] = useState(true);

    useEffect(() => {
        const fetchDoc = async () => {
            if (!historyId) return;
            setLoadingDoc(true);
            try {
                const { data, error } = await supabase
                    .from('pet_admin_history')
                    .select('*')
                    .eq('id', historyId)
                    .single();

                if (error) throw error;
                setDocumentData(data);
            } catch (error) {
                console.error("Erro ao puxar documento:", error);
                Alert.alert("Erro", "Não foi possível carregar os detalhes do documento.");
                router.back();
            } finally {
                setLoadingDoc(false);
            }
        };
        fetchDoc();
    }, [historyId]);

    // Quando clica em Confirmar
    const handleConfirm = () => {
        if (signatureRef.current) {
            signatureRef.current.readSignature();
        }
    };

    // Quando quer apagar o desenho
    const handleClear = () => {
        if (signatureRef.current) {
            signatureRef.current.clearSignature();
        }
    };

    // Callback ativado quando o signatureRef.current.readSignature() lê a imagem com sucesso (base64)
    const handleSignature = async (signatureBase64: string) => {
        if (!signatureBase64 || !historyId) return;
        setSaving(true);

        try {
            // No Vet App o gerador de PDF espera a imagem da assinatura em base64 (data.tutorSignature)
            // Precisamos atualizar o registro no Supabase com essa base64. 
            // Para não quebrar o formato atual, salvaremos a assinatura num campo próprio ou dentro do JSON fields.

            // Primeiro, pegamos o documento atual para preservar o json fields
            const { data: currentDoc, error: fetchErr } = await supabase
                .from('pet_admin_history')
                .select('details')
                .eq('id', historyId)
                .single();

            if (fetchErr) throw fetchErr;

            let updatedDetails = typeof currentDoc.details === 'string' ? JSON.parse(currentDoc.details) : (currentDoc.details || {});

            // 1. Converter Base64 Data URI em Blob via polyfill nativo do fetch
            const response = await fetch(signatureBase64);
            const blob = await response.blob();

            const fileName = `sig_${historyId}_${Date.now()}.png`;

            // 2. Fazer o Upload para o Storage (Supabase)
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('pet-media')
                .upload(`signatures/${fileName}`, blob, {
                    contentType: 'image/png'
                });

            if (uploadError) {
                console.error("Erro no upload do Blob:", uploadError);
                throw uploadError;
            }

            // 3. Obter a URL Pública da Imagem
            const publicUrl = supabase.storage.from('pet-media').getPublicUrl(`signatures/${fileName}`).data.publicUrl;

            // 4. Salvar no histórico
            updatedDetails.status = 'finalized';
            updatedDetails.tutorSignature = publicUrl; // A URL substitui o grande Base64

            const { error: updateErr } = await supabase
                .from('pet_admin_history')
                .update({
                    details: updatedDetails
                })
                .eq('id', historyId);

            if (updateErr) throw updateErr;

            Alert.alert(
                "Concluído!",
                "Sua assinatura foi salva com sucesso e o documento digitalizado será atualizado no aplicativo da clínica.",
                [{ text: "OK", onPress: () => router.back() }]
            );

        } catch (error: any) {
            console.error("Erro ao salvar assinatura:", error);
            Alert.alert("Erro", "Não foi possível salvar a assinatura: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loadingDoc) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={{ marginTop: 10, color: theme.textSecondary }}>Preparando Canvas...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.screen, { backgroundColor: theme.background }]}>
            <Stack.Screen
                options={{
                    title: "Assinar Documento",
                    headerBackTitle: "Cancelar",
                    headerTintColor: theme.primary,
                }}
            />

            <ScrollView contentContainerStyle={styles.content}>

                <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Ionicons name="information-circle-outline" size={24} color={theme.primary} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[styles.infoTitle, { color: theme.text }]}>Instruções para Assinatura</Text>
                        <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                            Este documento requer o consentimento do tutor responsável. Desenhe sua rubrica ou assinatura no espaço abaixo usando o dedo.
                        </Text>
                        <View style={{ marginTop: 8, padding: 8, backgroundColor: theme.primary + '15', borderRadius: 8 }}>
                            <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700' }}>📄 {documentData?.title || 'Documento Veterinário'}</Text>
                        </View>
                    </View>
                </View>

                <View style={[styles.canvasWrapper, { borderColor: theme.border, backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#F8FAFC' }]}>
                    <SignatureScreen
                        ref={signatureRef}
                        onOK={handleSignature}
                        onEmpty={() => Alert.alert("Atenção", "Por favor, desenhe sua assinatura antes de confirmar.")}
                        descriptionText="Assine acima"
                        clearText="Limpar"
                        confirmText="Salvar"
                        webStyle={`.m-signature-pad--footer {display: none; margin: 0px;} body,html {width: 100%; height: 100%; background-color: ${colorScheme === 'dark' ? '#1E293B' : '#F8FAFC'};}`}
                        penColor={colorScheme === 'dark' ? '#FFFFFF' : '#0F172A'}
                    />
                </View>

                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={[styles.btnOutline, { borderColor: theme.border, backgroundColor: theme.surface }]}
                        onPress={handleClear}
                        disabled={saving}
                    >
                        <Ionicons name="trash-outline" size={20} color={theme.textSecondary} />
                        <Text style={[styles.btnOutlineText, { color: theme.textSecondary }]}>Apagar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.btnSolid, { backgroundColor: theme.primary, opacity: saving ? 0.7 : 1 }]}
                        onPress={handleConfirm}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                                <Text style={styles.btnSolidText}>Confirmar e Salvar</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    content: { padding: 20, paddingBottom: 60 },

    infoCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 20,
    },
    infoTitle: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
    infoText: { fontSize: 13, lineHeight: 20 },

    canvasWrapper: {
        height: 300,
        borderRadius: 16,
        borderWidth: 2,
        overflow: 'hidden',
        marginBottom: 20,
        backgroundColor: 'white',
        ...Platform.select({
            ios: { elevation: 4 },
            android: { elevation: 4 },
        })
    },

    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    btnOutline: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 56,
        borderWidth: 1,
        borderRadius: 12,
    },
    btnOutlineText: { fontSize: 15, fontWeight: '700' },

    btnSolid: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 56,
        borderRadius: 12,
    },
    btnSolidText: { fontSize: 16, fontWeight: '800', color: 'white' }
});
