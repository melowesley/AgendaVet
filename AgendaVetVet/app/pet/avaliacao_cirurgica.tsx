import React, { useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { logPetAdminHistory } from '@/lib/services/petHistory';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ACCENT removido para usar theme.primary

function Field({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline = false, minHeight = 52, theme, required }: any) {
    return (
        <View style={s.fieldWrap}>
            <Text style={[s.fieldLabel, { color: theme.textSecondary }]}>{label}{required ? ' *' : ''}</Text>
            <TextInput style={[s.fieldInput, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border, minHeight }, multiline && s.multiline]}
                value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={theme.textMuted}
                keyboardType={keyboardType} multiline={multiline} scrollEnabled={false}
                textAlignVertical={multiline ? 'top' : 'center'} autoCapitalize="sentences" autoCorrect />
        </View>
    );
}
function Row({ children }: any) { return <View style={s.row}>{children}</View>; }

export default function AvaliacaoCirurgicaScreen() {
    const { petId } = useLocalSearchParams<{ petId: string }>();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
    const router = useRouter();
    const queryClient = useQueryClient();
    const insets = useSafeAreaInsets();
    const [saving, setSaving] = useState(false);

    const [procedimento, setProcedimento] = useState('');
    const [indicacao, setIndicacao] = useState('');
    const [anestesia, setAnestesia] = useState('');
    const [risco, setRisco] = useState('');
    const [jejeumHoras, setJejeumHoras] = useState('');
    const [examesPreCirurgicos, setExamesPreCirurgicos] = useState('');
    const [alergias, setAlergias] = useState('');
    const [veterinario, setVeterinario] = useState('');
    const [dataPrevista, setDataPrevista] = useState('');
    const [observacoes, setObservacoes] = useState('');

    const RISCOS = ['ASA I (Saudável)', 'ASA II (Leve)', 'ASA III (Moderado)', 'ASA IV (Grave)', 'ASA V (Crítico)'];

    const handleSave = async () => {
        if (!procedimento.trim()) { Alert.alert('Atenção', 'Informe o procedimento cirúrgico.'); return; }
        setSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const details = { procedimento, indicacao, anestesia, risco, jejeumHoras, examesPreCirurgicos, alergias, veterinario, dataPrevista, observacoes };
            const { data, error } = await supabase.from('pet_admin_history').insert({
                pet_id: petId, user_id: session?.user?.id,
                module: 'avaliacao_cirurgica', action: 'procedure',
                title: `Avaliação Cirúrgica: ${procedimento}`,
                details: JSON.stringify(details),
                created_at: new Date().toISOString(),
            }).select().single();
            if (error) throw error;
            await logPetAdminHistory({ petId, module: 'avaliacao_cirurgica', action: 'create', title: `Avaliação Cirúrgica: ${procedimento}`, details, sourceTable: 'pet_admin_history', sourceId: data.id });
            queryClient.invalidateQueries({ queryKey: ['pet-timeline', petId] });
            Alert.alert('✅ Sucesso', 'Avaliação cirúrgica registrada!', [{ text: 'OK', onPress: () => router.back() }]);
        } catch (e: any) { Alert.alert('Erro', e.message); } finally { setSaving(false); }
    };

    const F = (p: any) => <Field {...p} theme={theme} />;

    return (
        <KeyboardAvoidingView style={[s.container, { backgroundColor: theme.background }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <Stack.Screen options={{ title: 'Avaliação Cirúrgica', headerStyle: { backgroundColor: theme.background }, headerShadowVisible: false, headerLeft: () => <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 12 }}><Ionicons name="chevron-back" size={26} color={theme.primary} /></TouchableOpacity> }} />
            <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
                <View style={[s.hero, { backgroundColor: theme.primary + '15' }]}>
                    <Ionicons name="clipboard-outline" size={32} color={theme.primary} />
                    <View style={{ marginLeft: 14 }}><Text style={[s.heroTitle, { color: theme.text }]}>Avaliação Pré-Cirúrgica</Text><Text style={[s.heroSub, { color: theme.textSecondary }]}>Triagem e aprovação para cirurgia</Text></View>
                </View>

                <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={s.cardHeader}><Ionicons name="clipboard-outline" size={18} color={theme.primary} /><Text style={[s.cardTitle, { color: theme.text }]}>Dados do Procedimento</Text></View>
                    <F label="Procedimento Cirúrgico *" value={procedimento} onChangeText={setProcedimento} placeholder="Ex: Orquiectomia, Exérese de tumor..." required />
                    <F label="Indicação Clínica" value={indicacao} onChangeText={setIndicacao} placeholder="Justificativa para o procedimento..." multiline minHeight={80} />
                    <Row>
                        <F label="Veterinário" value={veterinario} onChangeText={setVeterinario} placeholder="Cirurgião responsável" />
                        <F label="Data Prevista" value={dataPrevista} onChangeText={setDataPrevista} placeholder="DD/MM/AAAA" keyboardType="numeric" />
                    </Row>
                </View>

                <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={s.cardHeader}><Ionicons name="warning-outline" size={18} color={theme.warning} /><Text style={[s.cardTitle, { color: theme.text }]}>Risco Anestésico (ASA)</Text></View>
                    {RISCOS.map(r => (
                        <TouchableOpacity key={r} style={[s.riskBtn, { borderColor: risco === r ? theme.primary : theme.border, backgroundColor: risco === r ? theme.primary + '15' : theme.background }]} onPress={() => setRisco(r === risco ? '' : r)}>
                            <View style={[s.riskDot, { backgroundColor: risco === r ? theme.primary : theme.border }]} />
                            <Text style={[s.riskText, { color: risco === r ? theme.primary : theme.text }]}>{r}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={s.cardHeader}><Ionicons name="medical-outline" size={18} color={theme.error} /><Text style={[s.cardTitle, { color: theme.text }]}>Pré-Operatório</Text></View>
                    <F label="Tipo de Anestesia" value={anestesia} onChangeText={setAnestesia} placeholder="Ex: Geral inalatória, Local, Epidural..." />
                    <F label="Jejum (horas)" value={jejeumHoras} onChangeText={setJejeumHoras} placeholder="Ex: 8h sólidos / 4h líquidos" keyboardType="numeric" />
                    <F label="Exames Pré-Cirúrgicos" value={examesPreCirurgicos} onChangeText={setExamesPreCirurgicos} placeholder="Hemograma, Coagulograma, ECG..." multiline />
                    <F label="Alergias / Contraindicações" value={alergias} onChangeText={setAlergias} placeholder="Medicamentos contraindicados..." multiline />
                    <F label="Observações" value={observacoes} onChangeText={setObservacoes} placeholder="Informações adicionais..." multiline />
                </View>
            </ScrollView>
            <View style={[s.footer, { backgroundColor: theme.surface, borderTopColor: theme.border, paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
                <TouchableOpacity style={[s.saveBtn, { backgroundColor: procedimento ? theme.primary : theme.border }]} onPress={handleSave} disabled={saving || !procedimento}>
                    {saving ? <ActivityIndicator color="white" /> : <><Ionicons name="checkmark-circle" size={22} color={procedimento ? 'white' : theme.textMuted} style={{ marginRight: 8 }} /><Text style={[s.saveBtnText, { color: procedimento ? 'white' : theme.textMuted }]}>Salvar Avaliação</Text></>}
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
    riskBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, padding: 12 },
    riskDot: { width: 10, height: 10, borderRadius: 5 },
    riskText: { fontSize: 14, fontWeight: '600' },
    row: { flexDirection: 'row', gap: 12 },
    fieldWrap: { flex: 1 },
    fieldLabel: { fontSize: 12, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
    fieldInput: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
    multiline: { paddingTop: 14 },
    footer: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth },
    saveBtn: { height: 46, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    saveBtnText: { fontSize: 16, fontWeight: '700' },
});
