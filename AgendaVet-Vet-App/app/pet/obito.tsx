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

export default function ObitoScreen() {
    const { petId, petName } = useLocalSearchParams<{ petId: string; petName: string }>();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
    const router = useRouter();
    const queryClient = useQueryClient();
    const insets = useSafeAreaInsets();
    const [saving, setSaving] = useState(false);
    const [confirmado, setConfirmado] = useState(false);

    const [causa, setCausa] = useState('');
    const [dataObito, setDataObito] = useState(new Date().toLocaleDateString('pt-BR'));
    const [horaObito, setHoraObito] = useState('');
    const [tipo, setTipo] = useState('');
    const [veterinario, setVeterinario] = useState('');
    const [descricao, setDescricao] = useState('');
    const [destino, setDestino] = useState('');

    const TIPOS = ['Natural', 'Eutanásia', 'Acidente', 'Pós-cirúrgico', 'Desconhecido'];
    const DESTINOS = ['Cremação individual', 'Cremação coletiva', 'Sepultamento', 'A cargo do tutor', 'Outro'];

    const handleSave = async () => {
        if (!confirmado) { Alert.alert('Confirmação', 'Por favor, confirme o registro antes de salvar.'); return; }
        if (!causa.trim()) { Alert.alert('Atenção', 'Informe a causa do óbito.'); return; }
        setSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const details = { causa, dataObito, horaObito, tipo, veterinario, descricao, destino };
            const [{ error: histError }, { error: petError }] = await Promise.all([
                supabase.from('pet_admin_history').insert({
                    pet_id: petId, user_id: session?.user?.id,
                    module: 'obito', action: 'procedure',
                    title: `Óbito: ${causa}`,
                    details: JSON.stringify(details),
                    created_at: new Date().toISOString(),
                }),
                supabase.from('pets').update({ status: 'deceased' }).eq('id', petId)
            ]);
            if (histError) throw histError;
            if (petError) throw petError;
            await logPetAdminHistory({ petId, module: 'obito', action: 'create', title: `Óbito registrado: ${causa}`, details, sourceTable: 'pets', sourceId: petId });
            queryClient.invalidateQueries({ queryKey: ['pet-timeline', petId] });
            queryClient.invalidateQueries({ queryKey: ['pets'] });
            Alert.alert('Registro realizado', `O óbito de ${petName || 'o paciente'} foi registrado com respeito.`, [{ text: 'OK', onPress: () => router.back() }]);
        } catch (e: any) { Alert.alert('Erro', e.message); } finally { setSaving(false); }
    };

    const F = (p: any) => <Field {...p} theme={theme} />;

    return (
        <KeyboardAvoidingView style={[s.container, { backgroundColor: theme.background }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <Stack.Screen options={{ title: 'Registro de Óbito', headerStyle: { backgroundColor: theme.background }, headerShadowVisible: false, headerLeft: () => <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 12 }}><Ionicons name="chevron-back" size={26} color={theme.primary} /></TouchableOpacity> }} />
            <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
                {/* Banner de aviso */}
                <View style={[s.warningBanner, { backgroundColor: theme.surfaceElevated, borderColor: theme.border, borderWidth: 1 }]}>
                    <Ionicons name="skull-outline" size={28} color={theme.primary} />
                    <View style={{ marginLeft: 14, flex: 1 }}>
                        <Text style={[s.warningTitle, { color: theme.text }]}>Registro de Óbito</Text>
                        <Text style={[s.warningText, { color: theme.textSecondary }]}>Esta ação marcará o paciente como falecido. Preencha com cuidado.</Text>
                    </View>
                </View>

                <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={s.cardHeader}><Ionicons name="information-circle-outline" size={18} color={theme.primary} /><Text style={[s.cardTitle, { color: theme.text }]}>Dados do Óbito</Text></View>
                    <F label="Causa do Óbito *" value={causa} onChangeText={setCausa} placeholder="Ex: Insuficiência cardíaca, Trauma..." required />
                    <F label="Veterinário Responsável" value={veterinario} onChangeText={setVeterinario} placeholder="Nome do Vet" />
                    <View style={s.row}>
                        <F label="Data" value={dataObito} onChangeText={setDataObito} placeholder="DD/MM/AAAA" keyboardType="numeric" />
                        <F label="Hora" value={horaObito} onChangeText={setHoraObito} placeholder="HH:MM" keyboardType="numeric" />
                    </View>
                    <Text style={[s.subLabel, { color: theme.textSecondary }]}>Tipo de Óbito</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {TIPOS.map(t => (<TouchableOpacity key={t} style={[s.chip, { backgroundColor: theme.surfaceElevated }, tipo === t && { backgroundColor: theme.primary }]} onPress={() => setTipo(t === tipo ? '' : t)}><Text style={[s.chipText, { color: tipo === t ? 'white' : theme.textSecondary }]}>{t}</Text></TouchableOpacity>))}
                    </View>
                    <F label="Descrição / Histórico" value={descricao} onChangeText={setDescricao} placeholder="Contexto clínico, evolução que levou ao óbito..." multiline minHeight={100} />
                    <Text style={[s.subLabel, { color: theme.textSecondary }]}>Destino do Animal</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {DESTINOS.map(d => (<TouchableOpacity key={d} style={[s.chip, { backgroundColor: theme.surfaceElevated }, destino === d && { backgroundColor: theme.primary }]} onPress={() => setDestino(d === destino ? '' : d)}><Text style={[s.chipText, { color: destino === d ? 'white' : theme.textSecondary }]}>{d}</Text></TouchableOpacity>))}
                    </View>
                </View>

                {/* Confirmação */}
                <TouchableOpacity style={[s.confirmRow, { borderColor: confirmado ? theme.primary : theme.border, backgroundColor: confirmado ? theme.primary + '10' : theme.surface }]} onPress={() => setConfirmado(!confirmado)}>
                    <View style={[s.checkbox, { borderColor: confirmado ? theme.primary : theme.border, backgroundColor: confirmado ? theme.primary : 'transparent' }]}>
                        {confirmado && <Ionicons name="checkmark" size={14} color="white" />}
                    </View>
                    <Text style={[s.confirmText, { color: confirmado ? theme.text : theme.textSecondary }]}>
                        Confirmo o registro do óbito de <Text style={{ fontWeight: '800' }}>{petName || 'este paciente'}</Text>. Esta ação não pode ser desfeita.
                    </Text>
                </TouchableOpacity>
            </ScrollView>
            <View style={[s.footer, { backgroundColor: theme.surface, borderTopColor: theme.border, paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
                <TouchableOpacity style={[s.saveBtn, { backgroundColor: (confirmado && causa) ? theme.primary : theme.border }]} onPress={handleSave} disabled={saving || !confirmado || !causa}>
                    {saving ? <ActivityIndicator color="white" /> : <><Ionicons name="checkmark-circle" size={22} color={(confirmado && causa) ? 'white' : theme.textMuted} style={{ marginRight: 8 }} /><Text style={[s.saveBtnText, { color: (confirmado && causa) ? 'white' : theme.textMuted }]}>Registrar Óbito</Text></>}
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

const s = StyleSheet.create({
    container: { flex: 1 }, scroll: { padding: 16, gap: 16, paddingBottom: 40 },
    warningBanner: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, padding: 20 },
    warningTitle: { fontSize: 18, fontWeight: '800', color: 'white', marginBottom: 4 },
    warningText: { fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 18 },
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
    confirmRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderWidth: 1.5, borderRadius: 16, padding: 16 },
    checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
    confirmText: { flex: 1, fontSize: 14, lineHeight: 22 },
    footer: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth },
    saveBtn: { height: 46, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    saveBtnText: { fontSize: 16, fontWeight: '700' },
});
