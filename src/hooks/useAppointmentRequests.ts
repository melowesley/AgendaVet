import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getResourceCache, setResourceCache } from '@/lib/local-first/state';
import { isNetworkOnline } from '@/lib/local-first/sync';

export interface AppointmentRequest {
  id: string;
  reason: string;
  preferred_date: string;
  preferred_time: string;
  status: string;
  notes: string | null;
  admin_notes: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  veterinarian: string | null;
  created_at: string;
  service_id: string | null;
  user_id: string;
  pet: {
    id: string;
    name: string;
    type: string;
    breed: string | null;
  };
  profile: {
    full_name: string | null;
    phone: string | null;
  };
}

async function fetchAppointmentRequests(): Promise<AppointmentRequest[]> {
  const cacheKey = 'admin:appointment-requests';
  const cached = await getResourceCache<AppointmentRequest[]>(cacheKey);

  if (!isNetworkOnline() && cached) {
    return cached.data;
  }

  try {
    const { data, error } = await supabase
      .from('appointment_requests')
      .select(`
        *,
        pet:pets(id, name, type, breed)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const typedData = (data || []) as { user_id: string }[];
    const userIds = [...new Set(typedData.map((r) => r.user_id))];

    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, phone')
      .in('user_id', userIds);

    type ProfileRow = { user_id: string; full_name: string | null; phone: string | null };
    const profileMap = new Map<string, { full_name: string | null; phone: string | null }>(
      ((profiles || []) as ProfileRow[]).map((p) => [p.user_id, { full_name: p.full_name, phone: p.phone }]),
    );

    const result = (data || []).map((r) => ({
      ...(r as AppointmentRequest),
      profile: profileMap.get((r as AppointmentRequest).user_id) || { full_name: null, phone: null },
    }));

    await setResourceCache(cacheKey, result);
    return result;
  } catch (error) {
    if (cached) return cached.data;
    throw error;
  }
}

export const useAppointmentRequests = () => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['appointment-requests'],
    queryFn: fetchAppointmentRequests,
  });

  return {
    requests: data ?? [],
    loading: isLoading,
    refetch,
  };
};
