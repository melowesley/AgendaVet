import React, { useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, FlatList, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAppointmentRequests } from '@/hooks/useAppointmentRequests';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function SolicitacoesScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
    const queryClient = useQueryClient();
    const { requests, loading, refresh } = useAppointmentRequests();

    // Filtramos apenas as pendentes para esta tela, ou mostramos todas com labels?
    // No web "requests" mostra todas com filtros. Vamos permitir filtrar.
    const [filter, setFilter] = useState<'pending' | 'confirmed' | 'cancelled' | 'all'>('pending');

    const filteredRequests = requests.filter(r => filter === 'all' || r.status === filter);

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: string }) => {
            const { error } = await supabase.from('appointment_requests').update({ status }).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointment-requests'] });
            Alert.alert('Sucesso', 'Solicitação atualizada.');
        },
        onError: (err: any) => Alert.alert('Erro', err.message)
    });

    const handleAction = (id: string, status: string) => {
        const statusLabel = status === 'confirmed' ? 'Confirmar' : 'Cancelar';
        Alert.alert(
            `${statusLabel} Agendamento?`,
            `Deseja realmente ${statusLabel.toLowerCase()} esta solicitação?`,
            [
                { text: 'Não', style: 'cancel' },
                { text: 'Sim', onPress: () => updateStatusMutation.mutate({ id, status }) }
            ]
        );
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.cardHeader}>
                <View style={styles.petInfo}>
                    <Text style={[styles.petName, { color: theme.text }]}>{item.pet?.name?.toUpperCase()}</Text>
                    <Text style={[styles.petBreed, { color: theme.textSecondary }]}>{item.pet?.breed || 'SRD'}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {getStatusLabel(item.status).toUpperCase()}
                    </Text>
                </View>
            </View>

            <View style={styles.details}>
                <View style={styles.detailRow}>
                    <Ionicons name="person-outline" size={14} color={theme.textMuted} />
                    <Text style={[styles.detailText, { color: theme.textSecondary }]}>{item.profile?.full_name}</Text>
                </View>
                <View style={[styles.detailRow, { marginTop: 4 }]}>
                    <Ionicons name="calendar-outline" size={14} color={theme.textMuted} />
                    <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                        {format(parseISO(item.preferred_date), "dd/MM/yyyy", { locale: ptBR })} às {item.preferred_time}
                    </Text>
                </View>
                {item.reason && (
                    <View style={[styles.detailRow, { marginTop: 4 }]}>
                        <Ionicons name="help-circle-outline" size={14} color={theme.textMuted} />
                        <Text style={[styles.detailText, { color: theme.textSecondary }]} numberOfLines={1}>{item.reason}</Text>
                    </View>
                )}
            </View>

            {item.status === 'pending' && (
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.cancelBtn]}
                        onPress={() => handleAction(item.id, 'cancelled')}
                    >
                        <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
                        <Text style={styles.cancelBtnText}>Recusar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.confirmBtn, { backgroundColor: theme.primary }]}
                        onPress={() => handleAction(item.id, 'confirmed')}
                    >
                        <Ionicons name="checkmark-circle-outline" size={18} color="white" />
                        <Text style={styles.confirmBtnText}>Aprovar</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.filterContainer}>
                {(['pending', 'confirmed', 'all'] as const).map(f => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.filterBtn, filter === f && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                        onPress={() => setFilter(f)}
                    >
                        <Text style={[styles.filterText, { color: filter === f ? 'white' : theme.textSecondary }]}>
                            {f === 'pending' ? 'Pendentes' : f === 'confirmed' ? 'Confirmados' : 'Todos'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={filteredRequests}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={theme.primary} />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="mail-open-outline" size={48} color={theme.textMuted} />
                        <Text style={{ color: theme.textSecondary, marginTop: 12 }}>Nenhuma solicitação encontrada.</Text>
                    </View>
                }
            />
        </View>
    );
}

const getStatusLabel = (status: string) => {
    switch (status) {
        case 'pending': return 'Pendente';
        case 'confirmed': return 'Confirmado';
        case 'cancelled': return 'Cancelado';
        default: return status;
    }
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'confirmed': return '#10B981';
        case 'cancelled': return '#EF4444';
        default: return '#F59E0B';
    }
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    filterContainer: { flexDirection: 'row', padding: 16, gap: 8 },
    filterBtn: { paddingHorizontal: 16, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#ddd', justifyContent: 'center' },
    filterText: { fontSize: 13, fontWeight: '700' },
    list: { padding: 16, paddingBottom: 100 },
    card: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    petInfo: { flex: 1 },
    petName: { fontSize: 16, fontWeight: '800' },
    petBreed: { fontSize: 12 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statusText: { fontSize: 10, fontWeight: '800' },
    details: { marginBottom: 16 },
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    detailText: { fontSize: 13 },
    actions: { flexDirection: 'row', gap: 12 },
    actionBtn: { flex: 1, height: 44, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    cancelBtn: { borderWidth: 1, borderColor: '#FEE2E2' },
    confirmBtn: {},
    cancelBtnText: { color: '#EF4444', fontWeight: '700', fontSize: 14 },
    confirmBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },
    empty: { alignItems: 'center', justifyContent: 'center', marginTop: 60 }
});
