import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, useColorScheme, ScrollView, TouchableOpacity, ActivityIndicator, Image, Linking, Alert, TextInput, Modal } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { usePetTimeline } from '@/hooks/usePetTimeline';
import { supabase } from '@/lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { logPetAdminHistory } from '@/lib/services/petHistory';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

const MODULE_COLORS: Record<string, string> = {
    consulta: '#0284C7',          // sky-600
    avaliacao_cirurgica: '#7C3AED', // violet-600
    cirurgia: '#DC2626',           // red-600
    retorno: '#059669',            // emerald-600
    peso: '#4F46E5',               // indigo-600
    patologia: '#7C3AED',          // violet-600
    documento: '#0D9488',          // teal-600
    vacina: '#DB2777',             // pink-600
    receita: '#D97706',            // amber-600
    exame: '#0891B2',              // cyan-600
    fotos: '#C026D3',              // fuchsia-600
    observacoes: '#475569',        // slate-600
    video: '#0284C7',              // sky-600
    internacao: '#475569',
    diagnostico: '#059669',
    banho_tosa: '#0891B2',
    obito: '#1E293B',
    servico: '#0284C7',
    cobranca: '#10B981',           // emerald-500
};

const MODULE_ICONS: Record<string, any> = {
    consulta: 'medkit',
    avaliacao_cirurgica: 'clipboard-outline',
    cirurgia: 'cut-outline',
    retorno: 'refresh-outline',
    peso: 'scale-outline',
    patologia: 'bandage-outline',
    documento: 'document-attach-outline',
    vacina: 'medical-outline',
    receita: 'document-text-outline',
    exame: 'flask-outline',
    fotos: 'camera-outline',
    observacoes: 'chatbox-ellipses-outline',
    video: 'videocam-outline',
    internacao: 'bed-outline',
    diagnostico: 'pulse-outline',
    banho_tosa: 'water-outline',
    obito: 'skull-outline',
    servico: 'construct-outline',
    cobranca: 'cash-outline',
};

