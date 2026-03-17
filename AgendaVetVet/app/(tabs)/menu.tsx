import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, useColorScheme, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'expo-router';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export default function MenuScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const theme = Colors[isDark ? 'dark' : 'light'];
    const { session, isAdmin, signOut } = useAuth();
    const router = useRouter();
    const [vetName, setVetName] = useState('Veterinário');
    const [vetCrmv, setVetCrmv] = useState('');

    useEffect(() => {
        if (!session?.user?.id) return;
        supabase.from('profiles').select('full_name, crmv').eq('user_id', session.user.id).single()
            .then(({ data }) => {
                if (data?.full_name) setVetName(data.full_name);
                if (data?.crmv) setVetCrmv(data.crmv);
            });
    }, [session?.user?.id]);

    const handleLogout = async () => {
        Alert.alert(
            'Sair',
            'Deseja realmente sair da conta?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Sair', style: 'destructive', onPress: async () => await signOut() }
            ]
        );
    };

    const MenuItem = ({ icon, label, route, color }: { icon: any, label: string, route: any, color: string }) => (
        <Card className="mb-3 border-border/40">
            <TouchableOpacity
                className="p-4 flex-row items-center"
                activeOpacity={0.7}
                onPress={() => router.push(route)}
            >
                <View className="w-10 h-10 rounded-xl items-center justify-center mr-4" style={{ backgroundColor: color + '15' }}>
                    <Ionicons name={icon} size={20} color={color} />
                </View>
                <Text className="flex-1 text-base font-semibold text-foreground">{label}</Text>
                <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </TouchableOpacity>
        </Card>
    );

    return (
        <View className="flex-1" style={{ backgroundColor: theme.background }}>
            <View className="px-5 pt-14 pb-4">
                <Text className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
                    Meu Perfil
                </Text>
                <Text className="text-2xl font-black text-foreground tracking-tight">Ajustes</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                {/* Profile Card Premium */}
                <Card className="mb-8 border-primary/20 bg-primary/5">
                    <View className="p-6 flex-row items-center">
                        <View className="w-16 h-16 rounded-full items-center justify-center bg-primary mr-4 shadow-lg shadow-primary/30">
                            <Ionicons name="person" size={32} color="white" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-xl font-black text-foreground">{vetName}</Text>
                            {vetCrmv ? (
                                <View className="bg-primary px-2 py-0.5 rounded self-start mt-1 mb-1">
                                    <Text className="text-[10px] font-black text-white uppercase">CRMV {vetCrmv}</Text>
                                </View>
                            ) : null}
                            <Text className="text-xs text-muted-foreground font-medium">{session?.user?.email}</Text>
                        </View>
                    </View>
                </Card>

                <View className="mb-6">
                    <Text className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1 mb-3">
                        Assistente IA
                    </Text>
                    <MenuItem icon="medical" label="Vet Copilot" route="/vet-copilot" color="#10B981" />
                </View>

                <View className="mb-6">
                    <Text className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1 mb-3">
                        Gestão da Clínica
                    </Text>
                    <MenuItem icon="calendar" label="Calendário Geral" route="/menu/calendario" color="#3B82F6" />
                    <MenuItem icon="people" label="Tutores e Clientes" route="/menu/tutores" color="#10B981" />
                    <MenuItem icon="list" label="Tipos de Serviços" route="/menu/servicos" color="#8B5CF6" />
                </View>

                <View className="mb-6">
                    <Text className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1 mb-3">
                        Configurações
                    </Text>
                    <MenuItem icon="person-circle" label="Editar Perfil" route="/menu/perfil" color="#6366F1" />
                    
                    <Button
                        variant="destructive"
                        label="Sair da Conta"
                        onPress={handleLogout}
                        className="mt-4"
                        leftIcon={<Ionicons name="log-out" size={20} color="white" />}
                    />
                </View>

                <Text className="text-center mt-8 text-[10px] font-bold text-muted-foreground uppercase tracking-tighter opacity-50">
                    AgendaVet v1.0.0
                </Text>
            </ScrollView>
        </View>
    );
}
