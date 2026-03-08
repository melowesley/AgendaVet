import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { Pet } from '@/hooks/usePets';

interface AddPatientModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (pet: Partial<Pet>) => Promise<{ data: any; error: string | null }>;
}

export function AddPatientModal({ visible, onClose, onSave }: AddPatientModalProps) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        name: '',
        type: 'dog',
        breed: '',
        age: '',
        weight: '',
        color: '',
        sex: '',
        notes: '',
        tutor_name: '',
        tutor_phone: '',
        tutor_email: '',
    });

    const update = (field: string, value: string) =>
        setForm(prev => ({ ...prev, [field]: value }));

    const handleSave = async () => {
        if (!form.name.trim() || !form.tutor_name.trim()) {
            Alert.alert('Campos obrigatórios', 'Por favor, preencha o nome do paciente e do tutor.');
            return;
        }

        setLoading(true);
        try {
            const tutorInfo = [
                form.tutor_name ? `Tutor: ${form.tutor_name}` : null,
                form.tutor_phone ? `Tel: ${form.tutor_phone}` : null,
                form.tutor_email ? `Email: ${form.tutor_email}` : null,
            ].filter(Boolean).join('\n');

            const payload: Partial<Pet> = {
                name: form.name.trim(),
                type: form.type,
                breed: form.breed.trim() || null,
                age: form.age.trim() || null,
                weight: form.weight.trim() || null,
                notes: [
                    form.notes.trim(),
                    form.color ? `Cor: ${form.color}` : null,
                    form.sex ? `Sexo: ${form.sex === 'M' ? 'Macho' : 'Fêmea'}` : null,
                    tutorInfo,
                ].filter(Boolean).join('\n') || null,
            };

            const { error } = await onSave(payload);
            if (error) throw new Error(error);

            Alert.alert('Sucesso', 'Paciente cadastrado com sucesso!');
            setForm({
                name: '', type: 'dog', breed: '', age: '', weight: '', color: '', sex: '', notes: '',
                tutor_name: '', tutor_phone: '', tutor_email: ''
            });
            onClose();
        } catch (err: any) {
            Alert.alert('Erro ao cadastrar', err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={[styles.content, { backgroundColor: theme.surface }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.text }]}>Novo Paciente</Text>
                        <TouchableOpacity onPress={onClose} disabled={loading}>
                            <Ionicons name="close" size={24} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                        <Text style={[styles.sectionTitle, { color: theme.primary }]}>DADOS DO ANIMAL</Text>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>Nome *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                                value={form.name}
                                onChangeText={v => update('name', v)}
                                placeholder="Ex: Buddy"
                                placeholderTextColor={theme.textMuted}
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>Espécie</Text>
                                <View style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, justifyContent: 'center' }]}>
                                    <Text style={{ color: theme.text }}>{form.type === 'dog' ? '🐶 Canino' : '🐱 Felino'}</Text>
                                    {/* Simplificando para o móvel initially, can add picker later if needed */}
                                </View>
                            </View>
                            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>Sexo</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                                    value={form.sex}
                                    onChangeText={v => update('sex', v)}
                                    placeholder="M/F"
                                    placeholderTextColor={theme.textMuted}
                                />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>Raça</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                                    value={form.breed}
                                    onChangeText={v => update('breed', v)}
                                    placeholder="Ex: Poodle"
                                    placeholderTextColor={theme.textMuted}
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>Peso</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                                    value={form.weight}
                                    onChangeText={v => update('weight', v)}
                                    placeholder="Ex: 5kg"
                                    placeholderTextColor={theme.textMuted}
                                />
                            </View>
                        </View>

                        <Text style={[styles.sectionTitle, { color: theme.primary, marginTop: 12 }]}>DADOS DO TUTOR</Text>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>Nome do Tutor *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                                value={form.tutor_name}
                                onChangeText={v => update('tutor_name', v)}
                                placeholder="Nome Completo"
                                placeholderTextColor={theme.textMuted}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>Telefone</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                                value={form.tutor_phone}
                                onChangeText={v => update('tutor_phone', v)}
                                placeholder="(11) 99999-9999"
                                placeholderTextColor={theme.textMuted}
                                keyboardType="phone-pad"
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.saveButton, { backgroundColor: theme.primary }]}
                            onPress={handleSave}
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Cadastrar Paciente</Text>}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    content: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, height: '90%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    title: { fontSize: 20, fontWeight: '800' },
    scroll: { paddingBottom: 40 },
    sectionTitle: { fontSize: 13, fontWeight: '700', marginBottom: 16, letterSpacing: 1 },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginLeft: 4 },
    input: { height: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, fontSize: 16 },
    row: { flexDirection: 'row' },
    saveButton: { height: 54, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 12 },
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
