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
            <View style={[styles.infoIconWrap, { backgroundColor: theme.primary + '15' }]}>
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
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
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
            <View style={[styles.avatarSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={[styles.avatarCircle, { backgroundColor: theme.primary }]}>
                    <Text style={styles.avatarText}>{initials || '🐾'}</Text>
                </View>
                <Text style={[styles.userName, { color: theme.text }]}>{displayName}</Text>
                <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{user?.email}</Text>
                <View style={[styles.roleBadge, { backgroundColor: theme.primary + '15' }]}>
                    <Ionicons name="heart" size={12} color={theme.primary} />
                    <Text style={[styles.roleText, { color: theme.primary }]}>Tutor de pets</Text>
                </View>
            </View>

            {/* Informações do perfil */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.cardTitle, { color: theme.textMuted }]}>Informações pessoais</Text>

                <InfoRow icon="person-outline" label="Nome completo" value={profile?.full_name} theme={theme} />
                <InfoRow icon="mail-outline" label="E-mail" value={user?.email} theme={theme} />
                <InfoRow icon="call-outline" label="Telefone" value={profile?.phone} theme={theme} />
                <InfoRow icon="location-outline" label="Endereço" value={profile?.address} theme={theme} />
            </View>

            {/* Ações */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.cardTitle, { color: theme.textMuted }]}>Configurações da Conta</Text>

                <TouchableOpacity
                    style={[styles.actionRow, { borderBottomColor: theme.border }]}
                    onPress={() => Alert.alert('Em breve', 'Edição de perfil em desenvolvimento.')}
                    activeOpacity={0.7}
                >
                    <View style={[styles.actionIconWrap, { backgroundColor: '#3b82f615' }]}>
                        <Ionicons name="create-outline" size={18} color="#3b82f6" />
                    </View>
                    <Text style={[styles.actionLabel, { color: theme.text }]}>Editar perfil</Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionRow, { borderBottomColor: theme.border }]}
                    onPress={() => Alert.alert('Em breve', 'Alteração de senha disponível em breve.')}
                    activeOpacity={0.7}
                >
                    <View style={[styles.actionIconWrap, { backgroundColor: '#f59e0b15' }]}>
                        <Ionicons name="lock-closed-outline" size={18} color="#f59e0b" />
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
                    <View style={[styles.actionIconWrap, { backgroundColor: '#ef444415' }]}>
                        {loggingOut
                            ? <ActivityIndicator size="small" color="#ef4444" />
                            : <Ionicons name="log-out-outline" size={18} color="#ef4444" />}
                    </View>
                    <Text style={[styles.actionLabel, { color: '#ef4444' }]}>Sair da conta</Text>
                    <Ionicons name="chevron-forward" size={16} color="#ef4444" />
                </TouchableOpacity>
            </View>

            {/* Footer */}
            <Text style={[styles.footer, { color: theme.textMuted }]}>
                AgendaVet — Portal do Tutor v1.0.0
            </Text>
        </ScrollView>
    );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    screen: { flex: 1 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scrollContent: { padding: 20, paddingBottom: 40 },

    // Avatar section
    avatarSection: {
        alignItems: 'center',
        borderRadius: 24,
        padding: 32,
        marginBottom: 20,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
    },
    avatarCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    avatarText: { fontSize: 36, color: '#fff', fontWeight: '800' },
    userName: { fontSize: 24, fontWeight: '800', marginBottom: 4, letterSpacing: -0.5 },
    userEmail: { fontSize: 14, marginBottom: 16, opacity: 0.7 },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    roleText: { fontSize: 13, fontWeight: '700' },

    // Card
    card: {
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 11,
        fontWeight: '800',
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 1
    },

    // Info row
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    infoIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoContent: { flex: 1 },
    infoLabel: { fontSize: 11, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700' },
    infoValue: { fontSize: 15, fontWeight: '600' },

    // Action row
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    actionIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionLabel: { flex: 1, fontSize: 16, fontWeight: '600' },

    footer: { textAlign: 'center', fontSize: 12, marginTop: 12, opacity: 0.5 },
});
