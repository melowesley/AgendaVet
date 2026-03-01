import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
    useColorScheme,
    TouchableOpacity,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { Colors } from '@/constants/theme';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Pet {
    id: string;
    name: string;
    type: string;
}

interface AppointmentRequest {
    id: string;
    pet_id: string;
    preferred_date: string;
    preferred_time: string | null;
    reason: string;
    notes: string | null;
    status: string;
    created_at: string;
    pets: Pet | null;
}

// ─── Status badge config (Ajustado para contraste em modo escuro) ──────────────
const STATUS_CONFIG: Record<string, { label: string; icon: string; bg: string; text: string }> = {
    pending: { label: 'Pendente', icon: 'time-outline', bg: '#f59e0b20', text: '#f59e0b' },
    confirmed: { label: 'Confirmado', icon: 'checkmark-circle-outline', bg: '#10b98120', text: '#10b981' },
    cancelled: { label: 'Cancelado', icon: 'close-circle-outline', bg: '#ef444420', text: '#ef4444' },
    completed: { label: 'Concluído', icon: 'ribbon-outline', bg: '#6366f120', text: '#818cf8' },
};

const PET_EMOJIS: Record<string, string> = {
    dog: '🐶', cat: '🐱', bird: '🐦', rabbit: '🐰',
    fish: '🐟', reptile: '🦎', other: '🐾',
};

// ─── Componente: Card de Agendamento ─────────────────────────────────────────
function AppointmentCard({ appointment, theme }: { appointment: AppointmentRequest; theme: typeof Colors.light }) {
    const status = STATUS_CONFIG[appointment.status] ?? {
        label: appointment.status,
        icon: 'help-circle-outline',
        bg: theme.border,
        text: theme.textSecondary,
    };

    const petEmoji = appointment.pets ? (PET_EMOJIS[appointment.pets.type] ?? '🐾') : '🐾';

    return (
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {/* Linha superior: pet + status */}
            <View style={styles.cardHeader}>
                <View style={styles.petRow}>
                    <View style={[styles.petIconBg, { backgroundColor: theme.border }]}>
                        <Text style={styles.petEmojiSmall}>{petEmoji}</Text>
                    </View>
                    <Text style={[styles.petNameText, { color: theme.text }]}>
                        {appointment.pets?.name ?? 'Pet removido'}
                    </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                    <Ionicons name={status.icon as any} size={12} color={status.text} />
                    <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
                </View>
            </View>

            {/* Data e hora */}
            <View style={styles.detailsBox}>
                <View style={styles.metaRow}>
                    <Ionicons name="calendar" size={14} color={theme.primary} />
                    <Text style={[styles.metaValue, { color: theme.textSecondary }]}>
                        {appointment.preferred_date}
                        {appointment.preferred_time ? ` · ${appointment.preferred_time}` : ''}
                    </Text>
                </View>

                {/* Motivo */}
                <View style={styles.metaRow}>
                    <Ionicons name="medical" size={14} color={theme.textMuted} />
                    <Text style={[styles.remarkText, { color: theme.textSecondary }]} numberOfLines={2}>
                        {appointment.reason}
                    </Text>
                </View>
            </View>

            {/* Observações (se existir) */}
            {appointment.notes ? (
                <View style={[styles.notesBox, { backgroundColor: theme.background }]}>
                    <Text style={[styles.notesText, { color: theme.textSecondary }]}>
                        <Text style={{ fontWeight: '700', color: theme.textMuted }}>Nota: </Text>
                        {appointment.notes}
                    </Text>
                </View>
            ) : null}
        </View>
    );
}

// ─── Tela: Agendamentos ───────────────────────────────────────────────────────
export default function AgendamentosScreen() {
    const { session } = useAuth();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

    const [appointments, setAppointments] = useState<AppointmentRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<string>('all');

    const userId = session?.user?.id;

    const fetchAppointments = useCallback(async () => {
        if (!userId) return;
        const { data, error } = await supabase
            .from('appointment_requests')
            .select('*, pets(id, name, type)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Erro ao buscar agendamentos:', error.message);
        } else {
            setAppointments(data as AppointmentRequest[]);
        }
    }, [userId]);

    useEffect(() => {
        fetchAppointments().finally(() => setLoading(false));
    }, [fetchAppointments]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchAppointments();
        setRefreshing(false);
    };

    // Filtro local
    const filtered = filter === 'all' ? appointments : appointments.filter((a) => a.status === filter);

    const FILTERS = [
        { value: 'all', label: 'Todos' },
        { value: 'pending', label: 'Pendentes' },
        { value: 'confirmed', label: 'Confirmados' },
        { value: 'completed', label: 'Concluídos' },
        { value: 'cancelled', label: 'Cancelados' },
    ];

    if (loading) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Carregando agendamentos...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.screen, { backgroundColor: theme.background }]}>
            {/* Filtros */}
            <View style={{ borderBottomWidth: 1, borderBottomColor: theme.border }}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.filterBar}
                    contentContainerStyle={styles.filterContent}
                >
                    {FILTERS.map((f) => {
                        const active = filter === f.value;
                        return (
                            <TouchableOpacity
                                key={f.value}
                                style={[
                                    styles.filterChip,
                                    {
                                        backgroundColor: active ? theme.primary : theme.surface,
                                        borderColor: active ? theme.primary : theme.border,
                                    },
                                ]}
                                onPress={() => setFilter(f.value)}
                            >
                                <Text style={[styles.filterChipText, { color: active ? '#fff' : theme.textSecondary }]}>
                                    {f.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Lista */}
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
            >
                {filtered.length === 0 ? (
                    <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <View style={[styles.emptyIconBg, { backgroundColor: theme.border }]}>
                            <Ionicons name="calendar-outline" size={48} color={theme.textMuted} />
                        </View>
                        <Text style={[styles.emptyTitle, { color: theme.text }]}>
                            {filter === 'all' ? 'Nenhuma solicitação' : 'Nenhum resultado'}
                        </Text>
                        <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                            {filter === 'all'
                                ? 'Suas solicitações de consulta aparecerão aqui assim que você agendar para um pet.'
                                : 'Não encontramos solicitações com este status.'}
                        </Text>
                    </View>
                ) : (
                    filtered.map((appt) => (
                        <AppointmentCard key={appt.id} appointment={appt} theme={theme} />
                    ))
                )}
            </ScrollView>
        </View>
    );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    screen: { flex: 1 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    loadingText: { fontSize: 14, fontWeight: '500' },

    // Filtros
    filterBar: { maxHeight: 64 },
    filterContent: { paddingHorizontal: 20, paddingVertical: 14, gap: 10, alignItems: 'center' },
    filterChip: {
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    filterChipText: { fontSize: 14, fontWeight: '700' },

    // Lista
    scrollContent: { padding: 20, paddingBottom: 40 },

    // Card
    card: {
        borderRadius: 20,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    petRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    petIconBg: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    petEmojiSmall: { fontSize: 20 },
    petNameText: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: { fontSize: 12, fontWeight: '800' },
    detailsBox: { gap: 8 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    metaValue: { fontSize: 14, fontWeight: '600' },
    remarkText: { fontSize: 14, flex: 1, lineHeight: 20 },
    notesBox: { borderRadius: 12, padding: 12, marginTop: 12 },
    notesText: { fontSize: 13, lineHeight: 20 },

    // Empty
    emptyCard: {
        borderRadius: 24,
        padding: 40,
        alignItems: 'center',
        marginTop: 20,
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    emptyIconBg: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
    emptySubtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
