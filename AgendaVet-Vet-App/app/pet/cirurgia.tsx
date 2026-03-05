import React, { useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { logPetAdminHistory } from '@/lib/services/petHistory';
import { useQueryClient } from '@tanstack/react-query';

// ACCENT removido para usar theme.primary

export default function CirurgiaScreen() {
    const { petId } = useLocalSearchParams<{ petId: string }>();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
    const router = useRouter();
    const queryClient = useQueryClient();
    const [saving, setSaving] = useState(false);

    const [procedimento, setProcedimento] = useState('');
    const [cirurgiao, setCirurgiao] = useState('');
    const [anestesista, setAnestesista] = useState('');
    const [anestesia, setAnestesia] = useState('');
    const [duracao, setDuracao] = useState('');
    const [achados, setAchados] = useState('');
    const [tecnica, setTecnica] = useState('');
    const [complicacoes, setComplicacoes] = useState('');
    const [posOperatorio, setPosOperatorio] = useState('');
    const [resultado, setResultado] = useState('');
    const [observacoes, setObservacoes] = useState('');

    const RESULTADOS = ['Excelente', 'Bem-sucedida', 'Com intercorrências', 'Complicada'];

    const handleSave = async () => {
        if (!procedimento.trim()) { Alert.alert('Atenção', 'Informe o procedimento cirúrgico.'); return; }
        setSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const details = { procedimento, cirurgiao, anestesista, anestesia, duracao, achados, tecnica, complicacoes, posOperatorio, resultado, observacoes };
            const { data, error } = await supabase.from('pet_admin_history').insert({
                pet_id: petId, user_id: session?.user?.id,
                module: 'cirurgia', action: 'procedure',
                title: `Cirurgia: ${procedimento}`,
                details: JSON.stringify(details),
                created_at: new Date().toISOString(),
            }).select().single();
            if (error) throw error;
            await logPetAdminHistory({ petId, module: 'cirurgia', action: 'create', title: `Cirurgia: ${procedimento}`, details, sourceTable: 'pet_admin_history', sourceId: data.id });
            queryClient.invalidateQueries({ queryKey: ['pet-timeline', petId] });
            Alert.alert('✅ Sucesso', 'Cirurgia registrada!', [{ text: 'OK', onPress: () => router.back() }]);
        } catch (e: any) { Alert.alert('Erro', e.message); } finally { setSaving(false); }
    };

    const F = (p: any) => <Field {...p} theme={theme} />;

    return (
        <KeyboardAvoidingView style={[s.container, { backgroundColor: theme.background }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <Stack.Screen options={{ title: 'Cirurgia', headerStyle: { backgroundColor: theme.background }, headerShadowVisible: false, headerLeft: () => <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 12 }}><Ionicons name="chevron-back" size={26} color={theme.primary} /></TouchableOpacity> }} />
            <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
                <View style={[s.hero, { backgroundColor: theme.primary + '15' }]}>
                    <Ionicons name="cut-outline" size={32} color={theme.primary} />
                    <View style={{ marginLeft: 14 }}><Text style={[s.heroTitle, { color: theme.text }]}>Relatório Cirúrgico</Text><Text style={[s.heroSub, { color: theme.textSecondary }]}>Registro completo do procedimento</Text></View>
                </View>

                <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={s.cardHeader}><Ionicons name="cut-outline" size={18} color={theme.primary} /><Text style={[s.cardTitle, { color: theme.text }]}>Identificação</Text></View>
                    <F label="Procedimento Cirúrgico *" value={procedimento} onChangeText={setProcedimento} placeholder="Ex: Ovariosalpingohisterectomia..." required />
                    <Row><F label="Cirurgião" value={cirurgiao} onChangeText={setCirurgiao} placeholder="Nome do cirurgião" /><F label="Anestesista" value={anestesista} onChangeText={setAnestesista} placeholder="Nome" /></Row>
                    <Row><F label="Tipo de Anestesia" value={anestesia} onChangeText={setAnestesia} placeholder="Ex: Geral total IV" /><F label="Duração" value={duracao} onChangeText={setDuracao} placeholder="Ex: 1h30min" /></Row>
                </View>

                <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={s.cardHeader}><Ionicons name="document-text-outline" size={18} color={theme.primary} /><Text style={[s.cardTitle, { color: theme.text }]}>Relatório</Text></View>
                    <F label="Achados Intraoperatórios" value={achados} onChangeText={setAchados} placeholder="O que foi encontrado durante o procedimento..." multiline minHeight={100} />
                    <F label="Técnica Utilizada" value={tecnica} onChangeText={setTecnica} placeholder="Descrição da técnica cirúrgica..." multiline minHeight={80} />
                    <F label="Complicações Intraoperatórias" value={complicacoes} onChangeText={setComplicacoes} placeholder="Intercorrências durante a cirurgia (NENHUMA se não houve)..." multiline />
                </View>

                <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={s.cardHeader}><Ionicons name="heart-outline" size={18} color={theme.success} /><Text style={[s.cardTitle, { color: theme.text }]}>Pós-Operatório</Text></View>
                    <Text style={[s.subLabel, { color: theme.textSecondary }]}>Resultado da Cirurgia</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {RESULTADOS.map(r => (<TouchableOpacity key={r} style={[s.chip, { backgroundColor: theme.surfaceElevated }, resultado === r && { backgroundColor: theme.primary }]} onPress={() => setResultado(r === resultado ? '' : r)}><Text style={[s.chipText, { color: resultado === r ? 'white' : theme.textSecondary }]}>{r}</Text></TouchableOpacity>))}
                    </View>
                    <F label="Cuidados Pós-Operatórios" value={posOperatorio} onChangeText={setPosOperatorio} placeholder="Instruções de recuperação, medicações pós-op..." multiline minHeight={100} />
                    <F label="Observações" value={observacoes} onChangeText={setObservacoes} placeholder="Anotações adicionais..." multiline />
                </View>
            </ScrollView>
            <View style={s.footer}>
                <TouchableOpacity style={[s.saveBtn, { backgroundColor: procedimento ? theme.primary : theme.border }]} onPress={handleSave} disabled={saving || !procedimento}>
                    {saving ? <ActivityIndicator color="white" /> : <><Ionicons name="checkmark-circle" size={22} color={procedimento ? 'white' : theme.textMuted} style={{ marginRight: 8 }} /><Text style={[s.saveBtnText, { color: procedimento ? 'white' : theme.textMuted }]}>Salvar Relatório Cirúrgico</Text></>}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

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
    row: { flexDirection: 'row', gap: 12 },
    fieldWrap: { flex: 1 },
    fieldLabel: { fontSize: 12, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
    fieldInput: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
    multiline: { paddingTop: 14 },
    footer: { padding: 16, paddingBottom: 32 },
    saveBtn: { height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    saveBtnText: { fontSize: 16, fontWeight: '800' },
});
