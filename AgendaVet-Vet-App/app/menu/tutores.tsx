import React, { useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, FlatList, ActivityIndicator, TouchableOpacity, Linking, TextInput } from 'react-native';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { Stack } from 'expo-router';

export default function TutoresScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
    const [search, setSearch] = useState('');

    const { data: tutors, isLoading } = useQuery({
        queryKey: ['admin-tutors'],
        queryFn: async () => {
            const { data, error } = await supabase.from('profiles').select('*').order('full_name');
            if (error) throw error;
            return data || [];
        }
    });

    const handleWhatsApp = (phone: string | null) => {
        if (!phone) return;
        const number = phone.replace(/\D/g, '');
        Linking.openURL(`whatsapp://send?phone=55${number}`);
    };

    const filtered = tutors?.filter(t => t.full_name?.toLowerCase().includes(search.toLowerCase()) || '');

    const renderItem = ({ item }: { item: any }) => (
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.primary }]}>
            <View style={[styles.avatar, { backgroundColor: theme.primary + '15', borderColor: theme.primary + '30', borderWidth: 1 }]}>
                <Ionicons name="person" size={24} color={theme.primary} />
            </View>
            <View style={styles.info}>
                <Text style={[styles.name, { color: theme.text }]}>{item.full_name || 'Usuário'}</Text>
                <Text style={[styles.email, { color: theme.textSecondary }]}>{item.email}</Text>
                {item.phone && <Text style={[styles.phone, { color: theme.primary, fontWeight: '700' }]}>{item.phone}</Text>}
            </View>
            {item.phone && (
                <TouchableOpacity style={[styles.whatsapp, { backgroundColor: '#25D36615', borderRadius: 12 }]} onPress={() => handleWhatsApp(item.phone)}>
                    <Ionicons name="logo-whatsapp" size={26} color="#25D366" />
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen options={{ title: 'Tutores e Clientes', headerBackTitle: 'Menu' }} />

            <View style={styles.searchContainer}>
                <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Ionicons name="search" size={20} color={theme.textMuted} style={styles.searchIcon} />
                    <TextInput
                        style={[styles.searchInput, { color: theme.text }]}
                        placeholder="Buscar tutor..."
                        placeholderTextColor={theme.textMuted}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>

            {isLoading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={theme.primary} /></View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={s => s.id}
                    contentContainerStyle={styles.list}
                    renderItem={renderItem}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    searchContainer: { padding: 16 },
    searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 48, borderRadius: 12, borderWidth: 1 },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 16 },
    list: { padding: 16, paddingTop: 0 },
    card: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
    avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    info: { flex: 1 },
    name: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
    email: { fontSize: 13, marginBottom: 4 },
    phone: { fontSize: 12, fontWeight: '600' },
    whatsapp: { padding: 8 }
});
