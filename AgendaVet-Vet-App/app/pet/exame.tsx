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

function CardComp({ theme, title, icon, color, children }: any) {
    return (
        <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={s.cardHeader}><Ionicons name={icon} size={18} color={color} /><Text style={[s.cardTitle, { color: theme.text }]}>{title}</Text></View>
            {children}
        </View>
    );
}
function Row({ children }: any) { return <View style={s.row}>{children}</View>; }
function FieldBase({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline = false, minHeight = 52, theme }: any) {
    return (
        <View style={s.fieldWrap}>
            <Text style={[s.fieldLabel, { color: theme.textSecondary }]}>{label}</Text>
            <TextInput style={[s.fieldInput, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border, minHeight }, multiline && s.multiline]}
                value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={theme.textMuted}
                keyboardType={keyboardType} multiline={multiline} scrollEnabled={false}
                textAlignVertical={multiline ? 'top' : 'center'} autoCapitalize="sentences" autoCorrect />
        </View>
    );
}
function FooterBtn({ onSave, saving, valid, color, label, theme, insets }: any) {
    return (
        <View style={[s.footer, { backgroundColor: theme.surface, borderTopColor: theme.border, paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
            <TouchableOpacity style={[s.saveBtn, { backgroundColor: valid ? color : theme.border }]} onPress={onSave} disabled={saving || !valid}>
                {saving ? <ActivityIndicator color="white" /> : <><Ionicons name="checkmark-circle" size={22} color={valid ? 'white' : theme.textMuted} style={{ marginRight: 8 }} /><Text style={[s.saveBtnText, { color: valid ? 'white' : theme.textMuted }]}>{label}</Text></>}
            </TouchableOpacity>
        </View>
    );
}

export default function ExameScreen() {
    const { petId } = useLocalSearchParams<{ petId: string }>();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
    const router = useRouter();
    const queryClient = useQueryClient();
    const insets = useSafeAreaInsets();
    const [saving, setSaving] = useState(false);

    const [tipoExame, setTipoExame] = useState('');
    const [laboratorio, setLaboratorio] = useState('');
    const [dataColeta, setDataColeta] = useState(new Date().toLocaleDateString('pt-BR'));
    const [dataResultado, setDataResultado] = useState('');
    const [resultado, setResultado] = useState('');
    const [interpretacao, setInterpretacao] = useState('');
    const [veterinario, setVeterinario] = useState('');
    const [observacoes, setObservacoes] = useState('');

    const TIPOS = ['Hemograma', 'Bioquímica', 'Urinálise', 'Coproparasitológico', 'Ultrassom', 'Raio-X', 'Citologia', 'Histopatologia', 'PCR / Sorologia', 'Outro'];

    const handleSave = async () => {
        if (!tipoExame.trim()) { Alert.alert('Atenção', 'Informe o tipo de exame.'); return; }
        setSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const details = { tipoExame, laboratorio, dataColeta, dataResultado, resultado, interpretacao, veterinario, observacoes };
            const { data, error } = await supabase.from('pet_admin_history').insert({
                pet_id: petId, user_id: session?.user?.id,
                module: 'exame', action: 'procedure',
                title: `Exame: ${tipoExame}`,
                details: JSON.stringify(details),
                created_at: new Date().toISOString(),
            }).select().single();
            if (error) throw error;
            await logPetAdminHistory({ petId, module: 'exame', action: 'create', title: `Exame: ${tipoExame}`, details, sourceTable: 'pet_admin_history', sourceId: data.id });
            queryClient.invalidateQueries({ queryKey: ['pet-timeline', petId] });
            Alert.alert('✅ Sucesso', 'Exame registrado!', [{ text: 'OK', onPress: () => router.back() }]);
        } catch (e: any) { Alert.alert('Erro', e.message); } finally { setSaving(false); }
    };

    const F = (p: any) => <FieldBase {...p} theme={theme} />;

    return (
        <KeyboardAvoidingView style={[s.container, { backgroundColor: theme.background }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <Stack.Screen options={{ title: 'Exame', headerStyle: { backgroundColor: theme.background }, headerShadowVisible: false, headerLeft: () => <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 12 }}><Ionicons name="chevron-back" size={26} color={theme.primary} /></TouchableOpacity> }} />
            <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
                <View style={[s.hero, { backgroundColor: theme.primary + '15' }]}>
                    <Ionicons name="flask-outline" size={32} color={theme.primary} />
                    <View style={{ marginLeft: 14 }}><Text style={[s.heroTitle, { color: theme.text }]}>Registro de Exame</Text><Text style={[s.heroSub, { color: theme.textSecondary }]}>Laboratorial, imagem ou patológico</Text></View>
                </View>

                <CardComp theme={theme} title="Identificação do Exame" icon="flask-outline" color={theme.primary}>
                    <Text style={[s.subLabel, { color: theme.textSecondary }]}>Tipo de Exame *</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                        {TIPOS.map(t => (
                            <TouchableOpacity key={t} style={[s.chip, { backgroundColor: theme.surfaceElevated }, tipoExame === t && { backgroundColor: theme.primary }]} onPress={() => setTipoExame(t)}>
                                <Text style={[s.chipText, { color: tipoExame === t ? 'white' : theme.textSecondary }]}>{t}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    {tipoExame === 'Outro' && <F label="Especifique" value={tipoExame === 'Outro' ? '' : tipoExame} onChangeText={setTipoExame} placeholder="Tipo de exame..." />}
                    <Row>
                        <F label="Laboratório / Clínica" value={laboratorio} onChangeText={setLaboratorio} placeholder="Ex: Lab Vetclin" />
                        <F label="Veterinário Solicitante" value={veterinario} onChangeText={setVeterinario} placeholder="Nome do Vet" />
                    </Row>
                    <Row>
                        <F label="Data da Coleta" value={dataColeta} onChangeText={setDataColeta} placeholder="DD/MM/AAAA" keyboardType="numeric" />
                        <F label="Data do Resultado" value={dataResultado} onChangeText={setDataResultado} placeholder="DD/MM/AAAA" keyboardType="numeric" />
                    </Row>
                </CardComp>

                <CardComp theme={theme} title="Resultado" icon="document-text-outline" color={theme.primary}>
                    <F label="Resultado / Laudo" value={resultado} onChangeText={setResultado} placeholder="Cole aqui o resultado ou transcreva os valores principais..." multiline minHeight={120} />
                    <F label="Interpretação Clínica" value={interpretacao} onChangeText={setInterpretacao} placeholder="Análise do resultado pelo veterinário..." multiline minHeight={80} />
                    <F label="Observações" value={observacoes} onChangeText={setObservacoes} placeholder="Anotações adicionais..." multiline />
                </CardComp>
            </ScrollView>
            <FooterBtn onSave={handleSave} saving={saving} valid={!!tipoExame} color={theme.primary} label="Salvar Exame" theme={theme} insets={insets} />
        </KeyboardAvoidingView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 }, scroll: { padding: 16, gap: 16, paddingBottom: 40 },
    hero: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, padding: 20, marginBottom: 4 },
    heroTitle: { fontSize: 22, fontWeight: '800' }, heroSub: { fontSize: 13 },
    card: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 14, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#E5E7EB' },
    cardTitle: { fontSize: 15, fontWeight: '800' },
    subLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
    chipText: { fontSize: 12, fontWeight: '600' },
    row: { flexDirection: 'row', gap: 12 },
    fieldWrap: { flex: 1 },
    fieldLabel: { fontSize: 12, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
    fieldInput: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
    multiline: { paddingTop: 14 },
    footer: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth },
    saveBtn: { height: 46, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    saveBtnText: { fontSize: 16, fontWeight: '700' },
});
