import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { PdfData } from '@/utils/pdfTemplate';

export interface VetProfile {
  full_name: string;
  crmv: string | null;
  specialty: string | null;
  phone: string | null;
}

export interface PetData {
  id: string;
  name: string;
  type: string;
  breed: string | null;
  age: string | null;
  weight: string | null;
}

export interface TutorData {
  full_name: string | null;
  phone: string | null;
  address: string | null;
}

const PET_TYPE_MAP: Record<string, string> = {
  dog: 'Cão', cat: 'Gato', bird: 'Ave', fish: 'Peixe',
  rabbit: 'Coelho', hamster: 'Hamster', reptile: 'Réptil',
  horse: 'Cavalo', other: 'Outro',
};

function translatePetType(type: string | null | undefined): string {
  if (!type) return 'Desconhecido';
  return PET_TYPE_MAP[type.toLowerCase()] || type;
}

interface AutoFillResult {
  vetProfile: VetProfile | null;
  petData: PetData | null;
  tutorData: TutorData | null;
  loading: boolean;
  error: string | null;
  buildPdfData: (attendanceType: string, clinicalData: Record<string, unknown>) => PdfData;
}

export function useAttendanceAutoFill(petId?: string, appointmentId?: string): AutoFillResult {
  const [vetProfile, setVetProfile] = useState<VetProfile | null>(null);
  const [petData, setPetData] = useState<PetData | null>(null);
  const [tutorData, setTutorData] = useState<TutorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) { setError('Usuário não autenticado'); return; }

        const vetPromise = supabase
          .from('profiles')
          .select('full_name, crmv, specialty, phone')
          .eq('user_id', session.user.id)
          .single();

        if (appointmentId) {
          const apptPromise = supabase
            .from('appointment_requests')
            .select('pet:pets(id, name, type, breed, age, weight), profile:profiles!appointment_requests_user_id_fkey(full_name, phone, address)')
            .eq('id', appointmentId)
            .single();

          const [vetRes, apptRes] = await Promise.all([vetPromise, apptPromise]);
          if (vetRes.data) setVetProfile(vetRes.data as VetProfile);
          if (apptRes.data) {
            setPetData(apptRes.data.pet as unknown as PetData);
            setTutorData(apptRes.data.profile as unknown as TutorData);
          }
        } else if (petId) {
          const petPromise = supabase.from('pets').select('id, name, type, breed, age, weight, user_id').eq('id', petId).single();
          const [vetRes, petRes] = await Promise.all([vetPromise, petPromise]);
          if (vetRes.data) setVetProfile(vetRes.data as VetProfile);
          if (petRes.data) {
            setPetData(petRes.data as PetData);
            if (petRes.data.user_id) {
              const { data: t } = await supabase.from('profiles').select('full_name, phone, address').eq('user_id', petRes.data.user_id).single();
              if (t) setTutorData(t as TutorData);
            }
          }
        } else {
          const vetRes = await vetPromise;
          if (vetRes.data) setVetProfile(vetRes.data as VetProfile);
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [petId, appointmentId]);

  const buildPdfData = (attendanceType: string, clinicalData: Record<string, unknown>): PdfData => ({
    vetName: vetProfile?.full_name || 'N/I',
    crmv: vetProfile?.crmv || 'N/I',
    petName: petData?.name || 'N/I',
    species: translatePetType(petData?.type),
    breed: petData?.breed || 'SRD',
    age: petData?.age || 'N/I',
    weight: petData?.weight || 'N/I',
    tutorName: tutorData?.full_name || 'N/I',
    tutorPhone: tutorData?.phone || 'N/I',
    attendanceType,
    date: new Date().toLocaleDateString('pt-BR'),
    clinicalData,
  });

  return { vetProfile, petData, tutorData, loading, error, buildPdfData };
}
