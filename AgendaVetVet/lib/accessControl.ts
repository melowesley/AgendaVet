import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

export type UserRole = 'tutor' | 'veterinario' | 'admin' | 'super_admin';

export interface UserPermissions {
  canViewPets: boolean;
  canEditPets: boolean;
  canViewAppointments: boolean;
  canCreateAppointments: boolean;
  canEditAppointments: boolean;
  canViewMedicalRecords: boolean;
  canCreateMedicalRecords: boolean;
  canEditMedicalRecords: boolean;
  canViewFinancial: boolean;
  canEditFinancial: boolean;
  canManageUsers: boolean;
  canAccessAdminPanel: boolean;
  canUseAI: boolean;
}

export class AccessControl {
  // Verificar role do usuário
  static async getUserRole(userId: string): Promise<UserRole | null> {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return null;
      }

      return data.role as UserRole;
    } catch (error) {
      console.error('Erro ao verificar role do usuário:', error);
      return null;
    }
  }

  // Verificar se usuário tem acesso a um pet específico
  static async canAccessPet(userId: string, petId: string): Promise<boolean> {
    try {
      const userRole = await this.getUserRole(userId);

      if (userRole === 'veterinario' || userRole === 'admin' || userRole === 'super_admin') {
        return true; // Veterinários têm acesso a todos os pets
      }

      // Tutores só têm acesso aos próprios pets
      const { data, error } = await supabase
        .from('pets')
        .select('tutor_id')
        .eq('id', petId)
        .single();

      if (error || !data) {
        return false;
      }

      return data.tutor_id === userId;
    } catch (error) {
      console.error('Erro ao verificar acesso ao pet:', error);
      return false;
    }
  }

  // Obter permissões baseadas na role
  static getPermissionsForRole(role: UserRole): UserPermissions {
    switch (role) {
      case 'super_admin':
        return {
          canViewPets: true,
          canEditPets: true,
          canViewAppointments: true,
          canCreateAppointments: true,
          canEditAppointments: true,
          canViewMedicalRecords: true,
          canCreateMedicalRecords: true,
          canEditMedicalRecords: true,
          canViewFinancial: true,
          canEditFinancial: true,
          canManageUsers: true,
          canAccessAdminPanel: true,
          canUseAI: true,
        };

      case 'admin':
        return {
          canViewPets: true,
          canEditPets: true,
          canViewAppointments: true,
          canCreateAppointments: true,
          canEditAppointments: true,
          canViewMedicalRecords: true,
          canCreateMedicalRecords: true,
          canEditMedicalRecords: true,
          canViewFinancial: true,
          canEditFinancial: true,
          canManageUsers: false, // Admins não gerenciam usuários
          canAccessAdminPanel: true,
          canUseAI: true,
        };

      case 'veterinario':
        return {
          canViewPets: true,
          canEditPets: false, // Vets não editam dados básicos dos pets
          canViewAppointments: true,
          canCreateAppointments: true,
          canEditAppointments: true,
          canViewMedicalRecords: true,
          canCreateMedicalRecords: true,
          canEditMedicalRecords: true,
          canViewFinancial: false, // Vets não veem financeiro
          canEditFinancial: false,
          canManageUsers: false,
          canAccessAdminPanel: false,
          canUseAI: true,
        };

      case 'tutor':
      default:
        return {
          canViewPets: true,
          canEditPets: false, // Tutores só veem, não editam dados médicos
          canViewAppointments: true,
          canCreateAppointments: true, // Podem solicitar agendamentos
          canEditAppointments: false, // Não editam agendamentos existentes
          canViewMedicalRecords: true, // Podem ver histórico médico
          canCreateMedicalRecords: false, // Não criam registros médicos
          canEditMedicalRecords: false,
          canViewFinancial: false,
          canEditFinancial: false,
          canManageUsers: false,
          canAccessAdminPanel: false,
          canUseAI: false, // Tutores não usam IA diretamente
        };
    }
  }

  // Verificar se usuário tem uma permissão específica
  static async hasPermission(
    userId: string,
    permission: keyof UserPermissions
  ): Promise<boolean> {
    try {
      const role = await this.getUserRole(userId);

      if (!role) {
        return false;
      }

      const permissions = this.getPermissionsForRole(role);
      return permissions[permission];
    } catch (error) {
      console.error('Erro ao verificar permissão:', error);
      return false;
    }
  }

  // Middleware para verificar acesso antes de executar ações
  static async requirePermission(
    userId: string,
    permission: keyof UserPermissions,
    action?: () => Promise<any>
  ): Promise<{ allowed: boolean; result?: any; error?: string }> {
    try {
      const hasPermission = await this.hasPermission(userId, permission);

      if (!hasPermission) {
        return {
          allowed: false,
          error: `Permissão insuficiente: ${permission}`
        };
      }

      if (action) {
        const result = await action();
        return { allowed: true, result };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Erro no middleware de permissão:', error);
      return {
        allowed: false,
        error: 'Erro interno ao verificar permissões'
      };
    }
  }

  // Verificar se app correto está sendo usado
  static shouldUseVetApp(role: UserRole): boolean {
    return role === 'veterinario' || role === 'admin' || role === 'super_admin';
  }

  static shouldUseTutorApp(role: UserRole): boolean {
    return role === 'tutor';
  }
}
