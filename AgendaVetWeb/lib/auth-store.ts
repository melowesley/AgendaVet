import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'

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

let activeUnsubscribe: (() => void) | null = null

export function initializeAuth(): () => void {
    // Prevent duplicate subscriptions on HMR or double-mount
    if (activeUnsubscribe) {
        activeUnsubscribe()
        activeUnsubscribe = null
    }

    let cancelled = false
    let isInitializing = true

    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
        if (cancelled) return
        if (error) {
            console.error('Auth getSession error:', error)
            useAuthStore.setState({ user: null, isAdmin: false, isLoading: false })
            isInitializing = false
            return
        }

        const user = session?.user ?? null
        const isAdmin = user ? await checkAdminRole(user.id) : false
        if (!cancelled) {
            useAuthStore.setState({ user, isAdmin, isLoading: false })
        }
        isInitializing = false
    })

    const {
        data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (cancelled) return
        if (isInitializing && event === 'INITIAL_SESSION') return

        const user = session?.user ?? null

        if (event === 'SIGNED_OUT') {
            useAuthStore.setState({ user: null, isAdmin: false, isLoading: false })
            return
        }

        if (event === 'TOKEN_REFRESHED' && user) {
            // Token refreshed — keep current isAdmin, just update user
            useAuthStore.setState({ user, isLoading: false })
            return
        }

        const isAdmin = user ? await checkAdminRole(user.id) : false
        if (!cancelled) {
            useAuthStore.setState({ user, isAdmin, isLoading: false })
        }
    })

    const cleanup = () => {
        cancelled = true
        subscription.unsubscribe()
        if (activeUnsubscribe === cleanup) activeUnsubscribe = null
    }

    activeUnsubscribe = cleanup
    return cleanup
}
