import React, { useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, FlatList, ActivityIndicator, Switch, TouchableOpacity, Platform, Modal, TextInput, KeyboardAvoidingView, Alert } from 'react-native';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Stack } from 'expo-router';

export default function ServicosScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
    const queryClient = useQueryClient();

    const [modalVisible, setModalVisible] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formName, setFormName] = useState('');
    const [formPrice, setFormPrice] = useState('');
    const [formDuration, setFormDuration] = useState('');

    const { data: services, isLoading } = useQuery({
        queryKey: ['admin-services'],
        queryFn: async () => {
            const { data, error } = await supabase.from('services').select('*').order('name');
            if (error) throw error;
            return data || [];
        }
    });

    const toggleMutation = useMutation({
        mutationFn: async ({ id, isActive }: { id: string, isActive: boolean }) => {
            const { error } = await supabase.from('services').update({ is_active: isActive }).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-services'] })
    });

    const saveMutation = useMutation({
        mutationFn: async () => {
            const priceNum = parseFloat(formPrice.replace(',', '.'));
            const durationNum = parseInt(formDuration, 10) || 0;
            if (editingId) {
                const { error } = await supabase.from('services')
                    .update({ name: formName, price: priceNum, duration: durationNum })
                    .eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('services')
                    .insert([{ name: formName, price: priceNum, duration: durationNum, is_active: true }]);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-services'] });
            closeModal();
        },
        onError: (err: any) => Alert.alert('Erro', err.message)
    });

    const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const openEdit = (item: any) => {
        setEditingId(item.id);
        setFormName(item.name);
        setFormPrice(item.price ? item.price.toString().replace('.', ',') : '0,00');
        setFormDuration(item.duration ? item.duration.toString() : '');
        setModalVisible(true);
    };

    const openAdd = () => {
        setEditingId(null);
        setFormName('');
        setFormPrice('');
        setFormDuration('');
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setEditingId(null);
        setFormName('');
        setFormPrice('');
        setFormDuration('');
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.primary }]}>
            <View style={styles.info}>
                <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
                <Text style={[styles.price, { color: theme.primary }]}>{formatCurrency(item.price)}</Text>
                <Text style={[styles.duration, { color: theme.textSecondary }]}>Duração: {item.duration} min</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <TouchableOpacity onPress={() => openEdit(item)} style={[styles.editBtn, { backgroundColor: theme.primary + '15' }]}>
                    <Ionicons name="pencil" size={18} color={theme.primary} />
                </TouchableOpacity>
                <Switch
                    value={item.is_active}
                    onValueChange={(val) => toggleMutation.mutate({ id: item.id, isActive: val })}
                    trackColor={{ false: theme.border, true: theme.primary }}
                    thumbColor={Platform.OS === 'android' ? (item.is_active ? theme.primary : '#f4f3f4') : undefined}
                />
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen options={{ title: 'Meus Serviços', headerBackTitle: 'Menu' }} />

            {isLoading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={theme.primary} /></View>
            ) : (
                <FlatList
                    data={services}
                    keyExtractor={s => s.id}
                    contentContainerStyle={styles.list}
                    renderItem={renderItem}
                />
            )}

            <TouchableOpacity style={[styles.fab, { backgroundColor: theme.primary }]} onPress={openAdd}>
                <Ionicons name="add" size={28} color="white" />
            </TouchableOpacity>

            {/* Modal de Adição/Edição */}
            <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeModal}>
                <KeyboardAvoidingView style={styles.modalBg} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>
                                {editingId ? 'Editar Serviço' : 'Novo Serviço'}
                            </Text>
                            <TouchableOpacity onPress={closeModal}>
                                <Ionicons name="close" size={24} color={theme.textMuted} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.fieldWrap}>
                            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Nome do Serviço</Text>
                            <TextInput
                                style={[styles.fieldInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                value={formName} onChangeText={setFormName}
                                placeholder="Ex: Consulta Geral" placeholderTextColor={theme.textMuted}
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.fieldWrap, { flex: 1 }]}>
                                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Preço (R$)</Text>
                                <TextInput
                                    style={[styles.fieldInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                    value={formPrice} onChangeText={setFormPrice}
                                    placeholder="0,00" placeholderTextColor={theme.textMuted} keyboardType="numeric"
                                />
                            </View>
                            <View style={[styles.fieldWrap, { flex: 1 }]}>
                                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Duração (min)</Text>
                                <TextInput
                                    style={[styles.fieldInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                    value={formDuration} onChangeText={setFormDuration}
                                    placeholder="Ex: 30" placeholderTextColor={theme.textMuted} keyboardType="numeric"
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.saveBtn, { backgroundColor: formName && formPrice ? theme.primary : theme.border }]}
                            disabled={!formName || !formPrice || saveMutation.isPending}
                            onPress={() => saveMutation.mutate()}
                        >
                            {saveMutation.isPending ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Salvar Serviço</Text>}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    list: { padding: 16, paddingBottom: 80 },
    card: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
    info: { flex: 1 },
    name: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
    price: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
    duration: { fontSize: 12 },
    editBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    fab: { position: 'absolute', right: 20, bottom: 20, width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4 },
    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: '800' },
    row: { flexDirection: 'row', gap: 12 },
    fieldWrap: { marginBottom: 16 },
    fieldLabel: { fontSize: 12, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
    fieldInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, height: 50, fontSize: 16 },
    saveBtn: { height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
    saveBtnText: { color: 'white', fontSize: 16, fontWeight: '800' }
});
