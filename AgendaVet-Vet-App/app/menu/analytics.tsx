import React from 'react';
import { View, Text, StyleSheet, useColorScheme, ScrollView, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { Stack } from 'expo-router';

export default function AnalyticsScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

    const { data: metrics, isLoading } = useQuery({
        queryKey: ['admin-metrics'],
        queryFn: async () => {
            const [pets, clients, appointments] = await Promise.all([
                supabase.from('pets').select('id', { count: 'exact' }),
                supabase.from('profiles').select('id', { count: 'exact' }),
                supabase.from('appointment_requests').select('status, id'),
            ]);

            const completed = appointments.data?.filter(a => a.status === 'completed').length || 0;
            const cancelled = appointments.data?.filter(a => a.status === 'cancelled').length || 0;

            return {
                totalPets: pets.count || 0,
                totalClients: clients.count || 0,
                completedAppointments: completed,
                cancelledAppointments: cancelled,
            };
        }
    });

    const MetricCard = ({ title, value, icon, color }: any) => (
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: color }]}>
            <View style={[styles.iconContainer, { backgroundColor: color + '15', borderColor: color + '30', borderWidth: 1 }]}>
                <Ionicons name={icon} size={28} color={color} />
            </View>
            <View style={styles.info}>
                <Text style={[styles.value, { color: theme.text }]}>{value}</Text>
                <Text style={[styles.title, { color: theme.textSecondary }]}>{title}</Text>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen options={{ title: 'Analytics', headerBackTitle: 'Menu' }} />

            {isLoading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={theme.primary} /></View>
            ) : (
                <ScrollView contentContainerStyle={styles.scroll}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Visão Geral</Text>

                    <View style={styles.grid}>
                        <MetricCard title="Total de Pets" value={metrics?.totalPets} icon="paw" color="#8B5CF6" />
                        <MetricCard title="Clientes Ativos" value={metrics?.totalClients} icon="people" color="#10B981" />
                        <MetricCard title="Consultas Realizadas" value={metrics?.completedAppointments} icon="checkmark-circle" color="#3B82F6" />
                        <MetricCard title="Cancelamentos" value={metrics?.cancelledAppointments} icon="close-circle" color="#EF4444" />
                    </View>

                    <View style={[styles.banner, { backgroundColor: theme.primary + '15', borderColor: theme.primary + '30' }]}>
                        <Ionicons name="trending-up" size={24} color={theme.primary} />
                        <Text style={[styles.bannerText, { color: theme.primary }]}>
                            Gráficos de faturamento e evolução de pacientes em desenvolvimento para a próxima versão.
                        </Text>
                    </View>
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scroll: { padding: 16 },
    sectionTitle: { fontSize: 20, fontWeight: '800', marginBottom: 16 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
    card: { flex: 1, minWidth: '45%', padding: 20, borderRadius: 20, borderWidth: 1, gap: 14, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    iconContainer: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    info: { gap: 4 },
    value: { fontSize: 24, fontWeight: '800' },
    title: { fontSize: 13, fontWeight: '600' },
    banner: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, gap: 12 },
    bannerText: { flex: 1, fontSize: 14, fontWeight: '600', lineHeight: 20 }
});
