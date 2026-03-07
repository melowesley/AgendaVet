import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    useColorScheme,
    Platform,
    Modal,
    Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/theme';
import { format } from 'date-fns';
import { usePetTimeline } from '@/hooks/usePetTimeline';
import { ptBR } from 'date-fns/locale';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Pet {
    id: string;
    name: string;
    type: string;
    breed: string | null;
    age: string | null;
    weight: string | null;
    notes: string | null;
    user_id: string | null;
}

const MODULE_COLORS: Record<string, string> = {
    consulta: '#0284C7',          // sky-600
    avaliacao_cirurgica: '#7C3AED', // violet-600
    cirurgia: '#DC2626',           // red-600
    retorno: '#059669',            // emerald-600
    peso: '#4F46E5',               // indigo-600
    patologia: '#7C3AED',          // violet-600
    documento: '#0D9488',          // teal-600
    exame: '#2563EB',              // blue-600
    fotos: '#DB2777',              // pink-600
    vacina: '#0284C7',             // sky-600
    receita: '#EA580C',            // orange-600
    observacoes: '#475569',        // slate-600
    video: '#059669',              // emerald-600
    internacao: '#0F172A',         // slate-900
    diagnostico: '#D97706',        // amber-600
    financeiro: '#10B981',         // emerald-500
};

const MODULE_ICONS: Record<string, any> = {
    consulta: 'medkit',
    avaliacao_cirurgica: 'clipboard-outline',
    cirurgia: 'cut-outline',
    retorno: 'refresh-outline',
    peso: 'scale-outline',
    patologia: 'bandage-outline',
    documento: 'document-attach-outline',
    exame: 'flask-outline',
    fotos: 'camera-outline',
    vacina: 'medical-outline',
    receita: 'document-text-outline',
    observacoes: 'chatbox-ellipses-outline',
    video: 'videocam-outline',
    internacao: 'bed-outline',
    diagnostico: 'pulse-outline',
    financeiro: 'cash-outline',
};

