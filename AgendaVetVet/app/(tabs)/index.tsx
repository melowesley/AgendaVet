import React from 'react';
import {
    View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator
} from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { useRouter, Link } from 'expo-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export default function Dashboard() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
    const router = useRouter();

    const { data: stats, isLoading: statsLoading, refetch } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const today = new Date().toISOString().split('T')[0];
            
            const [petsRes, ownersRes, appointmentsRes] = await Promise.all([
                supabase.from('pets').select('id', { count: 'exact' }),
                supabase.from('owners').select('id', { count: 'exact' }),
                supabase.from('appointment_requests').select('*'),
            ]);

            const appointments = appointmentsRes.data || [];
            const todayAppointments = appointments.filter(a => a.date === today);
            const pendingAppointments = appointments.filter(a => a.status === 'pending' || a.status === 'scheduled');

            return {
                petsCount: petsRes.count || 0,
                ownersCount: ownersRes.count || 0,
                todayCount: todayAppointments.length,
                pendingCount: pendingAppointments.length,
                recentAppointments: appointments
                    .filter(a => a.status !== 'completed' && a.status !== 'cancelled')
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .slice(0, 4),
                recentPets: appointments
                    .map(a => a.pet)
                    .filter((v, i, a) => v && a.findIndex(t => t?.id === v?.id) === i)
                    .slice(0, 4)
            };
        }
    });

    if (statsLoading) {
        return (
            <View className="flex-1 items-center justify-center bg-background">
                <ActivityIndicator color={theme.primary} />
            </View>
        );
    }

    const statCards = [
        { title: 'Pacientes', value: stats?.petsCount, icon: 'paw', color: 'text-emerald-500' },
        { title: 'Tutores', value: stats?.ownersCount, icon: 'people', color: 'text-blue-500' },
        { title: 'Hoje', value: stats?.todayCount, icon: 'calendar', color: 'text-amber-500' },
        { title: 'Pendentes', value: stats?.pendingCount, icon: 'time', color: 'text-rose-500' },
    ];

    return (
        <ScrollView 
            className="flex-1 bg-background"
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={<RefreshControl refreshing={statsLoading} onRefresh={refetch} tintColor={theme.primary} />}
        >
            {/* Header Mirroring Web */}
            <View className="px-6 pt-16 pb-6">
                <Text className="text-sm font-bold text-emerald-500 uppercase tracking-widest">Visão Geral</Text>
                <Text className="text-3xl font-bold text-foreground mt-1">Olá, Veterinário</Text>
                <Text className="text-muted-foreground mt-1">Aqui está o panorama da sua clínica hoje.</Text>
                
                <View className="flex-row gap-2 mt-6">
                    <Button 
                        label="Novo Agendamento" 
                        leftIcon={<Ionicons name="add" size={18} color="white" />}
                        className="flex-1"
                    />
                    <Button 
                        variant="outline"
                        leftIcon={<Ionicons name="search" size={18} color={theme.primary} />}
                        className="flex-1"
                        label="Buscar Info"
                    />
                </View>
            </View>

            {/* Quick Stats Grid */}
            <View className="px-6 grid grid-cols-2 gap-4 flex-row flex-wrap">
                {statCards.map((stat, i) => (
                    <Card key={i} className="w-[47%] mb-4">
                        <CardHeader className="p-4 pb-2 flex-row justify-between items-center">
                            <Text className="text-xs font-bold text-muted-foreground uppercase">{stat.title}</Text>
                            <Ionicons name={stat.icon as any} size={16} className={stat.color} color={theme.primary} />
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <Text className="text-2xl font-bold text-foreground font-mono">{stat.value}</Text>
                        </CardContent>
                    </Card>
                ))}
            </View>

            {/* Recent Appointments */}
            <View className="px-6 mt-4">
                <Card>
                    <CardHeader className="flex-row justify-between items-center border-b border-border/50 pb-4">
                        <CardTitle className="text-lg flex-row items-center gap-2">
                            <Ionicons name="calendar-outline" size={20} color={theme.primary} />
                            <Text className="ml-2">Agendamentos</Text>
                        </CardTitle>
                        <TouchableOpacity>
                            <Text className="text-xs text-muted-foreground">Ver Todos</Text>
                        </TouchableOpacity>
                    </CardHeader>
                    <CardContent className="pt-4 px-2">
                        {stats?.recentAppointments.length === 0 ? (
                            <View className="py-8 items-center">
                                <Ionicons name="checkmark-circle-outline" size={40} color={theme.primary} opacity={0.3} />
                                <Text className="text-muted-foreground mt-2">Tudo livre por enquanto</Text>
                            </View>
                        ) : (
                            stats?.recentAppointments.map((app, i) => (
                                <View key={i} className="flex-row items-center justify-between p-3 border-b border-border/30 last:border-0">
                                    <View className="flex-row items-center gap-3">
                                        <View className="w-10 h-10 rounded-full bg-emerald-500/10 items-center justify-center">
                                            <Ionicons name="paw" size={18} color={theme.primary} />
                                        </View>
                                        <View>
                                            <Text className="font-bold text-foreground">{app.pet?.name || 'Vazio'}</Text>
                                            <Text className="text-xs text-muted-foreground font-mono">{app.time}</Text>
                                        </View>
                                    </View>
                                    <View className="px-2 py-1 bg-muted rounded-md">
                                        <Text className="text-[10px] font-bold text-muted-foreground uppercase">{app.type}</Text>
                                    </View>
                                </View>
                            ))
                        )}
                    </CardContent>
                </Card>
            </View>

            {/* Recent Patients */}
            <View className="px-6 mt-6">
                <Card>
                    <CardHeader className="flex-row justify-between items-center border-b border-border/50 pb-4">
                        <CardTitle className="text-lg flex-row items-center gap-2">
                            <Ionicons name="list-outline" size={20} color={theme.primary} />
                            <Text className="ml-2">Pacientes Recentes</Text>
                        </CardTitle>
                        <TouchableOpacity>
                            <Text className="text-xs text-muted-foreground">Ver Todos</Text>
                        </TouchableOpacity>
                    </CardHeader>
                    <CardContent className="pt-4 px-2">
                        {stats?.recentPets.map((pet, i) => (
                            <View key={i} className="flex-row items-center justify-between p-3 border-b border-border/30 last:border-0">
                                <View className="flex-row items-center gap-3">
                                    <View className="w-10 h-10 rounded-full border border-border items-center justify-center">
                                        <Ionicons name="paw" size={18} color={theme.primary} />
                                    </View>
                                    <View>
                                        <Text className="font-bold text-foreground">{pet?.name}</Text>
                                        <Text className="text-xs text-muted-foreground">{pet?.breed}</Text>
                                    </View>
                                </View>
                                <View className="px-2 py-1 border border-border rounded-md">
                                    <Text className="text-[10px] font-bold text-muted-foreground uppercase">{pet?.species}</Text>
                                </View>
                            </View>
                        ))}
                    </CardContent>
                </Card>
            </View>
        </ScrollView>
    );
}

