import React, { useState, useRef } from 'react';
import {
    View, Text, StyleSheet, useColorScheme, ScrollView, TouchableOpacity,
    ActivityIndicator, Alert, TextInput, Linking
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { logPetAdminHistory } from '@/lib/services/petHistory';
import { useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Video, Audio, ResizeMode } from 'expo-av';

// Cor de destaque padrão será injetada pelo tema

export default function GravacoesScreen() {
    const { petId } = useLocalSearchParams<{ petId: string }>();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
    const router = useRouter();
    const queryClient = useQueryClient();

    const [saving, setSaving] = useState(false);
    const [titulo, setTitulo] = useState('');
    const [tipo, setTipo] = useState('');
    const [link, setLink] = useState('');
    const [descricao, setDescricao] = useState('');
    const [veterinario, setVeterinario] = useState('');
    const [videoUri, setVideoUri] = useState<string | null>(null);
    const [uploadMode, setUploadMode] = useState<'record' | 'gallery' | 'link'>('record');
    const [uploading, setUploading] = useState(false);

    const TIPOS = ['Vídeo clínico', 'Ultrassom', 'Ecocardiograma', 'Endoscopia', 'Consulta gravada', 'Procedimento', 'Outro'];

    // ── Gravar vídeo com câmera ──────────────────────────────
    const handleRecord = async () => {
        const { status: camStatus } = await ImagePicker.requestCameraPermissionsAsync();
        const { status: micStatus } = await Audio.requestPermissionsAsync();
        if (camStatus !== 'granted' || micStatus !== 'granted') {
            Alert.alert('Permissão necessária', 'Precisamos acesso à câmera e ao microfone.');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            videoMaxDuration: 300, // 5 minutos
            quality: 0.7,
            allowsEditing: false,
        });
        if (!result.canceled && result.assets[0]) {
            setVideoUri(result.assets[0].uri);
            setUploadMode('record');
        }
    };

    // ── Selecionar da galeria ────────────────────────────────
    const handlePickVideo = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria.'); return; }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            quality: 0.7,
            allowsEditing: false,
        });
        if (!result.canceled && result.assets[0]) {
            setVideoUri(result.assets[0].uri);
            setUploadMode('gallery');
        }
    };

    // ── Upload para Supabase Storage ─────────────────────────
    const uploadVideoToStorage = async (uri: string): Promise<string> => {
        const ext = uri.split('.').pop() || 'mp4';
        const fileName = `pets/${petId}/videos/${Date.now()}.${ext}`;
        const response = await fetch(uri);
        const blob = await response.blob();
        const { error } = await supabase.storage.from('pet-media').upload(fileName, blob, { contentType: `video/${ext}` });
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('pet-media').getPublicUrl(fileName);
        return publicUrl;
    };

    // ── Salvar ───────────────────────────────────────────────
    const handleSave = async () => {
        if (!titulo.trim()) { Alert.alert('Atenção', 'Informe o título da gravação.'); return; }
        if (!videoUri && !link.trim()) { Alert.alert('Atenção', 'Adicione um vídeo gravado, da galeria, ou cole um link.'); return; }

        setSaving(true);
        setUploading(!!videoUri);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            let videoUrl = link.trim();

            // Se tem vídeo local, fazer upload
            if (videoUri) {
                videoUrl = await uploadVideoToStorage(videoUri);
            }
            setUploading(false);

            const details = { titulo, tipo, link: videoUrl, descricao, veterinario, hasVideo: !!videoUri };
            const { data, error } = await supabase.from('pet_admin_history').insert({
                pet_id: petId, user_id: session?.user?.id,
                module: 'video', action: 'procedure',
                title: `Gravação: ${titulo}`,
                details: JSON.stringify(details),
                created_at: new Date().toISOString(),
            }).select().single();
            if (error) throw error;

            await logPetAdminHistory({
                petId, module: 'video', action: 'create',
                title: `Gravação: ${titulo}`,
                details, sourceTable: 'pet_admin_history', sourceId: data.id
            });
            queryClient.invalidateQueries({ queryKey: ['pet-timeline', petId] });
            Alert.alert('✅ Sucesso', 'Gravação salva no prontuário!', [{ text: 'OK', onPress: () => router.back() }]);
        } catch (e: any) {
            setUploading(false);
            Alert.alert('Erro', e.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <Stack.Screen options={{
                title: 'Gravações', headerStyle: { backgroundColor: theme.background }, headerShadowVisible: false,
                headerLeft: () => <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 12 }}><Ionicons name="chevron-back" size={26} color={ACCENT} /></TouchableOpacity>
            }} />
            <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

                {/* Hero */}
                <View style={[s.hero, { backgroundColor: theme.primary + '15' }]}>
                    <Ionicons name="videocam-outline" size={32} color={theme.primary} />
                    <View style={{ marginLeft: 14 }}>
                        <Text style={[s.heroTitle, { color: theme.text }]}>Gravações Clínicas</Text>
                        <Text style={[s.heroSub, { color: theme.textSecondary }]}>Grave, importe ou cole um link</Text>
                    </View>
                </View>

                {/* Tabs de modo */}
                <View style={[s.modeRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    {([
                        { key: 'record', icon: 'videocam', label: 'Gravar' },
                        { key: 'gallery', icon: 'cloud-upload-outline', label: 'Galeria' },
                        { key: 'link', icon: 'link-outline', label: 'Link' },
                    ] as const).map(m => (
                        <TouchableOpacity key={m.key}
                            style={[s.modeBtn, uploadMode === m.key && { backgroundColor: theme.primary }]}
                            onPress={() => setUploadMode(m.key)}>
                            <Ionicons name={m.icon as any} size={18} color={uploadMode === m.key ? 'white' : theme.textSecondary} />
                            <Text style={[s.modeBtnText, { color: uploadMode === m.key ? 'white' : theme.textSecondary }]}>{m.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Área de vídeo */}
                <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={s.cardHeader}><Ionicons name="videocam-outline" size={18} color={theme.primary} /><Text style={[s.cardTitle, { color: theme.text }]}>Vídeo</Text></View>

                    {/* Prévia do vídeo */}
                    {videoUri ? (
                        <View style={s.videoPreviewWrap}>
                            <Video
                                source={{ uri: videoUri }}
                                style={s.videoPreview}
                                useNativeControls
                                resizeMode={ResizeMode.CONTAIN}
                                shouldPlay={false}
                            />
                            <TouchableOpacity style={[s.removeVideoBtn, { backgroundColor: '#EF444490' }]} onPress={() => setVideoUri(null)}>
                                <Ionicons name="close" size={18} color="white" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            {uploadMode === 'record' && (
                                <TouchableOpacity style={[s.bigActionBtn, { borderColor: theme.primary, backgroundColor: theme.primary + '10' }]} onPress={handleRecord}>
                                    <Ionicons name="videocam" size={36} color={theme.primary} />
                                    <Text style={[s.bigActionText, { color: theme.primary }]}>Gravar Vídeo</Text>
                                    <Text style={[s.bigActionSub, { color: theme.textMuted }]}>Máximo 5 minutos</Text>
                                </TouchableOpacity>
                            )}
                            {uploadMode === 'gallery' && (
                                <TouchableOpacity style={[s.bigActionBtn, { borderColor: theme.border }]} onPress={handlePickVideo}>
                                    <Ionicons name="folder-open-outline" size={36} color={theme.textSecondary} />
                                    <Text style={[s.bigActionText, { color: theme.textSecondary }]}>Selecionar da Galeria</Text>
                                    <Text style={[s.bigActionSub, { color: theme.textMuted }]}>MP4, MOV, AVI</Text>
                                </TouchableOpacity>
                            )}
                            {uploadMode === 'link' && (
                                <View style={s.fieldWrap}>
                                    <Text style={[s.fieldLabel, { color: theme.textSecondary }]}>URL do Vídeo *</Text>
                                    <TextInput
                                        style={[s.fieldInput, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
                                        value={link} onChangeText={setLink}
                                        placeholder="https://drive.google.com/..."
                                        placeholderTextColor={theme.textMuted} keyboardType="url"
                                        autoCapitalize="none" autoCorrect={false} />
                                    <Text style={[s.tipText, { color: theme.textMuted }]}>💡 Use Google Drive, YouTube (privado) ou Dropbox</Text>
                                </View>
                            )}
                        </>
                    )}
                </View>

                {/* Dados da gravação */}
                <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={s.cardHeader}><Ionicons name="document-text-outline" size={18} color="#6366F1" /><Text style={[s.cardTitle, { color: theme.text }]}>Informações</Text></View>

                    <View style={s.fieldWrap}>
                        <Text style={[s.fieldLabel, { color: theme.textSecondary }]}>Título *</Text>
                        <TextInput style={[s.fieldInput, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
                            value={titulo} onChangeText={setTitulo} placeholder="Ex: Ultrassom abdominal 04/03"
                            placeholderTextColor={theme.textMuted} autoCapitalize="sentences" />
                    </View>

                    <Text style={[s.subLabel, { color: theme.textSecondary }]}>Tipo de Gravação</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {TIPOS.map(t => (
                            <TouchableOpacity key={t} style={[s.chip, { backgroundColor: theme.surfaceElevated }, tipo === t && { backgroundColor: theme.primary }]} onPress={() => setTipo(t === tipo ? '' : t)}>
                                <Text style={[s.chipText, { color: tipo === t ? 'white' : theme.textSecondary }]}>{t}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={s.fieldWrap}>
                        <Text style={[s.fieldLabel, { color: theme.textSecondary }]}>Veterinário Responsável</Text>
                        <TextInput style={[s.fieldInput, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
                            value={veterinario} onChangeText={setVeterinario} placeholder="Nome do Vet"
                            placeholderTextColor={theme.textMuted} autoCapitalize="words" />
                    </View>

                    <View style={s.fieldWrap}>
                        <Text style={[s.fieldLabel, { color: theme.textSecondary }]}>Descrição / Achados</Text>
                        <TextInput
                            style={[s.fieldInput, s.multiline, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border, minHeight: 100 }]}
                            value={descricao} onChangeText={setDescricao}
                            placeholder="O que foi observado nesta gravação?"
                            placeholderTextColor={theme.textMuted} multiline scrollEnabled={false}
                            textAlignVertical="top" autoCapitalize="sentences" autoCorrect />
                    </View>
                </View>

                {/* Botão salvar */}
                <TouchableOpacity
                    style={[s.saveBtn, { backgroundColor: (titulo && (videoUri || link)) ? theme.primary : theme.border }]}
                    onPress={handleSave}
                    disabled={saving || (!videoUri && !link.trim()) || !titulo}>
                    {saving ? (
                        <View style={{ alignItems: 'center', gap: 6 }}>
                            <ActivityIndicator color="white" />
                            {uploading && <Text style={{ color: 'white', fontSize: 12 }}>Enviando vídeo... aguarde</Text>}
                        </View>
                    ) : (
                        <>
                            <Ionicons name="cloud-upload-outline" size={22} color={(titulo && (videoUri || link)) ? 'white' : theme.textMuted} style={{ marginRight: 8 }} />
                            <Text style={[s.saveBtnText, { color: (titulo && (videoUri || link)) ? 'white' : theme.textMuted }]}>
                                {videoUri ? 'Fazer Upload e Salvar' : 'Salvar Gravação'}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

            </ScrollView>
        </>
    );
}

const s = StyleSheet.create({
    scroll: { padding: 16, gap: 16, paddingBottom: 40 },
    hero: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, padding: 20 },
    heroTitle: { fontSize: 22, fontWeight: '800' }, heroSub: { fontSize: 13 },
    modeRow: { flexDirection: 'row', borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
    modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
    modeBtnText: { fontSize: 13, fontWeight: '700' },
    card: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 14, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#E5E7EB' },
    cardTitle: { fontSize: 15, fontWeight: '800' },
    bigActionBtn: { alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderStyle: 'dashed', borderRadius: 20, paddingVertical: 40, gap: 10 },
    bigActionText: { fontSize: 16, fontWeight: '800' },
    bigActionSub: { fontSize: 12 },
    videoPreviewWrap: { position: 'relative', borderRadius: 16, overflow: 'hidden', aspectRatio: 16 / 9, backgroundColor: '#000' },
    videoPreview: { width: '100%', height: '100%' },
    removeVideoBtn: { position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
    subLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F1F5F9' },
    chipText: { fontSize: 12, fontWeight: '600' },
    fieldWrap: { flex: 1 },
    fieldLabel: { fontSize: 12, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
    fieldInput: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
    multiline: { paddingTop: 14 },
    tipText: { fontSize: 11, marginTop: 6 },
    saveBtn: { height: 60, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    saveBtnText: { fontSize: 16, fontWeight: '800' },
});
