import React, { useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { usePets, Pet } from '@/hooks/usePets';
import { AddPatientModal } from '@/components/AddPatientModal';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function PacientesScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const theme = Colors[isDark ? 'dark' : 'light'];
    const router = useRouter();
    const { pets, loading, refresh, addPet } = usePets();
    const [modalVisible, setModalVisible] = useState(false);

    const renderPet = ({ item }: { item: Pet }) => (
        <Card className="mb-4 border-l-4" style={{ borderLeftColor: theme.primary }}>
            <TouchableOpacity
                className="p-4 flex-row items-center"
                activeOpacity={0.7}
                onPress={() => router.push({ pathname: '/pet/[id]', params: { id: item.id } })}
            >
                <View className="w-12 h-12 rounded-full items-center justify-center bg-primary/10 mr-4">
                    <Ionicons
                        name={item.type === 'cat' ? 'logo-octocat' : 'paw'}
                        size={22}
                        color={theme.primary}
                    />
                </View>
                <View className="flex-1">
                    <Text className="text-base font-black text-foreground">{item.name}</Text>
                    <Text className="text-xs text-muted-foreground font-medium uppercase tracking-tight">
                        {item.breed || 'Raça não informada'} • {item.age || 'Idade n/i'}
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </TouchableOpacity>
        </Card>
    );

    return (
        <View className="flex-1" style={{ backgroundColor: theme.background }}>
            <View className="px-5 pt-14 pb-4 flex-row justify-between items-center">
                <View>
                    <Text className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
                        Gestão de Clientes
                    </Text>
                    <Text className="text-2xl font-black text-foreground tracking-tight">Pacientes</Text>
                </View>
                <View className="bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
                    <Text className="text-[10px] font-extrabold text-primary uppercase">
                        {pets.length} totais
                    </Text>
                </View>
            </View>

            <FlatList
                data={pets}
                keyExtractor={item => item.id}
                renderItem={renderPet}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl refreshing={loading && pets.length > 0} onRefresh={refresh} tintColor={theme.primary} />
                }
                ListEmptyComponent={
                    !loading ? (
                        <View className="items-center py-20 bg-card/40 rounded-3xl border border-dashed border-border/60 mx-4">
                            <Ionicons name="search-outline" size={48} color={theme.textMuted} />
                            <Text className="text-muted-foreground mt-4 font-medium">Nenhum paciente encontrado</Text>
                        </View>
                    ) : (
                        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
                    )
                }
            />

            <View className="absolute bottom-6 right-6">
                <Button
                    size="icon"
                    className="w-16 h-16 rounded-full shadow-lg shadow-primary/40"
                    onPress={() => setModalVisible(true)}
                    leftIcon={<Ionicons name="add" size={32} color="white" />}
                />
            </View>

            <AddPatientModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSave={addPet}
            />
        </View>
    );
}
