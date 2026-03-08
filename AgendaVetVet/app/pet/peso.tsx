import React, { useState } from 'react';
import {
    View, Text, StyleSheet, useColorScheme, ScrollView, TouchableOpacity,
    ActivityIndicator, Alert, TextInput
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { logPetAdminHistory } from '@/lib/services/petHistory';
import { useQueryClient } from '@tanstack/react-query';

// ACCENT removido para usar theme.primary

export default function PesoScreen() {
    const { petId } = useLocalSearchParams<{ petId: string }>();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
    const router = useRouter();
    const queryClient = useQueryClient();
    const insets = useSafeAreaInsets();

    const [saving, setSaving] = useState(false);
    const [peso, setPeso] = useState('');
    const [escore, setEscore] = useState<number | null>(null);
    const [observacoes, setObservacoes] = useState('');
    const [veterinario, setVeterinario] = useState('');

    const ESCORES = [
        { val: 1, label: 'Muito Magro' },
        { val: 2, label: 'Abaixo do Peso' },
        { val: 3, label: 'Ideal' },
        { val: 4, label: 'Acima do Peso' },
        { val: 5, label: 'Obeso' },
    ];

    const handleSave = async () => {
        if (!peso) {
            Alert.alert('Atenção', 'Informe o peso do animal.');
            return;
        }

        setSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();

            // Log no histórico
            const details = {
                peso: `${peso} kg`,
                escore_corporal: escore ? ESCORES.find(e => e.val === escore)?.label : 'Não informado',
                observacoes,
                veterinario
            };

            const { data, error } = await supabase.from('pet_admin_history').insert({
                pet_id: petId,
                user_id: session?.user?.id,
                module: 'peso',
                action: 'record',
                title: `Registro de Peso: ${peso} kg`,
                details: JSON.stringify(details),
                created_at: new Date().toISOString(),
            }).select().single();

            if (error) throw error;

            // Log de auditoria/timeline
            await logPetAdminHistory({
                petId,
                module: 'peso',
                action: 'create',
                title: `Peso registrado: ${peso} kg`,
                details,
                sourceTable: 'pet_admin_history',
                sourceId: data.id
            });

            // Opcional: Atualizar o peso na tabela 'pets' se houver esse campo
            await supabase.from('pets').update({ weight: parseFloat(peso.replace(',', '.')) }).eq('id', petId);

            queryClient.invalidateQueries({ queryKey: ['pet-timeline', petId] });
            Alert.alert('✅ Sucesso', 'Peso registrado com sucesso!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (e: any) {
            Alert.alert('Erro', e.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <Stack.Screen options={{
                title: 'Peso e Escore',
                headerStyle: { backgroundColor: theme.background },
                headerShadowVisible: false,
                headerLeft: () => (
                    <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 12 }}>
                        <Ionicons name="chevron-back" size={26} color={theme.primary} />
                    </TouchableOpacity>
                )
            }} />
            <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={s.scroll}>

                {/* Hero */}
                <View style={[s.hero, { backgroundColor: theme.primary + '15' }]}>
                    <Ionicons name="speedometer-outline" size={32} color={theme.primary} />
                    <View style={{ marginLeft: 14 }}>
                        <Text style={[s.heroTitle, { color: theme.text }]}>Peso & Condição</Text>
                        <Text style={[s.heroSub, { color: theme.textSecondary }]}>Acompanhamento evolutivo do pet</Text>
                    </View>
                </View>

                {/* Card Peso */}
                <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={s.cardHeader}>
                        <Ionicons name="scale-outline" size={18} color={theme.primary} />
                        <Text style={[s.cardTitle, { color: theme.text }]}>Medição</Text>
                    </View>

                    <View style={s.fieldWrap}>
                        <Text style={[s.fieldLabel, { color: theme.textSecondary }]}>Peso Atual (kg) *</Text>
                        <View style={s.weightInputRow}>
                            <TextInput
                                style={[s.fieldInput, { flex: 1, color: theme.text, backgroundColor: theme.background, borderColor: theme.border, fontSize: 24, fontWeight: '800' }]}
                                value={peso}
                                onChangeText={setPeso}
                                placeholder="0.0"
                                placeholderTextColor={theme.textMuted}
                                keyboardType="numeric"
                            />
                            <Text style={[s.weightUnit, { color: theme.textMuted }]}>kg</Text>
                        </View>
                    </View>
                </View>

                {/* Card Escore */}
                <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={s.cardHeader}>
                        <Ionicons name="body-outline" size={18} color={theme.success} />
                        <Text style={[s.cardTitle, { color: theme.text }]}>Escore Corporal</Text>
                    </View>

                    <Text style={[s.instructions, { color: theme.textSecondary }]}>Selecione a condição física atual:</Text>

                    <View style={s.escoreGrid}>
                        {ESCORES.map(e => (
                            <TouchableOpacity
                                key={e.val}
                                style={[
                                    s.escoreBtn,
                                    { borderColor: theme.border },
                                    escore === e.val && { backgroundColor: theme.success, borderColor: theme.success }
                                ]}
                                onPress={() => setEscore(e.val)}
                            >
                                <Text style={[s.escoreText, { color: escore === e.val ? 'white' : theme.text }]}>
                                    {e.val}
                                </Text>
                                <Text style={[s.escoreLabel, { color: escore === e.val ? 'white' : theme.textSecondary }]}>
                                    {e.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Outros */}
                <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={s.cardHeader}>
                        <Ionicons name="document-text-outline" size={18} color={theme.primary} />
                        <Text style={[s.cardTitle, { color: theme.text }]}>Notas Adicionais</Text>
                    </View>

                    <View style={s.fieldWrap}>
                        <Text style={[s.fieldLabel, { color: theme.textSecondary }]}>Evolução / Observações</Text>
                        <TextInput
                            style={[s.fieldInput, s.multiline, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border, minHeight: 80 }]}
                            value={observacoes}
                            onChangeText={setObservacoes}
                            placeholder="Ex: Ganhou peso após troca de ração..."
                            placeholderTextColor={theme.textMuted}
                            multiline
                            textAlignVertical="top"
                        />
                    </View>

                    <View style={s.fieldWrap}>
                        <Text style={[s.fieldLabel, { color: theme.textSecondary }]}>Veterinário</Text>
                        <TextInput
                            style={[s.fieldInput, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
                            value={veterinario}
                            onChangeText={setVeterinario}
                            placeholder="Responsável pela medição"
                            placeholderTextColor={theme.textMuted}
                        />
                    </View>
                </View>

            </ScrollView>

            {/* Botão Salvar no Footer */}
            <View style={[s.footer, { backgroundColor: theme.surface, borderTopColor: theme.border, paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
                <TouchableOpacity
                    style={[s.saveBtn, { backgroundColor: peso ? theme.primary : theme.border }]}
                    onPress={handleSave}
                    disabled={saving || !peso}
                >
                    {saving ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle" size={22} color={peso ? 'white' : theme.textMuted} style={{ marginRight: 8 }} />
                            <Text style={[s.saveBtnText, { color: peso ? 'white' : theme.textMuted }]}>Registrar Peso</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

        </>
    );
}

const s = StyleSheet.create({
    scroll: { padding: 16, gap: 16, paddingBottom: 40 },
    hero: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, padding: 20 },
    heroTitle: { fontSize: 22, fontWeight: '800' },
    heroSub: { fontSize: 13 },
    card: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 14 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#E5E7EB' },
    cardTitle: { fontSize: 15, fontWeight: '800' },
    fieldWrap: { flex: 1 },
    fieldLabel: { fontSize: 12, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
    fieldInput: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
    weightInputRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    weightUnit: { fontSize: 20, fontWeight: '700' },
    instructions: { fontSize: 13, marginBottom: 5 },
    escoreGrid: { gap: 8 },
    escoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 12, borderWidth: 1 },
    escoreText: { fontSize: 18, fontWeight: '900', width: 30 },
    escoreLabel: { flex: 1, fontSize: 14, fontWeight: '600', textAlign: 'right' },
    multiline: { paddingTop: 14 },
    footer: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth },
    saveBtn: { height: 46, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    saveBtnText: { fontSize: 16, fontWeight: '700' },
});
