import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, User, Phone, PawPrint } from 'lucide-react';

export interface TutorListItem {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  pet_count: number;
  first_pet_id: string | null;
}

export const TutorsListTab = () => {
  const navigate = useNavigate();
  const [tutors, setTutors] = useState<TutorListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTutors = useCallback(async () => {
    setLoading(true);
    const { data: profiles, error: profError } = await supabase
      .from('profiles')
      .select('user_id, full_name, phone')
      .order('full_name', { ascending: true });

    if (profError || !profiles?.length) {
      setTutors([]);
      setLoading(false);
      return;
    }

    const userIds = profiles.map(p => p.user_id);
    const { data: pets } = await supabase
      .from('pets')
      .select('id, user_id')
      .in('user_id', userIds)
      .order('created_at', { ascending: true });

    const petsByUser = new Map<string, { id: string }[]>();
    (pets || []).forEach(p => {
      const list = petsByUser.get(p.user_id) || [];
      list.push({ id: p.id });
      petsByUser.set(p.user_id, list);
    });

    const list: TutorListItem[] = profiles.map(p => {
      const userPets = petsByUser.get(p.user_id) || [];
      return {
        user_id: p.user_id,
        full_name: p.full_name ?? null,
        phone: p.phone ?? null,
        pet_count: userPets.length,
        first_pet_id: userPets[0]?.id ?? null,
      };
    });

    setTutors(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTutors();
  }, [fetchTutors]);

  const filtered = tutors.filter(t => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (t.full_name && t.full_name.toLowerCase().includes(term)) ||
      (t.phone && t.phone.replace(/\D/g, '').includes(term.replace(/\D/g, '')))
    );
  });

  const handleTutorClick = (t: TutorListItem) => {
    if (t.first_pet_id) {
      navigate(`/admin/pet/${t.first_pet_id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar por nome ou telefone do tutor"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <User className="mx-auto mb-2 text-muted-foreground" size={28} />
            <p className="text-sm text-muted-foreground">
              {searchTerm ? 'Nenhum tutor encontrado para a busca.' : 'Nenhum tutor cadastrado.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(tutor => (
            <Card
              key={tutor.user_id}
              className={`cursor-pointer transition-all hover:shadow-md hover:border-teal-200 ${tutor.first_pet_id ? '' : 'opacity-70'}`}
              onClick={() => tutor.first_pet_id && handleTutorClick(tutor)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                    <User size={20} className="text-slate-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 truncate">
                      {tutor.full_name || 'Sem nome'}
                    </p>
                    {tutor.phone && (
                      <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone size={12} />
                        {tutor.phone}
                      </p>
                    )}
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <PawPrint size={12} />
                      {tutor.pet_count} pet{tutor.pet_count !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                {tutor.first_pet_id && (
                  <p className="text-xs text-teal-600 mt-2">Clique para ver dados do tutor</p>
                )}
                {!tutor.first_pet_id && (
                  <p className="text-xs text-muted-foreground mt-2">Sem pets cadastrados</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
