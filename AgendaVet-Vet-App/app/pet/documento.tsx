import React, { useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { logPetAdminHistory } from '@/lib/services/petHistory';
import { useQueryClient } from '@tanstack/react-query';

// ACCENT removido para usar theme.primary

export default function DocumentoScreen() {
    const { petId } = useLocalSearchParams<{ petId: string }>();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
    const router = useRouter();
    const queryClient = useQueryClient();
    const [saving, setSaving] = useState(false);

    const [titulo, setTitulo] = useState('');
    const [tipo, setTipo] = useState('');
    const [descricao, setDescricao] = useState('');
    const [veterinario, setVeterinario] = useState('');
    const [observacoes, setObservacoes] = useState('');

    const TIPOS = ['Atestado', 'Laudo', 'Declaração', 'Encaminhamento', 'Autorização', 'Relatório', 'Outro'];

    const handleSave = async () => {
        if (!titulo.trim()) { Alert.alert('Atenção', 'Informe o título do documento.'); return; }
        setSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const details = { titulo, tipo, descricao, veterinario, observacoes };
            const { data, error } = await supabase.from('pet_admin_history').insert({
                pet_id: petId, user_id: session?.user?.id,
                module: 'documento', action: 'procedure',
                title: `${tipo ? tipo + ': ' : ''}${titulo}`,
                details: JSON.stringify(details),
                created_at: new Date().toISOString(),
            }).select().single();
            if (error) throw error;
            await logPetAdminHistory({ petId, module: 'documento', action: 'create', title: `Documento: ${titulo}`, details, sourceTable: 'pet_admin_history', sourceId: data.id });
            queryClient.invalidateQueries({ queryKey: ['pet-timeline', petId] });
            Alert.alert('✅ Sucesso', 'Documento registrado!', [{ text: 'OK', onPress: () => router.back() }]);
        } catch (e: any) { Alert.alert('Erro', e.message); } finally { setSaving(false); }
    };

    return (
        <KeyboardAvoidingView style={[s.container, { backgroundColor: theme.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Stack.Screen options={{ title: 'Documento', headerStyle: { backgroundColor: theme.background }, headerShadowVisible: false, headerLeft: () => <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 12 }}><Ionicons name="chevron-back" size={26} color={theme.primary} /></TouchableOpacity> }} />
            <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
                <View style={[s.hero, { backgroundColor: theme.primary + '15' }]}>
                    <Ionicons name="document-attach-outline" size={32} color={theme.primary} />
                    <View style={{ marginLeft: 14 }}><Text style={[s.heroTitle, { color: theme.text }]}>Documento Clínico</Text><Text style={[s.heroSub, { color: theme.textSecondary }]}>Atestados, laudos e encaminhamentos</Text></View>
                </View>

                <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={s.cardHeader}><Ionicons name="document-attach-outline" size={18} color={theme.primary} /><Text style={[s.cardTitle, { color: theme.text }]}>Informações do Documento</Text></View>

                    <Text style={[s.subLabel, { color: theme.textSecondary }]}>Tipo de Documento</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                        {TIPOS.map(t => (<TouchableOpacity key={t} style={[s.chip, { backgroundColor: theme.surfaceElevated }, tipo === t && { backgroundColor: theme.primary }]} onPress={() => setTipo(t === tipo ? '' : t)}><Text style={[s.chipText, { color: tipo === t ? 'white' : theme.textSecondary }]}>{t}</Text></TouchableOpacity>))}
                    </ScrollView>

                    <View style={s.fieldWrap}>
                        <Text style={[s.fieldLabel, { color: theme.textSecondary }]}>Título / Assunto *</Text>
                        <TextInput style={[s.fieldInput, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
                            value={titulo} onChangeText={setTitulo} placeholder="Ex: Atestado de saúde para viagem aérea"
                            placeholderTextColor={theme.textMuted} autoCapitalize="sentences" />
                    </View>
                    <View style={s.fieldWrap}>
                        <Text style={[s.fieldLabel, { color: theme.textSecondary }]}>Veterinário Emitente</Text>
                        <TextInput style={[s.fieldInput, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
                            value={veterinario} onChangeText={setVeterinario} placeholder="Nome do Vet"
                            placeholderTextColor={theme.textMuted} autoCapitalize="words" />
                    </View>
                    <View style={s.fieldWrap}>
                        <Text style={[s.fieldLabel, { color: theme.textSecondary }]}>Conteúdo / Descrição *</Text>
                        <TextInput style={[s.fieldInput, s.multiline, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border, minHeight: 200 }]}
                            value={descricao} onChangeText={setDescricao}
                            placeholder="Texto completo do documento ou resumo do conteúdo..."
                            placeholderTextColor={theme.textMuted} multiline scrollEnabled={false}
                            textAlignVertical="top" autoCapitalize="sentences" autoCorrect />
                    </View>
                    <View style={s.fieldWrap}>
                        <Text style={[s.fieldLabel, { color: theme.textSecondary }]}>Observações</Text>
                        <TextInput style={[s.fieldInput, s.multiline, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border, minHeight: 80 }]}
                            value={observacoes} onChangeText={setObservacoes}
                            placeholder="Número de vias, validade, destino..."
                            placeholderTextColor={theme.textMuted} multiline scrollEnabled={false}
                            textAlignVertical="top" autoCapitalize="sentences" autoCorrect />
                    </View>
                </View>
            </ScrollView>
            <View style={s.footer}>
                <TouchableOpacity style={[s.saveBtn, { backgroundColor: titulo ? theme.primary : theme.border }]} onPress={handleSave} disabled={saving || !titulo}>
                    {saving ? <ActivityIndicator color="white" /> : <><Ionicons name="checkmark-circle" size={22} color={titulo ? 'white' : theme.textMuted} style={{ marginRight: 8 }} /><Text style={[s.saveBtnText, { color: titulo ? 'white' : theme.textMuted }]}>Salvar Documento</Text></>}
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
