import React, { useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { logPetAdminHistory } from '@/lib/services/petHistory';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ACCENT removido para usar theme.primary

export default function InternacaoScreen() {
    const { petId } = useLocalSearchParams<{ petId: string }>();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
    const router = useRouter();
    const queryClient = useQueryClient();
    const insets = useSafeAreaInsets();
    const [saving, setSaving] = useState(false);

    const [motivo, setMotivo] = useState('');
    const [dataEntrada, setDataEntrada] = useState(new Date().toLocaleDateString('pt-BR'));
    const [dataSaida, setDataSaida] = useState('');
    const [leito, setLeito] = useState('');
    const [veterinario, setVeterinario] = useState('');
    const [evolucao, setEvolucao] = useState('');
    const [alta, setAlta] = useState(false);
    const [condicaoAlta, setCondicaoAlta] = useState('');
    const [observacoes, setObservacoes] = useState('');

    const handleSave = async () => {
        if (!motivo.trim()) { Alert.alert('Atenção', 'Informe o motivo da internação.'); return; }
        setSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const details = { motivo, dataEntrada, dataSaida, leito, veterinario, evolucao, alta, condicaoAlta, observacoes };
            const { data, error } = await supabase.from('pet_admin_history').insert({
                pet_id: petId, user_id: session?.user?.id,
                module: 'internacao', action: 'procedure',
                title: alta ? `Alta: ${motivo}` : `Internação: ${motivo}`,
                details: JSON.stringify(details),
                created_at: new Date().toISOString(),
            }).select().single();
            if (error) throw error;
            await logPetAdminHistory({ petId, module: 'internacao', action: 'create', title: `Internação: ${motivo}`, details, sourceTable: 'pet_admin_history', sourceId: data.id });
            queryClient.invalidateQueries({ queryKey: ['pet-timeline', petId] });
            Alert.alert('✅ Sucesso', 'Internação registrada!', [{ text: 'OK', onPress: () => router.back() }]);
        } catch (e: any) { Alert.alert('Erro', e.message); } finally { setSaving(false); }
    };

    const F = (p: any) => <Field {...p} theme={theme} />;

    return (
        <KeyboardAvoidingView style={[s.container, { backgroundColor: theme.background }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <Stack.Screen options={{ title: 'Internação', headerStyle: { backgroundColor: theme.background }, headerShadowVisible: false, headerLeft: () => <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 12 }}><Ionicons name="chevron-back" size={26} color={theme.primary} /></TouchableOpacity> }} />
            <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
                <View style={[s.hero, { backgroundColor: theme.primary + '15' }]}>
                    <Ionicons name="bed-outline" size={32} color={theme.primary} />
                    <View style={{ marginLeft: 14 }}><Text style={[s.heroTitle, { color: theme.text }]}>Internação Hospitalar</Text><Text style={[s.heroSub, { color: theme.textSecondary }]}>Registro de entrada e evolução</Text></View>
                </View>

                <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={s.cardHeader}><Ionicons name="bed-outline" size={18} color={theme.primary} /><Text style={[s.cardTitle, { color: theme.text }]}>Dados da Internação</Text></View>
                    <F label="Motivo da Internação *" value={motivo} onChangeText={setMotivo} placeholder="Ex: Pós-operatório, Cuidados intensivos..." required />
                    <View style={s.row}>
                        <F label="Data de Entrada" value={dataEntrada} onChangeText={setDataEntrada} placeholder="DD/MM/AAAA" keyboardType="numeric" />
                        <F label="Leito / Box" value={leito} onChangeText={setLeito} placeholder="Ex: B-03" />
                    </View>
                    <F label="Veterinário Responsável" value={veterinario} onChangeText={setVeterinario} placeholder="Nome do Vet" />
                </View>

                <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={s.cardHeader}><Ionicons name="trending-up-outline" size={18} color={theme.primary} /><Text style={[s.cardTitle, { color: theme.text }]}>Evolução</Text></View>
                    <F label="Evolução / Anotações" value={evolucao} onChangeText={setEvolucao} placeholder="Registro da evolução clínica durante internação..." multiline minHeight={120} />
                    <F label="Observações" value={observacoes} onChangeText={setObservacoes} placeholder="Dieta, cuidados especiais..." multiline />
                </View>

                <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={s.cardHeader}><Ionicons name="exit-outline" size={18} color={theme.success} /><Text style={[s.cardTitle, { color: theme.text }]}>Alta Médica</Text></View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 }}>
                        <Text style={{ color: theme.text, fontSize: 15, fontWeight: '600' }}>Registrar Alta?</Text>
                        <Switch value={alta} onValueChange={setAlta} trackColor={{ true: theme.success, false: theme.border }} thumbColor={alta ? theme.success : theme.textMuted} />
                    </View>
                    {alta && (<>
                        <F label="Data de Saída" value={dataSaida} onChangeText={setDataSaida} placeholder="DD/MM/AAAA" keyboardType="numeric" />
                        <F label="Condição na Alta" value={condicaoAlta} onChangeText={setCondicaoAlta} placeholder="Ex: Estável, Melhora clínica significativa..." multiline />
                    </>)}
                </View>
            </ScrollView>
            <View style={[s.footer, { backgroundColor: theme.surface, borderTopColor: theme.border, paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
                <TouchableOpacity style={[s.saveBtn, { backgroundColor: motivo ? theme.primary : theme.border }]} onPress={handleSave} disabled={saving || !motivo}>
                    {saving ? <ActivityIndicator color="white" /> : <><Ionicons name="checkmark-circle" size={22} color={motivo ? 'white' : theme.textMuted} style={{ marginRight: 8 }} /><Text style={[s.saveBtnText, { color: motivo ? 'white' : theme.textMuted }]}>Registrar Internação</Text></>}
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
                value={value} onChangeText={onChangeText} placeholder={placeholder}
                placeholderTextColor={theme.textMuted} keyboardType={keyboardType}
                multiline={multiline} scrollEnabled={false} textAlignVertical={multiline ? 'top' : 'center'} autoCapitalize="sentences" autoCorrect />
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 }, scroll: { padding: 16, gap: 16, paddingBottom: 40 },
    hero: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, padding: 20 },
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
});
