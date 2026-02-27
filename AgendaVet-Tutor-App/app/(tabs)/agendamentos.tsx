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

// ─── Status badge config ──────────────────────────────────────────────────────
type StatusKey = 'pending' | 'confirmed' | 'cancelled' | 'completed' | string;

const STATUS_CONFIG: Record<string, { label: string; icon: string; bg: string; text: string }> = {
    pending: { label: 'Pendente', icon: 'time-outline', bg: '#fef3c7', text: '#b45309' },
    confirmed: { label: 'Confirmado', icon: 'checkmark-circle-outline', bg: '#d1fae5', text: '#065f46' },
    cancelled: { label: 'Cancelado', icon: 'close-circle-outline', bg: '#fee2e2', text: '#991b1b' },
    completed: { label: 'Concluído', icon: 'ribbon-outline', bg: '#ede9fe', text: '#4c1d95' },
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
        bg: '#f1f5f9',
        text: '#64748b',
    };

    const petEmoji = appointment.pets ? (PET_EMOJIS[appointment.pets.type] ?? '🐾') : '🐾';

    return (
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {/* Linha superior: pet + status */}
            <View style={styles.cardHeader}>
                <View style={styles.petRow}>
                    <Text style={styles.petEmojiSmall}>{petEmoji}</Text>
                    <Text style={[styles.petNameText, { color: theme.text }]}>
                        {appointment.pets?.name ?? 'Pet removido'}
                    </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                    <Ionicons name={status.icon as any} size={13} color={status.text} />
                    <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
                </View>
            </View>

            {/* Data e hora */}
            <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={14} color={theme.textMuted} />
                <Text style={[styles.metaValue, { color: theme.textSecondary }]}>
                    {appointment.preferred_date}
                    {appointment.preferred_time ? ` às ${appointment.preferred_time}` : ''}
                </Text>
            </View>

            {/* Motivo */}
            <View style={styles.metaRow}>
                <Ionicons name="document-text-outline" size={14} color={theme.textMuted} />
                <Text style={[styles.remarkText, { color: theme.textSecondary }]} numberOfLines={2}>
                    {appointment.reason}
                </Text>
            </View>

            {/* Observações (se existir) */}
            {appointment.notes ? (
                <View style={[styles.notesBox, { backgroundColor: theme.background }]}>
                    <Text style={[styles.notesText, { color: theme.textMuted }]}>
                        💬 {appointment.notes}
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
    const theme = Colors[colorScheme ?? 'light'];

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
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={[styles.filterBar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}
                contentContainerStyle={styles.filterContent}
            >
                {FILTERS.map((f) => (
                    <TouchableOpacity
                        key={f.value}
                        style={[
                            styles.filterChip,
                            {
                                backgroundColor: filter === f.value ? theme.primary : theme.background,
                                borderColor: filter === f.value ? theme.primary : theme.border,
                            },
                        ]}
                        onPress={() => setFilter(f.value)}
                    >
                        <Text style={[styles.filterChipText, { color: filter === f.value ? '#fff' : theme.textSecondary }]}>
                            {f.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Lista */}
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
            >
                {filtered.length === 0 ? (
                    <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <Text style={styles.emptyEmoji}>📅</Text>
                        <Text style={[styles.emptyTitle, { color: theme.text }]}>
                            {filter === 'all' ? 'Nenhuma solicitação ainda' : 'Nenhum resultado'}
                        </Text>
                        <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                            {filter === 'all'
                                ? 'Vá em "Pets" e toque em "Agendar" para solicitar uma consulta.'
                                : 'Nenhuma solicitação neste status.'}
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
    loadingText: { fontSize: 14 },

    // Filtros
    filterBar: { borderBottomWidth: 1, maxHeight: 56 },
    filterContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, alignItems: 'center' },
    filterChip: {
        borderWidth: 1.5,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 6,
    },
    filterChipText: { fontSize: 13, fontWeight: '600' },

    // Lista
    scrollContent: { padding: 16, paddingBottom: 32 },

    // Card
    card: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    petRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    petEmojiSmall: { fontSize: 20 },
    petNameText: { fontSize: 15, fontWeight: '700' },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: { fontSize: 12, fontWeight: '700' },
    metaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 6 },
    metaValue: { fontSize: 13 },
    remarkText: { fontSize: 13, flex: 1 },
    notesBox: { borderRadius: 8, padding: 10, marginTop: 6 },
    notesText: { fontSize: 12, lineHeight: 18 },

    // Empty
    emptyCard: {
        borderRadius: 20,
        borderWidth: 2,
        borderStyle: 'dashed',
        padding: 32,
        alignItems: 'center',
        marginTop: 8,
    },
    emptyEmoji: { fontSize: 52, marginBottom: 12 },
    emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6, textAlign: 'center' },
    emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
