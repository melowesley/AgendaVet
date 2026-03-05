import React, { useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { logPetAdminHistory } from '@/lib/services/petHistory';
import { useQueryClient } from '@tanstack/react-query';

// ACCENT removido para usar theme.primary

export default function BanhoTosaScreen() {
    const { petId } = useLocalSearchParams<{ petId: string }>();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
    const router = useRouter();
    const queryClient = useQueryClient();
    const [saving, setSaving] = useState(false);

    const [servico, setServico] = useState('');
    const [banheiro, setBanheiro] = useState('');
    const [tosaModelo, setTosaModelo] = useState('');
    const [animalComportamento, setAnimalComportamento] = useState('');
    const [observacoes, setObservacoes] = useState('');
    const [valor, setValor] = useState('');

    const SERVICOS = ['Banho Simples', 'Banho + Secagem', 'Banho + Tosa', 'Tosa Higiênica', 'Tosa na Máquina', 'Tosa na Tesoura', 'Banho Medicado'];
    const COMPORTAMENTOS = ['Tranquilo', 'Agitado', 'Agressivo', 'Assustado', 'Cooperativo'];

    const handleSave = async () => {
        if (!servico) { Alert.alert('Atenção', 'Selecione o tipo de serviço.'); return; }
        setSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const details = { servico, banheiro, tosaModelo, animalComportamento, observacoes, valor };
            const { data, error } = await supabase.from('pet_admin_history').insert({
                pet_id: petId, user_id: session?.user?.id,
                module: 'banho_tosa', action: 'procedure',
                title: `Banho/Tosa: ${servico}`,
                details: JSON.stringify(details),
                created_at: new Date().toISOString(),
            }).select().single();
            if (error) throw error;
            await logPetAdminHistory({ petId, module: 'banho_tosa', action: 'create', title: `Banho/Tosa: ${servico}`, details, sourceTable: 'pet_admin_history', sourceId: data.id });
            queryClient.invalidateQueries({ queryKey: ['pet-timeline', petId] });
            Alert.alert('✅ Sucesso', 'Serviço registrado!', [{ text: 'OK', onPress: () => router.back() }]);
        } catch (e: any) { Alert.alert('Erro', e.message); } finally { setSaving(false); }
    };

    return (
        <KeyboardAvoidingView style={[s.container, { backgroundColor: theme.background }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <Stack.Screen options={{ title: 'Banho e Tosa', headerStyle: { backgroundColor: theme.background }, headerShadowVisible: false, headerLeft: () => <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 12 }}><Ionicons name="chevron-back" size={26} color={theme.primary} /></TouchableOpacity> }} />
            <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
                <View style={[s.hero, { backgroundColor: theme.primary + '15' }]}>
                    <Ionicons name="water-outline" size={32} color={theme.primary} />
                    <View style={{ marginLeft: 14 }}><Text style={[s.heroTitle, { color: theme.text }]}>Banho e Tosa</Text><Text style={[s.heroSub, { color: theme.textSecondary }]}>Registro do serviço de estética</Text></View>
                </View>

                <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={s.cardHeader}><Ionicons name="water-outline" size={18} color={theme.primary} /><Text style={[s.cardTitle, { color: theme.text }]}>Serviço</Text></View>
                    <Text style={[s.subLabel, { color: theme.textSecondary }]}>Tipo de Serviço *</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {SERVICOS.map(sv => (
                            <TouchableOpacity key={sv} style={[s.chip, { backgroundColor: theme.surfaceElevated }, servico === sv && { backgroundColor: theme.primary }]} onPress={() => setServico(sv)}>
                                <Text style={[s.chipText, { color: servico === sv ? 'white' : theme.textSecondary }]}>{sv}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <View style={s.fieldWrap}>
                        <Text style={[s.fieldLabel, { color: theme.textSecondary }]}>Responsável / Banheiro</Text>
                        <TextInput style={[s.fieldInput, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
                            value={banheiro} onChangeText={setBanheiro} placeholder="Nome do profissional"
                            placeholderTextColor={theme.textMuted} autoCapitalize="words" />
                    </View>
                    <View style={s.fieldWrap}>
                        <Text style={[s.fieldLabel, { color: theme.textSecondary }]}>Modelo de Tosa (se aplicável)</Text>
                        <TextInput style={[s.fieldInput, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
                            value={tosaModelo} onChangeText={setTosaModelo} placeholder="Ex: Shih Tzu padrão, Redinha..."
                            placeholderTextColor={theme.textMuted} autoCapitalize="sentences" />
                    </View>
                    <View style={s.fieldWrap}>
                        <Text style={[s.fieldLabel, { color: theme.textSecondary }]}>Valor Cobrado (R$)</Text>
                        <TextInput style={[s.fieldInput, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
                            value={valor} onChangeText={setValor} placeholder="0,00"
                            placeholderTextColor={theme.textMuted} keyboardType="decimal-pad" />
                    </View>
                </View>

                <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={s.cardHeader}><Ionicons name="paw-outline" size={18} color={theme.secondary} /><Text style={[s.cardTitle, { color: theme.text }]}>Comportamento do Animal</Text></View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {COMPORTAMENTOS.map(c => (
                            <TouchableOpacity key={c} style={[s.chip, { backgroundColor: theme.surfaceElevated }, animalComportamento === c && { backgroundColor: theme.secondary }]} onPress={() => setAnimalComportamento(c === animalComportamento ? '' : c)}>
                                <Text style={[s.chipText, { color: animalComportamento === c ? 'white' : theme.textSecondary }]}>{c}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <View style={s.fieldWrap}>
                        <Text style={[s.fieldLabel, { color: theme.textSecondary }]}>Observações</Text>
                        <TextInput
                            style={[s.fieldInput, s.multiline, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border, minHeight: 100 }]}
                            value={observacoes} onChangeText={setObservacoes}
                            placeholder="Intercorrências, produtos usados, recomendações ao tutor..."
                            placeholderTextColor={theme.textMuted} multiline scrollEnabled={false}
                            textAlignVertical="top" autoCapitalize="sentences" autoCorrect />
                    </View>
                </View>
            </ScrollView>
            <View style={s.footer}>
                <TouchableOpacity style={[s.saveBtn, { backgroundColor: servico ? theme.primary : theme.border }]} onPress={handleSave} disabled={saving || !servico}>
                    {saving ? <ActivityIndicator color="white" /> : <><Ionicons name="checkmark-circle" size={22} color={servico ? 'white' : theme.textMuted} style={{ marginRight: 8 }} /><Text style={[s.saveBtnText, { color: servico ? 'white' : theme.textMuted }]}>Registrar Serviço</Text></>}
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
    footer: { padding: 16, paddingBottom: 32 },
    saveBtn: { height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    saveBtnText: { fontSize: 16, fontWeight: '800' },
});
