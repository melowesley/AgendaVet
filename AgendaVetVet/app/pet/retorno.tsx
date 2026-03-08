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

export default function RetornoScreen() {
    const { petId } = useLocalSearchParams<{ petId: string }>();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
    const router = useRouter();
    const queryClient = useQueryClient();
    const insets = useSafeAreaInsets();
    const [saving, setSaving] = useState(false);
    const [printing, setPrinting] = useState(false);
    const { vetProfile, petData, tutorData, loading: autoFillLoading, buildPdfData } = useAttendanceAutoFill(petId);

    const [evolucao, setEvolucao] = useState('');
    const [conduta, setConduta] = useState('');
    const [temperatura, setTemperatura] = useState('');
    const [peso, setPeso] = useState('');
    const [veterinario, setVeterinario] = useState('');
    const [observacoes, setObservacoes] = useState('');

    const handleSave = async () => {
        if (!evolucao.trim()) { Alert.alert('Atenção', 'Descreva a evolução do paciente.'); return; }
        setSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const { data, error } = await supabase.from('pet_admin_history').insert({
                pet_id: petId, user_id: session?.user?.id,
                module: 'retorno', action: 'procedure',
                title: 'Retorno de Consulta',
                details: JSON.stringify({ evolucao, conduta, temperatura, peso, veterinario, observacoes }),
                created_at: new Date().toISOString(),
            }).select().single();
            if (error) throw error;
            queryClient.invalidateQueries({ queryKey: ['pet-timeline', petId] });
            Alert.alert('✅ Sucesso', 'Retorno registrado!', [{ text: 'OK', onPress: () => router.back() }]);
        } catch (e: any) { Alert.alert('Erro', e.message); } finally { setSaving(false); }
    };

    return (
        <KeyboardAvoidingView style={[s.container, { backgroundColor: theme.background }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <Stack.Screen options={{ title: 'Retorno de Consulta', headerStyle: { backgroundColor: theme.background }, headerShadowVisible: false, headerLeft: () => <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 12 }}><Ionicons name="chevron-back" size={26} color={theme.primary} /></TouchableOpacity> }} />
            <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
                <View style={[s.hero, { backgroundColor: theme.primary + '15' }]}>
                    <Ionicons name="refresh-outline" size={32} color={theme.primary} />
                    <View style={{ marginLeft: 14 }}>
                        <Text style={[s.heroTitle, { color: theme.text }]}>Retorno</Text>
                        <Text style={[s.heroSub, { color: theme.textSecondary }]}>Acompanhamento pós-consulta</Text>
                    </View>
                </View>

                <AutoFillHeader vetProfile={vetProfile} petData={petData} tutorData={tutorData} loading={autoFillLoading} theme={theme} />

                <Card theme={theme} title="Exame Físico" icon="pulse-outline" color={theme.primary}>
                    <Row>
                        <Field label="Temperatura (°C)" value={temperatura} onChangeText={setTemperatura} placeholder="38.5" keyboardType="decimal-pad" theme={theme} />
                        <Field label="Peso (kg)" value={peso} onChangeText={setPeso} placeholder="10.5" keyboardType="decimal-pad" theme={theme} />
                    </Row>
                    <Field label="Veterinário Responsável" value={veterinario} onChangeText={setVeterinario} placeholder="Nome do Vet" theme={theme} />
                </Card>

                <Card theme={theme} title="Evolução Clínica" icon="trending-up-outline" color={theme.primary}>
                    <Field label="Evolução do Paciente *" value={evolucao} onChangeText={setEvolucao} placeholder="Descreva como o animal evoluiu desde a última consulta..." theme={theme} multiline minHeight={120} required />
                    <Field label="Conduta / Plano Terapêutico" value={conduta} onChangeText={setConduta} placeholder="Ajustes, manutenção ou encerramento do tratamento..." theme={theme} multiline minHeight={100} />
                    <Field label="Observações Adicionais" value={observacoes} onChangeText={setObservacoes} placeholder="Anotações livres..." theme={theme} multiline />
                </Card>
            </ScrollView>
            <View style={[s.footer, { backgroundColor: theme.surface, borderTopColor: theme.border, paddingBottom: Math.max(insets.bottom + 16, 24), flexDirection: 'row', gap: 10 }]}>
                <TouchableOpacity style={[s.pdfBtn, { borderColor: theme.primary }]} onPress={async () => { setPrinting(true); try { await printAttendancePdf(buildPdfData('retorno', { evolucao, conduta, temperatura, peso, veterinario, observacoes })); } finally { setPrinting(false); } }} disabled={printing}>
                    {printing ? <ActivityIndicator color={theme.primary} size="small" /> : <><Ionicons name="document-text-outline" size={20} color={theme.primary} /><Text style={[s.pdfBtnText, { color: theme.primary }]}>PDF</Text></>}
                </TouchableOpacity>
                <TouchableOpacity style={[s.saveBtn, { backgroundColor: evolucao ? theme.primary : theme.border, flex: 1 }]} onPress={handleSave} disabled={saving || !evolucao}>
                    {saving ? <ActivityIndicator color="white" /> : <><Ionicons name="checkmark-circle" size={22} color={evolucao ? "white" : theme.textMuted} style={{ marginRight: 8 }} /><Text style={[s.saveBtnText, { color: evolucao ? "white" : theme.textMuted }]}>Finalizar e Salvar</Text></>}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

// ─── Componentes compartilhados ───
function Card({ theme, title, icon, color, children }: any) {
    return (
        <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={s.cardHeader}>
                <Ionicons name={icon} size={18} color={color} />
                <Text style={[s.cardTitle, { color: theme.text }]}>{title}</Text>
            </View>
            {children}
        </View>
    );
}
function Row({ children }: any) { return <View style={s.row}>{children}</View>; }
function Field({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline = false, minHeight = 52, theme, required }: any) {
    return (
        <View style={s.fieldWrap}>
            <Text style={[s.fieldLabel, { color: theme.textSecondary }]}>{label}{required ? ' *' : ''}</Text>
            <TextInput
                style={[s.fieldInput, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border, minHeight }, multiline && s.multiline]}
                value={value} onChangeText={onChangeText} placeholder={placeholder}
                placeholderTextColor={theme.textMuted} keyboardType={keyboardType}
                multiline={multiline} scrollEnabled={false} textAlignVertical={multiline ? 'top' : 'center'}
                autoCapitalize="sentences" autoCorrect
            />
        </View>
    );
}
function Footer({ onSave, saving, valid, color, theme, insets }: any) {
    return (
        <View style={[s.footer, { backgroundColor: theme.surface, borderTopColor: theme.border, paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
            <TouchableOpacity style={[s.saveBtn, { backgroundColor: valid ? color : theme.border }]} onPress={onSave} disabled={saving || !valid}>
                {saving ? <ActivityIndicator color="white" /> : <><Ionicons name="checkmark-circle" size={22} color={valid ? "white" : theme.textMuted} style={{ marginRight: 8 }} /><Text style={[s.saveBtnText, { color: valid ? "white" : theme.textMuted }]}>Finalizar e Salvar</Text></>}
            </TouchableOpacity>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 }, scroll: { padding: 16, gap: 16, paddingBottom: 40 },
    hero: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, padding: 20, marginBottom: 4 },
    heroTitle: { fontSize: 22, fontWeight: '800' }, heroSub: { fontSize: 13 },
    card: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 14, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#E5E7EB' },
    cardTitle: { fontSize: 15, fontWeight: '800' },
    row: { flexDirection: 'row', gap: 12 },
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
