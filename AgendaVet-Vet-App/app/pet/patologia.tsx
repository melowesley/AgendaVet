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

export default function PatologiaScreen() {
    const { petId } = useLocalSearchParams<{ petId: string }>();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
    const router = useRouter();
    const queryClient = useQueryClient();
    const insets = useSafeAreaInsets();
    const [saving, setSaving] = useState(false);

    const [patologia, setPatologia] = useState('');
    const [cid, setCid] = useState('');
    const [descricao, setDescricao] = useState('');
    const [nivel, setNivel] = useState('');
    const [conduta, setConduta] = useState('');
    const [prognostico, setPrognostico] = useState('');
    const [veterinario, setVeterinario] = useState('');
    const [observacoes, setObservacoes] = useState('');

    const NIVEIS = ['Leve', 'Moderado', 'Grave', 'Crônico'];
    const PROGNOS = ['Favorável', 'Reservado', 'Desfavorável', 'Incerto'];

    const handleSave = async () => {
        if (!patologia.trim()) { Alert.alert('Atenção', 'Informe a patologia diagnosticada.'); return; }
        setSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const details = { patologia, cid, descricao, nivel, conduta, prognostico, veterinario, observacoes };
            const { data, error } = await supabase.from('pet_admin_history').insert({
                pet_id: petId, user_id: session?.user?.id,
                module: 'patologia', action: 'procedure',
                title: `Patologia: ${patologia}`,
                details: JSON.stringify(details),
                created_at: new Date().toISOString(),
            }).select().single();
            if (error) throw error;
            await logPetAdminHistory({ petId, module: 'patologia', action: 'create', title: `Patologia: ${patologia}`, details, sourceTable: 'pet_admin_history', sourceId: data.id });
            queryClient.invalidateQueries({ queryKey: ['pet-timeline', petId] });
            Alert.alert('✅ Sucesso', 'Patologia registrada!', [{ text: 'OK', onPress: () => router.back() }]);
        } catch (e: any) { Alert.alert('Erro', e.message); } finally { setSaving(false); }
    };

    const F = (p: any) => <FieldBase {...p} theme={theme} />;
    const ChipGroup = ({ options, value, onSelect, theme }: any) => (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
            {options.map((o: string) => (
                <TouchableOpacity key={o} style={[s.chip, { backgroundColor: theme.surfaceElevated }, value === o && { backgroundColor: theme.primary }]} onPress={() => onSelect(o === value ? '' : o)}>
                    <Text style={[s.chipText, { color: value === o ? 'white' : theme.textSecondary }]}>{o}</Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );

    return (
        <KeyboardAvoidingView style={[s.container, { backgroundColor: theme.background }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <Stack.Screen options={{ title: 'Patologia', headerStyle: { backgroundColor: theme.background }, headerShadowVisible: false, headerLeft: () => <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 12 }}><Ionicons name="chevron-back" size={26} color={theme.primary} /></TouchableOpacity> }} />
            <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
                <View style={[s.hero, { backgroundColor: theme.primary + '15' }]}>
                    <Ionicons name="bandage-outline" size={32} color={theme.primary} />
                    <View style={{ marginLeft: 14 }}><Text style={[s.heroTitle, { color: theme.text }]}>Registro de Patologia</Text><Text style={[s.heroSub, { color: theme.textSecondary }]}>Diagnóstico e conduta clínica</Text></View>
                </View>

                <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={s.cardHeader}><Ionicons name="warning-outline" size={18} color={theme.primary} /><Text style={[s.cardTitle, { color: theme.text }]}>Identificação</Text></View>
                    <F label="Patologia / Diagnóstico *" value={patologia} onChangeText={setPatologia} placeholder="Ex: Otite bilateral, Dermatite..." required />
                    <F label="CID-Vet / Código (opcional)" value={cid} onChangeText={setCid} placeholder="Código da patologia" />
                    <F label="Veterinário Responsável" value={veterinario} onChangeText={setVeterinario} placeholder="Nome do Vet" />
                    <Text style={[s.subLabel, { color: theme.textSecondary }]}>Nível de Gravidade</Text>
                    <ChipGroup options={NIVEIS} value={nivel} onSelect={setNivel} theme={theme} />
                    <Text style={[s.subLabel, { color: theme.textSecondary }]}>Prognóstico</Text>
                    <ChipGroup options={PROGNOS} value={prognostico} onSelect={setPrognostico} theme={theme} />
                </View>

                <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={s.cardHeader}><Ionicons name="document-text-outline" size={18} color={theme.primary} /><Text style={[s.cardTitle, { color: theme.text }]}>Descrição e Conduta</Text></View>
                    <F label="Descrição Clínica" value={descricao} onChangeText={setDescricao} placeholder="Achados clínicos, sinais apresentados..." multiline minHeight={100} />
                    <F label="Conduta / Tratamento" value={conduta} onChangeText={setConduta} placeholder="Medicamentos, procedimentos indicados..." multiline minHeight={100} />
                    <F label="Observações" value={observacoes} onChangeText={setObservacoes} placeholder="Anotações adicionais..." multiline />
                </View>
            </ScrollView>
            <View style={[s.footer, { backgroundColor: theme.surface, borderTopColor: theme.border, paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
                <TouchableOpacity style={[s.saveBtn, { backgroundColor: patologia ? theme.primary : theme.border }]} onPress={handleSave} disabled={saving || !patologia}>
                    {saving ? <ActivityIndicator color="white" /> : <><Ionicons name="checkmark-circle" size={22} color={patologia ? 'white' : theme.textMuted} style={{ marginRight: 8 }} /><Text style={[s.saveBtnText, { color: patologia ? 'white' : theme.textMuted }]}>Registrar Patologia</Text></>}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

function FieldBase({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline = false, minHeight = 52, theme, required }: any) {
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
});
