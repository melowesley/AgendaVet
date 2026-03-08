import { supabase } from '@/lib/supabase';

export interface LogPetAdminHistoryInput {
    petId: string;
    module: string;
    action: string;
    title: string;
    details?: Record<string, unknown> | null;
    sourceTable?: string | null;
    sourceId?: string | null;
}

const cleanDetails = (details?: Record<string, unknown> | null): any => {
    if (!details) return {};
    return Object.fromEntries(
        Object.entries(details).filter(([, v]) => v !== undefined && v !== null && v !== '')
    );
};

export const logPetAdminHistory = async ({
    petId,
    module,
    action,
    title,
    details,
    sourceTable,
    sourceId,
}: LogPetAdminHistoryInput): Promise<boolean> => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (!userId) {
        console.warn('[petAdminHistory] Usuário não autenticado — log ignorado.');
        return false;
    }

    const triggerModules = [
        'peso', 'vacina', 'exame', 'receita', 'patologia', 'documento',
        'internacao', 'observacao', 'video', 'foto', 'obito'
    ];

    if (triggerModules.includes(module) && action !== 'delete') {
        console.log(`[petAdminHistory] Log ignorado no Vet App pois o módulo '${module}' já possui trigger nativo no Supabase.`);
        return true;
    }

    const { error } = await supabase.from('pet_admin_history').insert({
        pet_id: petId,
        user_id: userId,
        module,
        action,
        title,
        details: cleanDetails(details),
        source_table: sourceTable ?? null,
        source_id: sourceId ?? null,
    });

    if (error) {
        console.error(
            `[petAdminHistory] Erro ao registrar histórico (module=${module}, action=${action}):`,
            error.message
        );
        return false;
    }

    return true;
};
