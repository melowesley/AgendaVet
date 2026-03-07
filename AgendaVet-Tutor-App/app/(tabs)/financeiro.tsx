import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    useColorScheme,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { Colors } from '@/constants/theme';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Invoice {
    id: string;
    pet_id: string;
    total_amount: number;
    status: string;
    created_at: string;
    invoice_items: any[];
    pets: {
        id: string;
        name: string;
    };
}

export default function FinanceiroScreen() {
    const { session } = useAuth();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const CHAVE_PIX_CLINICA = "00.000.000/0001-00"; // Fake CNPJ for example

    const userId = session?.user?.id;

    const fetchInvoices = useCallback(async () => {
        if (!userId) return;
        try {
            // Find all pets belonging to the user
            const { data: userPets } = await supabase
                .from('pets')
                .select('id')
                .eq('user_id', userId);

            const petIds = userPets?.map(p => p.id) || [];

            if (petIds.length === 0) {
                setInvoices([]);
                return;
            }

            // Fetch pending and recent paid invoices
            const { data, error } = await supabase
                .from('invoices')
                .select(`
          id,
          pet_id,
          total_amount,
          status,
          created_at,
          invoice_items ( description, quantity, unit_price ),
          pets ( id, name )
        `)
                .in('pet_id', petIds)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setInvoices(data as unknown as Invoice[]);
        } catch (err: any) {
            console.error('Erro ao buscar faturas:', err.message);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchInvoices();
        setRefreshing(false);
    };

    const handleCopyPix = () => {
        Alert.alert(
            "PIX Copiado!",
            "A chave PIX da clínica foi copiada. Você pode realizar o pagamento no aplicativo do seu banco e depois anexar o comprovante na tela inicial.",
            [{ text: "Entendi" }]
        );
    };

    const formatCurrency = (value: number) => {
        return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    if (loading) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={{ marginTop: 12, color: theme.textSecondary }}>Buscando faturas...</Text>
            </View>
        );
    }

    const pendingInvoices = invoices.filter(inv => inv.status === 'pending');
    const paidInvoices = invoices.filter(inv => inv.status === 'paid');

    return (
        <View style={[styles.screen, { backgroundColor: theme.background }]}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
            >
                <Text style={[styles.pageTitle, { color: theme.text }]}>Faturas e Pagamentos</Text>

                {/* --- PENDENTES --- */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                        Pendentes ({pendingInvoices.length})
                    </Text>
                    {pendingInvoices.length === 0 ? (
                        <View style={[styles.emptyBox, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                            <Ionicons name="checkmark-circle-outline" size={32} color={theme.success} />
                            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Nenhuma fatura pendente!</Text>
                        </View>
                    ) : (
                        pendingInvoices.map(inv => (
                            <View key={inv.id} style={[styles.invoiceCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.error + '40', borderWidth: 1 }]}>
                                <TouchableOpacity
                                    style={styles.cardHeader}
                                    activeOpacity={0.7}
                                    onPress={() => setExpandedId(expandedId === inv.id ? null : inv.id)}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.invoicePet, { color: theme.text }]}>🐾 {inv.pets?.name}</Text>
                                        <Text style={[styles.invoiceDate, { color: theme.textMuted }]}>
                                            {format(new Date(inv.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                        </Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={[styles.invoiceTotal, { color: theme.error }]}>{formatCurrency(inv.total_amount)}</Text>
                                        <View style={[styles.badge, { backgroundColor: theme.error + '20' }]}>
                                            <Text style={[styles.badgeText, { color: theme.error }]}>Pendente</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>

                                {expandedId === inv.id && (
                                    <View style={[styles.expandedContent, { borderTopColor: theme.border }]}>
                                        <Text style={[styles.detailsTitle, { color: theme.text }]}>Detalhes dos Serviços:</Text>
                                        {inv.invoice_items?.map((item, idx) => (
                                            <View key={idx} style={styles.itemRow}>
                                                <Text style={[styles.itemName, { color: theme.textSecondary }]}>{item.quantity}x {item.description}</Text>
                                                <Text style={[styles.itemPrice, { color: theme.text }]}>{formatCurrency(item.unit_price)}</Text>
                                            </View>
                                        ))}

                                        <View style={[styles.pixContainer, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '30' }]}>
                                            <Ionicons name="qr-code-outline" size={24} color={theme.primary} />
                                            <View style={{ flex: 1, marginLeft: 12 }}>
                                                <Text style={[styles.pixLabel, { color: theme.primaryDark }]}>Chave PIX (CNPJ)</Text>
                                                <Text style={[styles.pixKey, { color: theme.primary }]} selectable={true}>{CHAVE_PIX_CLINICA}</Text>
                                            </View>
                                            <TouchableOpacity
                                                style={[styles.copyBtn, { backgroundColor: theme.primary }]}
                                                onPress={handleCopyPix}
                                            >
                                                <Ionicons name="copy-outline" size={16} color="white" />
                                                <Text style={{ color: 'white', fontSize: 13, fontWeight: '700', marginLeft: 6 }}>Copiar</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}
                            </View>
                        ))
                    )}
                </View>

                {/* --- PAGOS / HISTÓRICO --- */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                        Histórico Recente
                    </Text>
                    {paidInvoices.length === 0 ? (
                        <Text style={{ color: theme.textMuted, marginTop: 8 }}>Nenhum pagamento registrado.</Text>
                    ) : (
                        paidInvoices.map(inv => (
                            <View key={inv.id} style={[styles.invoiceCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <View style={styles.cardHeader}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.invoicePet, { color: theme.text }]}>{inv.pets?.name}</Text>
                                        <Text style={[styles.invoiceDate, { color: theme.textMuted }]}>
                                            {format(new Date(inv.created_at), "dd/MM/yyyy")}
                                        </Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={[styles.invoiceTotal, { color: theme.text }]}>{formatCurrency(inv.total_amount)}</Text>
                                        <View style={[styles.badge, { backgroundColor: theme.success + '20' }]}>
                                            <Text style={[styles.badgeText, { color: theme.success }]}>Pago</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        ))
                    )}
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scrollContent: { padding: 20, paddingBottom: 60 },
    pageTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginBottom: 24, marginTop: 8 },

    section: { marginBottom: 32 },
    sectionTitle: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },

    emptyBox: { padding: 30, borderRadius: 20, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center' },
    emptyText: { marginTop: 12, fontSize: 15, fontWeight: '600' },

    invoiceCard: {
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 16,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
    },
    invoicePet: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
    invoiceDate: { fontSize: 13, fontWeight: '500' },
    invoiceTotal: { fontSize: 18, fontWeight: '900', marginBottom: 6 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    badgeText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },

    expandedContent: {
        borderTopWidth: 1,
        padding: 18,
        backgroundColor: 'rgba(0,0,0,0.02)',
    },
    detailsTitle: { fontSize: 13, fontWeight: '700', marginBottom: 12 },
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    itemName: { fontSize: 14, flex: 1 },
    itemPrice: { fontSize: 14, fontWeight: '600' },

    pixContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        padding: 16,
        borderWidth: 1,
        borderRadius: 16,
    },
    pixLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
    pixKey: { fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
    copyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
    }
});
