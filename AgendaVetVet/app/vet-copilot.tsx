/**
 * Vet Copilot - Assistente Clínico IA para o Vet App
 * 
 * Integração mobile do Vet Copilot com:
 * - Seleção de paciente
 * - Chat com streaming
 * - Suggestions contextuais
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePets, Pet } from '@/lib/data-store';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function VetCopilotScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const { petId: initialPetId } = useLocalSearchParams();
  const { pets } = usePets();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState<string>(
    (initialPetId as string) || 'none'
  );
  const flatListRef = useRef<FlatList>(null);

  const selectedPet = pets.find((p: Pet) => p.id === selectedPetId);

  const sendMessage = useCallback(async () => {
    if (!inputText.trim() || isLoading) return;
    if (selectedPetId === 'none') {
      // Mostrar alerta para selecionar pet
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Simular resposta da API (implementação real usaria fetch streaming)
      const response = await fetch('https://agendavet-web.vercel.app/api/chat', {

        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          petId: selectedPetId,
          model: 'gemini-1.5-pro',
          temperature: 0.3,
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch');

      // Ler stream de resposta
      const reader = response.body?.getReader();
      let assistantContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Decodificar e processar chunks
          const chunk = new TextDecoder().decode(value);
          assistantContent += chunk;

          // Atualizar mensagem parcial
          setMessages((prev) => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage?.role === 'assistant') {
              return [
                ...prev.slice(0, -1),
                { ...lastMessage, content: assistantContent },
              ];
            }
            return [
              ...prev,
              {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: assistantContent,
                timestamp: new Date(),
              },
            ];
          });
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Desculpe, ocorreu um erro. Tente novamente.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, isLoading, selectedPetId, messages]);

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageContainer,
        item.role === 'user' ? styles.userMessage : styles.assistantMessage,
        {
          backgroundColor:
            item.role === 'user' ? theme.primary : theme.surface,
        },
      ]}
    >
      <Text
        style={[
          styles.messageText,
          {
            color: item.role === 'user' ? '#fff' : theme.text,
          },
        ]}
      >
        {item.content}
      </Text>
      <Text
        style={[
          styles.timestamp,
          {
            color:
              item.role === 'user'
                ? 'rgba(255,255,255,0.7)'
                : theme.textMuted,
          },
        ]}
      >
        {item.timestamp.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </View>
  );

  const suggestions = [
    'Histórico médico',
    'Status vacinal',
    'Medicações atuais',
    'Calcular dose',
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Vet Copilot
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>
            {selectedPet ? selectedPet.name : 'Selecione um paciente'}
          </Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="medical" size={24} color={theme.primary} />
        </View>
      </View>

      {/* Pet Selector */}
      <View style={[styles.petSelector, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Text style={[styles.petSelectorLabel, { color: theme.textSecondary }]}>
          Paciente:
        </Text>
        <View style={styles.petButtons}>
          {pets.slice(0, 3).map((pet: Pet) => (
            <TouchableOpacity
              key={pet.id}
              style={[
                styles.petButton,
                {
                  backgroundColor:
                    selectedPetId === pet.id
                      ? theme.primary + '20'
                      : theme.background,
                  borderColor:
                    selectedPetId === pet.id ? theme.primary : theme.border,
                },
              ]}
              onPress={() => setSelectedPetId(pet.id)}
            >
              <Text
                style={[
                  styles.petButtonText,
                  {
                    color:
                      selectedPetId === pet.id ? theme.primary : theme.text,
                  },
                ]}
              >
                {pet.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Messages */}
      {messages.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="medical" size={64} color={theme.primary + '40'} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            Vet Copilot
          </Text>
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>
            Selecione um paciente e faça perguntas sobre histórico médico, vacinas, medicações e mais.
          </Text>
          <View style={styles.suggestions}>
            {suggestions.map((suggestion) => (
              <TouchableOpacity
                key={suggestion}
                style={[
                  styles.suggestionButton,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
                onPress={() => {
                  if (selectedPetId !== 'none') {
                    setInputText(suggestion);
                  }
                }}
                disabled={selectedPetId === 'none'}
              >
                <Text
                  style={[
                    styles.suggestionText,
                    {
                      color:
                        selectedPetId === 'none'
                          ? theme.textMuted
                          : theme.text,
                    },
                  ]}
                >
                  {suggestion}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.background,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            value={inputText}
            onChangeText={setInputText}
            placeholder={
              selectedPetId === 'none'
                ? 'Selecione um paciente primeiro...'
                : 'Pergunte sobre o paciente...'
            }
            placeholderTextColor={theme.textMuted}
            multiline
            maxLength={500}
            editable={selectedPetId !== 'none'}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor:
                  inputText.trim() && selectedPetId !== 'none' && !isLoading
                    ? theme.primary
                    : theme.textMuted + '40',
              },
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || selectedPetId === 'none' || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerContent: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  petSelector: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  petSelectorLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  petButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  petButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  petButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  suggestionButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  messagesList: {
    padding: 16,
    gap: 12,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  userMessage: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  assistantMessage: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
