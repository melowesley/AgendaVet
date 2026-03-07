import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors } from '../../constants/theme';
import { useColorScheme } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function PagamentoScreen() {
    const { invoiceId, petId } = useLocalSearchParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
    const styles = getStyles(theme);
    const insets = useSafeAreaInsets();

    const [selectedMethod, setSelectedMethod] = useState<'pix' | 'cash' | 'card' | null>(null);
    const [receiptImage, setReceiptImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data: invoice, isLoading } = useQuery({
        queryKey: ['invoice', invoiceId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('invoices')
                .select('*, invoice_items(*)')
                .eq('id', invoiceId)
                .single();
            if (error) throw error;
            return data;
        }
    });

    const handlePickReceipt = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            setReceiptImage(result.assets[0]);
        }
    };

    const handleConfirmPayment = async () => {
        if (!selectedMethod) {
            Alert.alert('Erro', 'Selecione um método de pagamento.');
            return;
        }

        setIsSubmitting(true);
        try {
            let receiptUrl = null;

            if (receiptImage) {
                const response = await fetch(receiptImage.uri);
                const blob = await response.blob();
                const fileExt = receiptImage.uri.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `receipts/${invoiceId}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('medical_records') // Reusing the same bucket for simplicity or use a 'receipts' bucket if exists
                    .upload(filePath, blob, {
                        contentType: receiptImage.type === 'image' ? 'image/jpeg' : 'application/pdf'
                    });

                if (uploadError) {
                    console.error('Upload info:', uploadError);
                    // Just proceed without it or throw. We'll proceed if it's RLS issue, it might fail.
                    // But we should throw ideally.
                    throw new Error('Falha ao fazer upload do comprovante. ' + uploadError.message);
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('medical_records')
                    .getPublicUrl(filePath);

                receiptUrl = publicUrl;
            }

            const { error } = await supabase
                .from('invoices')
                .update({
                    status: 'paid',
                    payment_method: selectedMethod,
                    receipt_url: receiptUrl,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', invoiceId);

            if (error) throw error;

            // Registrar na timeline do pet
            await supabase.from('pet_history').insert({
                pet_id: petId,
                module: 'cobranca',
                title: 'Pagamento Confirmado',
                description: `Fatura de R$ ${invoice?.total_amount.toFixed(2)} paga via ${selectedMethod.toUpperCase()}`,
                date: new Date().toISOString().split('T')[0]
            });

            Alert.alert('Sucesso', 'Pagamento registrado com sucesso!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
            queryClient.invalidateQueries({ queryKey: ['pet_history', petId] });
            queryClient.invalidateQueries({ queryKey: ['invoices'] });

        } catch (error: any) {
            Alert.alert('Erro', 'Falha ao registrar pagamento: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <Stack.Screen options={{
                headerShown: true,
                title: 'Receber Pagamento',
                headerStyle: { backgroundColor: theme.surface },
                headerTintColor: theme.text,
                headerShadowVisible: false,
            }} />

            <ScrollView contentContainerStyle={styles.scrollContent}>

                <View style={styles.amountCard}>
                    <Text style={styles.amountLabel}>Valor Total a Receber</Text>
                    <Text style={styles.amountValue}>R$ {invoice?.total_amount?.toFixed(2)}</Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>PENDENTE</Text>
                    </View>
                </View>

                {invoice?.invoice_items && invoice.invoice_items.length > 0 && (
                    <View style={styles.itemsCard}>
                        <Text style={styles.sectionTitle}>Resumo da Fatura</Text>
                        {invoice.invoice_items.map((item: any, idx: number) => (
                            <View key={idx} style={styles.summaryItem}>
                                <Text style={styles.summaryItemName}>{item.description}</Text>
                                <Text style={styles.summaryItemPrice}>R$ {item.unit_price.toFixed(2)}</Text>
                            </View>
                        ))}
                    </View>
                )}

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Método de Pagamento</Text>
                    <View style={styles.methodsRow}>
                        <TouchableOpacity
                            style={[styles.methodBtn, selectedMethod === 'pix' && styles.methodBtnSelected]}
                            onPress={() => setSelectedMethod('pix')}
                        >
                            <Ionicons name="qr-code-outline" size={24} color={selectedMethod === 'pix' ? theme.primary : theme.textSecondary} />
                            <Text style={[styles.methodText, selectedMethod === 'pix' && styles.methodTextSelected]}>Pix</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.methodBtn, selectedMethod === 'card' && styles.methodBtnSelected]}
                            onPress={() => setSelectedMethod('card')}
                        >
                            <Ionicons name="card-outline" size={24} color={selectedMethod === 'card' ? theme.primary : theme.textSecondary} />
                            <Text style={[styles.methodText, selectedMethod === 'card' && styles.methodTextSelected]}>Cartão</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.methodBtn, selectedMethod === 'cash' && styles.methodBtnSelected]}
                            onPress={() => setSelectedMethod('cash')}
                        >
                            <Ionicons name="cash-outline" size={24} color={selectedMethod === 'cash' ? theme.primary : theme.textSecondary} />
                            <Text style={[styles.methodText, selectedMethod === 'cash' && styles.methodTextSelected]}>Dinheiro</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {(selectedMethod === 'pix' || selectedMethod === 'cash') && (
                    <View style={[styles.card, { marginTop: 16 }]}>
                        <Text style={styles.sectionTitle}>Anexar Comprovante (Opcional)</Text>
                        <TouchableOpacity style={styles.uploadArea} onPress={handlePickReceipt}>
                            {receiptImage ? (
                                <View style={{ alignItems: 'center' }}>
                                    <Image source={{ uri: receiptImage.uri }} style={{ width: 100, height: 100, borderRadius: 12, marginBottom: 12 }} />
                                    <Text style={{ color: theme.primary, fontWeight: '600' }}>Trocar Imagem</Text>
                                </View>
                            ) : (
                                <>
                                    <View style={styles.uploadIconWrap}>
                                        <Ionicons name="cloud-upload-outline" size={24} color={theme.primary} />
                                    </View>
                                    <Text style={styles.uploadText}>Toque para selecionar imagem</Text>
                                    <Text style={styles.uploadSubtext}>Permitido: JPG/PNG</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

            </ScrollView>

            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
                <TouchableOpacity
                    style={[styles.submitBtn, !selectedMethod && { opacity: 0.5 }]}
                    disabled={!selectedMethod || isSubmitting}
                    onPress={handleConfirmPayment}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.submitBtnText}>Confirmar Recebimento</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const getStyles = (theme: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scrollContent: { padding: 16, paddingBottom: 100 },
    card: {
        backgroundColor: theme.surface,
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.border,
        marginTop: 16,
    },
    amountCard: {
        backgroundColor: theme.surfaceElevated,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.border,
    },
    amountLabel: { fontSize: 14, color: theme.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
    amountValue: { fontSize: 36, fontWeight: '800', color: theme.text, marginBottom: 12 },
    badge: {
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.2)',
    },
    badgeText: { color: '#F59E0B', fontSize: 12, fontWeight: '700' },
    itemsCard: {
        marginTop: 16,
        paddingHorizontal: 8,
    },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 16 },
    summaryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    summaryItemName: { fontSize: 15, color: theme.textSecondary },
    summaryItemPrice: { fontSize: 15, color: theme.text, fontWeight: '600' },
    methodsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    methodBtn: {
        flex: 1,
        paddingVertical: 16,
        backgroundColor: theme.background,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.border,
        gap: 8,
    },
    methodBtnSelected: {
        backgroundColor: 'rgba(14, 165, 233, 0.05)',
        borderColor: theme.primary,
    },
    methodText: { fontSize: 13, color: theme.textSecondary, fontWeight: '600' },
    methodTextSelected: { color: theme.primary },
    uploadArea: {
        width: '100%',
        height: 160,
        borderWidth: 2,
        borderColor: theme.border,
        borderStyle: 'dashed',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.background,
    },
    uploadIconWrap: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    uploadText: { fontSize: 15, fontWeight: '600', color: theme.text, marginBottom: 4 },
    uploadSubtext: { fontSize: 13, color: theme.textMuted },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: theme.surface,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.border,
    },
    submitBtn: {
        backgroundColor: theme.primary,
        height: 46,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
});
