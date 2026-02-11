import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

export const useAppointmentRequests = () => {
  const [requests, setRequests] = useState<AppointmentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('appointment_requests')
      .select(`
        *,
        pet:pets(id, name, type, breed)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching requests:', error);
      setLoading(false);
      return;
    }

    // Fetch profiles for each unique user_id
    type RequestRow = { user_id: string };
    const typedData = (data || []) as RequestRow[];
    const userIds = [...new Set(typedData.map((r) => r.user_id))];

    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, phone')
      .in('user_id', userIds);

    type ProfileRow = { user_id: string; full_name: string | null; phone: string | null };
    const profileMap = new Map<string, { full_name: string | null; phone: string | null }>(
      ((profiles || []) as ProfileRow[]).map((p) => [p.user_id, { full_name: p.full_name, phone: p.phone }]),
    );

    const enriched = (data || []).map((r) => ({
      ...(r as AppointmentRequest),
      profile: profileMap.get((r as AppointmentRequest).user_id) || { full_name: null, phone: null },
    }));

    setRequests(enriched);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return { requests, loading, refetch: fetchRequests };
};
