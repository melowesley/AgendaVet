import React, { useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { logPetAdminHistory } from '@/lib/services/petHistory';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAttendanceAutoFill } from '@/hooks/useAttendanceAutoFill';
import AutoFillHeader from '@/components/AutoFillHeader';
import { printAttendancePdf } from '@/utils/printPdf';

const InputField = ({ label, icon, value, onChangeText, placeholder, keyboardType = 'default', multiline = false, suffix, autoCapitalize = 'sentences', theme }: any) => (
    <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
        <View style={[
            styles.inputWrapper,
            { backgroundColor: theme.surface, borderColor: theme.border },
            multiline && styles.textAreaWrapper
        ]}>
            {icon && (
                <View style={styles.inputIcon}>
                    <Ionicons name={icon} size={20} color={theme.textMuted} />
                </View>
            )}
            <TextInput
                style={[
                    styles.input,
                    { color: theme.text },
                    multiline && styles.textArea,
                    icon && { paddingLeft: 8 }
                ]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={theme.textMuted}
                keyboardType={keyboardType}
                multiline={multiline}
                numberOfLines={multiline ? 5 : 1}
                textAlignVertical={multiline ? 'top' : 'center'}
                autoCapitalize={autoCapitalize}
            />
            {suffix && (
                <View style={styles.suffixContainer}>
                    <Text style={[styles.suffixText, { color: theme.textMuted }]}>{suffix}</Text>
                </View>
            )}
        </View>
    </View>
);

export default function ConsultaScreen() {
    const { petId, appointmentId } = useLocalSearchParams<{ petId: string, appointmentId?: string }>();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
    const router = useRouter();
    const queryClient = useQueryClient();
    const insets = useSafeAreaInsets();

    const [saving, setSaving] = useState(false);
    const [printing, setPrinting] = useState(false);
    const { vetProfile, petData, tutorData, loading: autoFillLoading, buildPdfData } = useAttendanceAutoFill(petId, appointmentId);
    const [form, setForm] = useState({
        queixa_principal: '',
        medicamentos: '',
        sistema_gastrintestinal: '',
        sistema_genitourinario: '',
        sistema_cardiorespiratorio: '',
        sistema_neurologico: '',
        sistema_musculoesqueletico: '',
        sistema_ototegumentar: '',
        alimentacao: '',
        vacinacao: '',
        ambiente: '',
        comportamento: '',
        vermifugo: '',
        ectoparasitas: '',
        mucosas: '',
        linfonodos: '',
        temperatura: '',
        peso: '',
        fc: '',
        fr: '',
        tpc: '',
        hidratacao: '',
        pulso: '',
        campos_pulmonares: '',
        bulhas_cardiacas: '',
        ritmo_cardiaco: '',
        palpacao_abdominal: '',
        anamnese_texto: '',
    });

    const handleSave = async () => {
        if (!form.queixa_principal) {
            Alert.alert('Erro', 'Por favor, informe a queixa principal.');
            return;
        }

        setSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();

            // 1. Salvar em anamnesis
            const { data: anamnesisData, error: anamnesisError } = await supabase.from('anamnesis').insert({
                pet_id: petId,
                user_id: session?.user?.id,
                appointment_request_id: appointmentId || null,
                queixa_principal: form.queixa_principal,
                medicamentos: form.medicamentos,
                sistema_gastrintestinal: form.sistema_gastrintestinal ? [form.sistema_gastrintestinal] : null,
                sistema_genitourinario: form.sistema_genitourinario ? [form.sistema_genitourinario] : null,
                sistema_cardiorespiratório: form.sistema_cardiorespiratorio ? [form.sistema_cardiorespiratorio] : null,
                sistema_neurologico: form.sistema_neurologico ? [form.sistema_neurologico] : null,
                sistema_musculoesqueletico: form.sistema_musculoesqueletico ? [form.sistema_musculoesqueletico] : null,
                sistema_ototegumentar: form.sistema_ototegumentar ? [form.sistema_ototegumentar] : null,
                alimentacao: form.alimentacao ? [form.alimentacao] : null,
                vacinacao: form.vacinacao ? [form.vacinacao] : null,
                ambiente: form.ambiente ? [form.ambiente] : null,
                comportamento: form.comportamento ? [form.comportamento] : null,
                vermifugo: form.vermifugo,
                mucosas: form.mucosas ? [form.mucosas] : null,
                linfonodos: form.linfonodos ? [form.linfonodos] : null,
                temperatura: form.temperatura,
                fc: form.fc,
                fr: form.fr,
                tpc: form.tpc,
                hidratacao: form.hidratacao,
                pulso: form.pulso,
                campos_pulmonares: form.campos_pulmonares,
                bulhas_cardiacas: form.bulhas_cardiacas,
                ritmo_cardiaco: form.ritmo_cardiaco,
                palpacao_abdominal: form.palpacao_abdominal,
            }).select().single();

            if (anamnesisError) throw anamnesisError;

            // 2. Registrar no histórico geral (Timeline)
            await logPetAdminHistory({
                petId: petId,
                module: 'consulta',
                action: 'procedure',
                title: 'Ficha de Consulta',
                details: {
                    queixa: form.queixa_principal,
                    temperatura: form.temperatura,
                    peso: form.peso,
                    anamnese: form.anamnese_texto
                },
                sourceTable: 'anamnesis',
                sourceId: anamnesisData.id
            });

            // 3. Se for vinculado a um agendamento, completar o agendamento
            if (appointmentId) {
                await supabase.from('appointment_requests')
                    .update({ status: 'completed' })
                    .eq('id', appointmentId);
            }

            // 4. Se informou peso, salvar registro de peso separado também
            if (form.peso) {
                await supabase.from('pet_weight_records').insert({
                    pet_id: petId,
                    weight: parseFloat(form.peso.replace(',', '.')),
                    date: new Date().toISOString().split('T')[0],
                    user_id: session?.user?.id
                });
            }

            queryClient.invalidateQueries({ queryKey: ['pet-timeline', petId] });
            queryClient.invalidateQueries({ queryKey: ['appointment-requests'] });

            Alert.alert('Sucesso', 'Consulta registrada com sucesso!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert('Erro', error.message || 'Falha ao salvar consulta');
        } finally {
            setSaving(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
        >
            <Stack.Screen options={{
                title: 'Nova Consulta',
                headerShadowVisible: false,
                headerStyle: { backgroundColor: theme.background },
            }} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                {/* Cabeçalho da página */}
                <View style={styles.pageHeader}>
                    <View style={[styles.iconBox, { backgroundColor: theme.primary + '15' }]}>
                        <Ionicons name="medkit" size={28} color={theme.primary} />
                    </View>
                    <View>
                        <Text style={[styles.pageTitle, { color: theme.text }]}>Ficha Clínica</Text>
                        <Text style={[styles.pageSubtitle, { color: theme.textSecondary }]}>Preencha os dados do atendimento</Text>
                    </View>
                </View>

                <AutoFillHeader vetProfile={vetProfile} petData={petData} tutorData={tutorData} loading={autoFillLoading} theme={theme} />

                {/* Seção Anamnese */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="chatbubbles-outline" size={20} color={theme.primary} />
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Motivo da Consulta e Histórico</Text>
                    </View>
                    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <InputField
                            label="Queixa Principal *"
                            icon="alert-circle-outline"
                            value={form.queixa_principal}
                            onChangeText={(t: string) => setForm(f => ({ ...f, queixa_principal: t }))}
                            placeholder="Motivo da consulta..."
                            theme={theme}
                        />
                        <InputField
                            label="Medicamentos em Uso"
                            icon="medical-outline"
                            value={form.medicamentos}
                            onChangeText={(t: string) => setForm(f => ({ ...f, medicamentos: t }))}
                            placeholder="Algum tratamento atual?"
                            theme={theme}
                        />
                        <InputField
                            label="Alimentação e Água"
                            value={form.alimentacao}
                            onChangeText={(t: string) => setForm(f => ({ ...f, alimentacao: t }))}
                            placeholder="Tipo de ração, apetite..."
                            theme={theme}
                        />
                        <InputField
                            label="Vacinação / Vermifugação"
                            value={form.vacinacao}
                            onChangeText={(t: string) => setForm(f => ({ ...f, vacinacao: t }))}
                            placeholder="Vacinas em dia? Última vermifugação..."
                            theme={theme}
                        />
                        <InputField
                            label="Ambiente e Comportamento"
                            value={form.ambiente}
                            onChangeText={(t: string) => setForm(f => ({ ...f, ambiente: t }))}
                            placeholder="Vive em casa/apt? Tem acesso à rua?"
                            theme={theme}
                        />
                        <InputField
                            label="Histórico Geral e Evolução"
                            value={form.anamnese_texto}
                            onChangeText={(t: string) => setForm(f => ({ ...f, anamnese_texto: t }))}
                            placeholder="Descreva detalhadamente o quadro evolutivo e observações do tutor..."
                            multiline
                            theme={theme}
                        />
                    </View>
                </View>

                {/* Seção Exame Físico Específico (Sistemas) */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="body-outline" size={20} color={theme.primary} />
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Exame Físico Sistêmico</Text>
                    </View>
                    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <InputField
                            label="Linfonodos"
                            value={form.linfonodos}
                            onChangeText={(t: string) => setForm(f => ({ ...f, linfonodos: t }))}
                            placeholder="Palpáveis, aumentados, reativos..."
                            theme={theme}
                        />
                        <InputField
                            label="Mucosas / TPC"
                            value={form.mucosas}
                            onChangeText={(t: string) => setForm(f => ({ ...f, mucosas: t }))}
                            placeholder="Normocoradas, TPC < 2 seg..."
                            theme={theme}
                        />
                        <InputField
                            label="Gastrintestinal"
                            value={form.sistema_gastrintestinal}
                            onChangeText={(t: string) => setForm(f => ({ ...f, sistema_gastrintestinal: t }))}
                            placeholder="Vômitos, diarreia, dor à palpação..."
                            theme={theme}
                        />
                        <InputField
                            label="Genitourinário"
                            value={form.sistema_genitourinario}
                            onChangeText={(t: string) => setForm(f => ({ ...f, sistema_genitourinario: t }))}
                            placeholder="Disúria, hematúria, secreções..."
                            theme={theme}
                        />
                        <InputField
                            label="Cardiorrespiratório"
                            value={form.sistema_cardiorespiratorio}
                            onChangeText={(t: string) => setForm(f => ({ ...f, sistema_cardiorespiratorio: t }))}
                            placeholder="Tosse, dispneia, sopro..."
                            theme={theme}
                        />
                        <InputField
                            label="Ototegumentar (Pele/Ouvidos)"
                            value={form.sistema_ototegumentar}
                            onChangeText={(t: string) => setForm(f => ({ ...f, sistema_ototegumentar: t }))}
                            placeholder="Alopecia, prurido, secreção otológica..."
                            theme={theme}
                        />
                        <InputField
                            label="Palpação Abdominal"
                            value={form.palpacao_abdominal}
                            onChangeText={(t: string) => setForm(f => ({ ...f, palpacao_abdominal: t }))}
                            placeholder="Sensibilidade, massas palpáveis..."
                            theme={theme}
                        />
                    </View>
                </View>

                {/* Seção Sinais Vitais */}
                <View style={[styles.sectionContainer, styles.lastSection]}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="pulse-outline" size={20} color={theme.error} />
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Exame Físico (Sinais Vitais)</Text>
                    </View>
                    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>

                        <View style={styles.row}>
                            <View style={styles.col}>
                                <InputField
                                    label="Temperatura"
                                    icon="thermometer-outline"
                                    value={form.temperatura}
                                    onChangeText={(t: string) => setForm(f => ({ ...f, temperatura: t.replace(',', '.') }))}
                                    placeholder="38.5"
                                    keyboardType="decimal-pad"
                                    suffix="°C"
                                    theme={theme}
                                />
                            </View>
                            <View style={styles.col}>
                                <InputField
                                    label="Peso"
                                    icon="scale-outline"
                                    value={form.peso}
                                    onChangeText={(t: string) => setForm(f => ({ ...f, peso: t.replace(',', '.') }))}
                                    placeholder="10.5"
                                    keyboardType="decimal-pad"
                                    suffix="kg"
                                    theme={theme}
                                />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={styles.col}>
                                <InputField
                                    label="Freq. Cardíaca"
                                    icon="heart-outline"
                                    value={form.fc}
                                    onChangeText={(t: string) => setForm(f => ({ ...f, fc: t }))}
                                    placeholder="120"
                                    keyboardType="numeric"
                                    suffix="bpm"
                                    theme={theme}
                                />
                            </View>
                            <View style={styles.col}>
                                <InputField
                                    label="Freq. Respiratória"
                                    icon="leaf-outline"
                                    value={form.fr}
                                    onChangeText={(t: string) => setForm(f => ({ ...f, fr: t }))}
                                    placeholder="24"
                                    keyboardType="numeric"
                                    suffix="mpm"
                                    theme={theme}
                                />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={styles.col}>
                                <InputField
                                    label="Hidratação"
                                    icon="water-outline"
                                    value={form.hidratacao}
                                    onChangeText={(t: string) => setForm(f => ({ ...f, hidratacao: t }))}
                                    placeholder="Adequada"
                                    theme={theme}
                                />
                            </View>
                            <View style={styles.col}>
                                <InputField
                                    label="Pulso"
                                    icon="pulse"
                                    value={form.pulso}
                                    onChangeText={(t: string) => setForm(f => ({ ...f, pulso: t }))}
                                    placeholder="Forte, regular..."
                                    theme={theme}
                                />
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>

            <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border, paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
                <TouchableOpacity
                    style={[styles.pdfBtn, { borderColor: theme.primary }]}
                    onPress={async () => {
                        setPrinting(true);
                        try { await printAttendancePdf(buildPdfData('consulta', form)); } finally { setPrinting(false); }
                    }}
                    disabled={printing}
                >
                    {printing ? <ActivityIndicator color={theme.primary} size="small" /> : (
                        <>
                            <Ionicons name="document-text-outline" size={20} color={theme.primary} />
                            <Text style={[styles.pdfBtnText, { color: theme.primary }]}>PDF</Text>
                        </>
                    )}
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.mainSaveBtn, { backgroundColor: form.queixa_principal ? theme.primary : theme.border, flex: 1 }]}
                    onPress={handleSave}
                    disabled={saving || !form.queixa_principal}
                >
                    {saving ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle" size={22} color={form.queixa_principal ? "white" : theme.textMuted} style={{ marginRight: 8 }} />
                            <Text style={[styles.mainSaveBtnText, { color: form.queixa_principal ? "white" : theme.textMuted }]}>
                                Finalizar e Salvar
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 40 },
    pageHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
    iconBox: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    pageTitle: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
    pageSubtitle: { fontSize: 13, fontWeight: '600' },
    sectionContainer: { marginBottom: 24 },
    lastSection: { marginBottom: 0 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, paddingLeft: 4 },
    sectionTitle: { fontSize: 16, fontWeight: '800' },
    card: {
        borderRadius: 24, borderWidth: 1, padding: 16, gap: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    inputContainer: { width: '100%' },
    label: { fontSize: 13, fontWeight: '700', marginBottom: 8, marginLeft: 4 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
    textAreaWrapper: { alignItems: 'flex-start', paddingVertical: 12 },
    inputIcon: { paddingLeft: 14, paddingRight: 6 },
    input: { flex: 1, height: 52, paddingHorizontal: 14, fontSize: 15 },
    textArea: { height: 100, paddingHorizontal: 14, paddingTop: 0 },
    suffixContainer: { paddingHorizontal: 14, justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: 'rgba(150,150,150,0.2)', height: '100%' },
    suffixText: { fontSize: 13, fontWeight: '700' },
    row: { flexDirection: 'row', gap: 12 },
    col: { flex: 1 },
    footer: {
        padding: 20, paddingBottom: 34, borderTopWidth: StyleSheet.hairlineWidth, borderTopLeftRadius: 32, borderTopRightRadius: 32,
        flexDirection: 'row', gap: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 10,
    },
    pdfBtn: { height: 46, borderRadius: 14, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, gap: 6 },
    pdfBtnText: { fontSize: 14, fontWeight: '700' },
    mainSaveBtn: { height: 46, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    mainSaveBtnText: { fontSize: 16, fontWeight: '700' },
});
