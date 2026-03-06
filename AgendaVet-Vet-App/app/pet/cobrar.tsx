import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors } from '../../constants/theme';
import { useColorScheme } from 'react-native';

export default function NovaCobrancaScreen() {
    const { petId, ownerId } = useLocalSearchParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
    const styles = getStyles(theme);

    const [selectedServices, setSelectedServices] = useState<any[]>([]);
    const [customItemDesc, setCustomItemDesc] = useState('');
    const [customItemPrice, setCustomItemPrice] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data: services, isLoading } = useQuery({
        queryKey: ['services'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .eq('active', true)
                .order('name');
            if (error) throw error;
            return data;
        }
    });

    const totalAmount = selectedServices.reduce((acc, curr) => acc + (curr.price || 0), 0);

    const handleAddCustomItem = () => {
        if (!customItemDesc || !customItemPrice) return;
        const price = parseFloat(customItemPrice.replace(',', '.'));
        if (isNaN(price)) {
            Alert.alert('Erro', 'Valor inválido.');
            return;
        }
        setSelectedServices([
            ...selectedServices,
            { id: Math.random().toString(), name: customItemDesc, price: price, isCustom: true }
        ]);
        setCustomItemDesc('');
        setCustomItemPrice('');
    };

    const handleRemoveItem = (index: number) => {
        const newSelected = [...selectedServices];
        newSelected.splice(index, 1);
        setSelectedServices(newSelected);
    };

    const handleToggleService = (service: any) => {
        const index = selectedServices.findIndex(s => s.id === service.id && !s.isCustom);
        if (index > -1) {
            handleRemoveItem(index);
        } else {
            setSelectedServices([...selectedServices, { ...service, isCustom: false }]);
        }
    };

    const handleGenerateInvoice = async () => {
        if (selectedServices.length === 0) {
            Alert.alert('Erro', 'Adicione pelo menos um item para gerar a cobrança.');
            return;
        }
        setIsSubmitting(true);
        try {
            const invoiceResponse = await supabase.from('invoices').insert({
                owner_id: ownerId,
                pet_id: petId,
                total_amount: totalAmount,
                status: 'pending',
                due_date: new Date().toISOString()
            }).select().single();

            if (invoiceResponse.error) throw invoiceResponse.error;

            const invoiceId = invoiceResponse.data.id;

            const itemsToInsert = selectedServices.map(item => ({
                invoice_id: invoiceId,
                service_id: item.isCustom ? null : item.id,
                description: item.name,
                quantity: 1,
                unit_price: item.price,
                total_price: item.price
            }));

            const itemsResponse = await supabase.from('invoice_items').insert(itemsToInsert);
            if (itemsResponse.error) throw itemsResponse.error;

            // Registrar na timeline do pet
            const historyDesc = selectedServices.map(s => s.name).join(', ');
            await supabase.from('pet_history').insert({
                pet_id: petId,
                module: 'cobranca',
                title: 'Nova Cobrança Gerada',
                description: historyDesc,
                date: new Date().toISOString().split('T')[0],
                // We'll store a JSON payload referencing the invoiceId inside a custom jsonb field if it exisited, 
                // but since pet_history doesn't have an invoice_id natively, we might have to use description.
                // Or let's assume `record_id` or similar. We will just use `description`.
            });

            Alert.alert('Sucesso', 'Cobrança gerada com sucesso!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
            queryClient.invalidateQueries({ queryKey: ['pet_history', petId] });
            queryClient.invalidateQueries({ queryKey: ['invoices'] });

        } catch (error: any) {
            Alert.alert('Erro', 'Falha ao gerar cobrança: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <Stack.Screen options={{
                headerShown: true,
                title: 'Nova Cobrança',
                headerStyle: { backgroundColor: theme.surface },
                headerTintColor: theme.text,
                headerShadowVisible: false,
            }} />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Serviços Disponíveis</Text>
                    {isLoading ? (
                        <ActivityIndicator color={theme.primary} />
                    ) : (
                        <View style={styles.servicesGrid}>
                            {services?.map(service => {
                                const isSelected = selectedServices.some(s => s.id === service.id && !s.isCustom);
                                return (
                                    <TouchableOpacity
                                        key={service.id}
                                        style={[styles.serviceChip, isSelected && styles.serviceChipSelected]}
                                        onPress={() => handleToggleService(service)}
                                    >
                                        <Text style={[styles.serviceChipText, isSelected && styles.serviceChipTextSelected]}>
                                            {service.name}
                                        </Text>
                                        <Text style={[styles.serviceChipPrice, isSelected && styles.serviceChipTextSelected]}>
                                            R$ {service.price.toFixed(2)}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </View>

                <View style={[styles.card, { marginTop: 16 }]}>
                    <Text style={styles.sectionTitle}>Adicionar Item Avulso</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Descrição do item"
                        placeholderTextColor={theme.textMuted}
                        value={customItemDesc}
                        onChangeText={setCustomItemDesc}
                    />
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <TextInput
                            style={[styles.input, { flex: 1 }]}
                            placeholder="Valor (R$)"
                            placeholderTextColor={theme.textMuted}
                            keyboardType="numeric"
                            value={customItemPrice}
                            onChangeText={setCustomItemPrice}
                        />
                        <TouchableOpacity style={styles.addBtn} onPress={handleAddCustomItem}>
                            <Ionicons name="add" size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={[styles.summaryCard, { marginTop: 24 }]}>
                    <Text style={styles.sectionTitle}>Itens da Fatura</Text>
                    {selectedServices.length === 0 ? (
                        <Text style={styles.emptyText}>Nenhum item adicionado.</Text>
                    ) : (
                        selectedServices.map((item, index) => (
                            <View key={index} style={styles.summaryItem}>
                                <Text style={styles.summaryItemName}>{item.name}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <Text style={styles.summaryItemPrice}>R$ {item.price.toFixed(2)}</Text>
                                    <TouchableOpacity onPress={() => handleRemoveItem(index)}>
                                        <Ionicons name="trash-outline" size={20} color={theme.error} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    )}
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>R$ {totalAmount.toFixed(2)}</Text>
                    </View>
                </View>

            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.submitBtn, selectedServices.length === 0 && { opacity: 0.5 }]}
                    disabled={selectedServices.length === 0 || isSubmitting}
                    onPress={handleGenerateInvoice}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.submitBtnText}>Gerar Cobrança</Text>
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
    },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 12 },
    servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    serviceChip: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: theme.background,
        borderWidth: 1,
        borderColor: theme.border,
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    serviceChipSelected: {
        backgroundColor: theme.primary,
        borderColor: theme.primary,
    },
    serviceChipText: { fontSize: 13, color: theme.textSecondary, fontWeight: '500' },
    serviceChipPrice: { fontSize: 13, color: theme.text, fontWeight: '700' },
    serviceChipTextSelected: { color: 'white' },
    input: {
        backgroundColor: theme.background,
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 50,
        color: theme.text,
        fontSize: 15,
        marginBottom: 12,
    },
    addBtn: {
        backgroundColor: theme.primary,
        width: 50,
        height: 50,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    summaryCard: {
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    summaryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(16, 185, 129, 0.1)',
    },
    summaryItemName: { fontSize: 15, color: theme.text, flex: 1 },
    summaryItemPrice: { fontSize: 15, fontWeight: '600', color: theme.text },
    emptyText: { color: theme.textMuted, fontStyle: 'italic', textAlign: 'center', marginVertical: 12 },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        marginTop: 8,
    },
    totalLabel: { fontSize: 18, fontWeight: '700', color: theme.text },
    totalValue: { fontSize: 24, fontWeight: '800', color: theme.success },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: theme.surface,
        borderTopWidth: 1,
        borderTopColor: theme.border,
    },
    submitBtn: {
        backgroundColor: theme.success,
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
});
