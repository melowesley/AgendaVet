import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, Modal, TextInput, ScrollView, 
    KeyboardAvoidingView, Platform, ActivityIndicator, Dimensions
} from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Brain, Send, X, Bot, User, Sparkles, Stethoscope, Pill, Syringe } from 'lucide-react-native';
import { askVetAI } from '@/lib/ai';
import { cn } from '@/lib/utils';
import * as Haptics from 'expo-haptics';
import { usePets } from '@/hooks/usePets';
import { ChevronDown, PawPrint } from 'lucide-react-native';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const SUGGESTIONS = [
    { label: 'Sintomas', icon: Stethoscope, prompt: 'Quais os riscos para um pet com febre e vômito?' },
    { label: 'Medicamento', icon: Pill, prompt: 'Qual a dosagem comum de Amoxicilina para gatos?' },
    { label: 'Vacinas', icon: Syringe, prompt: 'Esquema vacinal recomendado para filhotes de cães?' },
];

export function AICopilot() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
    const { pets } = usePets();

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
    const [showPetPicker, setShowPetPicker] = useState(false);
    
    const scrollRef = useRef<ScrollView>(null);

    const handleOpen = () => {
        setIsOpen(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (messages.length === 0) {
            setMessages([{
                id: '1',
                role: 'assistant',
                content: 'Olá! Sou seu Assistente Clínico. Como posso ajudar você hoje?',
                timestamp: new Date()
            }]);
        }
    };

    const handleSend = async (textOverride?: string) => {
        const textToSend = textOverride || input;
        if (!textToSend.trim() || isLoading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: textToSend,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);
        Haptics.selectionAsync();

        try {
            const response = await askVetAI(textToSend, { petId: selectedPetId });
            const assistantMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, assistantMsg]);
        } catch (error) {
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Desculpe, tive um problema ao processar sua solicitação.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (scrollRef.current) {
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
        }
    }, [messages, isLoading]);

    return (
        <>
            {/* Floating FAB Mirroring Web Theme */}
            <TouchableOpacity
                onPress={handleOpen}
                className="absolute shadow-2xl shadow-emerald-500/50"
                style={{
                    bottom: 100,
                    right: 20,
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: '#10b981',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 999
                }}
            >
                <Brain color="white" size={28} />
            </TouchableOpacity>

            <Modal
                visible={isOpen}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsOpen(false)}
            >
                <View className="flex-1 justify-end">
                    <TouchableOpacity 
                        className="flex-1 bg-black/40" 
                        onPress={() => setIsOpen(false)} 
                        activeOpacity={1}
                    />
                    
                    <KeyboardAvoidingView 
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        className="bg-card w-full h-[85%] rounded-t-[32px] border-t border-border shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <View className="px-6 py-4 border-b border-border bg-card">
                            <View className="flex-row justify-between items-center mb-3">
                                <View className="flex-row items-center gap-3">
                                    <View className="w-10 h-10 rounded-2xl bg-emerald-500 items-center justify-center">
                                        <Brain color="white" size={20} />
                                    </View>
                                    <View>
                                        <View className="flex-row items-center gap-2">
                                            <Text className="text-lg font-bold text-foreground">Vet Copilot</Text>
                                            <View className="px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                                <Text className="text-[10px] font-bold text-emerald-500">AI PRO</Text>
                                            </View>
                                        </View>
                                        <Text className="text-xs text-muted-foreground flex-row items-center">
                                            <Sparkles size={10} color={theme.primary} /> Conectado ao Cerebro AI
                                        </Text>
                                    </View>
                                </View>
                                <TouchableOpacity onPress={() => setIsOpen(false)} className="bg-muted w-8 h-8 rounded-full items-center justify-center">
                                    <X size={18} color={theme.textMuted} />
                                </TouchableOpacity>
                            </View>

                            {/* Patient Selector Mirroring Web */}
                            <TouchableOpacity 
                                onPress={() => setShowPetPicker(!showPetPicker)}
                                className="flex-row items-center justify-between px-4 py-2 bg-muted/50 rounded-xl border border-border"
                            >
                                <View className="flex-row items-center gap-2">
                                    <PawPrint size={14} color={selectedPetId ? theme.primary : theme.textMuted} />
                                    <Text className={cn(
                                        "text-sm",
                                        selectedPetId ? "text-foreground font-bold" : "text-muted-foreground"
                                    )}>
                                        {selectedPetId 
                                            ? pets.find(p => p.id === selectedPetId)?.name 
                                            : "Selecionar paciente (contexto)..."}
                                    </Text>
                                </View>
                                <ChevronDown size={14} color={theme.textMuted} />
                            </TouchableOpacity>

                            {showPetPicker && (
                                <View className="mt-2 max-h-40 bg-card border border-border rounded-xl overflow-hidden shadow-lg">
                                    <ScrollView nestedScrollEnabled>
                                        <TouchableOpacity 
                                            onPress={() => { setSelectedPetId(null); setShowPetPicker(false); }}
                                            className="p-3 border-b border-border/50"
                                        >
                                            <Text className="text-xs text-muted-foreground italic">Nenhum paciente (geral)</Text>
                                        </TouchableOpacity>
                                        {pets.map((pet) => (
                                            <TouchableOpacity 
                                                key={pet.id}
                                                onPress={() => { setSelectedPetId(pet.id); setShowPetPicker(false); }}
                                                className="p-3 border-b border-border/50 flex-row justify-between items-center"
                                            >
                                                <Text className="text-sm text-foreground font-medium">{pet.name}</Text>
                                                <Text className="text-[10px] text-muted-foreground uppercase">{pet.type}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                        </View>

                        {/* Chat Messages */}
                        <ScrollView 
                            ref={scrollRef}
                            className="flex-1 p-6"
                            contentContainerStyle={{ paddingBottom: 20 }}
                        >
                            {messages.map((msg) => (
                                <View 
                                    key={msg.id} 
                                    className={cn(
                                        "mb-4 flex-row gap-3",
                                        msg.role === 'user' ? "justify-end" : "justify-start"
                                    )}
                                >
                                    {msg.role === 'assistant' && (
                                        <View className="w-8 h-8 rounded-full bg-emerald-500/10 items-center justify-center border border-emerald-500/20">
                                            <Bot size={16} color={theme.primary} />
                                        </View>
                                    )}
                                    <View className={cn(
                                        "max-w-[80%] p-4 rounded-2xl",
                                        msg.role === 'user' 
                                            ? "bg-emerald-500 rounded-tr-none" 
                                            : "bg-muted/50 border border-border/50 rounded-tl-none"
                                    )}>
                                        <Text className={cn(
                                            "text-sm leading-relaxed",
                                            msg.role === 'user' ? "text-white font-medium" : "text-foreground"
                                        )}>
                                            {msg.content}
                                        </Text>
                                    </View>
                                    {msg.role === 'user' && (
                                        <View className="w-8 h-8 rounded-full bg-muted items-center justify-center overflow-hidden border border-border">
                                            <User size={16} color={theme.textMuted} />
                                        </View>
                                    )}
                                </View>
                            ))}
                            {isLoading && (
                                <View className="flex-row gap-3 items-center mb-4">
                                    <View className="w-8 h-8 rounded-full bg-emerald-500/10 items-center justify-center">
                                        <Bot size={16} color={theme.primary} />
                                    </View>
                                    <View className="p-4 bg-muted/50 border border-border rounded-2xl rounded-tl-none flex-row gap-1">
                                        <ActivityIndicator size="small" color={theme.primary} />
                                    </View>
                                </View>
                            )}
                        </ScrollView>

                        {/* Input & Suggestions */}
                        <View className="p-6 border-t border-border bg-card">
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                                {SUGGESTIONS.map((s, i) => (
                                    <TouchableOpacity 
                                        key={i} 
                                        onPress={() => handleSend(s.prompt)}
                                        className="mr-3 px-4 py-2 bg-muted/50 rounded-full border border-border flex-row items-center gap-2"
                                    >
                                        <s.icon size={12} color={theme.primary} />
                                        <Text className="text-xs font-bold text-foreground">{s.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <View className="flex-row items-center gap-3">
                                <TextInput
                                    className="flex-1 bg-muted/50 px-5 h-14 rounded-2xl border border-border text-foreground font-medium"
                                    placeholder="Pergunte sobre sintomas, doses..."
                                    placeholderTextColor="#9ca3af"
                                    value={input}
                                    onChangeText={setInput}
                                    multiline
                                />
                                <TouchableOpacity 
                                    onPress={() => handleSend()}
                                    className={cn(
                                        "w-14 h-14 rounded-2xl items-center justify-center transition-all",
                                        input.trim() ? "bg-emerald-500" : "bg-muted"
                                    )}
                                    disabled={!input.trim() || isLoading}
                                >
                                    <Send size={24} color={input.trim() ? "white" : "#9ca3af"} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </>
    );
}
