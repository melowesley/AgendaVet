import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextData {
    session: Session | null;
    loading: boolean;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextData>({ session: null, loading: true, isAdmin: false });

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    async function checkAdminRole(userId: string) {
        const { data } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userId)
            .eq('role', 'admin')
            .maybeSingle();
        return !!data;
    }

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) {
                    if (error.message.includes('refresh_token_not_found') || error.message.includes('Invalid Refresh Token')) {
                        await supabase.auth.signOut();
                    }
                    throw error;
                }
                setSession(session);

                if (session?.user) {
                    const admin = await checkAdminRole(session.user.id);
                    setIsAdmin(admin);
                }
            } catch (error) {
                console.error('[AuthProvider] Erro ao inicializar auth:', error);
                setSession(null);
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            setSession(session);
            if (session?.user) {
                const admin = await checkAdminRole(session.user.id);
                setIsAdmin(admin);
            } else {
                setIsAdmin(false);
            }

            if (event === 'SIGNED_OUT') {
                setSession(null);
                setIsAdmin(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ session, loading, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
