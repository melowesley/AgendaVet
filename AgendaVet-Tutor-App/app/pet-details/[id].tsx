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
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/theme';
import { format } from 'date-fns';
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
}

interface TimelineItem {
    id: string;
    type: 'vaccine' | 'exam' | 'observation' | 'prescription' | 'weight' | 'pathology' | 'hospitalization';
    title: string;
    date: Date;
    description?: string;
    meta?: string;
    status?: string;
}

const TYPE_CONFIG = {
    vaccine: { icon: 'shield-checkmark', color: '#10b981', label: 'Vacina' },
    exam: { icon: 'analytics', color: '#3b82f6', label: 'Exame' },
    observation: { icon: 'eye', color: '#f59e0b', label: 'Observação' },
    prescription: { icon: 'medical', color: '#ec4899', label: 'Receita' },
    weight: { icon: 'scale', color: '#8b5cf6', label: 'Peso' },
    pathology: { icon: 'warning', color: '#ef4444', label: 'Patologia' },
    hospitalization: { icon: 'bed', color: '#6366f1', label: 'Internação' },
};

export default function PetDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

    const [pet, setPet] = useState<Pet | null>(null);
    const [timeline, setTimeline] = useState<TimelineItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPetData = useCallback(async () => {
        if (!id) return;

        setLoading(true);
        try {
            // 1. Detalhes do Pet
            const { data: petData, error: petError } = await supabase
                .from('pets')
                .select('*')
                .eq('id', id)
                .single();

            if (petError) throw petError;
            setPet(petData);

            // 2. Histórico (Promessas paralelas para várias tabelas)
            const [
                vaccines,
                exams,
                obs,
                presc,
                weights,
                paths,
                hosp
            ] = await Promise.all([
                supabase.from('pet_vaccines').select('*').eq('pet_id', id).order('application_date', { ascending: false }),
                supabase.from('pet_exams').select('*').eq('pet_id', id).order('exam_date', { ascending: false }),
                supabase.from('pet_observations').select('*').eq('pet_id', id).order('observation_date', { ascending: false }),
                supabase.from('pet_prescriptions').select('*').eq('pet_id', id).order('prescription_date', { ascending: false }),
                supabase.from('pet_weight_records').select('*').eq('pet_id', id).order('date', { ascending: false }),
                supabase.from('pet_pathologies').select('*').eq('pet_id', id).order('diagnosis_date', { ascending: false }),
                supabase.from('pet_hospitalizations').select('*').eq('pet_id', id).order('admission_date', { ascending: false }),
            ]);

            // 3. Consolidar Linha do Tempo
            const items: TimelineItem[] = [];

            vaccines.data?.forEach(v => items.push({
                id: v.id, type: 'vaccine', title: v.vaccine_name, date: new Date(v.application_date),
                meta: v.veterinarian ? `Vet: ${v.veterinarian}` : undefined, description: v.notes
            }));

            exams.data?.forEach(e => items.push({
                id: e.id, type: 'exam', title: e.exam_type, date: new Date(e.exam_date),
                meta: e.veterinarian ? `Vet: ${e.veterinarian}` : undefined, description: e.notes
            }));

            obs.data?.forEach(o => items.push({
                id: o.id, type: 'observation', title: o.title || 'Observação', date: new Date(o.observation_date),
                description: o.observation
            }));

            presc.data?.forEach(p => items.push({
                id: p.id, type: 'prescription', title: p.medication_name, date: new Date(p.prescription_date),
                meta: p.dosage ? `Dose: ${p.dosage}` : undefined, description: p.notes
            }));

            weights.data?.forEach(w => items.push({
                id: w.id, type: 'weight', title: `${w.weight} kg`, date: new Date(w.date),
                description: w.notes
            }));

            paths.data?.forEach(p => items.push({
                id: p.id, type: 'pathology', title: p.name, date: new Date(p.diagnosis_date),
                status: p.status, description: p.treatment
            }));

            hosp.data?.forEach(h => items.push({
                id: h.id, type: 'hospitalization', title: h.reason, date: new Date(h.admission_date),
                status: h.status, description: h.diagnosis
            }));

            // Ordenar por data (mais recente primeiro)
            items.sort((a, b) => b.date.getTime() - a.date.getTime());
            setTimeline(items);

        } catch (error: any) {
            console.error('Erro ao buscar dados do pet:', error.message);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchPetData();
    }, [fetchPetData]);

    if (loading) {
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
                {/* Cabeçalho do Pet */}
                <View style={[styles.headerCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={[styles.avatarLarge, { backgroundColor: theme.primary + '20' }]}>
                        <Text style={styles.avatarEmojiLarge}>{pet.type === 'dog' ? '🐶' : pet.type === 'cat' ? '🐱' : '🐾'}</Text>
                    </View>
                    <Text style={[styles.petNameLarge, { color: theme.text }]}>{pet.name}</Text>
                    <Text style={[styles.petBreedLarge, { color: theme.textSecondary }]}>
                        {pet.breed || 'Raça não informada'}
                    </Text>

                    <View style={styles.petStatsRow}>
                        {pet.age && (
                            <View style={[styles.statChip, { backgroundColor: theme.border }]}>
                                <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
                                <Text style={[styles.statText, { color: theme.textSecondary }]}>{pet.age}</Text>
                            </View>
                        )}
                        {pet.weight && (
                            <View style={[styles.statChip, { backgroundColor: theme.border }]}>
                                <Ionicons name="scale-outline" size={14} color={theme.textSecondary} />
                                <Text style={[styles.statText, { color: theme.textSecondary }]}>{pet.weight} kg</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Timeline Titulo */}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Linha do Tempo</Text>

                {timeline.length === 0 ? (
                    <View style={styles.emptyTimeline}>
                        <Ionicons name="document-text-outline" size={48} color={theme.border} />
                        <Text style={[styles.emptyTimelineText, { color: theme.textMuted }]}>
                            Nenhum registro médico ainda.
                        </Text>
                    </View>
                ) : (
                    <View style={styles.timelineContainer}>
                        {timeline.map((item, index) => {
                            const config = TYPE_CONFIG[item.type];
                            const isLast = index === timeline.length - 1;

                            return (
                                <View key={item.id} style={styles.timelineItem}>
                                    {/* Linha vertical */}
                                    {!isLast && <View style={[styles.timelineLine, { backgroundColor: theme.border }]} />}

                                    {/* Ícone (Ponto) */}
                                    <View style={[styles.timelineIconBg, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                        <Ionicons name={config.icon as any} size={16} color={config.color} />
                                    </View>

                                    {/* Conteúdo */}
                                    <View style={[styles.timelineContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                        <View style={styles.timelineHeader}>
                                            <Text style={[styles.timelineType, { color: config.color }]}>{config.label}</Text>
                                            <Text style={[styles.timelineDate, { color: theme.textMuted }]}>
                                                {format(item.date, "dd 'de' MMM", { locale: ptBR })}
                                            </Text>
                                        </View>

                                        <Text style={[styles.timelineTitle, { color: theme.text }]}>{item.title}</Text>

                                        {item.meta && (
                                            <Text style={[styles.timelineMeta, { color: theme.textSecondary }]}>{item.meta}</Text>
                                        )}

                                        {item.description && (
                                            <Text style={[styles.timelineDesc, { color: theme.textSecondary }]} numberOfLines={3}>
                                                {item.description}
                                            </Text>
                                        )}

                                        {item.status && (
                                            <View style={[styles.statusBadgeSmall, { backgroundColor: theme.border }]}>
                                                <Text style={[styles.statusTextSmall, { color: theme.textSecondary }]}>
                                                    {item.status}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}
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
        alignItems: 'center',
        borderWidth: 1,
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
    },
    avatarLarge: {
        width: 90,
        height: 90,
        borderRadius: 45,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    avatarEmojiLarge: { fontSize: 44 },
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

    // Section Title
    sectionTitle: { fontSize: 20, fontWeight: '800', marginBottom: 20, letterSpacing: -0.3 },

    // Timeline
    timelineContainer: { paddingLeft: 8 },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 24,
        minHeight: 80,
    },
    timelineLine: {
        position: 'absolute',
        left: 17,
        top: 36,
        bottom: -24,
        width: 2,
    },
    timelineIconBg: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    timelineContent: {
        flex: 1,
        marginLeft: 16,
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    timelineHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    timelineType: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
    timelineDate: { fontSize: 12, fontWeight: '600' },
    timelineTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
    timelineMeta: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
    timelineDesc: { fontSize: 13, lineHeight: 18, marginBottom: 8 },
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
});
