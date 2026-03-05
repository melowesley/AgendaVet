import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase/client'

interface AuthState {
    user: User | null
    isAdmin: boolean
    isLoading: boolean
}

export const useAuthStore = create<AuthState>(() => ({
    user: null,
    isAdmin: false,
    isLoading: true,
}))

async function checkAdminRole(userId: string): Promise<boolean> {
    const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle()
    return !!data
}

export function initializeAuth(): () => void {
    let isInitializing = true

    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
        if (error) {
            console.error('Auth getSession error:', error)
            useAuthStore.setState({ user: null, isAdmin: false, isLoading: false })
            isInitializing = false
            return
        }

        const user = session?.user ?? null
        const isAdmin = user ? await checkAdminRole(user.id) : false
        useAuthStore.setState({ user, isAdmin, isLoading: false })
        isInitializing = false
    })

    const {
        data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (isInitializing && event === 'INITIAL_SESSION') return

        const user = session?.user ?? null

        if (event === 'SIGNED_OUT') {
            useAuthStore.setState({ user: null, isAdmin: false, isLoading: false })
            return
        }

        const isAdmin = user ? await checkAdminRole(user.id) : false
        useAuthStore.setState({ user, isAdmin, isLoading: false })
    })

    return () => subscription.unsubscribe()
}
