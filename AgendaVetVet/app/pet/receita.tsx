import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, useColorScheme, ScrollView, TextInput,
    TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Modal, Dimensions
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { logPetAdminHistory } from '@/lib/services/petHistory';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { gerarECompartilharPDF } from '@/lib/pdf/pdfService';
import { getReceitaHtml } from '@/lib/pdf/templates';
import { WebView } from 'react-native-webview';
import { useAttendanceAutoFill } from '@/hooks/useAttendanceAutoFill';
import AutoFillHeader from '@/components/AutoFillHeader';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ══════════════════════════════════════════════════
// Componentes definidos FORA do pai (evitar bug teclado)
// ══════════════════════════════════════════════════

interface FieldProps {
    label: string; value: string;
    onChangeText: (t: string) => void;
    placeholder?: string; keyboardType?: any;
    multiline?: boolean; minHeight?: number;
    theme: any; required?: boolean;
}

const Field = ({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline = false, minHeight = 52, theme, required = false }: FieldProps) => (
    <View style={fStyles.wrapper}>
        <Text style={[fStyles.label, { color: theme.textSecondary }]}>{label}{required ? ' *' : ''}</Text>
        <TextInput
            style={[fStyles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border, minHeight }, multiline && fStyles.multiline]}
            value={value} onChangeText={onChangeText}
            placeholder={placeholder} placeholderTextColor={theme.textMuted}
            keyboardType={keyboardType} multiline={multiline}
            numberOfLines={multiline ? 6 : 1}
            textAlignVertical={multiline ? 'top' : 'center'}
            autoCapitalize="sentences" autoCorrect scrollEnabled={false}
        />
    </View>
);

const fStyles = StyleSheet.create({
    wrapper: { marginBottom: 16 },
    label: { fontSize: 12, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, lineHeight: 22 },
    multiline: { paddingTop: 14 },
});

function SectionHeader({ icon, title, color, theme }: { icon: any; title: string; color: string; theme: any }) {
    return (
        <View style={sh.row}>
            <Ionicons name={icon} size={18} color={color} />
            <Text style={[sh.title, { color: theme.text }]}>{title}</Text>
        </View>
    );
}
const sh = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth },
    title: { fontSize: 15, fontWeight: '800', flex: 1 },
});

// ══════════════════════════════════════════════════
// TELA PRINCIPAL
// ══════════════════════════════════════════════════

