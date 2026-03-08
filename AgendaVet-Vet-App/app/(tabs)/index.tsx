import React, { useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, useColorScheme, ScrollView,
    TouchableOpacity, RefreshControl, Alert, ActivityIndicator, ImageBackground, TextInput, KeyboardAvoidingView, Platform
} from 'react-native';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAppointmentRequests } from '@/hooks/useAppointmentRequests';
import { format, isToday, parseISO, addDays, startOfWeek, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';

// ── Status helpers ──────────────────────────────────────────
const STATUS_LABEL: Record<string, string> = {
    pending: 'Pendente', confirmed: 'Confirmado', checked_in: 'Check-in',
    in_progress: 'Atendimento', completed: 'Concluído', cancelled: 'Cancelado',
};
const STATUS_COLOR: Record<string, string> = {
    pending: '#F59E0B', confirmed: '#3B82F6', checked_in: '#06B6D4',
    in_progress: '#8B5CF6', completed: '#10B981', cancelled: '#EF4444',
};
const NEXT_ACTION: Record<string, { label: string; icon: any; nextStatus: string; color: string } | null> = {
    pending: { label: 'Confirmar', icon: 'checkmark-outline', nextStatus: 'confirmed', color: '#3B82F6' },
    confirmed: { label: 'Check-in', icon: 'log-in-outline', nextStatus: 'checked_in', color: '#06B6D4' },
    checked_in: { label: 'Iniciar', icon: 'play-outline', nextStatus: 'in_progress', color: '#8B5CF6' },
    in_progress: { label: 'Finalizar', icon: 'flag-outline', nextStatus: 'completed', color: '#10B981' },
    completed: null,
    cancelled: null,
};

export default function AgendaScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
    const queryClient = useQueryClient();
    const router = useRouter();
    const { requests, loading, refresh } = useAppointmentRequests();

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [noteText, setNoteText] = useState('');

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const today = new Date().toISOString().split('T')[0];
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);

            const [pendingRes, confirmedRes, clientsRes, petsRes, revenueRes] = await Promise.all([
                supabase.from('appointment_requests').select('id', { count: 'exact' }).eq('status', 'pending'),
                supabase.from('appointment_requests').select('id', { count: 'exact' }).eq('status', 'confirmed').eq('scheduled_date', today),
                supabase.from('profiles').select('id', { count: 'exact' }),
                supabase.from('pets').select('id', { count: 'exact' }),
                supabase.from('invoices').select('total_amount').eq('status', 'paid').gte('updated_at', todayStart.toISOString()).lte('updated_at', todayEnd.toISOString()),
            ]);

            const revenueToday = revenueRes.data ? revenueRes.data.reduce((sum, current) => sum + Number(current.total_amount), 0) : 0;

            return {
                pendingRequests: pendingRes.count || 0,
                confirmedToday: confirmedRes.count || 0,
                totalClients: clientsRes.count || 0,
                totalPets: petsRes.count || 0,
                revenueToday,
            };
        }
    });

    const dayRequests = useMemo(() => {
        return requests.filter(r => {
            const ds = r.scheduled_date || r.preferred_date;
            if (!ds) return false;
            try { return isSameDay(parseISO(ds), selectedDate); } catch { return false; }
        }).sort((a, b) => {
            const at = a.scheduled_time || a.preferred_time || '';
            const bt = b.scheduled_time || b.preferred_time || '';
            return at.localeCompare(bt);
        });
    }, [requests, selectedDate]);

    const updateStatus = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            const { error } = await supabase.from('appointment_requests')
                .update({ status, updated_at: new Date().toISOString() }).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointment-requests'] });
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        },
        onError: (e: any) => Alert.alert('Erro', e.message),
    });

    const updateNotes = useMutation({
        mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
            const { error } = await supabase.from('appointment_requests')
                .update({ quick_notes: notes, updated_at: new Date().toISOString() }).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            queryClient.invalidateQueries({ queryKey: ['appointment-requests'] });
            setExpandedId(null);
        },
        onError: (e: any) => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Erro', 'Não foi possível salvar a anotação.');
        },
    });

    const handleCancel = (id: string) => {
        Alert.alert('Atenção', 'Deseja cancelar este agendamento?', [
            { text: 'Não', style: 'cancel' },
            { text: 'Sim, Cancelar', style: 'destructive', onPress: () => updateStatus.mutate({ id, status: 'cancelled' }) }
        ]);
    };

    const toggleExpand = (item: any) => {
        if (expandedId === item.id) {
            setExpandedId(null);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else {
            setExpandedId(item.id);
            setNoteText(item.quick_notes || '');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
    };

    const isDark = colorScheme === 'dark';

    return (
        <ImageBackground
            source={require('@/assets/images/wallpaper.png')}
            style={{ flex: 1 }}
            imageStyle={{ opacity: isDark ? 0.08 : 0.45 }}
        >
            <View style={[s.container, { backgroundColor: isDark ? theme.background + 'B0' : theme.background + '70' }]}>
                <PWAInstallPrompt />
                <ScrollView
                    refreshControl={<RefreshControl refreshing={loading || statsLoading} onRefresh={() => { refresh(); refetchStats(); }} tintColor={theme.primary} />}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={s.header}>
                        <View>
                            <Text style={[s.headerDate, { color: theme.textSecondary }]}>
                                {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
                            </Text>
                            <Text style={[s.headerTitle, { color: theme.text }]}>Minha Agenda</Text>
                        </View>
                        <View style={[s.headerBadge, { backgroundColor: theme.primary + '20' }]}>
                            <Text style={[s.headerBadgeText, { color: theme.primary }]}>{dayRequests.length} atendimentos</Text>
                        </View>
                    </View>

                    {/* Week Strip */}
                    <View style={[s.weekStrip, { backgroundColor: theme.surface + 'CC', borderColor: theme.border, shadowColor: theme.primary }]}>
                        {weekDays.map(day => {
                            const isSelected = isSameDay(day, selectedDate);
                            return (
                                <TouchableOpacity
                                    key={day.toISOString()}
                                    style={[s.dayCell, isSelected && { backgroundColor: theme.primary }]}
                                    onPress={() => setSelectedDate(day)}
                                >
                                    <Text style={[s.dayName, { color: isSelected ? 'white' : theme.textMuted }]}>
                                        {format(day, 'EEE', { locale: ptBR }).slice(0, 3).toUpperCase()}
                                    </Text>
                                    <Text style={[s.dayNum, { color: isSelected ? 'white' : theme.text, fontWeight: isToday(day) ? '900' : '600' }]}>
                                        {format(day, 'd')}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Tabela de Atendimentos */}
                    <View style={s.tableContainer}>
                        {/* Column Headers */}
                        <View style={[s.tableHeader, { borderBottomColor: theme.border }]}>
                            <Text style={[s.colHead, { width: 60, color: theme.textMuted }]}>HORA</Text>
                            <Text style={[s.colHead, { flex: 1, color: theme.textMuted }]}>PACIENTE / STATUS</Text>
                            <Text style={[s.colHead, { width: 80, textAlign: 'right', color: theme.textMuted }]}>AÇÃO</Text>
                        </View>

                        {dayRequests.length === 0 && !loading && (
                            <View style={s.empty}>
                                <Ionicons name="calendar-clear-outline" size={48} color={theme.textMuted} />
                                <Text style={{ color: theme.textMuted, marginTop: 10 }}>Nenhum agendamento para este dia.</Text>
                            </View>
                        )}

                        {dayRequests.map(item => {
                            const action = NEXT_ACTION[item.status];
                            const statusColor = STATUS_COLOR[item.status] || theme.textMuted;
                            const petId = item.pet?.id;
                            const isExpanded = expandedId === item.id;

                            return (
                                <View key={item.id} style={{ borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.surface + (isExpanded ? 'B3' : '80') }}>
                                    <View style={[s.row, { borderBottomWidth: 0 }]}>
                                        {/* Col Hora */}
                                        <View style={s.timeCol}>
                                            <Text style={[s.timeText, { color: theme.text }]}>
                                                {item.scheduled_time || item.preferred_time || '--:--'}
                                            </Text>
                                            <View style={[s.statusDot, { backgroundColor: statusColor }]} />
                                        </View>

                                        {/* Col Paciente/Status */}
                                        <View style={s.infoCol}>
                                            <TouchableOpacity onPress={() => toggleExpand(item)} activeOpacity={0.6}>
                                                <Text style={[s.petName, { color: theme.text }]}>{item.pet?.name || '---'}</Text>
                                                <Text style={[s.ownerName, { color: theme.textSecondary }]}>{item.profile?.full_name || '---'}</Text>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                                    <Text style={[s.statusLabel, { color: statusColor }]}>{STATUS_LABEL[item.status]}</Text>
                                                </View>
                                            </TouchableOpacity>

                                            {/* Persistent Notes display */}
                                            {item.quick_notes && !isExpanded && (
                                                <TouchableOpacity
                                                    style={{ marginTop: 8, padding: 8, backgroundColor: theme.surfaceElevated, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}
                                                    onPress={() => toggleExpand(item)}
                                                >
                                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                                                        <Text style={{ fontSize: 10, fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase' }}>Anotações Rápidas</Text>
                                                        <Ionicons name="pencil" size={12} color={theme.textMuted} />
                                                    </View>
                                                    <Text style={{ fontSize: 13, color: theme.text, lineHeight: 18 }} numberOfLines={3}>{item.quick_notes}</Text>
                                                </TouchableOpacity>
                                            )}

                                            {/* Add Note Button if empty */}
                                            {!item.quick_notes && !isExpanded && (
                                                <TouchableOpacity
                                                    style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 }}
                                                    onPress={() => toggleExpand(item)}
                                                >
                                                    <Ionicons name="add-circle-outline" size={14} color={theme.textMuted} />
                                                    <Text style={{ fontSize: 11, fontWeight: '600', color: theme.textMuted }}>Adicionar Nota</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>

                                        {/* Col Ações */}
                                        <View style={s.actionCol}>
                                            {action ? (
                                                <TouchableOpacity
                                                    style={[s.actionBtn, { backgroundColor: action.color }]}
                                                    onPress={() => updateStatus.mutate({ id: item.id, status: action.nextStatus })}
                                                    disabled={updateStatus.isPending || isExpanded}
                                                >
                                                    {updateStatus.isPending
                                                        ? <ActivityIndicator size="small" color="white" />
                                                        : <Ionicons name={action.icon} size={18} color="white" />
                                                    }
                                                </TouchableOpacity>
                                            ) : item.status === 'completed' ? (
                                                <Ionicons name="checkmark-done-circle" size={24} color={theme.success} />
                                            ) : null}

                                            {item.status !== 'completed' && item.status !== 'cancelled' && !isExpanded && (
                                                <TouchableOpacity
                                                    style={[s.cancelBtn, { borderColor: theme.border }]}
                                                    onPress={() => handleCancel(item.id)}
                                                >
                                                    <Ionicons name="close" size={16} color={theme.error} />
                                                </TouchableOpacity>
                                            )}

                                            <TouchableOpacity onPress={() => petId && router.push({ pathname: '/pet/[id]', params: { id: petId } })} style={{ padding: 4, marginLeft: 2 }}>
                                                <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {/* Expanded Notes Section */}
                                    {isExpanded && (
                                        <View style={s.expandedArea}>
                                            <Text style={[s.expandedTitle, { color: theme.textSecondary }]}>Anotações do Atendimento</Text>
                                            <TextInput
                                                style={[s.noteInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                                                placeholder="Digite sintomas, observações ou lembres sobre o tutor..."
                                                placeholderTextColor={theme.textMuted}
                                                multiline
                                                numberOfLines={3}
                                                textAlignVertical="top"
                                                value={noteText}
                                                onChangeText={setNoteText}
                                            />
                                            <View style={s.expandedActions}>
                                                <TouchableOpacity style={[s.expandedBtn, { backgroundColor: theme.surfaceElevated }]} onPress={() => setExpandedId(null)}>
                                                    <Text style={{ color: theme.text, fontWeight: '600' }}>Cancelar</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[s.expandedBtn, { backgroundColor: theme.primary }]}
                                                    onPress={() => updateNotes.mutate({ id: item.id, notes: noteText })}
                                                    disabled={updateNotes.isPending}
                                                >
                                                    {updateNotes.isPending ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Salvar Nota</Text>}
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>

                    {/* Atalhos rápidos footer */}
                    <View style={[s.footerStats, { backgroundColor: theme.surface + 'CC', borderColor: theme.border, borderWidth: 1 }]}>
                        <View style={[s.statItem, { borderRightColor: theme.border, borderRightWidth: 1 }]}>
                            <Text style={[s.statVal, { color: theme.primary }]}>{stats?.pendingRequests || 0}</Text>
                            <Text style={[s.statLab, { color: theme.textSecondary }]}>Pendentes</Text>
                        </View>
                        <View style={[s.statItem, { borderRightColor: theme.border, borderRightWidth: 1 }]}>
                            <Text style={[s.statVal, { color: theme.primary }]}>{stats?.totalPets || 0}</Text>
                            <Text style={[s.statLab, { color: theme.textSecondary }]}>Pets Totais</Text>
                        </View>
                        <View style={s.statItem}>
                            <Text style={[s.statVal, { color: '#10B981' }]}>R$ {stats?.revenueToday?.toFixed(0) || 0}</Text>
                            <Text style={[s.statLab, { color: theme.textSecondary }]}>Receita Hoje</Text>
                        </View>
                    </View>

                </ScrollView>
            </View>
        </ImageBackground>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 20, paddingTop: 60, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerDate: { fontSize: 13, textTransform: 'capitalize', fontWeight: '500' },
    headerTitle: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
    headerBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    headerBadgeText: { fontSize: 11, fontWeight: '700' },

    weekStrip: { flexDirection: 'row', padding: 8, marginHorizontal: 16, borderRadius: 16, borderWidth: 1, gap: 5 },
    dayCell: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12 },
    dayName: { fontSize: 9, fontWeight: '700' },
    dayNum: { fontSize: 16, marginTop: 2 },

    tableContainer: { marginTop: 20, marginHorizontal: 16, borderRadius: 20, overflow: 'hidden' },
    tableHeader: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
    colHead: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

    row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15, borderBottomWidth: 1 },
    timeCol: { width: 60, alignItems: 'flex-start' },
    timeText: { fontSize: 14, fontWeight: '800' },
    statusDot: { width: 6, height: 6, borderRadius: 3, marginTop: 4 },

    infoCol: { flex: 1, paddingRight: 10 },
    petName: { fontSize: 15, fontWeight: '800' },
    ownerName: { fontSize: 12, marginBottom: 2 },
    statusLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },

    actionCol: { width: 80, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
    actionBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    cancelBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

    empty: { alignItems: 'center', paddingVertical: 60 },

    footerStats: { flexDirection: 'row', margin: 20, padding: 16, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 },
    statItem: { flex: 1, alignItems: 'center', borderRightWidth: 0 },
    statVal: { fontSize: 18, fontWeight: '800' },
    statLab: { fontSize: 10, fontWeight: '600' },

    expandedArea: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 4 },
    expandedTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 },
    noteInput: { minHeight: 80, borderRadius: 12, borderWidth: 1, padding: 12, fontSize: 14 },
    expandedActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, gap: 10 },
    expandedBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
});
