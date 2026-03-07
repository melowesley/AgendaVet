import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextData {
    session: Session | null;
    loading: boolean;
    isAdmin: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({ session: null, loading: true, isAdmin: false, signOut: async () => { } });

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

    const performSignOut = async () => {
        try {
            await supabase.auth.signOut();
        } catch (e) {
            console.error('[AuthProvider] Erro no signOut do Supabase:', e);
        } finally {
            await AsyncStorage.clear();
            setSession(null);
            setIsAdmin(false);
        }
    };

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) {
                    if (error.message.includes('refresh_token_not_found') || error.message.includes('Invalid Refresh Token')) {
                        await performSignOut();
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
                await performSignOut(); // Força limpeza do cache se falhar a inicialização
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_OUT') {
                await performSignOut();
                return;
            }

            setSession(session);
            if (session?.user) {
                const admin = await checkAdminRole(session.user.id);
                setIsAdmin(admin);
            } else {
                setIsAdmin(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ session, loading, isAdmin, signOut: performSignOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
