import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, useColorScheme, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'expo-router';

export default function MenuScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
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
        <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => router.push(route)}
        >
            <View style={[styles.menuIcon, { backgroundColor: color + '15' }]}>
                <Ionicons name={icon} size={22} color={color} />
            </View>
            <Text style={[styles.menuLabel, { color: theme.text }]}>{label}</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
        </TouchableOpacity>
    );

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Profile Card */}
            <View style={[styles.profileCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={[styles.avatar, { backgroundColor: theme.primary + '15' }]}>
                    <Ionicons name="person" size={40} color={theme.primary} />
                </View>
                <View style={styles.profileInfo}>
                    <Text style={[styles.profileName, { color: theme.text }]}>{vetName}</Text>
                    {vetCrmv ? <Text style={[styles.profileCrmv, { color: theme.primary }]}>CRMV {vetCrmv}</Text> : null}
                    <Text style={[styles.profileEmail, { color: theme.textSecondary }]}>{session?.user?.email}</Text>
                    {isAdmin && (
                        <View style={[styles.badge, { backgroundColor: theme.primary + '15' }]}>
                            <Text style={[styles.badgeText, { color: theme.primary }]}>ADMIN</Text>
                        </View>
                    )}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Assistente IA</Text>
                <MenuItem icon="medical" label="Vet Copilot" route="/vet-copilot" color="#10B981" />
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Gestão da Clínica</Text>
                <MenuItem icon="calendar" label="Calendário Geral" route="/menu/calendario" color="#3B82F6" />
                <MenuItem icon="people" label="Tutores e Clientes" route="/menu/tutores" color="#10B981" />
                <MenuItem icon="list" label="Tipos de Serviços" route="/menu/servicos" color="#8B5CF6" />
                {/* Analytics disponível apenas no app web */}
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Conta</Text>
                <MenuItem icon="person-circle" label="Meu Perfil" route="/menu/perfil" color="#6366F1" />
                <TouchableOpacity
                    style={[styles.menuItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    onPress={handleLogout}
                >
                    <View style={[styles.menuIcon, { backgroundColor: '#FEE2E2' }]}>
                        <Ionicons name="log-out" size={22} color="#EF4444" />
                    </View>
                    <Text style={[styles.menuLabel, { color: '#EF4444', fontWeight: '700' }]}>Sair do Aplicativo</Text>
                </TouchableOpacity>
            </View>

            <Text style={[styles.footer, { color: theme.textMuted }]}>AgendaVet v1.0.0</Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    profileCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 20, borderWidth: 1, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    profileInfo: { flex: 1, alignItems: 'flex-start' },
    profileName: { fontSize: 20, fontWeight: '800', marginBottom: 2 },
    profileCrmv: { fontSize: 12, fontWeight: '700', marginBottom: 2 },
    profileEmail: { fontSize: 13, marginBottom: 8 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 4 },
    menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 10 },
    menuIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    menuLabel: { flex: 1, fontSize: 16, fontWeight: '600' },
    footer: { textAlign: 'center', marginTop: 16, marginBottom: 40, fontSize: 12, fontWeight: '600', opacity: 0.5 },
});
