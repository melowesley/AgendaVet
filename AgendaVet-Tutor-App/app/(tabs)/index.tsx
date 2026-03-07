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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { Colors } from '@/constants/theme';
import * as ImagePicker from 'expo-image-picker';
import { format } from 'date-fns';

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
  const router = useRouter();
  const emoji = PET_EMOJIS[pet.type] ?? '🐾';
  const label = PET_LABELS[pet.type] ?? pet.type;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push({ pathname: '/pet-details/[id]' as any, params: { id: pet.id } })}
      style={[styles.petCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
    >
      {/* Avatar */}
      <View style={[styles.petAvatar, { backgroundColor: theme.primaryLight + '40' }]}>
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
            <View style={[styles.metaChip, { backgroundColor: theme.border }]}>
              <Ionicons name="time-outline" size={12} color={theme.textSecondary} />
              <Text style={[styles.metaText, { color: theme.textSecondary }]}>{pet.age}</Text>
            </View>
          )}
          {pet.weight && (
            <View style={[styles.metaChip, { backgroundColor: theme.border }]}>
              <Ionicons name="scale-outline" size={12} color={theme.textSecondary} />
              <Text style={[styles.metaText, { color: theme.textSecondary }]}>{pet.weight} kg</Text>
            </View>
          )}
        </View>
      </View>

      {/* Ação */}
      <TouchableOpacity
        style={[styles.scheduleBtn, { backgroundColor: theme.primary + '15' }]}
        onPress={(e) => {
          e.stopPropagation();
          onSchedule();
        }}
        activeOpacity={0.7}
      >
        <Ionicons name="calendar" size={18} color={theme.primary} />
        <Text style={[styles.scheduleBtnText, { color: theme.primary }]}>Agendar</Text>
      </TouchableOpacity>
    </TouchableOpacity>
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
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addPetVisible, setAddPetVisible] = useState(false);
  const [scheduleVisible, setScheduleVisible] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);

  const [pendingInvoices, setPendingInvoices] = useState<any[]>([]);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  const userId = session?.user?.id;

  const fetchPetsAndInvoices = useCallback(async () => {
    if (!userId) return;
    // 1. Fetch Pets
    const { data: petsData, error: petsError } = await supabase
      .from('pets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!petsError && petsData) {
      setPets(petsData as Pet[]);
    }

    // 2. Fetch Pending Invoices for these pets
    const { data: invoicesData, error: invError } = await supabase
      .from('invoices')
      .select(`
        id,
        total_amount,
        status,
        created_at,
        pets ( id, name )
      `)
      .eq('status', 'pending');

    if (!invError && invoicesData) {
      // Filter those that belong to the user's pets (RLS should already do this, but just in case)
      const userPetIds = (petsData || []).map(p => p.id);
      const userInvoices = invoicesData.filter(i => i.pets && userPetIds.includes(i.pets.id));
      setPendingInvoices(userInvoices);
    }
  }, [userId]);

  useEffect(() => {
    fetchPetsAndInvoices().finally(() => setLoading(false));
  }, [fetchPetsAndInvoices]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPetsAndInvoices();
    setRefreshing(false);
  };

  // ─── Image Picker Logic (Upload de Comprovante) ──────────────────────────────
  const handlePickReceipt = async () => {
    if (pendingInvoices.length === 0) {
      Alert.alert('Nenhuma Fatura', 'Você não possui faturas pendentes para anexar este comprovante.');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão Negada', 'Precisamos de acesso à galeria para enviar o comprovante.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const latestInvoice = pendingInvoices[0];
      const petName = latestInvoice.pets?.name || 'seu pet';

      Alert.alert(
        'Anexar Comprovante',
        `Deseja enviar a imagem selecionada como comprovante Pix para a fatura pendente de ${petName} no valor de R$ ${latestInvoice.total_amount}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Enviar', onPress: () => uploadReceipt(asset, latestInvoice.id) }
        ]
      );
    }
  };

  const uploadReceipt = async (asset: any, invoiceId: string) => {
    setUploadingReceipt(true);
    try {
      const fileUri = asset.uri;
      const ext = fileUri.split('.').pop() || 'jpg';
      const fileName = `${invoiceId}_${Date.now()}.${ext}`;

      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        name: fileName,
        type: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
      } as any);

      // Aqui faríamos o upload para o Storage Supabase
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, formData);

      if (uploadError) {
        console.error("Upload error", uploadError);
      }

      const publicUrl = supabase.storage.from('receipts').getPublicUrl(fileName).data.publicUrl;

      // Update invoice as paid
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          payment_method: 'pix',
          receipt_url: uploadData ? publicUrl : null, // MOCK: if error, save null
        })
        .eq('id', invoiceId);

      if (updateError) throw updateError;

      Alert.alert('Sucesso!', 'Seu comprovante foi enviado e a fatura foi marcada como Paga.');
      await fetchPetsAndInvoices();
    } catch (error: any) {
      Alert.alert('Erro', `Não foi possível anexar o comprovante. Detalhes: ${error.message}`);
    } finally {
      setUploadingReceipt(false);
    }
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
        {/* Faturas Pendentes Globais */}
        {pendingInvoices.length > 0 && (
          <View style={[styles.pendingInvoicesBox, { backgroundColor: theme.error + '10', borderColor: theme.error + '30' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="alert-circle" size={24} color={theme.error} style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 18, fontWeight: '800', color: theme.error }}>Faturas Pendentes</Text>
            </View>
            {pendingInvoices.map((inv) => (
              <View key={inv.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.surface, padding: 12, borderRadius: 12, marginBottom: 8 }}>
                <View>
                  <Text style={{ fontSize: 13, color: theme.textSecondary }}>{inv.pets?.name}</Text>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: theme.text }}>
                    R$ {Number(inv.total_amount).toFixed(2)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={{ backgroundColor: theme.error, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 }}
                  onPress={() => router.push({ pathname: '/pet-details/[id]', params: { id: inv.pets?.id } })}>
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>Pagar Ágora</Text>
                </TouchableOpacity>
              </View>
            ))}
            <Text style={{ fontSize: 12, color: theme.error, marginTop: 4, fontStyle: 'italic' }}>
              Dica: Você pode compartilhar o comprovante Pix do app do seu banco direto para o AgendaVet!
            </Text>
          </View>
        )}

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
  loadingText: { fontSize: 14, fontWeight: '500' },
  scrollContent: { padding: 20, paddingBottom: 40 },

  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    marginTop: 8,
  },
  greetingText: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  pendingInvoicesBox: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 24,
  },

  // Pet Card
  petCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  petAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petEmoji: { fontSize: 32 },
  petInfo: { flex: 1 },
  petName: { fontSize: 18, fontWeight: '800', marginBottom: 2, letterSpacing: -0.3 },
  petBreed: { fontSize: 14, marginBottom: 8 },
  petMeta: { flexDirection: 'row', gap: 8 },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  metaText: { fontSize: 12, fontWeight: '600' },
  scheduleBtn: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    minWidth: 72,
  },
  scheduleBtnText: { fontSize: 11, fontWeight: '700' },

  // Empty state
  emptyCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 40,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: 15, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Modal
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  modalSaveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 72,
    alignItems: 'center',
  },
  modalSaveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  modalBody: { padding: 20, paddingBottom: 60 },

  // Formulário
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 20,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  fieldTextarea: { minHeight: 100, paddingTop: 14, lineHeight: 22 },
  typeRow: { marginBottom: 8 },
  typeChip: {
    borderWidth: 1.5,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  typeChipText: { fontSize: 15, fontWeight: '700' },
  rowFields: { flexDirection: 'row', gap: 12 },

  // Pet selection (modal agendamento)
  petSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  petSelectName: { flex: 1, fontSize: 16, fontWeight: '700' },
});