export default function PetDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

    const [pet, setPet] = useState<Pet | null>(null);
    const [loadingPet, setLoadingPet] = useState(true);

    const { timeline, loading: loadingTimeline, refresh } = usePetTimeline(id as string);

    // Filtros e Modal
    const [filterType, setFilterType] = useState<string | null>(null);
    const [filterDate, setFilterDate] = useState<string>('');
    const [selectedItem, setSelectedItem] = useState<any | null>(null);

    const moduleTypes = Array.from(new Set(timeline.map(item => item.module))).filter(Boolean) as string[];

    // Calcula as faturas pendentes do Pet
    const pendingBalance = timeline
        .filter(t => t.module === 'financeiro' && t.details && (t.details as any).status === 'pending')
        .reduce((sum, current) => sum + Number((current.details as any).total_amount || 0), 0);

    const filteredTimeline = timeline.filter(item => {
        if (filterType && item.module !== filterType) return false;
        if (filterDate) {
            const [, m, y] = filterDate.split('/');
            if (item.date) {
                const [iy, im, idate] = item.date.split('-');
                if (filterDate.length === 10) {
                    const [d] = filterDate.split('/');
                    if (idate !== d || im !== m || iy !== y) return false;
                } else if (filterDate.length >= 7) {
                    if (im !== m || iy !== y) return false;
                }
            }
        }
        return true;
    });

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const fetchPetData = useCallback(async () => {
        if (!id) return;
        setLoadingPet(true);
        try {
            const { data: petData, error: petError } = await supabase
                .from('pets')
                .select('*')
                .eq('id', id)
                .single();

            if (petError) throw petError;
            setPet(petData);
        } catch (error: any) {
            console.error('Erro ao buscar dados do pet:', error.message);
        } finally {
            setLoadingPet(false);
        }
    }, [id]);

    useEffect(() => {
        fetchPetData();
    }, [fetchPetData]);

    if (loadingPet || loadingTimeline) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    if (!pet) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.background }]}>
                <Text style={{ color: theme.textSecondary }}>Pet não encontrado.</Text>
            </View>
        );
    }

    return (
        <View style={[styles.screen, { backgroundColor: theme.background }]}>
            <Stack.Screen
                options={{
                    title: pet.name,
                    headerBackTitle: 'Voltar',
                }}
            />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header Info */}
                <View style={[styles.headerCard, { backgroundColor: theme.surface }]}>
                    <View style={styles.headerTop}>
                        <View style={[styles.avatarLarge, { backgroundColor: theme.primary + '15' }]}>
                            <Text style={styles.avatarEmojiLarge}>{pet.type === 'dog' ? '🐶' : pet.type === 'cat' ? '🐱' : '🐾'}</Text>
                        </View>
                        <View style={styles.headerInfo}>
                            <Text style={[styles.petNameLarge, { color: theme.text }]}>{pet.name}</Text>
                            <Text style={[styles.petBreedLarge, { color: theme.textSecondary }]}>
                                {pet.breed || 'Raça não informada'} • {pet.age || 'Idade n/i'}
                            </Text>
                        </View>
                    </View>

                    {pendingBalance > 0 && (
                        <View style={[styles.balanceBox, { backgroundColor: theme.error + '10', borderColor: theme.error + '20' }]}>
                            <Text style={[styles.balanceLabel, { color: theme.error }]}>Faturas Pendentes</Text>
                            <Text style={[styles.balanceValue, { color: theme.error }]}>{formatCurrency(pendingBalance)}</Text>
                        </View>
                    )}
                </View>

                {/* Timeline Section */}
                <View style={styles.timelineHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Histórico Médico</Text>
                    <TouchableOpacity onPress={() => refresh()}>
                        <Ionicons name="refresh" size={18} color={theme.primary} />
                    </TouchableOpacity>
                </View>

                {/* ── Filtros ── */}
                <View style={{ marginBottom: 16, gap: 10 }}>
                    {/* Chips de tipo */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}>
                        <TouchableOpacity
                            style={[styles.chip, !filterType && { backgroundColor: theme.primary }]}
                            onPress={() => setFilterType(null)}>
                            <Text style={[styles.chipText, { color: !filterType ? '#fff' : theme.textSecondary }]}>Todos</Text>
                        </TouchableOpacity>
                        {moduleTypes.map(mod => (
                            <TouchableOpacity key={mod}
                                style={[styles.chip, filterType === mod && { backgroundColor: MODULE_COLORS[mod] || theme.primary }]}
                                onPress={() => setFilterType(filterType === mod ? null : mod)}>
                                <Ionicons name={MODULE_ICONS[mod] || 'document-text-outline'} size={12}
                                    color={filterType === mod ? '#fff' : theme.textSecondary} style={{ marginRight: 4 }} />
                                <Text style={[styles.chipText, { color: filterType === mod ? '#fff' : theme.textSecondary, textTransform: 'capitalize' }]}>
                                    {mod.replace('_', ' ')}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {filteredTimeline.length === 0 ? (
                    <View style={styles.emptyTimeline}>
                        <Ionicons name="document-text-outline" size={48} color={theme.border} />
                        <Text style={[styles.emptyTimelineText, { color: theme.textMuted }]}>
                            {timeline.length === 0 ? 'Nenhum registro no histórico' : 'Nenhum resultado para este filtro'}
                        </Text>
                    </View>
                ) : (
                    filteredTimeline.map((item, index) => (
                        <TouchableOpacity key={item.id} onPress={() => setSelectedItem(item)} activeOpacity={0.85}>
                            <View style={styles.timelineItem}>
                                <View style={styles.timelineLeft}>
                                    <View style={[styles.timelineDot, { backgroundColor: MODULE_COLORS[item.module || ''] || theme.textMuted }]} />
                                    {index !== filteredTimeline.length - 1 && <View style={[styles.timelineLine, { backgroundColor: theme.border }]} />}
                                </View>
                                <View style={[styles.timelineCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                    <View style={styles.timelineCardHeader}>
                                        <View style={[styles.moduleIcon, { backgroundColor: (MODULE_COLORS[item.module || ''] || theme.textMuted) + '20' }]}>
                                            <Ionicons
                                                name={MODULE_ICONS[item.module || ''] || 'document-text-outline'}
                                                size={16}
                                                color={MODULE_COLORS[item.module || ''] || theme.textMuted}
                                            />
                                        </View>
                                        <View style={styles.timelineMeta}>
                                            <Text style={[styles.timelineDate, { color: theme.textMuted }]}>
                                                {format(new Date(item.date), 'dd/MM/yyyy', { locale: ptBR })} às {item.time}
                                            </Text>
                                            <Text style={[styles.timelineTitle, { color: theme.text }]}>{item.title}</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
                                    </View>
                                    {item.veterinarian && (
                                        <Text style={[styles.timelineVet, { color: theme.primary }]}>🩺 {item.veterinarian}</Text>
                                    )}

                                    {/* Exibir Status da Fatura / Comprovante se for cobrança */}
                                    {item.module === 'financeiro' && item.details && (() => {
                                        try {
                                            const details = typeof item.details === 'string' ? JSON.parse(item.details) : item.details;
                                            return (
                                                <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: details.status === 'paid' ? theme.success + '20' : theme.error + '20' }}>
                                                        <Text style={{ fontSize: 11, fontWeight: '700', color: details.status === 'paid' ? theme.success : theme.error }}>
                                                            {details.status === 'paid' ? 'PAGO' : 'PENDENTE'}
                                                        </Text>
                                                    </View>
                                                    <Text style={{ fontSize: 13, fontWeight: '800', color: theme.text }}>{formatCurrency(details.total_amount || 0)}</Text>
                                                </View>
                                            )
                                        } catch (e) {
                                            return null;
                                        }
                                    })()}
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))
                )}

                {/* ── Modal de Detalhe do Procedimento ── */}
                <Modal visible={!!selectedItem} animationType="slide" transparent presentationStyle="overFullScreen">
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalBox, { backgroundColor: theme.surface }]}>
                            {selectedItem && (() => {
                                let dets: any = {};
                                try { dets = typeof selectedItem.details === 'string' ? JSON.parse(selectedItem.details) : (selectedItem.details || {}); } catch (e) { }

                                return (
                                    <>
                                        <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                                            <View style={[styles.moduleIcon, { backgroundColor: (MODULE_COLORS[selectedItem.module] || theme.primary) + '20', width: 40, height: 40, borderRadius: 12 }]}>
                                                <Ionicons name={MODULE_ICONS[selectedItem.module] || 'document-text-outline'} size={20}
                                                    color={MODULE_COLORS[selectedItem.module] || theme.primary} />
                                            </View>
                                            <View style={{ flex: 1, marginLeft: 12 }}>
                                                <Text style={[styles.modalTitle, { color: theme.text }]}>{selectedItem.title}</Text>
                                                <Text style={[styles.timelineDate, { color: theme.textMuted }]}>
                                                    {format(new Date(selectedItem.date), "dd/MM/yyyy", { locale: ptBR })} às {selectedItem.time}
                                                </Text>
                                            </View>
                                            <TouchableOpacity onPress={() => setSelectedItem(null)}>
                                                <Ionicons name="close" size={22} color={theme.textMuted} />
                                            </TouchableOpacity>
                                        </View>

                                        {selectedItem.module === 'financeiro' && dets.invoice_items && (
                                            <View style={styles.modalRow}>
                                                <Text style={[styles.modalLabel, { color: theme.textMuted }]}>Itens Faturados</Text>
                                                {dets.invoice_items.map((sItem: any, i: number) => (
                                                    <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                                        <Text style={{ color: theme.text, fontSize: 13 }}>{sItem.quantity}x {sItem.description}</Text>
                                                        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{formatCurrency(sItem.unit_price)}</Text>
                                                    </View>
                                                ))}
                                                <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: theme.border, flexDirection: 'row', justifyContent: 'space-between' }}>
                                                    <Text style={{ fontWeight: '800', color: theme.text }}>Total:</Text>
                                                    <Text style={{ fontWeight: '800', color: theme.primary }}>{formatCurrency(dets.total_amount)}</Text>
                                                </View>
                                            </View>
                                        )}

                                        {selectedItem.veterinarian && (
                                            <View style={[styles.modalRow, { borderBottomColor: theme.border }]}>
                                                <Text style={[styles.modalLabel, { color: theme.textMuted }]}>Profissional</Text>
                                                <Text style={[styles.modalValue, { color: theme.text }]}>🩺 {selectedItem.veterinarian}</Text>
                                            </View>
                                        )}
                                        {selectedItem.description ? (
                                            <View style={styles.modalRow}>
                                                <Text style={[styles.modalLabel, { color: theme.textMuted }]}>Detalhes</Text>
                                                <Text style={[styles.modalValue, { color: theme.text }]}>{selectedItem.description}</Text>
                                            </View>
                                        ) : (
                                            selectedItem.module !== 'financeiro' && (
                                                <View style={styles.modalRow}>
                                                    <Text style={{ color: theme.textMuted, fontSize: 14 }}>Nenhum detalhe adicional registrado.</Text>
                                                </View>
                                            )
                                        )}

                                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                                            {selectedItem.id.startsWith('history-') && selectedItem.module !== 'financeiro' && (
                                                <View style={{ flex: 1, gap: 8 }}>
                                                    {selectedItem.module === 'documento' && dets.status === 'pending_signature' && (
                                                        <TouchableOpacity
                                                            style={[styles.modalBtn, { backgroundColor: theme.error, marginBottom: 4 }]}
                                                            onPress={() => {
                                                                const historyId = selectedItem.id.replace('history-', '');
                                                                setSelectedItem(null);
                                                                // @ts-ignore
                                                                router.push({ pathname: '/pet-details/assinar-documento', params: { historyId } });
                                                            }}>
                                                            <Ionicons name="create-outline" size={20} color="white" style={{ marginBottom: 4 }} />
                                                            <Text style={{ color: 'white', fontWeight: '800', fontSize: 13 }}>Assinar Documento</Text>
                                                        </TouchableOpacity>
                                                    )}

                                                    <TouchableOpacity
                                                        style={[styles.modalBtn, { backgroundColor: MODULE_COLORS[selectedItem.module] || theme.primary }]}
                                                        onPress={() => {
                                                            const historyId = selectedItem.id.replace('history-', '');
                                                            setSelectedItem(null);
                                                            // @ts-ignore
                                                            router.push({ pathname: '/pet-details/document-viewer', params: { historyId } });
                                                        }}>
                                                        <Ionicons name="document-text-outline" size={20} color="white" style={{ marginBottom: 4 }} />
                                                        <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>Ver {selectedItem.module === 'documento' ? 'Documento' : selectedItem.module === 'receita' ? 'Receita' : 'Detalhes'}</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            )}

                                            <TouchableOpacity
                                                style={[styles.modalBtn, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, flex: selectedItem.id.startsWith('history-') && selectedItem.module !== 'financeiro' ? 0.4 : 1 }]}
                                                onPress={() => setSelectedItem(null)}>
                                                <Ionicons name="close" size={20} color={theme.textSecondary} style={{ marginBottom: 4 }} />
                                                <Text style={{ color: theme.textSecondary, fontWeight: '700', fontSize: 13 }}>Fechar</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </>)
                            })()}
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scrollContent: { padding: 20, paddingBottom: 60 },

    // Header Card
    headerCard: {
        borderRadius: 24,
        padding: 24,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
    },
    headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    headerInfo: { flex: 1 },
    avatarLarge: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    avatarEmojiLarge: { fontSize: 32 },
    petNameLarge: { fontSize: 24, fontWeight: '800', marginBottom: 4, letterSpacing: -0.5 },
    petBreedLarge: { fontSize: 16, marginBottom: 16 },
    petStatsRow: { flexDirection: 'row', gap: 10 },
    statChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    statText: { fontSize: 14, fontWeight: '700' },
    balanceBox: { marginTop: 16, padding: 12, borderRadius: 12, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    balanceLabel: { fontSize: 13, fontWeight: '700' },
    balanceValue: { fontSize: 16, fontWeight: '800' },

    // Section Title
    sectionTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
    timelineHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 4 },

    // Filters
    chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    chipText: { fontSize: 12, fontWeight: '600' },

    // Timeline
    timelineContainer: { paddingLeft: 8 },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    timelineLeft: { width: 30, alignItems: 'center', paddingTop: 10 },
    timelineDot: { width: 10, height: 10, borderRadius: 5, zIndex: 1 },
    timelineLine: { width: 2, flex: 1, position: 'absolute', top: 20, bottom: -10 },
    timelineIconBg: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    timelineCard: {
        flex: 1,
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    timelineCardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    moduleIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    timelineMeta: { flex: 1 },
    timelineType: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
    timelineDate: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
    timelineTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
    timelineDesc: { fontSize: 13, lineHeight: 18, marginBottom: 8 },
    timelineVet: { fontSize: 12, fontWeight: '600' },
    statusBadgeSmall: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusTextSmall: { fontSize: 11, fontWeight: '700' },

    emptyTimeline: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        gap: 12,
    },
    emptyTimelineText: { fontSize: 15, fontWeight: '500' },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalBox: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1 },
    modalTitle: { fontSize: 16, fontWeight: '800' },
    modalRow: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
    modalLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
    modalValue: { fontSize: 14, lineHeight: 22 },
    modalBtn: { flex: 1, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
