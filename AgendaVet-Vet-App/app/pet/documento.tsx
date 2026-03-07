import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, useColorScheme, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { logPetAdminHistory } from '@/lib/services/petHistory';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/AuthProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DocumentoScreen() {
    const { petId } = useLocalSearchParams<{ petId: string }>();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
    const router = useRouter();
    const queryClient = useQueryClient();
    const { session } = useAuth();
    const insets = useSafeAreaInsets();
    const [saving, setSaving] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    const [titulo, setTitulo] = useState('');
    const [tipo, setTipo] = useState('');
    const [descricao, setDescricao] = useState('');
    const [veterinario, setVeterinario] = useState('');
    const [observacoes, setObservacoes] = useState('');

    // Busca dados do Pet e do Tutor para Auto-fill no descritivo (opcional) e logs
    const { data: petData } = useQuery({
        queryKey: ['pet-info', petId],
        queryFn: async () => {
            const { data, error } = await supabase.from('pets')
                .select('name, breed, type, profiles(full_name)')
                .eq('id', petId)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !!petId
    });

    // Auto preencher dados do Veterinário
    useEffect(() => {
        if (session?.user?.id) {
            supabase.from('profiles').select('full_name, crmv').eq('id', session.user.id).single()
                .then(({ data }) => {
                    if (data) setVeterinario(data.full_name || '');
                });
        }
    }, [session]);

    const TIPOS = [
        'Atestado de aplicação de vacina', 'Atestado de óbito', 'Atestado de saúde', 'Atestado de vacinação',
        'Atestado de vacinação resumido', 'Encaminhamento', 'Ficha Resumida', 'Guia de trânsito',
        'Receituário de Controle Especial', 'Relatório de Atendimento', 'Solicitação de Exame', 'Solicitação de Procedimento',
        'Termo de Autorização para Exames', 'Termo de Autorização para Internação e Tratamento Clínico ou Cirúrgico',
        'Termo de Autorização para Procedimento Cirúrgico', 'Termo de Autorização para Procedimento Terapêutico',
        'Termo de Autorização para Realização de Procedimentos Anestésicos', 'Termo de Ciência',
        'Termo de Consentimento para Realização de Eutanásia', 'Termo de doação de corpo de animal para fins de ensino e pesquisa'
    ];

    // Função para gerar o template base do documento
    const generateTemplateText = (docType: string) => {
        const pName = petData?.name || '[Nome do Pet]';
        const pBreed = petData?.breed || '[Raça]';

        // Supabase returns related profile(s) array or object depending on relation
        let tName = '[Nome do Tutor]';
        if (petData?.profiles) {
            tName = Array.isArray(petData.profiles)
                ? (petData.profiles[0]?.full_name || tName)
                : (petData.profiles as any).full_name || tName;
        }

        const date = new Date().toLocaleDateString('pt-BR');

        switch (docType) {
            case 'Atestado de saúde':
                return `Atesto para os devidos fins que o animal da espécie canina/felina, raça ${pBreed}, de nome ${pName}, de propriedade do(a) Sr(a). ${tName}, foi examinado(a) nesta data, encontrando-se clinicamente sadio(a), sem sinais de doenças infectocontagiosas e parasitozoonoses, estando apto(a) para [viagem/transporte/banho e tosa].`;
            case 'Atestado de vacinação':
                return `Atesto que o animal ${pName} (${pBreed}), propriedade de ${tName}, encontra-se com o protocolo vacinal atualizado até a presente data (${date}), tendo recebido as imunizações correspondentes à sua faixa etária.`;
            case 'Guia de trânsito':
                return `Certifico que o animal ${pName}, raça ${pBreed}, pertencente a ${tName}, foi examinado hoje e não apresenta indícios clínicos de doenças infectocontagiosas ou parasitárias, estando em condições sanitárias satisfatórias para trânsito/viagem.`;
            case 'Termo de Autorização para Internação e Tratamento Clínico ou Cirúrgico':
                return `Eu, ${tName}, autorizo o corpo clínico desta unidade a realizar os procedimentos de internamento, exames e tratamentos médicos veterinários necessários para o paciente ${pName}.\n\nDeclaro ter sido informado(a) sobre o estado clínico, os riscos inerentes aos procedimentos e a estimativa de custos iniciais.`;
            case 'Termo de Consentimento para Realização de Eutanásia':
                return `Eu, ${tName}, como responsável legal pelo animal ${pName}, após ampla discussão com o Médico Veterinário sobre o quadro clínico irreversível e em prol do bem-estar animal para alívio do sofrimento, AUTORIZO a realização do procedimento de eutanásia, isentando a equipe clínica de quaisquer responsabilidades futuras.`;
            default:
                return `[Insira aqui os detalhes ou parecer clínico referente ao documento: ${docType}]`;
        }
    };

    const toggleTipo = (t: string) => {
        const isSelected = tipo === t;
        setTipo(isSelected ? '' : t);
        setTitulo(isSelected ? '' : t);
        setDescricao(isSelected ? '' : generateTemplateText(t));
    };

    const handleSave = async () => {
        if (!titulo.trim()) { Alert.alert('Atenção', 'Informe o título do documento.'); return; }
        if (!tipo) { Alert.alert('Atenção', 'Selecione um tipo de documento.'); return; }
        setSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();

            // Determina se o documento requer assinatura do tutor (apenas Termos, Receitas não precisam de assinatura do tutor)
            const requiresSignature = tipo.startsWith('Termo de');
            const status = requiresSignature ? 'pending_signature' : 'finalized';

            const details = {
                titulo,
                tipo,
                descricao,
                veterinario,
                observacoes,
                status // Adicionado status para controle no app do Tutor
            };

            const { data, error } = await supabase.from('pet_admin_history').insert({
                pet_id: petId, user_id: session?.user?.id,
                module: 'documento', action: 'procedure',
                title: titulo,
                details: JSON.stringify(details),
                created_at: new Date().toISOString(),
            }).select().single();
            if (error) throw error;

            await logPetAdminHistory({
                petId,
                module: 'documento',
                action: 'create',
                title: `Documento: ${titulo}`,
                details,
                sourceTable: 'pet_admin_history',
                sourceId: data.id
            });

            queryClient.invalidateQueries({ queryKey: ['pet-timeline', petId] });
            Alert.alert(
                '✅ Sucesso',
                requiresSignature ? 'Documento criado e enviado para assinatura do tutor!' : 'Documento registrado com sucesso!',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (e: any) { Alert.alert('Erro', e.message); } finally { setSaving(false); }
    };

    return (
        <KeyboardAvoidingView style={[s.container, { backgroundColor: theme.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Stack.Screen options={{ title: 'Documento Clínico', headerStyle: { backgroundColor: theme.background }, headerShadowVisible: false, headerLeft: () => <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 12 }}><Ionicons name="chevron-back" size={26} color={theme.primary} /></TouchableOpacity> }} />
            <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
                <View style={[s.hero, { backgroundColor: theme.primary + '15' }]}>
                    <Ionicons name="documents-outline" size={32} color={theme.primary} />
                    <View style={{ marginLeft: 14 }}>
                        <Text style={[s.heroTitle, { color: theme.text }]}>Novo Documento</Text>
                        <Text style={[s.heroSub, { color: theme.textSecondary }]}>Passo 1: Escolha o modelo e preencha</Text>
                    </View>
                </View>

                {/* Section of 20 Model buttons via Dropdown Dialog */}
                <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border, padding: 12 }]}>
                    <View style={s.cardHeader}><Ionicons name="layers-outline" size={18} color={theme.primary} /><Text style={[s.cardTitle, { color: theme.text }]}>Modelos Padronizados</Text></View>
                    <Text style={[s.subLabel, { color: theme.textSecondary, marginBottom: 12 }]}>Selecione o documento que será preenchido</Text>

                    <TouchableOpacity
                        style={[s.dropdownBtn, { backgroundColor: theme.background, borderColor: theme.border }]}
                        activeOpacity={0.7}
                        onPress={() => setModalVisible(true)}
                    >
                        <View style={{ flex: 1 }}>
                            <Text style={[s.dropdownBtnText, { color: tipo ? theme.text : theme.textMuted }]}>
                                {tipo || 'Selecionar Modelo de Documento...'}
                            </Text>
                        </View>
                        <Ionicons name="chevron-down" size={20} color={theme.textMuted} />
                    </TouchableOpacity>
                </View>

                {/* Content form fields */}
                {tipo ? (
                    <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <View style={s.cardHeader}><Ionicons name="document-text-outline" size={18} color={theme.primary} /><Text style={[s.cardTitle, { color: theme.text }]}>Informações do Documento</Text></View>

                        <View style={s.fieldWrap}>
                            <Text style={[s.fieldLabel, { color: theme.textSecondary }]}>Título / Assunto *</Text>
                            <TextInput style={[s.fieldInput, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border, fontWeight: '700' }]}
                                value={titulo} onChangeText={setTitulo} placeholder="Ex: Atestado de saúde para viagem aérea"
                                placeholderTextColor={theme.textMuted} autoCapitalize="sentences" />
                        </View>
                        <View style={s.fieldWrap}>
                            <Text style={[s.fieldLabel, { color: theme.textSecondary }]}>Veterinário Emitente</Text>
                            <TextInput style={[s.fieldInput, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
                                value={veterinario} onChangeText={setVeterinario} placeholder="Nome completo do Vet (opcional)"
                                placeholderTextColor={theme.textMuted} autoCapitalize="words" />
                        </View>
                        <View style={s.fieldWrap}>
                            <Text style={[s.fieldLabel, { color: theme.textSecondary }]}>Conteúdo / Descrição *</Text>
                            <TextInput style={[s.fieldInput, s.multiline, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border, minHeight: 250 }]}
                                value={descricao} onChangeText={setDescricao}
                                placeholder={`Descreva aqui o texto completo do documento...\n\nO PDF final incluirá automaticamente o cabeçalho com seus dados, dados do tutor, e identificação do Pet.`}
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
                ) : null}
            </ScrollView>
            <View style={s.footer}>
                <TouchableOpacity style={[s.saveBtn, { backgroundColor: titulo ? theme.primary : theme.border }]} onPress={handleSave} disabled={saving || !titulo}>
                    {saving ? <ActivityIndicator color="white" /> : <><Ionicons name="checkmark-circle" size={22} color={titulo ? 'white' : theme.textMuted} style={{ marginRight: 8 }} /><Text style={[s.saveBtnText, { color: titulo ? 'white' : theme.textMuted }]}>Salvar Documento</Text></>}
                </TouchableOpacity>
            </View>

            {/* Dropdown Modal for 20 Documents */}
            <Modal visible={modalVisible} animationType="slide" transparent presentationStyle="overFullScreen">
                <View style={[s.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
                    <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setModalVisible(false)} />
                    <View style={[s.modalBox, { backgroundColor: theme.surface, paddingBottom: insets.bottom > 0 ? insets.bottom + 16 : 24 }]}>
                        <View style={s.modalHeaderStrip}>
                            <Text style={[s.heroTitle, { color: theme.text, fontSize: 18 }]}>Escolha o Modelo</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: 4 }}>
                                <Ionicons name="close" size={24} color={theme.textMuted} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={{ maxHeight: '80%' }} contentContainerStyle={[s.gridContainer, { paddingVertical: 16 }]} showsVerticalScrollIndicator={false}>
                            {TIPOS.map(t => (
                                <TouchableOpacity
                                    key={t}
                                    style={[s.gridBtn, { backgroundColor: tipo === t ? theme.primary : theme.surfaceElevated, borderColor: tipo === t ? theme.primary : theme.border }]}
                                    onPress={() => {
                                        toggleTipo(t);
                                        setModalVisible(false);
                                    }}
                                >
                                    <Text style={[s.gridBtnText, { color: tipo === t ? 'white' : theme.text }]} numberOfLines={3}>{t}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    gridBtn: { width: '48%', minHeight: 60, padding: 12, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    gridBtnText: { fontSize: 11, fontWeight: '700', textAlign: 'center', lineHeight: 14 },
    dropdownBtn: { height: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    dropdownBtnText: { fontSize: 14, fontWeight: '700' },
    fieldWrap: { flex: 1 },
    fieldLabel: { fontSize: 12, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
    fieldInput: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
    multiline: { paddingTop: 14 },
    footer: { padding: 16, paddingBottom: 32 },
    saveBtn: { height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    saveBtnText: { fontSize: 16, fontWeight: '800' },
    modalOverlay: { flex: 1, justifyContent: 'flex-end', margin: 0 },
    modalBox: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 24, paddingHorizontal: 20 },
    modalHeaderStrip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#ccc', paddingBottom: 16 },
});