export default function PetDetailScreen() {
    const { id: petId } = useLocalSearchParams<{ id: string }>();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
    const router = useRouter();
    const queryClient = useQueryClient();

    const [menuOpen, setMenuOpen] = useState(false);
    const [menuSearch, setMenuSearch] = useState('');

    const handleOpenMenu = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setMenuOpen(true);
    };

    const handleCloseMenu = () => {
        setMenuOpen(false);
        setMenuSearch('');
    };

    // ── Filtros da Timeline ──
    const [filterType, setFilterType] = useState<string | null>(null);
    const [filterDate, setFilterDate] = useState('');
    const [selectedItem, setSelectedItem] = useState<any>(null);

    const { data: pet, isLoading: petLoading } = useQuery({
        queryKey: ['pet', petId],
        queryFn: async () => {
            const { data } = await supabase.from('pets').select('*').eq('id', petId).single();
            return data;
        },
        enabled: !!petId
    });

    const { data: owner } = useQuery({
        queryKey: ['owner', pet?.user_id],
        queryFn: async () => {
            const { data } = await supabase.from('profiles').select('*').eq('user_id', pet?.user_id).single();
            return data;
        },
        enabled: !!pet?.user_id
    });

    const { timeline, loading: timelineLoading, refresh } = usePetTimeline(petId || '');

    // Tipos únicos para filtro
    const moduleTypes = useMemo(() => {
        const types = new Set(timeline.map(i => i.module).filter(Boolean));
        return Array.from(types) as string[];
    }, [timeline]);

    // Timeline filtrada
    const filteredTimeline = useMemo(() => {
        return timeline.filter(item => {
            const matchType = !filterType || item.module === filterType;
            const matchDate = !filterDate.trim() || (item.date || '').includes(filterDate.trim());
            return matchType && matchDate;
        });
    }, [timeline, filterType, filterDate]);

    const { data: petServices } = useQuery({
        queryKey: ['pet-services', petId],
        queryFn: async () => {
            const { data } = await supabase.from('pet_services').select('*').eq('pet_id', petId);
            return data;
        },
        enabled: !!petId
    });

    const pendingBalance = useMemo(() => {
        if (!petServices) return 0;
        return petServices.reduce((acc, curr) => acc + (Number(curr.price_snapshot || 0) * (curr.quantity || 1)), 0);
    }, [petServices]);

    const formatCurrency = (val: number) => {
        return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const handleWhatsApp = () => {
        if (!owner?.phone) return;
        const phone = owner.phone.replace(/\D/g, '');
        const url = `whatsapp://send?phone=55${phone}`;
        Linking.canOpenURL(url).then(supported => {
            if (supported) Linking.openURL(url);
            else Linking.openURL(`https://wa.me/55${phone}`);
        });
    };

    const ActionButton = ({ icon, label, onPress, color }: any) => (
        <View style={styles.bubbleRow}>
            <TouchableOpacity
                style={[styles.bubbleBtn, { backgroundColor: color, shadowColor: color }]}
                onPressIn={() => Haptics.selectionAsync()}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onPress(); }}
                activeOpacity={0.7}
            >
                <Ionicons name={icon} size={24} color="#fff" />
            </TouchableOpacity>
            <View style={[styles.bubbleLabelContainer, { backgroundColor: theme.surface }]}>
                <Text style={[styles.bubbleLabel, { color: theme.text }]}>{label}</Text>
            </View>
        </View>
    );

    if (petLoading || timelineLoading) {
        return (
            <View style={[styles.center, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen options={{ title: pet?.name?.toUpperCase() || 'Paciente', headerBackTitle: 'Voltar' }} />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header Info */}
                <View style={[styles.headerCard, { backgroundColor: theme.surface }]}>
                    <View style={styles.headerTop}>
                        <View style={[styles.avatar, { backgroundColor: theme.primary + '15' }]}>
                            <Ionicons name={pet?.type === 'cat' ? 'logo-octocat' : 'paw'} size={32} color={theme.primary} />
                        </View>
                        <View style={styles.headerInfo}>
                            <Text style={[styles.petName, { color: theme.text }]}>{pet?.name?.toUpperCase()}</Text>
                            <Text style={[styles.petMeta, { color: theme.textSecondary }]}>
                                {pet?.breed || 'SRD'} • {pet?.age || 'Idade n/i'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.statusRow}>
                        <View style={[styles.statusBadge, { backgroundColor: theme.surfaceElevated }]}>
                            <Text style={[styles.statusText, { color: theme.textSecondary }]}>{pet?.type === 'cat' ? 'FELINO' : 'CANINO'}</Text>
                        </View>
                        {pet?.is_hospitalized && (
                            <View style={[styles.statusBadge, { backgroundColor: theme.error + '20' }]}>
                                <Text style={[styles.statusText, { color: theme.error }]}>INTERNADO</Text>
                            </View>
                        )}
                    </View>

                    <View style={[styles.divider, { backgroundColor: theme.border }]} />

                    <View style={styles.ownerRow}>
                        <View style={styles.ownerInfo}>
                            <Text style={[styles.ownerLabel, { color: theme.textMuted }]}>Tutor responsável</Text>
                            <Text style={[styles.ownerName, { color: theme.text }]}>{owner?.full_name || 'Desconhecido'}</Text>
                        </View>
                        {owner?.phone && (
                            <TouchableOpacity style={styles.whatsappBtn} onPress={handleWhatsApp}>
                                <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {pendingBalance > 0 && (
                        <View style={[styles.balanceBox, { backgroundColor: theme.error + '10', borderColor: theme.error + '20' }]}>
                            <Text style={[styles.balanceLabel, { color: theme.error }]}>Saldo em aberto</Text>
                            <Text style={[styles.balanceValue, { color: theme.error }]}>{formatCurrency(pendingBalance)}</Text>
                        </View>
                    )}
                </View>

                {/* Timeline Section */}
                <View style={styles.timelineHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Linha do Tempo</Text>
                    <TouchableOpacity onPress={() => refresh()}>
                        <Ionicons name="refresh" size={18} color={theme.primary} />
                    </TouchableOpacity>
                </View>

                {/* ── Filtros ── */}
                <View style={{ marginBottom: 16, gap: 10 }}>
                    {/* Filtro por data */}
                    <View style={[styles.filterInput, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <Ionicons name="calendar-outline" size={16} color={theme.textMuted} style={{ marginRight: 6 }} />
                        <TextInput
                            style={{ flex: 1, color: theme.text, fontSize: 13 }}
                            placeholder="Filtrar por data (ex: 04/03/2026)"
                            placeholderTextColor={theme.textMuted}
                            value={filterDate}
                            onChangeText={setFilterDate}
                            keyboardType="numeric"
                        />
                        {filterDate ? <TouchableOpacity onPress={() => setFilterDate('')}><Ionicons name="close-circle" size={16} color={theme.textMuted} /></TouchableOpacity> : null}
                    </View>
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
                        <Text style={{ color: theme.textMuted }}>
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
                                                {format(parseISO(item.date), 'dd/MM/yyyy', { locale: ptBR })} às {item.time}
                                            </Text>
                                            <Text style={[styles.timelineTitle, { color: theme.text }]}>{item.title}</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
                                    </View>
                                    {item.veterinarian && (
                                        <Text style={[styles.timelineVet, { color: theme.primary }]}>🩺 {item.veterinarian}</Text>
                                    )}

                                    {/* Exibir Status da Fatura / Comprovante se for cobrança */}
                                    {item.module === 'cobranca' && item.details && (() => {
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
                                                    {format(parseISO(selectedItem.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                                </Text>
                                            </View>
                                            <TouchableOpacity onPress={() => setSelectedItem(null)}>
                                                <Ionicons name="close" size={22} color={theme.textMuted} />
                                            </TouchableOpacity>
                                        </View>

                                        {selectedItem.module === 'cobranca' && dets.services && (
                                            <View style={styles.modalRow}>
                                                <Text style={[styles.modalLabel, { color: theme.textMuted }]}>Itens Faturados</Text>
                                                {dets.services.map((sItem: any, i: number) => (
                                                    <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                                        <Text style={{ color: theme.text, fontSize: 13 }}>{sItem.quantity}x {sItem.name}</Text>
                                                        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{formatCurrency(sItem.price)}</Text>
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
                                            selectedItem.module !== 'cobranca' && (
                                                <View style={styles.modalRow}>
                                                    <Text style={{ color: theme.textMuted, fontSize: 14 }}>Nenhum detalhe adicional registrado.</Text>
                                                </View>
                                            )
                                        )}

                                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                                            {selectedItem.id.startsWith('history-') && selectedItem.module !== 'cobranca' && (
                                                <TouchableOpacity
                                                    style={[styles.modalBtn, { backgroundColor: MODULE_COLORS[selectedItem.module] || theme.primary }]}
                                                    onPress={() => {
                                                        const historyId = selectedItem.id.replace('history-', '');
                                                        setSelectedItem(null);
                                                        router.push({ pathname: '/pet/document-viewer', params: { historyId } });
                                                    }}>
                                                    <Ionicons name="document-text-outline" size={20} color="white" style={{ marginBottom: 4 }} />
                                                    <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>Ver Documento</Text>
                                                </TouchableOpacity>
                                            )}

                                            {selectedItem.module === 'cobranca' && dets.status !== 'paid' && (
                                                <TouchableOpacity
                                                    style={[styles.modalBtn, { backgroundColor: theme.primary }]}
                                                    onPress={() => {
                                                        setSelectedItem(null);
                                                        router.push({ pathname: '/pet/pagamento', params: { invoiceId: dets.invoiceId, petId } });
                                                    }}>
                                                    <Ionicons name="card-outline" size={20} color="white" style={{ marginBottom: 4 }} />
                                                    <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>Pagar Ágora</Text>
                                                </TouchableOpacity>
                                            )}

                                            {selectedItem.module === 'cobranca' && dets.status === 'paid' && dets.receipt_url && (
                                                <TouchableOpacity
                                                    style={[styles.modalBtn, { backgroundColor: theme.success }]}
                                                    onPress={() => Linking.openURL(dets.receipt_url)}>
                                                    <Ionicons name="receipt-outline" size={20} color="white" style={{ marginBottom: 4 }} />
                                                    <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>Ver Comprovante</Text>
                                                </TouchableOpacity>
                                            )}

                                            <TouchableOpacity
                                                style={[styles.modalBtn, { backgroundColor: theme.surfaceElevated, borderWidth: 1, borderColor: theme.border }]}
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

            {/* FAB Actions */}
            <Modal visible={menuOpen} animationType="fade" transparent presentationStyle="overFullScreen">
                <BlurView experimentalBlurMethod="dimezisBlurView" intensity={40} tint={colorScheme === 'dark' ? 'dark' : 'light'} style={styles.menuOverlayBubble}>
                    <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={handleCloseMenu} />

                    <View style={styles.bubbleSidebar}>
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 40, paddingLeft: 16, paddingRight: 32, gap: 16 }}>
                            {[
                                { icon: 'cash-outline', label: 'Cobrança', desc: 'Gerar fatura para o tutor', color: '#10B981', onPress: () => { handleCloseMenu(); router.push({ pathname: '/pet/cobrar', params: { petId, ownerId: pet?.user_id } }); } },
                                { icon: 'medkit', label: 'Consulta', desc: 'Atendimento clínico com anamnese', color: '#3B82F6', onPress: () => { handleCloseMenu(); router.push({ pathname: '/pet/consulta', params: { petId } }); } },
                                { icon: 'clipboard-outline', label: 'Avaliação Cirúrgica', desc: 'Avaliação pré-operatória', color: '#8B5CF6', onPress: () => { handleCloseMenu(); router.push({ pathname: '/pet/avaliacao_cirurgica', params: { petId } }); } },
                                { icon: 'cut-outline', label: 'Cirurgia', desc: 'Procedimento cirúrgico', color: '#EF4444', onPress: () => { handleCloseMenu(); router.push({ pathname: '/pet/cirurgia', params: { petId } }); } },
                                { icon: 'refresh-outline', label: 'Retorno', desc: 'Retorno de consulta anterior', color: '#10B981', onPress: () => { handleCloseMenu(); router.push({ pathname: '/pet/retorno', params: { petId, userId: pet?.user_id } }); } },
                                { icon: 'scale-outline', label: 'Peso', desc: 'Registro de peso corporal', color: '#6366F1', onPress: () => { handleCloseMenu(); router.push({ pathname: '/pet/peso', params: { petId } }); } },
                                { icon: 'bandage-outline', label: 'Patologia', desc: 'Registro de patologias', color: '#6D28D9', onPress: () => { handleCloseMenu(); router.push({ pathname: '/pet/patologia', params: { petId } }); } },
                                { icon: 'document-attach-outline', label: 'Documento', desc: 'Anexar documentos clínicos', color: '#0D9488', onPress: () => { handleCloseMenu(); router.push({ pathname: '/pet/documento', params: { petId } }); } },
                                { icon: 'flask-outline', label: 'Exame', desc: 'Registro de exames laboratoriais', color: '#14B8A6', onPress: () => { handleCloseMenu(); router.push({ pathname: '/pet/exame', params: { petId } }); } },
                                { icon: 'camera-outline', label: 'Fotos', desc: 'Registro fotográfico', color: '#D946EF', onPress: () => { handleCloseMenu(); router.push({ pathname: '/pet/fotos', params: { petId } }); } },
                                { icon: 'medical-outline', label: 'Aplicações', desc: 'Vacinas e medicações', color: '#EC4899', onPress: () => { handleCloseMenu(); router.push({ pathname: '/pet/vacina', params: { petId } }); } },
                                { icon: 'document-text-outline', label: 'Receita', desc: 'Prescrições', color: '#F59E0B', onPress: () => { handleCloseMenu(); router.push({ pathname: '/pet/receita', params: { petId, petName: pet?.name } }); } },
                                { icon: 'chatbox-ellipses-outline', label: 'Observações', desc: 'Anotações clínicas', color: '#64748B', onPress: () => { handleCloseMenu(); router.push({ pathname: '/pet/observacao', params: { petId } }); } },
                                { icon: 'videocam-outline', label: 'Gravações', desc: 'Vídeos', color: '#047857', onPress: () => { handleCloseMenu(); router.push({ pathname: '/pet/gravacoes', params: { petId } }); } },
                                { icon: 'bed-outline', label: 'Internação', desc: 'Internação hospitalar', color: '#64748B', onPress: () => { handleCloseMenu(); router.push({ pathname: '/pet/internacao', params: { petId } }); } },
                                { icon: 'pulse-outline', label: 'Diagnóstico', desc: 'Diagnóstico clínico', color: '#059669', onPress: () => { handleCloseMenu(); router.push({ pathname: '/pet/diagnostico', params: { petId } }); } },
                                { icon: 'water-outline', label: 'Banho/Tosa', desc: 'Serviço de estética', color: '#06B6D4', onPress: () => { handleCloseMenu(); router.push({ pathname: '/pet/banho_tosa', params: { petId } }); } },
                                { icon: 'skull-outline', label: 'Óbito', desc: 'Registro de óbito', color: '#374151', onPress: () => { handleCloseMenu(); router.push({ pathname: '/pet/obito', params: { petId, petName: pet?.name } }); } },
                            ].map(item => (
                                <ActionButton key={item.label} icon={item.icon} label={item.label} color={item.color} onPress={item.onPress} />
                            ))}
                        </ScrollView>
                    </View>
                </BlurView>
            </Modal>



            <TouchableOpacity
                style={[styles.fab, { backgroundColor: theme.primary }]}
                onPress={handleOpenMenu}
            >
                <Ionicons name="add" size={32} color="white" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scrollContent: { padding: 16, paddingBottom: 100 },
    headerCard: {
        padding: 20,
        borderRadius: 24,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    headerInfo: { flex: 1 },
    petName: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
    petMeta: { fontSize: 14 },
    statusRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 10, fontWeight: '900' },
    divider: { height: 1, marginVertical: 16, opacity: 0.5 },
    ownerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    ownerInfo: { flex: 1 },
    ownerLabel: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
    ownerName: { fontSize: 16, fontWeight: '700' },
    whatsappBtn: { padding: 8 },
    balanceBox: { marginTop: 16, padding: 12, borderRadius: 12, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    balanceLabel: { fontSize: 13, fontWeight: '700' },
    balanceValue: { fontSize: 16, fontWeight: '800' },
    timelineHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 4 },
    sectionTitle: { fontSize: 18, fontWeight: '800' },
    emptyTimeline: { alignItems: 'center', padding: 40 },
    filterInput: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, height: 40 },
    chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    chipText: { fontSize: 12, fontWeight: '600' },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalBox: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1 },
    modalTitle: { fontSize: 16, fontWeight: '800' },
    modalRow: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
    modalLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
    modalValue: { fontSize: 14, lineHeight: 22 },
    modalCloseBtn: { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
    timelineItem: { flexDirection: 'row', marginBottom: 16 },
    timelineLeft: { width: 30, alignItems: 'center', paddingTop: 10 },
    timelineDot: { width: 10, height: 10, borderRadius: 5, zIndex: 1 },
    timelineLine: { width: 2, flex: 1, position: 'absolute', top: 20, bottom: -10 },
    timelineCard: { flex: 1, padding: 12, borderRadius: 16, borderWidth: 1 },
    timelineCardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
    moduleIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    timelineMeta: { flex: 1 },
    timelineDate: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
    timelineTitle: { fontSize: 14, fontWeight: '700' },
    timelineDesc: { fontSize: 13, marginBottom: 4 },
    timelineVet: { fontSize: 12, fontWeight: '600' },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    menuOverlayBubble: {
        flex: 1,
        flexDirection: 'row',
    },
    bubbleSidebar: {
        width: '100%',
        height: '100%',
        alignItems: 'flex-start',
        position: 'absolute',
        top: 0,
        left: 0,
        justifyContent: 'center',
    },
    bubbleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    bubbleBtn: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        marginRight: 16,
    },
    bubbleLabelContainer: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    bubbleLabel: {
        fontSize: 14,
        fontWeight: '800',
    },
    menuOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    menuContainer: {
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        padding: 24,
        paddingTop: 8,
        height: '85%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 20,
    },
    menuHandleContainer: { width: '100%', alignItems: 'center', paddingVertical: 12 },
    menuHandle: { width: 40, height: 5, borderRadius: 3 },
    menuTitle: { fontSize: 24, fontWeight: '800' },

    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
    gridItem: {
        width: '31%', // 3 columns
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.02)'
    },
    gridIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    gridLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center', paddingHorizontal: 4 },

    menuSearch: { height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 16 },
    modalInput: { height: 56, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, fontSize: 18, marginBottom: 20 },
    modalButtons: { flexDirection: 'row', gap: 12 },
    modalBtn: { flex: 1, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
