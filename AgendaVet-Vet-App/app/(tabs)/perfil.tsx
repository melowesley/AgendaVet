import React from 'react';
import { View, Text, StyleSheet, useColorScheme, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

export default function PerfilScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
    const { session, isAdmin } = useAuth();

    const handleLogout = async () => {
        Alert.alert(
            'Sair',
            'Deseja realmente sair da conta?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Sair', style: 'destructive', onPress: async () => await supabase.auth.signOut() }
            ]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={[styles.avatar, { backgroundColor: theme.primary + '15' }]}>
                    <Ionicons name="person" size={64} color={theme.primary} />
                </View>

                <View style={styles.info}>
                    <Text style={[styles.title, { color: theme.text }]}>Veterinário</Text>
                    <Text style={[styles.email, { color: theme.textSecondary }]}>{session?.user?.email}</Text>
                    {isAdmin && (
                        <View style={[styles.badge, { backgroundColor: theme.primary + '15' }]}>
                            <Text style={[styles.badgeText, { color: theme.primary }]}>ADMINISTRADOR</Text>
                        </View>
                    )}
                </View>

                <View style={[styles.divider, { backgroundColor: theme.border }]} />

                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                    <Text style={styles.logoutText}>Sair da Conta</Text>
                </TouchableOpacity>
            </View>

            <Text style={[styles.footer, { color: theme.textMuted }]}>AgendaVet v1.0.0 (Native)</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 24, justifyContent: 'center' },
    card: {
        borderRadius: 32,
        borderWidth: 1,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
    },
    avatar: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    info: { alignItems: 'center', gap: 4, marginBottom: 32 },
    title: { fontSize: 22, fontWeight: '800' },
    email: { fontSize: 14, marginBottom: 12 },
    badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
    badgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    divider: { height: 1, width: '100%', marginBottom: 24 },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
    logoutText: { color: '#EF4444', fontWeight: '700', fontSize: 16 },
    footer: { textAlign: 'center', marginTop: 32, fontSize: 12, fontWeight: '600', opacity: 0.5 }
});
