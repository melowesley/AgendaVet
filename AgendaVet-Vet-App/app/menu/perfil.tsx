import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, useColorScheme, ScrollView, TextInput,
    TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function Field({ label, value, onChangeText, placeholder, keyboardType = 'default', editable = true, theme, required }: any) {
    return (
        <View style={s.fieldWrap}>
            <Text style={[s.fieldLabel, { color: theme.textSecondary }]}>{label}{required ? ' *' : ''}</Text>
            <TextInput
                style={[s.fieldInput, { color: editable ? theme.text : theme.textMuted, backgroundColor: editable ? theme.background : theme.surfaceElevated, borderColor: theme.border }]}
                value={value} onChangeText={onChangeText} placeholder={placeholder}
                placeholderTextColor={theme.textMuted} keyboardType={keyboardType}
                editable={editable} autoCapitalize="words" autoCorrect={false}
            />
        </View>
    );
}

export default function PerfilEditScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
    const router = useRouter();
    const { session } = useAuth();
    const insets = useSafeAreaInsets();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [fullName, setFullName] = useState('');
    const [crmv, setCrmv] = useState('');
    const [specialty, setSpecialty] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');

    useEffect(() => {
        const load = async () => {
            if (!session?.user?.id) return;
            const { data } = await supabase
                .from('profiles')
                .select('full_name, crmv, specialty, phone, address')
                .eq('user_id', session.user.id)
                .single();
            if (data) {
                setFullName(data.full_name || '');
                setCrmv(data.crmv || '');
                setSpecialty(data.specialty || '');
                setPhone(data.phone || '');
                setAddress(data.address || '');
            }
            setLoading(false);
        };
        load();
    }, [session?.user?.id]);

    const handleSave = async () => {
        if (!fullName.trim()) {
            Alert.alert('Atenção', 'O nome completo é obrigatório.');
            return;
        }
        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName.trim(),
                    crmv: crmv.trim() || null,
                    specialty: specialty.trim() || null,
                    phone: phone.trim() || null,
                    address: address.trim() || null,
                })
                .eq('user_id', session?.user?.id);
            if (error) throw error;
            Alert.alert('Sucesso', 'Perfil atualizado! Os dados serão usados automaticamente nos formulários e PDFs.', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (e: any) {
            Alert.alert('Erro', e.message || 'Falha ao salvar perfil.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={[s.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Stack.Screen options={{ title: 'Meu Perfil', headerStyle: { backgroundColor: theme.background }, headerShadowVisible: false }} />
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView style={[s.container, { backgroundColor: theme.background }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <Stack.Screen options={{
                title: 'Meu Perfil',
                headerStyle: { backgroundColor: theme.background },
                headerShadowVisible: false,
                headerLeft: () => (
                    <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 12 }}>
                        <Ionicons name="chevron-back" size={26} color={theme.primary} />
                    </TouchableOpacity>
                )
            }} />

            <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
                <View style={[s.hero, { backgroundColor: theme.primary + '15' }]}>
                    <View style={[s.avatarBox, { backgroundColor: theme.primary + '25' }]}>
                        <Ionicons name="person" size={40} color={theme.primary} />
                    </View>
                    <View style={{ marginLeft: 16, flex: 1 }}>
                        <Text style={[s.heroTitle, { color: theme.text }]}>Dados Profissionais</Text>
                        <Text style={[s.heroSub, { color: theme.textSecondary }]}>Esses dados aparecem automaticamente nos formulários e PDFs</Text>
                    </View>
                </View>

                <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={s.cardHeader}>
                        <Ionicons name="id-card-outline" size={18} color={theme.primary} />
                        <Text style={[s.cardTitle, { color: theme.text }]}>Identificação</Text>
                    </View>
                    <Field label="Email" value={session?.user?.email || ''} editable={false} theme={theme} />
                    <Field label="Nome Completo" value={fullName} onChangeText={setFullName} placeholder="Dr(a). Nome Sobrenome" theme={theme} required />
                    <View style={s.row}>
                        <Field label="CRMV" value={crmv} onChangeText={setCrmv} placeholder="12345-SP" theme={theme} />
                        <Field label="Especialidade" value={specialty} onChangeText={setSpecialty} placeholder="Clínico Geral" theme={theme} />
                    </View>
                </View>

                <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={s.cardHeader}>
                        <Ionicons name="call-outline" size={18} color={theme.primary} />
                        <Text style={[s.cardTitle, { color: theme.text }]}>Contato</Text>
                    </View>
                    <Field label="Telefone" value={phone} onChangeText={setPhone} placeholder="(00) 00000-0000" keyboardType="phone-pad" theme={theme} />
                    <Field label="Endereço" value={address} onChangeText={setAddress} placeholder="Rua, N°, Bairro, Cidade/UF" theme={theme} />
                </View>
            </ScrollView>

            <View style={[s.footer, { backgroundColor: theme.surface, borderTopColor: theme.border, paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
                <TouchableOpacity
                    style={[s.saveBtn, { backgroundColor: fullName.trim() ? theme.primary : theme.border }]}
                    onPress={handleSave}
                    disabled={saving || !fullName.trim()}
                >
                    {saving ? <ActivityIndicator color="white" /> : (
                        <>
                            <Ionicons name="checkmark-circle" size={22} color={fullName.trim() ? 'white' : theme.textMuted} style={{ marginRight: 8 }} />
                            <Text style={[s.saveBtnText, { color: fullName.trim() ? 'white' : theme.textMuted }]}>Salvar Perfil</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: 16, gap: 16, paddingBottom: 40 },
    hero: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, padding: 20 },
    avatarBox: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
    heroTitle: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
    heroSub: { fontSize: 13 },
    card: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 14, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#E5E7EB' },
    cardTitle: { fontSize: 15, fontWeight: '800' },
    row: { flexDirection: 'row', gap: 12 },
    fieldWrap: { flex: 1 },
    fieldLabel: { fontSize: 12, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
    fieldInput: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
    footer: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth },
    saveBtn: { height: 46, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    saveBtnText: { fontSize: 16, fontWeight: '700' },
});