export default function ReceitaScreen() {
    const { petId, petName } = useLocalSearchParams<{ petId: string; petName: string }>();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
    const router = useRouter();
    const queryClient = useQueryClient();
    const insets = useSafeAreaInsets();

    const [tipoReceita, setTipoReceita] = useState<'simples' | 'controle'>('simples');
    const [saving, setSaving] = useState(false);
    const [previewHtml, setPreviewHtml] = useState<string | null>(null);
    const { vetProfile, petData: autoFillPet, tutorData, loading: autoFillLoading } = useAttendanceAutoFill(petId);

    // Campos do formulário
    const [titulo, setTitulo] = useState('');
    const [prescricao, setPrescricao] = useState('');
    const [dataReceita, setDataReceita] = useState(new Date().toLocaleDateString('pt-BR'));
    const [veterinario, setVeterinario] = useState('');
    const [crmv, setCrmv] = useState('');
    const [vetPhone, setVetPhone] = useState('');
    const [vetAddress, setVetAddress] = useState('');
    const [vetCity, setVetCity] = useState('');
    const [vetUF, setVetUF] = useState('');
    const [ownerNameManual, setOwnerNameManual] = useState('');
    const [ownerAddress, setOwnerAddress] = useState('');

    useEffect(() => {
        if (vetProfile) {
            if (!veterinario) setVeterinario(vetProfile.full_name || '');
            if (!crmv && vetProfile.crmv) setCrmv(vetProfile.crmv);
            if (!vetPhone && vetProfile.phone) setVetPhone(vetProfile.phone);
        }
    }, [vetProfile]);

    const { data: pet } = useQuery({
        queryKey: ['pet', petId],
        queryFn: async () => {
            const { data } = await supabase.from('pets').select('*').eq('id', petId).single();
            return data;
        },
        enabled: !!petId
    });

    const { data: owner } = useQuery({
        queryKey: ['owner', pet?.user_id],
        queryFn: async () => {
            const { data } = await supabase.from('profiles').select('*').eq('user_id', pet?.user_id).single();
            return data;
        },
        enabled: !!pet?.user_id
    });

    const accentColor = tipoReceita === 'simples' ? theme.primary : theme.error;

    const buildPdfData = () => ({
        dateOfIssue: dataReceita,
        veterinarian: veterinario,
        crmv,
        vetPhone,
        vetAddress,
        vetCity,
        vetUF,
        ownerName: ownerNameManual || owner?.full_name,
        ownerAddress: ownerAddress || owner?.address,
        ownerPhone: owner?.phone,
        petName: petName || pet?.name,
        petSpecies: pet?.type === 'cat' ? 'Felino' : 'Canino',
        petBreed: pet?.breed || 'SRD',
        petAge: pet?.age || 'N/I',
        petGender: pet?.gender,
        prescriptionText: prescricao
    });

    const handlePreview = () => {
        if (!prescricao.trim()) {
            Alert.alert('Atenção', 'Preencha a prescrição antes de visualizar.');
            return;
        }
        const html = getReceitaHtml(buildPdfData(), tipoReceita);
        setPreviewHtml(html);
    };

    const handleSaveAndPrint = async () => {
        if (!titulo) { Alert.alert('Atenção', 'Informe o título / diagnóstico.'); return; }
        if (!prescricao.trim()) { Alert.alert('Atenção', 'O campo de Prescrição não pode estar vazio.'); return; }
        if (tipoReceita === 'controle' && (!veterinario || !crmv || !vetAddress || !vetPhone)) {
            Alert.alert('Atenção', 'Para Controle Especial, preencha todos os dados do emitente.'); return;
        }

        setSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();

            const extraNotes = JSON.stringify({
                __type: tipoReceita, veterinarian: veterinario, crmv,
                vetAddress, vetPhone, vetCity, vetUF,
                ownerName: ownerNameManual || owner?.full_name,
                ownerAddress, prescription: prescricao, dataReceita,
            });

            const { data: prescriptionData, error } = await supabase.from('pet_prescriptions').insert({
                pet_id: petId, user_id: session?.user?.id,
                medication_name: titulo,
                prescription_date: new Date().toISOString().split('T')[0],
                veterinarian: veterinario || null,
                notes: extraNotes,
            }).select().single();

            if (error) throw error;

            await logPetAdminHistory({
                petId,
                module: 'receita',
                action: 'create',
                title: `${tipoReceita === 'controle' ? '[Controle Especial]' : '[Simples]'} ${titulo}`,
                details: { veterinario: veterinario || 'Não informado', tipo: tipoReceita },
                sourceTable: 'pet_prescriptions',
                sourceId: prescriptionData.id
            });

            queryClient.invalidateQueries({ queryKey: ['pet-timeline', petId] });

            await gerarECompartilharPDF(buildPdfData(), tipoReceita);

            Alert.alert('Sucesso ✅', 'Receita salva e PDF gerado!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert('Erro', error.message || 'Falha ao salvar receita');
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <KeyboardAvoidingView
                style={[s.container, { backgroundColor: theme.background }]}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 96 : 0}
            >
                <Stack.Screen options={{
                    title: 'Nova Receita',
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: theme.background },
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 12 }}>
                            <Ionicons name="chevron-back" size={26} color={accentColor} />
                        </TouchableOpacity>
                    )
                }} />

                <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

                    {/* TOGGLE */}
                    <View style={[s.toggleRow, { borderColor: theme.border }]}>
                        {(['simples', 'controle'] as const).map(tipo => {
                            const active = tipoReceita === tipo;
                            const color = tipo === 'simples' ? theme.primary : theme.error;
                            return (
                                <TouchableOpacity key={tipo} style={[s.toggleBtn, active && { backgroundColor: color }]}
                                    onPress={() => setTipoReceita(tipo)} activeOpacity={0.8}>
                                    <Ionicons name={tipo === 'simples' ? 'document-text' : 'shield-checkmark'} size={18}
                                        color={active ? '#fff' : theme.textSecondary} />
                                    <Text style={[s.toggleLabel, { color: active ? '#fff' : theme.textSecondary }]}>
                                        {tipo === 'simples' ? 'Simples' : 'Controle Especial'}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <AutoFillHeader vetProfile={vetProfile} petData={autoFillPet} tutorData={tutorData} loading={autoFillLoading} theme={theme} />

                    {/* DADOS DO EMITENTE */}
                    <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <SectionHeader icon="person-circle-outline" title="Identificação do Emitente" color={accentColor} theme={theme} />
                        <View style={s.row}>
                            <View style={s.col}><Field label="Veterinário" value={veterinario} onChangeText={setVeterinario} placeholder="Nome do Vet" theme={theme} required={tipoReceita === 'controle'} /></View>
                            <View style={s.col}><Field label="CRMV/UF" value={crmv} onChangeText={setCrmv} placeholder="1234/SP" theme={theme} required={tipoReceita === 'controle'} /></View>
                        </View>
                        {tipoReceita === 'controle' && (<>
                            <Field label="Telefone" value={vetPhone} onChangeText={setVetPhone} placeholder="(00) 00000-0000" keyboardType="phone-pad" theme={theme} required />
                            <Field label="Endereço Profissional" value={vetAddress} onChangeText={setVetAddress} placeholder="Rua, N°, Bairro" theme={theme} required />
                            <View style={s.row}>
                                <View style={{ flex: 2 }}><Field label="Cidade" value={vetCity} onChangeText={setVetCity} placeholder="Cidade" theme={theme} /></View>
                                <View style={{ flex: 1 }}><Field label="UF" value={vetUF} onChangeText={setVetUF} placeholder="SP" theme={theme} /></View>
                            </View>
                        </>)}
                    </View>

                    {/* DADOS DO TUTOR (apenas Controle) */}
                    {tipoReceita === 'controle' && (
                        <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <SectionHeader icon="paw-outline" title="Dados do Tutor" color={accentColor} theme={theme} />
                            <Field label="Nome do Tutor" value={ownerNameManual} onChangeText={setOwnerNameManual}
                                placeholder={owner?.full_name || 'Nome do proprietário'} theme={theme} />
                            <Field label="Endereço do Tutor" value={ownerAddress} onChangeText={setOwnerAddress}
                                placeholder="Rua, N°, Bairro, Cidade/UF" theme={theme} />
                        </View>
                    )}

                    {/* PRESCRIÇÃO */}
                    <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <SectionHeader icon="medical-outline" title="Prescrição" color={accentColor} theme={theme} />
                        <Field label="Título / Diagnóstico" value={titulo} onChangeText={setTitulo}
                            placeholder="Ex: Tratamento Otite Bilateral" theme={theme} required />
                        <View style={fStyles.wrapper}>
                            <Text style={[fStyles.label, { color: theme.textSecondary }]}>Prescrição *</Text>
                            <TextInput
                                style={[fStyles.input, { color: theme.text, backgroundColor: theme.background, borderColor: accentColor + '60', minHeight: 200, paddingTop: 14 }, fStyles.multiline]}
                                value={prescricao} onChangeText={setPrescricao}
                                placeholder={'Descreva o(s) medicamento(s), dosagem, posologia e instruções...\n\nEx:\n1. Amoxicilina 250mg — 1 comprimido, 12/12h por 7 dias\n\n2. Dipirona Gotas — 20 gotas em caso de febre'}
                                placeholderTextColor={theme.textMuted}
                                multiline scrollEnabled={false} textAlignVertical="top"
                                autoCapitalize="sentences" autoCorrect
                            />
                        </View>
                        <Field label="Data da Receita" value={dataReceita} onChangeText={setDataReceita}
                            placeholder="DD/MM/AAAA" keyboardType="numeric" theme={theme} required />
                    </View>
                </ScrollView>

                {/* FOOTER com Prévia e Salvar */}
                <View style={[s.footer, { backgroundColor: theme.surface, borderTopColor: theme.border, paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
                    <TouchableOpacity style={[s.previewBtn, { borderColor: accentColor }]} onPress={handlePreview} activeOpacity={0.8}>
                        <Ionicons name="eye-outline" size={20} color={accentColor} />
                        <Text style={[s.previewBtnText, { color: accentColor }]}>Pré-visualizar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[s.saveBtn, { backgroundColor: (titulo && prescricao) ? accentColor : theme.border, flex: 1 }]}
                        onPress={handleSaveAndPrint}
                        disabled={saving || !titulo || !prescricao} activeOpacity={0.85}
                    >
                        {saving ? <ActivityIndicator color="white" /> : (
                            <>
                                <Ionicons name="document-attach" size={22}
                                    color={(titulo && prescricao) ? 'white' : theme.textMuted} style={{ marginRight: 6 }} />
                                <Text style={[s.saveBtnText, { color: (titulo && prescricao) ? 'white' : theme.textMuted }]}>Salvar e Gerar PDF</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* MODAL DE PRÉ-VISUALIZAÇÃO */}
            <Modal visible={!!previewHtml} animationType="slide" presentationStyle="overFullScreen">
                <View style={[s.previewModal, { backgroundColor: theme.background }]}>
                    <View style={[s.previewHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border, paddingTop: insets.top || 16 }]}>
                        <Text style={[s.previewTitle, { color: theme.text }]}>Pré-visualização</Text>
                        <TouchableOpacity onPress={() => setPreviewHtml(null)} style={s.closeBtn}>
                            <Ionicons name="close" size={24} color={theme.text} />
                        </TouchableOpacity>
                    </View>
                    {previewHtml && (
                        <View style={{ flex: 1, backgroundColor: '#fff' }}>
                            <WebView
                                source={{ html: previewHtml }}
                                style={{ flex: 1 }}
                                scalesPageToFit={true}
                                showsVerticalScrollIndicator={false}
                            />
                        </View>
                    )}
                    <View style={[s.previewFooter, { backgroundColor: theme.surface, borderTopColor: theme.border, paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
                        <TouchableOpacity style={[s.modalSaveBtn, { backgroundColor: accentColor }]}
                            onPress={() => { setPreviewHtml(null); handleSaveAndPrint(); }}>
                            <Ionicons name="download" size={22} color="white" style={{ marginRight: 8 }} />
                            <Text style={[s.saveBtnText, { color: 'white' }]}>Salvar e Imprimir</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: 16, paddingBottom: 40, gap: 16 },
    toggleRow: { flexDirection: 'row', borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
    toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 13, gap: 7 },
    toggleLabel: { fontSize: 13, fontWeight: '700' },
    card: { borderRadius: 20, borderWidth: 1, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
    row: { flexDirection: 'row', gap: 12 },
    col: { flex: 1 },
    footer: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 10 },
    previewBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, gap: 6 },
    previewBtnText: { fontSize: 14, fontWeight: '700' },
    saveBtn: { height: 46, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    modalSaveBtn: { height: 46, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    saveBtnText: { fontSize: 16, fontWeight: '700' },
    // Preview Modal
    previewModal: { flex: 1 },
    previewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
    previewTitle: { fontSize: 17, fontWeight: '800' },
    closeBtn: { padding: 4 },
    previewFooter: { padding: 16, borderTopWidth: 1 },
});
