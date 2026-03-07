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

function Card({ theme, title, icon, color, children }: any) {
    return (
        <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={s.cardHeader}><Ionicons name={icon} size={18} color={color} /><Text style={[s.cardTitle, { color: theme.text }]}>{title}</Text></View>
            {children}
        </View>
    );
}
function Row({ children }: any) { return <View style={s.row}>{children}</View>; }
function FieldBase({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline = false, minHeight = 52, theme, required }: any) {
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
function FooterBtn({ onSave, saving, valid, color, label, theme, insets }: any) {
    return (
        <View style={[s.footer, { backgroundColor: theme.surface, borderTopColor: theme.border, paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
            <TouchableOpacity style={[s.saveBtn, { backgroundColor: valid ? color : theme.border }]} onPress={onSave} disabled={saving || !valid}>
                {saving ? <ActivityIndicator color="white" /> : <><Ionicons name="checkmark-circle" size={22} color={valid ? 'white' : theme.textMuted} style={{ marginRight: 8 }} /><Text style={[s.saveBtnText, { color: valid ? 'white' : theme.textMuted }]}>{label}</Text></>}
            </TouchableOpacity>
        </View>
    );
}

export default function VacinaScreen() {
    const { petId } = useLocalSearchParams<{ petId: string }>();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
    const router = useRouter();
    const queryClient = useQueryClient();
    const insets = useSafeAreaInsets();
    const [saving, setSaving] = useState(false);

    const [nomeVacina, setNomeVacina] = useState('');
    const [fabricante, setFabricante] = useState('');
    const [lote, setLote] = useState('');
    const [validade, setValidade] = useState('');
    const [dose, setDose] = useState('');
    const [viaAdm, setViaAdm] = useState('');
    const [veterinario, setVeterinario] = useState('');
    const [proximaDose, setProximaDose] = useState('');
    const [reacao, setReacao] = useState(false);
    const [descReacao, setDescReacao] = useState('');
    const [observacoes, setObservacoes] = useState('');

    const handleSave = async () => {
        if (!nomeVacina.trim()) { Alert.alert('Atenção', 'Informe o nome da vacina/medicação.'); return; }
        setSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const details = { nomeVacina, fabricante, lote, validade, dose, viaAdm, veterinario, proximaDose, reacao, descReacao, observacoes };
            const { data, error } = await supabase.from('pet_admin_history').insert({
                pet_id: petId, user_id: session?.user?.id,
                module: 'vacina', action: 'procedure',
                title: `Vacina/Aplicação: ${nomeVacina}`,
                details: JSON.stringify(details),
                created_at: new Date().toISOString(),
            }).select().single();
            if (error) throw error;
            await logPetAdminHistory({ petId, module: 'vacina', action: 'create', title: `Vacina: ${nomeVacina}`, details, sourceTable: 'pet_admin_history', sourceId: data.id });
            queryClient.invalidateQueries({ queryKey: ['pet-timeline', petId] });
            Alert.alert('✅ Sucesso', 'Vacina/Aplicação registrada!', [{ text: 'OK', onPress: () => router.back() }]);
        } catch (e: any) { Alert.alert('Erro', e.message); } finally { setSaving(false); }
    };

    const F = (props: any) => <FieldBase {...props} theme={theme} />;

    return (
        <KeyboardAvoidingView style={[s.container, { backgroundColor: theme.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Stack.Screen options={{ title: 'Vacina / Aplicação', headerStyle: { backgroundColor: theme.background }, headerShadowVisible: false, headerLeft: () => <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 12 }}><Ionicons name="chevron-back" size={26} color={theme.primary} /></TouchableOpacity> }} />
            <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
                <View style={[s.hero, { backgroundColor: theme.primary + '15' }]}>
                    <Ionicons name="medical-outline" size={32} color={theme.primary} />
                    <View style={{ marginLeft: 14 }}>
                        <Text style={[s.heroTitle, { color: theme.text }]}>Vacina / Aplicação</Text>
                        <Text style={[s.heroSub, { color: theme.textSecondary }]}>Registro de imunização ou medicação</Text>
                    </View>
                </View>

                <Card theme={theme} title="Identificação" icon="shield-checkmark-outline" color={theme.primary}>
                    <F label="Nome da Vacina / Medicação *" value={nomeVacina} onChangeText={setNomeVacina} placeholder="Ex: V10, Antirrábica, Ivermectina..." required />
                    <Row>
                        <F label="Fabricante" value={fabricante} onChangeText={setFabricante} placeholder="Ex: Zoetis" />
                        <F label="Lote" value={lote} onChangeText={setLote} placeholder="Ex: A123B" />
                    </Row>
                    <Row>
                        <F label="Validade" value={validade} onChangeText={setValidade} placeholder="MM/AAAA" keyboardType="numeric" />
                        <F label="Dose" value={dose} onChangeText={setDose} placeholder="Ex: 1ª dose" />
                    </Row>
                    <Row>
                        <F label="Via de Adm." value={viaAdm} onChangeText={setViaAdm} placeholder="SC / IM / IV" />
                        <F label="Veterinário" value={veterinario} onChangeText={setVeterinario} placeholder="Nome do Vet" />
                    </Row>
                    <F label="Próxima Dose / Reforço" value={proximaDose} onChangeText={setProximaDose} placeholder="DD/MM/AAAA" keyboardType="numeric" />
                </Card>

                <Card theme={theme} title="Reação / Intercorrência" icon="alert-circle-outline" color={theme.error}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 }}>
                        <Text style={{ color: theme.text, fontSize: 15, fontWeight: '600' }}>Houve reação adversa?</Text>
                        <Switch value={reacao} onValueChange={setReacao} trackColor={{ true: theme.error }} thumbColor={reacao ? theme.error : theme.textMuted} />
                    </View>
                    {reacao && <F label="Descreva a Reação" value={descReacao} onChangeText={setDescReacao} placeholder="Sintomas, horário, conduta tomada..." multiline minHeight={100} />}
                </Card>

                <Card theme={theme} title="Observações" icon="chatbox-ellipses-outline" color={theme.textSecondary}>
                    <F label="Observações Adicionais" value={observacoes} onChangeText={setObservacoes} placeholder="Anotações livres..." multiline />
                </Card>
            </ScrollView>
            <FooterBtn onSave={handleSave} saving={saving} valid={!!nomeVacina} color={theme.primary} label="Registrar Vacina" theme={theme} insets={insets} />
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
    row: { flexDirection: 'row', gap: 12 },
    fieldWrap: { flex: 1 },
    fieldLabel: { fontSize: 12, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
    fieldInput: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
    multiline: { paddingTop: 14 },
    footer: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth },
    saveBtn: { height: 46, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    saveBtnText: { fontSize: 16, fontWeight: '700' },
});
