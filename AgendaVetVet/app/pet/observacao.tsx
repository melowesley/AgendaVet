import React, { useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { logPetAdminHistory } from '@/lib/services/petHistory';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAttendanceAutoFill } from '@/hooks/useAttendanceAutoFill';
import AutoFillHeader from '@/components/AutoFillHeader';
import { printAttendancePdf } from '@/utils/printPdf';

export default function ObservacaoScreen() {
    const { petId } = useLocalSearchParams<{ petId: string }>();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
    const router = useRouter();
    const queryClient = useQueryClient();
    const insets = useSafeAreaInsets();
    const [saving, setSaving] = useState(false);
    const [printing, setPrinting] = useState(false);
    const { vetProfile, petData, tutorData, loading: autoFillLoading, buildPdfData } = useAttendanceAutoFill(petId);

    const [titulo, setTitulo] = useState('');
    const [observacao, setObservacao] = useState('');
    const [veterinario, setVeterinario] = useState('');
    const [categoria, setCategoria] = useState('');

    const CATS = ['Clínica', 'Comportamento', 'Alimentação', 'Higiene', 'Acompanhamento', 'Outro'];

    const handleSave = async () => {
        if (!observacao.trim()) { Alert.alert('Atenção', 'Escreva a observação.'); return; }
        setSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const details = { titulo, observacao, veterinario, categoria };
            const { data, error } = await supabase.from('pet_admin_history').insert({
                pet_id: petId, user_id: session?.user?.id,
                module: 'observacoes', action: 'procedure',
                title: titulo || 'Observação clínica',
                details: JSON.stringify(details),
                created_at: new Date().toISOString(),
            }).select().single();
            if (error) throw error;
            await logPetAdminHistory({ petId, module: 'observacoes', action: 'create', title: titulo || 'Observação', details, sourceTable: 'pet_admin_history', sourceId: data.id });
            queryClient.invalidateQueries({ queryKey: ['pet-timeline', petId] });
            Alert.alert('✅ Sucesso', 'Observação registrada!', [{ text: 'OK', onPress: () => router.back() }]);
        } catch (e: any) { Alert.alert('Erro', e.message); } finally { setSaving(false); }
    };

    return (
        <KeyboardAvoidingView style={[s.container, { backgroundColor: theme.background }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <Stack.Screen options={{ title: 'Observação', headerStyle: { backgroundColor: theme.background }, headerShadowVisible: false, headerLeft: () => <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 12 }}><Ionicons name="chevron-back" size={26} color={theme.primary} /></TouchableOpacity> }} />
            <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
                <View style={[s.hero, { backgroundColor: theme.primary + '15' }]}>
                    <Ionicons name="chatbox-ellipses-outline" size={32} color={theme.primary} />
                    <View style={{ marginLeft: 14 }}><Text style={[s.heroTitle, { color: theme.text }]}>Observação Clínica</Text><Text style={[s.heroSub, { color: theme.textSecondary }]}>Anotações e relatos do atendimento</Text></View>
                </View>

                <AutoFillHeader vetProfile={vetProfile} petData={petData} tutorData={tutorData} loading={autoFillLoading} theme={theme} />

                <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={s.cardHeader}><Ionicons name="chatbox-ellipses-outline" size={18} color={theme.primary} /><Text style={[s.cardTitle, { color: theme.text }]}>Nova Observação</Text></View>

                    <View style={s.fieldWrap}>
                        <Text style={[s.fieldLabel, { color: theme.textSecondary }]}>Título (opcional)</Text>
                        <TextInput style={[s.fieldInput, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
                            value={titulo} onChangeText={setTitulo} placeholder="Ex: Acompanhamento pós-cirúrgico"
                            placeholderTextColor={theme.textMuted} autoCapitalize="sentences" />
                    </View>

                    <View style={s.fieldWrap}>
                        <Text style={[s.fieldLabel, { color: theme.textSecondary }]}>Veterinário</Text>
                        <TextInput style={[s.fieldInput, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
                            value={veterinario} onChangeText={setVeterinario} placeholder="Nome do Vet"
                            placeholderTextColor={theme.textMuted} autoCapitalize="words" />
                    </View>

                    <Text style={[s.subLabel, { color: theme.textSecondary }]}>Categoria</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                        {CATS.map(c => (
                            <TouchableOpacity key={c} style={[s.chip, { backgroundColor: theme.surfaceElevated }, categoria === c && { backgroundColor: theme.primary }]} onPress={() => setCategoria(categoria === c ? '' : c)}>
                                <Text style={[s.chipText, { color: categoria === c ? 'white' : theme.textSecondary }]}>{c}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <View style={s.fieldWrap}>
                        <Text style={[s.fieldLabel, { color: theme.textSecondary }]}>Observação *</Text>
                        <TextInput
                            style={[s.fieldInput, s.multiline, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border, minHeight: 200 }]}
                            value={observacao} onChangeText={setObservacao}
                            placeholder="Registre aqui qualquer observação relevante sobre o paciente..."
                            placeholderTextColor={theme.textMuted} multiline scrollEnabled={false}
                            textAlignVertical="top" autoCapitalize="sentences" autoCorrect />
                    </View>
                </View>
            </ScrollView>
            <View style={[s.footer, { backgroundColor: theme.surface, borderTopColor: theme.border, paddingBottom: Math.max(insets.bottom + 16, 24), flexDirection: 'row', gap: 10 }]}>
                <TouchableOpacity style={[s.pdfBtn, { borderColor: theme.primary }]} onPress={async () => { setPrinting(true); try { await printAttendancePdf(buildPdfData('observacao', { titulo, observacao, veterinario, categoria })); } finally { setPrinting(false); } }} disabled={printing}>
                    {printing ? <ActivityIndicator color={theme.primary} size="small" /> : <><Ionicons name="document-text-outline" size={20} color={theme.primary} /><Text style={[s.pdfBtnText, { color: theme.primary }]}>PDF</Text></>}
                </TouchableOpacity>
                <TouchableOpacity style={[s.saveBtn, { backgroundColor: observacao ? theme.primary : theme.border, flex: 1 }]} onPress={handleSave} disabled={saving || !observacao}>
                    {saving ? <ActivityIndicator color="white" /> : <><Ionicons name="checkmark-circle" size={22} color={observacao ? 'white' : theme.textMuted} style={{ marginRight: 8 }} /><Text style={[s.saveBtnText, { color: observacao ? 'white' : theme.textMuted }]}>Salvar Observação</Text></>}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 }, scroll: { padding: 16, gap: 16, paddingBottom: 40 },
    hero: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, padding: 20 },
    heroTitle: { fontSize: 22, fontWeight: '800' }, heroSub: { fontSize: 13 },
    card: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 14, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#E5E7EB' },
    cardTitle: { fontSize: 15, fontWeight: '800' },
    subLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
    chipText: { fontSize: 12, fontWeight: '600' },
    fieldWrap: { flex: 1 },
    fieldLabel: { fontSize: 12, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
    fieldInput: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
    multiline: { paddingTop: 14 },
    footer: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth },
    saveBtn: { height: 46, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    saveBtnText: { fontSize: 16, fontWeight: '700' },
    pdfBtn: { height: 46, borderRadius: 14, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, gap: 6 },
    pdfBtnText: { fontSize: 14, fontWeight: '700' },
});
