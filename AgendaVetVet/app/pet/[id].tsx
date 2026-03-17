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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

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
    const isDark = colorScheme === 'dark';
    const router = useRouter();
    const queryClient = useQueryClient();
    const insets = useSafeAreaInsets();

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

    const ActionButton = ({ icon, label, onPress, color }: any) => {
        const [showTooltip, setShowTooltip] = useState(false);
        const timeoutRef = React.useRef<NodeJS.Timeout>(null);

        const handlePressIn = () => {
            timeoutRef.current = setTimeout(() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                setShowTooltip(true);
            }, 300); // 300ms = long press to show text
        };

        const handlePressOut = () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            setShowTooltip(false);
        };

        const handlePress = () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            setShowTooltip(false);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onPress();
        };

        return (
            <View style={[styles.gridItem, { zIndex: showTooltip ? 100 : 1 }]}>
                {showTooltip && (
                    <View style={styles.tooltipBubble}>
                        <Text style={styles.tooltipText}>{label}</Text>
                        <View style={styles.tooltipArrow} />
                    </View>
                )}
                <TouchableOpacity
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    onPress={handlePress}
                    activeOpacity={0.7}
                    style={{ alignItems: 'center' }}
                >
                    <View style={[styles.gridIcon, { backgroundColor: showTooltip ? color + '40' : color + '20' }]}>
                        <Ionicons name={icon} size={28} color={color} />
                    </View>
                    {/* The static label is now hidden, keeping the clean look, only shown on long press via Tooltip */}
                </TouchableOpacity>
            </View>
        );
    };

    if (petLoading || timelineLoading) {
        return (
            <View className="flex-1 items-center justify-center" style={{ backgroundColor: theme.background }}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen options={{ title: pet?.name?.toUpperCase() || 'Paciente', headerBackTitle: 'Voltar' }} />

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                {/* Header Card Premium */}
                <Card className="mb-6 border-primary/20 bg-primary/5">
                    <View className="p-5">
                        <View className="flex-row items-center mb-5">
                            <View className="w-16 h-16 rounded-full items-center justify-center bg-primary shadow-lg shadow-primary/30 mr-4">
                                <Ionicons name={pet?.type === 'cat' ? 'logo-octocat' : 'paw'} size={32} color="white" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-xl font-black text-foreground">{pet?.name?.toUpperCase()}</Text>
                                <Text className="text-xs text-muted-foreground font-medium uppercase mt-0.5">
                                    {pet?.breed || 'SRD'} • {pet?.age || 'Idade n/i'}
                                </Text>
                            </View>
                        </View>

                        <View className="flex-row gap-2 mb-5">
                            <View className="bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                                <Text className="text-[10px] font-black text-primary uppercase">
                                    {pet?.type === 'cat' ? 'FELINO' : 'CANINO'}
                                </Text>
                            </View>
                            {pet?.is_hospitalized && (
                                <View className="bg-destructive/10 px-3 py-1 rounded-full border border-destructive/20">
                                    <Text className="text-[10px] font-black text-destructive uppercase">INTERNADO</Text>
                                </View>
                            )}
                        </View>

                        <View className="h-[1px] bg-border/40 w-full mb-5" />

                        <View className="flex-row items-center justify-between">
                            <View>
                                <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                                    Tutor Responsável
                                </Text>
                                <Text className="text-base font-black text-foreground">{owner?.full_name || 'Desconhecido'}</Text>
                            </View>
                            {owner?.phone && (
                                <TouchableOpacity 
                                    className="w-10 h-10 rounded-full bg-emerald-500/10 items-center justify-center border border-emerald-500/20"
                                    onPress={handleWhatsApp}
                                >
                                    <Ionicons name="logo-whatsapp" size={22} color="#10B981" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {pendingBalance > 0 && (
                            <View className="mt-5 p-3 rounded-2xl bg-destructive/5 border border-destructive/20 flex-row justify-between items-center">
                                <View className="flex-row items-center gap-2">
                                    <View className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                                    <Text className="text-xs font-black text-destructive uppercase">Saldo Aberto</Text>
                                </View>
                                <Text className="text-lg font-black text-destructive">{formatCurrency(pendingBalance)}</Text>
                            </View>
                        )}
                    </View>
                </Card>

                {/* Timeline Section */}
                <View className="flex-row items-center justify-between mb-4 px-1">
                    <Text className="text-lg font-black text-foreground">Linha do Tempo</Text>
                    <TouchableOpacity onPress={() => refresh()} activeOpacity={0.7}>
                        <View className="bg-primary/10 p-2 rounded-full">
                            <Ionicons name="refresh" size={16} color={theme.primary} />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Filters Section */}
                <View className="mb-6 gap-3">
                    {/* Search Field */}
                    <View className={cn(
                        "flex-row items-center px-4 h-12 rounded-2xl border bg-card/50",
                        filterDate ? "border-primary" : "border-border/50"
                    )}>
                        <Ionicons name="calendar-outline" size={16} color={filterDate ? theme.primary : theme.textMuted} />
                        <TextInput
                            className="flex-1 ml-3 text-sm text-foreground font-medium"
                            placeholder="Filtrar por data (ex: 04/03/2026)"
                            placeholderTextColor="#9ca3af"
                            value={filterDate}
                            onChangeText={setFilterDate}
                            keyboardType="numeric"
                        />
                        {filterDate ? (
                            <TouchableOpacity onPress={() => setFilterDate('')}>
                                <Ionicons name="close-circle" size={18} color={theme.textMuted} />
                            </TouchableOpacity>
                        ) : null}
                    </View>

                    {/* Module Chips */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 2, paddingBottom: 4 }}>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            className={cn(
                                "flex-row items-center px-4 py-2 rounded-xl",
                                !filterType ? "bg-primary shadow-sm shadow-primary/30" : "bg-card border border-border/50"
                            )}
                            onPress={() => setFilterType(null)}
                        >
                            <Text className={cn("text-[11px] font-black uppercase", !filterType ? "text-white" : "text-muted-foreground")}>
                                Todos
                            </Text>
                        </TouchableOpacity>
                        {moduleTypes.map(mod => {
                            const isSelected = filterType === mod;
                            const modColor = MODULE_COLORS[mod] || theme.primary;
                            return (
                                <TouchableOpacity 
                                    key={mod}
                                    activeOpacity={0.7}
                                    className={cn(
                                        "flex-row items-center px-4 py-2 rounded-xl border",
                                        isSelected ? "border-transparent" : "border-border/50 bg-card"
                                    )}
                                    style={isSelected ? { backgroundColor: modColor } : {}}
                                    onPress={() => setFilterType(isSelected ? null : mod)}
                                >
                                    <Ionicons 
                                        name={MODULE_ICONS[mod] || 'document-text-outline'} 
                                        size={12}
                                        color={isSelected ? '#fff' : theme.textMuted} 
                                        style={{ marginRight: 6 }} 
                                    />
                                    <Text className={cn(
                                        "text-[11px] font-black uppercase",
                                        isSelected ? "text-white" : "text-muted-foreground"
                                    )}>
                                        {mod.replace('_', ' ')}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {filteredTimeline.length === 0 ? (
                    <View className="items-center py-20 bg-card/40 rounded-3xl border border-dashed border-border/60 mx-1">
                        <Ionicons name="documents-outline" size={48} color={theme.textMuted} />
                        <Text className="text-muted-foreground mt-4 font-medium text-center">
                            {timeline.length === 0 ? 'Nenhum registro no histórico' : 'Nenhum resultado encontrado'}
                        </Text>
                    </View>
                ) : (
                    filteredTimeline.map((item, index) => {
                        const modColor = MODULE_COLORS[item.module || ''] || theme.textMuted;
                        return (
                            <TouchableOpacity 
                                key={item.id} 
                                onPress={() => setSelectedItem(item)} 
                                activeOpacity={0.85}
                                className="flex-row mb-4"
                            >
                                <View className="w-8 items-center pt-2.5">
                                    <View className="w-2.5 h-2.5 rounded-full z-10 shadow-sm" style={{ backgroundColor: modColor }} />
                                    {index !== filteredTimeline.length - 1 && (
                                        <View className="w-[1.5px] flex-1 bg-border/40 absolute top-5 bottom-[-16px]" />
                                    )}
                                </View>
                                
                                <Card className="flex-1 overflow-hidden">
                                    <View className="p-4">
                                        <View className="flex-row items-start">
                                            <View 
                                                className="w-9 h-9 rounded-xl items-center justify-center mr-3"
                                                style={{ backgroundColor: modColor + '15' }}
                                            >
                                                <Ionicons
                                                    name={MODULE_ICONS[item.module || ''] || 'document-text-outline'}
                                                    size={16}
                                                    color={modColor}
                                                />
                                            </View>
                                            <View className="flex-1">
                                                <Text className="text-[10px] font-bold text-muted-foreground mb-1">
                                                    {format(parseISO(item.date), 'dd/MM/yyyy', { locale: ptBR })} às {item.time}
                                                </Text>
                                                <Text className="text-sm font-black text-foreground tracking-tight leading-4">
                                                    {item.title}
                                                </Text>
                                            </View>
                                            <Ionicons name="chevron-forward" size={14} color={theme.textMuted} />
                                        </View>
                                        
                                        {item.veterinarian && (
                                            <View className="mt-3 flex-row items-center bg-primary/5 self-start px-2 py-0.5 rounded-md border border-primary/10">
                                                <Text className="text-[10px] font-bold text-primary">🩺 {item.veterinarian}</Text>
                                            </View>
                                        )}

                                        {item.module === 'cobranca' && item.details && (() => {
                                            try {
                                                const details = typeof item.details === 'string' ? JSON.parse(item.details) : item.details;
                                                const isPaid = details.status === 'paid';
                                                return (
                                                    <View className="mt-3 pt-3 border-t border-border/40 flex-row items-center justify-between">
                                                        <View className={cn(
                                                            "px-2 py-0.5 rounded-md border",
                                                            isPaid ? "bg-emerald-500/10 border-emerald-500/20" : "bg-destructive/10 border-destructive/20"
                                                        )}>
                                                            <Text className={cn(
                                                                "text-[9px] font-black uppercase",
                                                                isPaid ? "text-emerald-500" : "text-destructive"
                                                            )}>
                                                                {isPaid ? 'PAGO' : 'PENDENTE'}
                                                            </Text>
                                                        </View>
                                                        <Text className="text-sm font-black text-foreground">{formatCurrency(details.total_amount || 0)}</Text>
                                                    </View>
                                                )
                                            } catch (e) {
                                                return null;
                                            }
                                        })()}
                                    </View>
                                </Card>
                            </TouchableOpacity>
                        );
                    })
                )}

                {/* ── Modal de Detalhe do Procedimento ── */}
                <Modal visible={!!selectedItem} animationType="fade" transparent>
                    <BlurView intensity={20} className="flex-1 justify-center p-6 bg-black/20">
                        <Card className="max-h-[80%] border-none shadow-2xl">
                            {selectedItem && (() => {
                                let dets: any = {};
                                try { dets = typeof selectedItem.details === 'string' ? JSON.parse(selectedItem.details) : (selectedItem.details || {}); } catch (e) { }
                                const modColor = MODULE_COLORS[selectedItem.module] || theme.primary;

                                return (
                                    <View className="p-6">
                                        <View className="flex-row items-center mb-6">
                                            <View 
                                                className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
                                                style={{ backgroundColor: modColor + '15' }}
                                            >
                                                <Ionicons 
                                                    name={MODULE_ICONS[selectedItem.module] || 'document-text-outline'} 
                                                    size={24}
                                                    color={modColor} 
                                                />
                                            </View>
                                            <View className="flex-1">
                                                <Text className="text-xl font-black text-foreground leading-6">{selectedItem.title}</Text>
                                                <Text className="text-xs font-bold text-muted-foreground uppercase mt-1">
                                                    {format(parseISO(selectedItem.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                                </Text>
                                            </View>
                                            <TouchableOpacity 
                                                onPress={() => setSelectedItem(null)}
                                                className="w-10 h-10 items-center justify-center rounded-full bg-muted/50"
                                            >
                                                <Ionicons name="close" size={24} color={theme.text} />
                                            </TouchableOpacity>
                                        </View>

                                        <ScrollView showsVerticalScrollIndicator={false} className="mb-6">
                                            {selectedItem.module === 'cobranca' && dets.services && (
                                                <View className="mb-6 p-4 rounded-2xl bg-muted/30 border border-border/40">
                                                    <Text className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">Itens Faturados</Text>
                                                    {dets.services.map((sItem: any, i: number) => (
                                                        <View key={i} className="flex-row justify-between mb-2">
                                                            <Text className="text-sm font-medium text-foreground">{sItem.quantity}x {sItem.name}</Text>
                                                            <Text className="text-sm font-bold text-foreground">{formatCurrency(sItem.price)}</Text>
                                                        </View>
                                                    ))}
                                                    <View className="mt-3 pt-3 border-t border-border/40 flex-row justify-between">
                                                        <Text className="font-black text-foreground">Total:</Text>
                                                        <Text className="font-black text-primary text-base">{formatCurrency(dets.total_amount)}</Text>
                                                    </View>
                                                </View>
                                            )}

                                            {selectedItem.veterinarian && (
                                                <View className="mb-4">
                                                    <Text className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Profissional</Text>
                                                    <Text className="text-sm font-bold text-primary">🩺 {selectedItem.veterinarian}</Text>
                                                </View>
                                            )}

                                            <View className="mb-4">
                                                <Text className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Detalhes</Text>
                                                <Text className="text-sm text-foreground leading-5 font-medium">
                                                    {selectedItem.description || "Nenhum detalhe adicional registrado."}
                                                </Text>
                                            </View>

                                            {/* Foto Preview if applicable */}
                                            {selectedItem.module === 'fotos' && dets.fotos && dets.fotos.length > 0 && (
                                                <View className="mt-2">
                                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                                                        {dets.fotos.map((url: string, i: number) => (
                                                            <TouchableOpacity key={i} onPress={() => Linking.openURL(url)} activeOpacity={0.8}>
                                                                <Image source={{ uri: url }} className="w-40 h-40 rounded-2xl" />
                                                            </TouchableOpacity>
                                                        ))}
                                                    </ScrollView>
                                                </View>
                                            )}
                                        </ScrollView>

                                        <View className="flex-row gap-3">
                                            {selectedItem.id.startsWith('history-') && selectedItem.module !== 'cobranca' && (
                                                <Button
                                                    label="Ver documento"
                                                    className="flex-1"
                                                    leftIcon={<Ionicons name="document-text-outline" size={18} color="white" />}
                                                    onPress={() => {
                                                        const historyId = selectedItem.id.replace('history-', '');
                                                        setSelectedItem(null);
                                                        router.push({ pathname: '/pet/document-viewer', params: { historyId } });
                                                    }}
                                                />
                                            )}

                                            {selectedItem.module === 'cobranca' && dets.status !== 'paid' && (
                                                <Button
                                                    label="Pagar agora"
                                                    className="flex-1"
                                                    leftIcon={<Ionicons name="card-outline" size={18} color="white" />}
                                                    onPress={() => {
                                                        setSelectedItem(null);
                                                        router.push({ pathname: '/pet/pagamento', params: { invoiceId: dets.invoiceId, petId } });
                                                    }}
                                                />
                                            )}

                                            {selectedItem.module === 'cobranca' && dets.status === 'paid' && dets.receipt_url && (
                                                <Button
                                                    label="Comprovante"
                                                    variant="secondary"
                                                    className="flex-1"
                                                    leftIcon={<Ionicons name="receipt-outline" size={18} color={theme.primary} />}
                                                    onPress={() => Linking.openURL(dets.receipt_url)}
                                                />
                                            )}
                                            
                                            <Button
                                                label="Fechar"
                                                variant="outline"
                                                className={selectedItem.module === 'cobranca' || selectedItem.id.startsWith('history-') ? "px-6" : "flex-1"}
                                                onPress={() => setSelectedItem(null)}
                                            />
                                        </View>
                                    </View>
                                );
                            })()}
                        </Card>
                    </BlurView>
                </Modal>
            </ScrollView>

            {/* FAB Actions (Grid Bottom Sheet) */}
            <Modal visible={menuOpen} animationType="slide" transparent>
                <View className="flex-1 justify-end bg-black/40">
                    <TouchableOpacity 
                        className="absolute inset-0" 
                        activeOpacity={1} 
                        onPress={handleCloseMenu} 
                    />
                    
                    <View 
                        className="bg-card rounded-t-[40px] shadow-2xl border-t border-border/20"
                        style={{ paddingBottom: insets.bottom + 20 }}
                    >
                        <View className="items-center py-4">
                            <View className="w-12 h-1.5 rounded-full bg-muted-foreground/20" />
                        </View>

                        <View className="px-6 mb-4">
                            <Text className="text-[11px] font-black text-muted-foreground uppercase tracking-widest text-center">
                                Novo Registro Clínico
                            </Text>
                            <Text className="text-xl font-black text-foreground text-center mt-1">
                                O que deseja registrar?
                            </Text>
                        </View>

                        <ScrollView 
                            showsVerticalScrollIndicator={false} 
                            contentContainerStyle={{ padding: 20 }}
                            className="max-h-[60vh]"
                        >
                            <View className="flex-row flex-wrap justify-center gap-y-6">
                                {[
                                    { icon: 'cash-outline', label: 'Cobrar', color: '#10B981', onPress: () => { handleCloseMenu(); router.push({ pathname: '/pet/cobrar', params: { petId, ownerId: owner?.id || pet?.user_id } }); } },
                                    { icon: 'medkit', label: 'Consulta', color: '#3B82F6', onPress: () => { handleCloseMenu(); router.push({ pathname: '/pet/consulta', params: { petId } }); } },
                                    { icon: 'clipboard-outline', label: 'Avaliação', color: '#8B5CF6', onPress: () => { handleCloseMenu(); router.push({ pathname: '/pet/avaliacao_cirurgica', params: { petId } }); } },
                                    { icon: 'cut-outline', label: 'Cirurgia', color: '#EF4444', onPress: () => { handleCloseMenu(); router.push({ pathname: '/pet/cirurgia', params: { petId } }); } },
                                    { icon: 'refresh-outline', label: 'Retorno', color: '#10B981', onPress: () => { handleCloseMenu(); router.push({ pathname: '/pet/retorno', params: { petId, userId: pet?.user_id } }); } },
                                    { icon: 'scale-outline', label: 'Peso', color: '#6366F1', onPress: () => { handleCloseMenu(); router.push({ pathname: '/pet/peso', params: { petId } }); } },
                                    { icon: 'bandage-outline', label: 'Patologia', color: '#6D28D9', onPress: () => { handleCloseMenu(); router.push({ pathname: '/pet/patologia', params: { petId } }); } },
                                    { icon: 'document-attach-outline', label: 'Anexo', color: '#0D9488', onPress: () => { handleCloseMenu(); router.push({ pathname: '/pet/documento', params: { petId } }); } },
                                    { icon: 'flask-outline', label: 'Exame', color: '#14B8A6', onPress: () => { handleCloseMenu(); router.push({ pathname: '/pet/exame', params: { petId } }); } },
                                    { icon: 'camera-outline', label: 'Fotos', color: '#D946EF', onPress: () => { handleCloseMenu(); router.push({ pathname: '/pet/fotos', params: { petId } }); } },
                                    { icon: 'medical-outline', label: 'Vacina', color: '#EC4899', onPress: () => { handleCloseMenu(); router.push({ pathname: '/pet/vacina', params: { petId } }); } },
                                    { icon: 'document-text-outline', label: 'Receita', color: '#F59E0B', onPress: () => { handleCloseMenu(); router.push({ pathname: '/pet/receita', params: { petId, petName: pet?.name } }); } },
                                    { icon: 'chatbox-ellipses-outline', label: 'Obs.', color: '#64748B', onPress: () => { handleCloseMenu(); router.push({ pathname: '/pet/observacao', params: { petId } }); } },
                                    { icon: 'videocam-outline', label: 'Vídeo', color: '#047857', onPress: () => { handleCloseMenu(); router.push({ pathname: '/pet/gravacoes', params: { petId } }); } },
                                    { icon: 'bed-outline', label: 'Internar', color: '#64748B', onPress: () => { handleCloseMenu(); router.push({ pathname: '/pet/internacao', params: { petId } }); } },
                                    { icon: 'pulse-outline', label: 'Diagnost.', color: '#059669', onPress: () => { handleCloseMenu(); router.push({ pathname: '/pet/diagnostico', params: { petId } }); } },
                                    { icon: 'water-outline', label: 'Estética', color: '#06B6D4', onPress: () => { handleCloseMenu(); router.push({ pathname: '/pet/banho_tosa', params: { petId } }); } },
                                    { icon: 'skull-outline', label: 'Óbito', color: '#374151', onPress: () => { handleCloseMenu(); router.push({ pathname: '/pet/obito', params: { petId, petName: pet?.name } }); } },
                                ].map(item => (
                                    <View key={item.label} className="w-1/4 items-center">
                                        <ActionButton icon={item.icon} label={item.label} color={item.color} onPress={item.onPress} />
                                        <Text className="text-[10px] font-bold text-muted-foreground uppercase text-center mt-1">{item.label}</Text>
                                    </View>
                                ))}
                            </View>
                        </ScrollView>
                        
                        <View className="px-6 mt-4">
                            <Button
                                label="Cancelar"
                                variant="secondary"
                                onPress={handleCloseMenu}
                            />
                        </View>
                    </View>
                </View>
            </Modal>



            <TouchableOpacity
                style={[styles.fab, { backgroundColor: theme.primary }]}
                onPress={handleOpenMenu}
            >
                <Ionicons name="add" size={32} color="white" />
            </TouchableOpacity>
        </View >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
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
    // Action Button Tooltip
    gridItem: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    gridIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
    tooltipBubble: {
        position: 'absolute',
        top: -46,
        backgroundColor: '#1E293B',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 80,
    },
    tooltipText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '800',
        textAlign: 'center',
    },
    tooltipArrow: {
        position: 'absolute',
        bottom: -6,
        width: 12,
        height: 12,
        backgroundColor: '#1E293B',
        transform: [{ rotate: '45deg' }],
    },
});
