import React, { useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, FlatList, ActivityIndicator, Switch, TouchableOpacity, Platform } from 'react-native';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Stack } from 'expo-router';

export default function ServicosScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
    const queryClient = useQueryClient();

    const { data: services, isLoading } = useQuery({
        queryKey: ['admin-services'],
        queryFn: async () => {
            const { data, error } = await supabase.from('services').select('*').order('name');
            if (error) throw error;
            return data || [];
        }
    });

    const toggleMutation = useMutation({
        mutationFn: async ({ id, isActive }: { id: string, isActive: boolean }) => {
            const { error } = await supabase.from('services').update({ is_active: isActive }).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-services'] })
    });

    const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const renderItem = ({ item }: { item: any }) => (
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.primary }]}>
            <View style={styles.info}>
                <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
                <Text style={[styles.price, { color: theme.primary }]}>{formatCurrency(item.price)}</Text>
                <Text style={[styles.duration, { color: theme.textSecondary }]}>Duração: {item.duration} min</Text>
            </View>
            <Switch
                value={item.is_active}
                onValueChange={(val) => toggleMutation.mutate({ id: item.id, isActive: val })}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={Platform.OS === 'android' ? (item.is_active ? theme.primary : '#f4f3f4') : undefined}
            />
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen options={{ title: 'Meus Serviços', headerBackTitle: 'Menu' }} />

            {isLoading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={theme.primary} /></View>
            ) : (
                <FlatList
                    data={services}
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
    list: { padding: 16 },
    card: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
    info: { flex: 1 },
    name: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
    price: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
    duration: { fontSize: 12 }
});
