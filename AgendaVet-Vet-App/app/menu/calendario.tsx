import React, { useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { format, parseISO, isToday, isTomorrow, isPast, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CalendarioScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
    const router = useRouter();

    const { data: appointments, isLoading, refetch } = useQuery({
        queryKey: ['calendario-agendamentos'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('appointment_requests')
                .select(`
                    *,
                    pet:pet_id (id, name, breed, type),
                    profile:user_id (full_name, phone)
                `)
                .in('status', ['confirmed', 'checked_in', 'in_progress'])
                .order('scheduled_date', { ascending: true })
                .order('scheduled_time', { ascending: true });

            if (error) throw error;
            return data || [];
        }
    });

    const getDayLabel = (dateStr: string) => {
        if (!dateStr) return 'Data indefinida';
        const date = parseISO(dateStr);
        if (isToday(date)) return 'Hoje';
        if (isTomorrow(date)) return 'Amanhã';
        return format(date, "EEEE, d 'de' MMMM", { locale: ptBR });
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.primary }]}
            onPress={() => item.pet?.id && router.push(`/pet/${item.pet.id}`)}
        >
            <View style={[styles.timeContainer, { borderRightColor: theme.border }]}>
                <Text style={[styles.timeText, { color: theme.primary }]}>
                    {item.scheduled_time?.slice(0, 5) || '--:--'}
                </Text>
                <View style={[styles.statusDot, { backgroundColor: item.status === 'in_progress' ? '#8B5CF6' : item.status === 'checked_in' ? '#0891B2' : theme.primary }]} />
            </View>

            <View style={styles.infoContainer}>
                <Text style={[styles.petName, { color: theme.text }]}>
                    {item.pet?.name?.toUpperCase() || 'PACIENTE'}
                </Text>
                <Text style={[styles.ownerName, { color: theme.textSecondary }]}>
                    Tutor: {item.profile?.full_name || 'Desconhecido'}
                </Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color={theme.primary} />
        </TouchableOpacity>
    );

    // Grouping by date
    let lastDate = '';

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen options={{ title: 'Agenda Geral', headerBackTitle: 'Menu' }} />

            {isLoading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <FlatList
                    data={appointments}
                    keyExtractor={item => item.id}
                    refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={theme.primary} />}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => {
                        const dateStr = item.scheduled_date || item.preferred_date;
                        const showHeader = dateStr !== lastDate;
                        if (showHeader) lastDate = dateStr;

                        return (
                            <View>
                                {showHeader && (
                                    <View style={styles.dateHeader}>
                                        <Text style={[styles.dateHeaderText, { color: theme.textSecondary }]}>
                                            {getDayLabel(dateStr).toUpperCase()}
                                        </Text>
                                    </View>
                                )}
                                {renderItem({ item })}
                            </View>
                        );
                    }}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="calendar-outline" size={64} color={theme.textMuted} />
                            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Nenhum agendamento futuro confirmado.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    list: { padding: 16, paddingBottom: 100 },
    dateHeader: { marginTop: 16, marginBottom: 8, paddingHorizontal: 4 },
    dateHeaderText: { fontSize: 13, fontWeight: '800', letterSpacing: 1 },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 10,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1
    },
    timeContainer: {
        alignItems: 'center',
        marginRight: 16,
        paddingRight: 16,
        borderRightWidth: 1,
        minWidth: 70,
    },
    timeText: { fontSize: 18, fontWeight: '800' },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
    infoContainer: { flex: 1 },
    petName: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
    ownerName: { fontSize: 13 },
    empty: { alignItems: 'center', marginTop: 100, gap: 12 },
    emptyText: { fontSize: 15, fontWeight: '500' }
});
