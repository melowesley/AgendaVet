import React, { useState } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Image
} from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { usePets } from '@/hooks/usePets';
import { usePetTimeline, getModuleLabel } from '@/hooks/usePetTimeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export default function ProntuarioScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
    const { pets, loading: petsLoading } = usePets();
    const [selectedPetId, setSelectedPetId] = useState<string | undefined>(undefined);
    
    const { timeline, loading: timelineLoading, refresh } = usePetTimeline(selectedPetId);

    const selectedPet = pets.find(p => p.id === selectedPetId);

    if (petsLoading && !selectedPetId) {
        return (
            <View className="flex-1 items-center justify-center bg-background">
                <ActivityIndicator color={theme.primary} />
            </View>
        );
    }

    return (
        <ScrollView 
            className="flex-1 bg-background"
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={<RefreshControl refreshing={timelineLoading} onRefresh={refresh} tintColor={theme.primary} />}
        >
            {/* Header Mirroring Web */}
            <View className="px-6 pt-16 pb-6">
                <Text className="text-sm font-bold text-emerald-500 uppercase tracking-widest">Prontuários</Text>
                <Text className="text-3xl font-bold text-foreground mt-1">Histórico Clínico</Text>
                <Text className="text-muted-foreground mt-1">Visualize e gerencie a saúde dos pacientes.</Text>
            </View>

            {/* Patient Selector (Horizontal List) */}
            <View className="mb-6">
                <Text className="px-6 mb-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Selecionar Paciente</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}>
                    {pets.map((pet) => (
                        <TouchableOpacity
                            key={pet.id}
                            onPress={() => setSelectedPetId(pet.id)}
                            className={cn(
                                "items-center p-3 rounded-2xl border transition-all",
                                selectedPetId === pet.id 
                                    ? "bg-emerald-500/10 border-emerald-500" 
                                    : "bg-card/40 border-border/50"
                            )}
                        >
                            <View className={cn(
                                "w-12 h-12 rounded-full items-center justify-center mb-2",
                                selectedPetId === pet.id ? "bg-emerald-500/20" : "bg-muted"
                            )}>
                                <Ionicons name="paw" size={20} color={selectedPetId === pet.id ? theme.primary : theme.textSecondary} />
                            </View>
                            <Text className={cn(
                                "text-xs font-bold",
                                selectedPetId === pet.id ? "text-emerald-500" : "text-foreground"
                            )}>
                                {pet.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {selectedPet ? (
                <View className="px-6 space-y-6">
                    {/* Patient Summary Card */}
                    <Card className="bg-emerald-500/5 border-emerald-500/20">
                        <CardContent className="p-4 flex-row items-center gap-4">
                            <View className="w-16 h-16 rounded-full bg-emerald-100 items-center justify-center border-2 border-emerald-500">
                                <Ionicons name="paw" size={32} color={Colors.light.primary} />
                            </View>
                            <View className="flex-1">
                                <Text className="text-xl font-bold text-foreground">{selectedPet.name}</Text>
                                <Text className="text-sm text-muted-foreground">{selectedPet.breed || 'SRD'} • {selectedPet.type}</Text>
                                <View className="flex-row gap-4 mt-2">
                                    <View>
                                        <Text className="text-[10px] text-muted-foreground uppercase font-bold">Peso</Text>
                                        <Text className="text-xs font-bold text-foreground">{selectedPet.weight || 'N/D'} kg</Text>
                                    </View>
                                    <View>
                                        <Text className="text-[10px] text-muted-foreground uppercase font-bold">Idade</Text>
                                        <Text className="text-xs font-bold text-foreground">{selectedPet.age || 'N/D'}</Text>
                                    </View>
                                </View>
                            </View>
                        </CardContent>
                    </Card>

                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-lg font-bold text-foreground">Timeline Médica</Text>
                        <Button label="Novo Registro" size="sm" leftIcon={<Ionicons name="add" size={16} color="white" />} />
                    </View>

                    {/* Timeline Implementation */}
                    {timelineLoading ? (
                        <ActivityIndicator color={theme.primary} className="py-10" />
                    ) : timeline.length === 0 ? (
                        <View className="py-20 items-center border border-dashed border-border rounded-3xl">
                            <Ionicons name="document-text-outline" size={48} color={theme.textMuted} />
                            <Text className="text-muted-foreground mt-4 font-medium">Nenhum registro para este pet</Text>
                        </View>
                    ) : (
                        <View className="pl-4 border-l-2 border-emerald-500/20 ml-2">
                            {timeline.map((entry, i) => (
                                <View key={entry.id} className="mb-8 relative pl-6">
                                    {/* Timeline Dot */}
                                    <View className="absolute -left-[14px] top-1 w-6 h-6 rounded-full bg-background border-2 border-emerald-500 items-center justify-center z-10 shadow-sm">
                                        <View className="w-2 h-2 rounded-full bg-emerald-500" />
                                    </View>
                                    
                                    <Card>
                                        <CardHeader className="p-4 pb-2 flex-row justify-between items-start">
                                            <View className="flex-1">
                                                <Text className="text-base font-bold text-foreground">{entry.title}</Text>
                                                <View className="flex-row items-center gap-2 mt-1">
                                                    <Text className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
                                                        {entry.date}
                                                    </Text>
                                                    <Text className="text-xs text-muted-foreground">•</Text>
                                                    <Text className="text-xs text-muted-foreground">{entry.veterinarian || 'Equipe Vet'}</Text>
                                                </View>
                                            </View>
                                            <View className="px-2 py-1 bg-muted rounded-md border border-border/50">
                                                <Text className="text-[10px] font-bold text-muted-foreground uppercase">
                                                    {entry.module ? getModuleLabel(entry.module) : 'REGISTRO'}
                                                </Text>
                                            </View>
                                        </CardHeader>
                                        <CardContent className="px-4 pb-4">
                                            <Text className="text-sm text-muted-foreground leading-relaxed">
                                                {entry.description || 'Nenhuma descrição detalhada fornecida para este registro.'}
                                            </Text>
                                            
                                            <TouchableOpacity className="mt-4 pt-3 border-t border-border/30 flex-row items-center gap-2">
                                                <Ionicons name="document-text-outline" size={14} color={theme.primary} />
                                                <Text className="text-xs font-bold text-emerald-500">Ver Detalhes</Text>
                                            </TouchableOpacity>
                                        </CardContent>
                                    </Card>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            ) : (
                <View className="px-6 py-20 items-center opacity-50">
                    <Ionicons name="finger-print-outline" size={64} color={theme.textMuted} />
                    <Text className="text-muted-foreground mt-4 text-center font-medium">Selecione um paciente acima para visualizar seu prontuário detalhado.</Text>
                </View>
            )}
        </ScrollView>
    );
}
