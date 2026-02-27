import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { Colors } from '@/constants/theme';

// ─── Tipos ───────────────────────────────────────────────────────────────────
interface Pet {
  id: string;
  name: string;
  type: string;
  breed: string | null;
  age: string | null;
  weight: string | null;
  notes: string | null;
}

// ─── Emoji por espécie ────────────────────────────────────────────────────────
const PET_EMOJIS: Record<string, string> = {
  dog: '🐶',
  cat: '🐱',
  bird: '🐦',
  rabbit: '🐰',
  fish: '🐟',
  reptile: '🦎',
  other: '🐾',
};

const PET_LABELS: Record<string, string> = {
  dog: 'Cachorro',
  cat: 'Gato',
  bird: 'Pássaro',
  rabbit: 'Coelho',
  fish: 'Peixe',
  reptile: 'Réptil',
  other: 'Outro',
};

// ─── Componente PetCard ───────────────────────────────────────────────────────
function PetCard({
  pet,
  onSchedule,
  theme,
}: {
  pet: Pet;
  onSchedule: () => void;
  theme: typeof Colors.light;
}) {
  const emoji = PET_EMOJIS[pet.type] ?? '🐾';
  const label = PET_LABELS[pet.type] ?? pet.type;

  return (
    <View style={[styles.petCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {/* Avatar */}
      <View style={[styles.petAvatar, { backgroundColor: theme.primaryLight }]}>
        <Text style={styles.petEmoji}>{emoji}</Text>
      </View>

      {/* Infos */}
      <View style={styles.petInfo}>
        <Text style={[styles.petName, { color: theme.text }]}>{pet.name}</Text>
        <Text style={[styles.petBreed, { color: theme.textSecondary }]}>
          {label}{pet.breed ? ` · ${pet.breed}` : ''}
        </Text>
        <View style={styles.petMeta}>
          {pet.age && (
            <View style={[styles.metaChip, { backgroundColor: theme.background }]}>
              <Ionicons name="time-outline" size={11} color={theme.textMuted} />
              <Text style={[styles.metaText, { color: theme.textMuted }]}>{pet.age}</Text>
            </View>
          )}
          {pet.weight && (
            <View style={[styles.metaChip, { backgroundColor: theme.background }]}>
              <Ionicons name="scale-outline" size={11} color={theme.textMuted} />
              <Text style={[styles.metaText, { color: theme.textMuted }]}>{pet.weight} kg</Text>
            </View>
          )}
        </View>
      </View>

      {/* Ação */}
      <TouchableOpacity
        style={[styles.scheduleBtn, { backgroundColor: theme.primary }]}
        onPress={onSchedule}
        activeOpacity={0.8}
      >
        <Ionicons name="calendar-outline" size={14} color="#fff" />
        <Text style={styles.scheduleBtnText}>Agendar</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Modal: Adicionar Pet ─────────────────────────────────────────────────────
function AddPetModal({
  visible,
  onClose,
  onAdded,
  userId,
  theme,
}: {
  visible: boolean;
  onClose: () => void;
  onAdded: (pet: Pet) => void;
  userId: string;
  theme: typeof Colors.light;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState('dog');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const PET_TYPES = [
    { value: 'dog', label: '🐶 Cachorro' },
    { value: 'cat', label: '🐱 Gato' },
    { value: 'bird', label: '🐦 Pássaro' },
    { value: 'rabbit', label: '🐰 Coelho' },
    { value: 'fish', label: '🐟 Peixe' },
    { value: 'reptile', label: '🦎 Réptil' },
    { value: 'other', label: '🐾 Outro' },
  ];

  const reset = () => {
    setName(''); setType('dog'); setBreed('');
    setAge(''); setWeight(''); setNotes('');
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Campo obrigatório', 'Por favor, informe o nome do pet.');
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from('pets')
      .insert({
        user_id: userId,
        name: name.trim(),
        type,
        breed: breed.trim() || null,
        age: age.trim() || null,
        weight: weight.trim() || null,
        notes: notes.trim() || null,
      })
      .select()
      .single();

    setSaving(false);
    if (error) {
      Alert.alert('Erro', 'Não foi possível cadastrar o pet: ' + error.message);
      return;
    }
    onAdded(data as Pet);
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => { reset(); onClose(); }} style={styles.modalCloseBtn}>
            <Ionicons name="close" size={24} color={theme.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: theme.text }]}>Adicionar Pet</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={[styles.modalSaveBtn, { backgroundColor: theme.primary, opacity: saving ? 0.6 : 1 }]}
          >
            {saving
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.modalSaveBtnText}>Salvar</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
          {/* Nome */}
          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Nome do Pet *</Text>
          <TextInput
            style={[styles.fieldInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
            placeholder="Ex: Thor"
            placeholderTextColor={theme.textMuted}
            value={name}
            onChangeText={setName}
          />

          {/* Espécie */}
          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Espécie</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeRow}>
            {PET_TYPES.map((t) => (
              <TouchableOpacity
                key={t.value}
                style={[
                  styles.typeChip,
                  {
                    backgroundColor: type === t.value ? theme.primary : theme.surface,
                    borderColor: type === t.value ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setType(t.value)}
              >
                <Text style={[styles.typeChipText, { color: type === t.value ? '#fff' : theme.text }]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Raça */}
          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Raça (opcional)</Text>
          <TextInput
            style={[styles.fieldInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
            placeholder="Ex: Labrador"
            placeholderTextColor={theme.textMuted}
            value={breed}
            onChangeText={setBreed}
          />

          {/* Idade / Peso lado a lado */}
          <View style={styles.rowFields}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Idade (opcional)</Text>
              <TextInput
                style={[styles.fieldInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                placeholder="Ex: 3 anos"
                placeholderTextColor={theme.textMuted}
                value={age}
                onChangeText={setAge}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Peso em kg (opcional)</Text>
              <TextInput
                style={[styles.fieldInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                placeholder="Ex: 12.5"
                placeholderTextColor={theme.textMuted}
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          {/* Observações */}
          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Observações (opcional)</Text>
          <TextInput
            style={[styles.fieldInput, styles.fieldTextarea, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
            placeholder="Alergias, comportamento, condições especiais..."
            placeholderTextColor={theme.textMuted}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Modal: Solicitar Agendamento ─────────────────────────────────────────────
function RequestAppointmentModal({
  visible,
  onClose,
  onRequested,
  petId,
  pets,
  userId,
  theme,
}: {
  visible: boolean;
  onClose: () => void;
  onRequested: () => void;
  petId: string | null;
  pets: Pet[];
  userId: string;
  theme: typeof Colors.light;
}) {
  const [selectedPet, setSelectedPet] = useState<string>(petId ?? '');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (petId) setSelectedPet(petId);
  }, [petId]);

  const reset = () => {
    setDate(''); setTime(''); setReason(''); setNotes('');
  };

  const handleSave = async () => {
    if (!selectedPet) { Alert.alert('Selecione um pet'); return; }
    if (!date.trim()) { Alert.alert('Informe a data preferida'); return; }
    if (!reason.trim()) { Alert.alert('Informe o motivo da consulta'); return; }

    setSaving(true);
    const { error } = await supabase.from('appointment_requests').insert({
      user_id: userId,
      pet_id: selectedPet,
      preferred_date: date.trim(),
      preferred_time: time.trim() || null,
      reason: reason.trim(),
      notes: notes.trim() || null,
      status: 'pending',
    });
    setSaving(false);

    if (error) {
      Alert.alert('Erro', 'Não foi possível enviar a solicitação: ' + error.message);
      return;
    }
    Alert.alert('✅ Sucesso!', 'Sua solicitação foi enviada. Aguarde a confirmação da clínica.');
    reset();
    onRequested();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => { reset(); onClose(); }} style={styles.modalCloseBtn}>
            <Ionicons name="close" size={24} color={theme.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: theme.text }]}>Solicitar Consulta</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={[styles.modalSaveBtn, { backgroundColor: theme.primary, opacity: saving ? 0.6 : 1 }]}
          >
            {saving
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.modalSaveBtnText}>Enviar</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
          {/* Seleção do pet */}
          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Pet *</Text>
          {pets.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.petSelectRow,
                {
                  backgroundColor: selectedPet === p.id ? theme.primaryLight : theme.surface,
                  borderColor: selectedPet === p.id ? theme.primary : theme.border,
                },
              ]}
              onPress={() => setSelectedPet(p.id)}
            >
              <Text style={{ fontSize: 20 }}>{PET_EMOJIS[p.type] ?? '🐾'}</Text>
              <Text style={[styles.petSelectName, { color: theme.text }]}>{p.name}</Text>
              {selectedPet === p.id && <Ionicons name="checkmark-circle" size={20} color={theme.primary} />}
            </TouchableOpacity>
          ))}

          {/* Data preferida */}
          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Data preferida * (DD/MM/AAAA)</Text>
          <TextInput
            style={[styles.fieldInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
            placeholder="Ex: 15/03/2026"
            placeholderTextColor={theme.textMuted}
            value={date}
            onChangeText={setDate}
            keyboardType="numbers-and-punctuation"
          />

          {/* Hora */}
          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Hora preferida (opcional)</Text>
          <TextInput
            style={[styles.fieldInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
            placeholder="Ex: 14:30"
            placeholderTextColor={theme.textMuted}
            value={time}
            onChangeText={setTime}
          />

          {/* Motivo */}
          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Motivo da consulta *</Text>
          <TextInput
            style={[styles.fieldInput, styles.fieldTextarea, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
            placeholder="Ex: Vacinação anual, machucado no focinho..."
            placeholderTextColor={theme.textMuted}
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {/* Observações */}
          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Observações adicionais (opcional)</Text>
          <TextInput
            style={[styles.fieldInput, styles.fieldTextarea, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
            placeholder="Informações extras para o veterinário..."
            placeholderTextColor={theme.textMuted}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Tela Principal: Meus Pets ────────────────────────────────────────────────
export default function PetsScreen() {
  const { session } = useAuth();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addPetVisible, setAddPetVisible] = useState(false);
  const [scheduleVisible, setScheduleVisible] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);

  const userId = session?.user?.id;

  const fetchPets = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar pets:', error.message);
    } else {
      setPets(data as Pet[]);
    }
  }, [userId]);

  useEffect(() => {
    fetchPets().finally(() => setLoading(false));
  }, [fetchPets]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPets();
    setRefreshing(false);
  };

  const handlePetAdded = (newPet: Pet) => {
    setPets((prev) => [newPet, ...prev]);
  };

  const openSchedule = (petId: string) => {
    setSelectedPetId(petId);
    setScheduleVisible(true);
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Carregando seus pets...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {/* Saudação */}
        <View style={styles.greetingRow}>
          <Text style={[styles.greetingText, { color: theme.text }]}>
            🐾 Meus Pets
          </Text>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: theme.primary }]}
            onPress={() => setAddPetVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addBtnText}>Adicionar</Text>
          </TouchableOpacity>
        </View>

        {/* Lista de pets ou empty state */}
        {pets.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={styles.emptyEmoji}>🐶</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Nenhum pet cadastrado</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              Cadastre seu pet para solicitar consultas veterinárias!
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: theme.primary }]}
              onPress={() => setAddPetVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle-outline" size={18} color="#fff" />
              <Text style={styles.emptyBtnText}>Cadastrar meu primeiro pet</Text>
            </TouchableOpacity>
          </View>
        ) : (
          pets.map((pet) => (
            <PetCard
              key={pet.id}
              pet={pet}
              onSchedule={() => openSchedule(pet.id)}
              theme={theme}
            />
          ))
        )}
      </ScrollView>

      {/* Modais */}
      {userId && (
        <>
          <AddPetModal
            visible={addPetVisible}
            onClose={() => setAddPetVisible(false)}
            onAdded={handlePetAdded}
            userId={userId}
            theme={theme}
          />
          <RequestAppointmentModal
            visible={scheduleVisible}
            onClose={() => setScheduleVisible(false)}
            onRequested={() => { }}
            petId={selectedPetId}
            pets={pets}
            userId={userId}
            theme={theme}
          />
        </>
      )}
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14 },
  scrollContent: { padding: 16, paddingBottom: 32 },

  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  greetingText: { fontSize: 20, fontWeight: '700' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  // Pet Card
  petCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  petAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petEmoji: { fontSize: 28 },
  petInfo: { flex: 1 },
  petName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  petBreed: { fontSize: 13, marginBottom: 6 },
  petMeta: { flexDirection: 'row', gap: 6 },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  metaText: { fontSize: 11 },
  scheduleBtn: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 64,
  },
  scheduleBtnText: { color: '#fff', fontSize: 11, fontWeight: '600' },

  // Empty state
  emptyCard: {
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    padding: 32,
    alignItems: 'center',
    marginTop: 8,
  },
  emptyEmoji: { fontSize: 52, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Modal
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalCloseBtn: { padding: 4 },
  modalTitle: { fontSize: 17, fontWeight: '700' },
  modalSaveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 64,
    alignItems: 'center',
  },
  modalSaveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  modalBody: { padding: 16, paddingBottom: 40 },

  // Formulário
  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  fieldTextarea: { minHeight: 80, paddingTop: 12 },
  typeRow: { marginBottom: 4 },
  typeChip: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  typeChipText: { fontSize: 14, fontWeight: '600' },
  rowFields: { flexDirection: 'row' },

  // Pet selection (modal agendamento)
  petSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  petSelectName: { flex: 1, fontSize: 15, fontWeight: '600' },
});
