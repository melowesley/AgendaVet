import React, { useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { logPetAdminHistory } from '@/lib/services/petHistory';
import { useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';

// ACCENT removido para usar theme.primary

export default function FotosScreen() {
    const { petId } = useLocalSearchParams<{ petId: string }>();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
    const router = useRouter();
    const queryClient = useQueryClient();
    const [saving, setSaving] = useState(false);
    const [fotos, setFotos] = useState<string[]>([]);
    const [descricao, setDescricao] = useState('');

    const pickImages = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria.'); return; }
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsMultipleSelection: true, quality: 0.8 });
        if (!result.canceled) setFotos(prev => [...prev, ...result.assets.map(a => a.uri)]);
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permissão necessária', 'Precisamos de acesso à câmera.'); return; }
        const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
        if (!result.canceled) setFotos(prev => [...prev, result.assets[0].uri]);
    };

    const removePhoto = (index: number) => setFotos(prev => prev.filter((_, i) => i !== index));

    const handleSave = async () => {
        if (fotos.length === 0) { Alert.alert('Atenção', 'Adicione pelo menos uma foto.'); return; }
        setSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const uploadedUrls: string[] = [];

            for (const uri of fotos) {
                const ext = uri.split('.').pop() || 'jpg';
                const fileName = `pets/${petId}/fotos/${Date.now()}.${ext}`;
                const response = await fetch(uri);
                const blob = await response.blob();
                const { data: uploadData, error: uploadError } = await supabase.storage.from('pet-media').upload(fileName, blob, { contentType: `image/${ext}` });
                if (uploadError) throw uploadError;
                const { data: { publicUrl } } = supabase.storage.from('pet-media').getPublicUrl(fileName);
                uploadedUrls.push(publicUrl);
            }

            const details = { fotos: uploadedUrls, descricao, total: uploadedUrls.length };
            const { data, error } = await supabase.from('pet_admin_history').insert({
                pet_id: petId, user_id: session?.user?.id,
                module: 'fotos', action: 'procedure',
                title: `Fotos (${uploadedUrls.length} imagem${uploadedUrls.length > 1 ? 'ns' : ''})`,
                details: JSON.stringify(details),
                created_at: new Date().toISOString(),
            }).select().single();
            if (error) throw error;
            await logPetAdminHistory({ petId, module: 'fotos', action: 'create', title: `${uploadedUrls.length} foto(s) adicionada(s)`, details, sourceTable: 'pet_admin_history', sourceId: data.id });
            queryClient.invalidateQueries({ queryKey: ['pet-timeline', petId] });
            Alert.alert('✅ Sucesso', `${uploadedUrls.length} foto(s) salva(s)!`, [{ text: 'OK', onPress: () => router.back() }]);
        } catch (e: any) { Alert.alert('Erro', e.message); } finally { setSaving(false); }
    };

    return (
        <>
            <Stack.Screen options={{ title: 'Fotos', headerStyle: { backgroundColor: theme.background }, headerShadowVisible: false, headerLeft: () => <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 12 }}><Ionicons name="chevron-back" size={26} color={theme.primary} /></TouchableOpacity> }} />
            <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={s.scroll}>
                <View style={[s.hero, { backgroundColor: theme.primary + '15' }]}>
                    <Ionicons name="camera-outline" size={32} color={theme.primary} />
                    <View style={{ marginLeft: 14 }}><Text style={[s.heroTitle, { color: theme.text }]}>Registro Fotográfico</Text><Text style={[s.heroSub, { color: theme.textSecondary }]}>Documente o estado visual do paciente</Text></View>
                </View>

                {/* Botões de adicionar */}
                <View style={s.addRow}>
                    <TouchableOpacity style={[s.addBtn, { borderColor: theme.primary, flex: 1 }]} onPress={takePhoto}>
                        <Ionicons name="camera" size={22} color={theme.primary} />
                        <Text style={[s.addBtnText, { color: theme.primary }]}>Tirar Foto</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.addBtn, { borderColor: theme.border, flex: 1 }]} onPress={pickImages}>
                        <Ionicons name="images-outline" size={22} color={theme.textSecondary} />
                        <Text style={[s.addBtnText, { color: theme.textSecondary }]}>Galeria</Text>
                    </TouchableOpacity>
                </View>

                {/* Grid de fotos */}
                {fotos.length > 0 && (
                    <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <View style={s.cardHeader}><Ionicons name="images-outline" size={18} color={theme.primary} /><Text style={[s.cardTitle, { color: theme.text }]}>{fotos.length} foto(s) selecionada(s)</Text></View>
                        <View style={s.photoGrid}>
                            {fotos.map((uri, i) => (
                                <View key={i} style={s.photoWrap}>
                                    <Image source={{ uri }} style={s.photo} resizeMode="cover" />
                                    <TouchableOpacity style={s.photoRemove} onPress={() => removePhoto(i)}>
                                        <Ionicons name="close-circle" size={20} color="white" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {fotos.length === 0 && (
                    <View style={[s.emptyBox, { borderColor: theme.border }]}>
                        <Ionicons name="camera-outline" size={48} color={theme.textMuted} />
                        <Text style={{ color: theme.textMuted, marginTop: 12, fontSize: 14 }}>Nenhuma foto adicionada</Text>
                    </View>
                )}

                <TouchableOpacity style={[s.saveBtn, { backgroundColor: fotos.length > 0 ? theme.primary : theme.border }]} onPress={handleSave} disabled={saving || fotos.length === 0}>
                    {saving ? <ActivityIndicator color="white" /> : <><Ionicons name="cloud-upload-outline" size={22} color={fotos.length > 0 ? 'white' : theme.textMuted} style={{ marginRight: 8 }} /><Text style={[s.saveBtnText, { color: fotos.length > 0 ? 'white' : theme.textMuted }]}>Salvar {fotos.length > 0 ? `${fotos.length} foto(s)` : 'Fotos'}</Text></>}
                </TouchableOpacity>
            </ScrollView>
        </>
    );
}

const s = StyleSheet.create({
    scroll: { padding: 16, gap: 16, paddingBottom: 40 },
    hero: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, padding: 20 },
    heroTitle: { fontSize: 22, fontWeight: '800' }, heroSub: { fontSize: 13 },
    addRow: { flexDirection: 'row', gap: 12 },
    addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderRadius: 16, borderStyle: 'dashed', paddingVertical: 18 },
    addBtnText: { fontSize: 14, fontWeight: '700' },
    card: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 14, elevation: 2 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#E5E7EB' },
    cardTitle: { fontSize: 15, fontWeight: '800' },
    photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    photoWrap: { position: 'relative', borderRadius: 12, overflow: 'hidden' },
    photo: { width: 100, height: 100, borderRadius: 12 },
    photoRemove: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10 },
    emptyBox: { borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 20, alignItems: 'center', justifyContent: 'center', padding: 60 },
    saveBtn: { height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    saveBtnText: { fontSize: 16, fontWeight: '800' },
});
