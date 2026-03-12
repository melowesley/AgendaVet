import React, { useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, FlatList, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAppointmentRequests } from '@/hooks/useAppointmentRequests';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export default function SolicitacoesScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const theme = Colors[isDark ? 'dark' : 'light'];
    const queryClient = useQueryClient();
    const { requests, loading, refresh } = useAppointmentRequests();
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

    const renderItem = ({ item }: { item: any }) => {
        const statusColor = getStatusColor(item.status);
        return (
            <Card className="mb-4 border-l-4" style={{ borderLeftColor: statusColor }}>
                <View className="p-4">
                    <View className="flex-row justify-between items-start mb-4">
                        <View className="flex-1">
                            <Text className="text-base font-black text-foreground">{item.pet?.name?.toUpperCase()}</Text>
                            <Text className="text-xs text-muted-foreground font-medium uppercase tracking-tighter">
                                {item.pet?.breed || 'SRD'}
                            </Text>
                        </View>
                        <View className="px-2 py-0.5 rounded-md" style={{ backgroundColor: statusColor + '20' }}>
                            <Text className="text-[9px] font-black uppercase" style={{ color: statusColor }}>
                                {getStatusLabel(item.status)}
                            </Text>
                        </View>
                    </View>

                    <View className="gap-2 mb-4">
                        <View className="flex-row items-center gap-2">
                            <Ionicons name="person" size={12} color={theme.primary} />
                            <Text className="text-sm text-foreground font-semibold">{item.profile?.full_name}</Text>
                        </View>
                        <View className="flex-row items-center gap-2">
                            <Ionicons name="calendar" size={12} color={theme.primary} />
                            <Text className="text-sm text-foreground/80 font-medium">
                                {format(parseISO(item.preferred_date), "dd/MM/yyyy", { locale: ptBR })} às {item.preferred_time}
                            </Text>
                        </View>
                        {item.reason && (
                            <View className="flex-row items-start gap-2 bg-muted/30 p-2 rounded-lg border border-border/40">
                                <Ionicons name="chatbubble-ellipses" size={12} color={theme.textMuted} style={{ marginTop: 2 }} />
                                <Text className="text-xs text-muted-foreground leading-4 italic flex-1">{item.reason}</Text>
                            </View>
                        )}
                    </View>

                    {item.status === 'pending' && (
                        <View className="flex-row gap-3 mt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                label="Recusar"
                                className="flex-1 border-destructive/20"
                                onPress={() => handleAction(item.id, 'cancelled')}
                                leftIcon={<Ionicons name="close-circle" size={16} color="#EF4444" />}
                            />
                            <Button
                                variant="default"
                                size="sm"
                                label="Aprovar"
                                className="flex-1"
                                onPress={() => handleAction(item.id, 'confirmed')}
                                leftIcon={<Ionicons name="checkmark-circle" size={16} color="white" />}
                            />
                        </View>
                    )}
                </View>
            </Card>
        );
    };

    return (
        <View className="flex-1" style={{ backgroundColor: theme.background }}>
            <View className="px-5 pt-14 pb-4">
                <View className="mb-6">
                    <Text className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
                        Novos Agendamentos
                    </Text>
                    <Text className="text-2xl font-black text-foreground tracking-tight">Solicitações</Text>
                </View>

                {/* Filters Premium Pill Style */}
                <View className="flex-row bg-card/60 p-1.5 rounded-2xl border border-border/50 gap-2">
                    {(['pending', 'confirmed', 'all'] as const).map(f => {
                        const isSelected = filter === f;
                        return (
                            <TouchableOpacity
                                key={f}
                                activeOpacity={0.7}
                                className={cn(
                                    "flex-1 items-center justify-center py-2.5 rounded-xl",
                                    isSelected ? "bg-primary shadow-sm shadow-primary/50" : "bg-transparent"
                                )}
                                onPress={() => setFilter(f)}
                            >
                                <Text className={cn(
                                    "text-[10px] font-black uppercase tracking-tighter",
                                    isSelected ? "text-white" : "text-muted-foreground"
                                )}>
                                    {f === 'pending' ? 'Pendentes' : f === 'confirmed' ? 'Confirmados' : 'Todos'}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            <FlatList
                data={filteredRequests}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={theme.primary} />}
                ListEmptyComponent={
                    <View className="items-center py-20 bg-card/40 rounded-3xl border border-dashed border-border/60 mx-4">
                        <Ionicons name="mail-open-outline" size={64} color={theme.textMuted} />
                        <Text className="text-muted-foreground mt-4 font-medium text-center px-6">
                            Nenhuma solicitação encontrada para o filtro selecionado.
                        </Text>
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
