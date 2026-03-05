import React, { useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { usePets, Pet } from '@/hooks/usePets';
import { useRouter } from 'expo-router';

export default function ProntuarioScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
    const { pets, loading, searchTerm, setSearchTerm, refresh } = usePets();
    const router = useRouter();

    const renderPetItem = ({ item }: { item: Pet }) => (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => router.push(`/pet/${item.id}`)}
        >
            <View style={[styles.avatar, { backgroundColor: theme.primary + '15' }]}>
                <Ionicons name={item.type === 'cat' ? 'logo-octocat' : 'paw'} size={24} color={theme.primary} />
            </View>
            <View style={styles.info}>
                <Text style={[styles.name, { color: theme.text }]}>{item.name.toUpperCase()}</Text>
                <Text style={[styles.owner, { color: theme.textSecondary }]}>
                    Tutor: {item.owner_name || 'Desconhecido'}
                </Text>
                <View style={styles.tags}>
                    {item.hospitalization_status && (
                        <View style={[styles.tag, { backgroundColor: '#FEE2E2' }]}>
                            <Text style={[styles.tagText, { color: '#B91C1C' }]}>INTERNADO</Text>
                        </View>
                    )}
                    <Text style={[styles.breed, { color: theme.textMuted }]}>
                        {item.breed || 'SRD'}
                    </Text>
                </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.searchContainer}>
                <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Ionicons name="search" size={20} color={theme.textMuted} style={styles.searchIcon} />
                    <TextInput
                        style={[styles.searchInput, { color: theme.text }]}
                        placeholder="Buscar paciente ou tutor..."
                        placeholderTextColor={theme.textMuted}
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                    />
                    {searchTerm !== '' && (
                        <TouchableOpacity onPress={() => setSearchTerm('')}>
                            <Ionicons name="close-circle" size={20} color={theme.textMuted} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {loading && pets.length === 0 ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <FlatList
                    data={pets}
                    renderItem={renderPetItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    onRefresh={refresh}
                    refreshing={loading}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="documents-outline" size={64} color={theme.textMuted} />
                            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                                Nenhum prontuário encontrado
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    searchContainer: { padding: 16, paddingBottom: 8 },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
    },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 16 },
    list: { padding: 16, paddingBottom: 100 },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    info: { flex: 1 },
    name: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
    owner: { fontSize: 13, marginBottom: 6 },
    tags: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    tagText: { fontSize: 10, fontWeight: '800' },
    breed: { fontSize: 12 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    empty: { alignItems: 'center', marginTop: 100, gap: 12 },
    emptyText: { fontSize: 16, fontWeight: '500' },
});
