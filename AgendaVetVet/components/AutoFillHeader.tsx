import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { VetProfile, PetData, TutorData } from '@/hooks/useAttendanceAutoFill';

interface Props {
  vetProfile: VetProfile | null;
  petData: PetData | null;
  tutorData: TutorData | null;
  loading: boolean;
  theme: any;
}

const PET_TYPE_MAP: Record<string, string> = {
  dog: 'Cão', cat: 'Gato', bird: 'Ave', fish: 'Peixe',
  rabbit: 'Coelho', hamster: 'Hamster', reptile: 'Réptil',
  horse: 'Cavalo', other: 'Outro',
};

export default function AutoFillHeader({ vetProfile, petData, tutorData, loading, theme }: Props) {
  if (loading) {
    return (
      <View style={[st.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <ActivityIndicator color={theme.primary} />
        <Text style={[st.loadingText, { color: theme.textSecondary }]}>Carregando dados...</Text>
      </View>
    );
  }

  if (!vetProfile && !petData) return null;

  const species = petData?.type
    ? PET_TYPE_MAP[petData.type.toLowerCase()] || petData.type
    : '';

  return (
    <View style={[st.card, { backgroundColor: theme.primary + '08', borderColor: theme.primary + '30' }]}>
      <View style={st.cardHeader}>
        <Ionicons name="id-card-outline" size={16} color={theme.primary} />
        <Text style={[st.cardTitle, { color: theme.primary }]}>Identificação (auto)</Text>
      </View>

      {vetProfile && (
        <View style={st.row}>
          <Ionicons name="person-outline" size={14} color={theme.textSecondary} />
          <Text style={[st.info, { color: theme.text }]}>
            {vetProfile.full_name}{vetProfile.crmv ? `  •  CRMV ${vetProfile.crmv}` : ''}
          </Text>
        </View>
      )}

      {petData && (
        <View style={st.row}>
          <Ionicons name="paw-outline" size={14} color={theme.textSecondary} />
          <Text style={[st.info, { color: theme.text }]}>
            {petData.name}
            {species ? `  •  ${species}` : ''}
            {petData.breed ? `  •  ${petData.breed}` : ''}
            {petData.age ? `  •  ${petData.age}` : ''}
            {petData.weight ? `  •  ${petData.weight} kg` : ''}
          </Text>
        </View>
      )}

      {tutorData && (
        <View style={st.row}>
          <Ionicons name="people-outline" size={14} color={theme.textSecondary} />
          <Text style={[st.info, { color: theme.text }]}>
            {tutorData.full_name}{tutorData.phone ? `  •  ${tutorData.phone}` : ''}
          </Text>
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  card: {
    borderRadius: 16, borderWidth: 1, padding: 12, gap: 6,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4,
  },
  cardTitle: {
    fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  info: {
    fontSize: 13, fontWeight: '500', flex: 1,
  },
  loadingText: {
    fontSize: 13, textAlign: 'center', marginTop: 4,
  },
});
