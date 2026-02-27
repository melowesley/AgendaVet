import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    ScrollView,
    useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { Colors } from '@/constants/theme';
import { useRouter } from 'expo-router';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Profile {
    full_name: string | null;
    phone: string | null;
    address: string | null;
}

// ─── Componente de linha de info ──────────────────────────────────────────────
function InfoRow({
    icon,
    label,
    value,
    theme,
}: {
    icon: string;
    label: string;
    value: string | null | undefined;
    theme: typeof Colors.light;
}) {
    return (
        <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
            <View style={[styles.infoIconWrap, { backgroundColor: theme.primaryLight }]}>
                <Ionicons name={icon as any} size={18} color={theme.primary} />
            </View>
            <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.textMuted }]}>{label}</Text>
                <Text style={[styles.infoValue, { color: value ? theme.text : theme.textMuted }]}>
                    {value ?? 'Não informado'}
                </Text>
            </View>
        </View>
    );
}

// ─── Tela: Perfil ─────────────────────────────────────────────────────────────
export default function PerfilScreen() {
    const { session } = useAuth();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const router = useRouter();

    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [loggingOut, setLoggingOut] = useState(false);

    const user = session?.user;

    useEffect(() => {
        if (!user?.id) return;

        supabase
            .from('profiles')
            .select('full_name, phone, address')
            .eq('id', user.id)
            .single()
            .then(({ data, error }) => {
                if (!error && data) setProfile(data as Profile);
                setLoading(false);
            });
    }, [user?.id]);

    const handleLogout = () => {
        Alert.alert('Sair', 'Deseja realmente encerrar sua sessão?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Sair',
                style: 'destructive',
                onPress: async () => {
                    setLoggingOut(true);
                    await supabase.auth.signOut();
                    // O AuthProvider já vai detectar e o _layout.tsx vai redirecionar para /login
                    setLoggingOut(false);
                },
            },
        ]);
    };

    if (loading) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    // Iniciais para avatar
    const displayName = profile?.full_name ?? user?.email ?? 'Tutor';
    const initials = displayName
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0]?.toUpperCase() ?? '')
        .join('');

    return (
        <ScrollView
            style={[styles.screen, { backgroundColor: theme.background }]}
            contentContainerStyle={styles.scrollContent}
        >
            {/* Avatar + nome */}
            <View style={[styles.avatarSection, { backgroundColor: theme.surface }]}>
                <View style={[styles.avatarCircle, { backgroundColor: theme.primary }]}>
                    <Text style={styles.avatarText}>{initials || '🐾'}</Text>
                </View>
                <Text style={[styles.userName, { color: theme.text }]}>{displayName}</Text>
                <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{user?.email}</Text>
                <View style={[styles.roleBadge, { backgroundColor: theme.primaryLight }]}>
                    <Ionicons name="heart-outline" size={13} color={theme.primary} />
                    <Text style={[styles.roleText, { color: theme.primary }]}>Tutor de pets</Text>
                </View>
            </View>

            {/* Informações do perfil */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Informações pessoais</Text>

                <InfoRow icon="person-outline" label="Nome completo" value={profile?.full_name} theme={theme} />
                <InfoRow icon="mail-outline" label="E-mail" value={user?.email} theme={theme} />
                <InfoRow icon="call-outline" label="Telefone" value={profile?.phone} theme={theme} />
                <InfoRow icon="location-outline" label="Endereço" value={profile?.address} theme={theme} />
            </View>

            {/* Ações */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Conta</Text>

                <TouchableOpacity
                    style={[styles.actionRow, { borderBottomColor: theme.border }]}
                    onPress={() => Alert.alert('Em breve', 'Edição de perfil em desenvolvimento.')}
                    activeOpacity={0.7}
                >
                    <View style={[styles.actionIconWrap, { backgroundColor: '#e0f2fe' }]}>
                        <Ionicons name="create-outline" size={18} color="#0369a1" />
                    </View>
                    <Text style={[styles.actionLabel, { color: theme.text }]}>Editar perfil</Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionRow, { borderBottomColor: theme.border }]}
                    onPress={() => Alert.alert('Em breve', 'Alteração de senha disponível em breve.')}
                    activeOpacity={0.7}
                >
                    <View style={[styles.actionIconWrap, { backgroundColor: '#fef3c7' }]}>
                        <Ionicons name="lock-closed-outline" size={18} color="#b45309" />
                    </View>
                    <Text style={[styles.actionLabel, { color: theme.text }]}>Alterar senha</Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionRow, { borderBottomColor: 'transparent' }]}
                    onPress={handleLogout}
                    disabled={loggingOut}
                    activeOpacity={0.7}
                >
                    <View style={[styles.actionIconWrap, { backgroundColor: '#fee2e2' }]}>
                        {loggingOut
                            ? <ActivityIndicator size="small" color="#991b1b" />
                            : <Ionicons name="log-out-outline" size={18} color="#991b1b" />}
                    </View>
                    <Text style={[styles.actionLabel, { color: '#ef4444' }]}>Sair</Text>
                    <Ionicons name="chevron-forward" size={16} color="#ef4444" />
                </TouchableOpacity>
            </View>

            {/* Footer */}
            <Text style={[styles.footer, { color: theme.textMuted }]}>
                AgendaVet — Portal do Tutor v1.0
            </Text>
        </ScrollView>
    );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    screen: { flex: 1 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scrollContent: { padding: 16, paddingBottom: 40 },

    // Avatar section
    avatarSection: {
        alignItems: 'center',
        borderRadius: 20,
        padding: 28,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    avatarCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    avatarText: { fontSize: 28, color: '#fff', fontWeight: '700' },
    userName: { fontSize: 20, fontWeight: '700', marginBottom: 2 },
    userEmail: { fontSize: 14, marginBottom: 10 },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 12,
    },
    roleText: { fontSize: 13, fontWeight: '600' },

    // Card
    card: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    cardTitle: { fontSize: 13, fontWeight: '700', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },

    // Info row
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
    },
    infoIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoContent: { flex: 1 },
    infoLabel: { fontSize: 11, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.3 },
    infoValue: { fontSize: 14, fontWeight: '500' },

    // Action row
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    actionIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionLabel: { flex: 1, fontSize: 15, fontWeight: '500' },

    footer: { textAlign: 'center', fontSize: 12, marginTop: 8 },
});
