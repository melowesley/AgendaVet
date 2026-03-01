import React, { useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { usePets, Pet } from '@/hooks/usePets';
import { AddPatientModal } from '@/components/AddPatientModal';

export default function PacientesScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
    const { pets, loading, refresh, addPet } = usePets();
    const [modalVisible, setModalVisible] = useState(false);

    const renderPet = ({ item }: { item: Pet }) => (
        <View style={[styles.petCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.iconContainer, { backgroundColor: theme.primary + '15' }]}>
                <Ionicons
                    name={item.type === 'cat' ? 'logo-octocat' : 'paw'}
                    size={24}
                    color={theme.primary}
                />
            </View>
            <View style={styles.petInfo}>
                <Text style={[styles.petName, { color: theme.text }]}>{item.name}</Text>
                <Text style={[styles.petBreed, { color: theme.textSecondary }]}>
                    {item.breed || 'Raça não informada'} • {item.age || 'Idade n/i'}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <FlatList
                data={pets}
                keyExtractor={item => item.id}
                renderItem={renderPet}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={loading && pets.length > 0} onRefresh={refresh} tintColor={theme.primary} />
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="search-outline" size={48} color={theme.textMuted} />
                            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Nenhum paciente encontrado</Text>
                        </View>
                    ) : (
                        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
                    )
                }
            />

            <TouchableOpacity
                style={[styles.fab, { backgroundColor: theme.primary }]}
                onPress={() => setModalVisible(true)}
            >
                <Ionicons name="add" size={32} color="#fff" />
            </TouchableOpacity>

            <AddPatientModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSave={addPet}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    listContent: { padding: 16, paddingBottom: 100 },
    petCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    petInfo: { flex: 1 },
    petName: { fontSize: 17, fontWeight: '700', marginBottom: 2 },
    petBreed: { fontSize: 13 },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    emptyText: { marginTop: 12, fontSize: 16, fontWeight: '500' },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
});
